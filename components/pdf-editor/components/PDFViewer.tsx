import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import type { Annotation, AnnotationType, FormFieldValue, SessionPage } from '../types/pdf';

type FormField = {
  id: string;
  fieldName: string;
  fieldType: string; // 'Tx' | 'Btn' | 'Ch'
  rect: [number, number, number, number];
  fieldValue: string;
  checkBox?: boolean;
  radioButton?: boolean;
  multiLine?: boolean;
  options?: Array<{ displayValue: string; exportValue: string }>;
  maxLen?: number;
};

type PDFViewerProps = {
  pages: SessionPage[];
  documents: Map<number, PDFDocumentProxy>;
  currentPage: number;
  annotationMode: AnnotationType | null;
  annotationColor: string;
  annotationStrokeWidth: number;
  zoom: number;
  onPageChange: (pageIndex: number) => void;
  onCreateAnnotation: (
    pageIndex: number,
    annotation: Omit<Annotation, 'id'>
  ) => void;
  onFormFieldChange?: (pageIndex: number, fieldName: string, value: string | boolean) => void;
};

export type PDFViewerHandle = {
  scrollToPage: (pageIndex: number) => void;
};

const RENDER_BUFFER = 2;

const CLICK_ANNOTATION_TYPES: AnnotationType[] = ['highlight', 'underline', 'strikethrough', 'note', 'stickyNote', 'textBox'];
const DRAG_ANNOTATION_TYPES: AnnotationType[] = ['freehand', 'rectangle', 'ellipse', 'arrow', 'line'];

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(
  (
    { pages, documents, currentPage, annotationMode, annotationColor, annotationStrokeWidth, zoom, onPageChange, onCreateAnnotation, onFormFieldChange },
    ref
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
    const textLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const renderStates = useRef<Map<number, { rendered: boolean; width: number; height: number }>>(new Map());
    const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([0]));
    const isScrollingToPage = useRef(false);
    const pdfPageCache = useRef<Map<string, PDFPageProxy>>(new Map());
    const renderTaskIds = useRef<Map<number, number>>(new Map());
    const formFieldsCache = useRef<Map<number, FormField[]>>(new Map());
    const formLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Drawing state for drag-to-create
    const [drawingState, setDrawingState] = useState<{
      pageIndex: number;
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      points: Array<{ x: number; y: number }>;
    } | null>(null);

    const scrollToPage = useCallback((pageIndex: number) => {
      const el = pageRefs.current.get(pageIndex);
      if (!el || !scrollRef.current) return;
      isScrollingToPage.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isScrollingToPage.current = false;
      }, 600);
    }, []);

    useImperativeHandle(ref, () => ({ scrollToPage }), [scrollToPage]);

    // IntersectionObserver for visibility tracking
    useEffect(() => {
      const container = scrollRef.current;
      if (!container || pages.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          setVisiblePages((prev) => {
            const next = new Set(prev);
            for (const entry of entries) {
              const idx = Number((entry.target as HTMLElement).dataset.pageIndex);
              if (!Number.isNaN(idx)) {
                if (entry.isIntersecting) next.add(idx);
                else next.delete(idx);
              }
            }
            return next;
          });
        },
        { root: container, rootMargin: '300px 0px' }
      );

      for (const [, el] of pageRefs.current) {
        observer.observe(el);
      }

      return () => observer.disconnect();
    }, [pages.length, zoom]);

    // Scroll-based current page detection
    useEffect(() => {
      const container = scrollRef.current;
      if (!container || pages.length === 0) return;

      let ticking = false;
      const onScroll = () => {
        if (isScrollingToPage.current || ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const containerRect = container.getBoundingClientRect();
          const targetY = containerRect.top + containerRect.height / 3;

          let closest = 0;
          let closestDist = Infinity;
          for (const [idx, el] of pageRefs.current) {
            const dist = Math.abs(el.getBoundingClientRect().top - targetY);
            if (dist < closestDist) {
              closestDist = dist;
              closest = idx;
            }
          }
          onPageChange(closest);
        });
      };

      container.addEventListener('scroll', onScroll, { passive: true });
      return () => container.removeEventListener('scroll', onScroll);
    }, [pages.length, onPageChange]);

    // Invalidate renders on zoom change
    useEffect(() => {
      renderStates.current.clear();
      renderTaskIds.current.clear();
    }, [zoom]);

    // Render pages near viewport (canvas + text layer)
    useEffect(() => {
      const toRender = new Set<number>();
      for (const vi of visiblePages) {
        for (let i = vi - RENDER_BUFFER; i <= vi + RENDER_BUFFER; i++) {
          if (i >= 0 && i < pages.length) toRender.add(i);
        }
      }

      for (const [idx, state] of renderStates.current) {
        if (!toRender.has(idx) && state.rendered) {
          const canvas = canvasRefs.current.get(idx);
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
          }
          const textDiv = textLayerRefs.current.get(idx);
          if (textDiv) textDiv.innerHTML = '';
          renderStates.current.set(idx, { ...state, rendered: false });
        }
      }

      for (const idx of toRender) {
        const page = pages[idx];
        if (!page) continue;
        const doc = documents.get(page.sourceFileIndex);
        if (!doc) continue;
        if (renderStates.current.get(idx)?.rendered) continue;

        const taskId = (renderTaskIds.current.get(idx) ?? 0) + 1;
        renderTaskIds.current.set(idx, taskId);

        const cacheKey = `${page.sourceFileIndex}-${page.pageIndex}`;

        const doRender = async () => {
          let pdfPage = pdfPageCache.current.get(cacheKey);
          if (!pdfPage) {
            pdfPage = await doc.getPage(page.pageIndex + 1);
            pdfPageCache.current.set(cacheKey, pdfPage);
          }
          if (renderTaskIds.current.get(idx) !== taskId) return;

          const canvas = canvasRefs.current.get(idx);
          if (!canvas) return;

          const viewport = pdfPage.getViewport({ scale: zoom });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          await pdfPage.render({ canvasContext: ctx, viewport }).promise;

          const textDiv = textLayerRefs.current.get(idx);
          if (textDiv && renderTaskIds.current.get(idx) === taskId) {
            textDiv.innerHTML = '';
            const textContent = await pdfPage.getTextContent();
            if (renderTaskIds.current.get(idx) === taskId) {
              const textLayer = new TextLayer({
                textContentSource: textContent,
                container: textDiv,
                viewport
              });
              await textLayer.render();
            }
          }

          // Detect form fields
          if (!formFieldsCache.current.has(idx)) {
            try {
              const annotations = await pdfPage.getAnnotations();
              const fields: FormField[] = [];
              for (const ann of annotations) {
                if (ann.fieldType === 'Tx' || ann.fieldType === 'Btn' || ann.fieldType === 'Ch') {
                  fields.push({
                    id: ann.id,
                    fieldName: ann.fieldName ?? ann.id,
                    fieldType: ann.fieldType,
                    rect: ann.rect,
                    fieldValue: ann.fieldValue ?? '',
                    checkBox: ann.checkBox,
                    radioButton: ann.radioButton,
                    multiLine: ann.multiLine,
                    options: ann.options,
                    maxLen: ann.maxLen
                  });
                }
              }
              formFieldsCache.current.set(idx, fields);
            } catch {
              formFieldsCache.current.set(idx, []);
            }
          }

          renderStates.current.set(idx, { rendered: true, width: viewport.width, height: viewport.height });
        };

        void doRender();
      }
    }, [visiblePages, pages, documents, zoom]);

    const getPageSize = useCallback(
      (pageIndex: number) => {
        const state = renderStates.current.get(pageIndex);
        if (state && state.width > 0) return { width: state.width, height: state.height };
        return { width: 595 * zoom, height: 842 * zoom };
      },
      [zoom]
    );

    const getRelativePos = (event: React.MouseEvent, target: HTMLElement) => {
      const bounds = target.getBoundingClientRect();
      return {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height
      };
    };

    const handleMouseDown = (event: React.MouseEvent, idx: number) => {
      if (!annotationMode) return;

      if (DRAG_ANNOTATION_TYPES.includes(annotationMode)) {
        const pos = getRelativePos(event, event.currentTarget as HTMLElement);
        setDrawingState({
          pageIndex: idx,
          startX: pos.x,
          startY: pos.y,
          currentX: pos.x,
          currentY: pos.y,
          points: [{ x: pos.x, y: pos.y }]
        });
        event.preventDefault();
      }
    };

    const handleMouseMove = (event: React.MouseEvent) => {
      if (!drawingState) return;
      const el = event.currentTarget as HTMLElement;
      const pos = getRelativePos(event, el);
      setDrawingState((prev) =>
        prev
          ? {
              ...prev,
              currentX: pos.x,
              currentY: pos.y,
              points: annotationMode === 'freehand' ? [...prev.points, { x: pos.x, y: pos.y }] : prev.points
            }
          : null
      );
    };

    const handleMouseUp = () => {
      if (!drawingState || !annotationMode) return;

      const { pageIndex, startX, startY, currentX, currentY, points } = drawingState;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (annotationMode === 'freehand') {
        if (points.length < 2) {
          setDrawingState(null);
          return;
        }
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        onCreateAnnotation(pageIndex, {
          type: 'freehand',
          x: minX,
          y: minY,
          width: maxX - minX || 0.01,
          height: maxY - minY || 0.01,
          points,
          color: annotationColor,
          strokeWidth: annotationStrokeWidth
        });
      } else if (width > 0.005 || height > 0.005) {
        onCreateAnnotation(pageIndex, {
          type: annotationMode,
          x,
          y,
          width: width || 0.01,
          height: height || 0.01,
          color: annotationColor,
          strokeWidth: annotationStrokeWidth
        });
      }

      setDrawingState(null);
    };

    const handleClick = (event: React.MouseEvent, idx: number) => {
      if (!annotationMode) return;
      if (!CLICK_ANNOTATION_TYPES.includes(annotationMode)) return;

      const pos = getRelativePos(event, event.currentTarget as HTMLElement);

      if (annotationMode === 'highlight') {
        onCreateAnnotation(idx, {
          type: 'highlight',
          x: Math.max(0, pos.x - 0.07),
          y: Math.max(0, pos.y - 0.02),
          width: 0.14,
          height: 0.04,
          color: annotationColor,
          opacity: 0.4
        });
      } else if (annotationMode === 'underline') {
        onCreateAnnotation(idx, {
          type: 'underline',
          x: Math.max(0, pos.x - 0.07),
          y: Math.max(0, pos.y),
          width: 0.14,
          height: 0.005,
          color: annotationColor,
          strokeWidth: annotationStrokeWidth
        });
      } else if (annotationMode === 'strikethrough') {
        onCreateAnnotation(idx, {
          type: 'strikethrough',
          x: Math.max(0, pos.x - 0.07),
          y: Math.max(0, pos.y - 0.01),
          width: 0.14,
          height: 0.005,
          color: annotationColor,
          strokeWidth: annotationStrokeWidth
        });
      } else if (annotationMode === 'note' || annotationMode === 'textBox') {
        const text = window.prompt(annotationMode === 'note' ? 'Note text' : 'Text content');
        if (!text) return;
        onCreateAnnotation(idx, {
          type: annotationMode,
          x: Math.max(0, pos.x - 0.02),
          y: Math.max(0, pos.y - 0.02),
          width: 0.18,
          height: 0.06,
          text,
          color: annotationColor,
          fontSize: 12
        });
      } else if (annotationMode === 'stickyNote') {
        const text = window.prompt('Sticky note text');
        if (!text) return;
        onCreateAnnotation(idx, {
          type: 'stickyNote',
          x: pos.x,
          y: pos.y,
          width: 0.03,
          height: 0.04,
          text,
          color: annotationColor
        });
      }
    };

    // Render annotation overlay element
    const renderAnnotation = (annotation: Annotation) => {
      const baseStyle: React.CSSProperties = {
        left: `${annotation.x * 100}%`,
        top: `${annotation.y * 100}%`,
        width: `${annotation.width * 100}%`,
        height: `${annotation.height * 100}%`
      };

      if (annotation.type === 'freehand' && annotation.points && annotation.points.length > 1) {
        const xs = annotation.points.map((p) => p.x);
        const ys = annotation.points.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const w = annotation.width || 0.01;
        const h = annotation.height || 0.01;

        const pathData = annotation.points
          .map((p, i) => {
            const px = ((p.x - minX) / w) * 100;
            const py = ((p.y - minY) / h) * 100;
            return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
          })
          .join(' ');

        return (
          <svg
            key={annotation.id}
            className="annotation annotation-svg"
            style={baseStyle}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d={pathData}
              fill="none"
              stroke={annotation.color ?? '#ff0000'}
              strokeWidth={annotation.strokeWidth ?? 2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        );
      }

      if (annotation.type === 'arrow' || annotation.type === 'line') {
        return (
          <svg
            key={annotation.id}
            className="annotation annotation-svg"
            style={baseStyle}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {annotation.type === 'arrow' && (
              <defs>
                <marker id={`arrow-${annotation.id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={annotation.color ?? '#ff0000'} />
                </marker>
              </defs>
            )}
            <line
              x1="0"
              y1="100"
              x2="100"
              y2="0"
              stroke={annotation.color ?? '#ff0000'}
              strokeWidth={annotation.strokeWidth ?? 2}
              vectorEffect="non-scaling-stroke"
              markerEnd={annotation.type === 'arrow' ? `url(#arrow-${annotation.id})` : undefined}
            />
          </svg>
        );
      }

      if (annotation.type === 'ellipse') {
        return (
          <svg
            key={annotation.id}
            className="annotation annotation-svg"
            style={baseStyle}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <ellipse
              cx="50"
              cy="50"
              rx="49"
              ry="49"
              fill="none"
              stroke={annotation.color ?? '#ff0000'}
              strokeWidth={annotation.strokeWidth ?? 2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        );
      }

      if (annotation.type === 'rectangle') {
        return (
          <div
            key={annotation.id}
            className="annotation annotation-rect"
            style={{
              ...baseStyle,
              borderColor: annotation.color ?? '#ff0000',
              borderWidth: annotation.strokeWidth ?? 2
            }}
          />
        );
      }

      if (annotation.type === 'stickyNote') {
        return (
          <div
            key={annotation.id}
            className="annotation annotation-sticky"
            style={{ ...baseStyle, backgroundColor: annotation.color ?? '#ffee00' }}
            title={annotation.text}
          >
            S
          </div>
        );
      }

      if (annotation.type === 'textBox') {
        return (
          <div
            key={annotation.id}
            className="annotation annotation-textbox"
            style={{ ...baseStyle, color: annotation.color ?? '#000000', fontSize: annotation.fontSize ?? 12 }}
          >
            {annotation.text}
          </div>
        );
      }

      if (annotation.type === 'underline' || annotation.type === 'strikethrough') {
        return (
          <div
            key={annotation.id}
            className={`annotation annotation-${annotation.type}`}
            style={{
              ...baseStyle,
              backgroundColor: annotation.color ?? '#ff0000'
            }}
          />
        );
      }

      // Default: highlight / note
      return (
        <div
          key={annotation.id}
          className={`annotation ${annotation.type}`}
          style={baseStyle}
          title={annotation.text}
        >
          {annotation.type === 'note' ? 'N' : ''}
        </div>
      );
    };

    // Draw preview for current drag operation
    const renderDrawPreview = (pageIndex: number) => {
      if (!drawingState || drawingState.pageIndex !== pageIndex || !annotationMode) return null;

      const { startX, startY, currentX, currentY, points } = drawingState;
      const x = Math.min(startX, currentX) * 100;
      const y = Math.min(startY, currentY) * 100;
      const w = Math.abs(currentX - startX) * 100;
      const h = Math.abs(currentY - startY) * 100;

      if (annotationMode === 'freehand' && points.length > 1) {
        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${p.y * 100}`).join(' ');
        return (
          <svg className="draw-preview-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={pathData} fill="none" stroke={annotationColor} strokeWidth={annotationStrokeWidth} vectorEffect="non-scaling-stroke" />
          </svg>
        );
      }

      if (annotationMode === 'ellipse') {
        return (
          <svg className="draw-preview-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill="none" stroke={annotationColor} strokeWidth={annotationStrokeWidth} vectorEffect="non-scaling-stroke" />
          </svg>
        );
      }

      if (annotationMode === 'line' || annotationMode === 'arrow') {
        return (
          <svg className="draw-preview-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1={startX * 100} y1={startY * 100} x2={currentX * 100} y2={currentY * 100} stroke={annotationColor} strokeWidth={annotationStrokeWidth} vectorEffect="non-scaling-stroke" />
          </svg>
        );
      }

      // Rectangle default
      return (
        <div
          className="draw-preview-rect"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${w}%`,
            height: `${h}%`,
            borderColor: annotationColor
          }}
        />
      );
    };

    // Render form fields for a given page
    const renderFormFields = (idx: number) => {
      const fields = formFieldsCache.current.get(idx);
      if (!fields || fields.length === 0) return null;

      const state = renderStates.current.get(idx);
      if (!state || !state.rendered) return null;

      const page = pages[idx];
      const formValues = page?.formValues ?? [];
      const valueMap = new Map(formValues.map((fv) => [fv.fieldName, fv.value]));

      const cacheKey = `${page.sourceFileIndex}-${page.pageIndex}`;
      const pdfPage = pdfPageCache.current.get(cacheKey);
      if (!pdfPage) return null;

      const viewport = pdfPage.getViewport({ scale: zoom });

      return fields.map((field) => {
        // Convert PDF rect [x1, y1, x2, y2] (bottom-left origin) to CSS position
        const [x1, y1, x2, y2] = field.rect;
        const left = x1 * zoom;
        const bottom = y1 * zoom;
        const right = x2 * zoom;
        const top = y2 * zoom;

        const style: React.CSSProperties = {
          position: 'absolute',
          left: left,
          top: viewport.height - top,
          width: right - left,
          height: top - bottom,
          zIndex: 2
        };

        const savedValue = valueMap.get(field.fieldName);

        if (field.fieldType === 'Tx') {
          const val = typeof savedValue === 'string' ? savedValue : field.fieldValue ?? '';
          if (field.multiLine) {
            return (
              <textarea
                key={field.id}
                className="form-field form-field-text"
                style={style}
                defaultValue={val}
                onChange={(e) => onFormFieldChange?.(idx, field.fieldName, e.target.value)}
              />
            );
          }
          return (
            <input
              key={field.id}
              type="text"
              className="form-field form-field-text"
              style={style}
              defaultValue={val}
              maxLength={field.maxLen ?? undefined}
              onChange={(e) => onFormFieldChange?.(idx, field.fieldName, e.target.value)}
            />
          );
        }

        if (field.fieldType === 'Btn') {
          if (field.checkBox) {
            const checked = typeof savedValue === 'boolean' ? savedValue : !!field.fieldValue;
            return (
              <input
                key={field.id}
                type="checkbox"
                className="form-field form-field-checkbox"
                style={style}
                defaultChecked={checked}
                onChange={(e) => onFormFieldChange?.(idx, field.fieldName, e.target.checked)}
              />
            );
          }
          if (field.radioButton) {
            const checked = typeof savedValue === 'boolean' ? savedValue : !!field.fieldValue;
            return (
              <input
                key={field.id}
                type="radio"
                name={field.fieldName}
                className="form-field form-field-radio"
                style={style}
                defaultChecked={checked}
                onChange={(e) => onFormFieldChange?.(idx, field.fieldName, e.target.checked)}
              />
            );
          }
          return null;
        }

        if (field.fieldType === 'Ch' && field.options) {
          const val = typeof savedValue === 'string' ? savedValue : field.fieldValue ?? '';
          return (
            <select
              key={field.id}
              className="form-field form-field-select"
              style={style}
              defaultValue={val}
              onChange={(e) => onFormFieldChange?.(idx, field.fieldName, e.target.value)}
            >
              {field.options.map((opt) => (
                <option key={opt.exportValue} value={opt.exportValue}>
                  {opt.displayValue}
                </option>
              ))}
            </select>
          );
        }

        return null;
      });
    };

    if (pages.length === 0) {
      return <main className="viewer empty">Drop PDFs here or click Open to begin.</main>;
    }

    return (
      <main className="viewer" ref={scrollRef}>
        <div className="viewer-scroll-content">
          {pages.map((page, idx) => {
            const size = getPageSize(idx);
            const rotation = page.rotation ?? 0;
            const isSwapped = rotation === 90 || rotation === 270;
            const outerW = isSwapped ? size.height : size.width;
            const outerH = isSwapped ? size.width : size.height;
            return (
              <div
                key={page.id}
                className="page-container"
                data-page-index={idx}
                ref={(el) => {
                  if (el) pageRefs.current.set(idx, el);
                  else pageRefs.current.delete(idx);
                }}
              >
                <div className="page-number-badge">Page {idx + 1}</div>
                <div
                  className="page-rotation-wrapper"
                  style={{ width: outerW, height: outerH }}
                >
                <div
                  className={`viewer-canvas-wrap ${annotationMode ? 'annotating' : ''}`}
                  style={{
                    width: size.width,
                    height: size.height,
                    transform: rotation ? `rotate(${rotation}deg)` : undefined,
                    transformOrigin: 'center center'
                  }}
                  onClick={(e) => handleClick(e, idx)}
                  onMouseDown={(e) => handleMouseDown(e, idx)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  <canvas
                    ref={(el) => {
                      if (el) canvasRefs.current.set(idx, el);
                      else canvasRefs.current.delete(idx);
                    }}
                    className="pdf-canvas"
                  />
                  <div
                    ref={(el) => {
                      if (el) textLayerRefs.current.set(idx, el);
                      else textLayerRefs.current.delete(idx);
                    }}
                    className="textLayer"
                  />
                  <div
                    ref={(el) => {
                      if (el) formLayerRefs.current.set(idx, el);
                      else formLayerRefs.current.delete(idx);
                    }}
                    className="form-layer"
                  >
                    {renderFormFields(idx)}
                  </div>
                  <div className="annotation-layer">
                    {page.annotations.map(renderAnnotation)}
                    {renderDrawPreview(idx)}
                  </div>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }
);

PDFViewer.displayName = 'PDFViewer';

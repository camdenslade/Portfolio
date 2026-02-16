import { useMemo, useRef, useState } from 'react';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import type { Annotation, FormFieldValue, PDFSession, SessionDraftV1, SessionPage, SourcePDF } from '../types/pdf';
import { indicesFromRanges, parseRanges } from '../utils/ranges';

if (typeof window !== 'undefined' && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

type LocalInputFile = {
  name: string;
  path?: string;
  bytes: Uint8Array;
};

type LoadedInput = {
  source: SourcePDF;
  pageCount: number;
  document: PDFDocumentProxy;
};

const MAX_UNDO = 100;

const newId = () => crypto.randomUUID();

const cloneSession = (session: PDFSession): PDFSession => ({
  ...session,
  files: session.files.map((file) => ({ ...file })),
  pages: session.pages.map((page) => ({
    ...page,
    annotations: page.annotations.map((annotation) => ({ ...annotation })),
    formValues: page.formValues?.map((fv) => ({ ...fv }))
  }))
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildSequentialPages = (loaded: LoadedInput[], fileOffset = 0): SessionPage[] => {
  const pages: SessionPage[] = [];

  loaded.forEach((entry, loadedIndex) => {
    const sourceFileIndex = fileOffset + loadedIndex;
    for (let pageIndex = 0; pageIndex < entry.pageCount; pageIndex += 1) {
      pages.push({
        id: newId(),
        pageIndex,
        sourceFileIndex,
        annotations: []
      });
    }
  });

  return pages;
};

export const usePdfSession = () => {
  const [session, setSession] = useState<PDFSession>({ files: [], pages: [], currentPage: 0 });
  const [history, setHistory] = useState<PDFSession[]>([]);
  const [busy, setBusy] = useState(false);
  const docsRef = useRef<Map<string, PDFDocumentProxy>>(new Map());

  const canUndo = history.length > 0;

  const mutateSession = (update: (draft: PDFSession) => PDFSession | null) => {
    setSession((current) => {
      const next = update(current);
      if (!next) {
        return current;
      }

      setHistory((prev) => [...prev.slice(-(MAX_UNDO - 1)), cloneSession(current)]);
      return next;
    });
  };

  const parseIncoming = async (incomingFiles: LocalInputFile[]): Promise<LoadedInput[]> => {
    return Promise.all(
      incomingFiles.map(async (file) => {
        const source: SourcePDF = {
          id: newId(),
          name: file.name,
          path: file.path,
          bytes: file.bytes
        };

        const document = await getDocument({ data: file.bytes }).promise;

        return { source, pageCount: document.numPages, document };
      })
    );
  };

  const loadFiles = async (incomingFiles: LocalInputFile[], mode: 'append' | 'replace' = 'append') => {
    if (incomingFiles.length === 0) {
      return;
    }

    setBusy(true);
    try {
      const loaded = await parseIncoming(incomingFiles);

      if (mode === 'replace') {
        docsRef.current.clear();
        for (const entry of loaded) {
          docsRef.current.set(entry.source.id, entry.document);
        }

        const pages = buildSequentialPages(loaded, 0);
        setSession({
          files: loaded.map((entry) => entry.source),
          pages,
          currentPage: pages.length > 0 ? 0 : 0
        });
        setHistory([]);
        return;
      }

      for (const entry of loaded) {
        docsRef.current.set(entry.source.id, entry.document);
      }

      mutateSession((current) => {
        const fileOffset = current.files.length;
        const files = [...current.files, ...loaded.map((entry) => entry.source)];
        const pages = [...current.pages, ...buildSequentialPages(loaded, fileOffset)];

        return {
          files,
          pages,
          currentPage: clamp(current.currentPage, 0, Math.max(0, pages.length - 1))
        };
      });
    } finally {
      setBusy(false);
    }
  };

  const restoreDraft = async (draft: SessionDraftV1, incomingFiles: LocalInputFile[]) => {
    if (incomingFiles.length === 0) {
      return;
    }

    setBusy(true);
    try {
      const loaded = await parseIncoming(incomingFiles);
      docsRef.current.clear();
      for (const entry of loaded) {
        docsRef.current.set(entry.source.id, entry.document);
      }

      const pathToIndex = new Map<string, number>();
      const pageCounts = new Map<number, number>();

      loaded.forEach((entry, index) => {
        if (entry.source.path) {
          pathToIndex.set(entry.source.path, index);
        }
        pageCounts.set(index, entry.pageCount);
      });

      const restoredPages: SessionPage[] = [];
      for (const page of draft.pageOrder) {
        const sourceFileIndex = pathToIndex.get(page.sourcePath);
        if (sourceFileIndex === undefined) {
          continue;
        }

        const maxPages = pageCounts.get(sourceFileIndex) ?? 0;
        if (page.pageIndex < 0 || page.pageIndex >= maxPages) {
          continue;
        }

        restoredPages.push({
          id: newId(),
          pageIndex: page.pageIndex,
          sourceFileIndex,
          annotations: page.annotations.map((annotation) => ({ ...annotation, id: newId() }))
        });
      }

      const pages = restoredPages.length > 0 ? restoredPages : buildSequentialPages(loaded, 0);

      setSession({
        files: loaded.map((entry) => entry.source),
        pages,
        currentPage: clamp(draft.currentPage, 0, Math.max(0, pages.length - 1))
      });
      setHistory([]);
    } finally {
      setBusy(false);
    }
  };

  const createDraft = (): SessionDraftV1 | null => {
    const filePaths = Array.from(new Set(session.files.map((file) => file.path).filter((value): value is string => !!value)));
    if (filePaths.length === 0) {
      return null;
    }

    const pageOrder = session.pages
      .map((page) => {
        const source = session.files[page.sourceFileIndex];
        if (!source?.path) {
          return null;
        }

        return {
          sourcePath: source.path,
          pageIndex: page.pageIndex,
          annotations: page.annotations.map((annotation) => ({ ...annotation }))
        };
      })
      .filter((page): page is SessionDraftV1['pageOrder'][number] => page !== null);

    if (pageOrder.length === 0) {
      return null;
    }

    return {
      version: 1,
      filePaths,
      pageOrder,
      currentPage: clamp(session.currentPage, 0, Math.max(0, pageOrder.length - 1))
    };
  };

  const clearSession = () => {
    docsRef.current.clear();
    setHistory([]);
    setSession({ files: [], pages: [], currentPage: 0 });
  };

  const getPageDocument = (page: SessionPage | undefined) => {
    if (!page) {
      return undefined;
    }

    const source = session.files[page.sourceFileIndex];
    if (!source) {
      return undefined;
    }

    return docsRef.current.get(source.id);
  };

  const reorderPage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }

    mutateSession((current) => {
      if (fromIndex >= current.pages.length || toIndex >= current.pages.length) {
        return null;
      }

      const pages = [...current.pages];
      const [moved] = pages.splice(fromIndex, 1);
      pages.splice(toIndex, 0, moved);

      return {
        ...current,
        pages,
        currentPage: clamp(current.currentPage === fromIndex ? toIndex : current.currentPage, 0, Math.max(0, pages.length - 1))
      };
    });
  };

  const deletePage = (pageIndex: number) => {
    mutateSession((current) => {
      if (pageIndex < 0 || pageIndex >= current.pages.length) {
        return null;
      }

      const pages = current.pages.filter((_page, index) => index !== pageIndex);
      return {
        ...current,
        pages,
        currentPage: clamp(current.currentPage, 0, Math.max(0, pages.length - 1))
      };
    });
  };

  const splitByRange = (rawRange: string) => {
    mutateSession((current) => {
      const ranges = parseRanges(rawRange, current.pages.length);
      const indices = indicesFromRanges(ranges);
      const allowed = new Set(indices);
      const pages = current.pages.filter((_page, index) => allowed.has(index));

      return {
        ...current,
        pages,
        currentPage: clamp(current.currentPage, 0, Math.max(0, pages.length - 1))
      };
    });
  };

  const setCurrentPage = (pageIndex: number) => {
    setSession((current) => ({
      ...current,
      currentPage: clamp(pageIndex, 0, Math.max(0, current.pages.length - 1))
    }));
  };

  const addAnnotation = (pageIndex: number, annotation: Omit<Annotation, 'id'>) => {
    mutateSession((current) => {
      const page = current.pages[pageIndex];
      if (!page) {
        return null;
      }

      const nextPage: SessionPage = {
        ...page,
        annotations: [...page.annotations, { id: newId(), ...annotation }]
      };

      const pages = [...current.pages];
      pages[pageIndex] = nextPage;

      return {
        ...current,
        pages
      };
    });
  };

  const rotatePage = (pageIndex: number, degrees: 90 | -90 | 180) => {
    mutateSession((current) => {
      const page = current.pages[pageIndex];
      if (!page) return null;

      const current_rotation = page.rotation ?? 0;
      const newRotation = ((current_rotation + degrees) % 360 + 360) % 360;

      const pages = [...current.pages];
      pages[pageIndex] = { ...page, rotation: newRotation };
      return { ...current, pages };
    });
  };

  const setFormFieldValue = (pageIndex: number, fieldName: string, value: string | boolean) => {
    setSession((current) => {
      const page = current.pages[pageIndex];
      if (!page) return current;

      const existing = page.formValues ?? [];
      const idx = existing.findIndex((f) => f.fieldName === fieldName);
      const updated: FormFieldValue[] =
        idx >= 0
          ? existing.map((f, i) => (i === idx ? { ...f, value } : f))
          : [...existing, { fieldName, value }];

      const pages = [...current.pages];
      pages[pageIndex] = { ...page, formValues: updated };
      return { ...current, pages };
    });
  };

  const undo = () => {
    setHistory((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const nextHistory = [...prev];
      const previous = nextHistory.pop()!;
      setSession(previous);
      return nextHistory;
    });
  };

  const exportBytes = async () => {
    const outDoc = await PDFDocument.create();
    const sourceCache = new Map<string, PDFDocument>();

    for (const page of session.pages) {
      const source = session.files[page.sourceFileIndex];
      if (!source) {
        continue;
      }

      let sourceDoc = sourceCache.get(source.id);
      if (!sourceDoc) {
        sourceDoc = await PDFDocument.load(source.bytes);
        sourceCache.set(source.id, sourceDoc);
      }

      // If page has form values, fill them on a fresh copy of the source
      let docForCopy = sourceDoc;
      if (page.formValues && page.formValues.length > 0) {
        try {
          const freshDoc = await PDFDocument.load(source.bytes);
          const form = freshDoc.getForm();
          for (const fv of page.formValues) {
            try {
              if (typeof fv.value === 'boolean') {
                const cb = form.getCheckBox(fv.fieldName);
                if (fv.value) cb.check();
                else cb.uncheck();
              } else {
                const tf = form.getTextField(fv.fieldName);
                tf.setText(fv.value);
              }
            } catch {
              // Field may not exist or be a different type — skip
            }
          }
          form.flatten();
          docForCopy = freshDoc;
        } catch {
          // Form filling failed, use original
        }
      }

      const [copiedPage] = await outDoc.copyPages(docForCopy, [page.pageIndex]);
      if (page.rotation) {
        const existing = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(existing + page.rotation));
      }
      outDoc.addPage(copiedPage);

      const size = copiedPage.getSize();
      for (const annotation of page.annotations) {
        const x = annotation.x * size.width;
        const y = size.height - (annotation.y + annotation.height) * size.height;
        const width = annotation.width * size.width;
        const height = annotation.height * size.height;

        const parseColor = (hex?: string) => {
          if (!hex) return rgb(1, 0, 0);
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return rgb(r, g, b);
        };

        const color = parseColor(annotation.color);
        const sw = annotation.strokeWidth ?? 2;

        if (annotation.type === 'highlight') {
          copiedPage.drawRectangle({
            x,
            y,
            width,
            height,
            color: annotation.color ? color : rgb(1, 0.95, 0.2),
            opacity: annotation.opacity ?? 0.4,
            borderWidth: 0
          });
        } else if (annotation.type === 'underline' || annotation.type === 'strikethrough') {
          copiedPage.drawLine({
            start: { x, y: y + height / 2 },
            end: { x: x + width, y: y + height / 2 },
            thickness: sw,
            color
          });
        } else if (annotation.type === 'note' || annotation.type === 'stickyNote') {
          copiedPage.drawRectangle({
            x,
            y,
            width: Math.max(width, 16),
            height: Math.max(height, 16),
            color: annotation.color ? color : rgb(1, 0.95, 0.65),
            borderColor: rgb(0.7, 0.6, 0.1),
            borderWidth: 1
          });
          if (annotation.text) {
            copiedPage.drawText(annotation.text, {
              x: x + 4,
              y: y + Math.max(height, 16) - 10,
              size: 9,
              color: rgb(0.2, 0.2, 0.2),
              maxWidth: Math.max(width, 120)
            });
          }
        } else if (annotation.type === 'textBox') {
          if (annotation.text) {
            copiedPage.drawText(annotation.text, {
              x: x + 2,
              y: y + height - (annotation.fontSize ?? 12),
              size: annotation.fontSize ?? 12,
              color,
              maxWidth: Math.max(width, 60)
            });
          }
        } else if (annotation.type === 'rectangle') {
          copiedPage.drawRectangle({
            x,
            y,
            width,
            height,
            borderColor: color,
            borderWidth: sw,
            color: rgb(0, 0, 0),
            opacity: 0
          });
        } else if (annotation.type === 'ellipse') {
          copiedPage.drawEllipse({
            x: x + width / 2,
            y: y + height / 2,
            xScale: width / 2,
            yScale: height / 2,
            borderColor: color,
            borderWidth: sw,
            color: rgb(0, 0, 0),
            opacity: 0
          });
        } else if (annotation.type === 'line') {
          copiedPage.drawLine({
            start: { x, y },
            end: { x: x + width, y: y + height },
            thickness: sw,
            color
          });
        } else if (annotation.type === 'arrow') {
          copiedPage.drawLine({
            start: { x, y },
            end: { x: x + width, y: y + height },
            thickness: sw,
            color
          });
          // Draw arrowhead as small triangle
          const angle = Math.atan2(height, width);
          const headLen = 8;
          const tipX = x + width;
          const tipY = y + height;
          copiedPage.drawLine({
            start: { x: tipX - headLen * Math.cos(angle - 0.4), y: tipY - headLen * Math.sin(angle - 0.4) },
            end: { x: tipX, y: tipY },
            thickness: sw,
            color
          });
          copiedPage.drawLine({
            start: { x: tipX - headLen * Math.cos(angle + 0.4), y: tipY - headLen * Math.sin(angle + 0.4) },
            end: { x: tipX, y: tipY },
            thickness: sw,
            color
          });
        } else if (annotation.type === 'freehand' && annotation.points && annotation.points.length > 1) {
          for (let i = 1; i < annotation.points.length; i++) {
            const p0 = annotation.points[i - 1];
            const p1 = annotation.points[i];
            copiedPage.drawLine({
              start: { x: p0.x * size.width, y: size.height - p0.y * size.height },
              end: { x: p1.x * size.width, y: size.height - p1.y * size.height },
              thickness: sw,
              color
            });
          }
        }
      }
    }

    return outDoc.save();
  };

  // Snapshot/restore for tab switching
  type SessionSnapshot = {
    session: PDFSession;
    history: PDFSession[];
    docs: Map<string, PDFDocumentProxy>;
  };

  const snapshotState = (): SessionSnapshot => ({
    session: cloneSession(session),
    history: history.map(cloneSession),
    docs: new Map(docsRef.current)
  });

  const restoreState = (snapshot: SessionSnapshot) => {
    setSession(snapshot.session);
    setHistory(snapshot.history);
    docsRef.current = new Map(snapshot.docs);
  };

  const current = useMemo(() => session.pages[session.currentPage], [session.currentPage, session.pages]);

  // Build a map of sourceFileIndex -> PDFDocumentProxy for the viewer
  const documentMap = useMemo(() => {
    const map = new Map<number, PDFDocumentProxy>();
    session.files.forEach((file, idx) => {
      const doc = docsRef.current.get(file.id);
      if (doc) map.set(idx, doc);
    });
    return map;
  }, [session.files]);

  return {
    session,
    busy,
    canUndo,
    currentPage: current,
    documentMap,
    loadFiles,
    restoreDraft,
    createDraft,
    clearSession,
    reorderPage,
    deletePage,
    splitByRange,
    setCurrentPage,
    addAnnotation,
    rotatePage,
    setFormFieldValue,
    undo,
    exportBytes,
    getPageDocument,
    snapshotState,
    restoreState
  };
};

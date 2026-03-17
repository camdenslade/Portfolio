import { useState, useCallback } from 'react';

type ToolbarProps = {
  canUndo: boolean;
  hasPages: boolean;
  zoom: number;
  currentPage: number;
  totalPages: number;
  annotationsVisible: boolean;
  onOpen: () => void;
  onMerge: () => void;
  onDeletePage: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onExport: () => void;
  onUndo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomSet: (zoom: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (pageIndex: number) => void;
  onToggleAnnotations: () => void;
};

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

// ── Inline SVG Icons (16×16) ────────────────────────

const IconFolder = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4a1 1 0 011-1h3.5l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.3" fill="none" />
  </svg>
);

const IconMerge = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="5" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <rect x="9" y="7" width="5" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 8.5L9 10.5M9 8.5L7 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M3 4h10M4.5 4l.5 9h6l.5-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRotateCCW = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 7a5 5 0 018.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M3 3v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 9a5 5 0 01-8.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconRotateCW = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M12 7a5 5 0 00-8.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M13 3v4h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 9a5 5 0 008.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconUndo = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6h6a3 3 0 010 6H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 3L3.5 5.5L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 3L5.5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 3L10.5 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconZoomOut = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconZoomIn = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconPen = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M9.5 4.5l2 2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8M5 7.5L8 10.5L11 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const Toolbar = ({
  canUndo,
  hasPages,
  zoom,
  currentPage,
  totalPages,
  annotationsVisible,
  onOpen,
  onMerge,
  onDeletePage,
  onRotateCW,
  onRotateCCW,
  onExport,
  onUndo,
  onZoomIn,
  onZoomOut,
  onZoomSet,
  onPrevPage,
  onNextPage,
  onGoToPage,
  onToggleAnnotations
}: ToolbarProps) => {
  const [pageInputValue, setPageInputValue] = useState('');
  const [isEditingPage, setIsEditingPage] = useState(false);

  const handlePageInputFocus = useCallback(() => {
    setIsEditingPage(true);
    setPageInputValue(String(currentPage + 1));
  }, [currentPage]);

  const handlePageInputBlur = useCallback(() => {
    setIsEditingPage(false);
    const num = parseInt(pageInputValue, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      onGoToPage(num - 1);
    }
  }, [pageInputValue, totalPages, onGoToPage]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === 'Escape') {
        setIsEditingPage(false);
        setPageInputValue('');
      }
    },
    []
  );

  return (
    <header className="toolbar">
      <div className="toolbar-brand">PDF SUITE</div>

      <div className="toolbar-separator" />

      {/* File operations */}
      <div className="toolbar-group">
        <button className="toolbar-icon-btn button-primary" onClick={onOpen} title="Open PDF">
          <IconFolder />
        </button>
        <button className="toolbar-icon-btn" onClick={onMerge} title="Merge PDFs">
          <IconMerge />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Page operations */}
      <div className="toolbar-group">
        <button className="toolbar-icon-btn" onClick={onDeletePage} disabled={!hasPages} title="Delete page">
          <IconTrash />
        </button>
        <button className="toolbar-icon-btn" onClick={onRotateCCW} disabled={!hasPages} title="Rotate left">
          <IconRotateCCW />
        </button>
        <button className="toolbar-icon-btn" onClick={onRotateCW} disabled={!hasPages} title="Rotate right">
          <IconRotateCW />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Undo */}
      <button className="toolbar-icon-btn" onClick={onUndo} disabled={!canUndo} title="Undo">
        <IconUndo />
      </button>

      <div className="toolbar-separator" />

      {/* Page navigation */}
      <div className="toolbar-page-nav">
        <button className="toolbar-icon-btn" onClick={onPrevPage} disabled={!hasPages || currentPage <= 0} title="Previous page">
          <IconChevronLeft />
        </button>
        <input
          type="text"
          className="page-nav-input"
          value={isEditingPage ? pageInputValue : (hasPages ? String(currentPage + 1) : '—')}
          onChange={(e) => setPageInputValue(e.target.value)}
          onFocus={handlePageInputFocus}
          onBlur={handlePageInputBlur}
          onKeyDown={handlePageInputKeyDown}
          disabled={!hasPages}
        />
        <span className="page-nav-total">of {totalPages || '—'}</span>
        <button className="toolbar-icon-btn" onClick={onNextPage} disabled={!hasPages || currentPage >= totalPages - 1} title="Next page">
          <IconChevronRight />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Zoom */}
      <div className="toolbar-group toolbar-zoom">
        <button className="toolbar-icon-btn" onClick={onZoomOut} disabled={!hasPages} title="Zoom out">
          <IconZoomOut />
        </button>
        <select
          className="zoom-select"
          value={zoom}
          disabled={!hasPages}
          onChange={(e) => onZoomSet(Number(e.target.value))}
        >
          {ZOOM_PRESETS.map((z) => (
            <option key={z} value={z}>
              {Math.round(z * 100)}%
            </option>
          ))}
          {!ZOOM_PRESETS.includes(zoom) && (
            <option value={zoom}>{Math.round(zoom * 100)}%</option>
          )}
        </select>
        <button className="toolbar-icon-btn" onClick={onZoomIn} disabled={!hasPages} title="Zoom in">
          <IconZoomIn />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Annotations toggle */}
      <button
        className={`toolbar-icon-btn ${annotationsVisible ? 'active' : ''}`}
        onClick={onToggleAnnotations}
        title="Toggle annotation tools"
      >
        <IconPen />
      </button>

      {/* Export (pushed right) */}
      <div className="toolbar-group-end">
        <button className="toolbar-icon-btn button-primary" onClick={onExport} disabled={!hasPages} title="Export PDF">
          <IconDownload />
        </button>
      </div>
    </header>
  );
};

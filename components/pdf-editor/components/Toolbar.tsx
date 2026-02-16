type ToolbarProps = {
  canUndo: boolean;
  hasPages: boolean;
  zoom: number;
  onOpen: () => void;
  onMerge: () => void;
  onNewSession: () => void;
  onSplit: () => void;
  onDeletePage: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onExport: () => void;
  onUndo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomSet: (zoom: number) => void;
};

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

export const Toolbar = ({
  canUndo,
  hasPages,
  zoom,
  onOpen,
  onMerge,
  onNewSession,
  onSplit,
  onDeletePage,
  onRotateCW,
  onRotateCCW,
  onExport,
  onUndo,
  onZoomIn,
  onZoomOut,
  onZoomSet
}: ToolbarProps) => {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">PDF SUITE</div>
      <div className="toolbar-group">
        <button onClick={onNewSession}>New</button>
        <button onClick={onOpen} className="button-primary">
          Open
        </button>
        <button onClick={onMerge}>Merge</button>
      </div>
      <div className="toolbar-group">
        <button onClick={onSplit} disabled={!hasPages}>
          Split
        </button>
        <button onClick={onDeletePage} disabled={!hasPages}>
          Delete
        </button>
        <button onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
      </div>
      <div className="toolbar-group">
        <button onClick={onRotateCCW} disabled={!hasPages} title="Rotate left">
          ↺
        </button>
        <button onClick={onRotateCW} disabled={!hasPages} title="Rotate right">
          ↻
        </button>
      </div>
      <div className="toolbar-group toolbar-zoom">
        <button onClick={onZoomOut} disabled={!hasPages} title="Zoom out">
          &minus;
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
        <button onClick={onZoomIn} disabled={!hasPages} title="Zoom in">
          +
        </button>
      </div>
      <div className="toolbar-group toolbar-group-end">
        <button onClick={onExport} disabled={!hasPages} className="button-primary">
          Export
        </button>
      </div>
    </header>
  );
};

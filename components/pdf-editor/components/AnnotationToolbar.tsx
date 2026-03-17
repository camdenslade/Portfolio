import type { AnnotationType } from '../types/pdf';

type AnnotationToolbarProps = {
  activeMode: AnnotationType | null;
  color: string;
  strokeWidth: number;
  visible: boolean;
  onSetMode: (mode: AnnotationType | null) => void;
  onSetColor: (color: string) => void;
  onSetStrokeWidth: (width: number) => void;
};

type ToolDef = {
  type: AnnotationType;
  label: string;
  icon: React.ReactNode;
};

const TOOLS: ToolDef[] = [
  {
    type: 'highlight',
    label: 'Highlight',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="9" width="12" height="4" rx="1" fill="currentColor" opacity="0.35" />
        <path d="M3 9V5a1 1 0 011-1h2l1.5 2H13v3H3z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
  {
    type: 'underline',
    label: 'Underline',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 3v5a4 4 0 008 0V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M3 14h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    type: 'strikethrough',
    label: 'Strikethrough',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 3h5l-1.5 4M2 8h12M7.5 8L6 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    type: 'stickyNote',
    label: 'Sticky Note',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10 14V10h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    type: 'textBox',
    label: 'Text Box',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 4h8M8 4v9M6 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    type: 'note',
    label: 'Note',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 3h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 2V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M5 7h6M5 9.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    type: 'freehand',
    label: 'Draw',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 12C4 8 6 5 8 6c2 1 0 4 2 5s3-2 3-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    type: 'rectangle',
    label: 'Rectangle',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="3.5" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    type: 'ellipse',
    label: 'Ellipse',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <ellipse cx="8" cy="8" rx="6" ry="4.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    type: 'arrow',
    label: 'Arrow',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M7 3h6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    type: 'line',
    label: 'Line',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    type: 'textEdit',
    label: 'Edit Text',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 4h5M5.5 4v8M3 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M11 6v6M9.5 11.5L11 13l1.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const COLORS = ['#ff0000', '#ff8800', '#ffee00', '#00cc44', '#0088ff', '#8844ff', '#000000', '#ffffff'];

export const AnnotationToolbar = ({
  activeMode,
  color,
  strokeWidth,
  visible,
  onSetMode,
  onSetColor,
  onSetStrokeWidth
}: AnnotationToolbarProps) => {
  if (!visible) return null;

  return (
    <div className="annotation-toolbar">
      <div className="annotation-toolbar-tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.type}
            className={`annotation-tool-btn ${activeMode === tool.type ? 'active' : ''}`}
            onClick={() => onSetMode(activeMode === tool.type ? null : tool.type)}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>
      {activeMode && (
        <div className="annotation-toolbar-props">
          <div className="color-picker">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${color === c ? 'color-swatch-active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => onSetColor(c)}
                title={c}
              />
            ))}
          </div>
          <label className="stroke-control">
            <span>Width</span>
            <input
              type="range"
              min={1}
              max={10}
              value={strokeWidth}
              onChange={(e) => onSetStrokeWidth(Number(e.target.value))}
            />
            <span>{strokeWidth}px</span>
          </label>
        </div>
      )}
    </div>
  );
};

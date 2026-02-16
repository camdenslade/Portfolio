import type { AnnotationType } from '../types/pdf';

type AnnotationToolbarProps = {
  activeMode: AnnotationType | null;
  color: string;
  strokeWidth: number;
  onSetMode: (mode: AnnotationType | null) => void;
  onSetColor: (color: string) => void;
  onSetStrokeWidth: (width: number) => void;
};

type ToolDef = {
  type: AnnotationType;
  label: string;
  group: 'markup' | 'shape' | 'text';
};

const TOOLS: ToolDef[] = [
  { type: 'highlight', label: 'Highlight', group: 'markup' },
  { type: 'underline', label: 'Underline', group: 'markup' },
  { type: 'strikethrough', label: 'Strike', group: 'markup' },
  { type: 'stickyNote', label: 'Sticky', group: 'text' },
  { type: 'textBox', label: 'Text', group: 'text' },
  { type: 'note', label: 'Note', group: 'text' },
  { type: 'freehand', label: 'Draw', group: 'shape' },
  { type: 'rectangle', label: 'Rect', group: 'shape' },
  { type: 'ellipse', label: 'Ellipse', group: 'shape' },
  { type: 'arrow', label: 'Arrow', group: 'shape' },
  { type: 'line', label: 'Line', group: 'shape' },
];

const COLORS = ['#ff0000', '#ff8800', '#ffee00', '#00cc44', '#0088ff', '#8844ff', '#000000', '#ffffff'];

export const AnnotationToolbar = ({
  activeMode,
  color,
  strokeWidth,
  onSetMode,
  onSetColor,
  onSetStrokeWidth
}: AnnotationToolbarProps) => {
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
            {tool.label}
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

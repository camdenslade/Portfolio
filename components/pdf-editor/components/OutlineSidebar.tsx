import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

type OutlineItem = {
  title: string;
  bold: boolean;
  italic: boolean;
  dest: string | Array<unknown> | null;
  items: OutlineItem[];
};

type OutlineSidebarProps = {
  document: PDFDocumentProxy | undefined;
  onNavigateToPage: (pageIndex: number) => void;
};

export const OutlineSidebar = ({ document, onNavigateToPage }: OutlineSidebarProps) => {
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!document) {
      setOutline([]);
      return;
    }

    void document.getOutline().then((result) => {
      setOutline((result as OutlineItem[]) ?? []);
      // Auto-expand first level
      const firstLevel = new Set<string>();
      for (const item of (result as OutlineItem[]) ?? []) {
        firstLevel.add(item.title);
      }
      setExpanded(firstLevel);
    });
  }, [document]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resolveDestination = async (dest: string | Array<unknown> | null) => {
    if (!document || !dest) return;

    let explicitDest: unknown = dest;
    if (typeof dest === 'string') {
      explicitDest = await document.getDestination(dest);
    }

    if (!Array.isArray(explicitDest) || explicitDest.length === 0) return;

    const ref = explicitDest[0] as Parameters<typeof document.getPageIndex>[0];
    const pageIndex = await document.getPageIndex(ref);
    onNavigateToPage(pageIndex);
  };

  const renderItems = (items: OutlineItem[], depth: number, parentKey: string): React.ReactNode => {
    return items.map((item, idx) => {
      const key = `${parentKey}-${idx}`;
      const hasChildren = item.items && item.items.length > 0;
      const isExpanded = expanded.has(key);

      return (
        <div key={key} className="outline-item" style={{ paddingLeft: depth * 16 }}>
          <div
            className="outline-entry"
            onClick={() => void resolveDestination(item.dest)}
          >
            {hasChildren && (
              <button
                className="outline-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(key);
                }}
              >
                {isExpanded ? '\u25BC' : '\u25B6'}
              </button>
            )}
            <span
              className="outline-title"
              style={{
                fontWeight: item.bold ? 700 : 400,
                fontStyle: item.italic ? 'italic' : 'normal'
              }}
            >
              {item.title}
            </span>
          </div>
          {hasChildren && isExpanded && renderItems(item.items, depth + 1, key)}
        </div>
      );
    });
  };

  if (outline.length === 0) {
    return (
      <div className="outline-empty">No bookmarks</div>
    );
  }

  return <div className="outline-tree">{renderItems(outline, 0, 'root')}</div>;
};

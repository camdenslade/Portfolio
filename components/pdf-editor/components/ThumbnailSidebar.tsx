import { useEffect, useState } from 'react';
import type { SessionPage } from '../types/pdf';

type ThumbnailSidebarProps = {
  pages: SessionPage[];
  currentPage: number;
  renderLabel: (index: number, page: SessionPage) => string;
  onReorder: (from: number, to: number) => void;
  onSelectPage: (index: number) => void;
  onContextMenu?: (index: number, event: React.MouseEvent) => void;
};

export const ThumbnailSidebar = ({
  pages,
  currentPage,
  renderLabel,
  onReorder,
  onSelectPage,
  onContextMenu
}: ThumbnailSidebarProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (dragIndex !== null && dragIndex >= pages.length) {
      setDragIndex(null);
    }
  }, [dragIndex, pages.length]);

  return (
    <div className="thumb-list">
      {pages.map((page, index) => (
        <div
          key={page.id}
          className={`thumb ${currentPage === index ? 'selected' : ''}`}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (dragIndex === null) {
              return;
            }
            onReorder(dragIndex, index);
            setDragIndex(null);
          }}
          onClick={() => onSelectPage(index)}
          onContextMenu={(e) => {
            if (onContextMenu) {
              e.preventDefault();
              onContextMenu(index, e);
            }
          }}
        >
          <div className="thumb-number">{index + 1}</div>
          <div className="thumb-label">{renderLabel(index, page)}</div>
          <div className="thumb-annotation-count">{page.annotations.length} notes</div>
        </div>
      ))}
    </div>
  );
};

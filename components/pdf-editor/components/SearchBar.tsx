import { useCallback, useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { SessionPage } from '../types/pdf';

type SearchMatch = {
  pageIndex: number;
  itemIndex: number;
};

type SearchBarProps = {
  pages: SessionPage[];
  documents: Map<number, PDFDocumentProxy>;
  visible: boolean;
  onClose: () => void;
  onHighlightMatches: (matches: SearchMatch[], currentMatch: number) => void;
  onNavigateToPage: (pageIndex: number) => void;
};

export type { SearchMatch };

export const SearchBar = ({
  pages,
  documents,
  visible,
  onClose,
  onHighlightMatches,
  onNavigateToPage
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState(-1);
  const [searching, setSearching] = useState(false);

  // Focus input when bar becomes visible
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setMatches([]);
      setCurrentMatch(-1);
      onHighlightMatches([], -1);
    }
  }, [visible, onHighlightMatches]);

  // Search across all pages
  const doSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setMatches([]);
        setCurrentMatch(-1);
        onHighlightMatches([], -1);
        return;
      }

      setSearching(true);
      const found: SearchMatch[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const doc = documents.get(page.sourceFileIndex);
        if (!doc) continue;

        const pdfPage = await doc.getPage(page.pageIndex + 1);
        const textContent = await pdfPage.getTextContent();

        for (let itemIdx = 0; itemIdx < textContent.items.length; itemIdx++) {
          const item = textContent.items[itemIdx];
          if ('str' in item && item.str.toLowerCase().includes(lowerQuery)) {
            found.push({ pageIndex: i, itemIndex: itemIdx });
          }
        }
      }

      setMatches(found);
      const nextMatch = found.length > 0 ? 0 : -1;
      setCurrentMatch(nextMatch);
      onHighlightMatches(found, nextMatch);

      if (found.length > 0) {
        onNavigateToPage(found[0].pageIndex);
      }

      setSearching(false);
    },
    [pages, documents, onHighlightMatches, onNavigateToPage]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      void doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    const next = (currentMatch + 1) % matches.length;
    setCurrentMatch(next);
    onHighlightMatches(matches, next);
    onNavigateToPage(matches[next].pageIndex);
  }, [matches, currentMatch, onHighlightMatches, onNavigateToPage]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prev = (currentMatch - 1 + matches.length) % matches.length;
    setCurrentMatch(prev);
    onHighlightMatches(matches, prev);
    onNavigateToPage(matches[prev].pageIndex);
  }, [matches, currentMatch, onHighlightMatches, onNavigateToPage]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) goPrev();
        else goNext();
      }
    },
    [onClose, goNext, goPrev]
  );

  if (!visible) return null;

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder="Find in document..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <span className="search-count">
        {searching
          ? 'Searching...'
          : matches.length > 0
            ? `${currentMatch + 1} of ${matches.length}`
            : query
              ? 'No matches'
              : ''}
      </span>
      <button className="search-btn" onClick={goPrev} disabled={matches.length === 0} title="Previous (Shift+Enter)">
        &#x25B2;
      </button>
      <button className="search-btn" onClick={goNext} disabled={matches.length === 0} title="Next (Enter)">
        &#x25BC;
      </button>
      <button className="search-btn" onClick={onClose} title="Close (Esc)">
        &#x2715;
      </button>
    </div>
  );
};

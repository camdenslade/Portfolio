'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PDFViewer, type PDFViewerHandle } from './components/PDFViewer';
import { SearchBar, type SearchMatch } from './components/SearchBar';
import { OutlineSidebar } from './components/OutlineSidebar';
import { TabBar } from './components/TabBar';
import { ThumbnailSidebar } from './components/ThumbnailSidebar';
import { Toolbar } from './components/Toolbar';
import { AnnotationToolbar } from './components/AnnotationToolbar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ContextMenu } from './components/ContextMenu';
import { usePdfSession } from './hooks/usePdfSession';
import type { AnnotationType, Tab } from './types/pdf';
import './pdf-editor.css';

const toUint8Array = async (file: File) => new Uint8Array(await file.arrayBuffer());

type LoadMode = 'replace' | 'append';

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4.0;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
const newTabId = () => crypto.randomUUID();

export const PdfEditorApp = () => {
  const {
    session,
    busy,
    canUndo,
    documentMap,
    loadFiles,
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
    snapshotState,
    restoreState
  } = usePdfSession();

  const [annotationMode, setAnnotationMode] = useState<AnnotationType | null>(null);
  const [annotationColor, setAnnotationColor] = useState('#ff0000');
  const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(2);
  const [annotationToolbarVisible, setAnnotationToolbarVisible] = useState(true);
  const [status, setStatus] = useState('Ready');
  const [zoom, setZoom] = useState(1.25);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [searchCurrentMatch, setSearchCurrentMatch] = useState(-1);
  const [sidebarMode, setSidebarMode] = useState<'thumbnails' | 'bookmarks'>('thumbnails');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageIndex: number } | null>(null);
  const [isStackedLayout, setIsStackedLayout] = useState(false);
  const [stackedSidebarHeight, setStackedSidebarHeight] = useState(140);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const shouldUseStackedLayout = isStackedLayout;

  // Tab state
  const initialTabId = useRef(newTabId()).current;
  const [tabs, setTabs] = useState<Tab[]>([{ id: initialTabId, title: 'Untitled' }]);
  const [activeTabId, setActiveTabId] = useState<string>(initialTabId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabSnapshots = useRef<Map<string, any>>(new Map());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const pickerModeRef = useRef<LoadMode>('replace');
  const exportRef = useRef<() => Promise<void>>(async () => undefined);
  const viewerRef = useRef<PDFViewerHandle>(null);

  const currentPageIndex = session.currentPage;

  // Tab management
  const switchToTab = useCallback(
    (tabId: string) => {
      if (tabId === activeTabId) return;
      tabSnapshots.current.set(activeTabId, snapshotState());
      const snapshot = tabSnapshots.current.get(tabId);
      if (snapshot) restoreState(snapshot);
      else clearSession();
      setActiveTabId(tabId);
      setSearchVisible(false);
    },
    [activeTabId, snapshotState, restoreState, clearSession]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      if (tabs.length <= 1) return;
      tabSnapshots.current.delete(tabId);
      const remaining = tabs.filter((t) => t.id !== tabId);
      setTabs(remaining);
      if (tabId === activeTabId) {
        const newActive = remaining[0].id;
        const snapshot = tabSnapshots.current.get(newActive);
        if (snapshot) restoreState(snapshot);
        else clearSession();
        setActiveTabId(newActive);
      }
    },
    [tabs, activeTabId, restoreState, clearSession]
  );

  const openInNewTab = useCallback(
    async (files: Array<{ name: string; path?: string; bytes: Uint8Array }>) => {
      tabSnapshots.current.set(activeTabId, snapshotState());
      const id = newTabId();
      const title = files[0]?.name ?? 'Untitled';
      setTabs((prev) => [...prev, { id, title }]);
      setActiveTabId(id);
      clearSession();
      await loadFiles(files, 'replace');
      setStatus(`Opened ${title}`);
    },
    [activeTabId, snapshotState, clearSession, loadFiles]
  );

  const openLocalPicker = (mode: LoadMode) => {
    pickerModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const handleLocalPickerChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const localFiles = Array.from(event.target.files ?? []).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    const normalized = await Promise.all(
      localFiles.map(async (file) => ({
        name: file.name,
        bytes: await toUint8Array(file)
      }))
    );

    if (normalized.length > 0) {
      const mode = pickerModeRef.current;
      if (mode === 'replace') {
        if (session.pages.length > 0) {
          await openInNewTab(normalized);
        } else {
          await loadFiles(normalized, 'replace');
          setTabs((prev) =>
            prev.map((t) => (t.id === activeTabId ? { ...t, title: normalized[0].name } : t))
          );
          setStatus(`Opened ${normalized.length} file(s)`);
        }
      } else {
        await loadFiles(normalized, 'append');
        setStatus(`Merged ${normalized.length} file(s)`);
      }
    }

    event.currentTarget.value = '';
  };

  const onOpen = () => openLocalPicker('replace');
  const onMerge = () => openLocalPicker('append');

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (event) => {
    event.preventDefault();
    const localFiles = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    const normalized = await Promise.all(
      localFiles.map(async (file) => ({
        name: file.name,
        bytes: await toUint8Array(file)
      }))
    );

    if (normalized.length === 0) return;

    if (session.pages.length > 0) {
      await openInNewTab(normalized);
    } else {
      await loadFiles(normalized, 'replace');
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, title: normalized[0].name } : t))
      );
      setStatus(`Loaded ${normalized.length} file(s)`);
    }
  };

  const onSplit = () => {
    const raw = window.prompt('Keep ranges (e.g. 1-3,6-8)');
    if (!raw) return;
    try {
      splitByRange(raw);
      setStatus(`Applied split range: ${raw}`);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const onDeletePage = () => {
    deletePage(currentPageIndex);
    setStatus(`Deleted page ${currentPageIndex + 1}`);
  };

  const onNewSession = () => {
    clearSession();
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, title: 'Untitled', filePath: undefined } : t)));
    setStatus('Started new session');
  };

  const onExport = async () => {
    setStatus('Exporting...');
    try {
      const bytes = await exportBytes();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Exported successfully');
    } catch (error) {
      setStatus(`Export failed: ${(error as Error).message}`);
    }
  };

  const onZoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), []);
  const onZoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), []);
  const onZoomSet = useCallback((z: number) => setZoom(clampZoom(z)), []);

  const handleSearchHighlight = useCallback((matches: SearchMatch[], current: number) => {
    setSearchMatches(matches);
    setSearchCurrentMatch(current);
  }, []);

  const handleSearchNavigate = useCallback(
    (pageIndex: number) => {
      setCurrentPage(pageIndex);
      viewerRef.current?.scrollToPage(pageIndex);
    },
    [setCurrentPage]
  );

  const handlePageChange = useCallback(
    (pageIndex: number) => {
      setCurrentPage(pageIndex);
    },
    [setCurrentPage]
  );

  const handleThumbnailSelect = useCallback(
    (pageIndex: number) => {
      setCurrentPage(pageIndex);
      viewerRef.current?.scrollToPage(pageIndex);
    },
    [setCurrentPage]
  );

  const onPrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPage(currentPageIndex - 1);
      viewerRef.current?.scrollToPage(currentPageIndex - 1);
    }
  }, [currentPageIndex, setCurrentPage]);

  const onNextPage = useCallback(() => {
    if (currentPageIndex < session.pages.length - 1) {
      setCurrentPage(currentPageIndex + 1);
      viewerRef.current?.scrollToPage(currentPageIndex + 1);
    }
  }, [currentPageIndex, session.pages.length, setCurrentPage]);

  const onGoToPage = useCallback(
    (pageIndex: number) => {
      const clamped = Math.max(0, Math.min(session.pages.length - 1, pageIndex));
      setCurrentPage(clamped);
      viewerRef.current?.scrollToPage(clamped);
    },
    [session.pages.length, setCurrentPage]
  );

  const handleToggleAnnotations = useCallback(() => {
    setAnnotationToolbarVisible((v) => {
      if (v) setAnnotationMode(null);
      return !v;
    });
  }, []);

  exportRef.current = onExport;

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;

      if (isCmdOrCtrl && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
        setStatus('Undo');
        return;
      }

      if (isCmdOrCtrl && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void exportRef.current();
        return;
      }

      if (isCmdOrCtrl && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setSearchVisible((v) => !v);
        return;
      }

      if (isCmdOrCtrl && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        if (tabs.length > 1) closeTab(activeTabId);
        return;
      }

      if (isCmdOrCtrl && event.key === '=') {
        event.preventDefault();
        onZoomIn();
        return;
      }

      if (isCmdOrCtrl && event.key === '-') {
        event.preventDefault();
        onZoomOut();
        return;
      }

      if (isCmdOrCtrl && event.key === '0') {
        event.preventDefault();
        onZoomSet(1.0);
        return;
      }

      if (isCmdOrCtrl && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        const raw = window.prompt(`Go to page (1–${session.pages.length})`);
        if (raw) {
          const num = parseInt(raw, 10);
          if (num >= 1 && num <= session.pages.length) {
            setCurrentPage(num - 1);
            viewerRef.current?.scrollToPage(num - 1);
          }
        }
        return;
      }

      if (event.key === 'Escape') {
        if (annotationMode) {
          setAnnotationMode(null);
          return;
        }
        if (searchVisible) {
          setSearchVisible(false);
          return;
        }
      }

      if ((event.target as HTMLElement).tagName === 'INPUT' || (event.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        setCurrentPage(currentPageIndex + 1);
        viewerRef.current?.scrollToPage(currentPageIndex + 1);
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        setCurrentPage(currentPageIndex - 1);
        viewerRef.current?.scrollToPage(currentPageIndex - 1);
        return;
      }

      if (event.key === 'Home') {
        setCurrentPage(0);
        viewerRef.current?.scrollToPage(0);
        return;
      }

      if (event.key === 'End') {
        const last = session.pages.length - 1;
        if (last >= 0) {
          setCurrentPage(last);
          viewerRef.current?.scrollToPage(last);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPageIndex, setCurrentPage, onZoomIn, onZoomOut, onZoomSet, tabs.length, activeTabId, closeTab, annotationMode, searchVisible, session.pages.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 820px)');
    const syncLayout = () => setIsStackedLayout(mediaQuery.matches);
    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);
    return () => mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  useEffect(() => {
    if (!isDraggingSidebar || !shouldUseStackedLayout) return;

    const onPointerMove = (event: PointerEvent) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      const rect = workspace.getBoundingClientRect();
      const nextHeight = event.clientY - rect.top;
      setStackedSidebarHeight(Math.max(96, Math.min(320, Math.round(nextHeight))));
    };

    const onPointerUp = () => setIsDraggingSidebar(false);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDraggingSidebar, shouldUseStackedLayout]);

  return (
    <div className="pdf-editor-root">
      <div
        className="app"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={handleLocalPickerChange}
        />
        <Toolbar
          canUndo={canUndo}
          hasPages={session.pages.length > 0}
          zoom={zoom}
          currentPage={currentPageIndex}
          totalPages={session.pages.length}
          annotationsVisible={annotationToolbarVisible}
          onOpen={onOpen}
          onMerge={onMerge}
          onDeletePage={onDeletePage}
          onRotateCW={() => rotatePage(currentPageIndex, 90)}
          onRotateCCW={() => rotatePage(currentPageIndex, -90)}
          onExport={() => void onExport()}
          onUndo={undo}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomSet={onZoomSet}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
          onGoToPage={onGoToPage}
          onToggleAnnotations={handleToggleAnnotations}
        />

        <TabBar tabs={tabs} activeTabId={activeTabId} onSelectTab={switchToTab} onCloseTab={closeTab} />

        <SearchBar
          pages={session.pages}
          documents={documentMap}
          visible={searchVisible}
          onClose={() => setSearchVisible(false)}
          onHighlightMatches={handleSearchHighlight}
          onNavigateToPage={handleSearchNavigate}
        />

        <div
          ref={workspaceRef}
          className="workspace"
          style={
            shouldUseStackedLayout
              ? ({ ['--stacked-sidebar-height' as string]: `${stackedSidebarHeight}px` } as Record<string, string>)
              : undefined
          }
        >
          {session.pages.length === 0 ? (
            <WelcomeScreen onOpen={onOpen} />
          ) : (
            <>
              <aside className="sidebar">
                <div className="sidebar-mode-toggle">
                  <button
                    className={sidebarMode === 'thumbnails' ? 'active' : ''}
                    onClick={() => setSidebarMode('thumbnails')}
                  >
                    Pages
                  </button>
                  <button
                    className={sidebarMode === 'bookmarks' ? 'active' : ''}
                    onClick={() => setSidebarMode('bookmarks')}
                  >
                    Bookmarks
                  </button>
                </div>
                {sidebarMode === 'thumbnails' ? (
                  <ThumbnailSidebar
                    pages={session.pages}
                    currentPage={currentPageIndex}
                    renderLabel={(index) => `Page ${index + 1}`}
                    onReorder={reorderPage}
                    onSelectPage={handleThumbnailSelect}
                    onContextMenu={(index, e) => setContextMenu({ x: e.clientX, y: e.clientY, pageIndex: index })}
                  />
                ) : (
                  <OutlineSidebar
                    document={documentMap.get(0)}
                    onNavigateToPage={handleThumbnailSelect}
                  />
                )}
              </aside>
              {shouldUseStackedLayout && (
                <div
                  className="sidebar-resizer"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setIsDraggingSidebar(true);
                  }}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
                <AnnotationToolbar
                  activeMode={annotationMode}
                  color={annotationColor}
                  strokeWidth={annotationStrokeWidth}
                  visible={annotationToolbarVisible}
                  onSetMode={setAnnotationMode}
                  onSetColor={setAnnotationColor}
                  onSetStrokeWidth={setAnnotationStrokeWidth}
                />
                <PDFViewer
                  ref={viewerRef}
                  pages={session.pages}
                  documents={documentMap}
                  currentPage={currentPageIndex}
                  annotationMode={annotationMode}
                  annotationColor={annotationColor}
                  annotationStrokeWidth={annotationStrokeWidth}
                  zoom={zoom}
                  onPageChange={handlePageChange}
                  onCreateAnnotation={(pageIndex, annotation) => addAnnotation(pageIndex, annotation)}
                  onFormFieldChange={setFormFieldValue}

                />
              </div>
            </>
          )}
        </div>

        <footer className="status-bar">
          <span>{busy ? 'Loading files...' : status}</span>
          <span>
            {session.pages.length > 0
              ? `Page ${currentPageIndex + 1}/${session.pages.length} | ${Math.round(zoom * 100)}%`
              : 'No pages loaded'}
          </span>
        </footer>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            items={[
              { label: `Go to Page ${contextMenu.pageIndex + 1}`, onClick: () => { setCurrentPage(contextMenu.pageIndex); viewerRef.current?.scrollToPage(contextMenu.pageIndex); } },
              { label: 'Rotate Right', onClick: () => rotatePage(contextMenu.pageIndex, 90) },
              { label: 'Rotate Left', onClick: () => rotatePage(contextMenu.pageIndex, -90) },
              { label: 'Delete Page', onClick: () => { deletePage(contextMenu.pageIndex); setStatus(`Deleted page ${contextMenu.pageIndex + 1}`); } }
            ]}
          />
        )}
      </div>
    </div>
  );
};

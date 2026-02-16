'use client';

import { useState, useEffect, useCallback, useMemo, type KeyboardEvent } from 'react';

type FakeChromeWindowProps = {
  onBack: () => void;
  compact?: boolean;
  initialView?: ViewState;
  onViewChange?: (view: ViewState) => void;
};

export type ViewState = 'google' | 'portfolio' | 'pdf';

type BrowserTab = {
  id: string;
  view: ViewState;
};

const PDF_EDITOR_URL = '/pdf';

const viewToAddress = (view: ViewState): string => {
  if (view === 'portfolio') return 'cslade.space';
  if (view === 'pdf') return 'cslade.space/pdf';
  return 'google.com';
};

const viewToTitle = (view: ViewState): string => {
  if (view === 'portfolio') return 'Cam Slade — Portfolio';
  if (view === 'pdf') return 'Personal PDF Editor';
  return 'Google';
};

const makeTab = (view: ViewState): BrowserTab => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  view,
});

export function FakeChromeWindow({
  onBack,
  compact = false,
  initialView = 'google',
  onViewChange,
}: FakeChromeWindowProps) {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => [makeTab(initialView)]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? makeTab(initialView).id);
  const [addressBarValue, setAddressBarValue] = useState(viewToAddress(initialView));
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveringTrafficLight, setHoveringTrafficLight] = useState(false);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? null,
    [tabs, activeTabId]
  );
  const currentView: ViewState = activeTab?.view ?? 'google';

  const setActiveView = useCallback((view: ViewState) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === activeTabId ? { ...tab, view } : tab))
    );
    setAddressBarValue(viewToAddress(view));
    if (view === 'google') {
      setSearchQuery('');
    }
  }, [activeTabId]);

  const navigateToPortfolio = useCallback(() => {
    setActiveView('portfolio');
  }, [setActiveView]);

  const navigateToGoogle = useCallback(() => {
    setActiveView('google');
  }, [setActiveView]);

  const navigateToPdfEditor = useCallback(() => {
    setActiveView('pdf');
  }, [setActiveView]);

  const openNewTab = useCallback((view: ViewState = 'google') => {
    const tab = makeTab(view);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
    setAddressBarValue(viewToAddress(view));
    if (view === 'google') {
      setSearchQuery('');
    }
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      if (prev.length === 1) {
        const onlyTab = prev[0];
        if (!onlyTab) return prev;
        setAddressBarValue(viewToAddress('google'));
        setSearchQuery('');
        return [{ ...onlyTab, view: 'google' }];
      }

      const idx = prev.findIndex((tab) => tab.id === tabId);
      if (idx === -1) return prev;

      const nextTabs = prev.filter((tab) => tab.id !== tabId);
      if (tabId === activeTabId) {
        const fallback = nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0];
        if (fallback) {
          setActiveTabId(fallback.id);
          setAddressBarValue(viewToAddress(fallback.view));
          if (fallback.view === 'google') {
            setSearchQuery('');
          }
        }
      }

      return nextTabs;
    });
  }, [activeTabId]);

  useEffect(() => {
    setTabs([makeTab(initialView)]);
  }, [initialView]);

  useEffect(() => {
    if (!tabs.length) {
      const tab = makeTab(initialView);
      setTabs([tab]);
      setActiveTabId(tab.id);
      setAddressBarValue(viewToAddress(initialView));
      return;
    }

    if (!tabs.some((tab) => tab.id === activeTabId)) {
      const first = tabs[0];
      if (first) {
        setActiveTabId(first.id);
        setAddressBarValue(viewToAddress(first.view));
      }
    }
  }, [activeTabId, initialView, tabs]);

  useEffect(() => {
    if (!activeTab) return;
    setAddressBarValue(viewToAddress(activeTab.view));
  }, [activeTab]);

  useEffect(() => {
    onViewChange?.(currentView);
  }, [currentView, onViewChange]);

  const handleBack = useCallback(() => {
    if (currentView !== 'google') {
      navigateToGoogle();
    } else {
      onBack();
    }
  }, [currentView, navigateToGoogle, onBack]);

  const handleSearchKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`, '_blank');
    }
  }, [searchQuery]);

  const handleAddressBarKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && addressBarValue.trim()) {
      const value = addressBarValue.trim();
      let url = value;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  }, [addressBarValue]);

  const openExternal = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  return (
    <div className={compact ? 'w-full h-full' : 'absolute inset-0 z-10 grid place-items-center bg-black/60 p-4'}>
      <section
        className={`overflow-hidden ${compact ? 'w-full' : 'w-full max-w-3xl'}`}
        style={
          compact
            ? {
                height: '100%',
                backgroundColor: '#e9eef6',
                color: '#202124',
                display: 'flex',
                flexDirection: 'column' as const,
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
              }
            : undefined
        }
      >
        <div className="flex items-end px-2 pt-1" style={{ backgroundColor: '#d5e3f8', height: '38px' }}>
          <div
            className="flex items-center gap-2 px-2 pb-2.5"
            onMouseEnter={() => setHoveringTrafficLight(true)}
            onMouseLeave={() => setHoveringTrafficLight(false)}
          >
            <button
              type="button"
              onClick={onBack}
              aria-label="close and go back"
              className="relative h-3 w-3 rounded-full"
              style={{ backgroundColor: '#ff5f57' }}
            >
              {hoveringTrafficLight && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '9px',
                    lineHeight: 1,
                    color: '#8b1f1a',
                    fontWeight: 700,
                  }}
                >
                  ×
                </span>
              )}
            </button>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#989898' }} />
            <button
              type="button"
              onClick={onBack}
              aria-label="zoom out and go back"
              className="relative h-3 w-3 rounded-full"
              style={{ backgroundColor: '#28c840' }}
            >
              {hoveringTrafficLight && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '9px',
                    lineHeight: 1,
                    color: '#0f5b1f',
                    fontWeight: 700,
                  }}
                >
                  ↗
                </span>
              )}
            </button>
          </div>

          <div className="ml-1 flex min-w-0 flex-1 items-end gap-1 pb-0.5">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className="flex items-center gap-2 rounded-t-xl px-3 pb-1.5 pt-1"
                  style={{
                    backgroundColor: isActive ? '#f8fafc' : '#dce7f7',
                    minWidth: '160px',
                    maxWidth: '230px',
                    fontSize: '11px',
                    border: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 8a6 6 0 1112 0A6 6 0 012 8z" fill="#ffffff" />
                    <path d="M8 2a6 6 0 016 6" stroke="#4285f4" strokeWidth="1.4" />
                    <path d="M14 8a6 6 0 01-3 5.2" stroke="#34a853" strokeWidth="1.4" />
                    <path d="M11 13.2A6 6 0 014.9 13" stroke="#fbbc05" strokeWidth="1.4" />
                    <path d="M4.9 13A6 6 0 012 8" stroke="#ea4335" strokeWidth="1.4" />
                  </svg>
                  <span className="truncate" style={{ color: '#202124', fontSize: '12px' }}>{viewToTitle(tab.view)}</span>
                  <span
                    role="button"
                    aria-label="close tab"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab.id);
                    }}
                    style={{ marginLeft: 'auto', lineHeight: 0, padding: '2px', borderRadius: '3px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M4 4l6 6M10 4l-6 6" stroke="#5f6368" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="mb-1.5 ml-0.5 rounded p-1 hover:bg-black/5"
            aria-label="new tab"
            onClick={() => openNewTab('google')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="#5f6368" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e8eaed', width: '100%', boxSizing: 'border-box' }}>
          <button type="button" onClick={handleBack} style={{ borderRadius: '9999px', padding: '6px', border: 'none', background: 'none', cursor: 'pointer' }} aria-label="back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10.5 2.5L5 8l5.5 5.5" stroke="#5f6368" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" style={{ borderRadius: '9999px', padding: '6px', opacity: 0.45, border: 'none', background: 'none' }} aria-label="forward">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M5.5 2.5L11 8l-5.5 5.5" stroke="#5f6368" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" style={{ borderRadius: '9999px', padding: '6px', border: 'none', background: 'none', cursor: 'pointer' }} aria-label="reload">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2.8 8a5.2 5.2 0 019.4-3" stroke="#5f6368" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 2v3h-3" stroke="#5f6368" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div style={{ backgroundColor: '#e8edf5', height: '33px', flex: '1 1 0%', display: 'flex', minWidth: 0, marginLeft: '8px', borderRadius: '9999px', padding: '0 16px', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginRight: '8px' }}>
              <path d="M8 2a2.6 2.6 0 00-2.6 2.6v1H4a2 2 0 00-2 2v4a2 2 0 002 2h8a2 2 0 002-2v-4a2 2 0 00-2-2h-1.4v-1A2.6 2.6 0 008 2zm-1 3v-.4a1 1 0 012 0V5H7z" fill="#5f6368" opacity="0.85" />
            </svg>
            <input
              type="text"
              value={addressBarValue}
              onChange={(e) => setAddressBarValue(e.target.value)}
              onKeyDown={handleAddressBarKeyDown}
              style={{ color: '#202124', fontSize: '13px', flex: '1 1 0%', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit' }}
            />
          </div>

          <button type="button" style={{ flexShrink: 0, borderRadius: '9999px', padding: '6px', border: 'none', background: 'none', cursor: 'pointer' }} aria-label="search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="#5f6368" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="#5f6368" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <div style={{ width: '1px', height: '18px', backgroundColor: '#d2d6dc', flexShrink: 0 }} />
          <button type="button" style={{ borderColor: '#b6bcc8', fontSize: '12px', color: '#3c4043', flexShrink: 0, borderRadius: '9999px', border: '1px solid #b6bcc8', padding: '4px 12px', background: 'none', cursor: 'pointer' }}>
            Guest
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 12px', backgroundColor: '#ffffff', borderBottom: '1px solid #eceff1', height: '28px', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={navigateToPortfolio}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '4px', padding: '2px 8px', color: '#5f6368', fontSize: '11px', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M2 4a2 2 0 012-2h3l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" fill="#5f6368" opacity="0.5" />
            </svg>
            Portfolio
          </button>
          <button
            type="button"
            onClick={navigateToPdfEditor}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '4px', padding: '2px 8px', color: '#5f6368', fontSize: '11px', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M4 2h6l3 3v9a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#5f6368" opacity="0.5" />
              <path d="M10 2v3h3" stroke="#ffffff" strokeWidth="1" />
            </svg>
            PDF Editor
          </button>
        </div>

        <div style={{ backgroundColor: '#ffffff', flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {currentView === 'google' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#202124', fontSize: '12px' }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://about.google')}>About</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://store.google.com')}>Store</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#202124', fontSize: '13px' }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://mail.google.com')}>Gmail</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://images.google.com')}>Images</span>
                  <button type="button" style={{ borderRadius: '9999px', padding: '6px', border: 'none', background: 'none' }} aria-label="apps">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="3" cy="3" r="1.3" fill="#5f6368" />
                      <circle cx="8" cy="3" r="1.3" fill="#5f6368" />
                      <circle cx="13" cy="3" r="1.3" fill="#5f6368" />
                      <circle cx="3" cy="8" r="1.3" fill="#5f6368" />
                      <circle cx="8" cy="8" r="1.3" fill="#5f6368" />
                      <circle cx="13" cy="8" r="1.3" fill="#5f6368" />
                      <circle cx="3" cy="13" r="1.3" fill="#5f6368" />
                      <circle cx="8" cy="13" r="1.3" fill="#5f6368" />
                      <circle cx="13" cy="13" r="1.3" fill="#5f6368" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => openExternal('https://accounts.google.com')} style={{ borderRadius: '9999px', padding: '8px 16px', backgroundColor: '#1a73e8', color: '#ffffff', fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                    Sign in
                  </button>
                </div>
              </div>

              <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '80px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', maxWidth: '600px', padding: '0 16px', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '92px', lineHeight: 1, letterSpacing: '-2px', fontFamily: 'Product Sans, Arial, sans-serif', fontWeight: 400 }}>
                    <span style={{ color: '#4285f4' }}>G</span>
                    <span style={{ color: '#ea4335' }}>o</span>
                    <span style={{ color: '#fbbc05' }}>o</span>
                    <span style={{ color: '#4285f4' }}>g</span>
                    <span style={{ color: '#34a853' }}>l</span>
                    <span style={{ color: '#ea4335' }}>e</span>
                  </div>

                  <div style={{ display: 'flex', width: '100%', alignItems: 'center', borderRadius: '9999px', border: '1px solid #dfe1e5', padding: '0 16px', backgroundColor: '#ffffff', boxShadow: '0 1px 6px rgba(32,33,36,0.18)', height: '44px', boxSizing: 'border-box' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginRight: '12px' }}>
                      <path d="M10 4v12M4 10h12" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search Google or type a URL"
                      style={{ flex: '1 1 0%', border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#202124', padding: 0, fontFamily: 'inherit' }}
                    />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '8px', cursor: 'pointer' }}>
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="#4285f4" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="#34a853" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M12 19v4M8 23h8" stroke="#ea4335" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '12px', cursor: 'pointer' }}>
                      <circle cx="12" cy="12" r="7" stroke="#4285f4" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3" stroke="#ea4335" strokeWidth="1.5" />
                      <path d="M19 5l2-2" stroke="#fbbc05" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <button type="button" style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '9999px', padding: '6px 12px', backgroundColor: '#f1f3f4', color: '#202124', fontSize: '13px', flexShrink: 0, border: 'none', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z" fill="#5f6368" />
                      </svg>
                      AI Mode
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => { if (searchQuery.trim()) window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`, '_blank'); }}
                      style={{ borderRadius: '4px', padding: '8px 16px', backgroundColor: '#f8f9fa', color: '#202124', fontSize: '13px', border: '1px solid #f8f9fa', cursor: 'pointer' }}
                    >
                      Google Search
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (searchQuery.trim()) window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}&btnI`, '_blank'); else window.open('https://doodles.google/search/', '_blank'); }}
                      style={{ borderRadius: '4px', padding: '8px 16px', backgroundColor: '#f8f9fa', color: '#202124', fontSize: '13px', border: '1px solid #f8f9fa', cursor: 'pointer' }}
                    >
                      I&apos;m Feeling Lucky
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '42px', backgroundColor: '#f2f2f2', color: '#202124', fontSize: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://ads.google.com')}>Advertising</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://smallbusiness.withgoogle.com')}>Business</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://google.com/search/howsearchworks')}>How Search works</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://policies.google.com/privacy')}>Privacy</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => openExternal('https://policies.google.com/terms')}>Terms</span>
                  <span style={{ cursor: 'pointer' }}>Settings</span>
                </div>
              </div>
            </>
          ) : currentView === 'portfolio' ? (
            <iframe
              src="/portfolio"
              title="Portfolio"
              style={{ width: '100%', flex: '1 1 0%', border: 'none', minHeight: 0 }}
            />
          ) : (
            <iframe
              src={PDF_EDITOR_URL}
              title="PDF Editor"
              style={{ width: '100%', flex: '1 1 0%', border: 'none', minHeight: 0, backgroundColor: '#ffffff' }}
            />
          )}
        </div>
      </section>
    </div>
  );
}

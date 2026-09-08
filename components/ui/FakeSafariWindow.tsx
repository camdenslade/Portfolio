'use client';

import { useState, useCallback, useEffect, type KeyboardEvent } from 'react';

export type SafariViewState = 'newtab' | 'portfolio' | 'pdf' | 'lacrosse';

type Props = { onBack: () => void };

const IFRAME_SRCS: Partial<Record<SafariViewState, string>> = {
  portfolio: 'https://cslade.space/portfolio?embed=true',
  pdf: 'https://cslade.space/pdf',
  lacrosse: 'https://missouristatelacrosse.com',
};

const VIEW_URLS: Record<SafariViewState, string> = {
  newtab: '',
  portfolio: 'cslade.space',
  pdf: 'cslade.space/pdf',
  lacrosse: 'missouristatelacrosse.com',
};

const URL_TO_VIEW: Record<string, SafariViewState> = {
  'cslade.space': 'portfolio',
  'www.cslade.space': 'portfolio',
  'cslade.space/portfolio': 'portfolio',
  'cslade.space/pdf': 'pdf',
  'missouristatelacrosse.com': 'lacrosse',
  'www.missouristatelacrosse.com': 'lacrosse',
};

function useTime() {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/ [AP]M$/, '');
  const [t, setT] = useState(() => fmt(new Date()));
  useEffect(() => {
    const id = setInterval(() => setT(fmt(new Date())), 15000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function StatusBar({ time }: { time: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px 0', height: '59px', flexShrink: 0, boxSizing: 'border-box' }}>
      <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.3px', color: '#000' }}>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="8" width="3" height="4" rx="1" fill="black" />
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="1" fill="black" />
          <rect x="9" y="3" width="3" height="9" rx="1" fill="black" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="black" />
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <circle cx="8" cy="10.5" r="1.5" fill="black" />
          <path d="M4.2 7.3a5.3 5.3 0 017.6 0" stroke="black" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M1.5 4.8A8.9 8.9 0 0114.5 4.8" stroke="black" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          <div style={{ width: '25px', height: '12px', border: '1.5px solid black', borderRadius: '3.5px', padding: '2px', boxSizing: 'border-box' }}>
            <div style={{ width: '65%', height: '100%', backgroundColor: 'black', borderRadius: '1px' }} />
          </div>
          <div style={{ width: '2px', height: '5px', backgroundColor: 'black', borderRadius: '0 1px 1px 0', opacity: 0.4 }} />
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, onKeyDown, onFocus }: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
}) {
  return (
    <div style={{ padding: '8px 16px 12px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e5e5ea', borderRadius: '12px', padding: '8px 14px', gap: '8px' }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="9" cy="9" r="6" stroke="#8e8e93" strokeWidth="1.8" />
          <path d="M13.5 13.5L17 17" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          placeholder="Search or enter website name"
          style={{
            flex: '1 1 0%', border: 'none', outline: 'none', background: 'transparent',
            fontSize: '15px', color: '#000', fontFamily: 'inherit', padding: 0,
          }}
        />
        {!value && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" fill="#8e8e93" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 19v3" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

type FavItem = { label: string; view: SafariViewState; icon: React.ReactNode };

const FAVOURITES: FavItem[] = [
  {
    label: 'Portfolio',
    view: 'portfolio',
    icon: (
      <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg,#1a73e8,#0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8" />
          <path d="M3 12h18M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9" stroke="white" strokeWidth="1.4" />
        </svg>
      </div>
    ),
  },
  {
    label: 'MSU Lacrosse',
    view: 'lacrosse',
    icon: (
      <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg,#6d1a1a,#4a1010)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.6" />
          <path d="M7 7l10 10M17 7L7 17" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          <circle cx="12" cy="12" r="2.5" fill="white" />
        </svg>
      </div>
    ),
  },
];

function NewTabPage({ onNavigate }: { onNavigate: (view: SafariViewState) => void }) {
  return (
    <div style={{ flex: '1 1 0%', overflowY: 'auto', backgroundColor: '#f2f2f7', padding: '8px 16px 16px' }}>
      {/* Favourites */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '17px', fontWeight: 600, color: '#000' }}>Favourites</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {FAVOURITES.map((fav) => (
            <button
              key={fav.view}
              type="button"
              onClick={() => onNavigate(fav.view)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '72px' }}
            >
              {fav.icon}
              <span style={{ fontSize: '11px', color: '#3c3c43', textAlign: 'center', lineHeight: 1.2 }}>{fav.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottomToolbar({ canGoBack, onBack, onShare }: { canGoBack: boolean; onBack: () => void; onShare: () => void }) {
  const btn = (label: string, disabled: boolean, onClick: () => void, children: React.ReactNode) => (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
      style={{ background: 'none', border: 'none', padding: '10px 0', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1, flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {children}
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid #c8c8cc', backgroundColor: '#f9f9f9', paddingBottom: '20px', flexShrink: 0 }}>
      {btn('Back', !canGoBack, onBack,
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      {btn('Forward', true, () => {},
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      {btn('Share', false, onShare,
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M8 7l4-4 4 4" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 13v7h14v-7" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      {btn('Bookmarks', false, () => {},
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 5h14v16l-7-4-7 4V5z" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      {btn('Tabs', false, () => {},
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="8" width="11" height="12" rx="2" stroke="black" strokeWidth="1.8" /><path d="M8 8V6a2 2 0 012-2h7a2 2 0 012 2v10a2 2 0 01-2 2h-2" stroke="black" strokeWidth="1.8" strokeLinecap="round" /></svg>
      )}
    </div>
  );
}

export function FakeSafariWindow({ onBack }: Props) {
  const time = useTime();
  const [view, setView] = useState<SafariViewState>('newtab');
  const [addressBar, setAddressBar] = useState('');

  // Receive postMessage from embedded iframes (iOS blocks window.open in sandboxed iframes)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'open-url' && typeof e.data.url === 'string') {
        window.open(e.data.url, '_blank', 'noopener,noreferrer');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const navigate = useCallback((v: SafariViewState) => {
    setView(v);
    setAddressBar(v === 'newtab' ? '' : VIEW_URLS[v]);
  }, []);

  const handleBack = useCallback(() => {
    if (view !== 'newtab') {
      navigate('newtab');
    } else {
      onBack();
    }
  }, [view, navigate, onBack]);

  const handleAddressKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const raw = addressBar.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const matched = URL_TO_VIEW[raw];
    if (matched) {
      navigate(matched);
    } else if (raw) {
      window.open(`https://${raw}`, '_blank');
    }
  }, [addressBar, navigate]);

  const iframeSrc = view !== 'newtab' ? IFRAME_SRCS[view] : undefined;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f2f2f7', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      <StatusBar time={time} />
      <SearchBar
        value={addressBar}
        onChange={setAddressBar}
        onKeyDown={handleAddressKeyDown}
        onFocus={() => { if (view !== 'newtab') setAddressBar(VIEW_URLS[view]); }}
      />

      {iframeSrc ? (
        <iframe
          src={iframeSrc}
          title={view}
          style={{ flex: '1 1 0%', border: 'none', minHeight: 0 }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      ) : (
        <NewTabPage onNavigate={navigate} />
      )}

      <BottomToolbar
        canGoBack={true}
        onBack={handleBack}
        onShare={() => { if (iframeSrc) window.open(iframeSrc, '_blank'); }}
      />
    </div>
  );
}

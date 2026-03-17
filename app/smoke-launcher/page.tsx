'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: 'Auto-detect Steam games',
    desc: 'Installed games appear in your library automatically when Steam closes - no manual setup.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: 'Wine + DXVK built in',
    desc: 'Ships with a managed Wine bottle. Toggle DXVK (DirectX → Metal) and ESync per-bottle.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Steam artwork everywhere',
    desc: 'Game icons and hero art pulled from Valve\'s CDN automatically once your App ID is known.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Isolated Wine bottles',
    desc: 'Each bottle is a sandboxed Windows environment - separate registry, drivers, and settings.',
  },
];

function SmokeLauncherPage() {
  const searchParams = useSearchParams();
  const embed = searchParams.get('embed') === 'true';

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #0f0f14 0%, #12121a 60%, #0a0a10 100%)',
        color: '#e8e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Nav */}
      {!embed && (
        <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/portfolio" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Portfolio</a>
        </nav>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: embed ? '28px 20px 20px' : '56px 24px 48px', boxSizing: 'border-box', maxWidth: '780px', margin: '0 auto', width: '100%' }}>

        {/* Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', width: '100%' }}>
          <div style={{ width: embed ? '52px' : '72px', height: embed ? '52px' : '72px', borderRadius: embed ? '14px' : '18px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/smoke-launcher/smoke-transparent.png"
              alt="Smoke Launcher"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) parent.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="12" cy="8" r="4"/></svg>';
              }}
            />
          </div>

          <div>
            <h1 style={{ fontSize: embed ? '26px' : '38px', fontWeight: 700, letterSpacing: '-0.5px', margin: 0, color: '#ffffff' }}>
              Smoke Launcher
            </h1>
            <p style={{ marginTop: '8px', fontSize: embed ? '13px' : '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '480px', lineHeight: 1.5 }}>
              A native macOS launcher for Windows games via Wine<br />with a liquid glass UI and Steam integration.
            </p>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {['macOS 13+', 'Apple Silicon', 'Open Source'].map((badge) => (
              <span key={badge} style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '9999px', padding: '3px 10px' }}>
                {badge}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href="https://buy.stripe.com/dRm28rcGg8sHesRcbh5c400"
              style={{
                marginTop: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(99,102,241,0.85)',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '10px',
                padding: embed ? '9px 22px' : '11px 28px',
                fontSize: embed ? '13px' : '15px',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Buy for Mac - $5
            </a>
            <a
              href="https://github.com/camdenslade/Smoke-Launcher"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                borderRadius: '10px',
                padding: embed ? '9px 18px' : '11px 22px',
                fontSize: embed ? '13px' : '15px',
                fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              View Source
            </a>
          </div>
        </div>

        {/* Features */}
        <div style={{ marginTop: embed ? '28px' : '52px', width: '100%', display: 'grid', gridTemplateColumns: embed ? '1fr 1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: embed ? '14px' : '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ color: 'rgba(99,102,241,0.9)' }}>{f.icon}</div>
              <p style={{ margin: 0, fontSize: embed ? '12px' : '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{f.title}</p>
              <p style={{ margin: 0, fontSize: embed ? '11px' : '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stack */}
        {!embed && (
          <div style={{ marginTop: '40px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {['Swift', 'SwiftUI', 'Wine', 'DXVK', 'Steam CDN'].map((t) => (
              <span key={t} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '2px 8px' }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {!embed && (
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 24px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>© 2026 Camden Slade</p>
        </footer>
      )}
    </main>
  );
}

export default function SmokeLauncherRoute() {
  return (
    <Suspense>
      <SmokeLauncherPage />
    </Suspense>
  );
}

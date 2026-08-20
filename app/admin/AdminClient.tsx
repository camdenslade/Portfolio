'use client';

import { useEffect, useState } from 'react';
import { kimbuLogin, kimbuRefresh, KimbuTokens } from '../../lib/kimbu';

const SET_BADGE_URL = process.env.NEXT_PUBLIC_SET_BADGE_URL ?? '';
const GET_BADGE_URL = process.env.NEXT_PUBLIC_GET_BADGE_URL ?? '';

const ALL_BADGES = [
  'Live', 'In Progress', 'iOS', 'Android', 'macOS',
  'TestFlight', 'Open Source', 'Startup', 'NonProfit',
];

const ALL_PROJECTS: { name: string; category: string }[] = [
  { name: 'Even Dating',             category: 'Flagship Projects' },
  { name: 'Versa',                   category: 'Flagship Projects' },
  { name: 'Missouri State Lacrosse', category: 'Flagship Projects' },
  { name: 'TabUp',                   category: 'Mobile Apps' },
  { name: 'Smoke Launcher',          category: 'Desktop' },
  { name: 'Kimbu',                   category: 'Infrastructure' },
  { name: 'Binate',                  category: 'Open Source & Research' },
  { name: 'Glyph',                   category: 'Open Source & Research' },
  { name: 'Nova Dom',                category: 'Open Source & Research' },
];

type Overrides = Record<string, string[]>;

function getStoredTokens(): KimbuTokens | null {
  try {
    const raw = localStorage.getItem('admin_tokens');
    return raw ? JSON.parse(raw) as KimbuTokens : null;
  } catch { return null; }
}

function storeTokens(tokens: KimbuTokens) {
  localStorage.setItem('admin_tokens', JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem('admin_tokens');
}

// ── Login screen ──────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (tokens: KimbuTokens) => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await kimbuLogin(email, password);
      onLogin(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Portfolio Admin</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sign in</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 transition hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">Secured by Kimbu</p>
      </div>
    </div>
  );
}

// ── Badge toggle ──────────────────────────────────────────────────────────────

function BadgeToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

// ── Custom tag input ──────────────────────────────────────────────────────────

function CustomTagInput({ projectName, activeBadges, onAdd }: {
  projectName: string;
  activeBadges: string[];
  onAdd: (projectName: string, tag: string) => void;
}) {
  const [value, setValue] = useState('');

  function commit() {
    const tag = value.trim();
    if (!tag || activeBadges.includes(tag)) { setValue(''); return; }
    onAdd(projectName, tag);
    setValue('');
  }

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        placeholder="Custom tag…"
        className="rounded-full border border-gray-200 dark:border-gray-700 bg-transparent px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-gray-400 dark:focus:border-gray-500 w-28"
      />
      <button
        onClick={commit}
        className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        Add
      </button>
    </div>
  );
}

// ── Main admin panel ──────────────────────────────────────────────────────────

function AdminPanel({ tokens, onLogout }: { tokens: KimbuTokens; onLogout: () => void }) {
  const [overrides, setOverrides]   = useState<Overrides>({});
  const [original, setOriginal]     = useState<Overrides>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [status, setStatus]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetch(GET_BADGE_URL)
      .then(r => r.json())
      .then((data: { overrides: Overrides }) => {
        setOverrides(data.overrides ?? {});
        setOriginal(data.overrides ?? {});
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleBadge(projectName: string, badge: string) {
    setOverrides(prev => {
      const current = prev[projectName] ?? [];
      const next = current.includes(badge)
        ? current.filter(b => b !== badge)
        : [...current, badge];
      return { ...prev, [projectName]: next };
    });
    setStatus(null);
  }

  function addCustomTag(projectName: string, tag: string) {
    setOverrides(prev => {
      const current = prev[projectName] ?? [];
      if (current.includes(tag)) return prev;
      return { ...prev, [projectName]: [...current, tag] };
    });
    setStatus(null);
  }

  function removeTag(projectName: string, tag: string) {
    setOverrides(prev => {
      const current = prev[projectName] ?? [];
      return { ...prev, [projectName]: current.filter(b => b !== tag) };
    });
    setStatus(null);
  }

  const isDirty = JSON.stringify(overrides) !== JSON.stringify(original);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      let currentTokens = tokens;
      // Proactively refresh if near expiry
      const stored = getStoredTokens();
      if (stored) {
        try {
          currentTokens = await kimbuRefresh(stored.refreshToken);
          storeTokens(currentTokens);
        } catch { /* use existing token */ }
      }

      const res = await fetch(SET_BADGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentTokens.accessToken}`,
        },
        body: JSON.stringify({ overrides }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Save failed (${res.status})`);
      }

      setOriginal(overrides);
      setStatus({ type: 'success', msg: 'Saved' });
    } catch (err) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  const byCategory: Record<string, typeof ALL_PROJECTS> = {};
  for (const p of ALL_PROJECTS) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  }

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3.5">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500">Portfolio Admin</p>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Badge Editor</h1>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <span className={`text-xs ${status.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {status.msg}
              </span>
            )}
            <button
              onClick={save} disabled={saving || !isDirty}
              className="rounded-lg bg-gray-900 dark:bg-gray-100 px-3 py-1.5 text-xs font-medium text-white dark:text-gray-900 transition hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              onClick={onLogout}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-5 py-8 space-y-8">
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
        ) : (
          Object.entries(byCategory).map(([category, projects]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">{category}</p>
              <div className="space-y-4">
                {projects.map(p => {
                  const activeBadges = overrides[p.name] ?? [];
                  return (
                    <div
                      key={p.name}
                      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3.5"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{p.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_BADGES.map(badge => (
                          <BadgeToggle
                            key={badge}
                            label={badge}
                            active={activeBadges.includes(badge)}
                            onClick={() => toggleBadge(p.name, badge)}
                          />
                        ))}
                      </div>
                      {activeBadges.filter(b => !ALL_BADGES.includes(b)).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          {activeBadges.filter(b => !ALL_BADGES.includes(b)).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                              {tag}
                              <button onClick={() => removeTag(p.name, tag)} className="hover:text-indigo-900 dark:hover:text-indigo-100 leading-none">✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <CustomTagInput projectName={p.name} activeBadges={activeBadges} onAdd={addCustomTag} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AdminClient() {
  const [tokens, setTokens] = useState<KimbuTokens | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = getStoredTokens();
    if (stored) setTokens(stored);
    setChecked(true);
  }, []);

  function handleLogin(t: KimbuTokens) {
    storeTokens(t);
    setTokens(t);
  }

  function handleLogout() {
    clearTokens();
    setTokens(null);
  }

  if (!checked) return null;
  if (!tokens) return <LoginForm onLogin={handleLogin} />;
  return <AdminPanel tokens={tokens} onLogout={handleLogout} />;
}

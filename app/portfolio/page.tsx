'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// Data

const FLAGSHIP_PROJECTS = [
  {
    name: 'Even Dating',
    initials: 'EV',
    logo: '/logos/even.png',
    role: 'Founder & Lead Developer',
    period: 'Dec 2025 - Present',
    badges: ['iOS', 'Live', 'Startup'],
    summary:
      'Founder and lead developer of a location-based dating app for college communities, live on the App Store and actively deployed. Designed custom Cognito auth flows, real-time swipe matching, and a Redis-backed queue system. Deployed and iterating on scalable production infrastructure on AWS.',
    stack: ['Swift', 'SwiftUI', 'NestJS', 'PostgreSQL', 'AWS (Cognito, SNS, S3, EC2)', 'Redis'],
    links: [{ label: 'App Store', href: 'https://apps.apple.com/us/app/even-dating/id6756533343' }, { label: 'Details', href: '/portfolio/projects/even-dating' }],
  },
  {
    name: 'Versa',
    initials: 'VS',
    logo: '/logos/Versa.png',
    role: 'Developer',
    period: 'Apr 2026 - Present',
    badges: ['In Progress', 'iOS'],
    summary:
      'A real-time collaborative sync architecture built on top of Loro CRDTs. A single Rust core compiles to both a Swift XCFramework (via UniFFI) and a WASM module (via wasm-bindgen), sharing identical conflict-resolution logic across iOS and web. A stateless Go WebSocket relay fans out binary diffs; each client merges them locally using version vectors so only deltas travel the wire.',
    stack: ['Go', 'Rust', 'Swift', 'SwiftUI', 'UniFFI', 'WASM', 'wasm-bindgen', 'Loro CRDTs', 'PostgreSQL'],
    links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/versa' }, { label: 'Details', href: '/portfolio/projects/versa' }],
  },
  {
    name: 'Binate',
    initials: 'BN',
    logo: '/logos/Binate.png',
    role: 'Author',
    period: null,
    badges: ['Open Source', 'Rust'],
    summary:
      'A semantic binary diff tool that compares Rust binaries by masking known sources of non-determinism (build IDs, timestamps, absolute paths), then maps changed byte ranges back to source symbols and file locations via DWARF debug info. Used for build reproducibility validation in CI pipelines.',
    stack: ['Rust', 'gimli (DWARF)', 'iced-x86', 'rayon', 'object', 'memmap2'],
    links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/binate' }, { label: 'Details', href: '/portfolio/projects/binate' }],
  },
];

const PROJECT_CATEGORIES = [
  {
    label: 'Mobile Apps',
    projects: [
      {
        name: 'TabUp',
        initials: 'TU',
        logo: '/logos/tabup.png',
        role: 'Team Lead · API & Deployment Engineer',
        period: 'Jan 2026 - May 2026',
        badges: ['React Native', 'TestFlight'],
        summary:
          'Bill-splitting app focused on real-world usability, including receipt capture, flexible split logic, and payout-aware reminders without directly handling funds.',
        stack: ['React Native', 'Expo', 'TypeScript', 'NestJS', 'PostgreSQL', 'AWS', 'Firebase Auth', 'Twilio SMS'],
        links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/TabUp' }, { label: 'TestFlight', href: 'https://testflight.apple.com/join/HZDcwfxr' }, { label: 'Details', href: '/portfolio/projects/tabup' }],
      },
    ],
  },
  {
    label: 'Web Platforms',
    projects: [
      {
        name: 'Missouri State Lacrosse',
        initials: 'ML',
        logo: '/logos/mostate.png',
        role: 'Technology Chair · Developer',
        period: 'Sep 2025 - Present',
        badges: ['Live', 'NonProfit'],
        summary:
          'Built and maintained a full-stack platform serving the Missouri State University lacrosse community, including players, coaches, alumni, and family across both teams. Supports media streaming, roster management, and e-commerce for active team operations, including payment processing and merchandise fulfillment integrations.',
        stack: ['React', 'Spring Boot', 'Firebase Auth', 'Cloudflare', 'AWS (EC2, SES, S3)'],
        links: [
          { label: 'Site', href: 'https://missouristatelacrosse.com' },
          { label: 'GitHub', href: 'https://github.com/camdenslade/missouristatelacrosse' },
          { label: 'Details', href: '/portfolio/projects/missouri-state-lacrosse' },
        ],
      },
    ],
  },
  {
    label: 'Desktop',
    projects: [
      {
        name: 'Smoke Launcher',
        initials: 'SL',
        logo: '/logos/smoke-transparent.png',
        role: 'Author',
        period: 'Mar 2026 - Present',
        badges: ['Live', 'macOS', 'Open Source'],
        summary:
          'Native macOS launcher that enables running Windows games via Wine, abstracting the full Wine compatibility layer into a user-friendly SwiftUI interface. Features automated Steam ACF manifest parsing, per-bottle DXVK/ESync configuration, and dynamic asset fetching from Steam CDN.',
        stack: ['Swift', 'SwiftUI', 'Wine', 'DXVK', 'Steam CDN'],
        links: [
          { label: 'GitHub', href: 'https://github.com/camdenslade/Smoke-Launcher' },
          { label: 'Details', href: '/portfolio/projects/smoke-launcher' },
        ],
      },
    ],
  },
  {
    label: 'Infrastructure',
    projects: [
      {
        name: 'Kimbu',
        initials: 'KB',
        logo: '/logos/Kimbu.png',
        role: 'Author',
        period: null,
        badges: ['In Progress'],
        summary:
          'A multi-tenant authentication platform built as an Auth0 alternative. Provides JWT lifecycle with refresh token rotation, Argon2id password hashing, SMS OTP, OAuth, RBAC, and full audit logging. Stateless design with Redis for ephemeral state and PostgreSQL for permanent records.',
        stack: ['TypeScript', 'NestJS', 'PostgreSQL', 'Redis', 'Docker', 'JWT', 'Argon2'],
        links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/kimbu' }, { label: 'Details', href: '/portfolio/projects/kimbu' }],
      },
    ],
  },
  {
    label: 'Open Source & Research',
    projects: [
      {
        name: 'Binate GPU',
        initials: 'BG',
        logo: '/logos/Binate-GPU.png',
        role: 'Author',
        period: null,
        badges: ['In Progress', 'Rust'],
        summary:
          'A GPU-accelerated reactive UI framework for Rust. Renders a declarative View tree via wgpu with SDF rounded-rect shaders, cosmic-text glyph atlas, Taffy flexbox layout, and signal-based reactivity. Optional macOS native bridge via objc2.',
        stack: ['Rust', 'wgpu', 'WGSL', 'winit', 'taffy', 'cosmic-text', 'objc2'],
        links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/binate-gpu' }, { label: 'Details', href: '/portfolio/projects/binate-gpu' }],
      },
      {
        name: 'Nova Dom',
        initials: 'ND',
        logo: '/logos/nova-dom.png',
        role: 'Author',
        period: null,
        badges: ['Open Source'],
        summary:
          'Open-source DOM editing engine for React that enables visual editing and no-code tooling through a flat document tree architecture with efficient diffing and undo/redo systems.',
        stack: ['TypeScript', 'React 19', 'Zustand', 'Vite'],
        links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/nova-dom' }, { label: 'Details', href: '/portfolio/projects/nova-dom' }],
      },
    ],
  },
  { label: 'Contributions',
    projects: [
      {
        name: 'Loro',
        initials: 'LR',
        logo: '/logos/Loro.svg',
        role: 'Contributor',
        period: null,
        badges: ['Open Source'],
        summary:
          'A collaborative editing library for building real-time applications with conflict-free replicated data types (CRDTs).',
        stack: ['Rust'],
        links: [{ label: 'GitHub', href: 'https://github.com/loro-dev/loro' }, { label: 'Details', href: 'https://loro.dev/' }],
      }
    ],
  },
];

const EXPERIENCE = [
  {
    role: 'Grading Assistant',
    company: 'Missouri State University · Dept. of Mathematics',
    period: 'Aug 2025 - Dec 2025',
    detail:
      'Graded MTH 345, Statistics for Scientists and Engineers, with a focus on standard probability and statistical distributions.',
  },
] as const;

const HIGHLIGHTS = [
  'Built and shipped a live App Store dating app as sole founder - custom auth, real-time matching, and AWS infrastructure',
  'Designed a real-time sync architecture on top of Loro CRDTs, compiling a single Rust core to both a Swift XCFramework and a WASM module',
  'Built a semantic binary diff tool that maps changed byte ranges back to source symbols via DWARF debug info',
  'Built a GPU-accelerated UI framework from scratch in Rust using wgpu, SDF shaders, and a shelf-packed glyph atlas',
] as const;

// Icons

function ArrowUpRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

// Badge colors

const BADGE_STYLE = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
const BADGE_STYLES: Record<string, string> = {
  'Live':                   BADGE_STYLE,
  'Startup':                BADGE_STYLE,
  'Open Source':            BADGE_STYLE,
  'NonProfit':              BADGE_STYLE,
  'iOS':                    BADGE_STYLE,
  'React Native':           BADGE_STYLE,
  'Android':                BADGE_STYLE,
  'macOS':                  BADGE_STYLE,
  'TestFlight':             BADGE_STYLE,
  'In Progress':            BADGE_STYLE,
  'Go':                     BADGE_STYLE,
  'Rust':                   BADGE_STYLE,
  'React':                  BADGE_STYLE,
  'No Longer Maintained':   BADGE_STYLE,
};

// Project row

type Project = {
  name: string;
  initials: string;
  logo: string | null;
  role: string;
  period: string | null;
  badges: string[];
  summary: string;
  stack: string[];
  links: { label: string; href: string }[];
};

function ProjectRow({ project, badges }: { project: Project; badges: string[] }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {project.logo ? (
          <img src={project.logo} alt={project.name} className="h-full w-full object-cover rounded-lg" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-600">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="font-semibold">{project.name}</h4>
          <div className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <span key={b} className={`rounded px-2 py-0.5 text-[10px] font-medium ${BADGE_STYLES[b] ?? BADGE_STYLE}`}>
                {b}
              </span>
            ))}
          </div>
          {project.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('/') ? undefined : '_blank'}
              rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}
              className="inline-flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {link.label} <ArrowUpRight />
            </a>
          ))}
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {project.role}{project.period ? ` · ${project.period}` : ''}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{project.summary}</p>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{project.stack.join(' · ')}</p>
      </div>
    </div>
  );
}

// Component

const GET_BADGE_URL = process.env.NEXT_PUBLIC_GET_BADGE_URL ?? '';

function useBadgeOverrides() {
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});
  useEffect(() => {
    fetch(GET_BADGE_URL)
      .then(r => r.ok ? r.json() : { overrides: {} })
      .then((data: { overrides: Record<string, string[]> }) => setOverrides(data.overrides ?? {}))
      .catch(() => {});
  }, []);
  return overrides;
}

function PortfolioPage() {
  const searchParams = useSearchParams();
  const embed = searchParams.get('embed') === 'true';
  const badgeOverrides = useBadgeOverrides();

  const [dark, setDark] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  function toggleCategory(label: string) {
    setOpenCategories(prev => ({ ...prev, [label]: !prev[label] }));
  }

  // Init from localStorage / system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  // Intercept external links in embed mode (sandboxed iframe on iOS)
  useEffect(() => {
    if (!embed) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      e.preventDefault();
      window.parent.postMessage({ type: 'open-url', url: href }, '*');
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [embed]);

  return (
    <main className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">

      {/* ── Nav ── */}
      <nav className="border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex max-w-2xl items-center gap-6 px-5 py-3.5 md:px-6">
          <Link href="/portfolio" className="flex items-center">
            <img src="/logos/csportfoliolight.png" alt="CS" className="h-8 w-auto dark:hidden" />
            <img src="/logos/csportfoliowhite.png" alt="CS" className="h-8 w-auto hidden dark:block" />
          </Link>
          <a href="https://github.com/camdenslade" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            GitHub
          </a>
          <a href="https://linkedin.com/in/camden-slade-230157155" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            LinkedIn
          </a>
          <a href="mailto:csladedev@outlook.com"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            Email
          </a>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            {!embed && (
              <Link href="/"
                className="text-sm text-gray-400 transition-colors hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100">
                3D
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-5 py-12 md:px-6 md:py-16">

        {/* ── Hero ── */}
        <section>
          <div className="flex items-center gap-5">
            <img
              src="/IMG_0788.png"
              alt="Cam Slade"
              className="h-20 w-20 flex-shrink-0 rounded-full object-cover object-top"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Cam Slade</h1>
              <p className="mt-1 text-[0.9375rem] text-gray-500 dark:text-gray-400">
                CS &amp; Mathematics · Missouri State University · Springfield, MO
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-400">
            Full-stack and systems developer. I build and deploy production applications, distributed infrastructure, and low-level tooling; spanning from an App Store startup to a Rust-based CRDT sync engine and a GPU-accelerated UI framework.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <p className="text-sm font-semibold text-black tracking-wide py-0.2">Top Languages:</p>
            {(['TypeScript', 'Rust', 'Swift'] as const).map(lang => (
              <span key={lang} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {lang}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/CamdenSladeResume.pdf"
              download
              className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Resume
            </a>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="mt-14">
          <h2 className="text-xl font-bold">Flagship Projects</h2>

          {/* Flagships */}
          <div className="mt-8 flex flex-col gap-6">
            {FLAGSHIP_PROJECTS.map((project) => {
              const badges = badgeOverrides[project.name] ?? project.badges;
              return (
                <ProjectRow key={project.name} project={project} badges={badges} />
              );
            })}
          </div>

          {/* Collapsible categories */}
          <div className="mt-10 flex flex-col gap-2">
            {PROJECT_CATEGORIES.map((cat) => {
              const isOpen = !!openCategories[cat.label];
              return (
                <div key={cat.label} className="border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => toggleCategory(cat.label)}
                    className="flex w-full items-center justify-between py-3 text-left"
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {cat.label}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-gray-300 dark:text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-6 pb-6">
                      {cat.projects.map((project) => {
                        const badges = badgeOverrides[project.name] ?? project.badges;
                        return (
                          <ProjectRow key={project.name} project={project} badges={badges} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Experience */}
        <section className="mt-14">
          <h2 className="text-xl font-bold">Experience</h2>
          <div className="mt-6 flex flex-col gap-7">
            {EXPERIENCE.map((item) => (
              <div key={item.role} className="flex gap-4">
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img src="/logos/missouristate.jpeg" alt="Missouri State University" className="h-full w-full object-cover rounded-lg" />
                </div>
                <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <p className="font-semibold">
                    {item.role}{' '}
                    <span className="font-normal text-gray-500 dark:text-gray-400">· {item.company}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{item.period}</p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="mt-14">
          <h2 className="text-xl font-bold">Education</h2>
          <div className="mt-6 flex gap-4">
            <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <img src="/logos/missouristate.jpeg" alt="Missouri State University" className="h-full w-full object-cover rounded-lg" />
            </div>
            <div>
              <p className="font-semibold">Missouri State University</p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">B.S. Computer Science · B.S. General Mathematics</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Expected May 2027</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mt-14">
          <h2 className="text-xl font-bold">Contact</h2>
          <div className="mt-4 flex flex-col gap-2">
            <a href="mailto:csladedev@outlook.com"
              className="flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              csladedev@outlook.com
            </a>
            <a href="tel:+16183816906"
              className="flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              +1 417-506-9365
            </a>
            <a href="https://github.com/camdenslade" target="_blank" rel="noopener noreferrer"
              className="flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              github.com/camdenslade
            </a>
            <a href="https://linkedin.com/in/camden-slade-230157155" target="_blank" rel="noopener noreferrer"
              className="flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              linkedin.com/in/camden-slade-230157155
            </a>
          </div>
        </section>

      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-2xl px-5 py-5 md:px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 Camden Slade</p>
          <div className="flex flex-wrap gap-4">
            <a href="/pdf" className="text-xs text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300">PDF Editor</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <PortfolioPage />
    </Suspense>
  );
}

'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

const PROJECTS = {
  'even-dating': {
    name: 'Even Dating',
    logo: '/logos/even.png',
    tagline: 'A location-based dating app built for college communities.',
    badges: ['iOS', 'Live', 'Startup'],
    role: 'Founder & Lead Developer',
    period: 'Dec 2025 - Present',
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/us/app/even-dating/id6756533343' },
    ],
    overview: `Even Dating is a live, App Store-published mobile application designed specifically for college communities. The core premise is location-aware matchmaking - users discover and match with people nearby on campus or in their city. Even is actively deployed and iterating on real user feedback.\n\nAs founder and lead developer, I designed and built the full system from scratch: the mobile client, backend API, auth infrastructure, real-time matching engine, and cloud deployment pipeline.`,
    highlights: [
      {
        title: 'Real-time swipe matching',
        desc: 'Built a Redis-backed queue system that handles real-time match events. When two users swipe right, a match is created and both are notified instantly via push.',
      },
      {
        title: 'Custom Cognito auth flows',
        desc: 'Designed a multi-step onboarding and authentication flow using AWS Cognito with custom Lambda triggers, token refresh logic, and secure session management.',
      },
      {
        title: 'Scalable AWS infrastructure',
        desc: 'Deployed on AWS EC2 with S3 for media, SNS for push notifications, and a PostgreSQL database. Infrastructure is designed to scale horizontally as user load grows.',
      },
      {
        title: 'SwiftUI native client',
        desc: 'The iOS app is built entirely in SwiftUI with a custom design system. Smooth animations, gesture-driven interactions, and native feel throughout.',
      },
    ],
    stack: ['Swift', 'SwiftUI', 'NestJS', 'PostgreSQL', 'Redis', 'AWS (Cognito, SNS, S3, EC2)'],
  },

  'tabup': {
    name: 'TabUp',
    logo: '/logos/tabup.png',
    tagline: 'A bill-splitting app built for real-world usability.',
    badges: ['React Native', 'TestFlight'],
    role: 'Team Lead · API & Deployment Engineer',
    period: 'Jan 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/TabUp' },
      { label: 'TestFlight', href: 'https://testflight.apple.com/join/HZDcwfxr' },
    ],
    overview: `TabUp is a mobile bill-splitting application focused on the friction points that existing apps get wrong. Rather than approximating splits or requiring Venmo to settle up, TabUp handles the full flow - from scanning a receipt to tracking who owes what and sending reminders - without ever touching funds directly.\n\nAs team lead, I architected the system, led the backend and infrastructure work, and coordinated frontend development across the team.`,
    highlights: [
      {
        title: 'Receipt capture & parsing',
        desc: 'Users can photograph a physical receipt. The app parses line items and totals, letting each person claim specific items or split them proportionally.',
      },
      {
        title: 'Flexible split logic',
        desc: 'Supports equal splits, item-based splits, and custom percentage breakdowns. Any combination works across a single bill.',
      },
      {
        title: 'Payout-aware reminders',
        desc: 'Tracks outstanding balances per person and sends configurable SMS reminders via Twilio - without handling money or requiring a payment account.',
      },
      {
        title: 'Auth & persistence',
        desc: 'Firebase Auth for user identity, NestJS backend for business logic and split calculations, PostgreSQL for persistent bill and balance records, deployed on AWS.',
      },
    ],
    stack: ['React Native', 'Expo', 'TypeScript', 'NestJS', 'PostgreSQL', 'AWS', 'Firebase Auth', 'Twilio SMS'],
  },

  'missouri-state-lacrosse': {
    name: 'Missouri State Lacrosse',
    logo: '/logos/mostate.png',
    tagline: 'A full-stack platform for the Missouri State lacrosse community.',
    badges: ['Live', 'NonProfit'],
    role: 'Technology Chair · 501(c) NonProfit',
    period: 'Sep 2025 - Present',
    links: [
      { label: 'Site', href: 'https://missouristatelacrosse.com' },
      { label: 'GitHub', href: 'https://github.com/camdenslade/missouristatelacrosse' },
    ],
    overview: `Missouri State Lacrosse is a full-stack web platform I built and maintain as Technology Chair for the Missouri State University lacrosse program - a 501(c) nonprofit serving both the men's and women's teams, along with coaches, alumni, and family.\n\nThe platform is actively used for team operations including media, roster management, e-commerce, and communications. Everything runs on infrastructure I designed and deployed.`,
    highlights: [
      {
        title: 'Media streaming',
        desc: 'Game footage and highlight content is streamed through the platform. Media assets are stored on S3 and served via Cloudflare for low-latency delivery.',
      },
      {
        title: 'Roster management',
        desc: 'Coaches can manage player profiles, bios, and stats through an authenticated admin interface. Public-facing roster pages are generated dynamically.',
      },
      {
        title: 'E-commerce & merchandise',
        desc: 'Integrated payment processing and merchandise fulfillment for team gear and apparel. Orders flow through to a fulfillment backend without manual intervention.',
      },
      {
        title: 'Multi-team support',
        desc: 'The platform serves both the men\'s and women\'s programs under a single deployment, with role-based access so each team manages its own content independently.',
      },
    ],
    stack: ['React', 'Spring Boot', 'Firebase Auth', 'Cloudflare', 'AWS (EC2, SES, S3)'],
  },

  'nova-dom': {
    name: 'Nova Dom',
    logo: '/logos/nova-dom.png',
    tagline: 'An open-source DOM editing engine for React.',
    badges: ['Live', 'Open Source'],
    role: 'Author',
    period: null,
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/nova-dom' },
    ],
    overview: `Nova Dom is an open-source library that gives React applications a structured, editable document model - similar to what powers no-code builders and visual editors. It exposes a flat document tree architecture with efficient diffing, enabling real-time visual editing without rebuilding your component tree from scratch.\n\nBuilt as a foundation for no-code tooling, Nova Dom handles the hard parts: undo/redo history, selection state, diffing, and serialization.`,
    highlights: [
      {
        title: 'Flat document tree',
        desc: 'Nodes are stored in a flat map keyed by ID rather than a nested tree. This makes traversal, diffing, and serialization significantly faster and simpler to reason about.',
      },
      {
        title: 'Efficient diffing',
        desc: 'Changes produce minimal diffs against the previous document state. Only affected nodes re-render, keeping performance predictable even in large documents.',
      },
      {
        title: 'Undo / redo',
        desc: 'Full command history with undo and redo support built into the core. Every mutation is recorded as a reversible operation.',
      },
      {
        title: 'React 19 & Zustand',
        desc: 'Built on React 19 with Zustand for state management. The store is exposed directly so consuming apps can subscribe to document state with minimal boilerplate.',
      },
    ],
    stack: ['TypeScript', 'React 19', 'Zustand', 'Vite'],
  },

  'kimbu': {
    name: 'Kimbu',
    logo: '/logos/Kimbu.png',
    tagline: 'A multi-tenant authentication platform with enterprise-grade security, built as an Auth0 alternative.',
    badges: ['In Progress', 'Open Source'],
    role: 'Solo Developer',
    period: 'Mar 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/kimbu' },
    ],
    overview: `Kimbu is a production-grade authentication platform built with NestJS, PostgreSQL, and Redis. It provides the same core services as Auth0 or Firebase Auth - multi-tenant user management, JWT lifecycle, session tracking, and RBAC - without the vendor lock-in or per-MAU pricing.\n\nThe architecture is stateless by design: access tokens live 15 minutes, refresh tokens rotate on every use, and all ephemeral state (OTPs, rate limit counters, revocation lists) lives in Redis. Permanent data (users, sessions, audit logs) goes to PostgreSQL. Any instance can serve any request with no server affinity.`,
    highlights: [
      {
        title: 'Argon2id password hashing',
        desc: 'Uses Argon2id (the 2015 Password Hashing Competition winner) over bcrypt - memory-hard and resistant to GPU and ASIC attacks. Configured at 65MB memory cost, time cost 3, parallelism 4.',
      },
      {
        title: 'JWT rotation with device binding',
        desc: 'Every refresh issues a new token pair and invalidates the previous refresh token. Tokens are bound to a device_id, so a stolen token replayed from a different device is rejected.',
      },
      {
        title: 'Strategy pattern for auth providers',
        desc: 'Email/password, SMS OTP, and OAuth (Google, Apple) implement a common IAuthProvider interface. Adding a new provider requires no changes to the core auth service.',
      },
      {
        title: 'Multi-tenant RBAC at the SQL layer',
        desc: 'Users have a global identity but per-app roles and permissions via a UserApp join table. All queries are filtered by app_id; JWTs include the app context for per-request isolation.',
      },
    ],
    stack: ['TypeScript', 'NestJS', 'PostgreSQL', 'Redis', 'Docker', 'JWT', 'Argon2'],
  },

  'versa': {
    name: 'Versa',
    logo: '/logos/Versa.png',
    tagline: 'A real-time collaborative sync engine using CRDTs, a single Rust core, and a stateless Go relay.',
    badges: ['In Progress', 'iOS'],
    role: 'Solo Developer',
    period: 'Apr 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/versa' },
    ],
    overview: `Versa is a real-time collaborative sync engine -the infrastructure behind apps like Notion or Linear where multiple devices edit simultaneously without conflicts.\n\nThe core is a single Rust library that compiles two ways: via UniFFI into a Swift XCFramework for iOS, and via wasm-bindgen into a WASM module for the web. Both targets run identical CRDT logic with no code duplication. A stateless Go WebSocket relay fans out binary diffs; each client merges them locally using version vectors so only deltas -not full snapshots -travel the wire on every edit.`,
    highlights: [
      {
        title: 'Single Rust core, two targets',
        desc: 'One codebase compiles to a native Swift XCFramework (UniFFI) and a WASM module (wasm-bindgen) via feature flags. iOS and web share identical conflict-resolution logic with no duplication.',
      },
      {
        title: 'Version-vector delta export',
        desc: 'On each local mutation, the engine captures its version vector before the op and exports only the diff since that point. Remote clients receive and merge only the bytes they are missing.',
      },
      {
        title: 'Stateless Go relay',
        desc: 'The relay never deserializes the Loro payload -it fans out raw binary frames to every connected client except the sender. Statelessness means any relay instance can serve any client.',
      },
      {
        title: 'Swift async integration',
        desc: 'TaskEngine runs all CRDT operations on a background Task to avoid blocking the main thread. RelayTransport is a Swift actor with auto-reconnect and 4-byte length-prefixed framing for the WebSocket wire format.',
      },
    ],
    stack: ['Go', 'Rust', 'Swift', 'SwiftUI', 'UniFFI', 'WASM', 'wasm-bindgen', 'Loro CRDTs', 'PostgreSQL'],
  },

  'qravo': {
    name: 'Qravo',
    logo: '/logos/qravo.png',
    tagline: 'A QR code restaurant ordering system with real-time kitchen dashboard and Square payments.',
    badges: ['In Progress', 'React'],
    role: 'Solo Developer',
    period: 'Feb 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/qravo' },
    ],
    overview: `Qravo is a QR code ordering platform for restaurants. Customers scan a code at their table, browse the menu, customize items with modifier groups, and pay -no app download required. The kitchen gets a real-time order dashboard that updates the moment an order is placed.\n\nRestaurant owners manage their entire operation through an admin interface: menu items with photos and modifiers, per-table QR codes, real-time order status, and Square payment OAuth. The platform is multi-tenant -each restaurant has its own slug, isolated Firestore data, and configurable theme color.`,
    highlights: [
      {
        title: 'Modifier-aware ordering',
        desc: 'Menu items support modifier groups with required or optional selections, single or multi-select, and per-option price adjustments. Cart deduplication keys on item ID plus the full modifier selection, so the same item with different options gets separate entries.',
      },
      {
        title: 'Real-time order dashboard',
        desc: 'Firestore onSnapshot listeners push order updates to the admin dashboard instantly. Staff advance orders through new, preparing, ready, and completed states with a single tap.',
      },
      {
        title: 'Square payment integration',
        desc: 'The Square Web Payments SDK tokenizes cards client-side; a Firebase Cloud Function handles the server-side charge and links the Square order and payment IDs back to the Qravo order record.',
      },
      {
        title: 'Per-table QR generation',
        desc: 'The admin creates named tables and gets SVG QR codes linking directly to the menu with the table pre-filled. Scanning lands the customer on the correct restaurant and table with no manual input.',
      },
    ],
    stack: ['React', 'TypeScript', 'Firebase (Firestore, Auth, Functions, Storage)', 'Square API', 'Vite', 'Tailwind CSS'],
  },

  'smoke-launcher': {
    name: 'Smoke Launcher',
    logo: '/logos/smoke-transparent.png',
    tagline: 'A native macOS launcher for Windows games via Wine.',
    badges: ['Live', 'macOS', 'Open Source'],
    role: 'Solo Developer',
    period: 'Mar 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/Smoke-Launcher' },
      { label: 'Download', href: 'https://buy.stripe.com/dRm28rcGg8sHesRcbh5c400' },
    ],
    overview: `Smoke Launcher is a native macOS application that lets you run Windows games through Wine with a polished SwiftUI interface. Instead of wrestling with Wine prefixes, command-line flags, and DXVK configuration manually, Smoke wraps the entire compatibility layer into a familiar launcher experience.\n\nGames appear automatically from your Steam library, artwork is fetched from Valve's CDN, and per-bottle settings let you tune Wine and DXVK independently for each game.`,
    highlights: [
      {
        title: 'Auto-detect Steam games',
        desc: 'Smoke parses Steam\'s ACF manifest files to discover installed games automatically. Your library appears without any manual configuration.',
      },
      {
        title: 'Wine + DXVK built in',
        desc: 'Ships with a managed Wine bottle. Toggle DXVK (DirectX → Metal translation) and ESync on a per-bottle basis from the UI.',
      },
      {
        title: 'Steam artwork everywhere',
        desc: 'Game icons and hero art are pulled from Valve\'s CDN once the App ID is known. Your library looks like Steam.',
      },
      {
        title: 'Isolated Wine bottles',
        desc: 'Each bottle is a sandboxed Windows environment with its own registry, drivers, and settings - changes to one game don\'t affect others.',
      },
    ],
    stack: ['Swift', 'SwiftUI', 'Wine', 'DXVK', 'Steam CDN'],
  },

  'binate': {
    name: 'Binate',
    logo: '/logos/Binate.png',
    tagline: 'A semantic binary diff tool for build reproducibility validation.',
    badges: ['Open Source', 'Rust'],
    role: 'Author',
    period: 'Apr 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/binate' },
    ],
    overview: `Binate is a command-line tool for comparing two compiled binaries and identifying genuine differences by masking known sources of non-determinism. Build IDs, embedded timestamps, absolute paths, and linker version strings all vary between builds even when the source is identical - Binate normalizes those away before diffing, leaving only changes that actually matter.\n\nChanged byte ranges are mapped back to source symbols and file locations via DWARF debug info, and optionally disassembled to instruction-level diffs. Output can be plain terminal, JSON, or SARIF for GitHub Actions integration.`,
    highlights: [
      {
        title: 'Pluggable normalizer chain',
        desc: 'Non-determinism sources (build-id, timestamp, absolute-path, linker-version) are implemented as composable normalizers applied before comparison. Users can enable or disable each one independently.',
      },
      {
        title: 'DWARF-based symbol attribution',
        desc: 'Changed byte ranges are resolved to function names and source file/line using gimli\'s streaming DWARF parser. The diff output tells you which function changed, not just which offset.',
      },
      {
        title: 'Parallel section comparison',
        desc: 'Sections are compared in parallel via rayon. Identical sections are skipped instantly with a hash check, so large binaries with few changes are fast.',
      },
      {
        title: 'Instruction-level disassembly',
        desc: 'For changed code sections, iced-x86 disassembles both sides and the similar crate produces a readable instruction-level diff alongside the raw byte diff.',
      },
    ],
    stack: ['Rust', 'gimli (DWARF)', 'iced-x86', 'rayon', 'object', 'memmap2', 'clap'],
  },

  'binate-gpu': {
    name: 'Binate GPU',
    logo: '/logos/Binate-GPU.png',
    tagline: 'A GPU-accelerated reactive UI framework built in Rust.',
    badges: ['In Progress', 'Rust'],
    role: 'Author',
    period: 'Apr 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/binate-gpu' },
    ],
    overview: `Binate GPU is a from-scratch UI framework for Rust that renders entirely on the GPU via wgpu. Rather than using native controls, it builds its own rendering pipeline: SDF rounded rectangles, a shelf-packed glyph atlas for text, and Taffy flexbox for layout. Reactivity is handled by Signal<T> cells that trigger redraws via a thread-local dirty flag.\n\nThe framework is structured as six focused crates: core (View tree, signals, layout), text (cosmic-text shaping, glyph atlas), render (wgpu pipelines), platform (winit event loop, hit-testing), native (macOS AppKit bridge via objc2), and demo (counter example).`,
    highlights: [
      {
        title: 'SDF rounded-rect shader',
        desc: 'Rectangles are drawn with a 45-line WGSL shader using signed distance fields for anti-aliased corners at any radius. No geometry tessellation needed.',
      },
      {
        title: 'Glyph atlas with shelf packing',
        desc: 'Glyphs shaped by cosmic-text are packed into a 1024x1024 R8 texture using a shelf allocator. Cached by CacheKey so each glyph is uploaded once per font/size/style combination.',
      },
      {
        title: 'Signal-based reactivity',
        desc: 'Signal<T> is a cloneable reactive cell. Writes set a thread-local dirty flag; the platform event loop checks it after each event and skips redraws when nothing changed.',
      },
      {
        title: 'macOS native bridge',
        desc: 'An optional AppKit bridge via objc2 lets native NSWindow/NSButton controls sit alongside GPU-rendered views. Compiles cleanly; demo integration pending.',
      },
    ],
    stack: ['Rust', 'wgpu', 'WGSL', 'winit', 'taffy', 'cosmic-text', 'objc2', 'memmap2'],
  },
} as const;

type Slug = keyof typeof PROJECTS;

// ── Icons ─────────────────────────────────────────────────────────────────────

function ArrowUpRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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

// ── Badge styles ──────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<string, string> = {
  'Live':             '__live__',
  'Startup':          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'Open Source':      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'NonProfit':        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'iOS':              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'React Native':     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'Android':          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'macOS':            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'TypeScript':       'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
  'MCP':              'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300',
  'Multi-Tenant':     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'TestFlight':       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'In Progress':      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'Go':               'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
};

function Badge({ label }: { label: string }) {
  if (label === 'Live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        Live
      </span>
    );
  }
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${BADGE_STYLES[label] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
      {label}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectPage({ slug }: { slug: string }) {
  const project = PROJECTS[slug as Slug];

  const [dark, setDark] = useState(false);

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

  if (!project) notFound();

  return (
    <main className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">

      
      <nav className="border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-3.5 md:px-6">
          <Link href="/portfolio" className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100">
            <ChevronLeft /> Portfolio
          </Link>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-5 py-12 md:px-6 md:py-16">

        
        <section>
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden">
              {project.logo ? (
                <img
                  src={project.logo}
                  alt={project.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-600">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                {project.badges.some(b => b === 'Live') && <Badge label="Live" />}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {project.badges.filter(b => b !== 'Live').map(b => <Badge key={b} label={b} />)}
              </div>
            </div>
          </div>

          <p className="mt-4 text-lg leading-relaxed text-gray-500 dark:text-gray-400">{project.tagline}</p>

          <div className="mt-3 text-sm text-gray-400 dark:text-gray-500">
            {project.role}{project.period ? ` · ${project.period}` : ''}
          </div>

          {/* Links */}
          <div className="mt-5 flex flex-wrap gap-2">
            {project.links.map(link => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('/') ? undefined : '_blank'}
                rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}
                className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {link.label} <ArrowUpRight />
              </a>
            ))}
          </div>
        </section>

        
        <section className="mt-12">
          <h2 className="text-base font-semibold">Overview</h2>
          <div className="mt-3 space-y-3">
            {project.overview.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{para}</p>
            ))}
          </div>
        </section>

        
        <section className="mt-12">
          <h2 className="text-base font-semibold">Highlights</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {project.highlights.map(h => (
              <div key={h.title} className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm font-semibold">{h.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{h.desc}</p>
              </div>
            ))}
          </div>
        </section>

        
        <section className="mt-12">
          <h2 className="text-base font-semibold">Stack</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.stack.map(t => (
              <span key={t} className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {t}
              </span>
            ))}
          </div>
        </section>

      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-2xl px-5 py-5 md:px-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 Camden Slade</p>
        </div>
      </footer>
    </main>
  );
}

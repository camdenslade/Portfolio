'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useProjectBadges } from '../../projects-data';

const PROJECTS = {
  'even-dating': {
    name: 'Even Dating',
    logo: '/logos/even.png',
    tagline: 'A location-based dating app built for college communities.',
    role: 'Founder & Lead Developer',
    period: 'Dec 2025 - Sep 2026',
    links: [],
    overview: `Even Dating was an App Store-published iOS app built specifically for college communities. The core premise was location-aware matchmaking - users discovered and matched with people nearby on campus or in their city.\n\nAs founder and lead developer, I designed and built the full system from scratch: the SwiftUI client, the NestJS backend API, the auth infrastructure, the real-time matching engine, and the cloud deployment pipeline. The project was discontinued in September 2026 - the backend infrastructure was decommissioned and the app was removed from sale.`,
    highlights: [
      {
        title: 'Real-time swipe matching',
        desc: 'A Redis-backed queue system handled real-time match events. When two users swiped right, a match was created and both were notified instantly via push.',
      },
      {
        title: 'Custom Cognito auth flows',
        desc: 'A multi-step onboarding and authentication flow built on AWS Cognito with custom Lambda triggers, token refresh logic, and secure session management.',
      },
      {
        title: 'AWS infrastructure',
        desc: 'Deployed on AWS EC2 with S3 for media, SNS for push notifications, and a PostgreSQL database, provisioned to scale horizontally with user load.',
      },
      {
        title: 'SwiftUI native client',
        desc: 'The iOS app was built entirely in SwiftUI with a custom design system - smooth animations, gesture-driven interactions, and a native feel throughout.',
      },
    ],
    stack: ['Swift', 'SwiftUI', 'NestJS', 'PostgreSQL', 'Redis', 'AWS (Cognito, SNS, S3, EC2)'],
    screenshots: ['/even-dating/1.png', '/even-dating/2.png', '/even-dating/3.png', '/even-dating/4.png', '/even-dating/5.png', '/even-dating/6.png'],
  },

  'codegraph': {
    name: 'CodeGraph',
    logo: '/logos/codegraph.svg',
    tagline: 'A semantic code graph served to LLM coding agents over the Model Context Protocol.',
    role: 'Developer',
    period: 'Sep 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/codegraph' },
    ],
    overview: `CodeGraph parses a codebase into a SQLite graph of symbols and the relationships between them, then serves precise structural slices of it to an LLM coding agent over the Model Context Protocol. Instead of grepping and reading whole files, an agent asks "what calls this function", "what does this endpoint touch", or "trace the path from handler to DB" and gets a small, exact answer in one call. Fewer tokens spent on navigation means more tokens for the actual change.\n\nThe graph is built once - a few seconds for a mid-size repo - and kept fresh incrementally. Every edge is labelled resolved or heuristic, and everything the analyzer could not bind is recorded in an unresolved table with its source location, so a query can tell the agent exactly when to still open the file. All analysis is local: zero network calls at runtime.`,
    highlights: [
      {
        title: 'Two-phase ingestion pipeline',
        desc: 'Phase 1 discovers, parses (tree-sitter), and persists nodes for every language. Phase 2 builds one NodeIndex over the whole graph so any file can see every node, then each analyzer resolves its edges - IMPORTS, DECLARES, CALLS, REFERENCES, EXTENDS/IMPLEMENTS, HANDLES.',
      },
      {
        title: 'Compiler-accurate TypeScript resolution',
        desc: 'The TS analyzer builds a single ts.Program over every discovered file so the checker resolves cross-file types and re-export barrels, then walks the units being resolved for the semantic pass. The warm Program is carried across --watch runs. Java is at import-graph plus syntactic call-graph level.',
      },
      {
        title: 'Five MCP tools with a meta block',
        desc: 'find_symbol, get_symbol_neighborhood, find_path, get_architectural_skeleton, and refresh. Every result carries a meta block: resolution counts, unresolved symbols in scope, whether the result was truncated, and total vs. shown neighbors.',
      },
      {
        title: 'Incremental updates with edge snapshotting',
        desc: 'On refresh, files are hashed and diffed against the cache. Inbound edges whose target is being reparsed but whose source is not are snapshotted and restored afterward, so A -> X survives when only X changes. Incremental updates land in under a second; a --watch mode runs them on debounced chokidar events.',
      },
      {
        title: 'Deterministic, disposable graph cache',
        desc: 'Node ids are kind:qualified_name, files are processed in sorted order, and re-ingesting produces byte-identical rows - asserted by golden snapshot and full-vs-incremental equivalence tests. The SQLite cache lives in an OS cache dir keyed by the repo\'s absolute path, never inside the repo, and a schema-version mismatch just drops and rebuilds it.',
      },
      {
        title: 'Framework-aware discovery',
        desc: 'Recognizes Express, Fastify, and React Router handlers as route nodes with HANDLES edges to their handler functions, and respects tsconfig include/exclude patterns and .gitignore when walking the source tree.',
      },
    ],
    stack: ['TypeScript', 'Node.js 20+', 'tree-sitter', 'tree-sitter-typescript', 'tree-sitter-java', 'better-sqlite3', 'Model Context Protocol SDK', 'chokidar', 'commander'],
  },

  'tabup': {
    name: 'TabUp',
    logo: '/logos/tabup.png',
    tagline: 'A bill-splitting app built for real-world usability.',
    role: 'Team Lead · API & Deployment Engineer',
    period: 'Jan 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/TabUp' },
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
    logo: '/logos/missouri-state.png',
    tagline: 'A full-stack platform for the Missouri State lacrosse community.',
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
    role: 'Developer',
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
    role: 'Developer',
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
    role: 'Developer',
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
    role: 'Developer',
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

  'Glyph': {
    name: 'Glyph',
    logo: '/logos/Glyph.png',
    tagline: 'A GPU-accelerated reactive UI framework built in Rust.',
    role: 'Author',
    period: 'Apr 2026 - Present',
    links: [
      { label: 'GitHub', href: 'https://github.com/camdenslade/Glyph' },
    ],
    overview: `Glyph is a from-scratch UI framework for Rust that renders entirely on the GPU via wgpu. Rather than using native controls, it builds its own rendering pipeline: SDF rounded rectangles, a shelf-packed Glyphatlas for text, and Taffy flexbox for layout. Reactivity is handled by Signal<T> cells that trigger redraws via a thread-local dirty flag.\n\nThe framework is structured as six focused crates: core (View tree, signals, layout), text (cosmic-text shaping, Glyphatlas), render (wgpu pipelines), platform (winit event loop, hit-testing), native (macOS AppKit bridge via objc2), and demo (counter example).`,
    highlights: [
      {
        title: 'SDF rounded-rect shader',
        desc: 'Rectangles are drawn with a 45-line WGSL shader using signed distance fields for anti-aliased corners at any radius. No geometry tessellation needed.',
      },
      {
        title: 'Glyphatlas with shelf packing',
        desc: 'Glyphs shaped by cosmic-text are packed into a 1024x1024 R8 texture using a shelf allocator. Cached by CacheKey so each Glyphis uploaded once per font/size/style combination.',
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

// Icons
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

// Page
export default function ProjectPage({ slug }: { slug: string }) {
  const project = PROJECTS[slug as Slug];
  const badges = useProjectBadges({ slug, name: project?.name });

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

  const screenshots = 'screenshots' in project ? project.screenshots : [];

  return (
    <main className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">

      <nav className="border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3.5 md:px-8">
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

      <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">

        {/* Masthead */}
        <header className="flex items-center gap-5">
          {project.logo && (
            <img
              src={project.logo}
              alt={project.name}
              className="h-16 w-16 flex-shrink-0 rounded-2xl bg-gray-100 object-cover dark:bg-gray-800 md:h-20 md:w-20"
            />
          )}
          <div className="relative min-w-0">
            {badges.length > 0 && (
              <p className="absolute bottom-full mb-3 text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {badges.join('  ·  ')}
              </p>
            )}
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{project.name}</h1>
            <p className="mt-4 max-w-2xl text-xl leading-snug text-gray-500 dark:text-gray-400">
              {project.tagline}
            </p>
          </div>
        </header>

        {/* Body: prose + meta rail */}
        <div className="mt-14 grid gap-12 md:grid-cols-[1fr_180px]">

          {/* Prose column */}
          <div className="min-w-0 md:order-1">
            <div className="space-y-4 text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-300">
              {project.overview.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <h2 className="mt-14 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Notable work
            </h2>
            <ol className="mt-6 space-y-7">
              {project.highlights.map((h, i) => (
                <li key={h.title} className="grid grid-cols-[2rem_1fr] gap-x-3">
                  <span className="pt-0.5 font-mono text-xs text-gray-300 dark:text-gray-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-semibold">{h.title}</p>
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-gray-500 dark:text-gray-400">{h.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Meta rail */}
          <aside className="md:order-2 md:border-l md:border-gray-100 md:pl-6 md:dark:border-gray-800">
            <dl className="space-y-6 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Role</dt>
                <dd className="mt-1.5 text-gray-600 dark:text-gray-300">{project.role}</dd>
              </div>
              {project.period && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Timeline</dt>
                  <dd className="mt-1.5 text-gray-600 dark:text-gray-300">{project.period}</dd>
                </div>
              )}
              {project.links.length > 0 && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Links</dt>
                  <dd className="mt-1.5 flex flex-col gap-1.5">
                    {project.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target={link.href.startsWith('/') ? undefined : '_blank'}
                        rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}
                        className="inline-flex w-fit items-center gap-1 text-gray-600 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-500 dark:text-gray-300 dark:decoration-gray-700 dark:hover:text-gray-100"
                      >
                        {link.label} <ArrowUpRight />
                      </a>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Built with</dt>
                <dd className="mt-1.5 text-gray-500 dark:text-gray-400">
                  {project.stack.join(', ')}
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Screenshots
            </h2>
            <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
              {screenshots.map((src) => (
                <a
                  key={src}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <img
                    src={src}
                    alt={`${project.name} screenshot`}
                    className="h-[440px] w-auto object-contain"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-5 py-6 md:px-8">
          <Link href="/portfolio" className="text-xs text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300">
            Back to portfolio
          </Link>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">© 2026 Camden Slade</p>
        </div>
      </footer>
    </main>
  );
}

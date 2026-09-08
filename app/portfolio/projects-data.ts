'use client';

// Project data for the portfolio.
//
// This module is the single source of truth for project badges. The portfolio
// index (app/portfolio/page.tsx) renders these arrays directly, and each detail
// page (app/portfolio/projects/[slug]) reads PROJECT_BADGES / useProjectBadges
// so its badges always match the index, including admin custom overrides.

import { useEffect, useState } from 'react';

export const FLAGSHIP_PROJECTS = [
  {
    name: 'Missouri State Lacrosse',
    initials: 'ML',
    logo: '/logos/missouri-state.png',
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
  {
    name: 'CodeGraph',
    initials: 'CG',
    logo: '/logos/codegraph.svg',
    role: 'Developer',
    period: 'Sep 2026 - Present',
    badges: ['Open Source', 'MCP'],
    summary:
      'Transforms a codebase into a semantic graph of symbols and relationships, then exposes precise structural queries over the Model Context Protocol so LLM agents can ask "what calls this function" or "trace the path from handler to database" and get exact answers in milliseconds. Tree-sitter ingestion into a SQLite node/edge store with compiler-accurate call resolution for TypeScript, incremental updates on file change, and zero network calls at runtime.',
    stack: ['TypeScript', 'Node.js', 'tree-sitter', 'better-sqlite3', 'Model Context Protocol'],
    links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/codegraph' }, { label: 'Details', href: '/portfolio/projects/codegraph' }],
  },
  {
    name: 'Versa',
    initials: 'VS',
    logo: '/logos/Versa.png',
    role: 'Developer',
    period: 'Apr 2026 - May 2026',
    badges: ['In Progress', 'iOS'],
    summary:
      'A real-time collaborative sync architecture built on top of Loro CRDTs. A single Rust core compiles to both a Swift XCFramework (via UniFFI) and a WASM module (via wasm-bindgen), sharing identical conflict-resolution logic across iOS and web. A stateless Go WebSocket relay fans out binary diffs; each client merges them locally using version vectors so only deltas travel the wire.',
    stack: ['Go', 'Rust', 'Swift', 'SwiftUI', 'UniFFI', 'WASM', 'wasm-bindgen', 'Loro CRDTs', 'PostgreSQL'],
    links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/versa' }, { label: 'Details', href: '/portfolio/projects/versa' }],
  },
];

export const PROJECT_CATEGORIES = [
  {
    label: 'Mobile Apps',
    projects: [
      {
        name: 'Even Dating',
        initials: 'EV',
        logo: '/logos/even.png',
        role: 'Founder & Lead Developer',
        period: 'Dec 2025 - Sep 2026',
        badges: ['iOS', 'Discontinued', 'Startup'],
        summary:
          'Founder and lead developer of a location-based dating app for college communities. Shipped to the App Store with custom AWS Cognito auth flows, real-time swipe matching over a Redis-backed queue, and a NestJS + PostgreSQL backend on EC2. Discontinued in September 2026; servers decommissioned and the app removed from sale.',
        stack: ['Swift', 'SwiftUI', 'NestJS', 'PostgreSQL', 'AWS (Cognito, SNS, S3, EC2)', 'Redis'],
        links: [{ label: 'Details', href: '/portfolio/projects/even-dating' }],
      },
      {
        name: 'TabUp',
        initials: 'TU',
        logo: '/logos/tabup.png',
        role: 'Team Lead · API & Deployment Engineer',
        period: 'Jan 2026 - May 2026',
        badges: ['React Native'],
        summary:
          'Bill-splitting app focused on real-world usability, including receipt capture, flexible split logic, and payout-aware reminders without directly handling funds.',
        stack: ['React Native', 'Expo', 'TypeScript', 'NestJS', 'PostgreSQL', 'AWS', 'Firebase Auth', 'Twilio SMS'],
        links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/TabUp' }, { label: 'Details', href: '/portfolio/projects/tabup' }],
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
        name: 'Glyph',
        initials: 'BG',
        logo: '/logos/Glyph.png',
        role: 'Author',
        period: null,
        badges: ['In Progress', 'Open Source'],
        summary:
          'A GPU-accelerated reactive UI framework for Rust. Renders a declarative View tree via wgpu with SDF rounded-rect shaders, cosmic-text Glyphatlas, Taffy flexbox layout, and signal-based reactivity. Optional macOS native bridge via objc2.',
        stack: ['Rust', 'wgpu', 'WGSL', 'winit', 'taffy', 'cosmic-text', 'objc2'],
        links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/Glyph' }, { label: 'Details', href: 'https://glyph.cslade.space' }],
      },
       {
        name: 'Binate',
        initials: 'BN',
        logo: '/logos/Binate.png',
        role: 'Author',
        period: null,
        badges: ['Open Source'],
        summary:
          'A semantic binary diff tool that compares Rust binaries by masking known sources of non-determinism (build IDs, timestamps, absolute paths), then maps changed byte ranges back to source symbols and file locations via DWARF debug info. Used for build reproducibility validation in CI pipelines.',
        stack: ['Rust', 'gimli (DWARF)', 'iced-x86', 'rayon', 'object', 'memmap2'],
        links: [{ label: 'GitHub', href: 'https://github.com/camdenslade/binate' }, { label: 'Details', href: '/portfolio/projects/binate' }],
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

type BadgedProject = { name: string; badges: string[]; links: { label: string; href: string }[] };

const _ALL: BadgedProject[] = [
  ...FLAGSHIP_PROJECTS.map((p) => ({ name: p.name, badges: p.badges, links: p.links })),
  ...PROJECT_CATEGORIES.flatMap((c) =>
    c.projects.map((p) => ({ name: p.name, badges: p.badges, links: p.links })),
  ),
];

// Base badge lists from the project arrays above, looked up by BOTH the project
// name and its detail-page slug (from the "/portfolio/projects/<slug>" link, if
// any). This is the source of truth the detail pages read.
export const PROJECT_BADGES: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const p of _ALL) {
    map[p.name] = p.badges;
    const details = p.links.find((l) => l.href.startsWith('/portfolio/projects/'));
    if (details) map[details.href.replace('/portfolio/projects/', '')] = p.badges;
  }
  return map;
})();

const GET_BADGE_URL = process.env.NEXT_PUBLIC_GET_BADGE_URL ?? '';

// Admin badge overrides, keyed by project name; each value fully replaces that
// project's badge list.
export function useBadgeOverrides(): Record<string, string[]> {
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});
  useEffect(() => {
    fetch(GET_BADGE_URL)
      .then((r) => (r.ok ? r.json() : { overrides: {} }))
      .then((data: { overrides: Record<string, string[]> }) => setOverrides(data.overrides ?? {}))
      .catch(() => {});
  }, []);
  return overrides;
}

// Resolved badges for one project: admin custom override if set (keyed by name),
// otherwise the source-of-truth list, looked up by name or slug.
export function useProjectBadges(key: { name?: string; slug?: string }): string[] {
  const overrides = useBadgeOverrides();
  const base =
    (key.name ? PROJECT_BADGES[key.name] : undefined) ??
    (key.slug ? PROJECT_BADGES[key.slug] : undefined) ??
    [];
  const overrideKey = key.name ?? '';
  return overrides[overrideKey] ?? base;
}

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PROJECTS = [
  {
    name: 'Smoke Launcher',
    role: 'Solo Developer',
    period: 'Mar 2026 - Present',
    summary:
      'Native macOS launcher for Windows games via Wine. Features automatic Steam game detection from ACF manifests, per-bottle DXVK/ESync toggles, Steam CDN artwork, and a liquid glass SwiftUI interface.',
    stack: ['Swift', 'SwiftUI', 'Wine', 'DXVK', 'Steam CDN'],
    href: 'https://github.com/camdenslade/Smoke-Launcher',
    page: '/smoke-launcher',
  },
  {
    name: 'Even Dating LLC',
    role: 'Founder & Lead Developer',
    period: 'Dec 2025 - Present',
    summary:
      'Full-stack location-based dating app for college communities. Designed backend APIs, authentication systems, and swipe matching logic. Deployed scalable infrastructure using AWS and Redis.',
    stack: ['React Native', 'NestJS', 'PostgreSQL', 'AWS SNS', 'Cognito', 'S3', 'EC2', 'Redis'],
    href: null,
  },
  {
    name: 'Missouri State Lacrosse',
    role: 'Technology Chair · 501(c) NonProfit',
    period: 'Sep 2025 - Present',
    summary:
      'Platform for team media streaming, roster management, and merchandise sales. Integrated payment processing and merchandise fulfillment systems. Maintained hosting infrastructure and content delivery.',
    stack: ['React', 'Spring Boot', 'Firebase Auth', 'Cloudflare', 'AWS EC2', 'SES', 'S3'],
    href: 'https://github.com/camdenslade/missouristatelacrosse',
  },
  {
    name: 'Nova Dom',
    role: 'Head Developer',
    period: null,
    summary:
      'Open-source TypeScript-first DOM editing engine for React, built for visual editors, page builders, and no-code tools. Uses a flat DocumentTree model for scalable editing, efficient diffing, and history-safe undo/redo.',
    stack: ['TypeScript', 'React 19', 'Zustand', 'Vite'],
    href: 'https://github.com/camdenslade/nova-dom',
  },
  {
    name: 'TabUp',
    role: 'Team Lead',
    period: null,
    summary:
      'Friend-first bill splitting app focused on receipt capture, flexible split logic, and payout-platform-aware reminders without handling money directly.',
    stack: ['React Native', 'Expo', 'TypeScript', 'NestJS', 'PostgreSQL', 'AWS', 'Firebase Auth', 'Twilio SMS'],
    href: 'https://github.com/camdenslade/TabUp',
  },
] as const satisfies readonly { name: string; role: string; period: string | null; summary: string; stack: readonly string[]; href: string | null; page?: string }[];

const EXPERIENCE = [
  {
    role: 'Grading Assistant',
    company: 'Missouri State University · Dept. of Mathematics',
    period: 'Aug 2025 - Dec 2025',
    detail:
      'Graded MTH 345, Statistics for Scientists and Engineers, with a focus on standard probability and statistical distributions.',
  },
] as const;

function ArrowUpRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function PortfolioPage() {
  const searchParams = useSearchParams();
  const embed = searchParams.get('embed') === 'true';
  return (
    <main className="min-h-dvh bg-white text-gray-900">

      {/* ── Nav ── */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-2xl items-center gap-6 px-5 py-3.5 md:px-6">
          <Link href="/portfolio" className="text-sm font-medium text-gray-900">
            Home
          </Link>
          <a
            href="https://github.com/camdenslade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/camden-slade-230157155"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            LinkedIn
          </a>
          <a
            href="mailto:camdenslade@outlook.com"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            Email
          </a>
          {!embed && (
            <Link
              href="/"
              className="ml-auto text-sm text-gray-400 transition-colors hover:text-gray-900"
            >
              3D
            </Link>
          )}
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
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cam Slade</h1>
              <p className="mt-1 text-[0.9375rem] text-gray-500">
                CS &amp; Mathematics · Missouri State University · Springfield, MO
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-gray-600">
            Full stack developer with experience building and deploying production-grade applications
            and scalable cloud systems. Founder of a startup mobile app, technology chair of a nonprofit
            sports platform, and author of open-source developer tooling.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/CamSladeResume.pdf"
              download
              className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
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

        {/* ── Projects ── */}
        <section id="projects" className="mt-14">
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <div className="mt-6 flex flex-col gap-8">
            {PROJECTS.map((project) => (
              <div key={project.name} className="flex gap-4">
                <div className="mt-[5px] w-0.5 flex-shrink-0 self-stretch rounded-full bg-indigo-400" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    {project.href && (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-gray-700"
                      >
                        GitHub <ArrowUpRight />
                      </a>
                    )}
                    {'page' in project && project.page && (
                      <a
                        href={project.page}
                        className="inline-flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-gray-700"
                      >
                        Page <ArrowUpRight />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {project.role}{project.period ? ` · ${project.period}` : ''}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{project.summary}</p>
                  <p className="mt-2 text-xs text-gray-400">{project.stack.join(' · ')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Experience ── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-900">Experience</h2>
          <div className="mt-6 flex flex-col gap-7">
            {EXPERIENCE.map((item) => (
              <div key={item.role}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <p className="font-semibold text-gray-900">
                    {item.role}{' '}
                    <span className="font-normal text-gray-500">· {item.company}</span>
                  </p>
                  <p className="text-xs text-gray-400">{item.period}</p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Education ── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-900">Education</h2>
          <div className="mt-6">
            <p className="font-semibold text-gray-900">Missouri State University</p>
            <p className="mt-0.5 text-sm text-gray-500">B.S. Computer Science · B.S. General Mathematics</p>
          </div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="mt-14">
          <h2 className="text-xl font-bold text-gray-900">Contact</h2>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="mailto:camdenslade@outlook.com"
              className="flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              camdenslade@outlook.com
            </a>
            <a
              href="tel:+16183816906"
              className="flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              +1 618-381-6906
            </a>
            <a
              href="https://github.com/camdenslade"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              github.com/camdenslade
            </a>
            <a
              href="https://linkedin.com/in/camden-slade-230157155"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              linkedin.com/in/camden-slade-230157155
            </a>
          </div>
        </section>

      </div>

      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-2xl px-5 py-5 md:px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© 2026 Camden Slade</p>
          <div className="flex flex-wrap gap-4">
            <a href="/smoke-launcher" className="text-xs text-gray-400 transition-colors hover:text-gray-700">Smoke Launcher</a>
            <a href="/pdf" className="text-xs text-gray-400 transition-colors hover:text-gray-700">PDF Editor</a>
            <a href="https://missouristatelacrosse.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 transition-colors hover:text-gray-700">MSU Lacrosse</a>
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

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { initSimulation } from '@/lib/capstone/protocolEngine';
import { DoubleRatchetSimulationState } from '@/types/capstone';
import {
  HOOK,
  DH_BACKGROUND,
  SYMMETRIC_RATCHET,
  DH_RATCHET,
  CODE_SNIPPETS,
  MATH_INTRO,
  MATH_REDUCTION,
  type NarrativeSection,
} from '@/lib/capstone/slidesData';
import MathBlock from '@/components/capstone/MathBlock';
import Prose from '@/components/capstone/Prose';
import CodeBlock from '@/components/capstone/CodeBlock';
import RatchetVisualizer from '@/components/capstone/RatchetVisualizer';
import AdversaryHarness from '@/components/capstone/AdversaryHarness';

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

// One prose section: eyebrow label, heading, numbered blocks. Matches the
// "Notable work" list pattern used on the project detail pages.
function Section({ section }: { section: NarrativeSection }) {
  return (
    <section id={section.id} className="scroll-mt-20">
      <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {section.eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{section.title}</h2>

      <ol className="mt-8 space-y-7">
        {section.blocks.map((block, i) => (
          <li key={i} className="grid grid-cols-[2rem_1fr] gap-x-3">
            <span className="pt-0.5 font-mono text-xs text-gray-300 dark:text-gray-600">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              {block.heading && (
                <p className="font-semibold">
                  <Prose text={block.heading} />
                </p>
              )}
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-300">
                <Prose text={block.text} />
              </p>
              {block.math && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                  <MathBlock math={block.math} block={block.isBlockMath ?? true} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const CapstoneDeck: React.FC = () => {
  const [simulationState, setSimulationState] = useState<DoubleRatchetSimulationState>(() =>
    initSimulation()
  );
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

  const jumpLinks = [
    { href: '#hook', label: 'The problem' },
    { href: '#background', label: 'DH background' },
    { href: '#symmetric-ratchet', label: 'Gear 1: Forward secrecy' },
    { href: '#dh-ratchet', label: 'Gear 2: Self-healing' },
    { href: '#the-code', label: 'The real code' },
    { href: '#live-demo', label: 'Live demo' },
    { href: '#the-math', label: 'The math' },
  ];

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
        <header>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Math Capstone
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Continuous Key Exchange &amp; The Double Ratchet
          </h1>
          <p className="mt-4 max-w-2xl text-xl leading-snug text-gray-500 dark:text-gray-400">
            How a messaging protocol locks a thief out of a conversation it has already broken into, and why that shouldn't be possible.
          </p>

          <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-5 dark:border-gray-800">
            {jumpLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs text-gray-400 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-500 dark:text-gray-500 dark:decoration-gray-700 dark:hover:text-gray-100"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </header>

        <div className="mt-16 space-y-20">
          <Section section={HOOK} />
          <Section section={DH_BACKGROUND} />
          <Section section={SYMMETRIC_RATCHET} />
          <Section section={DH_RATCHET} />

          {/* Real code */}
          <section id="the-code" className="scroll-mt-20">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Not just theory
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              The two gears, in actual code
            </h2>
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-300">
              <Prose text="Everything above is implemented below in Rust as a sideshoot of this presentation. Below are three excerpts from that implementation, each with comments explaining what a line does in plain English, not just what it's called. Following the Rust is not required to follow the rest of this talk. The full source, with tests proving forward secrecy and self-healing actually hold, is linked at the end if anybody is curious." />
            </p>

            <div className="mt-8 space-y-10">
              {CODE_SNIPPETS.map((snippet) => (
                <div key={snippet.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-semibold">{snippet.label}</p>
                    <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{snippet.file}</span>
                  </div>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-300">
                    <Prose text={snippet.intro} />
                  </p>
                  <CodeBlock code={snippet.code} />
                </div>
              ))}
            </div>
          </section>

          {/* Live demo */}
          <section id="live-demo" className="scroll-mt-20">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
              See it happen
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Live demo</h2>
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-300">
              <Prose text="This is a live simulation of the two recurrence relations above. The walkthrough on the right runs one step at a time: watch each sequence advance a term at a time as messages are sent (Gear 1), then Alice's state gets compromised and her box turns red, exactly like the cold-boot attack from the introduction, and finally a fresh Diffie-Hellman exchange re-seeds her sequence and the state turns green again, the same self-healing round trip Gear 2 describes, running on real code." />
            </p>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Protocol state
                </p>
                <div className="mt-3">
                  <RatchetVisualizer simulationState={simulationState} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Controls
                </p>
                <div className="mt-3">
                  <AdversaryHarness
                    simulationState={simulationState}
                    onStateChange={setSimulationState}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* The math */}
          <section id="the-math" className="scroll-mt-20">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
              The formal version
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Making the intuition precise
            </h2>
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-300">
              <Prose text={MATH_INTRO.text} />
            </p>

            <div className="mt-8 space-y-8">
              <div>
                <p className="text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-300">
                  <Prose text={MATH_REDUCTION.statement} />
                </p>
                <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                  <MathBlock math={MATH_REDUCTION.math} block />
                </div>
                <p className="mt-3 text-[0.9375rem] italic leading-relaxed text-gray-500 dark:text-gray-400">
                  <Prose text={MATH_REDUCTION.plainEnglish} />
                </p>
              </div>

              <div>
                <p className="font-semibold">And the self-healing guarantee, stated formally</p>
                <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                  <MathBlock math={MATH_REDUCTION.healing.math} block />
                </div>
                <p className="mt-3 text-[0.9375rem] italic leading-relaxed text-gray-500 dark:text-gray-400">
                  <Prose text={MATH_REDUCTION.healing.plainEnglish} />
                </p>
              </div>
            </div>
          </section>
        </div>

      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-5 py-6 md:px-8">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/portfolio" className="text-xs text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300">
              Back to portfolio
            </Link>
            <a
              href="https://github.com/camdenslade/Portfolio/tree/main/capstone/double-ratchet-core"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            >
              Full Rust source & tests
            </a>
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">© 2026 Camden Slade</p>
        </div>
      </footer>
    </main>
  );
};

export default CapstoneDeck;

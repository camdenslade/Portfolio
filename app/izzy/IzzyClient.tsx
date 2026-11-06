'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Assignment = {
  id: string;
  kind: 'assignment';
  title: string;
  dueDate: string; // yyyy-mm-dd, or '' for none
  course: string;
  done: boolean;
  createdAt: number;
  completedAt: number | null;
};

type Todo = {
  id: string;
  kind: 'todo';
  title: string;
  done: boolean;
  createdAt: number;
  completedAt: number | null;
};

type Item = Assignment | Todo;

const STORAGE_KEY = 'izzy-list-v1';

// ---------------------------------------------------------------------------
// Date helpers — relative phrasing only, no absolute dates in the UI
// ---------------------------------------------------------------------------

function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDaysFromToday(dateStr: string): number | null {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  const today = startOfDay(new Date());
  return Math.round((startOfDay(d).getTime() - today.getTime()) / 86400000);
}

function dueLabel(dateStr: string): string {
  const diff = diffDaysFromToday(dateStr);
  if (diff === null) return '';
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff === -1) return '1 day late';
  if (diff < -1) return `${Math.abs(diff)} days late`;
  if (diff > 1 && diff <= 6) return `Due in ${diff} days`;
  const d = parseLocalDate(dateStr)!;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Urgency gradient — inspired by Kalo's rose (near) -> gold (mid) ->
// blue (far out) due-date color system. Encodes urgency as color you can
// read at a glance, in addition to the relative-time text.
// ---------------------------------------------------------------------------

const ROSE = { h: 344, s: 68, fgLight: '#7A1F3F', fgDark: '#FFD9E4' };
const GOLD = { h: 38, s: 72, fgLight: '#7A4E12', fgDark: '#FFE4B3' };
const BLUE = { h: 214, s: 58, fgLight: '#1F4A7A', fgDark: '#CFE3FF' };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixStop(t: number, dark: boolean): { bg: string; fg: string } {
  let a = ROSE;
  let b = GOLD;
  let localT = t / 0.5;
  if (t > 0.5) {
    a = GOLD;
    b = BLUE;
    localT = (t - 0.5) / 0.5;
  }
  const h = lerp(a.h, b.h, localT);
  const s = lerp(a.s, b.s, localT);
  const lightness = dark ? 22 : 91;
  const fg = localT < 0.5 ? (dark ? a.fgDark : a.fgLight) : (dark ? b.fgDark : b.fgLight);
  return { bg: `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${lightness}%)`, fg };
}

function dueColor(dateStr: string, isPast: boolean, dark: boolean): { bg: string; fg: string } {
  if (isPast) {
    return { bg: `hsl(${ROSE.h} ${ROSE.s}% ${dark ? 20 : 88}%)`, fg: dark ? ROSE.fgDark : ROSE.fgLight };
  }
  const diff = diffDaysFromToday(dateStr);
  if (diff === null) return mixStop(0, dark);
  if (diff <= 0) return mixStop(0, dark);
  if (diff >= 10) return mixStop(1, dark);
  return mixStop(diff / 10, dark);
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function FlowerMark() {
  // A small five-petal flower, in the same rose accent used throughout —
  // Izzy's mark instead of a borrowed app logo or a profile photo.
  const petals = [0, 72, 144, 216, 288];
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 flex-shrink-0" aria-hidden>
      <g className="fill-[#C23B72] dark:fill-[#F0679E]">
        {petals.map((deg) => (
          <ellipse key={deg} cx="16" cy="9.5" rx="4.6" ry="6.5" transform={`rotate(${deg} 16 16)`} opacity={0.92} />
        ))}
      </g>
      <circle cx="16" cy="16" r="4" className="fill-[#FFE9A8] dark:fill-[#FFD873]" />
    </svg>
  );
}

function CatMark({ className = 'h-10 w-10' }: { className?: string }) {
  // A simple, soft, jellycat-ish sitting cat — used only in empty states,
  // a small "she'll like this" touch rather than a functional icon.
  return (
    <svg viewBox="0 0 48 48" className={`${className} flex-shrink-0`} aria-hidden>
      <g className="fill-gray-300 dark:fill-gray-700">
        <path d="M14 14 L10 4 L20 12 Z" />
        <path d="M34 14 L38 4 L28 12 Z" />
        <ellipse cx="24" cy="26" rx="15" ry="13" />
        <path d="M11 30 Q5 32 6 38 Q12 37 15 32 Z" />
        <path d="M37 30 Q43 32 42 38 Q36 37 33 32 Z" />
      </g>
      <g className="fill-gray-500 dark:fill-gray-500">
        <circle cx="18.5" cy="25" r="1.6" />
        <circle cx="29.5" cy="25" r="1.6" />
        <path d="M22.5 29.5 Q24 31 25.5 29.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-gray-500 dark:text-gray-500" />
      </g>
    </svg>
  );
}

function FlowerStem({ flip = false, className = 'h-40 w-16' }: { flip?: boolean; className?: string }) {
  // A single hand-drawn flowering stem with leaves — a quiet decorative
  // touch for the page margins, not shown on mobile where there's no
  // room for it. `flip` mirrors it for the opposite side of the page.
  return (
    <svg
      viewBox="0 0 60 200"
      className={`${className} flex-shrink-0`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden
    >
      <path
        d="M30 195 C 28 150, 34 110, 26 70 C 20 45, 30 25, 30 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-emerald-800/40 dark:text-emerald-300/25"
      />
      <path
        d="M27 130 C 12 122, 4 108, 6 92 C 20 94, 30 106, 27 130 Z"
        className="fill-emerald-800/25 dark:fill-emerald-300/15"
      />
      <path
        d="M25 90 C 42 84, 52 70, 50 54 C 34 58, 22 70, 25 90 Z"
        className="fill-emerald-800/25 dark:fill-emerald-300/15"
      />
      <g transform="translate(30 12)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="0" cy="-8" rx="4.4" ry="6.2" transform={`rotate(${deg})`} className="fill-[#C23B72]/70 dark:fill-[#F0679E]/60" />
        ))}
        <circle r="3.4" className="fill-[#FFE9A8]/90 dark:fill-[#FFD873]/80" />
      </g>
      <g transform="translate(24 62)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="0" cy="-6" rx="3.4" ry="4.8" transform={`rotate(${deg})`} className="fill-[#C23B72]/45 dark:fill-[#F0679E]/35" />
        ))}
        <circle r="2.6" className="fill-[#FFE9A8]/70 dark:fill-[#FFD873]/55" />
      </g>
    </svg>
  );
}

function FloatingBloom({
  className = 'h-10 w-10',
  delay = 0,
  duration = 7,
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) {
  // A single small bloom that gently drifts and turns in place — purely
  // decorative margin dressing, disabled automatically for anyone with
  // prefers-reduced-motion set (see the .izzy-float rule in globals.css).
  return (
    <svg
      viewBox="0 0 32 32"
      className={`izzy-float ${className} flex-shrink-0`}
      style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
      aria-hidden
    >
      <g className="fill-[#C23B72]/60 dark:fill-[#F0679E]/50">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="16" cy="9.5" rx="4.6" ry="6.5" transform={`rotate(${deg} 16 16)`} />
        ))}
      </g>
      <circle cx="16" cy="16" r="4" className="fill-[#FFE9A8]/80 dark:fill-[#FFD873]/70" />
    </svg>
  );
}

function AssignmentChip({
  a,
  onToggle,
  onDelete,
  done,
}: {
  a: Assignment;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  done?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs dark:border-gray-700 ${
        done ? 'line-through opacity-60' : ''
      }`}
    >
      <button onClick={() => onToggle(a.id)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {a.title}
      <button onClick={() => onDelete(a.id)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
        <TrashIcon />
      </button>
    </span>
  );
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CheckIcon({ light }: { light?: boolean } = {}) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[18px] w-[18px]">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke={light ? 'currentColor' : 'white'}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={light ? 'text-gray-300 dark:text-gray-600' : undefined}
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M2.5 4.5H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 4.5V3.2C6 2.7 6.4 2.3 6.9 2.3H9.1C9.6 2.3 10 2.7 10 3.2V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4.5L4.6 12.6C4.65 13.15 5.1 13.6 5.65 13.6H10.35C10.9 13.6 11.35 13.15 11.4 12.6L12 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IzzyClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [dark, setDark] = useState(false);
  const [todayLabel, setTodayLabel] = useState('');

  const [assignTitle, setAssignTitle] = useState('');
  const [assignDate, setAssignDate] = useState('');
  const [assignCourse, setAssignCourse] = useState('');
  const [showCourseField, setShowCourseField] = useState(false);
  const [todoTitle, setTodoTitle] = useState('');

  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [syncStatus, setSyncStatus] = useState('Loading…');
  const [assignView, setAssignView] = useState<'graph' | 'bar'>('graph');

  // Theme: same pattern as the rest of the site.
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

  // Read the local cache immediately (instant paint, works offline), then
  // subscribe to Firestore for live cross-device sync. Every snapshot,
  // local or remote, is mirrored back into localStorage as a fallback.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore corrupt cache, start fresh
    }
    setTodayLabel(new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));

    const unsubscribe = onSnapshot(
      collection(db, 'izzy-list'),
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Item, 'id'>) })) as Item[];
        setItems(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // storage full or unavailable; in-memory state still works
        }
        setSyncStatus('Synced');
      },
      (err) => {
        console.error('izzy sync failed', err);
        setSyncStatus("Offline copy shown, will sync when possible");
      }
    );
    return () => unsubscribe();
  }, []);

  const assignments = useMemo(
    () => items.filter((i): i is Assignment => i.kind === 'assignment'),
    [items]
  );
  const todos = useMemo(() => items.filter((i): i is Todo => i.kind === 'todo'), [items]);

  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const ad = a.dueDate ? (parseLocalDate(a.dueDate)?.getTime() ?? Infinity) : Infinity;
      const bd = b.dueDate ? (parseLocalDate(b.dueDate)?.getTime() ?? Infinity) : Infinity;
      return ad - bd;
    });
  }, [assignments]);

  // Open assignments with a due date, soonest first — these are what get
  // plotted on the Graph curve / rendered as bars. Scheduled items with no
  // due date live in a separate "Unscheduled" shelf, per Kalo's rule that
  // undated tasks never appear on the curve or chart.
  const scheduledOpenAssignments = useMemo(
    () => sortedAssignments.filter((a) => !a.done && a.dueDate),
    [sortedAssignments]
  );
  const unscheduledOpenAssignments = useMemo(
    () => sortedAssignments.filter((a) => !a.done && !a.dueDate),
    [sortedAssignments]
  );
  const doneAssignments = useMemo(() => sortedAssignments.filter((a) => a.done), [sortedAssignments]);

  // Position each scheduled assignment along a 0 (due soon/overdue) .. 1
  // (10+ days out) axis, matching the same urgency math used for its color.
  const graphNodes = useMemo(() => {
    return scheduledOpenAssignments.map((a) => {
      const diff = diffDaysFromToday(a.dueDate);
      const isPast = diff !== null && diff < 0;
      const t = diff === null ? 0 : Math.max(0, Math.min(1, diff / 10));
      return { item: a, t, color: dueColor(a.dueDate, isPast, dark), label: dueLabel(a.dueDate) };
    });
  }, [scheduledOpenAssignments, dark]);

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [todos]);

  // The single most urgent open item, across assignments and todos, to show
  // as the one focal thing at the top of the page — overdue/soonest-due
  // assignments first, then any open todo, so there is always one obvious
  // next action instead of a list to scan.
  const nextUp = useMemo(() => {
    const openAssignments = sortedAssignments.filter((a) => !a.done);
    const dated = openAssignments.find((a) => a.dueDate);
    if (dated) return dated;
    if (openAssignments.length) return openAssignments[0];
    return sortedTodos.find((t) => !t.done) ?? null;
  }, [sortedAssignments, sortedTodos]);

  const remainingCount = useMemo(() => {
    const openTotal = items.filter((i) => !i.done).length;
    return nextUp ? Math.max(0, openTotal - 1) : openTotal;
  }, [items, nextUp]);

  const addAssignment = useCallback((title: string, dueDate: string, course: string) => {
    const id = uid();
    const item: Assignment = {
      id,
      kind: 'assignment',
      title,
      dueDate,
      course,
      done: false,
      createdAt: Date.now(),
      completedAt: null,
    };
    setItems((prev) => [...prev, item]);
    const { id: _id, ...data } = item;
    setDoc(doc(db, 'izzy-list', id), data).catch((err) => {
      console.error('add failed', err);
      setSyncStatus("Couldn't save, will keep trying");
    });
  }, []);

  const addTodo = useCallback((title: string) => {
    const id = uid();
    const item: Todo = {
      id,
      kind: 'todo',
      title,
      done: false,
      createdAt: Date.now(),
      completedAt: null,
    };
    setItems((prev) => [...prev, item]);
    const { id: _id, ...data } = item;
    setDoc(doc(db, 'izzy-list', id), data).catch((err) => {
      console.error('add failed', err);
      setSyncStatus("Couldn't save, will keep trying");
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    let nextDone = true;
    let nextCompletedAt: number | null = null;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        nextDone = !i.done;
        nextCompletedAt = nextDone ? Date.now() : null;
        return { ...i, done: nextDone, completedAt: nextCompletedAt };
      })
    );
    updateDoc(doc(db, 'izzy-list', id), { done: nextDone, completedAt: nextCompletedAt }).catch((err) => {
      console.error('toggle failed', err);
      setSyncStatus("Couldn't save, will keep trying");
    });
  }, []);

  const deleteItem = useCallback(
    (id: string) => {
      // Commit any earlier pending delete immediately; only one undo slot at a time.
      if (undoTimer.current) {
        clearTimeout(undoTimer.current);
        undoTimer.current = null;
      }
      setPendingDelete((prevPending) => {
        if (prevPending) {
          deleteDoc(doc(db, 'izzy-list', prevPending.id)).catch((err) => console.error('delete failed', err));
        }
        return null;
      });

      setItems((prev) => {
        const item = prev.find((i) => i.id === id) ?? null;
        if (item) {
          setPendingDelete(item);
          undoTimer.current = setTimeout(() => {
            deleteDoc(doc(db, 'izzy-list', item.id)).catch((err) => console.error('delete failed', err));
            setPendingDelete(null);
            undoTimer.current = null;
          }, 5000);
        }
        return prev.filter((i) => i.id !== id);
      });
    },
    []
  );

  const undoDelete = useCallback(() => {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    setPendingDelete((current) => {
      if (current) setItems((prev) => [...prev, current]);
      return null;
    });
    // The Firestore doc was never deleted (delete only fires after the
    // timer above), so undo just restores local state, nothing to re-write.
  }, []);

  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = assignTitle.trim();
    if (!title) return;
    addAssignment(title, assignDate, assignCourse.trim());
    setAssignTitle('');
    setAssignDate('');
    setAssignCourse('');
    setShowCourseField(false);
  }

  function handleTodoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = todoTitle.trim();
    if (!title) return;
    addTodo(title);
    setTodoTitle('');
  }

  const roseText = dark ? '#F0679E' : '#C23B72';

  return (
    <main
      className="relative min-h-dvh overflow-x-clip text-gray-900 dark:text-gray-100 transition-colors duration-200"
      style={{ background: dark ? '#160f13' : '#FFFBFC' }}
    >
      {/* Decorative margin flowers — wide screens only, purely ornamental.
          A rooted stem grounds each margin, with a few small blooms
          drifting slowly around it (disabled under prefers-reduced-motion). */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc((100%-42rem)/2)] xl:block">
        <FlowerStem className="absolute bottom-24 left-8 h-48 w-20 text-emerald-800/40 dark:text-emerald-300/25" />
        <FloatingBloom className="absolute top-20 left-10 h-8 w-8" delay={0} duration={8} />
        <FloatingBloom className="absolute top-64 left-20 h-6 w-6" delay={2.5} duration={6.5} />
        <FloatingBloom className="absolute bottom-32 left-4 h-5 w-5" delay={1.2} duration={7.5} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[calc((100%-42rem)/2)] xl:block">
        <FlowerStem flip className="absolute bottom-40 right-8 h-40 w-16 text-emerald-800/40 dark:text-emerald-300/25" />
        <FlowerStem className="absolute top-24 right-16 h-32 w-14 text-emerald-800/40 dark:text-emerald-300/25" />
        <FloatingBloom className="absolute top-96 right-10 h-7 w-7" delay={0.8} duration={7} />
        <FloatingBloom className="absolute bottom-16 right-20 h-6 w-6" delay={3.4} duration={6} />
        <FloatingBloom className="absolute top-8 right-6 h-5 w-5" delay={1.8} duration={8.5} />
      </div>

      <nav className="relative border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3.5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100">
            <ChevronLeft /> Home
          </Link>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:bg-gray-100 active:scale-95 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:active:bg-gray-800"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-5 sm:py-10 md:px-8 md:py-14">

        {/* Masthead */}
        <header className="mb-8 flex items-center gap-3.5">
          <FlowerMark />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bello, Izzy</h1>
            <p className="mt-0.5 truncate text-sm text-gray-400 dark:text-gray-500 sm:text-base">{todayLabel}</p>
          </div>
        </header>

        {/* Up next — the one thing to look at, big and unmissable */}
        <div
          className="mb-8 rounded-[28px] border p-6"
          style={{
            borderColor: dark ? '#3d2530' : '#F5D3E0',
            background: dark ? '#241620' : '#FEF1F6',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: roseText }}>
            Up next
          </p>
          {nextUp ? (
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => toggleItem(nextUp.id)}
                aria-label="Mark done"
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-[3px] active:scale-95 transition-transform"
                style={{ borderColor: roseText }}
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-7 w-7">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke={roseText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-xl font-semibold leading-snug">{nextUp.title}</div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {nextUp.kind === 'assignment' && nextUp.dueDate ? dueLabel(nextUp.dueDate) : 'On your to-do list'}
                  {nextUp.kind === 'assignment' && nextUp.course ? ` · ${nextUp.course}` : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-4">
              <CatMark />
              <p className="text-lg leading-snug text-gray-500 dark:text-gray-400">
                You&rsquo;re all caught up. Nothing urgent right now.
              </p>
            </div>
          )}
          {remainingCount > 0 && (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
              {remainingCount} more open {remainingCount === 1 ? 'item' : 'items'} below, whenever you&rsquo;re ready.
            </p>
          )}
        </div>

        {/* Assignments */}
        <section className="mb-9">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Assignments
            </h2>
          </div>

          {/* Graph / Bar toggle — full width, tall, unambiguous */}
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-900">
            {(['graph', 'bar'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setAssignView(v)}
                className={`rounded-xl py-3 text-base font-semibold capitalize transition-colors ${
                  assignView === v ? 'text-white dark:text-gray-950 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
                style={assignView === v ? { background: roseText } : undefined}
              >
                {v === 'graph' ? 'Graph view' : 'Bar view'}
              </button>
            ))}
          </div>

          {scheduledOpenAssignments.length === 0 && unscheduledOpenAssignments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
              <CatMark />
              <p className="text-base text-gray-400 dark:text-gray-500">Nothing here yet. Add one below.</p>
            </div>
          ) : assignView === 'graph' ? (
            <div className="rounded-2xl border border-gray-100 p-5 dark:border-gray-800">
              {scheduledOpenAssignments.length === 0 ? (
                <p className="py-8 text-center text-base text-gray-400 dark:text-gray-500">
                  Nothing scheduled yet. Add a due date below and it&rsquo;ll show up here.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {graphNodes.map((n) => (
                    <li key={n.item.id} className="flex items-center gap-4">
                      <button
                        onClick={() => toggleItem(n.item.id)}
                        aria-label="Toggle done"
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-[3px] active:scale-95 transition-transform"
                        style={{ borderColor: n.color.bg }}
                      >
                        <span className="h-4 w-4 rounded-full" style={{ background: n.color.bg }} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-medium leading-snug">{n.item.title}</div>
                        <div className="text-sm font-semibold" style={{ color: dark ? n.color.bg : n.color.fg }}>
                          {n.label}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(n.item.id)}
                        aria-label="Delete"
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:bg-gray-100 active:scale-95 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:active:bg-gray-800"
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {(unscheduledOpenAssignments.length > 0 || doneAssignments.length > 0) && (
                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                  {unscheduledOpenAssignments.length > 0 && (
                    <>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Unscheduled
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {unscheduledOpenAssignments.map((a) => (
                          <AssignmentChip key={a.id} a={a} onToggle={toggleItem} onDelete={deleteItem} />
                        ))}
                      </div>
                    </>
                  )}
                  {doneAssignments.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${unscheduledOpenAssignments.length > 0 ? 'mt-3' : ''}`}>
                      {doneAssignments.map((a) => (
                        <AssignmentChip key={a.id} a={a} onToggle={toggleItem} onDelete={deleteItem} done />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {[...scheduledOpenAssignments.map((a) => ({ a, t: graphNodes.find((n) => n.item.id === a.id)?.t ?? 1 })),
                ...unscheduledOpenAssignments.map((a) => ({ a, t: 1 }))].map(({ a, t }) => {
                const label = dueLabel(a.dueDate);
                const isPast = label.indexOf('late') !== -1;
                const color = label ? dueColor(a.dueDate, isPast, dark) : mixStop(1, dark);
                const barWidth = 12 + (1 - t) * 88;
                return (
                  <li key={a.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                    <button
                      onClick={() => toggleItem(a.id)}
                      aria-label="Toggle done"
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-[3px] border-gray-200 active:scale-95 transition-transform dark:border-gray-700"
                    >
                      <CheckIcon light />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-base font-medium">{a.title}</span>
                        <span className="flex-shrink-0 text-sm font-semibold" style={{ color: dark ? color.bg : color.fg }}>
                          {label || 'No date'}
                        </span>
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-3 rounded-full" style={{ width: `${barWidth}%`, background: color.bg }} />
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(a.id)}
                      aria-label="Delete"
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:bg-gray-100 active:scale-95 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:active:bg-gray-800"
                    >
                      <TrashIcon />
                    </button>
                  </li>
                );
              })}
              {doneAssignments.map((a) => (
                <li key={a.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4 opacity-50 dark:border-gray-800">
                  <button
                    onClick={() => toggleItem(a.id)}
                    aria-label="Toggle done"
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-[3px]"
                    style={{ borderColor: roseText, background: roseText }}
                  >
                    <CheckIcon />
                  </button>
                  <span className="min-w-0 flex-1 truncate text-base line-through">{a.title}</span>
                  <button
                    onClick={() => deleteItem(a.id)}
                    aria-label="Delete"
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:bg-gray-100 active:scale-95 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:active:bg-gray-800"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAssignSubmit} className="mt-4 flex flex-col gap-3">
            <input
              id="izzy-assign-title"
              type="text"
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
              placeholder="Assignment name"
              autoComplete="off"
              required
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <div className="flex gap-3">
              <input
                id="izzy-assign-date"
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                style={{ colorScheme: dark ? 'dark' : 'light' }}
              />
            </div>
            {showCourseField && (
              <input
                id="izzy-assign-course"
                type="text"
                value={assignCourse}
                onChange={(e) => setAssignCourse(e.target.value)}
                placeholder="Course (optional)"
                autoComplete="off"
                autoFocus
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            )}
            {!showCourseField && (
              <button
                type="button"
                onClick={() => setShowCourseField(true)}
                className="self-start py-1 text-sm text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                + add course
              </button>
            )}
            <button
              type="submit"
              className="w-full rounded-2xl py-4 text-base font-bold text-white active:scale-[0.98] transition-transform dark:text-gray-950"
              style={{ background: roseText }}
            >
              Add assignment
            </button>
          </form>
        </section>

        {/* Todos */}
        <section className="mb-9">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              To-dos
            </h2>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {todos.filter((t) => !t.done).length ? `${todos.filter((t) => !t.done).length} open` : 'all clear'}
            </span>
          </div>

          {sortedTodos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
              <FlowerMark />
              <p className="text-base text-gray-400 dark:text-gray-500">Nothing on the list. Add one below.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {sortedTodos.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
                  style={{ opacity: t.done ? 0.5 : 1 }}
                >
                  <button
                    onClick={() => toggleItem(t.id)}
                    aria-label="Toggle done"
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-[3px] border-gray-200 active:scale-95 transition-transform dark:border-gray-700"
                    style={t.done ? { borderColor: roseText, background: roseText } : undefined}
                  >
                    {t.done ? <CheckIcon /> : <CheckIcon light />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-medium leading-snug" style={{ textDecoration: t.done ? 'line-through' : 'none' }}>
                      {t.title}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(t.id)}
                    aria-label="Delete"
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:bg-gray-100 active:scale-95 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:active:bg-gray-800"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleTodoSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              id="izzy-todo-title"
              type="text"
              value={todoTitle}
              onChange={(e) => setTodoTitle(e.target.value)}
              placeholder="Add a to-do"
              autoComplete="off"
              required
              className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="flex-shrink-0 rounded-2xl px-6 py-4 text-base font-bold text-white active:scale-[0.98] transition-transform dark:text-gray-950"
              style={{ background: roseText }}
            >
              Add
            </button>
          </form>
        </section>

        <footer className="mt-12 text-center text-sm text-gray-400 dark:text-gray-500">
          {syncStatus}
        </footer>
      </div>

      {/* Undo toast */}
      {pendingDelete && (
        <div
          className="fixed left-1/2 z-10 flex w-[calc(100%-32px)] max-w-sm -translate-x-1/2 items-center gap-4 rounded-2xl bg-gray-900 px-5 py-4 text-base text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <span className="min-w-0 flex-1 truncate">Deleted &ldquo;{pendingDelete.title}&rdquo;</span>
          <button
            onClick={undoDelete}
            className="flex-shrink-0 py-1 text-base font-bold active:scale-95 transition-transform"
            style={{ color: dark ? '#F0679E' : '#C23B72' }}
          >
            Undo
          </button>
        </div>
      )}
    </main>
  );
}

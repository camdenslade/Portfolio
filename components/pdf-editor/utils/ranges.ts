import type { SplitRange } from '../types/pdf';

export const parseRanges = (raw: string, maxPage: number): SplitRange[] => {
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error('No ranges provided');
  }

  const ranges = parts.map((part) => {
    const [startRaw, endRaw] = part.split('-').map((p) => p.trim());
    const start = Number(startRaw);
    const end = Number(endRaw ?? startRaw);

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      throw new Error(`Invalid range: ${part}`);
    }

    if (start < 1 || end < 1 || start > maxPage || end > maxPage) {
      throw new Error(`Range out of bounds: ${part}`);
    }

    return {
      start: Math.min(start, end),
      end: Math.max(start, end)
    };
  });

  return ranges;
};

export const indicesFromRanges = (ranges: SplitRange[]): number[] => {
  const values: number[] = [];
  for (const range of ranges) {
    for (let i = range.start; i <= range.end; i += 1) {
      values.push(i - 1);
    }
  }

  return Array.from(new Set(values)).sort((a, b) => a - b);
};

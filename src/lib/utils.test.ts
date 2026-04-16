import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  alignmentColor,
  alignmentLabel,
  clamp,
  formatCredits,
  formatStat,
  percentOf,
  timeAgo,
} from '@/lib/utils';

describe('utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats numbers for display', () => {
    expect(formatCredits(1234567)).toBe('1,234,567');
    expect(formatStat(12.3456)).toBe('12.35');
  });

  it('clamps and computes percentages safely', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-5, 1, 10)).toBe(1);
    expect(clamp(50, 1, 10)).toBe(10);

    expect(percentOf(25, 100)).toBe(25);
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(10, 0)).toBe(0);
  });

  it('formats relative time buckets', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));

    expect(timeAgo('2026-04-16T11:59:45.000Z')).toBe('just now');
    expect(timeAgo('2026-04-16T11:10:00.000Z')).toBe('50m ago');
    expect(timeAgo('2026-04-16T10:00:00.000Z')).toBe('2h ago');
    expect(timeAgo('2026-04-14T12:00:00.000Z')).toBe('2d ago');
  });

  it('maps alignment labels and colors across threshold boundaries', () => {
    expect(alignmentLabel(51)).toBe('Saint');
    expect(alignmentLabel(50)).toBe('Neutral Good');
    expect(alignmentLabel(21)).toBe('Neutral Good');
    expect(alignmentLabel(20)).toBe('Neutral');
    expect(alignmentLabel(-20)).toBe('Rogue');
    expect(alignmentLabel(-50)).toBe('Outlaw');

    expect(alignmentColor(21)).toBe('text-emerald-400');
    expect(alignmentColor(20)).toBe('text-slate-300');
    expect(alignmentColor(-20)).toBe('text-red-400');
  });
});

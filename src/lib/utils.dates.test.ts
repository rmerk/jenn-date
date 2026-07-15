import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNextFriday, getNextSaturday, getNextWeekend } from './utils';

describe('quick-pick date helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps This Saturday and Next weekend on distinct dates mid-week', () => {
    // Wednesday Jul 15, 2026 — matches the reported screenshot
    vi.setSystemTime(new Date(2026, 6, 15, 12, 0, 0));

    expect(getNextFriday()).toBe('2026-07-17');
    expect(getNextSaturday()).toBe('2026-07-18');
    expect(getNextWeekend()).toBe('2026-07-25');
    expect(getNextWeekend()).not.toBe(getNextSaturday());
  });

  it('never aliases Next weekend to This Saturday across the week', () => {
    for (let day = 12; day <= 19; day++) {
      vi.setSystemTime(new Date(2026, 6, day, 12, 0, 0));
      expect(getNextWeekend(), `day ${day}`).not.toBe(getNextSaturday());
    }
  });
});

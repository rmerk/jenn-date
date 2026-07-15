import { describe, expect, it } from 'vitest';
import { generateJenniferCalendarICS } from './utils';
import type { LockedPlan } from './types';

const basePlan: LockedPlan = {
  vibe: 'easy-mode',
  foodFantasy: 'restaurant',
  restaurantCuisine: 'thai',
  restaurantNote: '',
  outingActivity: undefined,
  outingNote: '',
  chosenDate: '2026-07-18',
  chosenTime: '19:00',
  secretHint: 'Somewhere quiet',
  lockedAt: '2026-07-15T12:00:00.000Z',
};

describe('generateJenniferCalendarICS', () => {
  it('puts her cuisine and note into the event summary and description', () => {
    const ics = generateJenniferCalendarICS(basePlan);

    expect(ics).toContain('SUMMARY:Our night · Thai');
    expect(ics).toContain('DESCRIPTION:Vibe: Easy mode\\nFood: Thai\\nWhen:');
    expect(ics).toContain('Your note: Somewhere quiet');
    expect(ics).toContain('DTSTART:20260718T190000');
    expect(ics).toContain('DTEND:20260718T230000');
  });

  it('uses outing selections when the vibe is go-out', () => {
    const ics = generateJenniferCalendarICS({
      ...basePlan,
      vibe: 'go-out',
      foodFantasy: 'outing',
      restaurantCuisine: undefined,
      outingActivity: 'movie',
      outingNote: 'bookstore first',
      secretHint: '',
    });

    expect(ics).toContain('SUMMARY:Our night · Movie — bookstore first');
    expect(ics).toContain('Outing: Movie — bookstore first');
    expect(ics).not.toContain('Your note:');
  });
});

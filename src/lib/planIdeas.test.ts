import { describe, expect, it } from 'vitest';
import type { QuestAnswers } from './types';
import { getArtfulSummaryLines, getChoiceAlignedPlan, getConstellationIdeas, hasContradictoryIdeas } from './planIdeas';
import { generateSummary } from './utils';

const VIBES = ['stay-in', 'go-out', 'new-thing', 'easy-mode'] as const;
const FOODS = ['home-cooked', 'restaurant', 'takeout', 'cafe', 'casual', 'fancy', 'surprise'] as const;

function makeAnswers(overrides: Partial<QuestAnswers>): QuestAnswers {
  return {
    vibe: 'stay-in',
    foodFantasy: 'takeout',
    chosenDate: '2099-06-15',
    chosenTime: '19:00',
    ...overrides,
  };
}

describe('choice coherence across all answer combinations', () => {
  it('generates 3–4 non-contradictory ideas for every vibe × food combo', () => {
    for (const vibe of VIBES) {
      for (const foodFantasy of FOODS) {
        const answers = makeAnswers({ vibe, foodFantasy });
        const ideas = getConstellationIdeas(answers);
        expect(ideas.length, `${vibe}/${foodFantasy}`).toBeGreaterThanOrEqual(3);
        expect(ideas.length).toBeLessThanOrEqual(4);
        expect(hasContradictoryIdeas(ideas, vibe, foodFantasy)).toBe(false);
      }
    }
  });

  it('summary reads naturally from vibe and food choices', () => {
    const summary = generateSummary(makeAnswers({ vibe: 'go-out', foodFantasy: 'restaurant' }));
    expect(summary).toMatch(/I'm planning go out\. Food: restaurant\. Locked in — can't wait\./);
  });

  it('aligns each plan row to a quest choice label', () => {
    const answers = makeAnswers({
      vibe: 'new-thing',
      foodFantasy: 'restaurant',
      restaurantCuisine: 'thai',
      chosenDate: '2026-07-23',
      chosenTime: '19:00',
      secretHint: 'extra forehead kisses',
    });
    const rows = getChoiceAlignedPlan(answers);
    expect(rows.map((r) => r.from)).toEqual(['vibe', 'food', 'when', 'hint']);
    expect(rows.map((r) => r.label)).toEqual(['Vibe', 'Food', 'When', 'Your note']);
    expect(rows[0]?.choice).toBe('Something new');
    expect(rows[1]?.choice).toBe('Thai');
    expect(rows[2]?.choice).toMatch(/Jul 23/);
    expect(rows[2]?.choice).toMatch(/7 PM/);
    expect(rows[3]?.choice).toBe('extra forehead kisses');
    expect(rows[1]?.plan).toBe("I'll find a thai sit-down spot.");
  });

  it('renders an artful three-line blurb from choices', () => {
    const lines = getArtfulSummaryLines(
      makeAnswers({
        vibe: 'new-thing',
        foodFantasy: 'restaurant',
        restaurantCuisine: 'thai',
        restaurantNote: 'nomy',
      }),
    );
    expect(lines).toEqual([
      'Something we haven’t done.',
      'Thai — nomy.',
      'Locked in — can’t wait.',
    ]);
  });

  it('surfaces her chosen answers as the editable row content', () => {
    const answers = makeAnswers({
      vibe: 'new-thing',
      foodFantasy: 'restaurant',
      restaurantCuisine: 'pizza',
      restaurantNote: 'nomy',
      chosenDate: '2026-07-29',
      chosenTime: '19:00',
      secretHint: 'extra forehead kisses please',
    });
    const rows = getChoiceAlignedPlan(answers);

    expect(rows.map((r) => r.from)).toEqual(['vibe', 'food', 'when', 'hint']);
    expect(rows.map((r) => r.label)).toEqual(['Vibe', 'Food', 'When', 'Your note']);
    expect(rows[0]?.choice).toBe('Something new');
    expect(rows[1]?.choice).toBe('Pizza — nomy');
    expect(rows[2]?.choice).toMatch(/Jul 29/);
    expect(rows[2]?.choice).toMatch(/7 PM/);
    expect(rows[3]?.choice).toBe('extra forehead kisses please');
    expect(rows[3]?.plan).toBe("I'll read your note!");
    expect(rows[1]?.plan).toBe("I'll find a pizza sit-down spot — you mentioned nomy.");
  });

  it('maps go-out step 2 to an outing row, not food', () => {
    const answers = makeAnswers({
      vibe: 'go-out',
      foodFantasy: 'surprise',
      outingActivity: 'live-music',
      outingNote: 'somewhere loud',
      chosenDate: '2026-07-29',
      chosenTime: '19:00',
    });
    const rows = getChoiceAlignedPlan(answers);
    expect(rows[1]?.label).toBe('Outing');
    expect(rows[1]?.choice).toBe('Live music — somewhere loud');
    expect(rows[1]?.plan.toLowerCase()).toMatch(/live music/);
    expect(getArtfulSummaryLines(answers)[1]).toBe('Live music — somewhere loud.');
  });
});

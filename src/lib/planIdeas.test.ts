import { describe, expect, it } from 'vitest';
import type { QuestAnswers } from './types';
import { getConstellationIdeas, hasContradictoryIdeas } from './planIdeas';
import { generateSummary } from './utils';

const VIBES = ['stay-in', 'go-out', 'new-thing', 'easy-mode'] as const;
const FOODS = ['home-cooked', 'restaurant', 'takeout', 'cafe', 'casual', 'fancy', 'surprise'] as const;
const FEELINGS = ['giggly', 'cherished', 'spoiled', 'silly', 'adventurous', 'peaceful', 'electric', 'home', 'loved'] as const;

function makeAnswers(overrides: Partial<QuestAnswers>): QuestAnswers {
  return {
    vibe: 'stay-in',
    foodFantasy: 'takeout',
    chosenDate: '2099-06-15',
    feelingWord: 'loved',
    ...overrides,
  };
}

describe('choice coherence across all answer combinations', () => {
  it('generates 3–4 non-contradictory ideas for every vibe × food × feeling combo', () => {
    for (const vibe of VIBES) {
      for (const foodFantasy of FOODS) {
        for (const feelingWord of FEELINGS) {
          const answers = makeAnswers({ vibe, foodFantasy, feelingWord });
          const ideas = getConstellationIdeas(answers);
          expect(ideas.length, `${vibe}/${foodFantasy}/${feelingWord}`).toBeGreaterThanOrEqual(3);
          expect(ideas.length).toBeLessThanOrEqual(4);
          expect(hasContradictoryIdeas(ideas, vibe, foodFantasy)).toBe(false);
        }
      }
    }
  });

  it('summary uses human labels without awkward feeling-word grammar', () => {
    for (const feelingWord of FEELINGS) {
      const summary = generateSummary(makeAnswers({ feelingWord }));
      expect(summary).not.toMatch(/\bfeel home\b/i);
      if (feelingWord === 'home') {
        expect(summary.toLowerCase()).toContain('at home');
      }
    }
  });
});

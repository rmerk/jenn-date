import { describe, expect, it } from 'vitest';
import { getStep2Copy, isOutingStepVibe, QUESTIONS } from './questions';

describe('vibe → step 2 follow-up', () => {
  it('sends go-out to an outing follow-up, not food', () => {
    expect(isOutingStepVibe('go-out')).toBe(true);
    expect(isOutingStepVibe('new-thing')).toBe(false);
    expect(getStep2Copy('go-out').mode).toBe('outing');
    expect(getStep2Copy('go-out').prompt).toMatch(/do when we go out/i);
    expect(getStep2Copy('new-thing').mode).toBe('food');
    expect(getStep2Copy('new-thing').prompt).toMatch(/food/i);
  });

  it('gives each vibe option a short description without previewing the next step', () => {
    const vibe = QUESTIONS.find((q) => q.key === 'vibe');
    for (const opt of vibe?.options ?? []) {
      expect(opt.description?.toLowerCase()).not.toMatch(/\bnext\b/);
    }
  });
});

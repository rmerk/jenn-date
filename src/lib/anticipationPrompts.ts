/**
 * Pre-date anticipation lines — the kind of thing you'd actually text her
 * in the days leading up to the night. Husband-editable.
 *
 * Shown on the locked screen while the date is still in the future.
 */

import type { LockedPlan } from './types';
import { VIBE_MIGRATION } from './planStorage';
import { getFoodCategoryLabel } from './questions';

interface TaggedAnticipation {
  text: string | ((daysUntil: number, plan: LockedPlan) => string);
  vibes?: string[];
  foods?: string[];
}

const ANTICIPATION_POOL: TaggedAnticipation[] = [
  {
    text: (days) =>
      days === 1
        ? "Tomorrow's our night — already cleared my calendar."
        : `${days} days until our night — already cleared my calendar.`,
    vibes: ['stay-in', 'go-out', 'new-thing', 'easy-mode'],
  },
  {
    text: () => "Been thinking about what you told me. You're going to love it.",
    vibes: ['stay-in', 'go-out', 'new-thing', 'easy-mode'],
  },
  {
    text: (days) =>
      days <= 3
        ? "Almost time — I'm not telling you everything yet."
        : "Still a little ways out — I'm not telling you everything yet.",
  },
  {
    text: () => 'Just a heads up — wear something comfy. Trust me.',
    vibes: ['stay-in', 'easy-mode'],
  },
  {
    text: (_days, plan) =>
      `I already know you want ${getFoodCategoryLabel(plan.foodFantasy).toLowerCase()} — I was listening.`,
    foods: ['restaurant', 'home-cooked', 'takeout', 'cafe', 'fancy', 'casual'],
  },
  {
    text: () => 'Something new is on the books — that\'s what you wanted, right?',
    vibes: ['new-thing'],
  },
  {
    text: () => 'Tonight is easy mode for you. I handle the rest.',
    vibes: ['easy-mode'],
  },
];

function matchesAnticipation(a: TaggedAnticipation, plan: LockedPlan): boolean {
  const vibe = VIBE_MIGRATION[plan.vibe] ?? plan.vibe;
  if (a.vibes && !a.vibes.includes(vibe)) return false;
  if (a.foods && !a.foods.includes(plan.foodFantasy)) return false;
  return true;
}

function renderAnticipation(a: TaggedAnticipation, daysUntil: number, plan: LockedPlan): string {
  if (typeof a.text === 'function') {
    return a.text(daysUntil, plan);
  }
  return a.text;
}

export function getAnticipationForPlan(plan: LockedPlan, daysUntil: number): string {
  const viable = ANTICIPATION_POOL.filter((a) => matchesAnticipation(a, plan));
  const pool = viable.length > 0 ? viable : ANTICIPATION_POOL;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return renderAnticipation(pick, daysUntil, plan);
}

/** @deprecated Use getAnticipationForPlan when a plan is available */
export function getRandomAnticipation(): string {
  const pick = ANTICIPATION_POOL[Math.floor(Math.random() * ANTICIPATION_POOL.length)];
  if (typeof pick.text === 'function') {
    const stub = {
      vibe: 'stay-in',
      foodFantasy: 'takeout',
    } as LockedPlan;
    return pick.text(3, stub);
  }
  return pick.text;
}

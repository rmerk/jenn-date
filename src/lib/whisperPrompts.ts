/**
 * Whisper prompts — short lines you'd actually say to her that night.
 * Husband-editable. Tagged so only plausible lines surface for her picks.
 */

import type { LockedPlan } from './types';
import { VIBE_MIGRATION } from './planStorage';

interface TaggedWhisper {
  text: string;
  vibes?: string[];
  foods?: string[];
}

const WHISPER_POOL: TaggedWhisper[] = [
  {
    text: 'Extra forehead kisses the moment I see you.',
  },
  {
    text: 'I already got the dumpling sauce — the good one.',
    foods: ['home-cooked', 'takeout', 'restaurant', 'surprise'],
  },
  {
    text: 'Cleared the evening. No phones. Just us.',
    vibes: ['stay-in', 'easy-mode'],
  },
  {
    text: "I'm going to make you laugh that quiet laugh you do.",
    vibes: ['stay-in', 'go-out', 'new-thing'],
  },
  {
    text: 'Blanket fort is half-built in my head already.',
    vibes: ['stay-in'],
  },
  {
    text: 'Found the dark spot for stargazing. Soft blanket packed.',
  },
  {
    text: "I listened to every word. You're going to notice.",
  },
  {
    text: 'Zero chores tonight. You just get taken care of.',
    vibes: ['easy-mode', 'stay-in'],
  },
  {
    text: 'Got us a table — you just show up looking amazing.',
    vibes: ['go-out', 'new-thing'],
    foods: ['restaurant', 'fancy'],
  },
  {
    text: 'Something new is booked. Trust me on this one.',
    vibes: ['new-thing'],
  },
];

export const CLOSE_PHRASES: string[] = [
  "Got it — I'll say it later",
  'Saving this one for tonight',
];

function matchesWhisper(w: TaggedWhisper, plan: LockedPlan): boolean {
  const vibe = VIBE_MIGRATION[plan.vibe] ?? plan.vibe;

  if (w.vibes && !w.vibes.includes(vibe)) return false;
  if (w.foods && !w.foods.includes(plan.foodFantasy)) return false;
  return true;
}

export function getWhisperForPlan(plan: LockedPlan): string {
  const viable = WHISPER_POOL.filter((w) => matchesWhisper(w, plan));
  const pool = viable.length > 0 ? viable : WHISPER_POOL;
  return pool[Math.floor(Math.random() * pool.length)].text;
}

/** @deprecated Use getWhisperForPlan when a plan is available */
export function getRandomWhisper(): string {
  return WHISPER_POOL[Math.floor(Math.random() * WHISPER_POOL.length)].text;
}

export function getNextWhisper(currentIndex: number): string {
  return WHISPER_POOL[currentIndex % WHISPER_POOL.length].text;
}

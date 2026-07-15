/**
 * The 4 questions — she shares what she'd love; you plan the night.
 * Casual voice — like how you'd actually ask her, not a greeting card.
 */

import type { QuestAnswers } from './types';
import { VIBE_MIGRATION } from './planStorage';

export type QuestionType =
  | 'vibe-cards'
  | 'cuisine-stamps'
  | 'date-special'
  | 'textarea-optional';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: number;
  key: keyof import('./types').QuestAnswers | 'secretHint';
  prompt: string;
  /** Short line under the prompt — clarifies what this question is for. */
  hint?: string;
  type: QuestionType;
  options?: QuestionOption[];
  placeholder?: string;
}

/** Labels for foodFantasy values (cuisine UI + legacy saved plans). */
const FOOD_FANTASY_LABELS: QuestionOption[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'surprise', label: 'Surprise me' },
  { value: 'home-cooked', label: 'Cook at home' },
  { value: 'takeout', label: 'Takeout' },
  { value: 'cafe', label: 'Café' },
  { value: 'casual', label: 'Casual' },
  { value: 'fancy', label: 'Fancy' },
];

export const QUESTIONS: Question[] = [
  {
    id: 1,
    key: 'vibe',
    prompt: 'What kind of night would you love?',
    type: 'vibe-cards',
    options: [
      {
        value: 'stay-in',
        label: 'Stay in',
        description: 'Home night. Comfortable. No travel.',
      },
      {
        value: 'go-out',
        label: 'Go out',
        description: 'We leave the house for the main part of the night.',
      },
      {
        value: 'new-thing',
        label: 'Something new',
        description: "Something fresh — a place or food we haven't done lately.",
      },
      {
        value: 'easy-mode',
        label: 'Easy mode',
        description: 'I handle the night. Few decisions for you.',
      },
    ],
  },
  {
    id: 2,
    key: 'foodFantasy',
    prompt: 'What kind of food night sounds good?',
    type: 'cuisine-stamps',
  },
  {
    id: 3,
    key: 'chosenDate',
    prompt: 'When works for you?',
    type: 'date-special',
  },
  {
    id: 4,
    key: 'secretHint',
    prompt: 'Anything you want me to know? (optional)',
    type: 'textarea-optional',
    placeholder: "Extra forehead kisses, a specific restaurant, whatever — I'll read it",
  },
];

export function getQuestion(step: number): Question {
  return QUESTIONS[step - 1];
}

export interface Step2Copy {
  prompt: string;
  hint: string;
  noteLabel: string;
  noteHelper: string;
  mode: 'food' | 'outing';
}

/** True when step 2 should ask about an outing/activity instead of food. */
export function isOutingStepVibe(vibe: string | undefined): boolean {
  const slug = VIBE_MIGRATION[vibe ?? ''] ?? vibe;
  return slug === 'go-out';
}

/** Step-2 prompt framed by the vibe she just chose. */
export function getStep2Copy(vibe: string | undefined): Step2Copy {
  const slug = VIBE_MIGRATION[vibe ?? ''] ?? vibe;
  switch (slug) {
    case 'stay-in':
      return {
        mode: 'food',
        prompt: 'What sounds good at home?',
        hint: 'A cuisine stamp, a craving, or Surprise me.',
        noteLabel: 'Or write a craving',
        noteHelper: 'Pick a cuisine, type something, or both.',
      };
    case 'go-out':
      return {
        mode: 'outing',
        prompt: 'What should we do when we go out?',
        hint: 'An activity stamp, a place, or Surprise me.',
        noteLabel: 'Or name a place / plan',
        noteHelper: 'Pick an activity, type something, or both.',
      };
    case 'new-thing':
      return {
        mode: 'food',
        prompt: 'What food fits something new?',
        hint: 'A cuisine we haven’t done lately — or Surprise me.',
        noteLabel: 'Or a new place to try',
        noteHelper: 'Pick a cuisine, type something new, or both.',
      };
    case 'easy-mode':
      return {
        mode: 'food',
        prompt: 'Any food lean for me?',
        hint: 'A stamp helps — or Surprise me and I handle it.',
        noteLabel: 'Or leave me a food hint',
        noteHelper: 'Optional — Surprise me works too.',
      };
    default:
      return {
        mode: 'food',
        prompt: 'What kind of food night sounds good?',
        hint: 'Pick a cuisine or type a craving.',
        noteLabel: 'Or write a craving',
        noteHelper: 'Pick a cuisine, type something, or both.',
      };
  }
}

/** @deprecated Use getStep2Copy */
export function getFoodStepCopy(vibe: string | undefined): Step2Copy {
  return getStep2Copy(vibe);
}

export const TOTAL_QUESTIONS = QUESTIONS.length;

const VIBE_QUESTION = QUESTIONS.find((q) => q.key === 'vibe');

export const REQUIRED_ANSWER_KEYS: (keyof QuestAnswers)[] = [
  'vibe',
  'foodFantasy',
  'chosenDate',
  'chosenTime',
];

export function isQuestComplete(answers: Partial<QuestAnswers>): answers is QuestAnswers {
  return REQUIRED_ANSWER_KEYS.every((k) => Boolean(answers[k])) && isStep2Complete(answers);
}

export function canJumpToStep(step: number, answers: Partial<QuestAnswers>): boolean {
  for (let i = 1; i < step; i++) {
    const q = getQuestion(i);
    if (q.key === 'secretHint') continue;
    if (q.key === 'foodFantasy') {
      if (!isStep2Complete(answers)) return false;
      continue;
    }
    if (!answers[q.key as keyof QuestAnswers]) return false;
    if (q.key === 'chosenDate' && !answers.chosenTime) {
      return false;
    }
  }
  return true;
}

/** Cuisine stamps tuned to St. Michael → Maple Grove date nights. */
export const RESTAURANT_CUISINE_OPTIONS: QuestionOption[] = [
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'sushi', label: 'Sushi' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'steakhouse', label: 'Steakhouse' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'thai', label: 'Thai' },
  { value: 'italian', label: 'Italian' },
  { value: 'korean', label: 'Korean' },
  { value: 'indian', label: 'Indian' },
  { value: 'surprise', label: 'Surprise me' },
];

/** Outing activity stamps for go-out nights. */
export const OUTING_ACTIVITY_OPTIONS: QuestionOption[] = [
  { value: 'movie', label: 'Movie' },
  { value: 'live-music', label: 'Live music' },
  { value: 'walk', label: 'Evening walk' },
  { value: 'bowling', label: 'Bowling' },
  { value: 'arcade', label: 'Arcade' },
  { value: 'show', label: 'A show' },
  { value: 'browse', label: 'Wander & browse' },
  { value: 'surprise', label: 'Surprise me' },
];

/** Display label for a restaurant cuisine pill (falls back to the raw value). */
export function getRestaurantCuisineLabel(value: string): string {
  const match = RESTAURANT_CUISINE_OPTIONS.find((o) => o.value === value);
  return match?.label ?? value;
}

/** Display label for an outing activity stamp (falls back to the raw value). */
export function getOutingActivityLabel(value: string): string {
  const match = OUTING_ACTIVITY_OPTIONS.find((o) => o.value === value);
  return match?.label ?? value;
}

/** Derive foodFantasy from cuisine/note so downstream plan copy stays wired. */
export function deriveFoodFantasy(
  cuisine: string | undefined,
  note: string | undefined,
): string | undefined {
  const hasNote = Boolean(note?.trim());
  if (!cuisine && !hasNote) return undefined;
  if (cuisine === 'surprise') return 'surprise';
  return 'restaurant';
}

/** When outing is set, food is his surprise to pair with the activity. */
export function deriveOutingFoodFantasy(
  activity: string | undefined,
  note: string | undefined,
): string | undefined {
  if (!activity && !note?.trim()) return undefined;
  return 'surprise';
}

/** True when cuisine stamp and/or craving note is provided. */
export function isFoodStepComplete(answers: Partial<QuestAnswers>): boolean {
  return Boolean(answers.restaurantCuisine) || Boolean(answers.restaurantNote?.trim());
}

/** True when outing stamp and/or free-text plan is provided. */
export function isOutingStepComplete(answers: Partial<QuestAnswers>): boolean {
  return Boolean(answers.outingActivity) || Boolean(answers.outingNote?.trim());
}

/** Step 2 complete for the active vibe (food vs outing). */
export function isStep2Complete(answers: Partial<QuestAnswers>): boolean {
  return isOutingStepVibe(answers.vibe) ? isOutingStepComplete(answers) : isFoodStepComplete(answers);
}

/** @deprecated Use isFoodStepComplete — kept for older call sites. */
export function isRestaurantFollowUpComplete(answers: Partial<QuestAnswers>): boolean {
  return isFoodStepComplete(answers);
}

/** Human-readable cuisine/craving detail for summaries and locked plan display. */
export function formatRestaurantDetail(answers: Partial<QuestAnswers>): string | null {
  const cuisine = answers.restaurantCuisine
    ? getRestaurantCuisineLabel(answers.restaurantCuisine)
    : null;
  const note = answers.restaurantNote?.trim() || null;
  if (cuisine && note) return `${cuisine} — ${note}`;
  if (cuisine) return cuisine;
  if (note) return note;
  return null;
}

/** Human-readable outing detail for summaries and locked plan display. */
export function formatOutingDetail(answers: Partial<QuestAnswers>): string | null {
  const activity = answers.outingActivity
    ? getOutingActivityLabel(answers.outingActivity)
    : null;
  const note = answers.outingNote?.trim() || null;
  if (activity && note) return `${activity} — ${note}`;
  if (activity) return activity;
  if (note) return note;
  return null;
}

/** Best food label for UI: cuisine/craving first, then foodFantasy fallback. */
export function formatFoodAnswer(answers: Partial<QuestAnswers>): string {
  return formatRestaurantDetail(answers) ?? getFoodCategoryLabel(answers.foodFantasy ?? '');
}

/** Best outing label for UI. */
export function formatOutingAnswer(answers: Partial<QuestAnswers>): string {
  return formatOutingDetail(answers) ?? 'Outing';
}

/** Display label for a food category value (falls back to the raw value). */
export function getFoodCategoryLabel(value: string): string {
  const match = FOOD_FANTASY_LABELS.find((o) => o.value === value);
  return match?.label ?? value;
}

/** Display label for a vibe category value (falls back to the raw value). */
export function getVibeCategoryLabel(value: string): string {
  const slug = VIBE_MIGRATION[value] ?? value;
  const match = VIBE_QUESTION?.options?.find((o) => o.value === slug);
  return match?.label ?? value;
}

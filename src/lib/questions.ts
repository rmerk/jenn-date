/**
 * The 5 questions for Jennifer's date quest.
 * Casual voice — like how you'd actually ask her, not a greeting card.
 */

import type { QuestAnswers } from './types';
import { VIBE_MIGRATION } from './planStorage';

export type QuestionType =
  | 'vibe-cards'
  | 'food-grid'
  | 'date-special'
  | 'feeling-pills'
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
  type: QuestionType;
  options?: QuestionOption[];
  placeholder?: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    key: 'vibe',
    prompt: 'What kind of night?',
    type: 'vibe-cards',
    options: [
      { value: 'stay-in', label: 'Stay in', description: 'Home. Comfortable. No travel.' },
      { value: 'go-out', label: 'Go out', description: 'Main part of the night is somewhere else.' },
      { value: 'new-thing', label: 'Something new', description: "A place or activity we haven't done in a while." },
      { value: 'easy-mode', label: 'Easy mode', description: 'Few decisions. You handle the logistics.' },
    ],
  },
  {
    id: 2,
    key: 'foodFantasy',
    prompt: 'What kind of food night?',
    type: 'food-grid',
    options: [
      { value: 'home-cooked', label: 'Cook at home', description: 'Kitchen, playlist on, eat at the table or on the couch' },
      { value: 'restaurant', label: 'Restaurant', description: 'Sit down somewhere and order what sounds good' },
      { value: 'takeout', label: 'Takeout', description: 'Order in — minimal effort, maximum coziness' },
      { value: 'cafe', label: 'Café', description: 'Drinks, something sweet, keep it light' },
      { value: 'casual', label: 'Casual', description: 'Quick, unfussy, no big production' },
      { value: 'fancy', label: 'Fancy', description: 'Dress up a little, nicer spot' },
      { value: 'surprise', label: 'Surprise me', description: 'You pick — I trust you' },
    ],
  },
  {
    id: 3,
    key: 'chosenDate',
    prompt: 'Pick the date',
    type: 'date-special',
  },
  {
    id: 4,
    key: 'feelingWord',
    prompt: 'One word for how you want to feel that night',
    type: 'feeling-pills',
    options: [
      { value: 'giggly', label: 'Giggly' },
      { value: 'cherished', label: 'Cherished' },
      { value: 'spoiled', label: 'Spoiled' },
      { value: 'silly', label: 'Silly' },
      { value: 'adventurous', label: 'Adventurous' },
      { value: 'peaceful', label: 'Peaceful' },
      { value: 'electric', label: 'Electric' },
      { value: 'home', label: 'At home' },
      { value: 'loved', label: 'Loved' },
    ],
  },
  {
    id: 5,
    key: 'secretHint',
    prompt: 'Anything you want me to know? (optional)',
    type: 'textarea-optional',
    placeholder: "Extra forehead kisses, a specific restaurant, whatever — I'll read it",
  },
];

export function getQuestion(step: number): Question {
  return QUESTIONS[step - 1];
}

export const TOTAL_QUESTIONS = QUESTIONS.length;

const FOOD_QUESTION = QUESTIONS.find((q) => q.key === 'foodFantasy');
const VIBE_QUESTION = QUESTIONS.find((q) => q.key === 'vibe');
const FEELING_QUESTION = QUESTIONS.find((q) => q.key === 'feelingWord');

export const REQUIRED_ANSWER_KEYS: (keyof QuestAnswers)[] = [
  'vibe',
  'foodFantasy',
  'chosenDate',
  'feelingWord',
];

export function isQuestComplete(answers: Partial<QuestAnswers>): answers is QuestAnswers {
  return REQUIRED_ANSWER_KEYS.every((k) => Boolean(answers[k]));
}

export function canJumpToStep(step: number, answers: Partial<QuestAnswers>): boolean {
  for (let i = 1; i < step; i++) {
    const q = getQuestion(i);
    if (q.key === 'secretHint') continue;
    if (!answers[q.key as keyof QuestAnswers]) return false;
    if (i === 2 && answers.foodFantasy === 'restaurant' && !isRestaurantFollowUpComplete(answers)) {
      return false;
    }
  }
  return true;
}

export const RESTAURANT_CUISINE_OPTIONS: QuestionOption[] = [
  { value: 'korean', label: 'Korean' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'american', label: 'American' },
  { value: 'thai', label: 'Thai' },
  { value: 'indian', label: 'Indian' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'surprise', label: 'Surprise me' },
];

/** Display label for a restaurant cuisine pill (falls back to the raw value). */
export function getRestaurantCuisineLabel(value: string): string {
  const match = RESTAURANT_CUISINE_OPTIONS.find((o) => o.value === value);
  return match?.label ?? value;
}

/** True when restaurant is chosen and at least cuisine or note is provided. */
export function isRestaurantFollowUpComplete(answers: Partial<QuestAnswers>): boolean {
  if (answers.foodFantasy !== 'restaurant') return true;
  return Boolean(answers.restaurantCuisine) || Boolean(answers.restaurantNote?.trim());
}

/** Human-readable restaurant detail for summaries and locked plan display. */
export function formatRestaurantDetail(answers: Partial<QuestAnswers>): string | null {
  if (answers.foodFantasy !== 'restaurant') return null;
  const cuisine = answers.restaurantCuisine
    ? getRestaurantCuisineLabel(answers.restaurantCuisine)
    : null;
  const note = answers.restaurantNote?.trim() || null;
  if (cuisine && note) return `${cuisine} — ${note}`;
  if (cuisine) return cuisine;
  if (note) return note;
  return null;
}

/** Display label for a food category value (falls back to the raw value). */
export function getFoodCategoryLabel(value: string): string {
  const match = FOOD_QUESTION?.options?.find((o) => o.value === value);
  return match?.label ?? value;
}

/** Display label for a vibe category value (falls back to the raw value). */
export function getVibeCategoryLabel(value: string): string {
  const slug = VIBE_MIGRATION[value] ?? value;
  const match = VIBE_QUESTION?.options?.find((o) => o.value === slug);
  return match?.label ?? value;
}

/** Display label for a feeling word (e.g. home → "At home"). */
export function getFeelingWordLabel(value: string): string {
  const match = FEELING_QUESTION?.options?.find((o) => o.value === value);
  return match?.label ?? value;
}

/** Soft hint shown on food cards when a pick still works with the chosen vibe. */
export function getFoodVibeHint(vibe: string | undefined, foodValue: string): string | null {
  if (!vibe) return null;
  const vibeSlug = VIBE_MIGRATION[vibe] ?? vibe;
  if (vibeSlug === 'stay-in') {
    if (foodValue === 'takeout') return 'Perfect for staying in';
    if (foodValue === 'restaurant' || foodValue === 'cafe' || foodValue === 'fancy') {
      return 'We can bring the vibe home too';
    }
  }
  if (vibeSlug === 'go-out' && (foodValue === 'home-cooked' || foodValue === 'takeout')) {
    return 'Quick bite before or after we head out';
  }
  if (vibeSlug === 'easy-mode' && foodValue === 'fancy') {
    return 'You handle the reservations — she just shows up';
  }
  return null;
}

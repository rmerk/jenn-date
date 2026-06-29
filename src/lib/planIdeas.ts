/**
 * Choice-aware "ideas for the night" — reconciles vibe and food
 * so every answer combination produces a coherent plan.
 */

import type { QuestAnswers } from './types';
import { VIBE_MIGRATION } from './planStorage';
import { getHintExtraSentence } from './loveMessage';
import { formatRestaurantDetail, getRestaurantCuisineLabel } from './questions';

type VibeSlug = 'stay-in' | 'go-out' | 'new-thing' | 'easy-mode';

function toVibeSlug(vibe: string): VibeSlug {
  const slug = VIBE_MIGRATION[vibe] ?? vibe;
  switch (slug) {
    case 'stay-in':
    case 'go-out':
    case 'new-thing':
    case 'easy-mode':
      return slug;
    default:
      return 'stay-in';
  }
}

function getFoodIdea(vibe: VibeSlug, food: string, answers?: Partial<QuestAnswers>): string {
  switch (food) {
    case 'home-cooked':
      if (vibe === 'go-out' || vibe === 'new-thing') {
        return 'Cook an early supper together, then head out for the main part of the night.';
      }
      return 'Cook together at home — split tasks, eat wherever feels best.';
    case 'restaurant': {
      const cuisine =
        answers?.restaurantCuisine && answers.restaurantCuisine !== 'surprise'
          ? getRestaurantCuisineLabel(answers.restaurantCuisine).toLowerCase()
          : null;
      if (vibe === 'stay-in') {
        if (cuisine) {
          return `Order something special to-go from a favorite ${cuisine} spot and turn the living room into your private restaurant.`;
        }
        return 'Order something special to-go from a favorite spot and turn the living room into your private restaurant.';
      }
      const detail = answers ? formatRestaurantDetail(answers) : null;
      if (cuisine) {
        return `Find a ${cuisine} sit-down spot and order whatever sounds good that night.`;
      }
      if (detail) {
        return `Pick a sit-down spot — she's thinking ${detail.toLowerCase()}.`;
      }
      return 'Pick a sit-down spot and order whatever sounds good that night.';
    }
    case 'takeout':
      if (vibe === 'go-out' || vibe === 'new-thing') {
        return 'Grab quick takeout on the way so nothing slows the adventure down.';
      }
      return 'Order in, spread it out, zero dishes if you can swing it.';
    case 'cafe':
      if (vibe === 'stay-in') {
        return 'Stop by a café for something sweet, then bring the cozy mood back home.';
      }
      return 'A café stop for drinks and something sweet — no rush.';
    case 'casual':
      return 'Keep food unfussy — quick bite, then back to the evening.';
    case 'fancy':
      if (vibe === 'easy-mode') {
        return 'Book somewhere nice — you handle reservations and she just shows up looking great.';
      }
      if (vibe === 'stay-in') {
        return "Fancy doesn't have to mean leaving — dress up at home with a special spread and candles.";
      }
      return 'Dress up a little and book somewhere nicer than usual.';
    case 'surprise':
      return 'You handle food entirely — match her vibe and hint.';
    default:
      return 'Match food to the vibe she picked — thoughtful, not complicated.';
  }
}

function getVibeIdea(vibe: VibeSlug): string {
  switch (vibe) {
    case 'stay-in':
      return 'Clear the evening at home — comfy setup, food handled, nowhere to rush.';
    case 'go-out':
      return 'Pick one main destination and build the night around getting there.';
    case 'new-thing':
      return 'Book or scout something you two have not done recently.';
    case 'easy-mode':
      return 'You own the plan end-to-end — she should not have to decide anything else.';
    default: {
      const _exhaustive: never = vibe;
      return _exhaustive;
    }
  }
}

function getClosingIdea(feelingWord: string): string {
  const closings: Record<string, string> = {
    giggly: 'Queue up something silly right before bed so she goes to sleep smiling.',
    cherished: 'Slow dancing in the kitchen to the song from when you first said "I love you".',
    spoiled: 'One extra pampering beat at the end — dessert, foot rub, or both.',
    silly: 'End with something ridiculous on purpose — inside jokes welcome.',
    adventurous: 'Save one small surprise for the very end of the night.',
    peaceful: 'Wind down together with zero phones and nowhere else to be.',
    electric: 'Build to one sparky moment — lights low, music up, just you two.',
    home: 'Make the space feel unmistakably yours — familiar, warm, completely safe.',
    loved: 'Slow dancing in the kitchen to the song from when you first said "I love you".',
  };
  return closings[feelingWord] ?? closings.loved;
}

/** Returns 3–4 executable ideas harmonized with her full answer set. */
export function getConstellationIdeas(answers: QuestAnswers): string[] {
  const vibe = toVibeSlug(answers.vibe);
  const ideas: string[] = [];

  if (answers.foodFantasy === 'surprise') {
    ideas.push("You trusted me with food — I'll make every surprise count.");
  }

  ideas.push(getFoodIdea(vibe, answers.foodFantasy, answers));
  ideas.push(getVibeIdea(vibe));
  ideas.push(getClosingIdea(answers.feelingWord));

  const extra = getHintExtraSentence(answers);
  if (extra && ideas.length > 0) {
    ideas[ideas.length - 1] = `${ideas[ideas.length - 1]} ${extra}`;
  }

  return ideas.slice(0, 4);
}

/** Test helper — detects known contradiction patterns in generated ideas. */
export function hasContradictoryIdeas(ideas: string[], vibe: string, food: string): boolean {
  const vibeS = toVibeSlug(vibe);
  const text = ideas.join(' ').toLowerCase();

  if (vibeS === 'stay-in' && food === 'restaurant') {
    if (text.includes('sit-down spot') && !text.includes('to-go') && !text.includes('living room')) {
      return true;
    }
  }

  if (vibeS === 'stay-in' && food === 'cafe') {
    if (text.includes('café stop') && !text.includes('back home') && !text.includes('bring')) {
      return true;
    }
  }

  if (vibeS === 'easy-mode' && food === 'fancy') {
    if (text.includes('dress up a little and book') && !text.includes('you handle')) {
      return true;
    }
  }

  if (ideas.length < 3 || ideas.length > 4) {
    return true;
  }

  return false;
}

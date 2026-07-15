/**
 * Choice-aware "ideas for the night" — reconciles vibe and food
 * so every answer combination produces a coherent plan.
 */

import type { QuestAnswers } from './types';
import { VIBE_MIGRATION } from './planStorage';
import {
  formatFoodAnswer,
  formatOutingAnswer,
  getOutingActivityLabel,
  getRestaurantCuisineLabel,
  getVibeCategoryLabel,
  isOutingStepVibe,
} from './questions';

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
      const note = answers?.restaurantNote?.trim() || null;
      if (vibe === 'stay-in') {
        if (cuisine && note) {
          return `Order ${cuisine} to-go — you mentioned ${note} — and turn the living room into your private restaurant.`;
        }
        if (cuisine) {
          return `Order something special to-go from a favorite ${cuisine} spot and turn the living room into your private restaurant.`;
        }
        if (note) {
          return `Order something special to-go — you mentioned ${note} — and turn the living room into your private restaurant.`;
        }
        return 'Order something special to-go from a favorite spot and turn the living room into your private restaurant.';
      }
      if (cuisine && note) {
        return `I'll find a ${cuisine} sit-down spot — you mentioned ${note}.`;
      }
      if (cuisine) {
        return `I'll find a ${cuisine} sit-down spot.`;
      }
      if (note) {
        return `I'll find a sit-down spot — you mentioned ${note}.`;
      }
      return "I'll find a sit-down spot.";
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
        return 'Book somewhere nice — I\'ll handle reservations; you just show up looking great.';
      }
      if (vibe === 'stay-in') {
        return "Fancy doesn't have to mean leaving — dress up at home with a special spread and candles.";
      }
      return 'Dress up a little and book somewhere nicer than usual.';
    case 'surprise':
      return 'You handle food entirely — match her vibe and hint.';
    default:
      return 'Match food to what you wanted — thoughtful, not complicated.';
  }
}

function getOutingIdea(answers: Partial<QuestAnswers>): string {
  const activity =
    answers.outingActivity && answers.outingActivity !== 'surprise'
      ? getOutingActivityLabel(answers.outingActivity).toLowerCase()
      : null;
  const note = answers.outingNote?.trim() || null;
  if (answers.outingActivity === 'surprise') {
    return "You trusted me with the plan — I'll pick something worth leaving the house for.";
  }
  if (activity && note) {
    return `I'll build the night around ${activity} — you mentioned ${note}.`;
  }
  if (activity) {
    return `I'll build the night around ${activity}.`;
  }
  if (note) {
    return `I'll build the night around that — you mentioned ${note}.`;
  }
  return "I'll pick a main destination and build the night around getting there.";
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
      return 'I\'ll handle everything — you won\'t have to decide anything else.';
    default: {
      const _exhaustive: never = vibe;
      return _exhaustive;
    }
  }
}

/** Returns 3–4 executable ideas harmonized with her full answer set. */
export function getConstellationIdeas(answers: QuestAnswers): string[] {
  return getChoiceAlignedPlan(answers).map((row) => row.plan);
}

export interface ChoicePlanRow {
  /** Which quest answer this row comes from */
  from: 'vibe' | 'food' | 'when' | 'hint';
  /** Category chrome for the row (Vibe / Food / When / Your note) */
  label: string;
  /** Her choice — the editable answer she taps to change */
  choice: string;
  /** What he's planning from that choice */
  plan: string;
}

const CHOICE_LABELS: Record<ChoicePlanRow['from'], string> = {
  vibe: 'Vibe',
  food: 'Food',
  when: 'When',
  hint: 'Your note',
};

/**
 * Plan rows labeled by quest category, with her answer as the editable choice.
 */
export function getChoiceAlignedPlan(answers: QuestAnswers): ChoicePlanRow[] {
  const vibe = toVibeSlug(answers.vibe);
  const outingNight = isOutingStepVibe(answers.vibe);
  const rows: ChoicePlanRow[] = [
    {
      from: 'vibe',
      label: CHOICE_LABELS.vibe,
      choice: getVibeCategoryLabel(answers.vibe),
      plan: getVibeIdea(vibe),
    },
    outingNight
      ? {
          from: 'food',
          label: 'Outing',
          choice: formatOutingAnswer(answers),
          plan: getOutingIdea(answers),
        }
      : {
          from: 'food',
          label: CHOICE_LABELS.food,
          choice:
            formatFoodAnswer(answers) ||
            getRestaurantCuisineLabel(answers.restaurantCuisine ?? '') ||
            'Food',
          plan:
            answers.foodFantasy === 'surprise'
              ? "You trusted me with food — I'll make every surprise count."
              : getFoodIdea(vibe, answers.foodFantasy, answers),
        },
    {
      from: 'when',
      label: CHOICE_LABELS.when,
      choice: formatWhenChoice(answers.chosenDate, answers.chosenTime),
      plan: getWhenIdea(vibe, answers.chosenTime),
    },
  ];

  const hint = answers.secretHint?.trim();
  if (hint) {
    rows.push({
      from: 'hint',
      label: CHOICE_LABELS.hint,
      choice: hint,
      plan: "I'll read your note!",
    });
  }

  return rows;
}

/**
 * Short lyrical lines for the celebration blurb — vibe / food / lock — not a logistics sentence.
 */
export function getArtfulSummaryLines(answers: QuestAnswers): [string, string, string] {
  const vibe = toVibeSlug(answers.vibe);
  const food = formatFoodAnswer(answers).trim();
  const outing = formatOutingAnswer(answers).trim();

  const vibeLine = (() => {
    switch (vibe) {
      case 'stay-in':
        return 'Home. Soft light. Just us.';
      case 'go-out':
        return 'Out into the night.';
      case 'new-thing':
        return 'Something we haven’t done.';
      case 'easy-mode':
        return 'You rest. I handle it.';
      default: {
        const _exhaustive: never = vibe;
        return _exhaustive;
      }
    }
  })();

  const foodLine = (() => {
    if (isOutingStepVibe(answers.vibe)) {
      if (answers.outingActivity === 'surprise') return 'The plan is my surprise.';
      if (outing && outing !== 'Outing') return `${outing}.`;
      return 'A night out, handled.';
    }
    if (answers.foodFantasy === 'surprise') return 'Food is my surprise.';
    if (food) return `${food}.`;
    switch (answers.foodFantasy) {
      case 'home-cooked':
        return 'Cooking together.';
      case 'takeout':
        return 'Takeout, no dishes.';
      case 'cafe':
        return 'A sweet café stop.';
      case 'fancy':
        return 'A little fancy.';
      case 'casual':
        return 'Nothing fussy.';
      case 'restaurant':
        return 'A table somewhere.';
      default:
        return 'Food, handled.';
    }
  })();

  return [vibeLine, foodLine, 'Locked in — can’t wait.'];
}

function formatWhenChoice(iso: string, time: string): string {
  const d = new Date(iso + 'T00:00:00');
  const day = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const [hStr, mStr] = (time || '19:00').split(':');
  let h = Number(hStr);
  const m = Number(mStr) || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const timeLabel = m === 0 ? `${h} ${ampm}` : `${h}:${String(m).padStart(2, '0')} ${ampm}`;
  return `${day} · ${timeLabel}`;
}

function getWhenIdea(vibe: VibeSlug, time: string): string {
  const [hStr, mStr] = (time || '19:00').split(':');
  let h = Number(hStr);
  const m = Number(mStr) || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const timeLabel = m === 0 ? `${h} ${ampm}` : `${h}:${String(m).padStart(2, '0')} ${ampm}`;

  switch (vibe) {
    case 'stay-in':
      return `Night starts at ${timeLabel} at home — I'll have things ready before you need to do anything.`;
    case 'go-out':
      return `We'll aim for ${timeLabel} — enough time to get there without rushing.`;
    case 'new-thing':
      return `Locked for ${timeLabel} — I'll handle getting us there for whatever we try.`;
    case 'easy-mode':
      return `${timeLabel} is set. You don't need to track anything else that night.`;
    default: {
      const _exhaustive: never = vibe;
      return _exhaustive;
    }
  }
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
    if (text.includes('dress up a little and book') && !text.includes('handle')) {
      return true;
    }
  }

  if (ideas.length < 3 || ideas.length > 4) {
    return true;
  }

  return false;
}

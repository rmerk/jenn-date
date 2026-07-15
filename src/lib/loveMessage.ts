import type { LockedPlan } from './types';
import { formatRestaurantDetail, getFoodCategoryLabel, getVibeCategoryLabel } from './questions';
import { DEFAULT_CHOSEN_TIME, formatTimeForDisplay } from './utils';

/**
 * THE HEART OF THE GIFT
 * This is the only file you really need to edit to make the final message
 * 100% your own words to Jennifer.
 *
 * UI copy stays casual; this letter is the one sincerely warm moment.
 * Write like you actually talk to her. Short sentences are okay.
 */
export function getLoveMessage(plan: LockedPlan): string {
  const date = new Date(plan.chosenDate + 'T00:00:00');
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = formatTimeForDisplay(plan.chosenTime ?? DEFAULT_CHOSEN_TIME);

  const vibe = getVibeCategoryLabel(plan.vibe).toLowerCase();
  const foodBase = getFoodCategoryLabel(plan.foodFantasy).toLowerCase();
  const restaurantDetail = formatRestaurantDetail(plan);
  const food =
    plan.foodFantasy === 'restaurant' && restaurantDetail
      ? `${foodBase} — ${restaurantDetail.toLowerCase()}`
      : foodBase;

  const foodSurprise = plan.foodFantasy === 'surprise';

  return `Hey Jennifer,

Our night is ${dateStr} at ${timeStr}. I've been planning it.

You said you'd love ${vibe} and ${food} for food. I've got it all planned.
${foodSurprise ? '\nYou trusted me with food. I take that seriously.\n' : ''}
I've got some ideas on this screen, but the plan is simple: no distractions, just us, doing what I put together for you.

Thanks for telling me what you wanted. Made planning this a lot more fun.

I love you.

— your husband`;
}

const HINT_REACTIONS: Array<{ re: RegExp; make: (p: LockedPlan) => string }> = [
  {
    re: /forehead kiss/i,
    make: () =>
      `You wrote about extra forehead kisses — done. The second you walk in.`,
  },
  {
    re: /dumpling|sauce|jjajang/i,
    make: () =>
      `I already got the dumpling sauce you like. It's in the fridge.`,
  },
  {
    re: /blanket|fort|cozy/i,
    make: () =>
      `Blanket fort is happening. Fairy lights, no phones, you don't have to lift a finger.`,
  },
  {
    re: /star|stargaz/i,
    make: () =>
      `Found a good spot for stargazing. Good blanket, no checking the time.`,
  },
  {
    re: /laugh|silly|giggle/i,
    make: () =>
      `I've got a few dumb games lined up just to hear you laugh.`,
  },
];

const LOVE_LETTER_CLOSING = /(I love you\.\n\n— your husband)$/;

export function getPersonalizedLoveMessage(plan: LockedPlan): string {
  const base = getLoveMessage(plan);
  const hint = (plan.secretHint || '').trim();
  if (!hint) return base;

  const matched = HINT_REACTIONS.find((r) => r.re.test(hint));
  const extra = matched ? matched.make(plan) : `I read your hint. I'm on it.`;

  return base.replace(LOVE_LETTER_CLOSING, `${extra}\n\n$1`);
}

export function getShortSweetNote(plan: LockedPlan): string {
  const date = new Date(plan.chosenDate + 'T00:00:00');
  const pretty = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return `Our date night — ${pretty}\n\nLocked in. Can't wait.`;
}

export function getHintExtraSentence(plan: { secretHint?: string }): string | null {
  const hint = (plan.secretHint || '').trim();
  if (!hint) return null;

  const matched = HINT_REACTIONS.find((r) => r.re.test(hint));
  if (matched) {
    if (/forehead kiss/i.test(hint)) return 'Forehead kisses the moment you walk in — already promised.';
    if (/dumpling|sauce/i.test(hint)) return 'The good dumpling sauce is already in the fridge.';
    if (/blanket|fort/i.test(hint)) return 'Blanket fort is non-negotiable. No phones.';
    if (/star|stargaz/i.test(hint)) return 'Found the dark-sky spot. Soft blanket packed.';
    if (/laugh|silly/i.test(hint)) return 'A few dumb games are queued for that laugh.';
  }
  return "I read your hint. I'm on it.";
}

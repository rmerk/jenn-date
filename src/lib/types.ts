/**
 * Core types for Jennifer's Date Quest
 * All data shapes used across the app for answers, persistence, and rendering.
 */

export interface QuestAnswers {
  vibe: string;           // 'stay-in' | 'go-out' | 'new-thing' | 'easy-mode'
  foodFantasy: string;
  restaurantCuisine?: string; // cuisine stamp on the food step
  restaurantNote?: string;    // free-text spot/craving on the food step
  /** Activity stamp when vibe is go-out (step 2 becomes outing, not food). */
  outingActivity?: string;
  /** Free-text outing idea when vibe is go-out. */
  outingNote?: string;
  chosenDate: string;     // ISO date string YYYY-MM-DD (future only)
  chosenTime: string;     // 24h HH:mm — start time for the evening
  secretHint?: string;
}

export interface LockedPlan extends QuestAnswers {
  lockedAt: string; // ISO timestamp
  debriefHighlight?: string; // optional one-line post-date reflection
  debriefedAt?: string; // ISO timestamp when debrief was saved
  /** @deprecated migrated to debriefHighlight on load */
  anniversaryNote?: string;
  /** @deprecated legacy mascot choice — ignored on load */
  mascotId?: string;
  /** @deprecated removed from quest — ignored on load */
  feelingWord?: string;
}

/** One locked plan plus optional debrief — a single chapter in the couple's date history. */
export type DateChapter = LockedPlan;

export const STORAGE_KEY = 'jenn-universtar-plan-v1' as const;
export const HISTORY_STORAGE_KEY = 'jenn-universtar-history-v1' as const;

/**
 * Core types for Jennifer's Date Quest
 * All data shapes used across the app for answers, persistence, and rendering.
 */

export interface QuestAnswers {
  vibe: string;           // 'stay-in' | 'go-out' | 'new-thing' | 'easy-mode'
  foodFantasy: string;
  restaurantCuisine?: string; // cuisine pill when foodFantasy is 'restaurant'
  restaurantNote?: string;    // free-text spot/craving when foodFantasy is 'restaurant'
  chosenDate: string;     // ISO date string YYYY-MM-DD (future only)
  feelingWord: string;
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
}

/** One locked plan plus optional debrief — a single chapter in the couple's date history. */
export type DateChapter = LockedPlan;

export const STORAGE_KEY = 'jenn-universtar-plan-v1' as const;
export const HISTORY_STORAGE_KEY = 'jenn-universtar-history-v1' as const;

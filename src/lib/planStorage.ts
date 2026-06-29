import type { DateChapter, LockedPlan } from './types';
import { HISTORY_STORAGE_KEY, STORAGE_KEY } from './types';

function isValidLockedPlan(value: unknown): value is LockedPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as LockedPlan;
  return Boolean(
    plan.chosenDate &&
      plan.lockedAt &&
      plan.vibe &&
      plan.foodFantasy &&
      plan.feelingWord,
  );
}

/** Legacy vibe slugs from before the category refresh. */
export const VIBE_MIGRATION: Record<string, string> = {
  cozy: 'stay-in',
  adventure: 'go-out',
  romantic: 'easy-mode',
};

function migrateVibe(vibe: string): string {
  return VIBE_MIGRATION[vibe] ?? vibe;
}

/** Migrate legacy anniversaryNote into debriefHighlight; normalize vibe slugs. */
export function normalizeLockedPlan(plan: LockedPlan): LockedPlan {
  let normalized: LockedPlan = {
    ...plan,
    vibe: migrateVibe(plan.vibe),
  };
  if (normalized.anniversaryNote && !normalized.debriefHighlight) {
    const { anniversaryNote, ...rest } = normalized;
    normalized = { ...rest, debriefHighlight: anniversaryNote };
  }
  return normalized;
}

export function loadLockedPlan(): LockedPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LockedPlan;
    if (!isValidLockedPlan(parsed)) return null;
    return normalizeLockedPlan(parsed);
  } catch {
    return null;
  }
}

export function saveLockedPlan(plan: LockedPlan): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeLockedPlan(plan)));
}

export function clearLockedPlan(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadDateHistory(): DateChapter[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidLockedPlan).map(normalizeLockedPlan);
  } catch {
    return [];
  }
}

export function archiveCurrentPlan(plan: LockedPlan): void {
  const history = loadDateHistory();
  history.push(normalizeLockedPlan(plan));
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

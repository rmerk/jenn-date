import type { QuestAnswers } from './types';
import { TOTAL_QUESTIONS } from './questions';

export type QuestMode = 'landing' | 'quest' | 'celebration';

export interface QuestProgress {
  mode: QuestMode;
  currentStep: number;
  answers: Partial<QuestAnswers>;
}

const PROGRESS_KEY = 'jenn-date-quest-progress';
const LEGACY_DRAFT_KEY = 'jenn-date-draft';

function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 1;
  return Math.max(1, Math.min(TOTAL_QUESTIONS, Math.round(step)));
}

function isQuestMode(value: unknown): value is QuestMode {
  return value === 'landing' || value === 'quest' || value === 'celebration';
}

function parseProgress(raw: string): QuestProgress | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const record = parsed as Record<string, unknown>;

    // New format: { mode, currentStep, answers }
    if (isQuestMode(record.mode) && record.answers && typeof record.answers === 'object') {
      return {
        mode: record.mode,
        currentStep: clampStep(Number(record.currentStep)),
        answers: record.answers as Partial<QuestAnswers>,
      };
    }

    // Legacy format: answers only (from jenn-date-draft)
    return {
      mode: 'landing',
      currentStep: 1,
      answers: parsed as Partial<QuestAnswers>,
    };
  } catch {
    return null;
  }
}

export function loadQuestProgress(): QuestProgress | null {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY);
    if (raw) return parseProgress(raw);

    const legacy = sessionStorage.getItem(LEGACY_DRAFT_KEY);
    if (legacy) return parseProgress(legacy);
  } catch {
    // ignore storage errors
  }
  return null;
}

export function saveQuestProgress(progress: QuestProgress): void {
  try {
    sessionStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        mode: progress.mode,
        currentStep: clampStep(progress.currentStep),
        answers: progress.answers,
      }),
    );
    sessionStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // ignore quota / private browsing errors
  }
}

export function clearQuestProgress(): void {
  try {
    sessionStorage.removeItem(PROGRESS_KEY);
    sessionStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // ignore storage errors
  }
}

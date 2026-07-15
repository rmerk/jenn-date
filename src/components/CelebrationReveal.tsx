/**
 * Celebration reveal — keepsake-first plan screen after the quest.
 * Choice rows jump back to quest steps; Save locks the night.
 */

import type { LockedPlan, QuestAnswers } from '../lib/types';
import {
  getChoiceAlignedPlan,
  type ChoicePlanRow,
} from '../lib/planIdeas';
import { getPersonalizedLoveMessage } from '../lib/loveMessage';
import { TOTAL_QUESTIONS } from '../lib/questions';

export interface CelebrationRevealProps {
  answers: QuestAnswers;
  lockedPlan: LockedPlan | null;
  showLoveMessage: boolean;
  onLock: () => void;
  onCopyNote: () => void;
  onAddToCalendar: () => void;
  onEditStep: (step: number) => void;
}

function stepForChoice(from: ChoicePlanRow['from']): number {
  switch (from) {
    case 'vibe':
      return 1;
    case 'food':
      return 2;
    case 'when':
      return 3;
    case 'hint':
      return 4;
    default: {
      const _exhaustive: never = from;
      return _exhaustive;
    }
  }
}

export function CelebrationReveal({
  answers,
  lockedPlan,
  showLoveMessage,
  onLock,
  onCopyNote,
  onAddToCalendar,
  onEditStep,
}: CelebrationRevealProps) {
  const planRows = getChoiceAlignedPlan(answers);

  return (
    <div className="celeb-reveal px-6 pt-16 sm:pt-20 pb-28 max-w-lg mx-auto">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => onEditStep(TOTAL_QUESTIONS)}
          className="celeb-reveal__back"
        >
          ← Change an answer
        </button>
      </div>

      {showLoveMessage && (
        <header className="text-center">
          <h1 className="celeb-reveal__title">All set</h1>
        </header>
      )}

      {showLoveMessage && lockedPlan && (
        <div className="celeb-reveal__love mt-8" role="status" aria-live="polite">
          <div className="celeb-reveal__love-card whitespace-pre-wrap">
            {getPersonalizedLoveMessage(lockedPlan)}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
            <button type="button" onClick={onCopyNote} className="pill-button secondary text-sm">
              Copy note
            </button>
            <button type="button" onClick={onAddToCalendar} className="pill-button primary text-sm">
              Add to calendar
            </button>
          </div>
        </div>
      )}

      {!showLoveMessage && (
        <>
          <section className="celeb-reveal__body mt-12" aria-label="What I'm planning">
            <div className="celeb-reveal__body-card">
              <h2 className="celeb-reveal__body-title">What I&apos;m planning</h2>
              <p className="celeb-reveal__body-lede">Tap a choice to change it</p>

              <ul className="celeb-reveal__steps">
                {planRows.map((row) => (
                  <li key={row.from}>
                    <button
                      type="button"
                      className="celeb-reveal__step-btn"
                      onClick={() => onEditStep(stepForChoice(row.from))}
                    >
                      <span className="celeb-reveal__step-mark" aria-hidden="true" />
                      <span className="celeb-reveal__step-copy">
                        <span className="celeb-reveal__step-index">
                          {row.label}
                          <span className="celeb-reveal__step-edit">Edit</span>
                        </span>
                        <span className="celeb-reveal__step-choice">{row.choice}</span>
                        <span className="celeb-reveal__step-plan">{row.plan}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="mt-8 flex justify-center">
            <button type="button" onClick={onLock} className="pill-button primary">
              Save our night
            </button>
          </div>
        </>
      )}
    </div>
  );
}

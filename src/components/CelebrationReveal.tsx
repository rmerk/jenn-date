/**
 * Celebration reveal — keepsake-first plan screen after the quest.
 * Choice rows jump back to quest steps; Save locks the night.
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';
import type { LockedPlan, QuestAnswers } from '../lib/types';
import { DEFAULT_CHOSEN_TIME, formatLockedDate } from '../lib/utils';
import {
  getArtfulSummaryLines,
  getChoiceAlignedPlan,
  type ChoicePlanRow,
} from '../lib/planIdeas';
import { getPersonalizedLoveMessage } from '../lib/loveMessage';
import { TOTAL_QUESTIONS } from '../lib/questions';

export interface CelebrationRevealProps {
  answers: QuestAnswers;
  lockedPlan: LockedPlan | null;
  showLoveMessage: boolean;
  showCelebrationMore: boolean;
  onLock: () => void;
  onCopyNote: () => void;
  onAddToCalendar: () => void;
  onToggleMore: () => void;
  onDownloadKeepsake: () => void;
  onOpenWhisper: () => void;
  onTweak: () => void;
  onEditStep: (step: number) => void;
  onClear: () => void;
  whisperOpenerRef: RefObject<HTMLButtonElement | null>;
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
  showCelebrationMore,
  onLock,
  onCopyNote,
  onAddToCalendar,
  onToggleMore,
  onDownloadKeepsake,
  onOpenWhisper,
  onTweak,
  onEditStep,
  onClear,
  whisperOpenerRef,
}: CelebrationRevealProps) {
  const dateLabel = formatLockedDate(
    answers.chosenDate,
    answers.chosenTime || DEFAULT_CHOSEN_TIME,
  );
  const planRows = getChoiceAlignedPlan(answers);
  const [vibeLine, foodLine, lockLine] = getArtfulSummaryLines(answers);

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

      <header className="text-center">
        <p className="celeb-reveal__eyebrow">All set</p>
        <h1 className="celeb-reveal__title">Here&apos;s What I Planned</h1>
      </header>

      <section className="celeb-reveal__date-block mt-8 text-center" aria-label="Our night">
        <p className="celeb-reveal__date">{dateLabel}</p>
        <p className="celeb-reveal__verse" aria-label={`${vibeLine} ${foodLine} ${lockLine}`}>
          <span className="celeb-reveal__verse-line">{vibeLine}</span>
          <span className="celeb-reveal__verse-mark" aria-hidden="true">
            ✦
          </span>
          <span className="celeb-reveal__verse-line celeb-reveal__verse-line--accent">{foodLine}</span>
          <span className="celeb-reveal__verse-mark" aria-hidden="true">
            ✦
          </span>
          <span className="celeb-reveal__verse-line celeb-reveal__verse-line--soft">{lockLine}</span>
        </p>
      </section>

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

      {!showLoveMessage && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={onLock} className="pill-button primary">
            Save our night
          </button>
        </div>
      )}

      <AnimatePresence>
        {showLoveMessage && lockedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 mt-10"
          >
            <button
              type="button"
              onClick={onToggleMore}
              aria-expanded={showCelebrationMore}
              className="text-sm text-night-cream/75 hover:text-night-amber underline"
            >
              {showCelebrationMore ? 'Fewer options' : 'More options'}
            </button>
            {showCelebrationMore && (
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={onDownloadKeepsake}
                  className="pill-button secondary text-sm w-full"
                >
                  Save constellation image
                </button>
                <button
                  ref={whisperOpenerRef}
                  type="button"
                  onClick={onOpenWhisper}
                  className="pill-button secondary text-sm w-full"
                >
                  Something to say tonight
                </button>
                <button
                  type="button"
                  onClick={onTweak}
                  className="text-sm underline text-night-cream/75 hover:text-night-amber"
                >
                  Ask me to change something
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="text-sm text-night-cream/65 hover:text-night-amber underline"
                >
                  Clear everything & start over
                </button>
              </div>
            )}
            <div className="mt-4 text-xs text-night-cream/55 tracking-[0.2em] uppercase">
              Saved in your browser. Refresh and it&apos;s still here.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

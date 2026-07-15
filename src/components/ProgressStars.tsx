import { TOTAL_QUESTIONS } from '../lib/questions';

interface ProgressStarsProps {
  currentStep: number; // 1-based
  onJump?: (step: number) => void;
  canJumpToStep?: (step: number) => boolean;
}

/** Punch-hole progress — ticket codes, not generic stars */
export function ProgressStars({ currentStep, onJump, canJumpToStep }: ProgressStarsProps) {
  const holes = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1);

  return (
    <div
      className="ticket-progress"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={TOTAL_QUESTIONS}
      aria-label="Quest progress"
    >
      {holes.map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const jumpAllowed = !canJumpToStep || canJumpToStep(step);

        return (
          <button
            key={step}
            type="button"
            onClick={() => jumpAllowed && onJump?.(step)}
            disabled={!onJump || !jumpAllowed}
            className={`ticket-progress__hole ${isCompleted ? 'is-punched' : ''}`}
            aria-label={`Go to question ${step}${isActive ? ' (current)' : ''}${!jumpAllowed ? ' (answer earlier questions first)' : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            {String(step).padStart(2, '0')}
          </button>
        );
      })}
    </div>
  );
}

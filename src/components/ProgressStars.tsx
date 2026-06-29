import { TOTAL_QUESTIONS } from '../lib/questions';

interface ProgressStarsProps {
  currentStep: number; // 1-based
  onJump?: (step: number) => void;
  canJumpToStep?: (step: number) => boolean;
}

export function ProgressStars({ currentStep, onJump, canJumpToStep }: ProgressStarsProps) {
  const stars = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 py-3" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_QUESTIONS}>
      {stars.map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const jumpAllowed = !canJumpToStep || canJumpToStep(step);

        return (
          <button
            key={step}
            type="button"
            onClick={() => jumpAllowed && onJump?.(step)}
            disabled={!onJump || !jumpAllowed}
            className={`group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-romantic-pink rounded-full p-1 ${!jumpAllowed ? 'opacity-40 cursor-not-allowed' : ''}`}
            aria-label={`Go to question ${step}${isActive ? ' (current)' : ''}${!jumpAllowed ? ' (answer earlier questions first)' : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              className={`progress-star transition-all ${isActive ? 'active' : isCompleted ? 'completed' : 'fill-[#E2E8F0] text-[#E2E8F0]'}`}
              aria-hidden="true"
            >
              <path
                d="M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.7 6.6-.9z"
                stroke={isActive || isCompleted ? '#0F172A' : '#CBD5E1'}
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              {(isActive || isCompleted) && (
                <path
                  d="M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.7 6.6-.9z"
                  fill={isActive ? '#FFE600' : '#FF2D95'}
                />
              )}
            </svg>
            <span className="sr-only">Question {step}</span>
          </button>
        );
      })}
    </div>
  );
}

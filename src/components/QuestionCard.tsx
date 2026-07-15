import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface QuestionCardProps {
  prompt: string;
  hint?: string;
  children: ReactNode;
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled: boolean;
  helper?: string | null;
}

export function QuestionCard({
  prompt,
  hint,
  children,
  step,
  total,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  helper,
}: QuestionCardProps) {
  const code = `Eve · ${String(step).padStart(3, '0')}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 24, rotate: -0.8 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, y: -12, rotate: 0.6 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22, mass: 0.8 }}
        className="w-full"
      >
        <div className="quest-ticket">
          <div className="quest-ticket__head">
            <div className="quest-ticket__row">
              <p className="quest-ticket__stub">Admit one</p>
              <p className="quest-ticket__code">
                {code} / {String(total).padStart(3, '0')}
              </p>
            </div>
            <h2 className="quest-ticket__prompt">{prompt}</h2>
            {hint && <p className="quest-ticket__hint">{hint}</p>}
          </div>

          <div className="quest-ticket__perforation" />

          <div className="quest-ticket__body">{children}</div>

          <div className="quest-ticket__perforation" />

          <div className="quest-ticket__tear">
            <button type="button" className="quest-ticket__tear-back" onClick={onBack}>
              Back
            </button>
            <button
              type="button"
              className="quest-ticket__tear-next"
              onClick={onNext}
              disabled={nextDisabled}
            >
              {nextLabel}
            </button>
          </div>
        </div>

        {helper && <p className="quest-ticket__helper">{helper}</p>}
      </motion.div>
    </AnimatePresence>
  );
}

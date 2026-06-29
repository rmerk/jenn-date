import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface QuestionCardProps {
  title?: string;
  prompt: string;
  children: ReactNode;
  step: number;
  total: number;
}

export function QuestionCard({ title, prompt, children, step, total }: QuestionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22, mass: 0.8 }}
        className="sticker-card p-7 sm:p-9 max-w-3xl mx-auto"
      >
        <div className="mb-6 text-center">
          {title && <div className="uppercase tracking-[2px] text-xs text-deep-purple/70 mb-1.5">{title}</div>}
          <h2 className="text-2xl sm:text-3xl leading-tight text-deep-navy font-semibold">{prompt}</h2>
        </div>

        <div>{children}</div>

        <div className="mt-8 text-center text-[10px] text-charcoal/50 tracking-widest">
          QUESTION {step} OF {total}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

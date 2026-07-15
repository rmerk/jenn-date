import { motion, useReducedMotion } from 'framer-motion';
import { CoupleCartoon } from '../../components/CoupleCartoon';

interface VariantProps {
  onStart: () => void;
}

/**
 * B — Quiet letter. No cards. Brand as letterhead. Typography does the work.
 * Cool stone paper + sage + rose ink — avoids cream/terracotta/serif cluster.
 */
export function VariantB({ onStart }: VariantProps) {
  const reduce = useReducedMotion();

  return (
    <div className="reimagine-root reimagine-grain variant-b">
      <div className="reimagine-content min-h-svh flex flex-col items-center px-6 sm:px-10 pt-14 pb-28">
        <motion.header
          className="w-full max-w-xl text-center"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-[10px] tracking-[0.32em] uppercase text-[var(--b-sage)] mb-3">
            Written for one person
          </p>
          <h1 className="brand text-[clamp(2.1rem,7vw,3.75rem)] leading-[1.05]">
            Our Little Universe
          </h1>
          <div className="rule mt-6 mb-8" />
        </motion.header>

        <motion.article
          className="w-full max-w-lg text-left"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2 }}
        >
          <p className="greeting text-5xl sm:text-6xl mb-6">Jennifer,</p>
          <div className="letter-body text-xl sm:text-[1.35rem] leading-[1.65] space-y-5">
            <p>
              I&apos;m planning our next date — not a survey, just a short letter of what you&apos;d
              love, so I can make the night.
            </p>
            <p className="text-[var(--b-sage)] text-lg">
              Four questions. About three minutes. Then I take it from here.
            </p>
          </div>

          <div className="mt-12">
            <button type="button" className="cta" onClick={onStart}>
              Tell me what you&apos;d love →
            </button>
          </div>
        </motion.article>

        <motion.div
          className="mt-auto pt-16 w-full max-w-xl flex justify-end items-end gap-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--b-sage)] pb-2">
            Your wishes · my plan
          </p>
          <div
            className="rotate-3 shadow-[2px_4px_0_rgba(26,28,25,0.12)]"
            style={{ outline: '3px solid rgba(26,28,25,0.08)', outlineOffset: 4 }}
          >
            <CoupleCartoon size={96} alt="" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

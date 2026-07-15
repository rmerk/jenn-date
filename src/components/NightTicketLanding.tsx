import { motion, useReducedMotion } from 'framer-motion';
import { CoupleCartoon } from './CoupleCartoon';

interface NightTicketLandingProps {
  onStart: () => void;
}

/**
 * First-visit landing — night ticket composition.
 * Brand is the hero on the ticket; couple art is atmospheric backdrop only.
 */
export function NightTicketLanding({ onStart }: NightTicketLandingProps) {
  const reduce = useReducedMotion();

  return (
    <div className="night-ticket-landing">
      <div
        className="night-ticket-landing__backdrop"
        aria-hidden
      >
        <div className="night-ticket-landing__couple">
          <CoupleCartoon size={420} alt="" />
          <div className="night-ticket-landing__vignette" />
        </div>
      </div>

      <div className="night-ticket-landing__content">
        <motion.div
          className="night-ticket"
          initial={reduce ? false : { opacity: 0, y: 28, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        >
          <div className="night-ticket__body">
            <div className="night-ticket__row">
              <p className="night-ticket__stub">Admit one</p>
              <p className="night-ticket__code">Eve · 001</p>
            </div>

            <h1 className="night-ticket__brand">
              Our Little
              <br />
              Universe
            </h1>

            <p className="night-ticket__greeting">Hey Jennifer</p>
            <p className="night-ticket__support">
              Four questions so I know what you&apos;d love. Then I plan the night.
            </p>
          </div>

          <div className="night-ticket__perforation" />

          <div className="night-ticket__meta">
            <div>
              <p className="night-ticket__meta-label">Duration</p>
              <p className="night-ticket__meta-value">~3 MIN</p>
            </div>
            <div className="text-right">
              <p className="night-ticket__meta-label">Destination</p>
              <p className="night-ticket__meta-value">US</p>
            </div>
          </div>

          <button type="button" className="night-ticket__cta" onClick={onStart}>
            Tear here — tell me what you&apos;d love
          </button>
        </motion.div>

        <motion.p
          className="night-ticket-landing__footer"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Your wishes · my plan
        </motion.p>
      </div>
    </div>
  );
}

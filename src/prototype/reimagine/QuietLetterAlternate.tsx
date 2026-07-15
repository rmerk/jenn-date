/**
 * RESERVED ALTERNATE — Quiet Letter landing.
 * Shipped first-visit is Night Ticket. Keep this for a future A/B or mood switch.
 * Dev only: http://localhost:5173/?variant=B
 */

import { useEffect } from 'react';
import './reimagine.css';
import { VariantB } from './VariantB';

export function isQuietLetterAlternate(value: string | null): boolean {
  return value === 'B';
}

interface QuietLetterAlternateProps {
  onStart: () => void;
}

export function QuietLetterAlternate({ onStart }: QuietLetterAlternateProps) {
  useEffect(() => {
    console.info('[reimagine] Quiet Letter alternate (reserved) — production ships Night Ticket');
  }, []);

  return (
    <>
      <VariantB onStart={onStart} />
      {import.meta.env.DEV && (
        <div className="prototype-switcher" role="status">
          <div className="label" style={{ minWidth: '14rem' }}>
            B — Quiet letter (reserved)
          </div>
          <button
            type="button"
            aria-label="Exit to live Night Ticket landing"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('variant');
              window.history.replaceState({}, '', url.toString());
              window.location.reload();
            }}
            style={{ padding: '0 0.75rem', fontSize: '0.7rem', minWidth: 'auto' }}
          >
            Live →
          </button>
        </div>
      )}
    </>
  );
}

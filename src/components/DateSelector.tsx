import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUpcomingDates, formatDateForDisplay, getNextFriday, getNextSaturday, getNextWeekend, isFutureDate } from '../lib/utils';
import { CoupleCartoonMini } from './CoupleCartoon';

interface DateSelectorProps {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
}

const QUICK_OPTIONS = [
  { label: 'This Friday', get: getNextFriday },
  { label: 'This Saturday', get: getNextSaturday },
  { label: 'Next weekend', get: getNextWeekend },
];

export function DateSelector({ value, onChange }: DateSelectorProps) {
  const upcoming = useMemo(() => getUpcomingDates(21), []);

  const selectedInfo = value ? formatDateForDisplay(value) : null;

  const handleQuick = (getter: () => string) => {
    const date = getter();
    if (isFutureDate(date)) {
      onChange(date);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live counter - emotional centerpiece moment */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium shadow-sm ring-1 ring-inset ring-black/5">
          {selectedInfo ? (
            <>
              <span className="text-romantic-pink">★</span>
              <span>
                {selectedInfo.daysUntil} day{selectedInfo.daysUntil === 1 ? '' : 's'} to go
              </span>
            </>
          ) : (
            <span className="text-deep-navy/70">Pick a night</span>
          )}
        </div>
      </div>

      {/* Quick-select chips — thumb friendly, delightful */}
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => handleQuick(opt.get)}
            className="choice-pill text-sm active:scale-[0.985] transition"
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            // Jump to a nice middle date in the grid as "Pick any night"
            const mid = upcoming[Math.floor(upcoming.length * 0.4)];
            onChange(mid);
          }}
          className="choice-pill text-sm active:scale-[0.985] transition border-dashed"
        >
          Pick any night
        </button>
      </div>

      {/* Beautiful date ticket grid — "star charts" / event tickets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence>
          {upcoming.map((iso) => {
            const info = formatDateForDisplay(iso);
            const isSelected = value === iso;
            const isWeekend = info.weekday === 'Saturday' || info.weekday === 'Sunday';

            return (
              <motion.button
                key={iso}
                type="button"
                onClick={() => onChange(iso)}
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.985 }}
                className={`date-ticket text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-romantic-pink ${isSelected ? 'selected' : ''}`}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="weekday tracking-[1.5px]">{info.weekday}</div>
                    <div className="day tabular-nums">{info.day}</div>
                    <div className="month -mt-0.5">{info.month}</div>
                  </div>

                  <div className="mt-1 opacity-70">
                    <CoupleCartoonMini className="w-10 h-10" />
                  </div>
                </div>

                {/* Weekend sparkle indicator */}
                {isWeekend && (
                  <div className="absolute top-3 right-3 text-sunny-yellow text-lg leading-none">✧</div>
                )}

                {/* Subtle "evening" label */}
                <div className="mt-3 text-[10px] uppercase tracking-[1px] text-charcoal/60">in the evening</div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Gentle note */}
      <p className="text-center text-xs text-charcoal/60 max-w-xs mx-auto">
        Only future dates are shown. Every night is a new page in our storybook.
      </p>
    </div>
  );
}

import { useEffect, useMemo, useRef } from 'react';
import {
  getUpcomingDates,
  formatDateForDisplay,
  getNextFriday,
  getNextSaturday,
  getNextWeekend,
  isFutureDate,
  formatTimeForDisplay,
  DEFAULT_CHOSEN_TIME,
  toLocalISODate,
} from '../lib/utils';

interface DateSelectorProps {
  value: string; // YYYY-MM-DD
  time: string; // HH:mm
  onChange: (iso: string) => void;
  onTimeChange: (time: string) => void;
}

const QUICK_OPTIONS = [
  { label: 'This Friday', get: getNextFriday },
  { label: 'This Saturday', get: getNextSaturday },
  { label: 'Next weekend', get: getNextWeekend },
] as const;

const EVENING_PRESETS = [
  { label: '6:00', value: '18:00' },
  { label: '7:00', value: '19:00' },
  { label: '8:00', value: '20:00' },
  { label: '9:00', value: '21:00' },
] as const;

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function parseLocalISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

type CalCell =
  | { kind: 'empty' }
  | { kind: 'day'; iso: string; day: number; selectable: boolean; weekend: boolean };

/** Pack upcoming ISO dates into Sunday-start weeks for a compact calendar. */
function buildCalendarWeeks(upcoming: string[]): CalCell[][] {
  if (upcoming.length === 0) return [];

  const selectable = new Set(upcoming);
  const first = parseLocalISO(upcoming[0]);
  const last = parseLocalISO(upcoming[upcoming.length - 1]);

  const cursor = new Date(first);
  cursor.setDate(first.getDate() - first.getDay());

  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  const weeks: CalCell[][] = [];
  const walk = new Date(cursor);

  while (walk <= end) {
    const week: CalCell[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = toLocalISODate(walk);
      const beforeRange = walk < first;
      const afterRange = walk > last;

      if (beforeRange || afterRange) {
        week.push({ kind: 'empty' });
      } else {
        const dow = walk.getDay();
        week.push({
          kind: 'day',
          iso,
          day: walk.getDate(),
          selectable: selectable.has(iso),
          weekend: dow === 0 || dow === 6,
        });
      }
      walk.setDate(walk.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function monthSpanLabel(upcoming: string[]): string {
  if (upcoming.length === 0) return '';
  const first = parseLocalISO(upcoming[0]);
  const last = parseLocalISO(upcoming[upcoming.length - 1]);
  const sameMonth =
    first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
  if (sameMonth) {
    return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const a = first.toLocaleDateString('en-US', { month: 'short' });
  const b = last.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${a} – ${b}`;
}

export function DateSelector({ value, time, onChange, onTimeChange }: DateSelectorProps) {
  const upcoming = useMemo(() => getUpcomingDates(21), []);
  const weeks = useMemo(() => buildCalendarWeeks(upcoming), [upcoming]);
  const rangeLabel = useMemo(() => monthSpanLabel(upcoming), [upcoming]);
  const activeTime = time || DEFAULT_CHOSEN_TIME;
  const selectedRef = useRef<HTMLButtonElement>(null);

  const selectedInfo = value ? formatDateForDisplay(value) : null;
  const isPresetTime = EVENING_PRESETS.some((p) => p.value === activeTime);

  useEffect(() => {
    if (!value || !selectedRef.current) return;
    selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [value]);

  const handleQuick = (getter: () => string) => {
    const date = getter();
    if (isFutureDate(date)) onChange(date);
  };

  return (
    <div className="night-cal">
      <div className="night-cal__summary" aria-live="polite">
        {selectedInfo ? (
          <>
            <span className="night-cal__summary-star" aria-hidden>
              ★
            </span>
            <span>
              {selectedInfo.weekday.slice(0, 3)} {selectedInfo.month} {selectedInfo.day}
              <span className="night-cal__summary-sep">·</span>
              {formatTimeForDisplay(activeTime)}
              <span className="night-cal__summary-muted">
                {' '}
                · {selectedInfo.daysUntil} day{selectedInfo.daysUntil === 1 ? '' : 's'}
              </span>
            </span>
          </>
        ) : (
          <span>Pick a night below</span>
        )}
      </div>

      <div>
        <p className="ticket-section-label">Quick picks</p>
        <div className="ticket-stamp-row" role="group" aria-label="Quick date picks">
          {QUICK_OPTIONS.map((opt) => {
            const iso = opt.get();
            const selected = value === iso;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleQuick(opt.get)}
                className={`ticket-stamp ${selected ? 'selected' : ''}`}
                aria-pressed={selected}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="night-cal__month-row">
          <p className="ticket-section-label !mb-0">Or pick a night</p>
          <p className="night-cal__month">{rangeLabel}</p>
        </div>

        <div className="night-cal__grid" role="grid" aria-label="Upcoming nights">
          <div className="night-cal__weekdays" role="row">
            {WEEKDAY_HEADERS.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className={`night-cal__weekday ${i === 0 || i === 6 ? 'is-weekend' : ''}`}
                role="columnheader"
              >
                {label}
              </span>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="night-cal__week" role="row">
              {week.map((cell, di) => {
                if (cell.kind === 'empty') {
                  return <span key={`e-${wi}-${di}`} className="night-cal__cell is-empty" />;
                }

                const isSelected = value === cell.iso;
                return (
                  <button
                    key={cell.iso}
                    ref={isSelected ? selectedRef : undefined}
                    type="button"
                    role="gridcell"
                    disabled={!cell.selectable}
                    aria-pressed={isSelected}
                    aria-label={formatDateForDisplay(cell.iso).full}
                    onClick={() => onChange(cell.iso)}
                    className={[
                      'night-cal__cell',
                      cell.weekend ? 'is-weekend' : '',
                      isSelected ? 'is-selected' : '',
                      !cell.selectable ? 'is-disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={`night-cal__time ${value ? 'is-active' : ''}`}>
        <div className="night-cal__month-row">
          <p className="ticket-section-label !mb-0">Curtain rises</p>
          {!value && <p className="night-cal__time-hint">Choose a night first</p>}
        </div>

        <div
          className="ticket-stamp-row"
          role="group"
          aria-label="Evening start time"
          aria-disabled={!value}
        >
          {EVENING_PRESETS.map((preset) => {
            const selected = activeTime === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                disabled={!value}
                onClick={() => onTimeChange(preset.value)}
                className={`ticket-stamp ${selected ? 'selected' : ''}`}
                aria-pressed={selected}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <label className="night-cal__custom-time" htmlFor="chosen-time">
          <span className="ticket-section-label !mb-0">
            {isPresetTime ? 'Or a custom time' : 'Custom time'}
          </span>
          <input
            id="chosen-time"
            type="time"
            value={activeTime}
            disabled={!value}
            onChange={(e) => onTimeChange(e.target.value)}
            className="ticket-field night-cal__time-input"
          />
        </label>
      </div>

      <p className="ticket-note text-center">Only future nights — tomorrow through three weeks out.</p>
    </div>
  );
}

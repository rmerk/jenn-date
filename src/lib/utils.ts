/**
 * Pure, delightful utilities for Jennifer's date quest.
 * No side effects. All date math uses local time (midnight) so "future only" is reliable.
 */

import type { QuestAnswers, LockedPlan } from './types';
import { getHintExtraSentence, getLoveMessage } from './loveMessage';
import {
  getFoodCategoryLabel,
  getVibeCategoryLabel,
  formatRestaurantDetail,
} from './questions';
import { getConstellationIdeas } from './planIdeas';

export { getConstellationIdeas } from './planIdeas';

/** Default evening start — matches the original hard-coded calendar window. */
export const DEFAULT_CHOSEN_TIME = '19:00';

const EVENT_DURATION_HOURS = 4;

/** Pretty 12-hour label from 24h HH:mm. */
export function formatTimeForDisplay(time24: string): string {
  const [hourPart, minutePart] = time24.split(':');
  const hours = Number(hourPart);
  const minutes = Number(minutePart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time24;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** ICS floating local datetime: YYYYMMDDTHHMMSS */
export function toIcsLocalDateTime(isoDate: string, time24: string): string {
  const [hourPart, minutePart] = time24.split(':');
  return `${isoDate.replace(/-/g, '')}T${hourPart}${minutePart}00`;
}

function addHoursToTime(time24: string, hoursToAdd: number): string {
  const [hourPart, minutePart] = time24.split(':');
  const totalMinutes = Number(hourPart) * 60 + Number(minutePart) + hoursToAdd * 60;
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getPlanIcsWindow(plan: Pick<LockedPlan, 'chosenDate' | 'chosenTime'>): {
  start: string;
  end: string;
} {
  const startTime = plan.chosenTime ?? DEFAULT_CHOSEN_TIME;
  return {
    start: toIcsLocalDateTime(plan.chosenDate, startTime),
    end: toIcsLocalDateTime(plan.chosenDate, addHoursToTime(startTime, EVENT_DURATION_HOURS)),
  };
}

/** Local calendar day as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns an array of upcoming dates (YYYY-MM-DD) starting tomorrow, for N days. */
export function getUpcomingDates(count = 21): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(toLocalISODate(d));
  }
  return dates;
}

export function formatDateForDisplay(iso: string): {
  weekday: string;
  day: string;
  month: string;
  full: string;
  daysUntil: number;
} {
  const date = new Date(iso + 'T00:00:00'); // force local midnight
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = date.getDate().toString();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const full = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return { weekday, day, month, full, daysUntil };
}

export function getNextFriday(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay(); // 0=Sun ... 5=Fri
  const daysUntilFriday = (5 - day + 7) % 7 || 7; // next Friday, at least +1 day
  const friday = new Date(today);
  friday.setDate(today.getDate() + daysUntilFriday);
  return toLocalISODate(friday);
}

export function getNextSaturday(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSat);
  return toLocalISODate(sat);
}

export function getNextWeekend(): string {
  // Weekend after this coming Saturday — must stay distinct from getNextSaturday()
  const thisSaturday = getNextSaturday();
  const d = new Date(`${thisSaturday}T00:00:00`);
  d.setDate(d.getDate() + 7);
  return toLocalISODate(d);
}

/** Very small, warm, romantic summary generator for the vertical slice. */
export function generateSummary(answers: QuestAnswers): string {
  const vibeText = getVibeCategoryLabel(answers.vibe).toLowerCase();

  const foodLabel = getFoodCategoryLabel(answers.foodFantasy).toLowerCase();
  const restaurantDetail = formatRestaurantDetail(answers);
  const foodText =
    answers.foodFantasy === 'restaurant' && restaurantDetail
      ? `${foodLabel} — ${restaurantDetail.toLowerCase()}`
      : foodLabel;

  let base = `I'm planning ${vibeText}. Food: ${foodText}. Locked in — can't wait.`;

  if (answers.foodFantasy === 'surprise') {
    base += " You're trusting me with food — I won't let you down.";
  }

  // Feature 1: light personalization when hint is present (one extra sentence max)
  const extra = getHintExtraSentence(answers);
  return extra ? `${base} ${extra}` : base;
}

/** Simple future-date guard (used in DateSelector and on lock). */
export function isFutureDate(iso: string): boolean {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
}

/** True when the chosen date is strictly before today (local midnight). */
export function isDatePassed(iso: string): boolean {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/** True when the chosen date is today (local midnight). */
export function isChosenDateToday(iso: string): boolean {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
}

/** @deprecated Replaced by post-date debrief flow */
export function isAnniversary(iso: string): boolean {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

/** Pretty print for the locked celebration header. */
export function formatLockedDate(iso: string, time = DEFAULT_CHOSEN_TIME): string {
  const { full } = formatDateForDisplay(iso);
  return `${full} at ${formatTimeForDisplay(time)}`;
}

/* ============================================================
   FEATURE 2 — LOVE BRIEF FOR HUSBAND (private, zero UI footprint)
   Pure generators + tiny download helper. No new runtime deps.
   ============================================================ */

/** Very small helper to trigger a text file download (used by Love Brief) */
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Scannable day-of checklist for the husband — the logistics cheat sheet. */
export function generateExecutionChecklist(plan: LockedPlan): string {
  const date = new Date(plan.chosenDate + 'T00:00:00');
  const pretty = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeLabel = formatTimeForDisplay(plan.chosenTime ?? DEFAULT_CHOSEN_TIME);

  const items = [
    `Date locked: ${pretty} at ${timeLabel}`,
    `Vibe: ${getVibeCategoryLabel(plan.vibe)}`,
    `Food: ${getFoodCategoryLabel(plan.foodFantasy)}`,
    ...(formatRestaurantDetail(plan)
      ? [`Restaurant style: ${formatRestaurantDetail(plan)}`]
      : []),
    plan.secretHint?.trim() ? `Her hint: "${plan.secretHint.trim()}"` : 'No secret hint — still nail the vibe',
    ...getConstellationIdeas(plan).map((idea) => `[ ] ${idea}`),
  ];

  return items.join('\n');
}

/** Generates the rich plain-text Love Brief the husband downloads via long-press */
export function generateLoveBriefMarkdown(plan: LockedPlan): string {
  const date = new Date(plan.chosenDate + 'T00:00:00');
  const pretty = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return `LOVE BRIEF — ${pretty}
For: Jennifer
From: You (private)

DAY-OF CHECKLIST
${generateExecutionChecklist(plan)}

HER SECRET HINT (exact, unedited)
${plan.secretHint?.trim() ? plan.secretHint.trim() : '(none — she still told you what she wants)'}

THE LOVE LETTER SHE RECEIVED
${getLoveMessage(plan)}

———
YOUR NOTES (morning after)
• 
• 

Generated when she locked the date. Stays on your devices only.
`.trim();
}

/** Generates a simple .ics calendar file with the rich description embedded */
export function generateLoveBriefICS(plan: LockedPlan): string {
  const date = new Date(plan.chosenDate + 'T00:00:00');
  const { start, end } = getPlanIcsWindow(plan);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary = `Our Special Evening — ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  const desc = generateLoveBriefMarkdown(plan).replace(/\n/g, '\\n').replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Our Little Universe//Love Brief//EN',
    'BEGIN:VEVENT',
    `UID:love-brief-${plan.chosenDate}@ourlittleuniverse`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Jennifer-facing calendar event — short and practical, no husband brief embedded. */
export function generateJenniferCalendarICS(plan: LockedPlan): string {
  const date = new Date(plan.chosenDate + 'T00:00:00');
  const { start, end } = getPlanIcsWindow(plan);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const timeLabel = formatTimeForDisplay(plan.chosenTime ?? DEFAULT_CHOSEN_TIME);

  const summary = `Date night — ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  const desc = [
    `Vibe: ${getVibeCategoryLabel(plan.vibe)}`,
    `Food: ${getFoodCategoryLabel(plan.foodFantasy)}`,
    `Starts at ${timeLabel}`,
    '',
    'Planned in Our Little Universe.',
  ]
    .join('\\n')
    .replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Our Little Universe//Date Night//EN',
    'BEGIN:VEVENT',
    `UID:date-night-${plan.chosenDate}@ourlittleuniverse`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Download a .ics file for Jennifer's calendar. */
export function downloadCalendarICS(plan: LockedPlan, filename?: string): void {
  const ics = generateJenniferCalendarICS(plan);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `Our-Date-${plan.chosenDate}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

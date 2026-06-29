/**
 * Pure, delightful utilities for Jennifer's date quest.
 * No side effects. All date math uses local time (midnight) so "future only" is reliable.
 */

import type { QuestAnswers, LockedPlan } from './types';
import { getHintExtraSentence, getLoveMessage } from './loveMessage';
import {
  getFoodCategoryLabel,
  getVibeCategoryLabel,
  getFeelingWordLabel,
  formatRestaurantDetail,
} from './questions';
import { getConstellationIdeas } from './planIdeas';

export { getConstellationIdeas } from './planIdeas';

/** Returns an array of upcoming dates (YYYY-MM-DD) starting tomorrow, for N days. */
export function getUpcomingDates(count = 21): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    dates.push(iso);
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
  return friday.toISOString().split('T')[0];
}

export function getNextSaturday(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSat);
  return sat.toISOString().split('T')[0];
}

export function getNextWeekend(): string {
  // Prefer this coming Saturday for "next weekend"
  return getNextSaturday();
}

/** Very small, warm, romantic summary generator for the vertical slice. */
export function generateSummary(answers: QuestAnswers): string {
  const vibeText = getVibeCategoryLabel(answers.vibe).toLowerCase();
  const feelingText = getFeelingWordLabel(answers.feelingWord).toLowerCase();

  const foodLabel = getFoodCategoryLabel(answers.foodFantasy).toLowerCase();
  const restaurantDetail = formatRestaurantDetail(answers);
  const foodText =
    answers.foodFantasy === 'restaurant' && restaurantDetail
      ? `${foodLabel} — ${restaurantDetail.toLowerCase()}`
      : foodLabel;

  let base = `You picked ${vibeText}. Food: ${foodText}. You want to feel ${feelingText} — and you will.`;

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
export function formatLockedDate(iso: string): string {
  const { full } = formatDateForDisplay(iso);
  return `${full} in the evening`;
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

  const items = [
    `Date locked: ${pretty} (evening)`,
    `Vibe: ${getVibeCategoryLabel(plan.vibe)}`,
    `Food: ${getFoodCategoryLabel(plan.foodFantasy)}`,
    ...(formatRestaurantDetail(plan)
      ? [`Restaurant style: ${formatRestaurantDetail(plan)}`]
      : []),
    `She wants to feel: ${plan.feelingWord}`,
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
  // Use 19:00–23:00 as a gentle default evening window (easy for the husband to tweak)
  const start = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'T190000';
  const end = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'T230000';
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
  const start = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'T190000';
  const end = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'T230000';
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary = `Date night — ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  const desc = [
    `Vibe: ${getVibeCategoryLabel(plan.vibe)}`,
    `Food: ${getFoodCategoryLabel(plan.foodFantasy)}`,
    `You want to feel: ${plan.feelingWord}`,
    '',
    'Locked in Our Little Universe.',
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

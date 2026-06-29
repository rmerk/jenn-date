/**
 * THE PERSONAL CONSTELLATION MAP
 *
 * Turns Jennifer's six answers into a unique, beautiful star map —
 * "the map of the night we chose."
 *
 * Everything here is pure and DETERMINISTIC: the exact same set of answers
 * always produces the exact same constellation, but two different sets of
 * answers produce visibly different maps. So her constellation is truly,
 * permanently hers.
 *
 * No randomness at runtime, no dependencies, no network. Just her choices
 * turned into a private little sky.
 */

import type { QuestAnswers, LockedPlan } from './types';
import { getFoodCategoryLabel, getVibeCategoryLabel, getFeelingWordLabel, formatRestaurantDetail } from './questions';

export interface ConstellationStar {
  x: number;
  y: number;
  /** outer radius of the star glyph */
  r: number;
  /** soft label shown under the star (us, vibe, date, feeling, …) */
  label: string;
  color: string;
  /** the brightest hero star (the chosen date) gets an extra glow */
  hero: boolean;
}

export interface ConstellationDust {
  x: number;
  y: number;
  r: number;
  o: number;
}

export interface ConstellationData {
  width: number;
  height: number;
  stars: ConstellationStar[];
  /** background twinkle field (purely decorative) */
  dust: ConstellationDust[];
  /** accent color — tints the lines and the hero star */
  accent: string;
}

const PALETTE = ['#FF2D95', '#00D4FF', '#FFE600', '#9D4EDD'];

/** Tiny, stable string hash → 32-bit seed. */
function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — small, fast, seeded PRNG so layouts are stable per answer-set. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Short, friendly labels for each of the six stars. */
function starLabels(a: Partial<QuestAnswers>): string[] {
  const date = a.chosenDate ? new Date(a.chosenDate + 'T00:00:00') : null;
  const dateLabel = date
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Our night';

  const food =
    a.foodFantasy === 'restaurant' && formatRestaurantDetail(a)
      ? formatRestaurantDetail(a)!
      : a.foodFantasy
        ? getFoodCategoryLabel(a.foodFantasy)
        : 'Food';

  return [
    'Us',
    a.vibe ? getVibeCategoryLabel(a.vibe) : 'Vibe',
    food,
    dateLabel,
    a.feelingWord ? getFeelingWordLabel(a.feelingWord) : 'Feeling',
    a.secretHint && a.secretHint.trim() ? 'Your wish' : 'Just us',
  ];
}

/**
 * Six anchor points laid out as a gentle left-to-right wave so the
 * connecting line always reads as a real constellation (never a messy scatter).
 * Normalized 0–1; the date (index 3) is the hero.
 */
const ANCHORS: Array<[number, number]> = [
  [0.12, 0.58],
  [0.28, 0.34],
  [0.42, 0.52],
  [0.58, 0.28], // hero — the chosen date
  [0.74, 0.46],
  [0.89, 0.56],
];

const HERO_INDEX = 3;

export interface BuildOptions {
  width?: number;
  height?: number;
  /** vertical padding reserved for labels at the bottom of each star */
  labelSpace?: boolean;
}

/**
 * Build the full constellation data for a plan (or partial in-progress answers).
 * Same answers → identical map, forever.
 */
export function buildConstellation(
  plan: Partial<QuestAnswers> | LockedPlan,
  opts: BuildOptions = {},
): ConstellationData {
  const width = opts.width ?? 400;
  const height = opts.height ?? 300;

  // Seed from the answers that define "her" night. Stable + unique.
  const seedSource = [
    plan.vibe,
    plan.foodFantasy,
    plan.chosenDate,
    plan.feelingWord,
    (plan.secretHint || '').trim(),
  ].join('|');
  const rng = mulberry32(hashString(seedSource || 'our-little-universe'));

  const accent = '#FF2D95';
  const labels = starLabels(plan);

  const marginX = width * 0.08;
  const marginY = height * 0.14;
  const usableW = width - marginX * 2;
  const usableH = height - marginY * 2;

  const stars: ConstellationStar[] = ANCHORS.map(([nx, ny], i) => {
    // Gentle seeded jitter so each map feels organic but never chaotic.
    const jx = (rng() - 0.5) * 0.05;
    const jy = (rng() - 0.5) * 0.06;
    const hero = i === HERO_INDEX;

    const baseR = hero ? 11 : 6 + rng() * 3.5;
    const color = hero ? accent : PALETTE[Math.floor(rng() * PALETTE.length)];

    return {
      x: marginX + (nx + jx) * usableW,
      y: marginY + (ny + jy) * usableH,
      r: baseR,
      label: labels[i] ?? '',
      color,
      hero,
    };
  });

  // Background twinkle dust — seeded, calm, never near the labels' baseline.
  const dustCount = 26;
  const dust: ConstellationDust[] = Array.from({ length: dustCount }, () => ({
    x: rng() * width,
    y: rng() * height,
    r: 0.6 + rng() * 1.6,
    o: 0.18 + rng() * 0.4,
  }));

  return { width, height, stars, dust, accent };
}

/**
 * SVG path for a soft 4-point sparkle star centered at (cx, cy).
 * Reused by both the on-screen component and the keepsake canvas (via points()).
 */
export function fourPointStarPath(cx: number, cy: number, R: number, inner = R * 0.38): string {
  const p = starPoints(cx, cy, R, inner);
  return `M${p[0][0]} ${p[0][1]} ` + p.slice(1).map(([x, y]) => `L${x} ${y}`).join(' ') + ' Z';
}

/**
 * Draws the constellation onto a 2D canvas inside the box (ox, oy, boxW, boxH).
 * Used by the downloadable keepsake card so the saved image matches the
 * on-screen map exactly (same seed, same sky).
 */
export function drawConstellationToCanvas(
  ctx: CanvasRenderingContext2D,
  plan: Partial<QuestAnswers> | LockedPlan,
  ox: number,
  oy: number,
  boxW: number,
  boxH: number,
  options: { labels?: boolean } = {},
): void {
  const data = buildConstellation(plan, { width: boxW, height: boxH });
  const showLabels = options.labels ?? true;

  // Background twinkle dust
  for (const d of data.dust) {
    ctx.beginPath();
    ctx.fillStyle = '#9D4EDD';
    ctx.globalAlpha = d.o * 0.7;
    ctx.arc(ox + d.x, oy + d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Connecting line
  if (data.stars.length > 1) {
    ctx.beginPath();
    ctx.moveTo(ox + data.stars[0].x, oy + data.stars[0].y);
    for (let i = 1; i < data.stars.length; i++) {
      ctx.lineTo(ox + data.stars[i].x, oy + data.stars[i].y);
    }
    ctx.strokeStyle = data.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Stars + labels
  for (const s of data.stars) {
    if (s.hero) {
      ctx.beginPath();
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.18;
      ctx.arc(ox + s.x, oy + s.y, s.r * 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const pts = starPoints(ox + s.x, oy + s.y, s.r);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();

    // white glint
    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.85;
    ctx.arc(ox + s.x - s.r * 0.18, oy + s.y - s.r * 0.22, Math.max(1, s.r * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (showLabels && s.label) {
      ctx.fillStyle = s.hero ? '#0F172A' : '#1E2937';
      ctx.globalAlpha = s.hero ? 0.92 : 0.66;
      ctx.font = `${s.hero ? 700 : 500} ${s.hero ? 13 : 11}px Poppins, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(s.label, ox + s.x, oy + s.y + s.r + 14);
      ctx.globalAlpha = 1;
    }
  }
}

/** The eight points (4 outer + 4 inner) of a 4-point sparkle star. */
export function starPoints(cx: number, cy: number, R: number, inner = R * 0.38): Array<[number, number]> {
  return [
    [cx, cy - R],
    [cx + inner, cy - inner],
    [cx + R, cy],
    [cx + inner, cy + inner],
    [cx, cy + R],
    [cx - inner, cy + inner],
    [cx - R, cy],
    [cx - inner, cy - inner],
  ];
}

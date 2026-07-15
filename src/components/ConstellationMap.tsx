import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { QuestAnswers, LockedPlan } from '../lib/types';
import { buildConstellation, fourPointStarPath } from '../lib/constellation';

interface ConstellationMapProps {
  plan: Partial<QuestAnswers> | LockedPlan;
  /** show the small labels under each star (off for tiny previews) */
  showLabels?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * The Map of the Night We Chose.
 *
 * A unique constellation drawn from Jennifer's six answers. Stars light up
 * in gentle sequence, the connecting line draws itself across the sky, and the
 * chosen date sits at the heart of it as the brightest star.
 *
 * Fully deterministic (same answers → same map), respects reduced motion,
 * and built entirely from the existing brand palette and sparkle language.
 */
export function ConstellationMap({
  plan,
  showLabels = true,
  className = '',
  'aria-label': ariaLabel,
}: ConstellationMapProps) {
  const reduce = useReducedMotion();
  const data = useMemo(() => buildConstellation(plan, { width: 400, height: 300 }), [plan]);

  // The polyline that threads the six stars together into one shape.
  const linePath = useMemo(() => {
    if (data.stars.length === 0) return '';
    const [first, ...rest] = data.stars;
    return `M${first.x} ${first.y} ` + rest.map((s) => `L${s.x} ${s.y}`).join(' ');
  }, [data]);

  const label =
    ariaLabel ??
    'A constellation built from what you told me, with the chosen date glowing as the brightest star.';

  return (
    <svg
      viewBox={`0 0 ${data.width} ${data.height}`}
      width="100%"
      height="100%"
      className={className}
      role="img"
      aria-label={label}
    >
      <defs>
        <radialGradient id="constellation-glow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor={data.accent} stopOpacity="0.16" />
          <stop offset="60%" stopColor="#2a5550" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#f7f0e4" stopOpacity="0" />
        </radialGradient>
        <filter id="constellation-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft nebula wash behind everything */}
      <rect x="0" y="0" width={data.width} height={data.height} fill="url(#constellation-glow)" />

      {/* Background twinkle dust */}
      {data.dust.map((d, i) => (
        <motion.circle
          key={`dust-${i}`}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill="#2a5550"
          initial={reduce ? false : { opacity: 0 }}
          animate={
            reduce
              ? { opacity: d.o }
              : { opacity: [d.o * 0.4, d.o, d.o * 0.4] }
          }
          transition={
            reduce
              ? undefined
              : { duration: 2.4 + (i % 5) * 0.4, repeat: Infinity, ease: 'easeInOut', delay: (i % 7) * 0.2 }
          }
        />
      ))}

      {/* The connecting line — draws itself across the sky */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={data.accent}
        strokeOpacity="0.45"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.45 }}
        transition={reduce ? undefined : { duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
      />

      {/* The six stars */}
      {data.stars.map((s, i) => (
        <motion.g
          key={`star-${i}`}
          initial={reduce ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduce
              ? undefined
              : { type: 'spring', stiffness: 220, damping: 16, delay: 0.3 + i * 0.18 }
          }
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}
        >
          {/* Hero halo for the chosen date */}
          {s.hero && (
            <circle cx={s.x} cy={s.y} r={s.r * 2.3} fill={s.color} opacity="0.16" filter="url(#constellation-soft)" />
          )}
          <path d={fourPointStarPath(s.x, s.y, s.r)} fill={s.color} filter={s.hero ? 'url(#constellation-soft)' : undefined} />
          {/* tiny white glint */}
          <circle cx={s.x - s.r * 0.18} cy={s.y - s.r * 0.22} r={Math.max(1, s.r * 0.18)} fill="#FFFFFF" opacity="0.85" />

          {showLabels && s.label && (
            <text
              x={s.x}
              y={s.y + s.r + 12}
              textAnchor="middle"
              fontSize={s.hero ? 11 : 9.5}
              fontWeight={s.hero ? 700 : 500}
              fill={s.hero ? '#0f1f1f' : '#1a2e2e'}
              opacity={s.hero ? 0.92 : 0.66}
              fontFamily="Figtree, system-ui, sans-serif"
            >
              {s.label}
            </text>
          )}
        </motion.g>
      ))}
    </svg>
  );
}

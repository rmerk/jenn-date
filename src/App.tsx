import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';

import { CoupleCartoon } from './components/CoupleCartoon';
import type { QuestAnswers, LockedPlan } from './lib/types';
import { TOTAL_QUESTIONS, getQuestion, isQuestComplete, canJumpToStep, getVibeCategoryLabel, RESTAURANT_CUISINE_OPTIONS, OUTING_ACTIVITY_OPTIONS, isStep2Complete, formatFoodAnswer, formatOutingAnswer, deriveFoodFantasy, deriveOutingFoodFantasy, getStep2Copy, isOutingStepVibe } from './lib/questions';
import { ProgressStars } from './components/ProgressStars';
import { QuestionCard } from './components/QuestionCard';
import { DateSelector } from './components/DateSelector';
import { ConstellationMap } from './components/ConstellationMap';
import { drawConstellationToCanvas } from './lib/constellation';
import { generateLoveBriefMarkdown, generateLoveBriefICS, downloadTextFile, downloadCalendarICS, isFutureDate, isDatePassed, isChosenDateToday, formatLockedDate, formatDateForDisplay, DEFAULT_CHOSEN_TIME } from './lib/utils';
import { getShortSweetNote } from './lib/loveMessage';
import { getWhisperForPlan, CLOSE_PHRASES } from './lib/whisperPrompts';
import { getAnticipationForPlan } from './lib/anticipationPrompts';
import { loadLockedPlan, saveLockedPlan, clearLockedPlan, archiveCurrentPlan } from './lib/planStorage';
import { loadQuestProgress, saveQuestProgress, clearQuestProgress } from './lib/questProgress';
import { NightTicketLanding } from './components/NightTicketLanding';
import { CelebrationReveal } from './components/CelebrationReveal';
import { isQuietLetterAlternate, QuietLetterAlternate } from './prototype/reimagine/QuietLetterAlternate';

/**
 * Jennifer's UNIVERSTAR Date Quest — Vertical Slice
 * Warm, playful, deeply personal gift from husband to wife.
 * Built with love in the rounded sparkling spirit of modern Korean pop cartoon design.
 *
 * This version delivers the full emotional arc for early feedback:
 * - Beautiful landing (first visit + locked return)
 * - Four-question quest + full gorgeous DateSelector
 * - Triumphant Celebration with lock, confetti, persistence, and the real love message
 * - Return visits always show the happy locked state
 */

type AppMode = 'landing' | 'quest' | 'celebration';

interface AppState {
  mode: AppMode;
  currentStep: number; // 1-based
  answers: Partial<QuestAnswers>;
  lockedPlan: LockedPlan | null;
  showLoveMessage: boolean;
}

const DEFAULT_ANSWERS: Partial<QuestAnswers> = {
  vibe: undefined,
  foodFantasy: undefined,
  restaurantCuisine: undefined,
  restaurantNote: '',
  outingActivity: undefined,
  outingNote: '',
  chosenDate: undefined,
  chosenTime: DEFAULT_CHOSEN_TIME,
  secretHint: '',
};

function getInitialAppState(): AppState {
  const lockedPlan = loadLockedPlan();
  if (lockedPlan) {
    return {
      mode: 'landing',
      currentStep: 1,
      answers: DEFAULT_ANSWERS,
      lockedPlan,
      showLoveMessage: false,
    };
  }

  const progress = loadQuestProgress();
  if (progress && (progress.mode === 'quest' || progress.mode === 'celebration')) {
    return {
      mode: progress.mode,
      currentStep: progress.currentStep,
      answers: { ...DEFAULT_ANSWERS, ...progress.answers },
      lockedPlan: null,
      showLoveMessage: false,
    };
  }

  if (progress) {
    return {
      mode: 'landing',
      currentStep: progress.currentStep,
      answers: { ...DEFAULT_ANSWERS, ...progress.answers },
      lockedPlan: null,
      showLoveMessage: false,
    };
  }

  return {
    mode: 'landing',
    currentStep: 1,
    answers: DEFAULT_ANSWERS,
    lockedPlan: null,
    showLoveMessage: false,
  };
}

export default function App() {
  const [state, setState] = useState<AppState>(getInitialAppState);

  const { mode, currentStep, answers, lockedPlan, showLoveMessage } = state;

  const [showWhisper, setShowWhisper] = useState(false);
  const [currentWhisper, setCurrentWhisper] = useState('');
  const [debriefHighlight, setDebriefHighlight] = useState(() => loadLockedPlan()?.debriefHighlight ?? '');
  const [anticipationLine, setAnticipationLine] = useState('');
  const [showLockedMore, setShowLockedMore] = useState(false);
  const [showCelebrationMore, setShowCelebrationMore] = useState(false);
  const whisperOpenerRef = useRef<HTMLButtonElement>(null);
  const whisperCloseRef = useRef<HTMLButtonElement>(null);
  const whisperTitleId = 'whisper-dialog-title';

  // Persist quest progress (answers + step) so reload picks up where she left off
  useEffect(() => {
    if (lockedPlan) return;
    if (mode === 'quest' || mode === 'celebration') {
      saveQuestProgress({ mode, currentStep, answers });
      return;
    }
    if (Object.values(answers).some((value) => value !== undefined && value !== '')) {
      saveQuestProgress({ mode, currentStep, answers });
    }
  }, [answers, currentStep, lockedPlan, mode]);

  useEffect(() => {
    setDebriefHighlight(lockedPlan?.debriefHighlight ?? '');
    setShowLockedMore(false);
  }, [lockedPlan?.chosenDate, lockedPlan?.debriefHighlight]);

  useEffect(() => {
    if (lockedPlan && isFutureDate(lockedPlan.chosenDate)) {
      const { daysUntil } = formatDateForDisplay(lockedPlan.chosenDate);
      setAnticipationLine(getAnticipationForPlan(lockedPlan, daysUntil));
    }
  }, [lockedPlan?.chosenDate, lockedPlan?.vibe, lockedPlan?.foodFantasy]);

  // ==================== NAVIGATION ====================
  const goToStep = (step: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_QUESTIONS, step));
    setState((s) => ({ ...s, currentStep: clamped, mode: 'quest' }));
  };

  const next = () => {
    if (currentStep < TOTAL_QUESTIONS) {
      goToStep(currentStep + 1);
    } else if (isQuestComplete(answers)) {
      setState((s) => ({ ...s, mode: 'celebration', showLoveMessage: false }));
    } else {
      toast.error('Almost there — answer the highlighted questions so I can finish the plan.');
    }
  };

  const back = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    } else {
      // Back to landing from first question
      setState((s) => ({ ...s, mode: 'landing' }));
    }
  };

  const startQuest = () => {
    const progress = loadQuestProgress();
    if (progress) {
      setState((s) => ({
        ...s,
        mode: 'quest',
        currentStep: progress.currentStep,
        answers: { ...DEFAULT_ANSWERS, ...progress.answers },
      }));
      return;
    }
    setState((s) => ({ ...s, mode: 'quest', currentStep: 1, answers: DEFAULT_ANSWERS }));
  };

  const goToLanding = () => {
    setState((s) => ({ ...s, mode: 'landing' }));
  };

  // ==================== ANSWER UPDATES ====================
  const updateAnswer = <K extends keyof QuestAnswers>(key: K, value: QuestAnswers[K]) => {
    setState((s) => {
      if (key !== 'vibe') {
        return {
          ...s,
          answers: { ...s.answers, [key]: value },
        };
      }

      const nextVibe = value as QuestAnswers['vibe'];
      const switchingToOuting = isOutingStepVibe(nextVibe);
      return {
        ...s,
        answers: {
          ...s.answers,
          vibe: nextVibe,
          // Clear the other step-2 track when vibe flips food ↔ outing
          ...(switchingToOuting
            ? {
                restaurantCuisine: undefined,
                restaurantNote: '',
                foodFantasy: deriveOutingFoodFantasy(
                  s.answers.outingActivity,
                  s.answers.outingNote,
                ),
              }
            : {
                outingActivity: undefined,
                outingNote: '',
                foodFantasy: deriveFoodFantasy(
                  s.answers.restaurantCuisine,
                  s.answers.restaurantNote,
                ),
              }),
        },
      };
    });
  };

  const selectCuisine = (value: string) => {
    setState((s) => {
      const restaurantCuisine =
        s.answers.restaurantCuisine === value ? undefined : value;
      return {
        ...s,
        answers: {
          ...s.answers,
          restaurantCuisine,
          foodFantasy: deriveFoodFantasy(restaurantCuisine, s.answers.restaurantNote),
        },
      };
    });
  };

  const updateRestaurantNote = (restaurantNote: string) => {
    setState((s) => ({
      ...s,
      answers: {
        ...s.answers,
        restaurantNote,
        foodFantasy: deriveFoodFantasy(s.answers.restaurantCuisine, restaurantNote),
      },
    }));
  };

  const selectOuting = (value: string) => {
    setState((s) => {
      const outingActivity =
        s.answers.outingActivity === value ? undefined : value;
      return {
        ...s,
        answers: {
          ...s.answers,
          outingActivity,
          foodFantasy: deriveOutingFoodFantasy(outingActivity, s.answers.outingNote),
        },
      };
    });
  };

  const updateOutingNote = (outingNote: string) => {
    setState((s) => ({
      ...s,
      answers: {
        ...s.answers,
        outingNote,
        foodFantasy: deriveOutingFoodFantasy(s.answers.outingActivity, outingNote),
      },
    }));
  };

  const canProceed = (): boolean => {
    const q = getQuestion(currentStep);
    if (q.key === 'secretHint') return true; // optional
    if (currentStep === 2) {
      return isStep2Complete(answers);
    }
    if (currentStep === 3) {
      return Boolean(answers.chosenDate) && Boolean(answers.chosenTime);
    }
    return Boolean(answers[q.key as keyof QuestAnswers]);
  };

  const proceedHelper = (): string | null => {
    if (canProceed()) return null;
    if (currentStep === 2) {
      return isOutingStepVibe(answers.vibe)
        ? 'Pick an activity or type a plan to continue'
        : 'Pick a cuisine or type a craving to continue';
    }
    if (currentStep === 3) {
      return 'Pick a date and time to continue';
    }
    return 'Pick an option to continue';
  };

  // ==================== THE BIG MOMENT — LOCK THE DATE ====================
  const lockDateInHeart = () => {
    // Final validation
    const required: (keyof QuestAnswers)[] = ['vibe', 'foodFantasy', 'chosenDate', 'chosenTime'];
    const missing = required.filter((k) => !answers[k]);
    if (missing.length > 0) {
      toast.error("Almost there — please answer the highlighted questions so we can lock this properly.");
      return;
    }
    if (!answers.chosenDate || !isFutureDate(answers.chosenDate)) {
      toast.error("Please choose a future date for our evening.");
      return;
    }
    if (!isStep2Complete(answers)) {
      toast.error(
        isOutingStepVibe(answers.vibe)
          ? 'Almost there — pick an activity or type a plan before we continue.'
          : 'Almost there — pick a cuisine or type a craving before we continue.',
      );
      return;
    }

    const fullPlan: LockedPlan = {
      ...(answers as QuestAnswers),
      lockedAt: new Date().toISOString(),
    };

    // Save forever (the moment that makes it real)
    saveLockedPlan(fullPlan);

    // SPECTACULAR BUT TASTEFUL CONFETTI — exact brand colors + hearts/stars
    const colors = ['#f0a35e', '#f7f0e4', '#2a5550', '#1e3a3a'];
    confetti({
      particleCount: 180,
      spread: 80,
      origin: { y: 0.6 },
      colors,
    });
    setTimeout(() => {
      confetti({
        particleCount: 120,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.7 },
        colors,
      });
    }, 180);
    setTimeout(() => {
      confetti({
        particleCount: 120,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.7 },
        colors,
      });
    }, 280);

    clearQuestProgress();

    // Reveal the real message + switch to locked celebration view
    setDebriefHighlight('');
    setShowCelebrationMore(false);
    setState((s) => ({
      ...s,
      lockedPlan: fullPlan,
      mode: 'celebration',
      showLoveMessage: true,
    }));

    toast.success("Locked in. See you that night.", {
      duration: 4200,
    });
  };

  const tweakPlan = () => {
    // Return to quest pre-filled with current (or locked) answers — the most loving UX
    const base = lockedPlan || (answers as QuestAnswers);
    setState({
      mode: 'quest',
      currentStep: 1,
      answers: { ...DEFAULT_ANSWERS, ...base },
      lockedPlan: null,
      showLoveMessage: false,
    });
    clearLockedPlan();
  };

  /** From celebration: jump to a specific quest step to change that answer. */
  const editStep = (step: number) => {
    const base = lockedPlan || answers;
    if (lockedPlan) clearLockedPlan();
    setShowCelebrationMore(false);
    setState({
      mode: 'quest',
      currentStep: Math.max(1, Math.min(TOTAL_QUESTIONS, step)),
      answers: { ...DEFAULT_ANSWERS, ...base },
      lockedPlan: null,
      showLoveMessage: false,
    });
  };

  const clearEverything = () => {
    if (!confirm('Are you sure you want to clear our beautiful plan? We can always start again.')) return;
    clearLockedPlan();
    clearQuestProgress();
    setDebriefHighlight('');
    setState({
      mode: 'landing',
      currentStep: 1,
      answers: DEFAULT_ANSWERS,
      lockedPlan: null,
      showLoveMessage: false,
    });
    toast('Cleared. Start fresh whenever you want.');
  };

  const copySweetNote = () => {
    if (!lockedPlan) return;
    const note = getShortSweetNote(lockedPlan);
    navigator.clipboard.writeText(note).then(() => {
      toast.success('Sweet note copied — paste it into your calendar or a card.');
    });
  };

  // Beautiful zero-dependency keepsake card PNG — now featuring her real constellation
  const downloadKeepsake = () => {
    if (!lockedPlan) return;

    const w = 880;
    const h = 660;
    const dpr = 2; // crisp on retina + good for printing
    const canvas = document.createElement('canvas');
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    ctx.scale(dpr, dpr);

    // Dusk ticket background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2a5550');
    grad.addColorStop(0.45, '#1e3a3a');
    grad.addColorStop(1, '#0f1f1f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Cream ticket panel
    ctx.fillStyle = '#f7f0e4';
    ctx.beginPath();
    ctx.roundRect(40, 40, w - 80, h - 80, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(240,163,94,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 40, w - 80, h - 80, 4);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#f0a35e';
    ctx.font = '600 20px "Barlow Condensed", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE MAP OF THE NIGHT WE CHOSE', w / 2, 96);

    // Big date
    ctx.fillStyle = '#0f1f1f';
    ctx.font = '700 36px "Barlow Condensed", system-ui, sans-serif';
    ctx.fillText(formatLockedDate(lockedPlan.chosenDate, lockedPlan.chosenTime), w / 2, 146);

    // Her constellation — same seed and sky as the on-screen map
    drawConstellationToCanvas(ctx, lockedPlan, 110, 176, w - 220, 296);

    // Vibe + food line
    ctx.fillStyle = '#0f1f1f';
    ctx.font = '500 20px Figtree, system-ui, sans-serif';
    ctx.fillText(
      `${getVibeCategoryLabel(lockedPlan.vibe)} · ${
        isOutingStepVibe(lockedPlan.vibe)
          ? formatOutingAnswer(lockedPlan)
          : formatFoodAnswer(lockedPlan)
      }`,
      w / 2,
      520,
    );

    // Bottom love line
    ctx.fillStyle = '#f0a35e';
    ctx.font = '700 18px "Barlow Condensed", system-ui, sans-serif';
    ctx.fillText('LOCKED IN — OUR NIGHT', w / 2, 560);

    // Decorative stars
    ctx.fillStyle = '#f0a35e';
    ctx.font = '26px system-ui';
    ctx.fillText('✧', 110, 120);
    ctx.fillText('✧', w - 120, 120);
    ctx.fillText('✧', 128, h - 84);
    ctx.fillText('✧', w - 138, h - 84);

    // Trigger download
    const link = document.createElement('a');
    link.download = `our-constellation-${lockedPlan.chosenDate}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast.success('Your constellation keepsake is saved — print it, frame it, or hide it somewhere only she will find.');
  };

  // Feature 4: "Whisper this to me tonight" — opens a private modal with one of the husband-seeded lines
  const openWhisper = () => {
    if (!lockedPlan) return;
    const whisper = getWhisperForPlan(lockedPlan);
    setCurrentWhisper(whisper);
    setShowWhisper(true);
  };

  const closeWhisper = () => {
    setShowWhisper(false);
    requestAnimationFrame(() => {
      whisperOpenerRef.current?.focus();
    });
  };

  // Simple keyboard escape for the whisper modal
  useEffect(() => {
    if (!showWhisper) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowWhisper(false);
        requestAnimationFrame(() => whisperOpenerRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showWhisper]);

  useEffect(() => {
    if (showWhisper) {
      whisperCloseRef.current?.focus();
    }
  }, [showWhisper]);

  // ==================== FEATURE 2: LOVE BRIEF (husband-only, invisible to Jennifer) ====================
  const badgeRef = useRef<HTMLDivElement>(null);
  const isHusbandDev = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('husband');

  const triggerLoveBrief = (plan: LockedPlan) => {
    const dateStr = plan.chosenDate;
    const md = generateLoveBriefMarkdown(plan);
    const ics = generateLoveBriefICS(plan);

    // .txt (the main cheat sheet)
    downloadTextFile(`Love-Brief-${dateStr}.txt`, md);

    // .ics calendar file (rich description contains the full brief)
    const icsBlob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const icsUrl = URL.createObjectURL(icsBlob);
    const icsLink = document.createElement('a');
    icsLink.href = icsUrl;
    icsLink.download = `Our-Evening-${dateStr}.ics`;
    document.body.appendChild(icsLink);
    icsLink.click();
    document.body.removeChild(icsLink);
    URL.revokeObjectURL(icsUrl);

    // Very quiet confirmation (or completely silent — spec allows either)
    // We use a short sonner toast that only the husband will notice.
    toast('Love Brief downloaded for you, my love.', { duration: 1600 });

    // Optional future: styled PNG brief card (would reuse extracted canvas helper)
  };

  // Long-press (700-800ms) on the existing "OUR LITTLE UNIVERSE" badge
  // Only attaches when a date is locked. Zero visual change for Jennifer.
  useEffect(() => {
    const el = badgeRef.current;
    if (!el || !lockedPlan) return;

    let timer: number | null = null;

    const onDown = () => {
      timer = window.setTimeout(() => {
        triggerLoveBrief(lockedPlan);
      }, 750);
    };
    const onUp = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      if (timer) clearTimeout(timer);
    };
  }, [lockedPlan]);

  // Dev escape hatch for testing the long-press without actually holding (non-shipped)
  const devTriggerBrief = () => {
    if (lockedPlan) triggerLoveBrief(lockedPlan);
  };

  const saveDebrief = (highlight: string) => {
    if (!lockedPlan) return;
    const trimmed = highlight.trim();
    const updated: LockedPlan = {
      ...lockedPlan,
      debriefHighlight: trimmed || undefined,
      debriefedAt: trimmed ? new Date().toISOString() : undefined,
    };
    saveLockedPlan(updated);
    setState((s) => ({ ...s, lockedPlan: updated }));
  };

  const planAnother = () => {
    if (!lockedPlan) return;
    if (!confirm('Start planning our next date? This one moves to your history.')) return;
    archiveCurrentPlan(lockedPlan);
    clearLockedPlan();
    clearQuestProgress();
    setDebriefHighlight('');
    setState({
      mode: 'quest',
      currentStep: 1,
      answers: DEFAULT_ANSWERS,
      lockedPlan: null,
      showLoveMessage: false,
    });
    toast('Your last date is saved. Tell me what you want for the next one.');
  };

  const addToCalendar = () => {
    if (!lockedPlan) return;
    downloadCalendarICS(lockedPlan);
    toast.success('Calendar file downloaded — open it to add the date.');
  };

  const copyAnticipation = () => {
    navigator.clipboard.writeText(anticipationLine).then(() => {
      toast.success('Copied — send it back if you want.');
    });
  };

  const refreshAnticipation = () => {
    if (!lockedPlan) return;
    const { daysUntil } = formatDateForDisplay(lockedPlan.chosenDate);
    setAnticipationLine(getAnticipationForPlan(lockedPlan, daysUntil));
  };

  // Persist debrief back into LockedPlan on blur

  // ==================== RENDER ====================
  const currentQuestion = getQuestion(currentStep);
  const step2Copy = currentStep === 2 ? getStep2Copy(answers.vibe) : null;
  const questPrompt = step2Copy?.prompt ?? currentQuestion.prompt;
  const questHint = step2Copy?.hint ?? currentQuestion.hint;
  const questComplete = isQuestComplete(answers);
  const nextHelper = proceedHelper();
  const isFirstVisitLanding = mode === 'landing' && !lockedPlan;

  // Reserved alternate: ?variant=B shows Quiet Letter (not shipped)
  const variantParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('variant')
      : null;
  const showQuietLetterAlternate =
    import.meta.env.DEV &&
    isQuietLetterAlternate(variantParam) &&
    isFirstVisitLanding;

  const startFromAlternate = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('variant');
    window.history.replaceState({}, '', url.toString());
    startQuest();
  };

  if (showQuietLetterAlternate) {
    return (
      <>
        <Toaster position="top-center" richColors closeButton />
        <QuietLetterAlternate onStart={startFromAlternate} />
      </>
    );
  }

  return (
    <div className={`min-h-screen text-night-cream ${isFirstVisitLanding ? '' : 'pb-20'}`}>
      <Toaster position="top-center" richColors closeButton />

      {/* Universe badge — hidden on night-ticket landing (brand lives on the ticket) */}
      {!isFirstVisitLanding && (
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 pointer-events-none">
        <div
          ref={badgeRef}
          className="universe-badge pointer-events-auto"
        >
          OUR LITTLE UNIVERSE
          {/* Dev-only escape hatch — completely invisible in normal use and in the final artifact for Jennifer */}
          {isHusbandDev && lockedPlan && (
            <button
              onClick={devTriggerBrief}
              className="ml-2 text-[10px] text-night-amber/80 hover:text-night-amber underline"
              title="Dev: trigger Love Brief without long-press"
            >
              💌
            </button>
          )}
        </div>
      </div>
      )}

      {/* ==================== LANDING ==================== */}
      {mode === 'landing' && lockedPlan && (
        <div className="pt-16 sm:pt-20 px-6 max-w-3xl mx-auto text-center">
            <div className="space-y-6 pt-6">
              <div className="flex justify-center">
                <CoupleCartoon size={200} />
              </div>

              <div>
                <div className="uppercase tracking-[3px] text-xs text-night-amber mb-2">
                  {isDatePassed(lockedPlan.chosenDate)
                    ? 'THAT NIGHT'
                    : isChosenDateToday(lockedPlan.chosenDate)
                      ? 'TONIGHT'
                      : 'COMING UP'}
                </div>
                <h1 className="text-4xl sm:text-5xl leading-none">
                  {isDatePassed(lockedPlan.chosenDate) ? 'We Did It' : 'I Planned Our Night'}
                </h1>
                <p className="mt-3 text-xl text-night-cream/80">
                  {isDatePassed(lockedPlan.chosenDate)
                    ? formatLockedDate(lockedPlan.chosenDate, lockedPlan.chosenTime)
                    : isChosenDateToday(lockedPlan.chosenDate)
                      ? "Tonight's the night."
                      : `${formatDateForDisplay(lockedPlan.chosenDate).daysUntil} day${formatDateForDisplay(lockedPlan.chosenDate).daysUntil === 1 ? '' : 's'} to go.`}
                </p>
              </div>

              <div className="max-w-lg mx-auto w-full">
                <div className="sticker-card p-4 sm:p-6 min-h-[220px] sm:min-h-[260px]">
                  <ConstellationMap plan={lockedPlan} />
                </div>
                <p className="text-xs text-night-cream/65 mt-2">
                  {formatLockedDate(lockedPlan.chosenDate, lockedPlan.chosenTime)} · {getVibeCategoryLabel(lockedPlan.vibe)} ·{' '}
                  {isOutingStepVibe(lockedPlan.vibe)
                    ? formatOutingAnswer(lockedPlan)
                    : formatFoodAnswer(lockedPlan)}
                </p>
              </div>

              {isFutureDate(lockedPlan.chosenDate) && anticipationLine && (
                <div className="max-w-md mx-auto space-y-2">
                  <div className="text-xs tracking-widest text-night-amber uppercase">From me, before the date</div>
                  <blockquote className="anticipation-quote text-[15px] leading-relaxed text-night-cream/90">
                    {anticipationLine}
                  </blockquote>
                  <div className="flex justify-center gap-4 text-sm">
                    <button
                      type="button"
                      onClick={copyAnticipation}
                      className="underline text-night-cream/65 hover:text-night-amber"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={refreshAnticipation}
                      className="underline text-night-cream/65 hover:text-night-amber"
                    >
                      Another one
                    </button>
                  </div>
                </div>
              )}

              {isDatePassed(lockedPlan.chosenDate) && (
                <div className="max-w-md mx-auto text-left">
                  <div className="text-xs tracking-widest text-night-amber uppercase mb-2">How&apos;d it go?</div>
                  <textarea
                    value={debriefHighlight}
                    onChange={(e) => setDebriefHighlight(e.target.value)}
                    onBlur={() => saveDebrief(debriefHighlight)}
                    placeholder="One line — what was the highlight?"
                    className="w-full min-h-[68px] rounded border-2 border-night-deep/15 bg-night-cream p-4 text-sm text-night-deep focus:outline-none focus:border-night-amber placeholder:text-night-deep/40"
                  />
                </div>
              )}

              <div className="flex flex-col items-center gap-3 pt-2">
                {isFutureDate(lockedPlan.chosenDate) && (
                  <button type="button" onClick={addToCalendar} className="pill-button primary">
                    Add to calendar
                  </button>
                )}
                {isDatePassed(lockedPlan.chosenDate) && (
                  <button type="button" onClick={planAnother} className="pill-button primary">
                    Plan our next date
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowLockedMore((open) => !open)}
                  aria-expanded={showLockedMore}
                  className="text-sm text-night-cream/65 hover:text-night-amber underline"
                >
                  {showLockedMore ? 'Fewer options' : 'More options'}
                </button>
                {showLockedMore && (
                  <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                    <button type="button" onClick={tweakPlan} className="pill-button secondary text-sm w-full">
                      Ask me to change something
                    </button>
                    <button
                      type="button"
                      onClick={clearEverything}
                      className="text-sm text-night-cream/65 hover:text-night-amber underline"
                    >
                      Clear everything
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>
      )}

      {mode === 'landing' && !lockedPlan && (
        <NightTicketLanding onStart={startQuest} />
      )}

      {/* ==================== THE QUEST WIZARD ==================== */}
      {mode === 'quest' && (
        <div className="quest-stage">
          <button type="button" onClick={goToLanding} className="quest-stage__back">
            ← Beginning
          </button>

          <ProgressStars
            currentStep={currentStep}
            onJump={goToStep}
            canJumpToStep={(step) => canJumpToStep(step, answers)}
          />

          <QuestionCard
            step={currentStep}
            total={TOTAL_QUESTIONS}
            prompt={questPrompt}
            hint={questHint}
            onBack={back}
            onNext={next}
            nextLabel={currentStep === TOTAL_QUESTIONS ? 'See the plan →' : 'Tear & continue →'}
            nextDisabled={!canProceed() || (currentStep === TOTAL_QUESTIONS && !isQuestComplete(answers))}
            helper={nextHelper}
          >
            {currentStep === 1 && (
              <div className="ticket-stub-grid">
                {currentQuestion.options?.map((opt) => {
                  const selected = answers.vibe === opt.value;
                  const codes: Record<string, string> = {
                    'stay-in': 'Stay',
                    'go-out': 'Out',
                    'new-thing': 'New',
                    'easy-mode': 'Easy',
                  };
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateAnswer('vibe', opt.value as QuestAnswers['vibe'])}
                      aria-pressed={selected}
                      className={`ticket-stub ${selected ? 'selected' : ''}`}
                    >
                      <span className="ticket-stub__code">{codes[opt.value] ?? 'Vibe'}</span>
                      <span className="ticket-stub__label">{opt.label}</span>
                      <span className="ticket-stub__desc">{opt.description}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep === 2 && step2Copy?.mode === 'outing' && (
              <div className="space-y-5">
                <div
                  className="ticket-stamp-row"
                  role="group"
                  aria-label="Outing activity"
                >
                  {OUTING_ACTIVITY_OPTIONS.map((opt) => {
                    const selected = answers.outingActivity === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => selectOuting(opt.value)}
                        aria-pressed={selected}
                        className={`ticket-stamp ${selected ? 'selected' : ''}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="ticket-section-label" htmlFor="outing-note">
                    {step2Copy.noteLabel}
                  </label>
                  <input
                    id="outing-note"
                    type="text"
                    value={answers.outingNote || ''}
                    onChange={(e) => updateOutingNote(e.target.value)}
                    placeholder="A place, activity, or vibe for the night…"
                    className="ticket-field"
                  />
                  <p className="ticket-note">{step2Copy.noteHelper}</p>
                </div>
              </div>
            )}

            {currentStep === 2 && step2Copy?.mode !== 'outing' && (
              <div className="space-y-5">
                <div
                  className="ticket-stamp-row"
                  role="group"
                  aria-label="Cuisine"
                >
                  {RESTAURANT_CUISINE_OPTIONS.map((opt) => {
                    const selected = answers.restaurantCuisine === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => selectCuisine(opt.value)}
                        aria-pressed={selected}
                        className={`ticket-stamp ${selected ? 'selected' : ''}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="ticket-section-label" htmlFor="restaurant-note">
                    {step2Copy?.noteLabel ?? 'Or write a craving'}
                  </label>
                  <input
                    id="restaurant-note"
                    type="text"
                    value={answers.restaurantNote || ''}
                    onChange={(e) => updateRestaurantNote(e.target.value)}
                    placeholder="A specific spot, dish, or craving…"
                    className="ticket-field"
                  />
                  <p className="ticket-note">
                    {step2Copy?.noteHelper ?? 'Pick a cuisine, type something, or both.'}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <DateSelector
                value={answers.chosenDate || ''}
                time={answers.chosenTime || DEFAULT_CHOSEN_TIME}
                onChange={(d) => updateAnswer('chosenDate', d)}
                onTimeChange={(t) => updateAnswer('chosenTime', t)}
              />
            )}

            {currentStep === 4 && (
              <div>
                <label className="ticket-section-label" htmlFor="secret-hint">
                  Optional note
                </label>
                <textarea
                  id="secret-hint"
                  value={answers.secretHint || ''}
                  onChange={(e) => updateAnswer('secretHint', e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="ticket-field min-h-[140px] resize-y"
                />
                <p className="ticket-note">Optional — I read all of it.</p>
              </div>
            )}
          </QuestionCard>
        </div>
      )}

      {/* ==================== THE GRAND REVEAL — CELEBRATION ==================== */}
      {mode === 'celebration' && questComplete && (
        <CelebrationReveal
          answers={answers as QuestAnswers}
          lockedPlan={lockedPlan}
          showLoveMessage={showLoveMessage}
          showCelebrationMore={showCelebrationMore}
          onLock={lockDateInHeart}
          onCopyNote={copySweetNote}
          onAddToCalendar={addToCalendar}
          onToggleMore={() => setShowCelebrationMore((open) => !open)}
          onDownloadKeepsake={downloadKeepsake}
          onOpenWhisper={openWhisper}
          onTweak={tweakPlan}
          onEditStep={editStep}
          onClear={clearEverything}
          whisperOpenerRef={whisperOpenerRef}
        />
      )}

      {mode === 'celebration' && !questComplete && (
        <div className="quest-stage !max-w-xl">
          <div className="celeb-ticket mb-8 p-8 text-center">
            <p className="quest-ticket__hint !mt-0">
              A few questions still need answers before I can finish the plan.
            </p>
            <button type="button" onClick={() => goToStep(1)} className="pill-button secondary mt-4">
              Back to the quest
            </button>
          </div>
        </div>
      )}

      {/* Footer love note — tiny, always present (skipped on night-ticket landing) */}
      {!isFirstVisitLanding && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 app-footer-mark">
          MADE FOR YOU
        </div>
      )}

      {/* Feature 4: Whisper modal */}
      <AnimatePresence>
        {showWhisper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-night-deep/70 px-4"
            onClick={closeWhisper}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={whisperTitleId}
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticker-card p-8 sm:p-9 text-center">
                <h2 id={whisperTitleId} className="sr-only">
                  Something to say tonight
                </h2>
                <div
                  className="text-[15.5px] leading-relaxed text-night-deep/90"
                  role="status"
                  aria-live="polite"
                >
                  {currentWhisper}
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!lockedPlan) return;
                      setCurrentWhisper(getWhisperForPlan(lockedPlan));
                    }}
                    className="text-sm text-night-deep/70 hover:text-night-amber underline transition"
                  >
                    Another one
                  </button>
                  <button
                    ref={whisperCloseRef}
                    type="button"
                    onClick={closeWhisper}
                    className="pill-button secondary text-sm mt-1"
                  >
                    {CLOSE_PHRASES[0]}
                  </button>
                  {lockedPlan && (
                    <div className="mt-4">
                      <CoupleCartoon size={96} alt="Us" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

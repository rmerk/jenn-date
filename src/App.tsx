import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';

import { CoupleCartoon } from './components/CoupleCartoon';
import type { QuestAnswers, LockedPlan } from './lib/types';
import { TOTAL_QUESTIONS, getQuestion, isQuestComplete, canJumpToStep, getFoodVibeHint, getVibeCategoryLabel, getFoodCategoryLabel, getFeelingWordLabel, RESTAURANT_CUISINE_OPTIONS, isRestaurantFollowUpComplete, formatRestaurantDetail } from './lib/questions';
import { ProgressStars } from './components/ProgressStars';
import { QuestionCard } from './components/QuestionCard';
import { DateSelector } from './components/DateSelector';
import { ConstellationMap } from './components/ConstellationMap';
import { drawConstellationToCanvas } from './lib/constellation';
import { generateSummary, getConstellationIdeas, isFutureDate, isDatePassed, isChosenDateToday, formatLockedDate, formatDateForDisplay, generateLoveBriefMarkdown, generateLoveBriefICS, downloadTextFile, downloadCalendarICS } from './lib/utils';
import { getPersonalizedLoveMessage, getShortSweetNote } from './lib/loveMessage';
import { getWhisperForPlan, CLOSE_PHRASES } from './lib/whisperPrompts';
import { getAnticipationForPlan } from './lib/anticipationPrompts';
import { loadLockedPlan, saveLockedPlan, clearLockedPlan, archiveCurrentPlan } from './lib/planStorage';
import { loadQuestProgress, saveQuestProgress, clearQuestProgress } from './lib/questProgress';

/**
 * Jennifer's UNIVERSTAR Date Quest — Vertical Slice
 * Warm, playful, deeply personal gift from husband to wife.
 * Built with love in the rounded sparkling spirit of modern Korean pop cartoon design.
 *
 * This version delivers the full emotional arc for early feedback:
 * - Beautiful landing (first visit + locked return)
 * - Five-question quest + full gorgeous DateSelector
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
  chosenDate: undefined,
  feelingWord: undefined,
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
      toast.error('Almost there — answer the highlighted questions so we can show your summary.');
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
    setState((s) => ({
      ...s,
      answers: { ...s.answers, [key]: value },
    }));
  };

  const selectFoodFantasy = (value: QuestAnswers['foodFantasy']) => {
    setState((s) => ({
      ...s,
      answers: {
        ...s.answers,
        foodFantasy: value,
        ...(value === 'restaurant'
          ? {}
          : { restaurantCuisine: undefined, restaurantNote: '' }),
      },
    }));
  };

  const canProceed = (): boolean => {
    const q = getQuestion(currentStep);
    if (q.key === 'secretHint') return true; // optional
    if (currentStep === 2) {
      if (!answers.foodFantasy) return false;
      if (answers.foodFantasy === 'restaurant') {
        return isRestaurantFollowUpComplete(answers);
      }
      return true;
    }
    return Boolean(answers[q.key as keyof QuestAnswers]);
  };

  // ==================== THE BIG MOMENT — LOCK THE DATE ====================
  const lockDateInHeart = () => {
    // Final validation
    const required: (keyof QuestAnswers)[] = ['vibe', 'foodFantasy', 'chosenDate', 'feelingWord'];
    const missing = required.filter((k) => !answers[k]);
    if (missing.length > 0) {
      toast.error("Almost there — please answer the highlighted questions so we can lock this properly.");
      return;
    }
    if (!answers.chosenDate || !isFutureDate(answers.chosenDate)) {
      toast.error("Please choose a future date for our evening.");
      return;
    }
    if (answers.foodFantasy === 'restaurant' && !isRestaurantFollowUpComplete(answers)) {
      toast.error("Almost there — pick a cuisine style or type a spot before we continue.");
      return;
    }

    const fullPlan: LockedPlan = {
      ...(answers as QuestAnswers),
      lockedAt: new Date().toISOString(),
    };

    // Save forever (the moment that makes it real)
    saveLockedPlan(fullPlan);

    // SPECTACULAR BUT TASTEFUL CONFETTI — exact brand colors + hearts/stars
    const colors = ['#FF2D95', '#00D4FF', '#FFE600', '#9D4EDD'];
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

    // Creamy background with soft vignette
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#FFF8F0');
    grad.addColorStop(1, '#F0F9FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Rounded sticker border + inner highlight
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.roundRect(30, 30, w - 60, h - 60, 48);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(44, 44, w - 88, h - 88, 36);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#9D4EDD';
    ctx.font = '600 22px Poppins, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE MAP OF THE NIGHT WE CHOSE', w / 2, 96);

    // Big date
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 36px Poppins, system-ui, sans-serif';
    ctx.fillText(formatLockedDate(lockedPlan.chosenDate), w / 2, 146);

    // Her constellation — same seed and sky as the on-screen map
    drawConstellationToCanvas(ctx, lockedPlan, 110, 176, w - 220, 296);

    // Feeling line
    ctx.fillStyle = '#1E2937';
    ctx.font = '500 20px Inter, system-ui, sans-serif';
    ctx.fillText(`You want to feel ${lockedPlan.feelingWord} — and you will.`, w / 2, 520);

    // Bottom love line
    ctx.fillStyle = '#FF2D95';
    ctx.font = '600 17px Poppins, system-ui, sans-serif';
    ctx.fillText('Locked in — our night', w / 2, 560);

    // Decorative stars
    ctx.fillStyle = '#FFE600';
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

  // Simple keyboard escape for the whisper modal (focus management is minimal but sufficient)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showWhisper) {
        setShowWhisper(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
    if (!confirm('Start planning the next date? This one moves to your history.')) return;
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
    toast('Your last date is saved. Pick the next one.');
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
  const questComplete = isQuestComplete(answers);

  return (
    <div className="min-h-screen pb-20 text-deep-navy">
      <Toaster position="top-center" richColors closeButton />

      {/* Gentle top navigation hint */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 pointer-events-none">
        <div
          ref={badgeRef}
          className="pointer-events-auto rounded-full bg-white/70 backdrop-blur px-4 py-1 text-xs tracking-widest text-deep-navy/60 shadow-sm"
        >
          OUR LITTLE UNIVERSE
          {/* Dev-only escape hatch — completely invisible in normal use and in the final artifact for Jennifer */}
          {isHusbandDev && lockedPlan && (
            <button
              onClick={devTriggerBrief}
              className="ml-2 text-[10px] text-romantic-pink/70 hover:text-romantic-pink underline"
              title="Dev: trigger Love Brief without long-press"
            >
              💌
            </button>
          )}
        </div>
      </div>

      {/* ==================== LANDING ==================== */}
      {mode === 'landing' && (
        <div className="pt-16 sm:pt-20 px-6 max-w-3xl mx-auto text-center">
          {lockedPlan ? (
            <div className="space-y-8 pt-8">
              <div className="flex justify-center">
                <CoupleCartoon size={320} />
              </div>

              <div>
                <div className="uppercase tracking-[3px] text-xs text-romantic-pink mb-2">
                  {isDatePassed(lockedPlan.chosenDate)
                    ? 'THAT NIGHT'
                    : isChosenDateToday(lockedPlan.chosenDate)
                      ? 'TONIGHT'
                      : 'COMING UP'}
                </div>
                <h1 className="text-4xl sm:text-5xl leading-none">
                  {isDatePassed(lockedPlan.chosenDate) ? 'We Did It' : 'Our Date Is Set'}
                </h1>
                <p className="mt-4 text-xl text-deep-purple/90">
                  {isDatePassed(lockedPlan.chosenDate)
                    ? formatLockedDate(lockedPlan.chosenDate)
                    : isChosenDateToday(lockedPlan.chosenDate)
                      ? "Tonight's the night."
                      : `${formatDateForDisplay(lockedPlan.chosenDate).daysUntil} day${formatDateForDisplay(lockedPlan.chosenDate).daysUntil === 1 ? '' : 's'} to go.`}
                </p>
              </div>

              <div className="sticker-card inline-block px-8 py-6 text-left max-w-md">
                <div className="text-sm text-deep-purple/70 mb-1">THE PLAN</div>
                <div className="text-3xl font-semibold tracking-tight">{formatLockedDate(lockedPlan.chosenDate)}</div>
                <div className="mt-4 text-sm leading-relaxed text-charcoal/80 space-y-1">
                  <div>
                    Vibe: <span className="font-medium">{getVibeCategoryLabel(lockedPlan.vibe)}</span>.
                  </div>
                  <div>
                    Food: <span className="font-medium">{getFoodCategoryLabel(lockedPlan.foodFantasy)}</span>
                    {lockedPlan.foodFantasy === 'restaurant' && formatRestaurantDetail(lockedPlan) && (
                      <>
                        {' '}
                        — <span className="font-medium">{formatRestaurantDetail(lockedPlan)}</span>
                      </>
                    )}
                    .
                  </div>
                  <div>
                    You want to feel <span className="font-medium">{getFeelingWordLabel(lockedPlan.feelingWord)}</span>.
                  </div>
                </div>
              </div>

              <div className="max-w-md mx-auto">
                <div className="sticker-card p-3 sm:p-4">
                  <ConstellationMap plan={lockedPlan} />
                </div>
                <p className="text-xs text-charcoal/55 mt-2">Your answers, mapped ✧</p>
              </div>

              {isFutureDate(lockedPlan.chosenDate) && (
                <div className="max-w-md mx-auto text-left space-y-3">
                  <div className="text-xs tracking-widest text-romantic-pink uppercase">Before the date</div>
                  <div className="sticker-card p-5 text-[15px] leading-relaxed text-deep-navy/90">
                    {anticipationLine}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button onClick={copyAnticipation} className="pill-button secondary text-sm">
                      Copy this text
                    </button>
                    <button onClick={refreshAnticipation} className="text-sm underline text-charcoal/60 hover:text-romantic-pink">
                      Another one
                    </button>
                  </div>
                </div>
              )}

              {isDatePassed(lockedPlan.chosenDate) && (
                <div className="max-w-md mx-auto text-left">
                  <div className="text-xs tracking-widest text-romantic-pink uppercase mb-2">How&apos;d it go?</div>
                  <textarea
                    value={debriefHighlight}
                    onChange={(e) => setDebriefHighlight(e.target.value)}
                    onBlur={() => saveDebrief(debriefHighlight)}
                    placeholder="One line — what was the highlight?"
                    className="w-full min-h-[68px] rounded-3xl border-2 border-deep-purple/20 bg-white/70 p-4 text-sm focus:outline-none focus:border-romantic-pink placeholder:text-charcoal/40"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                {isFutureDate(lockedPlan.chosenDate) && (
                  <button onClick={addToCalendar} className="pill-button primary">
                    Add to calendar
                  </button>
                )}
                {isDatePassed(lockedPlan.chosenDate) && (
                  <button onClick={planAnother} className="pill-button primary">
                    Plan another date
                  </button>
                )}
                <button onClick={tweakPlan} className="pill-button secondary">
                  Change this plan
                </button>
                <button onClick={clearEverything} className="text-sm underline text-charcoal/60 hover:text-romantic-pink">
                  Clear everything
                </button>
              </div>
            </div>
          ) : (
            /* First Visit — Warm, generous, husband’s voice */
            <div className="pt-8 space-y-10">
              <div className="flex justify-center">
                <CoupleCartoon size={380} interactive />
              </div>

              <div className="max-w-xl mx-auto space-y-4">
                <div className="uppercase tracking-[4px] text-xs text-romantic-pink">A SMALL FAVOR</div>
                <h1 className="text-balance">Hey Jennifer</h1>
                <p className="text-xl leading-snug text-charcoal/90">
                  I made something for you. Five quick questions — one of them is picking the night —
                  and at the end I&apos;ll know what you actually want and we can lock it in.
                </p>
                <p className="text-sm text-deep-purple/70 pt-1">Takes about three minutes on your phone.</p>
              </div>

              <button
                onClick={startQuest}
                className="pill-button primary text-lg px-10 py-4 shadow-xl shadow-romantic-pink/30"
              >
                Help me plan our evening →
              </button>

              <div className="text-[10px] tracking-widest text-charcoal/50 pt-2">PICK YOUR NIGHT · TELL ME WHAT YOU WANT</div>
            </div>
          )}
        </div>
      )}

      {/* ==================== THE QUEST WIZARD ==================== */}
      {mode === 'quest' && (
        <div className="pt-12 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="mb-4 flex items-center justify-between text-xs tracking-widest text-deep-purple/60 px-1">
            <button onClick={goToLanding} className="hover:text-romantic-pink transition">← Back to the beginning</button>
            <div>OUR LITTLE UNIVERSE</div>
          </div>

          <ProgressStars
            currentStep={currentStep}
            onJump={goToStep}
            canJumpToStep={(step) => canJumpToStep(step, answers)}
          />

          <div className="mt-4">
            <QuestionCard
              step={currentStep}
              total={TOTAL_QUESTIONS}
              prompt={currentQuestion.prompt}
            >
              {currentStep === 1 && (
                <div className="grid gap-4 pt-2 sm:grid-cols-2">
                  {currentQuestion.options?.map((opt) => {
                    const selected = answers.vibe === opt.value;
                    const vibeEmoji: Record<string, string> = {
                      'stay-in': '🏠',
                      'go-out': '🌃',
                      'new-thing': '✨',
                      'easy-mode': '😌',
                    };
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateAnswer('vibe', opt.value as QuestAnswers['vibe'])}
                        className={`sticker-card p-5 text-left focus:outline-none transition-all ${selected ? 'selected ring-2 ring-electric-cyan' : ''}`}
                      >
                        <div className="text-3xl mb-3">{vibeEmoji[opt.value] ?? '🌙'}</div>
                        <div className="font-semibold text-lg">{opt.label}</div>
                        <div className="text-sm text-charcoal/70 mt-1 leading-snug">{opt.description}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStep === 2 && (
                <div className="pt-2 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentQuestion.options?.map((opt) => {
                      const selected = answers.foodFantasy === opt.value;
                      const vibeHint = getFoodVibeHint(answers.vibe, opt.value);
                      const foodEmoji: Record<string, string> = {
                        'home-cooked': '🏠',
                        restaurant: '🍽️',
                        takeout: '📦',
                        cafe: '☕',
                        casual: '🥡',
                        fancy: '✨',
                        surprise: '🎲',
                      };
                      return (
                        <button
                          key={opt.value}
                          onClick={() => selectFoodFantasy(opt.value as QuestAnswers['foodFantasy'])}
                          className={`sticker-card flex gap-4 p-4 text-left focus:outline-none ${selected ? 'selected' : ''}`}
                        >
                          <div className="text-4xl opacity-80 mt-0.5">{foodEmoji[opt.value] ?? '🍽️'}</div>
                          <div>
                            <div className="font-semibold">{opt.label}</div>
                            <div className="text-sm text-charcoal/70">{opt.description}</div>
                            {vibeHint && (
                              <div className="text-xs text-romantic-pink/80 mt-1">{vibeHint}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {answers.foodFantasy === 'restaurant' && (
                    <div className="sticker-card p-5 space-y-4">
                      <div className="font-semibold text-deep-navy">What kind of restaurant?</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {RESTAURANT_CUISINE_OPTIONS.map((opt) => {
                          const selected = answers.restaurantCuisine === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                updateAnswer(
                                  'restaurantCuisine',
                                  selected ? undefined : opt.value,
                                )
                              }
                              className={`choice-pill !min-h-0 !py-2 !px-5 text-sm ${selected ? 'selected' : ''}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        value={answers.restaurantNote || ''}
                        onChange={(e) => updateAnswer('restaurantNote', e.target.value)}
                        placeholder="A specific spot, dish, or craving…"
                        className="w-full rounded-2xl border-2 border-deep-purple/20 bg-white/70 px-5 py-3 text-base focus:outline-none focus:border-romantic-pink placeholder:text-charcoal/40"
                      />
                      <p className="text-center text-xs text-charcoal/50">
                        Pick a style, type something, or both.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <DateSelector
                  value={answers.chosenDate || ''}
                  onChange={(d) => updateAnswer('chosenDate', d)}
                />
              )}

              {currentStep === 4 && (
                <div className="flex flex-wrap gap-2 pt-2 justify-center">
                  {currentQuestion.options?.map((opt) => {
                    const selected = answers.feelingWord === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateAnswer('feelingWord', opt.value as QuestAnswers['feelingWord'])}
                        className={`choice-pill !min-h-0 !py-2 !px-5 text-sm ${selected ? 'selected' : ''}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStep === 5 && (
                <div className="pt-2">
                  <textarea
                    value={answers.secretHint || ''}
                    onChange={(e) => updateAnswer('secretHint', e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="w-full min-h-[140px] rounded-3xl border-2 border-deep-purple/20 bg-white/70 p-6 text-base focus:outline-none focus:border-romantic-pink placeholder:text-charcoal/40"
                  />
                  <p className="text-center text-xs text-charcoal/50 mt-3">Optional — I read all of it.</p>
                </div>
              )}
            </QuestionCard>
          </div>

          {/* Wizard controls — large, thumb-friendly, warm */}
          <div className="mt-8 flex items-center justify-between max-w-3xl mx-auto px-2">
            <button
              onClick={back}
              className="text-sm underline text-charcoal/70 hover:text-romantic-pink active:opacity-70"
            >
              ← Back
            </button>

            <button
              onClick={next}
              disabled={!canProceed() || (currentStep === TOTAL_QUESTIONS && !isQuestComplete(answers))}
              className={`pill-button primary disabled:opacity-40 disabled:cursor-not-allowed ${!canProceed() || (currentStep === TOTAL_QUESTIONS && !isQuestComplete(answers)) ? 'pointer-events-none' : ''}`}
            >
              {currentStep === TOTAL_QUESTIONS ? 'See the summary →' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== THE GRAND REVEAL — CELEBRATION ==================== */}
      {mode === 'celebration' && (
        <div className="pt-12 px-5 max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <div className="uppercase tracking-[3px] text-xs text-romantic-pink">ALL SET</div>
            <h1 className="mt-2 text-4xl sm:text-[42px] leading-none">Here&apos;s What We Picked</h1>
          </div>

          <div className="flex justify-center mb-8">
            <CoupleCartoon size={360} />
          </div>

          {/* The locked date — unmistakably special */}
          {answers.chosenDate && (
            <div className="inline-block sticker-card px-9 py-7 mb-8">
              <div className="text-xs tracking-[2px] text-deep-purple/70">OUR NIGHT</div>
              <div className="text-4xl sm:text-[42px] font-semibold tracking-[-1.2px] mt-1 text-deep-navy">
                {formatLockedDate(answers.chosenDate)}
              </div>
            </div>
          )}

          {/* The Map of the Night We Chose — her six answers turned into a private sky */}
          {questComplete && (
            <div className="max-w-lg mx-auto mb-8">
              <div className="uppercase text-xs tracking-widest text-romantic-pink mb-2">YOUR PICKS</div>
              <div className="sticker-card p-3 sm:p-4">
                <ConstellationMap plan={lockedPlan ?? (answers as QuestAnswers)} />
              </div>
              <p className="text-xs text-charcoal/55 mt-2">One dot per answer</p>
            </div>
          )}

          {!questComplete && (
            <div className="max-w-md mx-auto mb-10 space-y-4">
              <p className="text-charcoal/80">A few questions still need answers before we can lock this in.</p>
              <button onClick={() => goToStep(1)} className="pill-button secondary">
                Back to the quest
              </button>
            </div>
          )}

          {/* Lock action */}
          {questComplete && (
            <div className="max-w-md mx-auto text-left text-[15px] leading-relaxed text-charcoal/90 mb-8">
              {generateSummary(answers as QuestAnswers)}
            </div>
          )}

          {/* Constellation ideas — romantic & executable */}
          {questComplete && (
            <div className="max-w-lg mx-auto mb-10 text-left">
              <div className="uppercase text-xs tracking-widest text-romantic-pink mb-3">IDEAS FOR THE NIGHT</div>
              <ul className="space-y-3 text-[15px]">
                {getConstellationIdeas(answers as QuestAnswers).map((idea, i) => (
                  <li key={i} className="pl-1 flex gap-3">
                    <span className="text-sunny-yellow mt-1">✧</span>
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* The primary action — the emotional peak */}
          {!showLoveMessage && (
            <button
              onClick={lockDateInHeart}
              className="pill-button primary text-xl px-12 py-5 shadow-2xl shadow-romantic-pink/40"
            >
              Lock it in
            </button>
          )}

          {/* After locking — the real message + secondary actions */}
          <AnimatePresence>
            {showLoveMessage && lockedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 max-w-xl mx-auto"
              >
                <div
                  className="sticker-card p-8 sm:p-10 text-left whitespace-pre-wrap text-[15.2px] leading-relaxed"
                  role="status"
                  aria-live="polite"
                >
                  {getPersonalizedLoveMessage(lockedPlan)}
                </div>

                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  <button onClick={addToCalendar} className="pill-button secondary text-sm">
                    Add to calendar
                  </button>
                  <button onClick={copySweetNote} className="pill-button secondary text-sm">
                    Copy a short note
                  </button>
                  <button onClick={downloadKeepsake} className="pill-button secondary text-sm">
                    Save constellation image
                  </button>
                  <button onClick={openWhisper} className="pill-button secondary text-sm">
                    Something to say tonight
                  </button>
                  <button onClick={tweakPlan} className="text-sm underline text-charcoal/70 hover:text-romantic-pink">
                    I want to change something
                  </button>
                  <button onClick={clearEverything} className="text-xs text-charcoal/50 hover:text-romantic-pink underline">
                    Clear everything & start over
                  </button>
                </div>

                <div className="mt-10 text-xs text-deep-purple/60 tracking-widest">
                  SAVED IN YOUR BROWSER. REFRESH AND IT&apos;S STILL HERE.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer love note — tiny, always present */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-charcoal/40 tracking-widest pointer-events-none">
        MADE FOR YOU
      </div>

      {/* Feature 4: Whisper modal — reuses the exact AnimatePresence + sticker-card + framer pattern */}
      <AnimatePresence>
        {showWhisper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
            onClick={() => setShowWhisper(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticker-card p-8 sm:p-9 text-center relative">
                <div className="text-[15.5px] leading-relaxed text-deep-navy/90">
                  {currentWhisper}
                </div>

                <div className="absolute -bottom-2 -right-2 opacity-90">
                  {lockedPlan && (
                    <CoupleCartoon size={128} alt="Us" />
                  )}
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                  <button
                    onClick={() => {
                      if (!lockedPlan) return;
                      setCurrentWhisper(getWhisperForPlan(lockedPlan));
                    }}
                    className="text-sm text-deep-purple/70 hover:text-romantic-pink underline transition"
                  >
                    Another one
                  </button>
                  <button
                    onClick={() => setShowWhisper(false)}
                    className="pill-button secondary text-sm mt-1"
                    autoFocus
                  >
                    {CLOSE_PHRASES[0]}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

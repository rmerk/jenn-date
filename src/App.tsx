import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';

import type { QuestAnswers, LockedPlan } from './lib/types';
import { TOTAL_QUESTIONS, getQuestion, isQuestComplete, canJumpToStep, RESTAURANT_CUISINE_OPTIONS, OUTING_ACTIVITY_OPTIONS, isStep2Complete, deriveFoodFantasy, deriveOutingFoodFantasy, getStep2Copy, isOutingStepVibe } from './lib/questions';
import { ProgressStars } from './components/ProgressStars';
import { QuestionCard } from './components/QuestionCard';
import { DateSelector } from './components/DateSelector';
import { generateLoveBriefMarkdown, generateLoveBriefICS, downloadTextFile, downloadCalendarICS, isFutureDate, isDatePassed, isChosenDateToday, formatLockedDate, formatDateForDisplay, DEFAULT_CHOSEN_TIME } from './lib/utils';
import { getShortSweetNote, getPersonalizedLoveMessage } from './lib/loveMessage';
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

  const [debriefHighlight, setDebriefHighlight] = useState(() => loadLockedPlan()?.debriefHighlight ?? '');
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

  /** From celebration: jump to a specific quest step to change that answer. */
  const editStep = (step: number) => {
    const base = lockedPlan || answers;
    if (lockedPlan) clearLockedPlan();
    setState({
      mode: 'quest',
      currentStep: Math.max(1, Math.min(TOTAL_QUESTIONS, step)),
      answers: { ...DEFAULT_ANSWERS, ...base },
      lockedPlan: null,
      showLoveMessage: false,
    });
  };

  const copySweetNote = () => {
    if (!lockedPlan) return;
    const note = getShortSweetNote(lockedPlan);
    navigator.clipboard.writeText(note).then(() => {
      toast.success('Sweet note copied — paste it into your calendar or a card.');
    });
  };

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

              <div className="max-w-lg mx-auto w-full text-left">
                <div className="celeb-reveal__love-card whitespace-pre-wrap">
                  {getPersonalizedLoveMessage(lockedPlan)}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
                  <button type="button" onClick={copySweetNote} className="pill-button secondary text-sm">
                    Copy note
                  </button>
                  {isFutureDate(lockedPlan.chosenDate) && (
                    <button type="button" onClick={addToCalendar} className="pill-button primary text-sm">
                      Add to calendar
                    </button>
                  )}
                </div>
              </div>

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

              {isDatePassed(lockedPlan.chosenDate) && (
                <div className="flex flex-col items-center gap-3 pt-2">
                  <button type="button" onClick={planAnother} className="pill-button primary">
                    Plan our next date
                  </button>
                </div>
              )}
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
          onLock={lockDateInHeart}
          onCopyNote={copySweetNote}
          onAddToCalendar={addToCalendar}
          onEditStep={editStep}
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
    </div>
  );
}

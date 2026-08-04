import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import { CATEGORY_LABELS, type CategoryKey } from '../config/stimuli';
import type {
  ActivityPhase,
  SessionRandomisation,
  Side,
  SideAssignment,
  Trial,
  TrialBlock,
  TrialRecord,
} from '../types/activity';
import {
  createSessionRandomisation,
  generateCombinedTrials,
  generateCompetencePracticeTrials,
  generateIdentityPracticeTrials,
} from '../utils/generateTrials';
import { calculateResult, type ActivityResult } from '../utils/calculateResult';
import { clearSession, loadSession, saveSession, type StoredSession } from '../utils/sessionStorage';
import { useInterruptionDetection } from './useInterruptionDetection';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useReactionTimer } from './useReactionTimer';

export type TrialFeedback = 'idle' | 'correct' | 'incorrect';
export type TransitionStage = 'notice' | 'practice' | 'ready';

export interface DisplayAssignment {
  leftCategories: CategoryKey[];
  rightCategories: CategoryKey[];
  leftLabels: string[];
  rightLabels: string[];
}

const TRIAL_PHASES: ActivityPhase[] = ['practice', 'round1', 'transition', 'round2'];

/** Phases that can be safely resumed; mid-activity phases restart the activity. */
function resumePhase(stored: StoredSession | null): ActivityPhase {
  if (!stored) return 'landing';
  if (TRIAL_PHASES.includes(stored.phase)) return 'instructions';
  if (stored.phase === 'completion') return 'landing';
  return stored.phase;
}

function resumeRecords(stored: StoredSession | null): TrialRecord[] {
  if (!stored) return [];
  const phase = resumePhase(stored);
  // Only a finished activity keeps its trials; a restarted one starts clean.
  return phase === 'resultChoice' || phase === 'result' ? stored.trialRecords : [];
}

function labelsFor(categories: CategoryKey[]): string[] {
  return categories.map((category) => CATEGORY_LABELS[category]);
}

function toDisplayAssignment(leftCategories: CategoryKey[], rightCategories: CategoryKey[]): DisplayAssignment {
  return {
    leftCategories,
    rightCategories,
    leftLabels: labelsFor(leftCategories),
    rightLabels: labelsFor(rightCategories),
  };
}

/** The categories on screen depend on which block the current trial belongs to. */
function assignmentForBlock(block: TrialBlock, randomisation: SessionRandomisation): DisplayAssignment {
  switch (block) {
    case 'practice-identity': {
      const left = randomisation.practiceIdentityLeft;
      const right: CategoryKey = left === 'neurodivergent' ? 'neurotypical' : 'neurodivergent';
      return toDisplayAssignment([left], [right]);
    }
    case 'practice-competence': {
      const left = randomisation.practiceCompetenceLeft;
      const right: CategoryKey = left === 'competent' ? 'incompetent' : 'competent';
      return toDisplayAssignment([left], [right]);
    }
    case 'practice-transition':
      return toDisplayAssignment([...randomisation.round2.leftCategories], [...randomisation.round2.rightCategories]);
    default: {
      const assignment: SideAssignment =
        block === randomisation.round1.pairing ? randomisation.round1 : randomisation.round2;
      return toDisplayAssignment([...assignment.leftCategories], [...assignment.rightCategories]);
    }
  }
}

function lightHaptic(): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(12);
  }
}

export function useActivityEngine() {
  const storedSession = useMemo(() => loadSession(), []);

  const [phase, setPhase] = useState<ActivityPhase>(() => resumePhase(storedSession));
  const [acknowledged, setAcknowledged] = useState<boolean>(() => storedSession?.acknowledged ?? false);
  const [randomisation, setRandomisation] = useState<SessionRandomisation>(
    () => storedSession?.randomisation ?? createSessionRandomisation(),
  );
  const [trialRecords, setTrialRecords] = useState<TrialRecord[]>(() => resumeRecords(storedSession));

  const [queue, setQueue] = useState<Trial[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [feedback, setFeedback] = useState<TrialFeedback>('idle');
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [transitionStage, setTransitionStage] = useState<TransitionStage>('notice');
  const [sessionClearedNotice, setSessionClearedNotice] = useState(false);

  const firstLatencyRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const advanceTimeoutRef = useRef<number | null>(null);
  /** Guards against a trial being recorded twice by a duplicated input event
   * (pointer plus click, or a held-down key). */
  const resolvedRef = useRef(false);

  const prefersReducedMotion = usePrefersReducedMotion();
  const timer = useReactionTimer();

  const isTrialPhase = TRIAL_PHASES.includes(phase);
  const currentTrial = isTrialPhase ? (queue[queueIndex] ?? null) : null;
  // Destructured because only the individual callbacks are referentially stable.
  const { beginTrial, wasInterrupted, majorInterruption, dismissMajorInterruption } = useInterruptionDetection(
    currentTrial !== null,
  );

  const currentAssignment = useMemo(
    () => (currentTrial ? assignmentForBlock(currentTrial.block, randomisation) : null),
    [currentTrial, randomisation],
  );

  const clearPendingAdvance = useCallback(() => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingAdvance, [clearPendingAdvance]);

  const loadQueue = useCallback(
    (trials: Trial[]) => {
      clearPendingAdvance();
      setQueue(trials);
      setQueueIndex(0);
      setFeedback('idle');
      // An interruption during one block should not greet the participant at
      // the start of the next one.
      dismissMajorInterruption();
    },
    [clearPendingAdvance, dismissMajorInterruption],
  );

  // Reset the timer and interruption flag whenever a new stimulus appears.
  useEffect(() => {
    if (!currentTrial) return;
    firstLatencyRef.current = null;
    attemptsRef.current = 0;
    resolvedRef.current = false;
    beginTrial();
    timer.start();
  }, [beginTrial, currentTrial, timer]);

  // Advance the activity when a block's queue runs out.
  useEffect(() => {
    if (!isTrialPhase || queue.length === 0 || queueIndex < queue.length) return;

    clearPendingAdvance();
    setQueue([]);
    setQueueIndex(0);
    setFeedback('idle');

    if (phase === 'practice') setPracticeComplete(true);
    else if (phase === 'round1') {
      setPhase('transition');
      setTransitionStage('notice');
    } else if (phase === 'transition') setTransitionStage('ready');
    else if (phase === 'round2') setPhase('resultChoice');
  }, [clearPendingAdvance, isTrialPhase, phase, queue.length, queueIndex]);

  const respond = useCallback(
    (side: Side) => {
      const trial = queue[queueIndex];
      if (!trial || resolvedRef.current) return;

      const latency = timer.elapsed();
      attemptsRef.current += 1;
      if (firstLatencyRef.current === null) firstLatencyRef.current = latency;

      if (side !== trial.correctSide) {
        setFeedback('incorrect');
        lightHaptic();
        return;
      }

      resolvedRef.current = true;
      setFeedback('correct');
      const record: TrialRecord = {
        ...trial,
        reactionTimeMs: firstLatencyRef.current,
        firstResponseCorrect: attemptsRef.current === 1,
        attempts: attemptsRef.current,
        interrupted: wasInterrupted(),
      };
      setTrialRecords((previous) => [...previous, record]);

      advanceTimeoutRef.current = window.setTimeout(
        () => {
          advanceTimeoutRef.current = null;
          setFeedback('idle');
          setQueueIndex((index) => index + 1);
        },
        prefersReducedMotion ? 90 : 220,
      );
    },
    [prefersReducedMotion, queue, queueIndex, timer, wasInterrupted],
  );

  // Optional keyboard shortcuts; taps and clicks remain the primary method.
  useEffect(() => {
    if (!currentTrial) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'e' || event.key === 'ArrowLeft') {
        event.preventDefault();
        respond('left');
      } else if (key === 'i' || event.key === 'ArrowRight') {
        event.preventDefault();
        respond('right');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTrial, respond]);

  const result: ActivityResult = useMemo(() => calculateResult(trialRecords), [trialRecords]);

  // Temporary session state only, so a refresh mid-activity does not lose the
  // acknowledgement or a finished result. Removed once the activity completes.
  useEffect(() => {
    if (phase === 'completion' || (phase === 'landing' && trialRecords.length === 0)) {
      clearSession();
      return;
    }
    saveSession({ phase, randomisation, trialRecords, acknowledged });
  }, [acknowledged, phase, randomisation, trialRecords]);

  const resetActivityState = useCallback(
    (options: { newRandomisation: boolean }) => {
      clearPendingAdvance();
      if (options.newRandomisation) setRandomisation(createSessionRandomisation());
      setTrialRecords([]);
      setQueue([]);
      setQueueIndex(0);
      setFeedback('idle');
      setPracticeComplete(false);
      setTransitionStage('notice');
      timer.clear();
      clearSession();
    },
    [clearPendingAdvance, timer],
  );

  const actions = useMemo(
    () => ({
      startActivity: () => {
        setSessionClearedNotice(false);
        setPhase('information');
      },
      acknowledge: (value: boolean) => setAcknowledged(value),
      continueFromInformation: () => setPhase('instructions'),
      startPractice: () => {
        setPracticeComplete(false);
        loadQueue([
          ...generateIdentityPracticeTrials(ACTIVITY_CONFIG.practice.identityTrials, randomisation.practiceIdentityLeft),
          ...generateCompetencePracticeTrials(
            ACTIVITY_CONFIG.practice.competenceTrials,
            randomisation.practiceCompetenceLeft,
          ),
        ]);
        setPhase('practice');
      },
      beginRounds: () => {
        loadQueue(
          generateCombinedTrials(randomisation.round1, ACTIVITY_CONFIG.scoredRoundTrials, randomisation.round1.pairing),
        );
        setPhase('round1');
      },
      startTransitionPractice: () => {
        loadQueue(
          generateCombinedTrials(randomisation.round2, ACTIVITY_CONFIG.transitionPracticeTrials, 'practice-transition'),
        );
        setTransitionStage('practice');
      },
      startFinalRound: () => {
        loadQueue(
          generateCombinedTrials(randomisation.round2, ACTIVITY_CONFIG.scoredRoundTrials, randomisation.round2.pairing),
        );
        setPhase('round2');
      },
      showResult: () => setPhase('result'),
      skipResult: () => setPhase('completion'),
      continueFromResult: () => setPhase('completion'),
      restart: () => {
        resetActivityState({ newRandomisation: true });
        setSessionClearedNotice(false);
        setPhase('instructions');
      },
      returnHome: () => {
        resetActivityState({ newRandomisation: true });
        setSessionClearedNotice(false);
        setPhase('landing');
      },
      clearMySession: () => {
        resetActivityState({ newRandomisation: true });
        setAcknowledged(false);
        setSessionClearedNotice(true);
        setPhase('landing');
      },
      dismissSessionClearedNotice: () => setSessionClearedNotice(false),
    }),
    [loadQueue, randomisation, resetActivityState],
  );

  const roundLabel = useMemo(() => {
    if (!currentTrial) return '';
    if (currentTrial.block === 'A' || currentTrial.block === 'B') {
      return currentTrial.block === randomisation.round1.pairing ? 'Round 1 of 2' : 'Round 2 of 2';
    }
    return 'Practice';
  }, [currentTrial, randomisation]);

  return {
    phase,
    acknowledged,
    randomisation,
    trialRecords,
    currentTrial,
    currentAssignment,
    trialNumber: currentTrial ? queueIndex + 1 : 0,
    trialTotal: queue.length,
    roundLabel,
    feedback,
    practiceComplete,
    transitionStage,
    result,
    sessionClearedNotice,
    prefersReducedMotion,
    majorInterruption,
    dismissMajorInterruption,
    respond,
    actions,
  };
}

export type ActivityEngine = ReturnType<typeof useActivityEngine>;

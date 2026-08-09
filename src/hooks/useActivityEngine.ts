import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import { DEFAULT_ACTIVITY_ID, findActivity, type CategorySlot } from '../config/activities';
import type { ActivityPhase, BlockSpec, SessionRandomisation, Side, Trial, TrialRecord } from '../types/activity';
import { createSessionRandomisation, focalCategoriesFor, generateBlockTrials, FOCAL_SIDE } from '../utils/generateTrials';
import { calculateResult, type ActivityResult } from '../utils/calculateResult';
import { clearSession, loadSession, saveSession, type StoredSession } from '../utils/sessionStorage';
import { useInterruptionDetection } from './useInterruptionDetection';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useReactionTimer } from './useReactionTimer';

export type TrialFeedback = 'idle' | 'correct' | 'incorrect';

/** The two categories the current block asks the participant to watch for. */
export interface FocalDisplay {
  focalCategories: CategorySlot[];
  focalLabels: string[];
  /** The side that answers "yes, one of those two". Fixed for the session. */
  focalSide: Side;
}

/** Phases in which trials are on screen. */
const TRIAL_PHASES: ActivityPhase[] = ['warmUp', 'block'];

/** Phases that cannot be resumed part-way through; these restart the activity. */
const MID_ACTIVITY_PHASES: ActivityPhase[] = ['warmUp', 'blockIntro', 'block'];

function resumePhase(stored: StoredSession | null): ActivityPhase {
  if (!stored) return 'landing';
  if (MID_ACTIVITY_PHASES.includes(stored.phase)) return 'instructions';
  if (stored.phase === 'completion') return 'landing';
  return stored.phase;
}

function resumeRecords(stored: StoredSession | null): TrialRecord[] {
  if (!stored) return [];
  const phase = resumePhase(stored);
  // Only a finished activity keeps its trials; a restarted one starts clean.
  return phase === 'resultChoice' || phase === 'result' ? stored.trialRecords : [];
}

function lightHaptic(): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(12);
  }
}

export function useActivityEngine() {
  const storedSession = useMemo(() => loadSession(), []);

  const [phase, setPhase] = useState<ActivityPhase>(() => resumePhase(storedSession));
  const [activityId, setActivityId] = useState<string>(() => storedSession?.activityId ?? DEFAULT_ACTIVITY_ID);
  const [acknowledged, setAcknowledged] = useState<boolean>(() => storedSession?.acknowledged ?? false);
  const [randomisation, setRandomisation] = useState<SessionRandomisation>(
    () => storedSession?.randomisation ?? createSessionRandomisation(),
  );
  const [trialRecords, setTrialRecords] = useState<TrialRecord[]>(() => resumeRecords(storedSession));

  const [queue, setQueue] = useState<Trial[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [feedback, setFeedback] = useState<TrialFeedback>('idle');
  /** Index into `randomisation.blocks`: 0 is the warm-up, 1 to 4 are scored. */
  const [blockIndex, setBlockIndex] = useState(0);
  const [warmUpComplete, setWarmUpComplete] = useState(false);
  const [sessionClearedNotice, setSessionClearedNotice] = useState(false);

  const attemptsRef = useRef(0);
  const advanceTimeoutRef = useRef<number | null>(null);
  /** Guards against a trial being recorded twice by a duplicated input event
   * (pointer plus click, or a held-down key). */
  const resolvedRef = useRef(false);

  const activity = useMemo(() => findActivity(activityId), [activityId]);

  const prefersReducedMotion = usePrefersReducedMotion();
  const timer = useReactionTimer();

  const isTrialPhase = TRIAL_PHASES.includes(phase);
  const currentTrial = isTrialPhase ? (queue[queueIndex] ?? null) : null;
  // Destructured because only the individual callbacks are referentially stable.
  const { beginTrial, wasInterrupted, majorInterruption, dismissMajorInterruption } = useInterruptionDetection(
    currentTrial !== null,
  );

  const currentBlock: BlockSpec | null = randomisation.blocks[blockIndex] ?? null;

  // Derived from the block rather than the trial, because the between-block
  // screen has to announce the focal pair before any trial exists.
  const focal: FocalDisplay | null = useMemo(() => {
    if (!currentBlock) return null;
    const focalCategories = focalCategoriesFor(activity, currentBlock.pairing);
    return {
      focalCategories,
      focalLabels: focalCategories.map((slot) => activity.labels[slot]),
      focalSide: FOCAL_SIDE,
    };
  }, [activity, currentBlock]);

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

    if (phase === 'warmUp') {
      setWarmUpComplete(true);
      return;
    }

    const isFinalBlock = blockIndex >= randomisation.blocks.length - 1;
    if (isFinalBlock) {
      setPhase('resultChoice');
    } else {
      setBlockIndex((index) => index + 1);
      setPhase('blockIntro');
    }
  }, [blockIndex, clearPendingAdvance, isTrialPhase, phase, queue.length, queueIndex, randomisation.blocks.length]);

  const respond = useCallback(
    (side: Side) => {
      const trial = queue[queueIndex];
      if (!trial || resolvedRef.current) return;

      const latency = timer.elapsed();
      attemptsRef.current += 1;

      if (side !== trial.correctSide) {
        setFeedback('incorrect');
        lightHaptic();
        return;
      }

      resolvedRef.current = true;
      setFeedback('correct');
      const record: TrialRecord = {
        ...trial,
        // Time to the correct response, so a wrong turn costs what it cost.
        reactionTimeMs: latency,
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
      // A held-down key auto-repeats. Without this the repeats carry over the
      // moment the next stimulus appears, answering it in a few milliseconds
      // and filling the block with times too fast to mean anything.
      if (event.repeat) return;
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
    saveSession({ phase, activityId, randomisation, trialRecords, acknowledged });
  }, [acknowledged, activityId, phase, randomisation, trialRecords]);

  const resetActivityState = useCallback(
    (options: { newRandomisation: boolean }) => {
      clearPendingAdvance();
      if (options.newRandomisation) setRandomisation(createSessionRandomisation());
      setTrialRecords([]);
      setQueue([]);
      setQueueIndex(0);
      setFeedback('idle');
      setBlockIndex(0);
      setWarmUpComplete(false);
      timer.clear();
      clearSession();
    },
    [clearPendingAdvance, timer],
  );

  const actions = useMemo(
    () => ({
      startActivity: (chosenActivityId: string = DEFAULT_ACTIVITY_ID) => {
        // Choosing a different topic mid-session would leave trials scored
        // against the wrong word lists, so the run starts clean. Everything
        // else about the previous run has to go with them, block progress
        // included, which is why this resets rather than clearing the trials.
        resetActivityState({ newRandomisation: true });
        setSessionClearedNotice(false);
        setActivityId(chosenActivityId);
        setPhase('information');
      },
      acknowledge: (value: boolean) => setAcknowledged(value),
      // The definitions land between the acknowledgement and the instructions,
      // so the category names the instructions demonstrate are already defined.
      continueFromInformation: () => setPhase('definitions'),
      continueFromDefinitions: () => setPhase('instructions'),
      startWarmUp: () => {
        setWarmUpComplete(false);
        setBlockIndex(0);
        loadQueue(generateBlockTrials(activity, randomisation.blocks[0]));
        setPhase('warmUp');
      },
      /** Leaves the warm-up for the first scored block's announcement. */
      startBlocks: () => {
        setBlockIndex(1);
        setPhase('blockIntro');
      },
      /** Begins whichever block the announcement was for. */
      startBlock: () => {
        const block = randomisation.blocks[blockIndex];
        if (!block) return;
        loadQueue(generateBlockTrials(activity, block));
        setPhase('block');
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
    [activity, blockIndex, loadQueue, randomisation, resetActivityState],
  );

  const blockLabel = useMemo(() => {
    if (!currentBlock) return '';
    if (currentBlock.kind === 'warmUp') return 'Warm-up';
    return `Block ${currentBlock.blockNumber} of ${ACTIVITY_CONFIG.blocks.scoredBlockCount}`;
  }, [currentBlock]);

  return {
    phase,
    activity,
    acknowledged,
    randomisation,
    trialRecords,
    currentTrial,
    currentBlock,
    focal,
    trialNumber: currentTrial ? queueIndex + 1 : 0,
    trialTotal: queue.length,
    blockLabel,
    feedback,
    warmUpComplete,
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

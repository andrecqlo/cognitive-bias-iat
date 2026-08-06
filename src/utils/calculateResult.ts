import { ACTIVITY_CONFIG } from '../config/activityConfig';
import type { Pairing, TrialRecord } from '../types/activity';

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/** Sample standard deviation. Null below two values, where it is undefined. */
export function standardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const average = mean(values) as number;
  const sumSquares = values.reduce((total, value) => total + (value - average) ** 2, 0);
  return Math.sqrt(sumSquares / (values.length - 1));
}

/**
 * Trials that count towards the D-score.
 *
 * Note what is *not* excluded: trials whose first response was wrong. The
 * activity makes participants correct an error before advancing, so the cost of
 * that error is already inside the recorded time. Dropping those trials would
 * remove exactly the trials where the pairing was hardest, which is the signal
 * rather than the noise.
 */
export function isUsableTrial(trial: TrialRecord): boolean {
  const { minValidMs, maxValidMs } = ACTIVITY_CONFIG.timing;
  return !trial.interrupted && trial.reactionTimeMs >= minValidMs && trial.reactionTimeMs <= maxValidMs;
}

export interface RoundSummary {
  pairing: Pairing;
  totalTrials: number;
  /** Trials left once the opening warm-up is set aside. */
  scoredTrials: number;
  usableTrials: number;
  meanReactionTimeMs: number | null;
  accuracy: number | null;
  /** Reaction times so fast they suggest guessing rather than categorising. */
  tooFastTrials: number;
  /** Reaction times of the usable trials, for the pooled standard deviation. */
  reactionTimes: number[];
}

export function summariseRound(trials: TrialRecord[], pairing: Pairing): RoundSummary {
  const { minValidMs } = ACTIVITY_CONFIG.timing;
  // In presentation order, because the warm-up window is the round's opening
  // trials as the participant met them.
  const presented = trials.filter((trial) => trial.block === pairing);
  const attempted = presented.filter((trial) => !trial.interrupted);
  // Accuracy covers the whole round, including the opening trials, because
  // struggling to learn the pairing is exactly what it should capture.
  const correct = attempted.filter((trial) => trial.firstResponseCorrect);
  // The D-score does not, so both rounds are scored from an equally warm start.
  // Dropped by position rather than after interrupted trials are removed: doing
  // it the other way round makes the window swallow real trials whenever
  // something interrupted the opening ones, and by a different amount in each
  // round, which is exactly the asymmetry this is here to remove.
  const scored = presented
    .slice(ACTIVITY_CONFIG.warmUpTrialsDropped)
    .filter((trial) => !trial.interrupted);
  const usable = scored.filter(isUsableTrial);
  const reactionTimes = usable.map((trial) => trial.reactionTimeMs);

  return {
    pairing,
    totalTrials: attempted.length,
    scoredTrials: scored.length,
    usableTrials: usable.length,
    meanReactionTimeMs: mean(reactionTimes),
    accuracy: attempted.length > 0 ? correct.length / attempted.length : null,
    tooFastTrials: scored.filter((trial) => trial.reactionTimeMs < minValidMs).length,
    reactionTimes,
  };
}

/**
 * Which pairing was the quicker round, named by slot rather than by subject so
 * the same scoring runs every activity. `fasterWithAttributeA` means targetA
 * shared a response side with attributeA in the quicker round.
 */
export type ResultDirection = 'fasterWithAttributeA' | 'fasterWithAttributeB' | 'similar';

/**
 * Conventional D-score bands. These describe how large the effect is, not how
 * confident we are that it is real — the result copy has to carry that part.
 */
export type ResultStrength = 'slight' | 'moderate' | 'strong';

export type ResultQuality = 'reliable' | 'limited';

export interface ActivityResult {
  pairingA: RoundSummary;
  pairingB: RoundSummary;
  /**
   * Signed D-score: negative means Pairing A (targetA grouped with attributeA)
   * was the faster of the two, positive means Pairing B was.
   */
  dScore: number | null;
  /** Null when the score sits inside the "little or none" band. */
  strength: ResultStrength | null;
  /** Plain-English gap between the two means, for readers who want milliseconds. */
  differenceMs: number | null;
  direction: ResultDirection;
  quality: ResultQuality;
  qualityReasons: string[];
}

function strengthFor(magnitude: number): ResultStrength | null {
  const { slight, moderate, strong } = ACTIVITY_CONFIG.result.dScoreBands;
  if (magnitude >= strong) return 'strong';
  if (magnitude >= moderate) return 'moderate';
  if (magnitude >= slight) return 'slight';
  return null;
}

export function calculateResult(trials: TrialRecord[]): ActivityResult {
  const pairingA = summariseRound(trials, 'A');
  const pairingB = summariseRound(trials, 'B');

  let dScore: number | null = null;
  let differenceMs: number | null = null;
  let strength: ResultStrength | null = null;
  let direction: ResultDirection = 'similar';

  // The divisor is the spread of this participant's own responses across both
  // rounds. That is what makes the score comparable between a fast, consistent
  // responder and a slow, erratic one, and it is why no assumed spread appears
  // anywhere in this file.
  const pooledSd = standardDeviation([...pairingA.reactionTimes, ...pairingB.reactionTimes]);

  if (pairingA.meanReactionTimeMs !== null && pairingB.meanReactionTimeMs !== null && pooledSd !== null) {
    differenceMs = Math.round(Math.abs(pairingA.meanReactionTimeMs - pairingB.meanReactionTimeMs));
    dScore = pooledSd === 0 ? 0 : (pairingA.meanReactionTimeMs - pairingB.meanReactionTimeMs) / pooledSd;
    strength = strengthFor(Math.abs(dScore));

    if (strength !== null) {
      direction = dScore < 0 ? 'fasterWithAttributeA' : 'fasterWithAttributeB';
    }
  }

  const qualityReasons: string[] = [];
  const { minUsableTrialsPerRound, minAccuracy, maxTooFastRate } = ACTIVITY_CONFIG.timing;

  if (pairingA.usableTrials < minUsableTrialsPerRound || pairingB.usableTrials < minUsableTrialsPerRound) {
    qualityReasons.push('Fewer usable responses than expected in one or both rounds.');
  }
  if ((pairingA.accuracy ?? 1) < minAccuracy || (pairingB.accuracy ?? 1) < minAccuracy) {
    qualityReasons.push('More wrong turns than expected in one or both rounds.');
  }
  // The standard subject-level exclusion: a participant answering this fast is
  // responding before they can have read the word.
  const tooFast = pairingA.tooFastTrials + pairingB.tooFastTrials;
  const scored = pairingA.scoredTrials + pairingB.scoredTrials;
  if (scored > 0 && tooFast / scored > maxTooFastRate) {
    qualityReasons.push('Many responses were too fast to be reactions to the word on screen.');
  }

  return {
    pairingA,
    pairingB,
    dScore,
    strength,
    differenceMs,
    direction,
    quality: qualityReasons.length > 0 ? 'limited' : 'reliable',
    qualityReasons,
  };
}

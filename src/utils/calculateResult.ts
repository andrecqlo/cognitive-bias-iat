import { ACTIVITY_CONFIG } from '../config/activityConfig';
import type { Pairing, PairIndex, Trial, TrialRecord } from '../types/activity';

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
 * Whether a trial sits past the opening run its block discards.
 *
 * Positional rather than latency-based, and applied per block rather than per
 * session: every block opens with the same attribute-only run while the
 * participant settles into a new focal pair, and every block loses it.
 */
export function isScoredPosition(trial: Trial): boolean {
  return trial.positionInBlock >= ACTIVITY_CONFIG.leadingTrialsDropped;
}

/**
 * Trials that count towards the D-score.
 *
 * Note what is *not* excluded. Trials whose first response was wrong stay: the
 * activity makes participants correct an error before advancing, so the cost of
 * that error is already inside the recorded time, and dropping those trials
 * would remove exactly the trials where the focal pair was hardest — the signal
 * rather than the noise. Very fast responses stay too, and are pulled up to the
 * bottom of the scoring window instead; see `winsorise`.
 */
export function isUsableTrial(trial: TrialRecord): boolean {
  return !trial.interrupted && trial.reactionTimeMs <= ACTIVITY_CONFIG.timing.maxValidMs;
}

/**
 * Pulls a latency into the scoring window rather than discarding it.
 *
 * The recommended treatment for this procedure. A response under the floor is
 * usually anticipation and one over the ceiling usually inattention, but in
 * both cases the participant was still on that trial — recoding keeps the trial
 * in the count and removes only its leverage over the mean.
 */
export function winsorise(reactionTimeMs: number): number {
  const { winsorMinMs, winsorMaxMs } = ACTIVITY_CONFIG.timing;
  return Math.min(Math.max(reactionTimeMs, winsorMinMs), winsorMaxMs);
}

export interface TargetSummary {
  pairing: Pairing;
  /** Every non-interrupted trial in the two blocks with this target focal. */
  totalTrials: number;
  /** Trials left once each block's opening run is set aside. */
  scoredTrials: number;
  usableTrials: number;
  /** Mean of the latencies that were scored, after recoding. */
  meanReactionTimeMs: number | null;
  accuracy: number | null;
  /** Responses too fast to be reactions to the word, before recoding. */
  tooFastTrials: number;
}

/** The two blocks in which `pairing` was the focal target. */
function blocksFor(trials: TrialRecord[], pairing: Pairing): TrialRecord[] {
  return trials.filter((trial) => trial.pairing === pairing);
}

/** Scored, usable latencies for one target in one block pair, after recoding. */
function latenciesFor(trials: TrialRecord[], pairing: Pairing, pairIndex: PairIndex): number[] {
  return blocksFor(trials, pairing)
    .filter((trial) => trial.pairIndex === pairIndex && isScoredPosition(trial) && isUsableTrial(trial))
    .map((trial) => winsorise(trial.reactionTimeMs));
}

export function summariseTarget(trials: TrialRecord[], pairing: Pairing): TargetSummary {
  const { minValidMs } = ACTIVITY_CONFIG.timing;

  const presented = blocksFor(trials, pairing);
  const attempted = presented.filter((trial) => !trial.interrupted);
  // Accuracy covers the whole block, opening trials included, because
  // struggling to settle into a focal pair is exactly what it should capture.
  const correct = attempted.filter((trial) => trial.firstResponseCorrect);

  const scored = presented.filter((trial) => isScoredPosition(trial) && !trial.interrupted);
  const usable = scored.filter(isUsableTrial);

  return {
    pairing,
    totalTrials: attempted.length,
    scoredTrials: scored.length,
    usableTrials: usable.length,
    meanReactionTimeMs: mean(usable.map((trial) => winsorise(trial.reactionTimeMs))),
    accuracy: attempted.length > 0 ? correct.length / attempted.length : null,
    // Counted before recoding, which would otherwise erase the evidence.
    tooFastTrials: scored.filter((trial) => trial.reactionTimeMs < minValidMs).length,
  };
}

/**
 * Which target was quicker beside the focal attribute. Named by slot rather
 * than by subject so the same scoring runs every activity.
 */
export type ResultDirection = 'fasterWithTargetA' | 'fasterWithTargetB' | 'similar';

export type ResultQuality = 'reliable' | 'limited';

export interface ActivityResult {
  /** The two blocks in which targetA shared the focal pair. */
  targetA: TargetSummary;
  targetB: TargetSummary;
  /**
   * Signed D-score: negative means the targetA blocks were the quicker ones,
   * positive means the targetB blocks were.
   */
  dScore: number | null;
  /** The D for each block pair, before averaging. Null where a pair is unusable. */
  pairScores: (number | null)[];
  /** Plain-English gap between the two means, for readers who want milliseconds. */
  differenceMs: number | null;
  direction: ResultDirection;
  quality: ResultQuality;
  qualityReasons: string[];
}

/**
 * Whether the gap is wide enough to name a direction for. Below the threshold
 * the two halves are reported as about the same; above it, one of them is named
 * as quicker — and nothing more is said about the size either way.
 */
function namesADirection(magnitude: number): boolean {
  return magnitude >= ACTIVITY_CONFIG.result.directionThresholdD;
}

/**
 * D for one pair of consecutive blocks.
 *
 * The divisor is the spread of this participant's own responses across both
 * blocks of the pair. That is what makes the score comparable between a fast,
 * consistent responder and a slow, erratic one, and it is why no assumed spread
 * appears anywhere in this file.
 */
function dForPair(trials: TrialRecord[], pairIndex: PairIndex): number | null {
  const a = latenciesFor(trials, 'A', pairIndex);
  const b = latenciesFor(trials, 'B', pairIndex);
  if (a.length === 0 || b.length === 0) return null;

  const pooledSd = standardDeviation([...a, ...b]);
  if (pooledSd === null) return null;
  if (pooledSd === 0) return 0;

  return ((mean(a) as number) - (mean(b) as number)) / pooledSd;
}

export function calculateResult(trials: TrialRecord[]): ActivityResult {
  const targetA = summariseTarget(trials, 'A');
  const targetB = summariseTarget(trials, 'B');

  // One D per block pair, then the average of the two. Scoring each pair
  // against its own spread and averaging afterwards is the recommended
  // procedure: the second pair is a replication of the first, not more of the
  // same data, so it gets equal weight rather than more trials' worth.
  const pairScores: (number | null)[] = ([1, 2] as PairIndex[]).map((pairIndex) => dForPair(trials, pairIndex));
  const usablePairScores = pairScores.filter((score): score is number => score !== null);

  let dScore: number | null = null;
  let differenceMs: number | null = null;
  let direction: ResultDirection = 'similar';

  if (usablePairScores.length > 0) {
    dScore = mean(usablePairScores) as number;
    if (namesADirection(Math.abs(dScore))) {
      direction = dScore < 0 ? 'fasterWithTargetA' : 'fasterWithTargetB';
    }
  }

  if (targetA.meanReactionTimeMs !== null && targetB.meanReactionTimeMs !== null) {
    differenceMs = Math.round(Math.abs(targetA.meanReactionTimeMs - targetB.meanReactionTimeMs));
  }

  const qualityReasons: string[] = [];
  const { minUsableTrialsPerTarget, minAccuracy, maxTooFastRate } = ACTIVITY_CONFIG.timing;

  if (targetA.usableTrials < minUsableTrialsPerTarget || targetB.usableTrials < minUsableTrialsPerTarget) {
    qualityReasons.push('Fewer usable responses than expected in one or both halves of the activity.');
  }
  if ((targetA.accuracy ?? 1) < minAccuracy || (targetB.accuracy ?? 1) < minAccuracy) {
    qualityReasons.push('More wrong turns than expected in one or both halves of the activity.');
  }
  // The standard subject-level exclusion: a participant answering this fast is
  // responding before they can have read the word. Flagged rather than
  // excluded, because a rushed session still deserves to be seen.
  const tooFast = targetA.tooFastTrials + targetB.tooFastTrials;
  const scored = targetA.scoredTrials + targetB.scoredTrials;
  if (scored > 0 && tooFast / scored > maxTooFastRate) {
    qualityReasons.push('Many responses were too fast to be reactions to the word on screen.');
  }
  // Only one of the two pairs produced a score, so the replication that makes
  // this a two-pair measure did not happen.
  if (usablePairScores.length === 1) {
    qualityReasons.push('Only one half of the activity could be scored.');
  }

  return {
    targetA,
    targetB,
    dScore,
    pairScores,
    differenceMs,
    direction,
    quality: qualityReasons.length > 0 ? 'limited' : 'reliable',
    qualityReasons,
  };
}

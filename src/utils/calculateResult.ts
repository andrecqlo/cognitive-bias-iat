import { ACTIVITY_CONFIG } from '../config/activityConfig';
import type { Pairing, TrialRecord } from '../types/activity';

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function isUsableTrial(trial: TrialRecord): boolean {
  const { minValidMs, maxValidMs } = ACTIVITY_CONFIG.timing;
  return (
    trial.firstResponseCorrect &&
    !trial.interrupted &&
    trial.reactionTimeMs >= minValidMs &&
    trial.reactionTimeMs <= maxValidMs
  );
}

export interface RoundSummary {
  pairing: Pairing;
  totalTrials: number;
  usableTrials: number;
  medianReactionTimeMs: number | null;
  accuracy: number | null;
}

export function summariseRound(trials: TrialRecord[], pairing: Pairing): RoundSummary {
  const roundTrials = trials.filter((trial) => trial.block === pairing && !trial.interrupted);
  const usable = roundTrials.filter(isUsableTrial);
  const correct = roundTrials.filter((trial) => trial.firstResponseCorrect);

  return {
    pairing,
    totalTrials: roundTrials.length,
    usableTrials: usable.length,
    medianReactionTimeMs: median(usable.map((trial) => trial.reactionTimeMs)),
    accuracy: roundTrials.length > 0 ? correct.length / roundTrials.length : null,
  };
}

export type ResultDirection = 'fasterWithIncompetent' | 'fasterWithCompetent' | 'similar';

export type ResultQuality = 'reliable' | 'limited';

export interface ActivityResult {
  pairingA: RoundSummary;
  pairingB: RoundSummary;
  percentageDifference: number | null;
  direction: ResultDirection;
  quality: ResultQuality;
  qualityReasons: string[];
}

export function calculateResult(trials: TrialRecord[]): ActivityResult {
  const pairingA = summariseRound(trials, 'A');
  const pairingB = summariseRound(trials, 'B');

  let percentageDifference: number | null = null;
  let direction: ResultDirection = 'similar';

  if (pairingA.medianReactionTimeMs !== null && pairingB.medianReactionTimeMs !== null) {
    const a = pairingA.medianReactionTimeMs;
    const b = pairingB.medianReactionTimeMs;
    const slower = Math.max(a, b);
    const faster = Math.min(a, b);
    percentageDifference = slower === 0 ? 0 : Math.round(((slower - faster) / slower) * 100);

    if (percentageDifference < ACTIVITY_CONFIG.result.similarityThresholdPercent) {
      direction = 'similar';
    } else if (a < b) {
      // Pairing A = Neurodivergent+Incompetent / Neurotypical+Competent.
      direction = 'fasterWithIncompetent';
    } else {
      direction = 'fasterWithCompetent';
    }
  }

  const qualityReasons: string[] = [];
  const { minUsableTrialsPerRound, minAccuracy } = ACTIVITY_CONFIG.timing;

  if (pairingA.usableTrials < minUsableTrialsPerRound || pairingB.usableTrials < minUsableTrialsPerRound) {
    qualityReasons.push('Fewer usable trials than expected in one or both rounds.');
  }
  if ((pairingA.accuracy ?? 1) < minAccuracy || (pairingB.accuracy ?? 1) < minAccuracy) {
    qualityReasons.push('Accuracy was lower than expected in one or both rounds.');
  }

  return {
    pairingA,
    pairingB,
    percentageDifference,
    direction,
    quality: qualityReasons.length > 0 ? 'limited' : 'reliable',
    qualityReasons,
  };
}

import type { CategorySlot } from '../config/activities';

export type Side = 'left' | 'right';

/**
 * Which target shares the focal pair with the focal attribute in a block.
 *
 * In a Brief IAT the attribute stays focal throughout and the target swaps, so
 * a block is identified by its target: `A` means targetA was focal, `B` means
 * targetB was. The contrast between the two is the whole measure.
 */
export type Pairing = 'A' | 'B';

/** The two consecutive-block pairs, each of which yields its own D. */
export type PairIndex = 1 | 2;

export type BlockKind = 'warmUp' | 'scored';

/**
 * One block of the session, decided up front so the generator, the engine and
 * the between-block screens all read the same plan.
 */
export interface BlockSpec {
  /** 0 for the warm-up, then 1 to 4 for the scored blocks in presentation order. */
  blockNumber: number;
  kind: BlockKind;
  pairing: Pairing;
  /** Null for the warm-up, which belongs to no pair and is never scored. */
  pairIndex: PairIndex | null;
  trials: number;
}

export interface Trial {
  id: string;
  stimulus: string;
  category: CategorySlot;
  /**
   * Which side answers this trial. The focal side is fixed for the session, so
   * this is really "does the word belong to one of the two focal categories".
   */
  correctSide: Side;
  blockNumber: number;
  /**
   * Position within its own block, 0-based. Scoring drops the opening trials of
   * every block, which is a per-block rule rather than a per-session one.
   */
  positionInBlock: number;
  /** Null on warm-up trials, which never reach the score. */
  pairing: Pairing | null;
  /** Null on warm-up trials. */
  pairIndex: PairIndex | null;
}

export interface TrialRecord extends Trial {
  /**
   * Time from the stimulus appearing to the *correct* response, including any
   * time spent on a wrong answer first.
   *
   * The activity requires the correct side before advancing, which is the
   * design the D-score's built-in error penalty assumes: an error costs the
   * participant the time it takes to put it right, so no separate penalty is
   * added and error trials stay in the calculation.
   */
  reactionTimeMs: number;
  /** Reported as accuracy; does not remove the trial from the D-score. */
  firstResponseCorrect: boolean;
  attempts: number;
  interrupted: boolean;
}

/**
 * The two categories a block asks the participant to watch for, and the side
 * that answers "yes, one of those".
 */
export interface FocalAssignment {
  focalCategories: CategorySlot[];
  focalSide: Side;
}

export type ActivityPhase =
  | 'landing'
  | 'information'
  /** Defines every word in use, before the instructions and any trial. */
  | 'definitions'
  | 'instructions'
  | 'warmUp'
  | 'blockIntro'
  | 'block'
  | 'resultChoice'
  | 'result'
  | 'completion';

/** Randomised decisions made once per session, kept out of the UI layer. */
export interface SessionRandomisation {
  /**
   * Which target is focal in the first scored block. Counterbalanced by coin
   * flip, which is all that can be done when nothing leaves the device and
   * there is no sample to balance across.
   */
  firstPairing: Pairing;
  /** Warm-up first, then the four scored blocks in presentation order. */
  blocks: BlockSpec[];
}

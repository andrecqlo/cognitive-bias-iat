import type { CategorySlot } from '../config/activities';

export type Side = 'left' | 'right';

export type Pairing = 'A' | 'B';

/**
 * Which block of the activity a trial belongs to. Practice blocks are never
 * scored or included in the result comparison.
 */
export type TrialBlock =
  | 'practice-identity'
  | 'practice-competence'
  | 'practice-transition'
  | Pairing;

export interface Trial {
  id: string;
  stimulus: string;
  category: CategorySlot;
  correctSide: Side;
  block: TrialBlock;
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

/** Which two categories appear on each side for one round of the activity. */
export interface SideAssignment {
  pairing: Pairing;
  leftCategories: CategorySlot[];
  rightCategories: CategorySlot[];
}

export type ActivityPhase =
  | 'landing'
  | 'information'
  | 'instructions'
  | 'practice'
  | 'round1'
  | 'transition'
  | 'round2'
  | 'resultChoice'
  | 'result'
  | 'completion';

/** Randomised decisions made once per session, kept out of the UI layer. */
export interface SessionRandomisation {
  firstPairing: Pairing;
  round1: SideAssignment;
  round2: SideAssignment;
  practiceTargetLeft: Extract<CategorySlot, 'targetA' | 'targetB'>;
  practiceAttributeLeft: Extract<CategorySlot, 'attributeA' | 'attributeB'>;
}

import type { CategoryKey } from '../config/stimuli';

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
  category: CategoryKey;
  correctSide: Side;
  block: TrialBlock;
}

export interface TrialRecord extends Trial {
  reactionTimeMs: number;
  firstResponseCorrect: boolean;
  attempts: number;
  interrupted: boolean;
}

/** Which two categories appear on each side for one round of the activity. */
export interface SideAssignment {
  pairing: Pairing;
  leftCategories: CategoryKey[];
  rightCategories: CategoryKey[];
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
  practiceIdentityLeft: Extract<CategoryKey, 'neurodivergent' | 'neurotypical'>;
  practiceCompetenceLeft: Extract<CategoryKey, 'competent' | 'incompetent'>;
}

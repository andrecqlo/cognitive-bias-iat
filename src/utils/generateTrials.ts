import { ACTIVITY_CONFIG } from '../config/activityConfig';
import type { CategorySlot } from '../config/activities';
import type { Pairing, SessionRandomisation, SideAssignment, Side, Trial, TrialBlock } from '../types/activity';

/** The four word lists for whichever activity is being generated. */
export type StimulusSet = Record<CategorySlot, string[]>;

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `trial-${idCounter}`;
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const OTHER_SIDE: Record<Side, Side> = { left: 'right', right: 'left' };

/**
 * Builds a pool of {stimulus, category} entries distributed as evenly as
 * possible across the given categories, cycling each category's stimulus list
 * so no category is over-represented.
 */
function buildStimulusPool(
  stimuli: StimulusSet,
  categories: CategorySlot[],
  count: number,
): { stimulus: string; category: CategorySlot }[] {
  const perCategory = Math.floor(count / categories.length);
  const remainder = count - perCategory * categories.length;
  const categoriesGettingExtra = new Set(shuffle(categories).slice(0, remainder));

  const pool: { stimulus: string; category: CategorySlot }[] = [];

  categories.forEach((category) => {
    const need = perCategory + (categoriesGettingExtra.has(category) ? 1 : 0);
    const available = stimuli[category];
    const picked: string[] = [];
    let cycle = shuffle(available);

    while (picked.length < need) {
      for (const stimulus of cycle) {
        if (picked.length >= need) break;
        picked.push(stimulus);
      }
      cycle = shuffle(available);
    }

    picked.forEach((stimulus) => pool.push({ stimulus, category }));
  });

  return pool;
}

interface SequenceItem {
  stimulus: string;
  category: CategorySlot;
  correctSide: Side;
}

/** Length of the trailing run of `side` once it is appended to `pattern`. */
function sameSideRunLength(pattern: Side[], side: Side): number {
  let run = 1;
  for (let i = pattern.length - 1; i >= 0; i -= 1) {
    if (pattern[i] === side) run += 1;
    else break;
  }
  return run;
}

/** Length of the trailing strict-alternation run once `side` is appended. */
function alternatingRunLength(pattern: Side[], side: Side): number {
  const sequence = [...pattern, side];
  let run = 1;
  for (let i = sequence.length - 1; i > 0; i -= 1) {
    if (sequence[i] !== sequence[i - 1]) run += 1;
    else break;
  }
  return run;
}

/**
 * Can `remainingSame` more items of `lastSide` plus `remainingOther` items of
 * the opposite side still be laid out without exceeding `maxRun`, given the
 * sequence currently ends in a run of `trailingRun` items on `lastSide`?
 *
 * Necessary condition only, but strong enough that the generator below almost
 * never has to restart.
 */
function canStillComplete(
  remainingSame: number,
  remainingOther: number,
  trailingRun: number,
  maxRun: number,
): boolean {
  if (remainingSame === 0) return remainingOther <= maxRun;
  if (remainingOther === 0) return remainingSame <= maxRun - trailingRun;
  // The other side's items split the rest into at most remainingOther + 1 runs;
  // the first of those runs has already used trailingRun slots.
  const sameCapacity = maxRun - trailingRun + remainingOther * maxRun;
  const otherCapacity = (remainingSame + 1) * maxRun;
  return remainingSame <= sameCapacity && remainingOther <= otherCapacity;
}

/**
 * Produces a left/right pattern using exactly the requested counts, with no
 * same-side run longer than `maxRun` and no strict alternation longer than
 * `maxAlternating`. Returns null if this attempt paints itself into a corner.
 */
function attemptSidePattern(
  leftCount: number,
  rightCount: number,
  maxRun: number,
  maxAlternating: number,
): Side[] | null {
  const pattern: Side[] = [];
  const remaining: Record<Side, number> = { left: leftCount, right: rightCount };

  while (remaining.left + remaining.right > 0) {
    const candidates: Side[] = [];

    (['left', 'right'] as Side[]).forEach((side) => {
      if (remaining[side] === 0) return;

      const runLength = sameSideRunLength(pattern, side);
      if (runLength > maxRun) return;
      if (alternatingRunLength(pattern, side) > maxAlternating) return;

      const afterSame = remaining[side] - 1;
      const afterOther = remaining[OTHER_SIDE[side]];
      if (!canStillComplete(afterSame, afterOther, runLength, maxRun)) return;

      candidates.push(side);
    });

    if (candidates.length === 0) return null;

    // Weight by how many of each side are left, so neither side drains early
    // and forces a long run at the end.
    const totalWeight = candidates.reduce((sum, side) => sum + remaining[side], 0);
    let threshold = Math.random() * totalWeight;
    let chosen = candidates[candidates.length - 1];
    for (const side of candidates) {
      threshold -= remaining[side];
      if (threshold <= 0) {
        chosen = side;
        break;
      }
    }

    pattern.push(chosen);
    remaining[chosen] -= 1;
  }

  return pattern;
}

function generateSidePattern(leftCount: number, rightCount: number): Side[] {
  const { maxSameSideRun, maxAlternatingRun } = ACTIVITY_CONFIG.sequencing;

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const pattern = attemptSidePattern(leftCount, rightCount, maxSameSideRun, maxAlternatingRun);
    if (pattern) return pattern;
  }
  // Relax only the alternation limit: the same-side run limit matters more for
  // keeping the activity from feeling predictable in one direction.
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const pattern = attemptSidePattern(leftCount, rightCount, maxSameSideRun, Number.POSITIVE_INFINITY);
    if (pattern) return pattern;
  }
  throw new Error(`Unable to sequence ${leftCount} left and ${rightCount} right trials`);
}

/**
 * Fills a side pattern with the pooled stimuli, never placing the same exact
 * stimulus twice in a row. Returns null if this attempt runs out of options.
 */
function attemptStimulusAssignment(pattern: Side[], pool: SequenceItem[]): SequenceItem[] | null {
  const bySide: Record<Side, SequenceItem[]> = {
    left: shuffle(pool.filter((item) => item.correctSide === 'left')),
    right: shuffle(pool.filter((item) => item.correctSide === 'right')),
  };

  const sequence: SequenceItem[] = [];

  for (const side of pattern) {
    const available = bySide[side];
    const previousStimulus = sequence[sequence.length - 1]?.stimulus;

    let index = available.findIndex((item) => item.stimulus !== previousStimulus);
    if (index === -1) {
      if (available.length === 0) return null;
      index = 0;
    }

    sequence.push(available[index]);
    available.splice(index, 1);
  }

  const hasImmediateDuplicate = sequence.some((item, i) => i > 0 && item.stimulus === sequence[i - 1].stimulus);
  return hasImmediateDuplicate ? null : sequence;
}

function sequenceItems(pool: SequenceItem[]): SequenceItem[] {
  const leftCount = pool.filter((item) => item.correctSide === 'left').length;
  const rightCount = pool.length - leftCount;

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const pattern = generateSidePattern(leftCount, rightCount);
    const sequence = attemptStimulusAssignment(pattern, pool);
    if (sequence) return sequence;
  }
  // Duplicate-adjacency is the only constraint that can still be unmet here,
  // and only when a side has very few distinct stimuli.
  const fallbackPattern = generateSidePattern(leftCount, rightCount);
  const fallback = attemptStimulusAssignment(fallbackPattern, pool);
  if (fallback) return fallback;
  throw new Error('Unable to assign stimuli to the generated side pattern');
}

function categorySide(category: CategorySlot, assignment: SideAssignment): Side {
  if (assignment.leftCategories.includes(category)) return 'left';
  if (assignment.rightCategories.includes(category)) return 'right';
  throw new Error(`Category "${category}" is not assigned to either side`);
}

/**
 * Splits the trial count between the two sides first, then between the
 * categories on each side. Allocating in that order keeps left and right
 * responses balanced as well as the four categories.
 */
function buildSequence(stimuli: StimulusSet, assignment: SideAssignment, count: number): SequenceItem[] {
  const extraGoesLeft = Math.random() < 0.5;
  const leftCount = Math.floor(count / 2) + (count % 2 === 1 && extraGoesLeft ? 1 : 0);
  const rightCount = count - leftCount;

  const pool: SequenceItem[] = [
    ...buildStimulusPool(stimuli, assignment.leftCategories, leftCount).map((entry) => ({
      ...entry,
      correctSide: 'left' as Side,
    })),
    ...buildStimulusPool(stimuli, assignment.rightCategories, rightCount).map((entry) => ({
      ...entry,
      correctSide: 'right' as Side,
    })),
  ];

  pool.forEach((item) => {
    // Guards against a category being listed on the wrong side upstream.
    if (categorySide(item.category, assignment) !== item.correctSide) {
      throw new Error(`Category "${item.category}" was assigned to the wrong side`);
    }
  });

  return sequenceItems(pool);
}

function toTrials(items: SequenceItem[], block: TrialBlock): Trial[] {
  return items.map((item) => ({
    id: nextId(),
    stimulus: item.stimulus,
    category: item.category,
    correctSide: item.correctSide,
    block,
  }));
}

export function generateTargetPracticeTrials(
  stimuli: StimulusSet,
  count: number,
  leftCategory: Extract<CategorySlot, 'targetA' | 'targetB'>,
): Trial[] {
  const rightCategory: CategorySlot = leftCategory === 'targetA' ? 'targetB' : 'targetA';
  const assignment: SideAssignment = {
    pairing: 'A',
    leftCategories: [leftCategory],
    rightCategories: [rightCategory],
  };
  return toTrials(buildSequence(stimuli, assignment, count), 'practice-identity');
}

export function generateAttributePracticeTrials(
  stimuli: StimulusSet,
  count: number,
  leftCategory: Extract<CategorySlot, 'attributeA' | 'attributeB'>,
): Trial[] {
  const rightCategory: CategorySlot = leftCategory === 'attributeA' ? 'attributeB' : 'attributeA';
  const assignment: SideAssignment = {
    pairing: 'A',
    leftCategories: [leftCategory],
    rightCategories: [rightCategory],
  };
  return toTrials(buildSequence(stimuli, assignment, count), 'practice-competence');
}

export function generateCombinedTrials(
  stimuli: StimulusSet,
  assignment: SideAssignment,
  count: number,
  block: TrialBlock,
): Trial[] {
  return toTrials(buildSequence(stimuli, assignment, count), block);
}

/**
 * How the four categories group in each pairing. Pairing A puts targetA with
 * attributeA; Pairing B swaps the attributes over. Nothing here refers to any
 * particular subject, which is what lets one engine run every activity.
 */
export function categoriesForPairing(pairing: Pairing): {
  withTargetA: CategorySlot[];
  withTargetB: CategorySlot[];
} {
  if (pairing === 'A') {
    return {
      withTargetA: ['targetA', 'attributeA'],
      withTargetB: ['targetB', 'attributeB'],
    };
  }
  return {
    withTargetA: ['targetA', 'attributeB'],
    withTargetB: ['targetB', 'attributeA'],
  };
}

function sideAssignmentFor(pairing: Pairing, targetAOnLeft: boolean): SideAssignment {
  const { withTargetA, withTargetB } = categoriesForPairing(pairing);
  return {
    pairing,
    leftCategories: targetAOnLeft ? withTargetA : withTargetB,
    rightCategories: targetAOnLeft ? withTargetB : withTargetA,
  };
}

/** Whichever attribute shares the left side in the given round. */
function attributeOnLeft(assignment: SideAssignment): Extract<CategorySlot, 'attributeA' | 'attributeB'> {
  const found = assignment.leftCategories.find(
    (slot): slot is Extract<CategorySlot, 'attributeA' | 'attributeB'> =>
      slot === 'attributeA' || slot === 'attributeB',
  );
  if (!found) throw new Error('Round has no attribute category on its left side');
  return found;
}

/** Makes every random decision for a session once, up front. */
export function createSessionRandomisation(): SessionRandomisation {
  const firstPairing: Pairing = Math.random() < 0.5 ? 'A' : 'B';
  const secondPairing: Pairing = firstPairing === 'A' ? 'B' : 'A';

  // One side decision for the whole session, not one per round. The targets keep
  // their sides throughout and only the attributes swap between the two combined
  // rounds, so exactly one thing changes at the switch.
  //
  // Re-rolling this per round moved both dimensions at once for half of
  // participants: their second round carried the cost of relearning the target
  // positions as well as the new pairing, and because the D-score compares a
  // participant's own two rounds, that extra cost lands in the score as though
  // it were a difference between the pairings.
  const targetAOnLeft = Math.random() < 0.5;
  const round1 = sideAssignmentFor(firstPairing, targetAOnLeft);

  return {
    firstPairing,
    round1,
    round2: sideAssignmentFor(secondPairing, targetAOnLeft),
    // Both practice blocks teach the positions round one then uses, rather than
    // a mapping that changes the moment scoring starts.
    practiceTargetLeft: targetAOnLeft ? 'targetA' : 'targetB',
    practiceAttributeLeft: attributeOnLeft(round1),
  };
}

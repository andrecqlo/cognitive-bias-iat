import { ACTIVITY_CONFIG } from '../config/activityConfig';
import {
  nonFocalAttribute,
  otherTargetForPairing,
  targetForPairing,
  type ActivityDefinition,
  type AttributeSlot,
  type CategorySlot,
} from '../config/activities';
import type { BlockSpec, Pairing, PairIndex, SessionRandomisation, Side, Trial } from '../types/activity';

/** The four word lists for whichever activity is being generated. */
export type StimulusSet = Record<CategorySlot, string[]>;

/**
 * The side that answers "yes, this belongs to one of the two focal categories".
 *
 * Fixed for every session rather than randomised. The published procedure puts
 * the focal response on the right-hand key, the reliability figures quoted for
 * the BIAT come from that arrangement, and randomising it would add a source of
 * variance to a measure that has none to spare.
 */
export const FOCAL_SIDE: Side = 'right';
const NON_FOCAL_SIDE: Side = FOCAL_SIDE === 'right' ? 'left' : 'right';

/** Which of the two dimensions a trial's word is drawn from. */
type Dimension = 'target' | 'attribute';

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

/**
 * The order in which the two dimensions appear within a block.
 *
 * For a scored block this is the recommended composition: a run of
 * attribute-only trials opens the block, then category and attribute trials
 * alternate. The opening run is what scoring later discards, so the trials a
 * participant meets while still settling into a new focal pair are attribute
 * trials in both blocks of a pair — the same warm-up cost on both sides of the
 * comparison.
 *
 * The warm-up passes `leadingAttributeTrials` of zero, because it is never
 * scored and so has nothing to discard. Straight alternation splits its trials
 * evenly between the two dimensions, which is what lets a warm-up as long as
 * the word lists show every word exactly once. Keep the leading run and the
 * same length would show two thirds attributes and miss a target word from each
 * category.
 */
export function buildDimensionSchedule(trials: number, leadingAttributeTrials: number): Dimension[] {
  return Array.from({ length: trials }, (_unused, index) => {
    if (index < leadingAttributeTrials) return 'attribute';
    return (index - leadingAttributeTrials) % 2 === 0 ? 'target' : 'attribute';
  });
}

/**
 * A shuffled run of `count` focal/non-focal flags, split as evenly as the count
 * allows. An odd trial falls to either side at random so that neither key is
 * systematically the more common answer.
 */
function balancedFocalFlags(count: number): boolean[] {
  const half = Math.floor(count / 2);
  const focalCount = half + (count % 2 === 1 && Math.random() < 0.5 ? 1 : 0);
  return shuffle([...Array<boolean>(focalCount).fill(true), ...Array<boolean>(count - focalCount).fill(false)]);
}

function longestSameRun(sides: Side[]): number {
  let longest = 0;
  let current = 0;
  sides.forEach((side, index) => {
    current = index > 0 && side === sides[index - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  });
  return longest;
}

function longestAlternatingRun(sides: Side[]): number {
  let longest = 0;
  let current = 0;
  sides.forEach((side, index) => {
    current = index > 0 && side !== sides[index - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  });
  return longest;
}

/**
 * Assigns focal/non-focal to each position, balanced *within* each dimension so
 * both targets and both attributes appear equally often, and sequenced so the
 * answer never settles into a run or a rhythm the participant can ride.
 *
 * Balancing within the dimension rather than across the block is what stops a
 * block from asking about one target more than the other, which would show up
 * as a speed difference that has nothing to do with association.
 */
function assignFocalFlags(schedule: Dimension[]): boolean[] {
  const { maxSameSideRun, maxAlternatingRun } = ACTIVITY_CONFIG.sequencing;

  const positionsByDimension: Record<Dimension, number[]> = { target: [], attribute: [] };
  schedule.forEach((dimension, index) => positionsByDimension[dimension].push(index));

  const attempt = (maxAlternating: number): boolean[] | null => {
    const flags = Array<boolean>(schedule.length).fill(false);

    (['target', 'attribute'] as Dimension[]).forEach((dimension) => {
      const positions = positionsByDimension[dimension];
      balancedFocalFlags(positions.length).forEach((focal, index) => {
        flags[positions[index]] = focal;
      });
    });

    const sides = flags.map((focal) => (focal ? FOCAL_SIDE : NON_FOCAL_SIDE));
    if (longestSameRun(sides) > maxSameSideRun) return null;
    if (longestAlternatingRun(sides) > maxAlternating) return null;
    return flags;
  };

  for (let tries = 0; tries < 200; tries += 1) {
    const flags = attempt(maxAlternatingRun);
    if (flags) return flags;
  }
  // Relax only the alternation limit: the same-side run limit matters more for
  // keeping the activity from feeling predictable in one direction.
  for (let tries = 0; tries < 200; tries += 1) {
    const flags = attempt(Number.POSITIVE_INFINITY);
    if (flags) return flags;
  }
  throw new Error(`Unable to sequence a block of ${schedule.length} trials`);
}

function categoryFor(
  dimension: Dimension,
  focal: boolean,
  pairing: Pairing,
  focalAttribute: AttributeSlot,
  otherAttribute: AttributeSlot,
): CategorySlot {
  if (dimension === 'attribute') return focal ? focalAttribute : otherAttribute;
  return focal ? targetForPairing(pairing) : otherTargetForPairing(pairing);
}

/**
 * Draws a word for each position, cycling each category's shuffled list so no
 * word is over-used, and never repeating the same word twice in a row.
 */
function assignStimuli(categories: CategorySlot[], stimuli: StimulusSet): string[] | null {
  const queues = new Map<CategorySlot, string[]>();
  const words: string[] = [];

  const take = (category: CategorySlot): string | null => {
    const available = stimuli[category];
    if (available.length === 0) return null;

    // Two passes: the second one starts a fresh cycle when the only word left
    // in the current one is the word just used. With three stimuli per category
    // the tail of a cycle hits that often enough to matter, and failing the
    // whole assignment over it would send the caller round its retry loop for
    // no reason. At most one word's turn is given up.
    for (let pass = 0; pass < 2; pass += 1) {
      let queue = queues.get(category) ?? [];
      if (queue.length === 0) {
        queue = shuffle(available);
        queues.set(category, queue);
      }

      const previous = words[words.length - 1];
      const index = queue.findIndex((word) => word !== previous);
      if (index !== -1) {
        const [word] = queue.splice(index, 1);
        return word;
      }

      queues.set(category, []);
    }

    return null;
  };

  for (const category of categories) {
    const word = take(category);
    if (word === null) return null;
    words.push(word);
  }

  return words;
}

/** One block's trials, in the order the participant will meet them. */
export function generateBlockTrials(
  activity: Pick<ActivityDefinition, 'stimuli' | 'focalAttribute'>,
  block: BlockSpec,
): Trial[] {
  const focalAttribute = activity.focalAttribute;
  const otherAttribute = nonFocalAttribute(activity);

  const leadingAttributeTrials = block.kind === 'scored' ? ACTIVITY_CONFIG.blocks.leadingAttributeTrials : 0;
  const schedule = buildDimensionSchedule(block.trials, leadingAttributeTrials);
  const flags = assignFocalFlags(schedule);
  const categories = schedule.map((dimension, index) =>
    categoryFor(dimension, flags[index], block.pairing, focalAttribute, otherAttribute),
  );

  let words: string[] | null = null;
  for (let tries = 0; tries < 200 && words === null; tries += 1) {
    words = assignStimuli(categories, activity.stimuli);
  }
  if (words === null) {
    throw new Error('Unable to draw words without repeating one twice in a row');
  }

  return categories.map((category, index) => ({
    id: nextId(),
    stimulus: words[index],
    category,
    correctSide: flags[index] ? FOCAL_SIDE : NON_FOCAL_SIDE,
    blockNumber: block.blockNumber,
    positionInBlock: index,
    pairing: block.kind === 'scored' ? block.pairing : null,
    pairIndex: block.pairIndex,
  }));
}

/** The two categories a block asks the participant to watch for. */
export function focalCategoriesFor(activity: ActivityDefinition, pairing: Pairing): CategorySlot[] {
  return [targetForPairing(pairing), activity.focalAttribute];
}

/**
 * Makes every random decision for a session once, up front.
 *
 * The warm-up mirrors the first scored block's focal pair rather than using a
 * neutral arrangement of its own. That spends the novelty of the mechanic and
 * the word lists before anything counts, at the cost of giving the first
 * scored block's pairing slightly more exposure than the other. Which pairing
 * that is comes down to the coin flip below, and averaging two block pairs
 * dilutes what remains — the alternative, meeting the target words for the
 * first time in a scored block, costs more.
 */
export function createSessionRandomisation(): SessionRandomisation {
  const { warmUpTrials, scoredBlockTrials } = ACTIVITY_CONFIG.blocks;
  const firstPairing: Pairing = Math.random() < 0.5 ? 'A' : 'B';
  const secondPairing: Pairing = firstPairing === 'A' ? 'B' : 'A';

  // Two pairs of blocks, each containing one block per pairing. Alternating
  // rather than grouping is what makes the second pair a replication of the
  // first rather than a continuation of it.
  const scoredOrder: { pairing: Pairing; pairIndex: PairIndex }[] = [
    { pairing: firstPairing, pairIndex: 1 },
    { pairing: secondPairing, pairIndex: 1 },
    { pairing: firstPairing, pairIndex: 2 },
    { pairing: secondPairing, pairIndex: 2 },
  ];

  return {
    firstPairing,
    blocks: [
      { blockNumber: 0, kind: 'warmUp', pairing: firstPairing, pairIndex: null, trials: warmUpTrials },
      ...scoredOrder.map(({ pairing, pairIndex }, index) => ({
        blockNumber: index + 1,
        kind: 'scored' as const,
        pairing,
        pairIndex,
        trials: scoredBlockTrials,
      })),
    ],
  };
}

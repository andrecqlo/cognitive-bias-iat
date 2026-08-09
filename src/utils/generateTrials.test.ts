import { describe, expect, it } from 'vitest';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import { findActivity } from '../config/activities';
import {
  buildDimensionSchedule,
  createSessionRandomisation,
  focalCategoriesFor,
  generateBlockTrials,
  FOCAL_SIDE,
} from './generateTrials';
import type { BlockSpec, Pairing, Side, Trial } from '../types/activity';

const { maxSameSideRun, maxAlternatingRun } = ACTIVITY_CONFIG.sequencing;
const { warmUpTrials, scoredBlockTrials, leadingAttributeTrials, scoredBlockCount } = ACTIVITY_CONFIG.blocks;
const RUNS = 100;

/** Any activity's word lists will do; the generator is topic-independent. */
const ACTIVITY = findActivity('neurodiversity');
const NON_FOCAL_SIDE: Side = FOCAL_SIDE === 'right' ? 'left' : 'right';

function scoredBlock(pairing: Pairing = 'A'): BlockSpec {
  return { blockNumber: 1, kind: 'scored', pairing, pairIndex: 1, trials: scoredBlockTrials };
}

const WARM_UP_BLOCK: BlockSpec = {
  blockNumber: 0,
  kind: 'warmUp',
  pairing: 'A',
  pairIndex: null,
  trials: warmUpTrials,
};

function longestRun(trials: Trial[], same: boolean): number {
  let longest = 0;
  let current = 0;
  trials.forEach((trial, index) => {
    const matches = index > 0 && (trial.correctSide === trials[index - 1].correctSide) === same;
    current = matches ? current + 1 : 1;
    longest = Math.max(longest, current);
  });
  return longest;
}

function hasImmediateDuplicateStimulus(trials: Trial[]): boolean {
  return trials.some((trial, i) => i > 0 && trial.stimulus === trials[i - 1].stimulus);
}

function countBy(trials: Trial[], predicate: (trial: Trial) => boolean): number {
  return trials.filter(predicate).length;
}

const isAttributeTrial = (trial: Trial) => trial.category === 'attributeA' || trial.category === 'attributeB';
const isTargetTrial = (trial: Trial) => trial.category === 'targetA' || trial.category === 'targetB';

describe('buildDimensionSchedule', () => {
  it('opens every block with the attribute-only run the procedure discards', () => {
    const schedule = buildDimensionSchedule(scoredBlockTrials);
    expect(schedule.slice(0, leadingAttributeTrials)).toEqual(Array(leadingAttributeTrials).fill('attribute'));
  });

  it('alternates category and attribute after the opening run', () => {
    const schedule = buildDimensionSchedule(scoredBlockTrials).slice(leadingAttributeTrials);
    schedule.forEach((dimension, index) => {
      expect(dimension).toBe(index % 2 === 0 ? 'target' : 'attribute');
    });
  });

  it('produces exactly the requested number of positions', () => {
    expect(buildDimensionSchedule(warmUpTrials)).toHaveLength(warmUpTrials);
    expect(buildDimensionSchedule(scoredBlockTrials)).toHaveLength(scoredBlockTrials);
  });
});

describe('generateBlockTrials', () => {
  it('produces the block’s requested number of trials', () => {
    expect(generateBlockTrials(ACTIVITY, scoredBlock())).toHaveLength(scoredBlockTrials);
    expect(generateBlockTrials(ACTIVITY, WARM_UP_BLOCK)).toHaveLength(warmUpTrials);
  });

  it('numbers each trial by its position in the block', () => {
    const trials = generateBlockTrials(ACTIVITY, scoredBlock());
    expect(trials.map((trial) => trial.positionInBlock)).toEqual(trials.map((_unused, index) => index));
  });

  it('sends the two focal categories to the focal side and everything else to the other', () => {
    (['A', 'B'] as Pairing[]).forEach((pairing) => {
      const focal = focalCategoriesFor(ACTIVITY, pairing);
      generateBlockTrials(ACTIVITY, scoredBlock(pairing)).forEach((trial) => {
        const expected = focal.includes(trial.category) ? FOCAL_SIDE : NON_FOCAL_SIDE;
        expect(trial.correctSide).toBe(expected);
      });
    });
  });

  it('keeps the focal attribute focal whichever target is', () => {
    (['A', 'B'] as Pairing[]).forEach((pairing) => {
      const trials = generateBlockTrials(ACTIVITY, scoredBlock(pairing));
      const focalAttributeTrials = trials.filter((trial) => trial.category === ACTIVITY.focalAttribute);
      expect(focalAttributeTrials.length).toBeGreaterThan(0);
      focalAttributeTrials.forEach((trial) => expect(trial.correctSide).toBe(FOCAL_SIDE));
    });
  });

  it('balances focal against non-focal within each dimension, not just overall', () => {
    // Balancing only overall would let a block ask about one target far more
    // often than the other, which reads as a speed difference in the score.
    for (let run = 0; run < RUNS; run += 1) {
      const trials = generateBlockTrials(ACTIVITY, scoredBlock());

      const attributes = trials.filter(isAttributeTrial);
      const targets = trials.filter(isTargetTrial);
      const focalAttributes = countBy(attributes, (trial) => trial.correctSide === FOCAL_SIDE);
      const focalTargets = countBy(targets, (trial) => trial.correctSide === FOCAL_SIDE);

      expect(Math.abs(focalAttributes - (attributes.length - focalAttributes))).toBeLessThanOrEqual(1);
      expect(Math.abs(focalTargets - (targets.length - focalTargets))).toBeLessThanOrEqual(1);
    }
  });

  it('never exceeds the configured maximum same-side run', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(longestRun(generateBlockTrials(ACTIVITY, scoredBlock()), true)).toBeLessThanOrEqual(maxSameSideRun);
    }
  });

  it('never exceeds the configured maximum alternating run', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(longestRun(generateBlockTrials(ACTIVITY, scoredBlock()), false)).toBeLessThanOrEqual(maxAlternatingRun);
    }
  });

  it('never repeats the exact same stimulus twice in a row', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(hasImmediateDuplicateStimulus(generateBlockTrials(ACTIVITY, scoredBlock()))).toBe(false);
    }
  });

  it('tags scored trials with their pairing and pair, and warm-up trials with neither', () => {
    generateBlockTrials(ACTIVITY, { ...scoredBlock('B'), pairIndex: 2 }).forEach((trial) => {
      expect(trial.pairing).toBe('B');
      expect(trial.pairIndex).toBe(2);
    });

    generateBlockTrials(ACTIVITY, WARM_UP_BLOCK).forEach((trial) => {
      expect(trial.pairing).toBeNull();
      expect(trial.pairIndex).toBeNull();
    });
  });

  it('gives every trial a unique id', () => {
    const trials = generateBlockTrials(ACTIVITY, scoredBlock());
    expect(new Set(trials.map((trial) => trial.id)).size).toBe(trials.length);
  });

  it('draws its words from the activity it is given, not a fixed list', () => {
    const custom = {
      stimuli: {
        targetA: ['Alpha', 'Alto'],
        targetB: ['Beta', 'Bravo'],
        attributeA: ['Gamma', 'Golf'],
        attributeB: ['Delta', 'Dixie'],
      },
      focalAttribute: 'attributeB' as const,
    };
    const words = new Set(generateBlockTrials(custom, scoredBlock()).map((trial) => trial.stimulus));
    [...words].forEach((word) => {
      expect(Object.values(custom.stimuli).flat()).toContain(word);
    });
  });
});

describe('createSessionRandomisation', () => {
  it('plans a warm-up followed by the four scored blocks', () => {
    const { blocks } = createSessionRandomisation();
    expect(blocks).toHaveLength(scoredBlockCount + 1);
    expect(blocks[0].kind).toBe('warmUp');
    expect(blocks.slice(1).every((block) => block.kind === 'scored')).toBe(true);
    expect(blocks.map((block) => block.blockNumber)).toEqual([0, 1, 2, 3, 4]);
  });

  it('alternates the focal target so each pair holds one block of each', () => {
    for (let run = 0; run < RUNS; run += 1) {
      const scored = createSessionRandomisation().blocks.slice(1);
      expect(scored.map((block) => block.pairIndex)).toEqual([1, 1, 2, 2]);
      expect(new Set([scored[0].pairing, scored[1].pairing])).toEqual(new Set(['A', 'B']));
      expect(new Set([scored[2].pairing, scored[3].pairing])).toEqual(new Set(['A', 'B']));
    }
  });

  it('warms up on the pair the first scored block then uses', () => {
    for (let run = 0; run < RUNS; run += 1) {
      const { blocks, firstPairing } = createSessionRandomisation();
      expect(blocks[0].pairing).toBe(firstPairing);
      expect(blocks[1].pairing).toBe(firstPairing);
    }
  });

  it('counterbalances which target is focal first', () => {
    const seen = new Set<Pairing>();
    for (let run = 0; run < RUNS; run += 1) seen.add(createSessionRandomisation().firstPairing);
    expect(seen.size).toBe(2);
  });
});

describe('focalCategoriesFor', () => {
  it('pairs each target with the activity’s focal attribute', () => {
    expect(focalCategoriesFor(ACTIVITY, 'A')).toEqual(['targetA', ACTIVITY.focalAttribute]);
    expect(focalCategoriesFor(ACTIVITY, 'B')).toEqual(['targetB', ACTIVITY.focalAttribute]);
  });
});

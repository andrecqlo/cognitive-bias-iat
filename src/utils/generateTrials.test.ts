import { describe, expect, it } from 'vitest';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import { findActivity } from '../config/activities';
import {
  categoriesForPairing,
  createSessionRandomisation,
  generateAttributePracticeTrials,
  generateCombinedTrials,
  generateTargetPracticeTrials,
} from './generateTrials';
import type { SideAssignment, Trial } from '../types/activity';

const { maxSameSideRun, maxAlternatingRun } = ACTIVITY_CONFIG.sequencing;
const RUNS = 200;

/** Any activity's word lists will do; the generator is topic-independent. */
const { stimuli } = findActivity('neurodiversity');

const PAIRING_A: SideAssignment = {
  pairing: 'A',
  leftCategories: ['targetA', 'attributeA'],
  rightCategories: ['targetB', 'attributeB'],
};

const PAIRING_B: SideAssignment = {
  pairing: 'B',
  leftCategories: ['targetB', 'attributeA'],
  rightCategories: ['targetA', 'attributeB'],
};

function combined(assignment: SideAssignment, count: number, block: Trial['block']): Trial[] {
  return generateCombinedTrials(stimuli, assignment, count, block);
}

function longestSameSideRun(trials: Trial[]): number {
  if (trials.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < trials.length; i += 1) {
    current = trials[i].correctSide === trials[i - 1].correctSide ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function longestAlternatingRun(trials: Trial[]): number {
  if (trials.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < trials.length; i += 1) {
    current = trials[i].correctSide !== trials[i - 1].correctSide ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function hasImmediateDuplicateStimulus(trials: Trial[]): boolean {
  return trials.some((trial, i) => i > 0 && trial.stimulus === trials[i - 1].stimulus);
}

function categoryCounts(trials: Trial[]): Record<string, number> {
  const counts: Record<string, number> = {};
  trials.forEach((trial) => {
    counts[trial.category] = (counts[trial.category] ?? 0) + 1;
  });
  return counts;
}

describe('generateCombinedTrials', () => {
  it('produces the requested number of trials', () => {
    expect(combined(PAIRING_A, 26, 'A')).toHaveLength(26);
    expect(combined(PAIRING_A, 24, 'A')).toHaveLength(24);
    expect(combined(PAIRING_A, 28, 'A')).toHaveLength(28);
  });

  it('balances stimuli across all four categories to within one trial', () => {
    [24, 26, 28].forEach((count) => {
      const counts = categoryCounts(combined(PAIRING_A, count, 'A'));
      const values = Object.values(counts);
      expect(Object.keys(counts)).toHaveLength(4);
      expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
    });
  });

  it('maps each category to the correct response side for Pairing A', () => {
    combined(PAIRING_A, 26, 'A').forEach((trial) => {
      const expected = trial.category === 'targetA' || trial.category === 'attributeA' ? 'left' : 'right';
      expect(trial.correctSide).toBe(expected);
    });
  });

  it('maps each category to the correct response side for Pairing B', () => {
    combined(PAIRING_B, 26, 'B').forEach((trial) => {
      const expected = trial.category === 'targetB' || trial.category === 'attributeA' ? 'left' : 'right';
      expect(trial.correctSide).toBe(expected);
    });
  });

  it('never repeats the exact same stimulus twice in a row', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(hasImmediateDuplicateStimulus(combined(PAIRING_A, 26, 'A'))).toBe(false);
    }
  });

  it('never exceeds the configured maximum same-side run', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(longestSameSideRun(combined(PAIRING_A, 26, 'A'))).toBeLessThanOrEqual(maxSameSideRun);
    }
  });

  it('never exceeds the configured maximum alternating run', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(longestAlternatingRun(combined(PAIRING_A, 26, 'A'))).toBeLessThanOrEqual(maxAlternatingRun);
    }
  });

  it('keeps left and right responses balanced within one trial', () => {
    for (let run = 0; run < 25; run += 1) {
      const trials = combined(PAIRING_A, 26, 'A');
      const left = trials.filter((trial) => trial.correctSide === 'left').length;
      expect(Math.abs(left - (trials.length - left))).toBeLessThanOrEqual(1);
    }
  });

  it('tags every trial with the given block', () => {
    combined(PAIRING_B, 26, 'B').forEach((trial) => expect(trial.block).toBe('B'));
  });

  it('handles the short transition practice block', () => {
    for (let run = 0; run < 25; run += 1) {
      const trials = combined(PAIRING_A, ACTIVITY_CONFIG.transitionPracticeTrials, 'practice-transition');
      expect(trials).toHaveLength(ACTIVITY_CONFIG.transitionPracticeTrials);
      expect(longestSameSideRun(trials)).toBeLessThanOrEqual(maxSameSideRun);
      expect(hasImmediateDuplicateStimulus(trials)).toBe(false);
    }
  });

  it('gives every trial a unique id', () => {
    const trials = combined(PAIRING_A, 26, 'A');
    expect(new Set(trials.map((trial) => trial.id)).size).toBe(trials.length);
  });

  it('draws its words from the activity it is given, not a fixed list', () => {
    const custom = {
      targetA: ['Alpha'],
      targetB: ['Beta'],
      attributeA: ['Gamma'],
      attributeB: ['Delta'],
    };
    const trials = generateCombinedTrials(custom, PAIRING_A, 24, 'A');
    expect(new Set(trials.map((trial) => trial.stimulus))).toEqual(new Set(['Alpha', 'Beta', 'Gamma', 'Delta']));
  });
});

describe('practice trial generation', () => {
  it('only uses the two target categories for target practice', () => {
    const trials = generateTargetPracticeTrials(stimuli, ACTIVITY_CONFIG.practice.identityTrials, 'targetA');
    expect(new Set(trials.map((trial) => trial.category))).toEqual(new Set(['targetA', 'targetB']));
    trials.forEach((trial) => expect(trial.block).toBe('practice-identity'));
  });

  it('only uses the two attribute categories for attribute practice', () => {
    const trials = generateAttributePracticeTrials(stimuli, ACTIVITY_CONFIG.practice.competenceTrials, 'attributeB');
    expect(new Set(trials.map((trial) => trial.category))).toEqual(new Set(['attributeA', 'attributeB']));
    trials.forEach((trial) => expect(trial.block).toBe('practice-competence'));
  });

  it('respects the requested left category for target practice', () => {
    generateTargetPracticeTrials(stimuli, 8, 'targetB').forEach((trial) => {
      expect(trial.correctSide).toBe(trial.category === 'targetB' ? 'left' : 'right');
    });
    generateTargetPracticeTrials(stimuli, 8, 'targetA').forEach((trial) => {
      expect(trial.correctSide).toBe(trial.category === 'targetA' ? 'left' : 'right');
    });
  });

  it('respects the requested left category for attribute practice', () => {
    generateAttributePracticeTrials(stimuli, 8, 'attributeA').forEach((trial) => {
      expect(trial.correctSide).toBe(trial.category === 'attributeA' ? 'left' : 'right');
    });
  });

  it('keeps practice blocks within the sequencing limits', () => {
    for (let run = 0; run < RUNS; run += 1) {
      const trials = generateTargetPracticeTrials(stimuli, ACTIVITY_CONFIG.practice.identityTrials, 'targetA');
      expect(longestSameSideRun(trials)).toBeLessThanOrEqual(maxSameSideRun);
      expect(hasImmediateDuplicateStimulus(trials)).toBe(false);
    }
  });
});

describe('categoriesForPairing', () => {
  it('groups targetA with attributeA for Pairing A', () => {
    const { withTargetA, withTargetB } = categoriesForPairing('A');
    expect(withTargetA).toEqual(['targetA', 'attributeA']);
    expect(withTargetB).toEqual(['targetB', 'attributeB']);
  });

  it('swaps the attributes over for Pairing B', () => {
    const { withTargetA, withTargetB } = categoriesForPairing('B');
    expect(withTargetA).toEqual(['targetA', 'attributeB']);
    expect(withTargetB).toEqual(['targetB', 'attributeA']);
  });
});

describe('createSessionRandomisation', () => {
  it('always assigns the two pairings to the two rounds, in some order', () => {
    for (let run = 0; run < RUNS; run += 1) {
      const randomisation = createSessionRandomisation();
      expect(new Set([randomisation.round1.pairing, randomisation.round2.pairing])).toEqual(new Set(['A', 'B']));
      expect(randomisation.firstPairing).toBe(randomisation.round1.pairing);
    }
  });

  it('splits all four categories across left and right in every round', () => {
    for (let run = 0; run < RUNS; run += 1) {
      const randomisation = createSessionRandomisation();
      [randomisation.round1, randomisation.round2].forEach((assignment) => {
        expect(assignment.leftCategories).toHaveLength(2);
        expect(assignment.rightCategories).toHaveLength(2);
        expect(assignment.leftCategories.some((category) => assignment.rightCategories.includes(category))).toBe(false);
        expect(new Set([...assignment.leftCategories, ...assignment.rightCategories]).size).toBe(4);
      });
    }
  });

  it('always keeps the two targets on opposite sides', () => {
    for (let run = 0; run < RUNS; run += 1) {
      const randomisation = createSessionRandomisation();
      [randomisation.round1, randomisation.round2].forEach((assignment) => {
        const targetASide = assignment.leftCategories.includes('targetA') ? 'left' : 'right';
        const targetBSide = assignment.leftCategories.includes('targetB') ? 'left' : 'right';
        expect(targetASide).not.toBe(targetBSide);
      });
    }
  });

  it('varies which pairing comes first and which side categories land on', () => {
    const firstPairings = new Set<string>();
    const targetASides = new Set<string>();
    for (let run = 0; run < RUNS; run += 1) {
      const randomisation = createSessionRandomisation();
      firstPairings.add(randomisation.firstPairing);
      targetASides.add(randomisation.round1.leftCategories.includes('targetA') ? 'left' : 'right');
    }
    expect(firstPairings.size).toBe(2);
    expect(targetASides.size).toBe(2);
  });
});

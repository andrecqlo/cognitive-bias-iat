import { describe, expect, it } from 'vitest';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import {
  categoriesForPairing,
  createSessionRandomisation,
  generateCombinedTrials,
  generateCompetencePracticeTrials,
  generateIdentityPracticeTrials,
} from './generateTrials';
import type { SideAssignment, Trial } from '../types/activity';

const { maxSameSideRun, maxAlternatingRun } = ACTIVITY_CONFIG.sequencing;
const RUNS = 200;

const PAIRING_A: SideAssignment = {
  pairing: 'A',
  leftCategories: ['neurodivergent', 'incompetent'],
  rightCategories: ['neurotypical', 'competent'],
};

const PAIRING_B: SideAssignment = {
  pairing: 'B',
  leftCategories: ['neurotypical', 'incompetent'],
  rightCategories: ['neurodivergent', 'competent'],
};

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
    expect(generateCombinedTrials(PAIRING_A, 26, 'A')).toHaveLength(26);
    expect(generateCombinedTrials(PAIRING_A, 24, 'A')).toHaveLength(24);
    expect(generateCombinedTrials(PAIRING_A, 28, 'A')).toHaveLength(28);
  });

  it('balances stimuli across all four categories to within one trial', () => {
    [24, 26, 28].forEach((count) => {
      const counts = categoryCounts(generateCombinedTrials(PAIRING_A, count, 'A'));
      const values = Object.values(counts);
      expect(Object.keys(counts)).toHaveLength(4);
      expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
    });
  });

  it('maps each category to the correct response side for Pairing A', () => {
    generateCombinedTrials(PAIRING_A, 26, 'A').forEach((trial) => {
      const expected = trial.category === 'neurodivergent' || trial.category === 'incompetent' ? 'left' : 'right';
      expect(trial.correctSide).toBe(expected);
    });
  });

  it('maps each category to the correct response side for Pairing B', () => {
    generateCombinedTrials(PAIRING_B, 26, 'B').forEach((trial) => {
      const expected = trial.category === 'neurotypical' || trial.category === 'incompetent' ? 'left' : 'right';
      expect(trial.correctSide).toBe(expected);
    });
  });

  it('never repeats the exact same stimulus twice in a row', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(hasImmediateDuplicateStimulus(generateCombinedTrials(PAIRING_A, 26, 'A'))).toBe(false);
    }
  });

  it('never exceeds the configured maximum same-side run', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(longestSameSideRun(generateCombinedTrials(PAIRING_A, 26, 'A'))).toBeLessThanOrEqual(maxSameSideRun);
    }
  });

  it('never exceeds the configured maximum alternating run', () => {
    for (let run = 0; run < RUNS; run += 1) {
      expect(longestAlternatingRun(generateCombinedTrials(PAIRING_A, 26, 'A'))).toBeLessThanOrEqual(maxAlternatingRun);
    }
  });

  it('keeps left and right responses balanced within one trial', () => {
    for (let run = 0; run < 25; run += 1) {
      const trials = generateCombinedTrials(PAIRING_A, 26, 'A');
      const left = trials.filter((trial) => trial.correctSide === 'left').length;
      expect(Math.abs(left - (trials.length - left))).toBeLessThanOrEqual(1);
    }
  });

  it('tags every trial with the given block', () => {
    generateCombinedTrials(PAIRING_B, 26, 'B').forEach((trial) => expect(trial.block).toBe('B'));
  });

  it('handles the short transition practice block', () => {
    for (let run = 0; run < 25; run += 1) {
      const trials = generateCombinedTrials(PAIRING_A, ACTIVITY_CONFIG.transitionPracticeTrials, 'practice-transition');
      expect(trials).toHaveLength(ACTIVITY_CONFIG.transitionPracticeTrials);
      expect(longestSameSideRun(trials)).toBeLessThanOrEqual(maxSameSideRun);
      expect(hasImmediateDuplicateStimulus(trials)).toBe(false);
    }
  });

  it('gives every trial a unique id', () => {
    const trials = generateCombinedTrials(PAIRING_A, 26, 'A');
    expect(new Set(trials.map((trial) => trial.id)).size).toBe(trials.length);
  });
});

describe('practice trial generation', () => {
  it('only uses the two identity categories for identity practice', () => {
    const trials = generateIdentityPracticeTrials(ACTIVITY_CONFIG.practice.identityTrials, 'neurodivergent');
    expect(new Set(trials.map((trial) => trial.category))).toEqual(new Set(['neurodivergent', 'neurotypical']));
    trials.forEach((trial) => expect(trial.block).toBe('practice-identity'));
  });

  it('only uses the two competence categories for competence practice', () => {
    const trials = generateCompetencePracticeTrials(ACTIVITY_CONFIG.practice.competenceTrials, 'competent');
    expect(new Set(trials.map((trial) => trial.category))).toEqual(new Set(['competent', 'incompetent']));
    trials.forEach((trial) => expect(trial.block).toBe('practice-competence'));
  });

  it('respects the requested left category for identity practice', () => {
    generateIdentityPracticeTrials(8, 'neurotypical').forEach((trial) => {
      expect(trial.correctSide).toBe(trial.category === 'neurotypical' ? 'left' : 'right');
    });
    generateIdentityPracticeTrials(8, 'neurodivergent').forEach((trial) => {
      expect(trial.correctSide).toBe(trial.category === 'neurodivergent' ? 'left' : 'right');
    });
  });

  it('respects the requested left category for competence practice', () => {
    generateCompetencePracticeTrials(8, 'incompetent').forEach((trial) => {
      expect(trial.correctSide).toBe(trial.category === 'incompetent' ? 'left' : 'right');
    });
  });

  it('keeps practice blocks within the sequencing limits', () => {
    for (let run = 0; run < RUNS; run += 1) {
      const trials = generateIdentityPracticeTrials(ACTIVITY_CONFIG.practice.identityTrials, 'neurodivergent');
      expect(longestSameSideRun(trials)).toBeLessThanOrEqual(maxSameSideRun);
      expect(hasImmediateDuplicateStimulus(trials)).toBe(false);
    }
  });
});

describe('categoriesForPairing', () => {
  it('groups Neurodivergent with Incompetent for Pairing A', () => {
    const { withNeurodivergent, withNeurotypical } = categoriesForPairing('A');
    expect(withNeurodivergent).toEqual(['neurodivergent', 'incompetent']);
    expect(withNeurotypical).toEqual(['neurotypical', 'competent']);
  });

  it('groups Neurodivergent with Competent for Pairing B', () => {
    const { withNeurodivergent, withNeurotypical } = categoriesForPairing('B');
    expect(withNeurodivergent).toEqual(['neurodivergent', 'competent']);
    expect(withNeurotypical).toEqual(['neurotypical', 'incompetent']);
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

  it('always keeps Neurodivergent and Neurotypical on opposite sides', () => {
    for (let run = 0; run < RUNS; run += 1) {
      const randomisation = createSessionRandomisation();
      [randomisation.round1, randomisation.round2].forEach((assignment) => {
        const neurodivergentSide = assignment.leftCategories.includes('neurodivergent') ? 'left' : 'right';
        const neurotypicalSide = assignment.leftCategories.includes('neurotypical') ? 'left' : 'right';
        expect(neurodivergentSide).not.toBe(neurotypicalSide);
      });
    }
  });

  it('varies which pairing comes first and which side categories land on', () => {
    const firstPairings = new Set<string>();
    const neurodivergentSides = new Set<string>();
    for (let run = 0; run < RUNS; run += 1) {
      const randomisation = createSessionRandomisation();
      firstPairings.add(randomisation.firstPairing);
      neurodivergentSides.add(randomisation.round1.leftCategories.includes('neurodivergent') ? 'left' : 'right');
    }
    expect(firstPairings.size).toBe(2);
    expect(neurodivergentSides.size).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import { calculateResult, isUsableTrial, median, summariseRound } from './calculateResult';
import type { TrialRecord } from '../types/activity';

function makeTrial(overrides: Partial<TrialRecord>): TrialRecord {
  return {
    id: overrides.id ?? `trial-${Math.random()}`,
    stimulus: 'Skilled person',
    category: 'competent',
    correctSide: 'left',
    block: 'A',
    reactionTimeMs: 600,
    firstResponseCorrect: true,
    attempts: 1,
    interrupted: false,
    ...overrides,
  };
}

describe('median', () => {
  it('returns null for an empty array', () => {
    expect(median([])).toBeNull();
  });

  it('returns the middle value for an odd-length array', () => {
    expect(median([300, 100, 200])).toBe(200);
  });

  it('averages the two middle values for an even-length array', () => {
    expect(median([100, 200, 300, 400])).toBe(250);
  });
});

describe('isUsableTrial', () => {
  it('excludes trials with an incorrect first response', () => {
    expect(isUsableTrial(makeTrial({ firstResponseCorrect: false }))).toBe(false);
  });

  it('excludes interrupted trials', () => {
    expect(isUsableTrial(makeTrial({ interrupted: true }))).toBe(false);
  });

  it('excludes trials faster than the minimum valid reaction time', () => {
    expect(isUsableTrial(makeTrial({ reactionTimeMs: 100 }))).toBe(false);
  });

  it('excludes trials slower than the maximum valid reaction time', () => {
    expect(isUsableTrial(makeTrial({ reactionTimeMs: 6000 }))).toBe(false);
  });

  it('includes trials that meet every criterion', () => {
    expect(isUsableTrial(makeTrial({ reactionTimeMs: 700 }))).toBe(true);
  });
});

describe('summariseRound', () => {
  it('computes accuracy across all non-interrupted trials in the round', () => {
    const trials = [
      makeTrial({ block: 'A', firstResponseCorrect: true }),
      makeTrial({ block: 'A', firstResponseCorrect: false }),
      makeTrial({ block: 'B', firstResponseCorrect: false }),
    ];
    const summary = summariseRound(trials, 'A');
    expect(summary.totalTrials).toBe(2);
    expect(summary.accuracy).toBe(0.5);
  });

  it('ignores trials from the other round and other blocks', () => {
    const trials = [
      makeTrial({ block: 'A' }),
      makeTrial({ block: 'B' }),
      makeTrial({ block: 'practice-identity' }),
    ];
    const summary = summariseRound(trials, 'A');
    expect(summary.totalTrials).toBe(1);
  });

  it('excludes interrupted trials from the round entirely', () => {
    const trials = [makeTrial({ block: 'A', interrupted: true })];
    const summary = summariseRound(trials, 'A');
    expect(summary.totalTrials).toBe(0);
  });
});

describe('calculateResult', () => {
  function roundTrials(block: 'A' | 'B', reactionTimes: number[]): TrialRecord[] {
    return reactionTimes.map((reactionTimeMs) => makeTrial({ block, reactionTimeMs }));
  }

  it('reports fasterWithIncompetent when Pairing A is faster', () => {
    const trials = [
      ...roundTrials('A', Array(14).fill(500)),
      ...roundTrials('B', Array(14).fill(700)),
    ];
    const result = calculateResult(trials);
    expect(result.direction).toBe('fasterWithIncompetent');
    expect(result.percentageDifference).toBeGreaterThan(0);
  });

  it('reports fasterWithCompetent when Pairing B is faster', () => {
    const trials = [
      ...roundTrials('A', Array(14).fill(700)),
      ...roundTrials('B', Array(14).fill(500)),
    ];
    const result = calculateResult(trials);
    expect(result.direction).toBe('fasterWithCompetent');
  });

  it('reports similar when the difference is below the similarity threshold', () => {
    const trials = [
      ...roundTrials('A', Array(14).fill(600)),
      ...roundTrials('B', Array(14).fill(610)),
    ];
    const result = calculateResult(trials);
    expect(result.direction).toBe('similar');
  });

  it('flags the result as limited when usable trials fall below the threshold', () => {
    const trials = [
      ...roundTrials('A', Array(6).fill(500)),
      ...roundTrials('B', Array(14).fill(500)),
    ];
    const result = calculateResult(trials);
    expect(result.quality).toBe('limited');
    expect(result.qualityReasons.length).toBeGreaterThan(0);
  });

  it('flags the result as limited when accuracy falls below the threshold', () => {
    const accurate = roundTrials('A', Array(14).fill(500));
    const inaccurate = [
      ...roundTrials('B', Array(9).fill(500)),
      ...Array.from({ length: 5 }, () => makeTrial({ block: 'B', firstResponseCorrect: false, reactionTimeMs: 500 })),
    ];
    const result = calculateResult([...accurate, ...inaccurate]);
    expect(result.quality).toBe('limited');
  });

  it('reports reliable when both rounds have enough usable trials and good accuracy', () => {
    const trials = [
      ...roundTrials('A', Array(20).fill(500)),
      ...roundTrials('B', Array(20).fill(600)),
    ];
    const result = calculateResult(trials);
    expect(result.quality).toBe('reliable');
    expect(result.qualityReasons).toHaveLength(0);
  });
});

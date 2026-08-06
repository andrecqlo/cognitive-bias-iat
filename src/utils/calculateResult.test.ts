import { describe, expect, it } from 'vitest';
import { calculateResult, isUsableTrial, mean, standardDeviation, summariseRound } from './calculateResult';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import type { TrialRecord } from '../types/activity';

const { minUsableTrialsPerRound, minValidMs } = ACTIVITY_CONFIG.timing;
const WARM_UP = ACTIVITY_CONFIG.warmUpTrialsDropped;
const SCORED = ACTIVITY_CONFIG.scoredRoundTrials - WARM_UP;

function makeTrial(overrides: Partial<TrialRecord>): TrialRecord {
  return {
    id: overrides.id ?? `trial-${Math.random()}`,
    stimulus: 'Proficient',
    category: 'attributeB',
    correctSide: 'left',
    block: 'A',
    reactionTimeMs: 600,
    firstResponseCorrect: true,
    attempts: 1,
    interrupted: false,
    ...overrides,
  };
}

describe('mean', () => {
  it('returns null for an empty array', () => {
    expect(mean([])).toBeNull();
  });

  it('averages the values', () => {
    expect(mean([100, 200, 300])).toBe(200);
  });
});

describe('standardDeviation', () => {
  it('returns null below two values, where it is undefined', () => {
    expect(standardDeviation([])).toBeNull();
    expect(standardDeviation([500])).toBeNull();
  });

  it('returns zero when every value is identical', () => {
    expect(standardDeviation([500, 500, 500])).toBe(0);
  });

  it('uses the sample denominator', () => {
    // Deviations of -100 and +100: sum of squares 20000, over n-1 = 1.
    expect(standardDeviation([500, 700])).toBeCloseTo(Math.sqrt(20000), 6);
  });
});

describe('isUsableTrial', () => {
  it('keeps trials whose first response was wrong', () => {
    // The corrected time already carries the cost of the error, and these are
    // the trials where the pairing was hardest — the signal, not the noise.
    expect(isUsableTrial(makeTrial({ firstResponseCorrect: false }))).toBe(true);
  });

  it('excludes interrupted trials', () => {
    expect(isUsableTrial(makeTrial({ interrupted: true }))).toBe(false);
  });

  it('excludes responses faster than a person can read the word', () => {
    expect(isUsableTrial(makeTrial({ reactionTimeMs: minValidMs - 1 }))).toBe(false);
  });

  it('excludes responses slow enough to mean the participant stopped attending', () => {
    expect(isUsableTrial(makeTrial({ reactionTimeMs: ACTIVITY_CONFIG.timing.maxValidMs + 1 }))).toBe(false);
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
    const trials = [makeTrial({ block: 'A' }), makeTrial({ block: 'B' }), makeTrial({ block: 'practice-identity' })];
    expect(summariseRound(trials, 'A').totalTrials).toBe(1);
  });

  it('excludes interrupted trials from the round entirely', () => {
    expect(summariseRound([makeTrial({ block: 'A', interrupted: true })], 'A').totalTrials).toBe(0);
  });
});

describe('calculateResult', () => {
  /**
   * Evenly spaced reaction times around a mean. Constant times would give the
   * pooled standard deviation of zero, which makes any gap at all look like an
   * enormous D-score — real spread is what keeps these cases meaningful.
   */
  function spread(meanMs: number, count = SCORED, halfRangeMs = 100): number[] {
    const step = (halfRangeMs * 2) / (count - 1);
    return Array.from({ length: count }, (_unused, index) => meanMs - halfRangeMs + index * step);
  }

  /** A full round: warm-up trials at the mean, then the spread that gets scored. */
  function round(block: 'A' | 'B', meanMs: number, count = SCORED, halfRangeMs = 100): TrialRecord[] {
    const reactionTimes = [...Array(WARM_UP).fill(meanMs), ...spread(meanMs, count, halfRangeMs)];
    return reactionTimes.map((reactionTimeMs) => makeTrial({ block, reactionTimeMs }));
  }

  it('names attributeA when Pairing A is the quicker round', () => {
    const result = calculateResult([...round('A', 600), ...round('B', 660)]);
    expect(result.direction).toBe('fasterWithAttributeA');
    expect(result.dScore!).toBeLessThan(0);
  });

  it('names attributeB when Pairing B is the quicker round', () => {
    const result = calculateResult([...round('A', 660), ...round('B', 600)]);
    expect(result.direction).toBe('fasterWithAttributeB');
    expect(result.dScore!).toBeGreaterThan(0);
  });

  it('names no direction inside the little-or-none band', () => {
    const result = calculateResult([...round('A', 600), ...round('B', 605)]);
    expect(Math.abs(result.dScore!)).toBeLessThan(ACTIVITY_CONFIG.result.dScoreBands.slight);
    expect(result.direction).toBe('similar');
    expect(result.strength).toBeNull();
  });

  it.each([
    { label: 'slight', gap: 15, strength: 'slight' },
    { label: 'moderate', gap: 30, strength: 'moderate' },
    { label: 'strong', gap: 60, strength: 'strong' },
  ])('places a $label gap in the $strength band', ({ gap, strength }) => {
    const result = calculateResult([...round('A', 600), ...round('B', 600 + gap)]);
    expect(result.strength).toBe(strength);
  });

  it('scales the score by the participant’s own spread, not by milliseconds', () => {
    // Two people with the identical 30 ms gap. For the consistent responder
    // that gap is large next to their own variation; for the erratic one it
    // disappears into it. This is the whole reason a D-score exists, and the
    // reason no assumed spread is needed anywhere.
    const consistent = calculateResult([...round('A', 900, SCORED, 60), ...round('B', 930, SCORED, 60)]);
    const erratic = calculateResult([...round('A', 900, SCORED, 300), ...round('B', 930, SCORED, 300)]);

    expect(consistent.differenceMs).toBe(30);
    expect(erratic.differenceMs).toBe(30);
    expect(Math.abs(erratic.dScore!)).toBeLessThan(Math.abs(consistent.dScore!));
    // The same 30 ms drops from the top band to the bottom one on spread alone.
    expect(consistent.strength).toBe('strong');
    expect(erratic.strength).toBe('slight');
  });

  it('keeps the opening warm-up trials out of the score but inside accuracy', () => {
    const slowStart = [
      ...Array(WARM_UP).fill(3000),
      ...spread(600),
    ].map((reactionTimeMs) => makeTrial({ block: 'A', reactionTimeMs }));
    const result = calculateResult([...slowStart, ...round('B', 600)]);
    expect(result.pairingA.meanReactionTimeMs).toBeCloseTo(600, 6);
    expect(result.pairingA.scoredTrials).toBe(SCORED);
    expect(result.pairingA.totalTrials).toBe(SCORED + WARM_UP);
    expect(result.pairingA.accuracy).toBe(1);
  });

  it('flags the result when usable responses fall below the floor', () => {
    const result = calculateResult([
      ...round('A', 600, minUsableTrialsPerRound - 1),
      ...round('B', 600),
    ]);
    expect(result.quality).toBe('limited');
    expect(result.qualityReasons).toContain('Fewer usable responses than expected in one or both rounds.');
  });

  it('flags the result when accuracy falls below the floor', () => {
    const wrongTurns = round('B', 600).map((trial) => ({ ...trial, firstResponseCorrect: false }));
    const result = calculateResult([...round('A', 600), ...round('B', 600), ...wrongTurns]);
    expect(result.pairingB.accuracy!).toBeLessThan(ACTIVITY_CONFIG.timing.minAccuracy);
    expect(result.quality).toBe('limited');
    expect(result.qualityReasons).toContain('More wrong turns than expected in one or both rounds.');
  });

  it('flags the result when too many responses beat reading the word', () => {
    const rushed = round('A', 600).map((trial, index) =>
      index % 4 === 0 ? { ...trial, reactionTimeMs: minValidMs - 50 } : trial,
    );
    const result = calculateResult([...rushed, ...round('B', 600)]);
    expect(result.quality).toBe('limited');
    expect(result.qualityReasons).toContain('Many responses were too fast to be reactions to the word on screen.');
  });

  it('reports reliable when both rounds are complete and accurate', () => {
    const result = calculateResult([...round('A', 600), ...round('B', 660)]);
    expect(result.quality).toBe('reliable');
    expect(result.qualityReasons).toHaveLength(0);
  });

  it('returns no score at all when a round has no usable responses', () => {
    const result = calculateResult(round('A', 600));
    expect(result.dScore).toBeNull();
    expect(result.direction).toBe('similar');
    expect(result.strength).toBeNull();
  });
});

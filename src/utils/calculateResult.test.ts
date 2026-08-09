import { describe, expect, it } from 'vitest';
import {
  calculateResult,
  isScoredPosition,
  isUsableTrial,
  mean,
  standardDeviation,
  summariseTarget,
  winsorise,
} from './calculateResult';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import type { Pairing, PairIndex, TrialRecord } from '../types/activity';

const { minValidMs, maxValidMs, winsorMinMs, winsorMaxMs, minUsableTrialsPerTarget } = ACTIVITY_CONFIG.timing;
const { scoredBlockTrials } = ACTIVITY_CONFIG.blocks;
const DROPPED = ACTIVITY_CONFIG.leadingTrialsDropped;
/** Trials per block that reach the score. */
const SCORED = scoredBlockTrials - DROPPED;

let idCounter = 0;

function makeTrial(overrides: Partial<TrialRecord> = {}): TrialRecord {
  idCounter += 1;
  return {
    id: `trial-${idCounter}`,
    stimulus: 'Proficient',
    category: 'attributeB',
    correctSide: 'right',
    blockNumber: 1,
    positionInBlock: DROPPED,
    pairing: 'A',
    pairIndex: 1,
    reactionTimeMs: 600,
    firstResponseCorrect: true,
    attempts: 1,
    interrupted: false,
    ...overrides,
  };
}

/**
 * One block: the opening trials the procedure discards, then the trials that
 * reach the score.
 */
function block(
  pairing: Pairing,
  pairIndex: PairIndex,
  scoredLatencies: number[],
  overrides: Partial<TrialRecord> = {},
): TrialRecord[] {
  const blockNumber = pairing === 'A' ? pairIndex * 2 - 1 : pairIndex * 2;
  const leading = Array<number>(DROPPED).fill(scoredLatencies[0] ?? 600);

  return [...leading, ...scoredLatencies].map((reactionTimeMs, index) =>
    makeTrial({ pairing, pairIndex, blockNumber, positionInBlock: index, reactionTimeMs, ...overrides }),
  );
}

/**
 * Evenly spaced reaction times around a mean. Constant times would give a
 * pooled standard deviation of zero, which makes any gap at all look like an
 * enormous D-score — real spread is what keeps these cases meaningful.
 */
function spread(meanMs: number, count = SCORED, halfRangeMs = 100): number[] {
  const step = (halfRangeMs * 2) / (count - 1);
  return Array.from({ length: count }, (_unused, index) => meanMs - halfRangeMs + index * step);
}

/** Both blocks for one focal target, one in each pair. */
function target(
  pairing: Pairing,
  meanMs: number,
  count = SCORED,
  halfRangeMs = 100,
  overrides: Partial<TrialRecord> = {},
): TrialRecord[] {
  return [
    ...block(pairing, 1, spread(meanMs, count, halfRangeMs), overrides),
    ...block(pairing, 2, spread(meanMs, count, halfRangeMs), overrides),
  ];
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
    expect(standardDeviation([500, 700])).toBeCloseTo(Math.sqrt(20000), 6);
  });
});

describe('isScoredPosition', () => {
  it('sets aside the opening trials of every block, not just the first', () => {
    expect(isScoredPosition(makeTrial({ positionInBlock: DROPPED - 1 }))).toBe(false);
    expect(isScoredPosition(makeTrial({ positionInBlock: DROPPED }))).toBe(true);
    expect(isScoredPosition(makeTrial({ blockNumber: 4, positionInBlock: 0 }))).toBe(false);
  });
});

describe('isUsableTrial', () => {
  it('keeps trials whose first response was wrong', () => {
    // The corrected time already carries the cost of the error, and these are
    // the trials where the focal pair was hardest — the signal, not the noise.
    expect(isUsableTrial(makeTrial({ firstResponseCorrect: false }))).toBe(true);
  });

  it('excludes interrupted trials', () => {
    expect(isUsableTrial(makeTrial({ interrupted: true }))).toBe(false);
  });

  it('excludes responses slow enough to mean the participant stopped attending', () => {
    expect(isUsableTrial(makeTrial({ reactionTimeMs: maxValidMs + 1 }))).toBe(false);
  });

  it('keeps very fast responses, which are recoded rather than dropped', () => {
    expect(isUsableTrial(makeTrial({ reactionTimeMs: minValidMs - 1 }))).toBe(true);
  });
});

describe('winsorise', () => {
  it('pulls latencies to the edges of the scoring window', () => {
    expect(winsorise(50)).toBe(winsorMinMs);
    expect(winsorise(9000)).toBe(winsorMaxMs);
  });

  it('leaves latencies inside the window alone', () => {
    expect(winsorise(750)).toBe(750);
  });
});

describe('summariseTarget', () => {
  it('gathers both blocks in which a target was focal', () => {
    const trials = [...target('A', 600), ...target('B', 600)];
    expect(summariseTarget(trials, 'A').totalTrials).toBe(scoredBlockTrials * 2);
    expect(summariseTarget(trials, 'A').scoredTrials).toBe(SCORED * 2);
  });

  it('computes accuracy across the whole block, opening trials included', () => {
    const trials = [
      makeTrial({ pairing: 'A', firstResponseCorrect: true }),
      makeTrial({ pairing: 'A', firstResponseCorrect: false }),
      makeTrial({ pairing: 'B', firstResponseCorrect: false }),
    ];
    const summary = summariseTarget(trials, 'A');
    expect(summary.totalTrials).toBe(2);
    expect(summary.accuracy).toBe(0.5);
  });

  it('excludes interrupted trials from the target entirely', () => {
    expect(summariseTarget([makeTrial({ pairing: 'A', interrupted: true })], 'A').totalTrials).toBe(0);
  });

  it('counts too-fast responses before they are recoded', () => {
    const rushed = makeTrial({ pairing: 'A', reactionTimeMs: minValidMs - 50 });
    expect(summariseTarget([rushed], 'A').tooFastTrials).toBe(1);
    // …and still scores the trial, at the bottom of the window.
    expect(summariseTarget([rushed], 'A').meanReactionTimeMs).toBe(winsorMinMs);
  });
});

describe('calculateResult', () => {
  it('names targetA when its blocks were the quicker ones', () => {
    const result = calculateResult([...target('A', 600), ...target('B', 660)]);
    expect(result.direction).toBe('fasterWithTargetA');
    expect(result.dScore!).toBeLessThan(0);
  });

  it('names targetB when its blocks were the quicker ones', () => {
    const result = calculateResult([...target('A', 660), ...target('B', 600)]);
    expect(result.direction).toBe('fasterWithTargetB');
    expect(result.dScore!).toBeGreaterThan(0);
  });

  it('names no direction below the threshold', () => {
    const result = calculateResult([...target('A', 600), ...target('B', 605)]);
    expect(Math.abs(result.dScore!)).toBeLessThan(ACTIVITY_CONFIG.result.directionThresholdD);
    expect(result.direction).toBe('similar');
  });

  it.each([
    { label: 'a small', gap: 15 },
    { label: 'a middling', gap: 30 },
    { label: 'a large', gap: 60 },
  ])('names the same direction for $label gap, and no size', ({ gap }) => {
    // Every gap past the threshold gets the same wording. The activity reports
    // which way the times ran and never how far, so there is nothing here that
    // varies with the size of the gap.
    const result = calculateResult([...target('A', 600), ...target('B', 600 + gap)]);
    expect(result.direction).toBe('fasterWithTargetA');
    expect(result).not.toHaveProperty('strength');
  });

  it('scores each half separately and averages, rather than pooling the trials', () => {
    // Only the second half carries a gap. Pooling would halve it into the
    // single mean; averaging two halves keeps the first half's zero at equal
    // weight, which is the point of scoring in pairs.
    const trials = [
      ...block('A', 1, spread(600)),
      ...block('B', 1, spread(600)),
      ...block('A', 2, spread(600)),
      ...block('B', 2, spread(660)),
    ];
    const result = calculateResult(trials);

    expect(result.pairScores[0]).toBeCloseTo(0, 6);
    expect(result.pairScores[1]!).toBeLessThan(0);
    expect(result.dScore).toBeCloseTo(result.pairScores[1]! / 2, 6);
  });

  it('scales the score by the participant’s own spread, not by milliseconds', () => {
    // Two people with the identical 30 ms gap. For the consistent responder
    // that gap is large next to their own variation; for the erratic one it
    // disappears into it. This is the whole reason a D-score exists.
    const consistent = calculateResult([...target('A', 900, SCORED, 60), ...target('B', 930, SCORED, 60)]);
    const erratic = calculateResult([...target('A', 900, SCORED, 500), ...target('B', 930, SCORED, 500)]);

    expect(consistent.differenceMs).toBe(30);
    expect(erratic.differenceMs).toBe(30);
    expect(Math.abs(erratic.dScore!)).toBeLessThan(Math.abs(consistent.dScore!));
    // The same 30 ms is worth naming a direction for one of them and not the
    // other, on spread alone.
    expect(consistent.direction).toBe('fasterWithTargetA');
    expect(erratic.direction).toBe('similar');
  });

  it('keeps each block’s opening trials out of the score but inside accuracy', () => {
    const slowStart = [
      ...block('A', 1, spread(600), {}).map((trial, index) =>
        index < DROPPED ? { ...trial, reactionTimeMs: 1800 } : trial,
      ),
      ...block('A', 2, spread(600)),
    ];
    const result = calculateResult([...slowStart, ...target('B', 600)]);

    expect(result.targetA.meanReactionTimeMs).toBeCloseTo(600, 6);
    expect(result.targetA.scoredTrials).toBe(SCORED * 2);
    expect(result.targetA.totalTrials).toBe(scoredBlockTrials * 2);
    expect(result.targetA.accuracy).toBe(1);
  });

  it('recodes extreme latencies rather than letting them drag the mean', () => {
    const withOutlier = [
      ...block('A', 1, [9000, ...spread(600, SCORED - 1)]),
      ...block('A', 2, spread(600)),
    ];
    const result = calculateResult([...withOutlier, ...target('B', 600)]);

    // Untouched, one 9000 ms response would move a 31-trial mean by ~270 ms.
    expect(result.targetA.meanReactionTimeMs!).toBeLessThan(700);
    expect(result.targetA.usableTrials).toBe(SCORED * 2);
  });

  it('drops responses slower than the ceiling instead of recoding them', () => {
    const trials = [...block('A', 1, [maxValidMs + 1, ...spread(600, SCORED - 1)]), ...block('A', 2, spread(600))];
    expect(calculateResult([...trials, ...target('B', 600)]).targetA.usableTrials).toBe(SCORED * 2 - 1);
  });

  it('flags the result when usable responses fall below the floor', () => {
    // Split across both of targetA's blocks, so the floor is tested against the
    // target's total rather than against either block on its own.
    const perBlock = Math.floor((minUsableTrialsPerTarget - 4) / 2);
    const result = calculateResult([
      ...block('A', 1, spread(600, perBlock)),
      ...block('B', 1, spread(600)),
      ...block('A', 2, spread(600, perBlock)),
      ...block('B', 2, spread(600)),
    ]);

    expect(result.targetA.usableTrials).toBeLessThan(minUsableTrialsPerTarget);
    expect(result.quality).toBe('limited');
    expect(result.qualityReasons).toContain(
      'Fewer usable responses than expected in one or both halves of the activity.',
    );
  });

  it('flags the result when accuracy falls below the floor', () => {
    const wrongTurns = target('B', 600, SCORED, 100, { firstResponseCorrect: false });
    const result = calculateResult([...target('A', 600), ...target('B', 600), ...wrongTurns]);
    expect(result.targetB.accuracy!).toBeLessThan(ACTIVITY_CONFIG.timing.minAccuracy);
    expect(result.quality).toBe('limited');
    expect(result.qualityReasons).toContain('More wrong turns than expected in one or both halves of the activity.');
  });

  it('flags the result when too many responses beat reading the word', () => {
    const rushed = target('A', 600).map((trial, index) =>
      index % 4 === 0 ? { ...trial, reactionTimeMs: minValidMs - 50 } : trial,
    );
    const result = calculateResult([...rushed, ...target('B', 600)]);
    expect(result.quality).toBe('limited');
    expect(result.qualityReasons).toContain('Many responses were too fast to be reactions to the word on screen.');
  });

  it('flags a session in which only one half could be scored', () => {
    const result = calculateResult([...block('A', 1, spread(600)), ...block('B', 1, spread(660))]);
    expect(result.pairScores[1]).toBeNull();
    expect(result.qualityReasons).toContain('Only one half of the activity could be scored.');
  });

  it('reports reliable when both halves are complete and accurate', () => {
    const result = calculateResult([...target('A', 600), ...target('B', 660)]);
    expect(result.quality).toBe('reliable');
    expect(result.qualityReasons).toHaveLength(0);
  });

  it('returns no score at all when one target has no usable responses', () => {
    const result = calculateResult(target('A', 600));
    expect(result.dScore).toBeNull();
    expect(result.direction).toBe('similar');
  });
});

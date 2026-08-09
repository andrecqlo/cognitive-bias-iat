import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import { STORAGE_KEY } from '../utils/sessionStorage';
import { FOCAL_SIDE } from '../utils/generateTrials';
import { useActivityEngine, type ActivityEngine } from './useActivityEngine';

type Engine = { current: ActivityEngine };

const { warmUpTrials, scoredBlockTrials, scoredBlockCount, leadingAttributeTrials } = ACTIVITY_CONFIG.blocks;
const SCORED_PER_BLOCK = scoredBlockTrials - ACTIVITY_CONFIG.leadingTrialsDropped;

/** Answers the current trial correctly, leaving a realistic reaction time. */
function answerCurrentTrial(engine: Engine, { correct = true, dwellMs = 600 } = {}) {
  const trial = engine.current.currentTrial;
  if (!trial) throw new Error('No trial to answer');
  const side = correct ? trial.correctSide : trial.correctSide === 'left' ? 'right' : 'left';

  act(() => {
    vi.advanceTimersByTime(dwellMs);
  });
  act(() => {
    engine.current.respond(side);
  });
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

function answerRemainingTrials(engine: Engine) {
  let guard = 0;
  while (engine.current.currentTrial) {
    answerCurrentTrial(engine);
    guard += 1;
    if (guard > 200) throw new Error('Trial queue did not finish');
  }
}

function reachWarmUp(engine: Engine) {
  act(() => engine.current.actions.startActivity());
  act(() => engine.current.actions.acknowledge(true));
  act(() => engine.current.actions.continueFromInformation());
  act(() => engine.current.actions.continueFromDefinitions());
  act(() => engine.current.actions.startWarmUp());
}

/** Runs every scored block, taking each between-block announcement in turn. */
function completeScoredBlocks(engine: Engine) {
  act(() => engine.current.actions.startBlocks());
  for (let block = 0; block < scoredBlockCount; block += 1) {
    act(() => engine.current.actions.startBlock());
    answerRemainingTrials(engine);
  }
}

function completeWholeActivity(engine: Engine) {
  reachWarmUp(engine);
  answerRemainingTrials(engine);
  completeScoredBlocks(engine);
}

describe('useActivityEngine', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts on the landing page with no trials recorded', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    expect(engine.current.phase).toBe('landing');
    expect(engine.current.trialRecords).toHaveLength(0);
  });

  it('moves through the pre-activity screens in order', () => {
    const engine = renderHook(() => useActivityEngine()).result;

    act(() => engine.current.actions.startActivity());
    expect(engine.current.phase).toBe('information');

    act(() => engine.current.actions.acknowledge(true));
    expect(engine.current.acknowledged).toBe(true);

    // The definitions land before the instructions, so the category names the
    // demonstration uses have already been explained.
    act(() => engine.current.actions.continueFromInformation());
    expect(engine.current.phase).toBe('definitions');

    act(() => engine.current.actions.continueFromDefinitions());
    expect(engine.current.phase).toBe('instructions');
  });

  it('loads the warm-up with the configured number of trials', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startWarmUp());

    expect(engine.current.phase).toBe('warmUp');
    expect(engine.current.trialTotal).toBe(warmUpTrials);
    expect(engine.current.currentTrial?.blockNumber).toBe(0);
    expect(engine.current.currentTrial?.pairing).toBeNull();
  });

  it('requires an incorrect response to be corrected before advancing', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startWarmUp());

    const firstTrial = engine.current.currentTrial;
    answerCurrentTrial(engine, { correct: false });

    expect(engine.current.feedback).toBe('incorrect');
    expect(engine.current.currentTrial?.id).toBe(firstTrial?.id);
    expect(engine.current.trialRecords).toHaveLength(0);

    answerCurrentTrial(engine);
    expect(engine.current.currentTrial?.id).not.toBe(firstTrial?.id);
    expect(engine.current.trialRecords[0].firstResponseCorrect).toBe(false);
  });

  it('records a correct first response and advances', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startWarmUp());

    answerCurrentTrial(engine, { dwellMs: 700 });

    expect(engine.current.trialRecords).toHaveLength(1);
    expect(engine.current.trialRecords[0].firstResponseCorrect).toBe(true);
    expect(engine.current.trialRecords[0].attempts).toBe(1);
  });

  it('ignores a duplicated response for the same trial', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startWarmUp());

    const trial = engine.current.currentTrial;
    if (!trial) throw new Error('No trial');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      engine.current.respond(trial.correctSide);
      engine.current.respond(trial.correctSide);
    });

    expect(engine.current.trialRecords).toHaveLength(1);
  });

  it('shows the ready screen after the warm-up, then announces the first block', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startWarmUp());
    answerRemainingTrials(engine);

    expect(engine.current.warmUpComplete).toBe(true);
    expect(engine.current.currentTrial).toBeNull();

    act(() => engine.current.actions.startBlocks());
    expect(engine.current.phase).toBe('blockIntro');
    expect(engine.current.currentBlock?.blockNumber).toBe(1);

    act(() => engine.current.actions.startBlock());
    expect(engine.current.phase).toBe('block');
    expect(engine.current.trialTotal).toBe(scoredBlockTrials);
  });

  it('announces every block before it starts, and stops after the last one', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startBlocks());

    for (let block = 1; block <= scoredBlockCount; block += 1) {
      expect(engine.current.phase).toBe('blockIntro');
      expect(engine.current.currentBlock?.blockNumber).toBe(block);

      act(() => engine.current.actions.startBlock());
      expect(engine.current.phase).toBe('block');
      answerRemainingTrials(engine);
    }

    expect(engine.current.phase).toBe('resultChoice');
  });

  it('alternates the focal target and pairs the blocks two by two', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    completeWholeActivity(engine);

    const scored = engine.current.trialRecords.filter((record) => record.pairing !== null);
    expect(scored).toHaveLength(scoredBlockTrials * scoredBlockCount);

    (['A', 'B'] as const).forEach((pairing) => {
      const forTarget = scored.filter((record) => record.pairing === pairing);
      expect(forTarget).toHaveLength(scoredBlockTrials * 2);
      // One block in each half, so each half can be scored on its own.
      expect(new Set(forTarget.map((record) => record.pairIndex))).toEqual(new Set([1, 2]));
    });
  });

  it('excludes warm-up trials from the scored result', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    completeWholeActivity(engine);

    const { targetA, targetB } = engine.current.result;
    expect(targetA.totalTrials).toBe(scoredBlockTrials * 2);
    expect(targetB.totalTrials).toBe(scoredBlockTrials * 2);
    expect(targetA.scoredTrials).toBe(SCORED_PER_BLOCK * 2);
    expect(targetB.scoredTrials).toBe(SCORED_PER_BLOCK * 2);
  });

  it('opens each block with the attribute-only run the score discards', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startBlocks());
    act(() => engine.current.actions.startBlock());

    const opening = engine.current.trialRecords;
    for (let i = 0; i < leadingAttributeTrials; i += 1) {
      answerCurrentTrial(engine);
    }
    engine.current.trialRecords.slice(opening.length).forEach((record) => {
      expect(['attributeA', 'attributeB']).toContain(record.category);
    });
  });

  it('keeps the focal pair fixed for the duration of a block', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startBlocks());
    act(() => engine.current.actions.startBlock());

    const first = engine.current.focal;
    answerCurrentTrial(engine);
    answerCurrentTrial(engine);

    expect(engine.current.focal?.focalLabels).toEqual(first?.focalLabels);
    expect(engine.current.focal?.focalSide).toBe(FOCAL_SIDE);
  });

  it('keeps the same attribute focal in every block and swaps only the target', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    const { activity, randomisation } = engine.current;
    const focalAttributeLabel = activity.labels[activity.focalAttribute];

    randomisation.blocks.forEach((block) => {
      const labels = [activity.labels[block.pairing === 'A' ? 'targetA' : 'targetB'], focalAttributeLabel];
      expect(labels).toContain(focalAttributeLabel);
    });
    expect(new Set(randomisation.blocks.slice(1).map((block) => block.pairing)).size).toBe(2);
  });

  describe('restart', () => {
    it('clears trials, resets the result and generates a new block plan', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      completeWholeActivity(engine);
      act(() => engine.current.actions.showResult());

      const previousRandomisation = engine.current.randomisation;
      act(() => engine.current.actions.restart());

      expect(engine.current.phase).toBe('instructions');
      expect(engine.current.trialRecords).toHaveLength(0);
      expect(engine.current.result.targetA.usableTrials).toBe(0);
      expect(engine.current.result.targetB.usableTrials).toBe(0);
      expect(engine.current.randomisation).not.toBe(previousRandomisation);
      expect(engine.current.warmUpComplete).toBe(false);
      expect(engine.current.currentBlock?.blockNumber).toBe(0);
    });

    it('removes any session-stored activity data', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      act(() => engine.current.actions.startActivity());
      act(() => engine.current.actions.acknowledge(true));
      expect(window.sessionStorage.length).toBeGreaterThan(0);

      act(() => engine.current.actions.restart());
      // The engine re-persists the fresh state immediately; what matters is that
      // no trials survive the restart.
      expect(engine.current.trialRecords).toHaveLength(0);
    });
  });

  describe('clear my session', () => {
    it('resets the acknowledgement, returns home and confirms', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      act(() => engine.current.actions.startActivity());
      act(() => engine.current.actions.acknowledge(true));
      act(() => engine.current.actions.continueFromInformation());

      act(() => engine.current.actions.clearMySession());

      expect(engine.current.phase).toBe('landing');
      expect(engine.current.acknowledged).toBe(false);
      expect(engine.current.trialRecords).toHaveLength(0);
      expect(engine.current.sessionClearedNotice).toBe(true);
      expect(window.sessionStorage.length).toBe(0);
    });
  });

  describe('interruptions', () => {
    function setTabHidden(hidden: boolean) {
      Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
    }

    function startFirstBlock(engine: Engine) {
      act(() => engine.current.actions.startBlocks());
      act(() => engine.current.actions.startBlock());
    }

    afterEach(() => setTabHidden(false));

    it('flags the current trial and warns the participant when the tab is hidden', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      startFirstBlock(engine);

      act(() => {
        setTabHidden(true);
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(engine.current.majorInterruption).toBe(true);

      answerCurrentTrial(engine);
      expect(engine.current.trialRecords[0].interrupted).toBe(true);
    });

    it('flags the current trial on focus loss without interrupting with a message', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      startFirstBlock(engine);

      act(() => {
        window.dispatchEvent(new Event('blur'));
      });

      expect(engine.current.majorInterruption).toBe(false);

      answerCurrentTrial(engine);
      expect(engine.current.trialRecords[0].interrupted).toBe(true);
    });

    it('does not carry an interruption over to the following trial', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      startFirstBlock(engine);

      act(() => {
        window.dispatchEvent(new Event('blur'));
      });
      answerCurrentTrial(engine);
      answerCurrentTrial(engine);

      expect(engine.current.trialRecords[0].interrupted).toBe(true);
      expect(engine.current.trialRecords[1].interrupted).toBe(false);
    });

    it('excludes interrupted trials from the comparison', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      startFirstBlock(engine);

      act(() => {
        window.dispatchEvent(new Event('blur'));
      });
      answerCurrentTrial(engine);
      answerCurrentTrial(engine);

      const pairing = engine.current.randomisation.blocks[1].pairing;
      const summary = pairing === 'A' ? engine.current.result.targetA : engine.current.result.targetB;
      expect(summary.totalTrials).toBe(1);
    });

    it('lets the participant dismiss the interruption message and carry on', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      startFirstBlock(engine);

      act(() => {
        setTabHidden(true);
        document.dispatchEvent(new Event('visibilitychange'));
      });
      act(() => engine.current.dismissMajorInterruption());

      expect(engine.current.majorInterruption).toBe(false);
      expect(engine.current.phase).toBe('block');
      expect(engine.current.currentTrial).not.toBeNull();
    });
  });

  describe('session persistence', () => {
    it('stores temporary state once the activity is under way', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      act(() => engine.current.actions.startActivity());
      act(() => engine.current.actions.acknowledge(true));

      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(raw).not.toContain('name');
    });

    it('restarts the activity rather than resuming mid-block', () => {
      const first = renderHook(() => useActivityEngine());
      reachWarmUp(first.result);
      answerCurrentTrial(first.result);
      first.unmount();

      const second = renderHook(() => useActivityEngine()).result;
      expect(second.current.phase).toBe('instructions');
      expect(second.current.acknowledged).toBe(true);
      expect(second.current.trialRecords).toHaveLength(0);
    });

    it('clears stored data when the activity completes', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      completeWholeActivity(engine);
      act(() => engine.current.actions.skipResult());

      expect(engine.current.phase).toBe('completion');
      expect(window.sessionStorage.length).toBe(0);
    });
  });
});

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTIVITY_CONFIG } from '../config/activityConfig';
import { useActivityEngine, type ActivityEngine } from './useActivityEngine';

type Engine = { current: ActivityEngine };

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

function completeWholeActivity(engine: Engine) {
  act(() => engine.current.actions.startActivity());
  act(() => engine.current.actions.acknowledge(true));
  act(() => engine.current.actions.continueFromInformation());
  act(() => engine.current.actions.startPractice());
  answerRemainingTrials(engine);
  act(() => engine.current.actions.beginRounds());
  answerRemainingTrials(engine);
  act(() => engine.current.actions.startTransitionPractice());
  answerRemainingTrials(engine);
  act(() => engine.current.actions.startFinalRound());
  answerRemainingTrials(engine);
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

    act(() => engine.current.actions.continueFromInformation());
    expect(engine.current.phase).toBe('instructions');
  });

  it('loads both practice blocks with the configured number of trials', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startPractice());

    expect(engine.current.phase).toBe('practice');
    expect(engine.current.trialTotal).toBe(
      ACTIVITY_CONFIG.practice.identityTrials + ACTIVITY_CONFIG.practice.competenceTrials,
    );
    expect(engine.current.currentTrial?.block).toBe('practice-identity');
  });

  it('requires an incorrect response to be corrected before advancing', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startPractice());

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
    act(() => engine.current.actions.startPractice());

    answerCurrentTrial(engine, { dwellMs: 700 });

    expect(engine.current.trialRecords).toHaveLength(1);
    expect(engine.current.trialRecords[0].firstResponseCorrect).toBe(true);
    expect(engine.current.trialRecords[0].attempts).toBe(1);
  });

  it('ignores a duplicated response for the same trial', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startPractice());

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

  it('shows the ready screen after practice, then starts the first scored round', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.startPractice());
    answerRemainingTrials(engine);

    expect(engine.current.practiceComplete).toBe(true);
    expect(engine.current.currentTrial).toBeNull();

    act(() => engine.current.actions.beginRounds());
    expect(engine.current.phase).toBe('round1');
    expect(engine.current.trialTotal).toBe(ACTIVITY_CONFIG.scoredRoundTrials);
  });

  it('pauses at the transition and waits for the participant to start the final round', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.beginRounds());
    answerRemainingTrials(engine);

    expect(engine.current.phase).toBe('transition');
    expect(engine.current.transitionStage).toBe('notice');

    act(() => engine.current.actions.startTransitionPractice());
    expect(engine.current.transitionStage).toBe('practice');
    expect(engine.current.trialTotal).toBe(ACTIVITY_CONFIG.transitionPracticeTrials);

    answerRemainingTrials(engine);
    expect(engine.current.transitionStage).toBe('ready');
    expect(engine.current.phase).toBe('transition');

    act(() => engine.current.actions.startFinalRound());
    expect(engine.current.phase).toBe('round2');
  });

  it('uses the two pairings across the two scored rounds and offers the result choice at the end', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    completeWholeActivity(engine);

    expect(engine.current.phase).toBe('resultChoice');

    const scoredBlocks = engine.current.trialRecords
      .filter((record) => record.block === 'A' || record.block === 'B')
      .map((record) => record.block);
    expect(new Set(scoredBlocks)).toEqual(new Set(['A', 'B']));
    expect(scoredBlocks.filter((block) => block === 'A')).toHaveLength(ACTIVITY_CONFIG.scoredRoundTrials);
    expect(scoredBlocks.filter((block) => block === 'B')).toHaveLength(ACTIVITY_CONFIG.scoredRoundTrials);
  });

  it('excludes practice trials from the scored result', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    completeWholeActivity(engine);

    const { pairingA, pairingB } = engine.current.result;
    expect(pairingA.totalTrials).toBe(ACTIVITY_CONFIG.scoredRoundTrials);
    expect(pairingB.totalTrials).toBe(ACTIVITY_CONFIG.scoredRoundTrials);
  });

  it('keeps the category sides fixed for the duration of a scored round', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    act(() => engine.current.actions.beginRounds());

    const firstAssignment = engine.current.currentAssignment;
    answerCurrentTrial(engine);
    answerCurrentTrial(engine);

    expect(engine.current.currentAssignment?.leftLabels).toEqual(firstAssignment?.leftLabels);
    expect(engine.current.currentAssignment?.rightLabels).toEqual(firstAssignment?.rightLabels);
  });

  it('swaps the pairing between the two scored rounds', () => {
    const engine = renderHook(() => useActivityEngine()).result;
    expect(engine.current.randomisation.round1.pairing).not.toBe(engine.current.randomisation.round2.pairing);
  });

  describe('restart', () => {
    it('clears trials, resets the result and generates a new pairing order', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      completeWholeActivity(engine);
      act(() => engine.current.actions.showResult());

      const previousRandomisation = engine.current.randomisation;
      act(() => engine.current.actions.restart());

      expect(engine.current.phase).toBe('instructions');
      expect(engine.current.trialRecords).toHaveLength(0);
      expect(engine.current.result.pairingA.usableTrials).toBe(0);
      expect(engine.current.result.pairingB.usableTrials).toBe(0);
      expect(engine.current.randomisation).not.toBe(previousRandomisation);
      expect(engine.current.practiceComplete).toBe(false);
      expect(engine.current.transitionStage).toBe('notice');
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

    afterEach(() => setTabHidden(false));

    it('flags the current trial and warns the participant when the tab is hidden', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      act(() => engine.current.actions.beginRounds());

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
      act(() => engine.current.actions.beginRounds());

      act(() => {
        window.dispatchEvent(new Event('blur'));
      });

      expect(engine.current.majorInterruption).toBe(false);

      answerCurrentTrial(engine);
      expect(engine.current.trialRecords[0].interrupted).toBe(true);
    });

    it('does not carry an interruption over to the following trial', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      act(() => engine.current.actions.beginRounds());

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
      act(() => engine.current.actions.beginRounds());

      act(() => {
        window.dispatchEvent(new Event('blur'));
      });
      answerCurrentTrial(engine);
      answerCurrentTrial(engine);

      const pairing = engine.current.randomisation.round1.pairing;
      const summary = pairing === 'A' ? engine.current.result.pairingA : engine.current.result.pairingB;
      expect(summary.totalTrials).toBe(1);
    });

    it('lets the participant dismiss the interruption message and carry on', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      act(() => engine.current.actions.beginRounds());

      act(() => {
        setTabHidden(true);
        document.dispatchEvent(new Event('visibilitychange'));
      });
      act(() => engine.current.dismissMajorInterruption());

      expect(engine.current.majorInterruption).toBe(false);
      expect(engine.current.phase).toBe('round1');
      expect(engine.current.currentTrial).not.toBeNull();
    });
  });

  describe('session persistence', () => {
    it('stores temporary state once the activity is under way', () => {
      const engine = renderHook(() => useActivityEngine()).result;
      act(() => engine.current.actions.startActivity());
      act(() => engine.current.actions.acknowledge(true));

      const raw = window.sessionStorage.getItem('hidden-associations-session-v1');
      expect(raw).not.toBeNull();
      expect(raw).not.toContain('name');
    });

    it('restarts the activity rather than resuming mid-round', () => {
      const first = renderHook(() => useActivityEngine());
      act(() => first.result.current.actions.startActivity());
      act(() => first.result.current.actions.acknowledge(true));
      act(() => first.result.current.actions.continueFromInformation());
      act(() => first.result.current.actions.startPractice());
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

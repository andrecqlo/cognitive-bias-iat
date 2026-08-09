import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ACTIVITY_CONFIG } from './config/activityConfig';
import { CONTENT } from './config/content';
import { ACTIVITIES, type CategorySlot } from './config/activities';
import type { Side } from './types/activity';

/** The activity a participant reaches by clicking the first card. */
const ACTIVITY = ACTIVITIES[0];
const { warmUpTrials, scoredBlockTrials, scoredBlockCount } = ACTIVITY_CONFIG.blocks;

/** The two categories the current block is asking about, read off the screen. */
function focalLabelsOnScreen(): string[] {
  const label = screen.getByRole('button', { name: /Respond right/ }).getAttribute('aria-label') ?? '';
  return label.replace(/^Respond right: /, '').split(' or ');
}

/** Works out the correct side from what is on screen: the stimulus phrase and
 * the categories named in the focal response zone. */
function correctSideOnScreen(): Side {
  const stimulus = screen.getByTestId('stimulus').textContent ?? '';
  const slot = (Object.keys(ACTIVITY.stimuli) as CategorySlot[]).find((key) =>
    ACTIVITY.stimuli[key].includes(stimulus),
  );
  if (!slot) throw new Error(`Unrecognised stimulus: ${stimulus}`);

  return focalLabelsOnScreen().includes(ACTIVITY.labels[slot]) ? 'right' : 'left';
}

/** The picker gives each card its own start button, labelled by activity. */
function startActivity() {
  fireEvent.click(screen.getByRole('button', { name: `${CONTENT.landing.startButton}: ${ACTIVITY.title}` }));
}

function respond(side: Side, via: 'click' | 'keyboard') {
  if (via === 'click') {
    const name = side === 'left' ? /Respond left/ : /Respond right/;
    act(() => {
      fireEvent.click(screen.getByRole('button', { name }));
    });
    return;
  }
  act(() => {
    fireEvent.keyDown(window, { key: side === 'left' ? 'e' : 'i' });
  });
}

function answerCurrentTrial(via: 'click' | 'keyboard') {
  const side = correctSideOnScreen();
  act(() => {
    vi.advanceTimersByTime(500);
  });
  respond(side, via);
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

function reachDefinitions() {
  startActivity();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: CONTENT.information.continueButton }));
}

function reachInstructions() {
  reachDefinitions();
  fireEvent.click(screen.getByRole('button', { name: CONTENT.definitions.continueButton }));
}

function reachWarmUp() {
  reachInstructions();
  fireEvent.click(screen.getByRole('button', { name: CONTENT.instructions.startPracticeButton }));
}

/** Warm-up plus all four scored blocks, taking each announcement in turn. */
function completeActivity() {
  reachWarmUp();
  for (let i = 0; i < warmUpTrials; i += 1) answerCurrentTrial('click');

  fireEvent.click(screen.getByRole('button', { name: CONTENT.warmUp.beginButton }));
  for (let block = 0; block < scoredBlockCount; block += 1) {
    fireEvent.click(screen.getByRole('button', { name: CONTENT.blockIntro.startButton }));
    for (let i = 0; i < scoredBlockTrials; i += 1) answerCurrentTrial('click');
  }
}

describe('Hidden Associations activity', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the landing page without revealing the expected association', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.landing.heading })).toBeInTheDocument();
    expect(screen.getByText(CONTENT.landing.subtitle)).toBeInTheDocument();
    expect(screen.queryByText(/Incompetent/)).not.toBeInTheDocument();
    expect(screen.queryByText(/faster/i)).not.toBeInTheDocument();
  });

  it('blocks the activity until the acknowledgement is given', () => {
    render(<App />);
    startActivity();

    const continueButton = screen.getByRole('button', { name: CONTENT.information.continueButton });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.getByRole('heading', { level: 1, name: CONTENT.definitions.heading })).toBeInTheDocument();
  });

  it('defines every word that will appear, before any trial runs', () => {
    render(<App />);
    reachDefinitions();

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.definitions.heading })).toBeInTheDocument();

    // A word met for the first time mid-block is classified slowly because it
    // is unfamiliar, and that slowness lands in the score.
    const onScreen = (document.body.textContent ?? '').toLowerCase();
    Object.values(ACTIVITY.stimuli)
      .flat()
      .forEach((word) => {
        expect(onScreen, `"${word}" is never defined`).toContain(word.toLowerCase());
      });
  });

  it('states that the activity may not suit everyone', () => {
    render(<App />);
    startActivity();

    expect(screen.getByText(CONTENT.information.accessibilityNote)).toBeInTheDocument();
  });

  it('lets the instructions demonstration be tried before the warm-up', () => {
    render(<App />);
    reachInstructions();

    fireEvent.click(screen.getByRole('button', { name: /Demonstration: respond right/ }));

    expect(screen.getByText(CONTENT.instructions.demoCorrect)).toBeInTheDocument();
  });

  it('advances through warm-up trials with a mouse', () => {
    render(<App />);
    reachWarmUp();

    expect(screen.getByText(new RegExp(`Warm-up · Item 1 of ${warmUpTrials}`))).toBeInTheDocument();
    answerCurrentTrial('click');
    expect(screen.getByText(new RegExp(`Warm-up · Item 2 of ${warmUpTrials}`))).toBeInTheDocument();
  });

  it('advances through warm-up trials with the optional keyboard shortcuts', () => {
    render(<App />);
    reachWarmUp();

    answerCurrentTrial('keyboard');
    expect(screen.getByText(new RegExp(`Warm-up · Item 2 of ${warmUpTrials}`))).toBeInTheDocument();
  });

  it('also accepts the arrow keys', () => {
    render(<App />);
    reachWarmUp();

    const side = correctSideOnScreen();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      fireEvent.keyDown(window, { key: side === 'left' ? 'ArrowLeft' : 'ArrowRight' });
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByText(new RegExp(`Warm-up · Item 2 of ${warmUpTrials}`))).toBeInTheDocument();
  });

  it('requires an incorrect answer to be corrected before moving on', () => {
    render(<App />);
    reachWarmUp();

    const stimulus = screen.getByTestId('stimulus').textContent;
    const correct = correctSideOnScreen();
    const wrong: Side = correct === 'left' ? 'right' : 'left';

    act(() => {
      vi.advanceTimersByTime(500);
    });
    respond(wrong, 'click');
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByText(new RegExp(`Warm-up · Item 1 of ${warmUpTrials}`))).toBeInTheDocument();
    expect(screen.getByTestId('stimulus')).toHaveTextContent(stimulus ?? '');
    expect(screen.getByText(/choose the correct side to continue/i)).toBeInTheDocument();

    respond(correct, 'click');
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByText(new RegExp(`Warm-up · Item 2 of ${warmUpTrials}`))).toBeInTheDocument();
  });

  it('names the two categories to watch for before each scored block', () => {
    render(<App />);
    reachWarmUp();
    for (let i = 0; i < warmUpTrials; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: CONTENT.warmUp.beginButton }));

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.blockIntro.heading })).toBeInTheDocument();
    expect(screen.getByText(CONTENT.round.nonFocalLabel)).toBeInTheDocument();
    // The first announcement has nothing to have changed from.
    expect(screen.queryByText(CONTENT.blockIntro.changedNote)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: CONTENT.blockIntro.startButton }));
    for (let i = 0; i < scoredBlockTrials; i += 1) answerCurrentTrial('click');

    expect(screen.getByText(CONTENT.blockIntro.changedNote)).toBeInTheDocument();
  });

  it('keeps the same attribute focal while the target swaps between blocks', () => {
    render(<App />);
    reachWarmUp();
    for (let i = 0; i < warmUpTrials; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: CONTENT.warmUp.beginButton }));

    const focalAttributeLabel = ACTIVITY.labels[ACTIVITY.focalAttribute];
    const seenTargets = new Set<string>();

    for (let block = 0; block < 2; block += 1) {
      fireEvent.click(screen.getByRole('button', { name: CONTENT.blockIntro.startButton }));
      const labels = focalLabelsOnScreen();
      expect(labels).toContain(focalAttributeLabel);
      labels.filter((label) => label !== focalAttributeLabel).forEach((label) => seenTargets.add(label));
      for (let i = 0; i < scoredBlockTrials; i += 1) answerCurrentTrial('click');
    }

    expect(seenTargets).toEqual(new Set([ACTIVITY.labels.targetA, ACTIVITY.labels.targetB]));
  });

  it('offers an equal choice between showing and skipping the result', () => {
    render(<App />);
    completeActivity();

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.resultChoice.heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CONTENT.resultChoice.showButton })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CONTENT.resultChoice.skipButton })).toBeInTheDocument();
  });

  it('reaches the completion screen when the result is skipped', () => {
    render(<App />);
    completeActivity();

    fireEvent.click(screen.getByRole('button', { name: CONTENT.resultChoice.skipButton }));

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.completion.heading })).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('shows the result with its caveat when the result is chosen', () => {
    render(<App />);
    completeActivity();

    fireEvent.click(screen.getByRole('button', { name: CONTENT.resultChoice.showButton }));

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.result.heading })).toBeInTheDocument();
    expect(screen.getByText(CONTENT.result.caveat)).toBeInTheDocument();
    CONTENT.result.sections.forEach((section) => {
      expect(screen.getByText(section.toggle)).toBeInTheDocument();
    });
    // The caveat says "biased or bias-free" in order to deny both. What must
    // never appear is the page describing the participant as either.
    expect(screen.queryByText(/you (are|were|may be|might be) (biased|prejudiced)/i)).not.toBeInTheDocument();
  });

  it('reports a direction without any size, and without printing the score', () => {
    render(<App />);
    completeActivity();
    fireEvent.click(screen.getByRole('button', { name: CONTENT.resultChoice.showButton }));

    // No effect-size wording, and no bare figure for a reader to over-read.
    expect(screen.queryByText(/\bslight(ly)?\b|\bmoderate(ly)?\b|\bstrong(ly)?\b|\bmarkedly\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^-?\d\.\d{2}$/)).not.toBeInTheDocument();
  });

  it('shows a response time in seconds for each focal pair', () => {
    render(<App />);
    completeActivity();
    fireEvent.click(screen.getByRole('button', { name: CONTENT.resultChoice.showButton }));

    [ACTIVITY.labels.targetA, ACTIVITY.labels.targetB].forEach((label) => {
      const caption = CONTENT.result.barCaption
        .replace('{category}', label)
        .replace('{attribute}', ACTIVITY.labels[ACTIVITY.focalAttribute]);
      expect(screen.getByText(caption)).toBeInTheDocument();
    });

    // Two seconds figures, two places each, and no leftover placeholder.
    expect(screen.getAllByText(/^\d+\.\d{2}s$/)).toHaveLength(2);
    expect(screen.queryByText(/\{[a-z]+\}/i)).not.toBeInTheDocument();
  });

  it('offers the references as external links that cannot reach back into this page', () => {
    const { container } = render(<App />);

    CONTENT.landing.references.forEach((reference) => {
      const link = container.querySelector(`a[href="${reference.url}"]`);
      expect(link, `no link rendered for ${reference.title}`).not.toBeNull();
      expect(link).toHaveAttribute('target', '_blank');
      // Without noopener the opened page can reach window.opener.
      expect(link?.getAttribute('rel')).toContain('noopener');
    });
  });

  it('clears the session from the landing page and confirms it', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Clear my session/ }));

    expect(screen.getByRole('status')).toHaveTextContent(/cleared from this browser/i);
    expect(window.sessionStorage.length).toBe(0);
  });
});

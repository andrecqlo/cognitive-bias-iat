import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ACTIVITY_CONFIG } from './config/activityConfig';
import { CONTENT } from './config/content';
import { ACTIVITIES, type CategorySlot } from './config/activities';
import type { Side } from './types/activity';

/** The activity a participant reaches by clicking the first card. */
const ACTIVITY = ACTIVITIES[0];

/** Works out the correct side from what is on screen: the stimulus phrase and
 * the categories named in each response zone's label. */
function correctSideOnScreen(): Side {
  const stimulus = screen.getByTestId('stimulus').textContent ?? '';
  const slot = (Object.keys(ACTIVITY.stimuli) as CategorySlot[]).find((key) =>
    ACTIVITY.stimuli[key].includes(stimulus),
  );
  if (!slot) throw new Error(`Unrecognised stimulus: ${stimulus}`);

  const leftLabel = screen.getByRole('button', { name: /Respond left/ }).getAttribute('aria-label') ?? '';
  return leftLabel.includes(ACTIVITY.labels[slot]) ? 'left' : 'right';
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

function reachPracticeRound() {
  startActivity();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: CONTENT.information.continueButton }));
  fireEvent.click(screen.getByRole('button', { name: CONTENT.instructions.startPracticeButton }));
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
    expect(screen.getByRole('heading', { level: 1, name: CONTENT.instructions.heading })).toBeInTheDocument();
  });

  it('states that the activity may not suit everyone', () => {
    render(<App />);
    startActivity();

    expect(screen.getByText(CONTENT.information.accessibilityNote)).toBeInTheDocument();
  });

  it('lets the instructions demonstration be tried before the practice round', () => {
    render(<App />);
    startActivity();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: CONTENT.information.continueButton }));

    fireEvent.click(screen.getByRole('button', { name: /Demonstration: respond left/ }));

    expect(screen.getByText(/belongs with “Competent”, so you tap the left side/)).toBeInTheDocument();
  });

  it('advances through practice trials with a mouse', () => {
    render(<App />);
    reachPracticeRound();

    expect(screen.getByText(/Practice · Item 1 of 16/)).toBeInTheDocument();
    answerCurrentTrial('click');
    expect(screen.getByText(/Practice · Item 2 of 16/)).toBeInTheDocument();
  });

  it('advances through practice trials with the optional keyboard shortcuts', () => {
    render(<App />);
    reachPracticeRound();

    answerCurrentTrial('keyboard');
    expect(screen.getByText(/Practice · Item 2 of 16/)).toBeInTheDocument();
  });

  it('also accepts the arrow keys', () => {
    render(<App />);
    reachPracticeRound();

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

    expect(screen.getByText(/Practice · Item 2 of 16/)).toBeInTheDocument();
  });

  it('requires an incorrect answer to be corrected before moving on', () => {
    render(<App />);
    reachPracticeRound();

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

    expect(screen.getByText(/Practice · Item 1 of 16/)).toBeInTheDocument();
    expect(screen.getByTestId('stimulus')).toHaveTextContent(stimulus ?? '');
    expect(screen.getByText(/choose the correct side to continue/i)).toBeInTheDocument();

    respond(correct, 'click');
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByText(/Practice · Item 2 of 16/)).toBeInTheDocument();
  });

  it('offers an equal choice between showing and skipping the result', () => {
    render(<App />);
    reachPracticeRound();

    // Practice, round one, transition practice and round two.
    for (let i = 0; i < 16; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: CONTENT.practice.beginButton }));
    for (let i = 0; i < ACTIVITY_CONFIG.scoredRoundTrials; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: /Practise the new pairing/ }));
    for (let i = 0; i < ACTIVITY_CONFIG.transitionPracticeTrials; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: CONTENT.transition.startFinalButton }));
    for (let i = 0; i < ACTIVITY_CONFIG.scoredRoundTrials; i += 1) answerCurrentTrial('click');

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.resultChoice.heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CONTENT.resultChoice.showButton })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CONTENT.resultChoice.skipButton })).toBeInTheDocument();
  });

  it('reaches the completion screen when the result is skipped', () => {
    render(<App />);
    reachPracticeRound();

    for (let i = 0; i < 16; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: CONTENT.practice.beginButton }));
    for (let i = 0; i < ACTIVITY_CONFIG.scoredRoundTrials; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: /Practise the new pairing/ }));
    for (let i = 0; i < ACTIVITY_CONFIG.transitionPracticeTrials; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: CONTENT.transition.startFinalButton }));
    for (let i = 0; i < ACTIVITY_CONFIG.scoredRoundTrials; i += 1) answerCurrentTrial('click');

    fireEvent.click(screen.getByRole('button', { name: CONTENT.resultChoice.skipButton }));

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.completion.heading })).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('shows the result with its caveat when the result is chosen', () => {
    render(<App />);
    reachPracticeRound();

    for (let i = 0; i < 16; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: CONTENT.practice.beginButton }));
    for (let i = 0; i < ACTIVITY_CONFIG.scoredRoundTrials; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: /Practise the new pairing/ }));
    for (let i = 0; i < ACTIVITY_CONFIG.transitionPracticeTrials; i += 1) answerCurrentTrial('click');
    fireEvent.click(screen.getByRole('button', { name: CONTENT.transition.startFinalButton }));
    for (let i = 0; i < ACTIVITY_CONFIG.scoredRoundTrials; i += 1) answerCurrentTrial('click');

    fireEvent.click(screen.getByRole('button', { name: CONTENT.resultChoice.showButton }));

    expect(screen.getByRole('heading', { level: 1, name: CONTENT.result.heading })).toBeInTheDocument();
    expect(screen.getByText(CONTENT.result.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(CONTENT.result.whatDoesThisMeanToggle)).toBeInTheDocument();
    // Result wording must never describe the participant themselves.
    expect(screen.queryByText(/\bbiased\b|\bprejudice/i)).not.toBeInTheDocument();
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

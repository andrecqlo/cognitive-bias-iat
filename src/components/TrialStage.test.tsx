import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrialStage } from './TrialStage';
import { CONTENT } from '../config/content';
import type { FocalDisplay, TrialFeedback } from '../hooks/useActivityEngine';
import type { Trial } from '../types/activity';

const TRIAL: Trial = {
  id: 'trial-1',
  stimulus: 'Typical learner',
  category: 'targetB',
  correctSide: 'left',
  blockNumber: 1,
  positionInBlock: 6,
  pairing: 'A',
  pairIndex: 1,
};

const FOCAL: FocalDisplay = {
  focalCategories: ['targetA', 'attributeB'],
  focalLabels: ['Neurodivergent', 'Competent'],
  focalSide: 'right',
};

function renderStage(overrides: Partial<Parameters<typeof TrialStage>[0]> = {}) {
  const onRespond = vi.fn();
  const onDismissInterruption = vi.fn();
  const props = {
    trial: TRIAL,
    focal: FOCAL,
    feedback: 'idle' as TrialFeedback,
    trialNumber: 7,
    trialTotal: 20,
    blockLabel: 'Block 1 of 4',
    onRespond,
    prefersReducedMotion: false,
    interruptionNotice: false,
    onDismissInterruption,
    ...overrides,
  };
  const view = render(<TrialStage {...props} />);
  return { ...view, onRespond, onDismissInterruption };
}

describe('TrialStage', () => {
  it('keeps the focal pair and the counter visible', () => {
    renderStage();

    expect(screen.getByText('Typical learner')).toBeInTheDocument();
    expect(screen.getByText(/Block 1 of 4 · Item 7 of 20/)).toBeInTheDocument();
    // Once in the banner above the word, once as the response-zone label.
    expect(screen.getAllByText('Neurodivergent')).toHaveLength(2);
    expect(screen.getAllByText('Competent')).toHaveLength(2);
  });

  it('offers the focal pair on one side and everything else on the other', () => {
    renderStage();

    expect(screen.getByRole('button', { name: 'Respond right: Neurodivergent or Competent' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Respond left: ${CONTENT.round.nonFocalLabel}` }),
    ).toBeInTheDocument();
  });

  it('follows the focal side rather than assuming it is the right', () => {
    renderStage({ focal: { ...FOCAL, focalSide: 'left' } });

    expect(screen.getByRole('button', { name: 'Respond left: Neurodivergent or Competent' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Respond right: ${CONTENT.round.nonFocalLabel}` }),
    ).toBeInTheDocument();
  });

  it('responds to a mouse click', () => {
    const { onRespond } = renderStage();

    fireEvent.click(screen.getByRole('button', { name: /Respond left/ }));

    expect(onRespond).toHaveBeenCalledExactlyOnceWith('left');
  });

  it('responds to a touch without also firing the follow-up click', () => {
    const { onRespond } = renderStage();
    const zone = screen.getByRole('button', { name: /Respond right/ });

    fireEvent.pointerDown(zone, { pointerType: 'touch' });
    fireEvent.click(zone);

    expect(onRespond).toHaveBeenCalledExactlyOnceWith('right');
  });

  it('ignores a right-click on a response zone', () => {
    const { onRespond } = renderStage();

    fireEvent.pointerDown(screen.getByRole('button', { name: /Respond left/ }), { pointerType: 'mouse', button: 2 });

    expect(onRespond).not.toHaveBeenCalled();
  });

  it('explains an incorrect response in text as well as colour', () => {
    renderStage({ feedback: 'incorrect' });

    expect(screen.getByText(/choose the correct side to continue/i)).toBeInTheDocument();
  });

  it('animates the incorrect state only when motion is allowed', () => {
    const { container, unmount } = renderStage({ feedback: 'incorrect', prefersReducedMotion: false });
    expect(container.querySelector('.shake')).not.toBeNull();
    unmount();

    const reduced = renderStage({ feedback: 'incorrect', prefersReducedMotion: true });
    expect(reduced.container.querySelector('.shake')).toBeNull();
  });

  it('shows a calm, dismissible message after a major interruption', () => {
    const { onDismissInterruption } = renderStage({ interruptionNotice: true });

    expect(screen.getByText(/activity was interrupted/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onDismissInterruption).toHaveBeenCalledOnce();
  });

  it('does not show the interruption message by default', () => {
    renderStage();
    expect(screen.queryByText(/activity was interrupted/i)).not.toBeInTheDocument();
  });
});

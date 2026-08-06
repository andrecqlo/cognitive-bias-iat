import { useState } from 'react';
import { CONTENT } from '../config/content';
import type { Side } from '../types/activity';
import { Button } from './ui/Button';
import { Card, PageShell } from './ui/PageShell';

interface InstructionsProps {
  onStartPractice: () => void;
  onBack: () => void;
  prefersReducedMotion: boolean;
}

type DemoState = 'waiting' | 'correct' | 'incorrect';

/** A miniature, untimed copy of the trial layout used only to explain the task. */
function Demonstration({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const [state, setState] = useState<DemoState>('waiting');
  const { instructions } = CONTENT;

  const respond = (side: Side) => setState(side === 'left' ? 'correct' : 'incorrect');

  return (
    <Card className="mt-6">
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">{instructions.demoCaption}</p>

      <div className="mt-4 flex items-start justify-between gap-3">
        <p className="text-base font-semibold text-ink">{instructions.demoLeftCategory}</p>
        <p className="text-base font-semibold text-ink">{instructions.demoRightCategory}</p>
      </div>

      <div
        className={`mt-3 flex items-center justify-center rounded-[8px] border-2 px-4 py-6 transition-colors ${
          state === 'incorrect'
            ? `border-signal bg-signal-tint ${prefersReducedMotion ? '' : 'shake'}`
            : state === 'correct'
              ? 'border-ink bg-zone'
              : 'border-line bg-canvas'
        }`}
      >
        <p className="text-center text-2xl font-semibold text-ink">{instructions.demoStimulus}</p>
      </div>

      <div className="mt-3 flex gap-3">
        {(['left', 'right'] as Side[]).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => respond(side)}
            aria-label={`Demonstration: respond ${side} for ${
              side === 'left' ? instructions.demoLeftCategory : instructions.demoRightCategory
            }`}
            className={`no-select flex min-h-20 flex-1 flex-col items-center justify-center gap-1 rounded-[8px] border-2 bg-zone px-3 py-3 transition-colors active:bg-zone-press ${
              state === 'waiting' && side === 'left' ? 'border-signal' : 'border-line'
            }`}
          >
            <span aria-hidden="true" className="text-signal">
              {side === 'left' ? '◀' : '▶'}
            </span>
            <span className="text-base font-semibold text-ink">
              {side === 'left' ? instructions.demoLeftCategory : instructions.demoRightCategory}
            </span>
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-3 min-h-10 text-sm leading-relaxed text-muted">
        {state === 'waiting' && instructions.demoHint}
        {state === 'correct' && (
          <span className="text-ink">
            <span aria-hidden="true" className="mr-1">
              ✓
            </span>
            {instructions.demoCorrect}
          </span>
        )}
        {state === 'incorrect' && (
          <span className="text-ink">
            <span aria-hidden="true" className="mr-1 text-signal">
              ✕
            </span>
            {instructions.demoIncorrect}
          </span>
        )}
      </p>

      {state !== 'waiting' && (
        <Button variant="quiet" className="px-0" onClick={() => setState('waiting')}>
          {instructions.demoReset}
        </Button>
      )}
    </Card>
  );
}

export function Instructions({ onStartPractice, onBack, prefersReducedMotion }: InstructionsProps) {
  const { instructions } = CONTENT;

  return (
    <PageShell>
      <h1 className="text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-semibold text-ink">{instructions.heading}</h1>

      <ol className="mt-6 space-y-3">
        {instructions.points.map((point, index) => (
          <li key={point} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-signal-tint text-sm font-semibold text-ink"
            >
              {index + 1}
            </span>
            <span className="leading-relaxed text-ink-soft">{point}</span>
          </li>
        ))}
      </ol>

      <Demonstration prefersReducedMotion={prefersReducedMotion} />

      <Button className="mt-8 w-full sm:w-auto sm:self-start" onClick={onStartPractice}>
        {instructions.startPracticeButton}
      </Button>

      <Button variant="quiet" className="mt-6 self-start px-0" onClick={onBack}>
        Back
      </Button>
    </PageShell>
  );
}

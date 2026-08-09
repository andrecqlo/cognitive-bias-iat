import { CONTENT } from '../config/content';
import type { FocalDisplay, TrialFeedback } from '../hooks/useActivityEngine';
import type { Side, Trial } from '../types/activity';
import { ResponseZone } from './ResponseZone';
import { Button } from './ui/Button';

interface TrialStageProps {
  trial: Trial;
  focal: FocalDisplay;
  feedback: TrialFeedback;
  trialNumber: number;
  trialTotal: number;
  blockLabel: string;
  onRespond: (side: Side) => void;
  prefersReducedMotion: boolean;
  interruptionNotice: boolean;
  onDismissInterruption: () => void;
}

/**
 * The two categories to watch for, kept on screen for the whole block.
 *
 * Central and unmissable rather than split to the two sides: the participant is
 * answering one question — "is this word one of those two?" — and the pair has
 * to read as a pair for that question to stay simple.
 */
function FocalBanner({ labels }: { labels: string[] }) {
  return (
    <div className="mx-auto mt-3 flex max-w-md flex-col items-center rounded-[8px] border-2 border-ink bg-zone px-4 py-2">
      <span className="text-[0.7rem] tracking-wide text-muted uppercase">{CONTENT.round.watchForLabel}</span>
      <p className="text-center text-[clamp(0.95rem,4vw,1.25rem)] leading-tight font-semibold text-ink">
        {labels.map((label, index) => (
          <span key={label}>
            {index > 0 && <span className="mx-1 text-sm font-normal text-muted lowercase">or</span>}
            {label}
          </span>
        ))}
      </p>
    </div>
  );
}

export function TrialStage({
  trial,
  focal,
  feedback,
  trialNumber,
  trialTotal,
  blockLabel,
  onRespond,
  prefersReducedMotion,
  interruptionNotice,
  onDismissInterruption,
}: TrialStageProps) {
  const stimulusState =
    feedback === 'incorrect'
      ? 'border-signal bg-signal-tint'
      : feedback === 'correct'
        ? 'border-ink bg-zone'
        : 'border-line bg-surface';

  const nonFocalLabels = [CONTENT.round.nonFocalLabel];
  const leftLabels = focal.focalSide === 'left' ? focal.focalLabels : nonFocalLabels;
  const rightLabels = focal.focalSide === 'right' ? focal.focalLabels : nonFocalLabels;

  return (
    <div
      className="no-select flex h-[100svh] flex-col overflow-hidden bg-canvas"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
      }}
    >
      <header className="shrink-0 px-3 pt-3">
        <p className="text-center text-xs tracking-wide text-muted uppercase sm:text-sm">
          {blockLabel} · Item {trialNumber} of {trialTotal}
        </p>
        <div className="mx-auto mt-2 h-1 w-full max-w-md overflow-hidden rounded-full bg-zone">
          <div
            className="h-full bg-signal transition-[width]"
            style={{ width: `${trialTotal > 0 ? (trialNumber / trialTotal) * 100 : 0}%` }}
          />
        </div>
        <FocalBanner labels={focal.focalLabels} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-3">
        <div
          aria-live="polite"
          aria-atomic="true"
          className={`flex w-full max-w-xl items-center justify-center rounded-[8px] border-2 px-5 py-6 text-center transition-colors ${stimulusState} ${
            feedback === 'incorrect' && !prefersReducedMotion ? 'shake' : ''
          }`}
        >
          <p
            data-testid="stimulus"
            className="text-[clamp(1.3rem,6vw,2.4rem)] leading-tight font-semibold text-balance text-ink landscape:text-[clamp(1.1rem,4.2vw,1.9rem)]"
          >
            {trial.stimulus}
          </p>
        </div>

        <p aria-live="assertive" className="min-h-6 text-center text-sm font-medium text-ink">
          {feedback === 'incorrect' && (
            <span>
              <span aria-hidden="true" className="mr-1 text-signal">
                ✕
              </span>
              {CONTENT.warmUp.incorrectHint}
            </span>
          )}
          {feedback === 'correct' && (
            <span className="text-muted">
              <span aria-hidden="true" className="mr-1">
                ✓
              </span>
              Recorded
            </span>
          )}
        </p>
      </div>

      <p className="shrink-0 px-4 text-center text-xs text-muted sm:text-sm">
        {CONTENT.round.tapHint}
        <span className="hidden sm:inline"> · {CONTENT.round.keyboardHint}</span>
      </p>

      <div className="mt-2 flex h-[30svh] max-h-64 min-h-28 shrink-0 gap-3 px-3 pb-3 landscape:h-[34svh] landscape:max-h-48">
        <ResponseZone side="left" labels={leftLabels} onRespond={onRespond} keyboardKey="E or ←" />
        <ResponseZone side="right" labels={rightLabels} onRespond={onRespond} keyboardKey="I or →" />
      </div>

      {interruptionNotice && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Activity interrupted"
          className="fixed inset-0 z-10 flex items-center justify-center bg-ink/40 px-5"
        >
          <div className="w-full max-w-sm rounded-[8px] border border-line bg-surface p-6">
            <p className="text-ink">{CONTENT.interruption.message}</p>
            <Button className="mt-5 w-full" onClick={onDismissInterruption} autoFocus>
              {CONTENT.interruption.dismiss}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

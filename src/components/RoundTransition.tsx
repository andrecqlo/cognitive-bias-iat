import { CONTENT } from '../config/content';
import { CATEGORY_LABELS } from '../config/stimuli';
import type { ActivityEngine } from '../hooks/useActivityEngine';
import { TrialStage } from './TrialStage';
import { Button } from './ui/Button';
import { Card, PageShell } from './ui/PageShell';

function SidePreview({ labels, align }: { labels: string[]; align: 'left' | 'right' }) {
  return (
    <div
      className={`flex flex-1 flex-col gap-1 rounded-[8px] border-2 border-line bg-zone px-4 py-4 ${
        align === 'left' ? 'items-start text-left' : 'items-end text-right'
      }`}
    >
      <span className="text-xs tracking-wide text-muted uppercase">{align === 'left' ? 'Left side' : 'Right side'}</span>
      {labels.map((label, index) => (
        <span key={label} className="text-base font-semibold text-ink sm:text-lg">
          {index > 0 && <span className="mr-1 text-xs font-normal text-muted lowercase">or</span>}
          {label}
        </span>
      ))}
    </div>
  );
}

export function RoundTransition({ engine }: { engine: ActivityEngine }) {
  const { transition } = CONTENT;
  const leftLabels = engine.randomisation.round2.leftCategories.map((category) => CATEGORY_LABELS[category]);
  const rightLabels = engine.randomisation.round2.rightCategories.map((category) => CATEGORY_LABELS[category]);

  if (engine.transitionStage === 'practice' && engine.currentTrial && engine.currentAssignment) {
    return (
      <TrialStage
        trial={engine.currentTrial}
        assignment={engine.currentAssignment}
        feedback={engine.feedback}
        trialNumber={engine.trialNumber}
        trialTotal={engine.trialTotal}
        roundLabel={engine.roundLabel}
        onRespond={engine.respond}
        prefersReducedMotion={engine.prefersReducedMotion}
        interruptionNotice={false}
        onDismissInterruption={engine.dismissMajorInterruption}
      />
    );
  }

  const isReady = engine.transitionStage === 'ready';

  return (
    <PageShell>
      <Card>
        <h1 className="text-[clamp(1.5rem,6vw,2.25rem)] leading-tight font-semibold text-ink">{transition.heading}</h1>
        <p className="mt-4 leading-relaxed text-muted">{transition.body}</p>

        <div className="mt-6 flex gap-3">
          <SidePreview labels={leftLabels} align="left" />
          <SidePreview labels={rightLabels} align="right" />
        </div>

        {isReady ? (
          <Button className="mt-7 w-full" onClick={engine.actions.startFinalRound}>
            {transition.startFinalButton}
          </Button>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted">{transition.practiceLabel}</p>
            <Button className="mt-3 w-full" onClick={engine.actions.startTransitionPractice}>
              Practise the new pairing
            </Button>
          </>
        )}
      </Card>
    </PageShell>
  );
}

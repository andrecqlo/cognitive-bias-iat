import { CONTENT } from '../config/content';
import type { ActivityEngine } from '../hooks/useActivityEngine';
import { TrialStage } from './TrialStage';
import { Button } from './ui/Button';
import { Card, PageShell } from './ui/PageShell';

/** The unscored warm-up: the mechanic and the word lists, before anything counts. */
export function WarmUpRound({ engine }: { engine: ActivityEngine }) {
  if (engine.currentTrial && engine.focal) {
    return (
      <TrialStage
        trial={engine.currentTrial}
        focal={engine.focal}
        feedback={engine.feedback}
        trialNumber={engine.trialNumber}
        trialTotal={engine.trialTotal}
        blockLabel={engine.blockLabel}
        onRespond={engine.respond}
        prefersReducedMotion={engine.prefersReducedMotion}
        interruptionNotice={false}
        onDismissInterruption={engine.dismissMajorInterruption}
      />
    );
  }

  return (
    <PageShell>
      <Card>
        <h1 className="text-[clamp(1.5rem,6vw,2.25rem)] leading-tight font-semibold text-ink">
          {CONTENT.warmUp.readyHeading}
        </h1>
        <p className="mt-4 leading-relaxed text-muted">{CONTENT.warmUp.readyBody}</p>
        <Button className="mt-7 w-full" onClick={engine.actions.startBlocks}>
          {CONTENT.warmUp.beginButton}
        </Button>
      </Card>
    </PageShell>
  );
}

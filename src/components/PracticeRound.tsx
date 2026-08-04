import { CONTENT } from '../config/content';
import type { ActivityEngine } from '../hooks/useActivityEngine';
import { TrialStage } from './TrialStage';
import { Button } from './ui/Button';
import { Card, PageShell } from './ui/PageShell';

export function PracticeRound({ engine }: { engine: ActivityEngine }) {
  if (engine.currentTrial && engine.currentAssignment) {
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

  return (
    <PageShell>
      <Card>
        <h1 className="text-[clamp(1.5rem,6vw,2.25rem)] leading-tight font-semibold text-ink">
          {CONTENT.practice.readyHeading}
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          From here the two pairs of categories share the same response sides. Respond as quickly as you comfortably can.
        </p>
        <Button className="mt-7 w-full" onClick={engine.actions.beginRounds}>
          {CONTENT.practice.beginButton}
        </Button>
      </Card>
    </PageShell>
  );
}

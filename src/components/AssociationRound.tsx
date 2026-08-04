import type { ActivityEngine } from '../hooks/useActivityEngine';
import { TrialStage } from './TrialStage';

/** One scored combined round. Both scored rounds use the same component; the
 * categories on each side come from the session's randomisation. */
export function AssociationRound({ engine }: { engine: ActivityEngine }) {
  if (!engine.currentTrial || !engine.currentAssignment) return null;

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
      interruptionNotice={engine.majorInterruption}
      onDismissInterruption={engine.dismissMajorInterruption}
    />
  );
}

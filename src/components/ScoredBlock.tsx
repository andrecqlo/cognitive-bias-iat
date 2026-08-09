import type { ActivityEngine } from '../hooks/useActivityEngine';
import { TrialStage } from './TrialStage';

/** One scored block. All four use this component; the focal pair comes from the
 * session's block plan. */
export function ScoredBlock({ engine }: { engine: ActivityEngine }) {
  if (!engine.currentTrial || !engine.focal) return null;

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
      interruptionNotice={engine.majorInterruption}
      onDismissInterruption={engine.dismissMajorInterruption}
    />
  );
}

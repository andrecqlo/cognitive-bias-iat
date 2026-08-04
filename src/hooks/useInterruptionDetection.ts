import { useCallback, useEffect, useRef, useState } from 'react';
import { ACTIVITY_CONFIG } from '../config/activityConfig';

/**
 * Watches for the things that make a reaction time meaningless: the tab being
 * hidden, the window losing focus, the device rotating mid-trial, or the
 * browser suspending timers for a while.
 *
 * Trials are flagged rather than discarded here; exclusion happens in
 * calculateResult so the rules stay in one place.
 */
export function useInterruptionDetection(active: boolean) {
  const interruptedSinceTrialStartRef = useRef(false);
  const [majorInterruption, setMajorInterruption] = useState(false);

  const beginTrial = useCallback(() => {
    interruptedSinceTrialStartRef.current = false;
  }, []);

  const wasInterrupted = useCallback(() => interruptedSinceTrialStartRef.current, []);

  const dismissMajorInterruption = useCallback(() => setMajorInterruption(false), []);

  useEffect(() => {
    if (!active) return;

    const flag = (major: boolean) => {
      interruptedSinceTrialStartRef.current = true;
      if (major) setMajorInterruption(true);
    };

    // Losing focus or rotating the device spoils the current trial, but is not
    // disruptive enough to interrupt the participant with a message.
    const onVisibilityChange = () => {
      if (document.hidden) flag(true);
    };
    const onBlur = () => flag(false);
    const onOrientationChange = () => flag(false);

    let lastBeat = performance.now();
    const heartbeat = window.setInterval(() => {
      const now = performance.now();
      const gap = now - lastBeat;
      lastBeat = now;
      if (gap > ACTIVITY_CONFIG.interruption.heartbeatStallThresholdMs) flag(true);
    }, ACTIVITY_CONFIG.interruption.heartbeatIntervalMs);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('orientationchange', onOrientationChange);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [active]);

  // The three callbacks are individually stable; callers should depend on those
  // rather than on this container object, whose identity changes with state.
  return { beginTrial, wasInterrupted, majorInterruption, dismissMajorInterruption };
}

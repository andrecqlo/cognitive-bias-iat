import { useCallback, useMemo, useRef } from 'react';

/**
 * Measures the time between a stimulus appearing and a response, using
 * performance.now() so the reading is unaffected by clock changes.
 */
export function useReactionTimer() {
  const startedAtRef = useRef<number | null>(null);

  const start = useCallback(() => {
    startedAtRef.current = performance.now();
  }, []);

  const elapsed = useCallback((): number => {
    if (startedAtRef.current === null) return 0;
    return performance.now() - startedAtRef.current;
  }, []);

  const clear = useCallback(() => {
    startedAtRef.current = null;
  }, []);

  // A stable object, so effects that depend on the timer do not re-run (and
  // reset the current trial) on every render.
  return useMemo(() => ({ start, elapsed, clear }), [start, elapsed, clear]);
}

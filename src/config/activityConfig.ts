/**
 * Every tunable number for the activity lives here so trial counts and
 * exclusion thresholds never need to be hunted for inside components.
 */
export const ACTIVITY_CONFIG = {
  practice: {
    /** Practice trials introducing Neurodivergent vs Neurotypical alone. */
    identityTrials: 8,
    /** Practice trials introducing Competent vs Incompetent alone. */
    competenceTrials: 8,
  },
  /** Trials per scored combined round (Pairing A, Pairing B). */
  scoredRoundTrials: 26,
  /** Short practice burst shown during the between-round transition. */
  transitionPracticeTrials: 5,
  timing: {
    /** Reaction times faster than this are treated as accidental taps. */
    minValidMs: 250,
    /** Reaction times slower than this are treated as unrelated pauses. */
    maxValidMs: 5000,
    /** Below this many usable trials in a round, the result is flagged. */
    minUsableTrialsPerRound: 12,
    /** Below this first-response accuracy, the result is flagged. */
    minAccuracy: 0.7,
  },
  sequencing: {
    /** Longest run of consecutive trials sharing the same correct side. */
    maxSameSideRun: 3,
    /** Longest strict left/right/left/right alternation permitted. */
    maxAlternatingRun: 5,
  },
  result: {
    /** Percentage-point difference below which pairings read as "similar". */
    similarityThresholdPercent: 5,
  },
  interruption: {
    /** Heartbeat interval used to detect long background pauses (ms). */
    heartbeatIntervalMs: 1000,
    /** A heartbeat gap larger than this suggests the tab was suspended. */
    heartbeatStallThresholdMs: 3000,
  },
} as const;

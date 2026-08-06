/**
 * Every tunable number for the activity lives here so trial counts and
 * exclusion thresholds never need to be hunted for inside components.
 *
 * The exclusion and banding numbers follow the standard IAT scoring algorithm
 * (Greenwald, Nosek & Banaji, 2003) rather than being chosen for this activity.
 * Where one differs, the comment says why.
 */
export const ACTIVITY_CONFIG = {
  practice: {
    /** Practice trials introducing Neurodivergent vs Neurotypical alone. */
    identityTrials: 8,
    /** Practice trials introducing Competent vs Incompetent alone. */
    competenceTrials: 8,
  },
  /**
   * Trials per scored combined round (Pairing A, Pairing B). Matches the length
   * of the scored blocks in the standard IAT design, and leaves roughly 35
   * usable trials once errors, out-of-range times and interruptions are
   * dropped. Shortening it widens the similarity threshold quickly — see
   * `thresholdTable.ts` for the exact cost.
   */
  scoredRoundTrials: 40,
  /**
   * Practice with the new pairing before the second scored round, so the
   * participant is not still learning the new key mapping once scoring starts.
   *
   * This narrows the order effect but does not remove it. The larger remedy in
   * the literature is re-practising the single categories under the reversed
   * mapping, which this activity omits to stay short; `warmUpTrialsDropped`
   * below is the cheaper substitute.
   */
  transitionPracticeTrials: 20,
  /**
   * Leading trials of each scored round excluded from the median.
   *
   * Round one goes straight from single-category practice into scoring, while
   * round two gets `transitionPracticeTrials` of combined warm-up first. Left
   * alone that asymmetry makes round two look faster for everyone. Dropping the
   * same opening trials from both rounds removes most of it without adding a
   * block, so the activity does not get any longer. The trials are still shown
   * and still counted towards accuracy — they are only kept out of the median.
   */
  warmUpTrialsDropped: 4,
  timing: {
    /** Faster than this and the response beat reading the word. Standard value. */
    minValidMs: 300,
    /** Slower than this and the participant stopped attending. Standard value. */
    maxValidMs: 10000,
    /**
     * Above this share of responses under `minValidMs`, the result is flagged.
     * The standard algorithm excludes such participants outright; this activity
     * flags instead, because a person who rushed still deserves to see what
     * their session produced and why it is not worth much.
     */
    maxTooFastRate: 0.1,
    /**
     * Below this many usable responses in a round, the result is flagged. Not a
     * statistical threshold: the D-score's divisor already widens the harder a
     * round was, so a thin round is handled by the maths. This is the point
     * below which a mean stops describing anything.
     */
    minUsableTrialsPerRound: 20,
    /** Below this first-response accuracy, the result is flagged. */
    minAccuracy: 0.7,
  },
  result: {
    /**
     * Conventional D-score bands, as used by Project Implicit: below 0.15 is
     * reported as little or none, then slight, moderate and strong.
     *
     * These are effect-size labels borrowed from Cohen-style conventions. They
     * describe how large a gap is, not how confident anyone should be that it
     * is real or that it would reappear tomorrow — the result copy carries
     * that, and it has to, because these numbers cannot.
     */
    dScoreBands: {
      slight: 0.15,
      moderate: 0.35,
      strong: 0.65,
    },
  },
  sequencing: {
    /** Longest run of consecutive trials sharing the same correct side. */
    maxSameSideRun: 3,
    /** Longest strict left/right/left/right alternation permitted. */
    maxAlternatingRun: 5,
  },
  interruption: {
    /** Heartbeat interval used to detect long background pauses (ms). */
    heartbeatIntervalMs: 1000,
    /** A heartbeat gap larger than this suggests the tab was suspended. */
    heartbeatStallThresholdMs: 3000,
  },
} as const;

/**
 * Every tunable number for the activity lives here so trial counts and
 * exclusion thresholds never need to be hunted for inside components.
 *
 * The activity is a Brief IAT (Sriram & Greenwald, 2009). The numbers below
 * follow the recommended scoring procedure in Nosek, Bar-Anan, Sriram &
 * Greenwald (2014); where one differs, the comment says why.
 *
 * The BIAT was chosen over a shortened seven-block IAT deliberately. A
 * truncated IAT is a design the literature warns against — Greenwald et al.
 * (2022) note that reliability suffers when trial counts are cut below the
 * recommended numbers — whereas the BIAT is short by construction and rated at
 * least as well as the full IAT in Bar-Anan & Nosek's (2014) comparison of
 * seven indirect measures.
 */
export const ACTIVITY_CONFIG = {
  blocks: {
    /**
     * Unscored block that teaches the focal/non-focal mechanic before anything
     * counts. Excluded from the score entirely: the 2014 paper found warm-up
     * trials did not contribute positively to reliability or validity.
     *
     * Set to the total number of distinct words, so every one of them is met
     * once before anything is scored. That only works because the warm-up skips
     * the leading attribute-only run — see `buildDimensionSchedule`. With the
     * scored blocks' composition, 12 trials would be 8 attribute and 4 target,
     * and one word from each target category would never appear.
     *
     * Shorter than the 16 of the published procedure. The trade is deliberate:
     * exact coverage of the word lists, against two fewer trials of practice at
     * the mechanic itself.
     */
    warmUpTrials: 12,
    /** Trials in each of the four scored blocks. The recommended BIAT length. */
    scoredBlockTrials: 20,
    /**
     * Four scored blocks, read as two consecutive pairs. Each pair contains one
     * block with each target focal and yields its own D; the two are averaged.
     * Two pairs rather than one is what makes the measure a replication of
     * itself rather than a single comparison.
     */
    scoredBlockCount: 4,
    /**
     * Each block opens with this many attribute-only trials, after which
     * category and attribute trials alternate. Straight from the recommended
     * composition: "4 attribute only + 16 trials alternating category and
     * attribute".
     */
    leadingAttributeTrials: 4,
  },
  /**
   * Opening trials of every block excluded from the score.
   *
   * Equal to `leadingAttributeTrials` by design, not by coincidence: the
   * trials the procedure drops are exactly the attribute-only run that opens
   * each block. They are still shown and still counted towards accuracy. Change
   * one of these two numbers and you almost certainly want to change the other.
   */
  leadingTrialsDropped: 4,
  timing: {
    /**
     * Latencies are pulled into this window before scoring rather than being
     * discarded — the recommended BIAT treatment. A very fast response is
     * usually anticipation and a very slow one usually inattention, but both
     * still tell you the participant was on that trial, so recoding keeps the
     * trial and removes only its leverage over the mean.
     */
    winsorMinMs: 400,
    winsorMaxMs: 2000,
    /** Beyond this the participant had stopped attending; the trial is dropped. */
    maxValidMs: 10000,
    /** Faster than this and the response beat reading the word. Standard value. */
    minValidMs: 300,
    /**
     * Above this share of responses under `minValidMs`, the result is flagged.
     * The standard procedure excludes such participants outright; this activity
     * flags instead, because a person who rushed still deserves to see what
     * their session produced and why it is not worth much.
     */
    maxTooFastRate: 0.1,
    /**
     * Below this many usable responses for a focal target, the result is
     * flagged. Not a statistical threshold: the D-score's divisor already widens
     * the harder a block was, so a thin block is handled by the maths. This is
     * the point below which a mean stops describing anything.
     *
     * Each focal target gets two blocks of 16 scored trials, so 32 is the
     * ceiling and this floor leaves room for a normal number of exclusions.
     */
    minUsableTrialsPerTarget: 20,
    /** Below this first-response accuracy, the result is flagged. */
    minAccuracy: 0.7,
  },
  result: {
    /**
     * How large |D| has to be before a direction is named at all. The
     * conventional Project Implicit boundary between "little or none" and
     * "slight".
     *
     * It is the only band. The activity reports which way a difference ran and
     * never how large it was, so the slight / moderate / strong labels are
     * deliberately absent: they are effect-size conventions describing the size
     * of a gap, and a single sitting of a short activity cannot support a size.
     * Naming a direction is already the most this can carry.
     */
    directionThresholdD: 0.15,
  },
  sequencing: {
    /** Longest run of consecutive trials sharing the same correct side. */
    maxSameSideRun: 3,
    /** Longest strict focal/non-focal alternation permitted. */
    maxAlternatingRun: 5,
  },
  interruption: {
    /** Heartbeat interval used to detect long background pauses (ms). */
    heartbeatIntervalMs: 1000,
    /** A heartbeat gap larger than this suggests the tab was suspended. */
    heartbeatStallThresholdMs: 3000,
  },
} as const;

/** Total trials a participant answers, warm-up included. */
export const TOTAL_TRIALS =
  ACTIVITY_CONFIG.blocks.warmUpTrials +
  ACTIVITY_CONFIG.blocks.scoredBlockTrials * ACTIVITY_CONFIG.blocks.scoredBlockCount;

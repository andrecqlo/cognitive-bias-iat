/**
 * The activities on offer. Every one of them is the same procedure — the
 * mechanic, the block structure and the D-score are topic-independent — so a
 * new topic is a new entry here and nothing else.
 *
 * ## Writing a new activity
 *
 * The structure has to stay 2x2: two contrasted targets and two contrasted
 * attributes. Three categories, or a pair that is not a clean opposition, does
 * not make an implicit association measure.
 *
 * Word lists carry more weight than they look like they do:
 *
 * - Every word must belong to exactly one category, obviously and immediately.
 *   A word that plausibly fits two categories inflates response times and turns
 *   the score into noise. This is the usual way a home-made IAT fails.
 * - Every word must be defined on the definitions screen before the activity
 *   starts. A word met for the first time mid-block is a reading-speed
 *   measurement, not an association one.
 * - Target words must not carry the attributes' valence. If a target word is
 *   itself flattering or unflattering, the activity measures that instead.
 *   "Gifted" and "high-functioning" are excluded from the lists below for this
 *   reason: the first imports a positive stereotype into a category that has to
 *   stay valence-neutral, and the second is a framing now widely considered
 *   harmful.
 * - A category label must never also appear as one of its own stimuli. That
 *   produces trials a participant can answer by matching the word in the middle
 *   against the identical label on screen, without classifying anything.
 *
 * Choosing a topic is not a data protection question. The activity asks the
 * participant nothing about themselves, scores nothing but how quickly they
 * matched words to categories, sends nothing anywhere, and keeps nothing once
 * the tab closes — there is no personal data here to be special category data.
 *
 * What a topic does carry is the experience of reading the result alone, which
 * is what the acknowledgement, the skippable result and the chance note exist
 * for. Weigh a new topic against those, not against a privacy review.
 */

/**
 * The four category slots.
 *
 * In a Brief IAT one attribute stays focal for the whole session while the
 * targets take turns beside it, so the slots are not paired up in advance the
 * way they are in a seven-block IAT. Naming them by slot rather than by subject
 * is what keeps the trial generator, the engine and the scoring free of any one
 * topic.
 */
export type CategorySlot = 'targetA' | 'targetB' | 'attributeA' | 'attributeB';

export type TargetSlot = Extract<CategorySlot, 'targetA' | 'targetB'>;
export type AttributeSlot = Extract<CategorySlot, 'attributeA' | 'attributeB'>;

export const TARGET_SLOTS = ['targetA', 'targetB'] as const;
export const ATTRIBUTE_SLOTS = ['attributeA', 'attributeB'] as const;

export interface ActivityDefinition {
  id: string;
  title: string;
  /** One line on the picker card, enough to choose by. */
  summary: string;
  labels: Record<CategorySlot, string>;
  stimuli: Record<CategorySlot, string[]>;
  /**
   * What each category means, shown before the activity starts in a table
   * beside the words that category will use.
   *
   * Keyed by slot rather than written as prose so the words column is generated
   * from `stimuli` itself. Coverage is then structural: a word cannot be missing
   * from the definitions screen, because the screen reads the same list the
   * trials do. Keep each one to a sentence — the examples are in the next
   * column, so the definition does not need to list them.
   */
  definitions: Record<CategorySlot, string>;
  /**
   * The attribute that stays focal in every block. **This must be the
   * positively-valenced one.**
   *
   * The choice is not cosmetic. Blocks that hold the positive attribute focal
   * ("good-focal") and blocks that hold the negative one focal are structurally
   * identical, and good-focal blocks carry roughly three times the shared
   * variance of bad-focal ones (Nosek, Bar-Anan, Sriram & Greenwald, 2014).
   * Pointing this at the unflattering attribute would throw away most of the
   * measure while looking like it still worked.
   */
  focalAttribute: AttributeSlot;
  /** Names for the two focal pairs, used on the result page. */
  blockLabels: { targetAFocal: string; targetBFocal: string };
  /**
   * Result sentences. `fasterWithTargetA` is used when the blocks with targetA
   * focal were the quicker ones.
   *
   * No sentence carries a size. The activity reports which way response times
   * ran and stops there.
   */
  result: {
    fasterWithTargetA: string;
    fasterWithTargetB: string;
    similar: string;
  };
}

/**
 * ## Why these particular words
 *
 * **Three stimuli per category.** At the low end of published BIAT practice but
 * within it. Each word therefore repeats more often within a block, so stimulus
 * learning sets in faster and one weak word contaminates a third of its
 * category. Accepted deliberately: familiarity of every individual word was
 * prioritised over set size, and this tool exists to start a conversation
 * rather than to measure anyone.
 *
 * **Person-adjectives on the neurodivergent side.** "autistic" and "dyslexic"
 * rather than "autism" and "dyslexia", so the pairing on screen reads as being
 * about people ("autistic + competent") rather than as rating a condition.
 * "ADHD" stays a noun because English has no standard adjective form; it works
 * adjectivally in everyday speech, so this is a cosmetic inconsistency rather
 * than a functional one.
 *
 * **Mixed word lengths across the two target categories.** Single words on one
 * side, two-word phrases on the other. Left alone on purpose: a constant
 * per-category speed handicap appears in both block types and largely cancels
 * in the D-score. Padding both sides into matched phrases ("autistic mind",
 * "dyslexic learner") would add uniform slowness and response-time variance to
 * every trial, and that does not cancel — it degrades a short activity's
 * reliability. Do not "fix" this.
 *
 * **"Neuromajority" as a label rather than a stimulus.** The term is uncommon,
 * and an unfamiliar stimulus classifies slowly with a steep within-session
 * learning curve, which injects order-dependent noise. As a label that stays on
 * screen and is defined before the activity starts, its rarity costs nothing —
 * and it frames the majority as one group among others rather than as the
 * default. "neurotypical" is demoted to a stimulus for the same reason a label
 * never appears in its own word list.
 *
 * **Morphologically paired attributes.** Each incompetent word directly negates
 * a competent one — capable/incapable, skilled/unskilled, effective/ineffective
 * — which matches them on length, frequency and semantic scope. The known
 * residual risk is that the in-/un- prefix offers a partial visual shortcut to
 * the incompetent category. Retained because the pairing benefit outweighs the
 * theoretical shortcut; if piloting shows suspiciously fast sorting on the
 * incompetent side, swap one item for "inept" or "careless".
 */
const NEURODIVERSITY: ActivityDefinition = {
  id: 'neurodiversity',
  title: 'Neurodiversity and competence',
  summary: 'Do “Neurodivergent” and “Competent” feel as connected to you as “Neuromajority” and “Competent”?',
  labels: {
    targetA: 'Neurodivergent',
    targetB: 'Neuromajority',
    attributeA: 'Competent',
    attributeB: 'Incompetent',
  },
  stimuli: {
    targetA: ['ADHD', 'autistic', 'dyslexic'],
    targetB: ['neurotypical', 'conventional learner', 'typical mind'],
    attributeA: ['capable', 'skilled', 'effective'],
    attributeB: ['incapable', 'unskilled', 'ineffective'],
  },
  definitions: {
    targetA: 'People whose brains work differently from the majority.',
    targetB: 'People whose ways of thinking and learning are shared by most of the population.',
    attributeA: 'Able and effective at what they do.',
    attributeB: 'Not able or effective at what they do.',
  },
  /** "Competent" — the positive attribute, as good-focal requires. */
  focalAttribute: 'attributeA',
  blockLabels: {
    targetAFocal: 'Neurodivergent + Competent',
    targetBFocal: 'Neuromajority + Competent',
  },
  result: {
    fasterWithTargetA:
      'You were faster when “Neurodivergent” and “Competent” were the two categories to watch for than when “Neuromajority” and “Competent” were.',
    fasterWithTargetB:
      'You were faster when “Neuromajority” and “Competent” were the two categories to watch for than when “Neurodivergent” and “Competent” were.',
    similar: 'You responded at about the same speed whichever pair of categories you were watching for.',
  },
};

export const ACTIVITIES: readonly ActivityDefinition[] = [NEURODIVERSITY];

export const DEFAULT_ACTIVITY_ID = NEURODIVERSITY.id;

export function findActivity(id: string | null | undefined): ActivityDefinition {
  return ACTIVITIES.find((activity) => activity.id === id) ?? NEURODIVERSITY;
}

/** The attribute that is never focal — the contrast for the focal one. */
export function nonFocalAttribute(activity: Pick<ActivityDefinition, 'focalAttribute'>): AttributeSlot {
  return activity.focalAttribute === 'attributeA' ? 'attributeB' : 'attributeA';
}

/** Which target is focal for a given pairing. */
export function targetForPairing(pairing: 'A' | 'B'): TargetSlot {
  return pairing === 'A' ? 'targetA' : 'targetB';
}

/** The target that is *not* focal for a given pairing. */
export function otherTargetForPairing(pairing: 'A' | 'B'): TargetSlot {
  return pairing === 'A' ? 'targetB' : 'targetA';
}

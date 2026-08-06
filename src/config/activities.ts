/**
 * The activities on offer. Every one of them is the same procedure — the
 * mechanic, the block structure and the D-score are topic-independent — so a
 * new topic is a new entry here and nothing else.
 *
 * ## Writing a new activity
 *
 * The structure has to stay 2x2: two contrasted targets and two contrasted
 * attributes. Three categories, or a pair that is not a clean opposition, does
 * not make an IAT.
 *
 * Word lists carry more weight than they look like they do:
 *
 * - Every word must belong to exactly one category, obviously and immediately.
 *   A word that plausibly fits two categories inflates response times and turns
 *   the score into noise. This is the usual way a home-made IAT fails.
 * - Match the lists on word length, syllable count and familiarity as closely
 *   as the subject allows. Otherwise part of what the activity measures is
 *   reading time. The neurodiversity lists below are imperfect on exactly this
 *   point — "ADHD" against "Accomplished", and one two-word term among
 *   single words — which is worth fixing before it is copied into a new topic.
 * - Target words must not carry the attributes' valence. If a target word is
 *   itself flattering or unflattering, the activity measures that instead.
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
 * The four category slots, in the arrangement the activity pairs them.
 *
 * Pairing A groups targetA with attributeA; Pairing B swaps the attributes.
 * Naming them by slot rather than by subject is what keeps the trial generator,
 * the engine and the scoring free of any one topic.
 */
export type CategorySlot = 'targetA' | 'targetB' | 'attributeA' | 'attributeB';

export const TARGET_SLOTS = ['targetA', 'targetB'] as const;
export const ATTRIBUTE_SLOTS = ['attributeA', 'attributeB'] as const;

export interface ActivityDefinition {
  id: string;
  title: string;
  /** One line on the picker card, enough to choose by. */
  summary: string;
  labels: Record<CategorySlot, string>;
  stimuli: Record<CategorySlot, string[]>;
  /** Names for the two pairings, used on the result page. */
  pairingLabels: { a: string; b: string };
  /**
   * Result sentences. `fasterWithAttributeA` is used when Pairing A was the
   * quicker round — that is, when targetA shared a side with attributeA.
   */
  result: {
    fasterWithAttributeA: string;
    fasterWithAttributeB: string;
    similar: string;
  };
}

const NEURODIVERSITY: ActivityDefinition = {
  id: 'neurodiversity',
  title: 'Neurodiversity and competence',
  summary: 'Do “Neurodivergent” and “Competent” feel as connected to you as “Neurotypical” and “Competent”?',
  labels: {
    targetA: 'Neurodivergent',
    targetB: 'Neurotypical',
    attributeA: 'Incompetent',
    attributeB: 'Competent',
  },
  stimuli: {
    targetA: ['Neurodivergent', 'Autistic', 'ADHD', 'Dyslexic'],
    targetB: ['Neurotypical', 'Typical mind', 'Typical thinker', 'Typical learner'],
    attributeA: ['Ineffective', 'Inept', 'Unreliable', 'Inadequate'],
    attributeB: ['Effective', 'Proficient', 'Reliable', 'Accomplished'],
  },
  pairingLabels: {
    a: 'Neurodivergent + Incompetent',
    b: 'Neurodivergent + Competent',
  },
  result: {
    fasterWithAttributeA:
      'You were {strength} faster when “Neurodivergent” shared a response side with “Incompetent” than when it shared a side with “Competent.”',
    fasterWithAttributeB:
      'You were {strength} faster when “Neurodivergent” shared a response side with “Competent” than when it shared a side with “Incompetent.”',
    similar: 'You responded at about the same speed whichever way the categories were paired.',
  },
};

export const ACTIVITIES: readonly ActivityDefinition[] = [NEURODIVERSITY];

export const DEFAULT_ACTIVITY_ID = NEURODIVERSITY.id;

export function findActivity(id: string | null | undefined): ActivityDefinition {
  return ACTIVITIES.find((activity) => activity.id === id) ?? NEURODIVERSITY;
}

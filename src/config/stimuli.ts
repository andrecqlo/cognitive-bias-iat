export type CategoryKey = 'neurodivergent' | 'neurotypical' | 'competent' | 'incompetent';

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  neurodivergent: 'Neurodivergent',
  neurotypical: 'Neurotypical',
  competent: 'Competent',
  incompetent: 'Incompetent',
};

export const STIMULI: Record<CategoryKey, string[]> = {
  neurodivergent: [
    'Neurodivergent',
    'Autistic',
    'ADHD',
    'Dyslexic',
  ],
  neurotypical: [
    'Neurotypical',
    'Typical mind',
    'Typical thinker',
    'Typical learner',
  ],
  competent: [
    'Effective',
    'Proficient',
    'Reliable',
    'Accomplished',
  ],
  incompetent: [
    'Ineffective',
    'Inept',
    'Unreliable',
    'Inadequate',
  ],
};

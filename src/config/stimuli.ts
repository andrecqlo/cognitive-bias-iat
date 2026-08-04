export type CategoryKey = 'neurodivergent' | 'neurotypical' | 'competent' | 'incompetent';

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  neurodivergent: 'Neurodivergent',
  neurotypical: 'Neurotypical',
  competent: 'Competent',
  incompetent: 'Incompetent',
};

export const STIMULI: Record<CategoryKey, string[]> = {
  neurodivergent: [
    'Neurodivergent person',
    'Autistic person',
    'Person with ADHD',
    'Dyslexic person',
    'Dyspraxic person',
  ],
  neurotypical: [
    'Neurotypical person',
    'Non-autistic person',
    'Person without ADHD',
    'Non-dyslexic person',
    'Non-dyspraxic person',
  ],
  competent: [
    'Competent person',
    'Skilled person',
    'Effective person',
    'Proficient person',
    'Reliable person',
    'Accomplished person',
  ],
  incompetent: [
    'Incompetent person',
    'Unskilled person',
    'Ineffective person',
    'Inept person',
    'Unreliable person',
    'Inadequate person',
  ],
};

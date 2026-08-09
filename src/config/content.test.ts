import { describe, expect, it } from 'vitest';
import { CONTENT } from './content';
import { ACTIVITIES, ATTRIBUTE_SLOTS, TARGET_SLOTS, nonFocalAttribute, type CategorySlot } from './activities';

const ALL_SLOTS: CategorySlot[] = [...TARGET_SLOTS, ...ATTRIBUTE_SLOTS];

describe.each(ACTIVITIES.map((activity) => [activity.title, activity] as const))('%s', (_title, activity) => {
  it('explains every category before the activity starts', () => {
    // A word met for the first time mid-block is classified slowly because it
    // is unfamiliar, not because of any association — and that lands in the
    // score. The definitions screen exists to spend that cost up front; it
    // lists each category's words from `stimuli`, so coverage is structural and
    // only the explanations need checking here.
    ALL_SLOTS.forEach((slot) => {
      expect(activity.definitions[slot]?.trim(), `${slot} has no definition`).toBeTruthy();
    });
  });

  it('never uses a category label as one of its own stimuli', () => {
    // Those trials can be answered by matching the word in the middle against
    // the identical label on screen, without classifying anything.
    ALL_SLOTS.forEach((slot) => {
      const label = activity.labels[slot].toLowerCase();
      const words = activity.stimuli[slot].map((word) => word.toLowerCase());
      expect(words, `"${activity.labels[slot]}" is both the label and a stimulus`).not.toContain(label);
    });
  });

  it('gives every category the same number of words', () => {
    const counts = ALL_SLOTS.map((slot) => activity.stimuli[slot].length);
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBeGreaterThanOrEqual(3);
  });

  it('keeps every word in exactly one category', () => {
    const all = ALL_SLOTS.flatMap((slot) => activity.stimuli[slot].map((word) => word.toLowerCase()));
    expect(new Set(all).size).toBe(all.length);
  });

  it('names a focal attribute distinct from its contrast', () => {
    expect(ATTRIBUTE_SLOTS).toContain(activity.focalAttribute);
    expect(nonFocalAttribute(activity)).not.toBe(activity.focalAttribute);
  });

  it('carries no size wording in its result sentences', () => {
    // Direction only: there is no {strength} placeholder left to fill, so a
    // sentence still expecting one would render the literal token.
    Object.values(activity.result).forEach((sentence) => {
      expect(sentence).not.toContain('{strength}');
      expect(sentence).not.toMatch(/\bslight|moderate|strong|marked/i);
    });
  });
});

describe('landing references', () => {
  const { references } = CONTENT.landing;

  it('lists at least two places to read more', () => {
    expect(references.length).toBeGreaterThanOrEqual(2);
  });

  it('gives every reference a title and a description', () => {
    references.forEach((reference) => {
      expect(reference.title.trim()).not.toBe('');
      expect(reference.detail.trim()).not.toBe('');
    });
  });

  it('points every reference at an https URL', () => {
    references.forEach((reference) => {
      expect(() => new URL(reference.url)).not.toThrow();
      expect(new URL(reference.url).protocol).toBe('https:');
    });
  });

  it('does not repeat a URL', () => {
    const urls = references.map((reference) => reference.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

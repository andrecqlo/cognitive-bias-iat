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

});

describe('framing vocabulary', () => {
  /** Every string a participant can read, flattened. */
  function allCopy(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(allCopy);
    if (value && typeof value === 'object') return Object.values(value).flatMap(allCopy);
    return [];
  }

  const PARTICIPANT_COPY = [
    ...allCopy(CONTENT),
    ...ACTIVITIES.flatMap((activity) => [
      activity.title,
      activity.summary,
      ...Object.values(activity.labels),
      ...Object.values(activity.definitions),
    ]),
  ];

  it('calls it unconscious bias and nothing else', () => {
    // One noun across every screen. Three names would leave a reader wondering
    // whether they mean three things.
    PARTICIPANT_COPY.forEach((text) => {
      expect(text, `"${text}" uses a competing term`).not.toMatch(/subconscious|cognitive bias|implicit bias(?!e?s? Association)/i);
    });
  });

  it('never claims to find or measure a bias', () => {
    // "Examining", never detecting or determining: the activity does not find a
    // thing that is there. Negations are allowed — "cannot diagnose" is the
    // point — so only the bare claim is caught.
    PARTICIPANT_COPY.forEach((text) => {
      expect(text, `"${text}" overclaims`).not.toMatch(/\b(detects?|determines?|diagnoses)\b/i);
    });
  });

  it('keeps each leg of the framing somewhere in the copy', () => {
    const everything = PARTICIPANT_COPY.join(' ').toLowerCase();
    expect(everything).toContain('not a verdict');
    expect(everything).toContain('none is a diagnosis');
    expect(everything).toContain('a different day could give a different result');
    expect(everything).toContain('prompt reflection');
  });
});

describe('result copy', () => {
  const { result } = CONTENT;

  it('offers exactly two scored states plus one for too little data', () => {
    expect(result.lean.trim()).not.toBe('');
    expect(result.similar.trim()).not.toBe('');
    expect(result.incomplete.trim()).not.toBe('');
  });

  it('carries no size wording anywhere', () => {
    // Direction only. A sentence still reaching for a strength would either
    // render a size or leave a literal placeholder on screen.
    [result.lean, result.similar, result.incomplete, result.gap, result.gapSimilar].forEach((sentence) => {
      expect(sentence).not.toContain('{strength}');
      expect(sentence).not.toMatch(/\bslight|moderate|strong|marked/i);
    });
  });

  it('makes no claim about chance in the null state', () => {
    // 0.15 is a conventional effect-size boundary, not a significance test.
    // Nothing in the scoring builds a null distribution, so nothing here may
    // imply one.
    expect(result.gapSimilar).not.toMatch(/\bchance\b|\bsignifican|\brandom\b|\bexpected by\b/i);
  });

  it('names every placeholder its template will be given', () => {
    expect(result.lean).toContain('{attribute}');
    expect(result.lean).toContain('{faster}');
    expect(result.lean).toContain('{slower}');
    expect(result.gap).toContain('{seconds}');
    expect(result.gap).toContain('{category}');
    expect(result.barCaption).toContain('{category}');
    expect(result.barCaption).toContain('{attribute}');
  });

  it('offers two expandable sections, each with a body', () => {
    expect(result.sections).toHaveLength(2);
    result.sections.forEach((section) => {
      expect(section.toggle.trim()).not.toBe('');
      expect(section.body.trim()).not.toBe('');
      // Written for every direction, so nothing may assume one.
      expect(section.body).not.toMatch(/\byou were (faster|quicker|slower)\b/i);
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

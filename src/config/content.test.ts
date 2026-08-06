import { describe, expect, it } from 'vitest';
import { CONTENT } from './content';

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

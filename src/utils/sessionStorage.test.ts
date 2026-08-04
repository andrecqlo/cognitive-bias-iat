import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, loadSession, saveSession, type StoredSession } from './sessionStorage';
import { createSessionRandomisation } from './generateTrials';

const STORAGE_KEY = 'hidden-associations-session-v1';

function makeSession(): StoredSession {
  return {
    phase: 'result',
    randomisation: createSessionRandomisation(),
    trialRecords: [
      {
        id: 'trial-1',
        stimulus: 'Skilled person',
        category: 'competent',
        correctSide: 'left',
        block: 'A',
        reactionTimeMs: 640,
        firstResponseCorrect: true,
        attempts: 1,
        interrupted: false,
      },
    ],
    acknowledged: true,
  };
}

describe('session storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips a session', () => {
    const session = makeSession();
    saveSession(session);
    expect(loadSession()).toEqual(session);
  });

  it('returns null when nothing is stored', () => {
    expect(loadSession()).toBeNull();
  });

  it('removes the stored session when cleared', () => {
    saveSession(makeSession());
    clearSession();
    expect(loadSession()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('writes only to sessionStorage, never to localStorage', () => {
    saveSession(makeSession());

    expect(window.sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    // localStorage is not always present in the test environment; when it is,
    // nothing should ever have been written to it.
    expect(window.localStorage?.length ?? 0).toBe(0);
  });

  it('returns null rather than throwing when stored data is corrupt', () => {
    window.sessionStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSession()).toBeNull();
  });

  it('keeps working when storage throws, as it can in private browsing', () => {
    const realStorage = window.sessionStorage;
    const throwingStorage = {
      getItem: () => {
        throw new Error('storage disabled');
      },
      setItem: () => {
        throw new Error('storage disabled');
      },
      removeItem: () => {
        throw new Error('storage disabled');
      },
    } as unknown as Storage;

    Object.defineProperty(window, 'sessionStorage', { value: throwingStorage, configurable: true });
    try {
      expect(() => saveSession(makeSession())).not.toThrow();
      expect(loadSession()).toBeNull();
      expect(() => clearSession()).not.toThrow();
    } finally {
      Object.defineProperty(window, 'sessionStorage', { value: realStorage, configurable: true });
    }
  });
});

import type { ActivityPhase, SessionRandomisation, TrialRecord } from '../types/activity';

const STORAGE_KEY = 'hidden-associations-session-v1';

export interface StoredSession {
  phase: ActivityPhase;
  randomisation: SessionRandomisation;
  trialRecords: TrialRecord[];
  acknowledged: boolean;
}

/** All access is wrapped in try/catch: sessionStorage can throw in private
 * browsing modes or when third-party storage is blocked, and that must
 * never break the activity. */
export function saveSession(session: StoredSession): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable — the activity continues to work in-memory only.
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage was never available.
  }
}

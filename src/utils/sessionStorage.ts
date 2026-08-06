import type { ActivityPhase, SessionRandomisation, TrialRecord } from '../types/activity';

/**
 * Bumped whenever a stored record would still parse but no longer mean what it
 * says — those are the changes that produce a plausible wrong answer rather
 * than a visible failure.
 *
 * v2: `reactionTimeMs` changed from first-response latency to latency-to-correct.
 * v3: category keys became topic-independent slots, and sessions gained an activity.
 */
export const STORAGE_KEY = 'hidden-associations-session-v3';

export interface StoredSession {
  phase: ActivityPhase;
  /** Which activity the trials belong to; word lists differ between them. */
  activityId: string;
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

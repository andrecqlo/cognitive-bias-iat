import type { ActivityDefinition } from '../config/activities';
import { CONTENT } from '../config/content';
import { Button } from './ui/Button';
import { PageShell } from './ui/PageShell';

interface DefinitionsPageProps {
  activity: ActivityDefinition;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Defines every word the activity will use, before any trial runs.
 *
 * Part of the procedure rather than background reading. A word met for the
 * first time in the middle of a block is classified slowly because it is
 * unfamiliar, and that slowness lands in the score as though it were an
 * association.
 */
export function DefinitionsPage({ activity, onContinue, onBack }: DefinitionsPageProps) {
  const { definitions } = CONTENT;

  return (
    <PageShell>
      <h1 className="text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-semibold text-ink">{definitions.heading}</h1>
      <p className="mt-4 leading-relaxed text-muted">{definitions.intro}</p>

      {/* Matches the result page's detail cards rather than the full-page Card:
          three stacked Cards at page padding would push the continue button
          well below the fold on a phone. */}
      <dl className="mt-6 space-y-3">
        {activity.definitions.map((entry) => (
          <div key={entry.term} className="rounded-[8px] border border-line bg-surface px-4 py-4">
            <dt className="text-lg font-semibold text-ink">{entry.term}</dt>
            <dd className="mt-2 leading-relaxed text-ink-soft">{entry.definition}</dd>
          </div>
        ))}
      </dl>

      <Button className="mt-8 w-full sm:w-auto sm:self-start" onClick={onContinue}>
        {definitions.continueButton}
      </Button>

      <Button variant="quiet" className="mt-6 self-start px-0" onClick={onBack}>
        {definitions.backButton}
      </Button>
    </PageShell>
  );
}

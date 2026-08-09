import { ATTRIBUTE_SLOTS, TARGET_SLOTS, type ActivityDefinition, type CategorySlot } from '../config/activities';
import { CONTENT } from '../config/content';
import { Button } from './ui/Button';
import { PageShell } from './ui/PageShell';

interface DefinitionsPageProps {
  activity: ActivityDefinition;
  onContinue: () => void;
  onBack: () => void;
}

/** Targets first, then attributes — the order they are met on screen. */
const ROW_ORDER: CategorySlot[] = [...TARGET_SLOTS, ...ATTRIBUTE_SLOTS];

/**
 * Defines every category and lists the words it will use, before any trial runs.
 *
 * Part of the procedure rather than background reading. A word met for the
 * first time in the middle of a block is classified slowly because it is
 * unfamiliar, and that slowness lands in the score as though it were an
 * association.
 *
 * The words column is read straight from `activity.stimuli`, so it cannot fall
 * out of step with what the trials actually show.
 */
export function DefinitionsPage({ activity, onContinue, onBack }: DefinitionsPageProps) {
  const { definitions } = CONTENT;

  return (
    <PageShell wide>
      <h1 className="text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-semibold text-ink">{definitions.heading}</h1>
      <p className="mt-4 leading-relaxed text-muted">{definitions.intro}</p>

      <div className="mt-6 overflow-hidden rounded-[8px] border border-line bg-surface">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{definitions.heading}</caption>
          <thead>
            <tr className="border-b border-line bg-zone">
              <th scope="col" className="px-4 py-3 font-semibold text-ink">
                {definitions.columns.category}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-ink">
                {definitions.columns.meaning}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-ink">
                {definitions.columns.words}
              </th>
            </tr>
          </thead>
          <tbody>
            {ROW_ORDER.map((slot) => (
              <tr key={slot} className="border-b border-line last:border-b-0 align-top">
                <th scope="row" className="px-4 py-3 font-semibold text-ink">
                  {activity.labels[slot]}
                </th>
                <td className="px-4 py-3 leading-relaxed text-ink-soft">{activity.definitions[slot]}</td>
                <td className="px-4 py-3 text-ink-soft">
                  <ul className="space-y-0.5">
                    {activity.stimuli[slot].map((word) => (
                      <li key={word}>{word}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button className="mt-8 w-full sm:w-auto sm:self-start" onClick={onContinue}>
        {definitions.continueButton}
      </Button>

      <Button variant="quiet" className="mt-6 self-start px-0" onClick={onBack}>
        {definitions.backButton}
      </Button>
    </PageShell>
  );
}

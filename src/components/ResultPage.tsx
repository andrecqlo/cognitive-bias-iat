import type { ActivityDefinition } from '../config/activities';
import { CONTENT } from '../config/content';
import type { ActivityResult } from '../utils/calculateResult';
import { Button } from './ui/Button';
import { Disclosure } from './ui/Disclosure';
import { Card, PageShell } from './ui/PageShell';

interface ResultPageProps {
  activity: ActivityDefinition;
  result: ActivityResult;
  onContinue: () => void;
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

/** Milliseconds as seconds to two places, the only precision this page shows. */
function toSeconds(ms: number): string {
  return (ms / 1000).toFixed(2);
}

/**
 * Which target was quicker, and which was not. Read straight off `direction`,
 * which the scoring already decides with the same threshold — this page adds no
 * judgement of its own.
 */
function fasterAndSlower(activity: ActivityDefinition, result: ActivityResult) {
  const fasterIsA = result.direction === 'fasterWithTargetA';
  return {
    faster: activity.labels[fasterIsA ? 'targetA' : 'targetB'],
    slower: activity.labels[fasterIsA ? 'targetB' : 'targetA'],
  };
}

/** Both bars use one colour: a difference in length is the only comparison
 * being made, and colour must not imply that either pairing is better. */
function ComparisonBar({ label, seconds, value, maxValue }: { label: string; seconds: string; value: number; maxValue: number }) {
  const width = maxValue === 0 ? 0 : Math.max((value / maxValue) * 100, 4);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm leading-snug text-ink">{label}</p>
        <p className="shrink-0 text-sm font-semibold text-ink">{seconds}s</p>
      </div>
      <div aria-hidden="true" className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zone">
        <div className="h-full rounded-full bg-ink transition-[width]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function ResultPage({ activity, result, onContinue }: ResultPageProps) {
  const { result: copy } = CONTENT;
  const attribute = activity.labels[activity.focalAttribute];

  const scored = result.dScore !== null;
  const { faster, slower } = fasterAndSlower(activity, result);

  const sentence = !scored
    ? copy.incomplete
    : result.direction === 'similar'
      ? copy.similar
      : fill(copy.lean, { attribute, faster, slower });

  const means = [
    { slot: 'targetA' as const, summary: result.targetA },
    { slot: 'targetB' as const, summary: result.targetB },
  ];
  const maxMean = Math.max(result.targetA.meanReactionTimeMs ?? 0, result.targetB.meanReactionTimeMs ?? 0);

  // A gap under 5 ms rounds to 0.00 seconds. Vanishingly unlikely to coincide
  // with a named direction, but "about 0.00 seconds faster" would read as a
  // bug rather than as a small number.
  const gapSeconds = result.differenceMs === null ? null : toSeconds(result.differenceMs);
  const gapText =
    result.direction === 'similar' || gapSeconds === null
      ? copy.gapSimilar
      : fill(copy.gap, {
          seconds: gapSeconds === '0.00' ? copy.gapBelowResolution : gapSeconds,
          category: faster,
          attribute,
        });

  return (
    <PageShell wide>
      <h1 className="text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-semibold text-ink">{copy.heading}</h1>

      {/* Above the result, not below it. People read this page on their own,
          so the caveat has to land before the sentence it qualifies rather
          than as a footnote to something already accepted. */}
      <div className="mt-6 rounded-[8px] border border-line bg-zone px-4 py-4">
        <p className="text-sm font-semibold text-ink">{copy.caveatHeading}</p>
        <p className="mt-2 leading-relaxed text-ink-soft">{copy.caveat}</p>
      </div>

      <Card className="mt-4">
        <p className="text-lg leading-relaxed text-ink">{sentence}</p>
      </Card>

      {result.quality === 'limited' && (
        <div className="mt-5 rounded-[8px] border-2 border-signal bg-signal-tint px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            <span aria-hidden="true" className="mr-2">
              !
            </span>
            A note on this comparison
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{copy.qualityWarning}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {result.qualityReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {scored && (
        <section className="mt-6" aria-labelledby="comparison-heading">
          <h2 id="comparison-heading" className="text-lg font-semibold text-ink">
            {copy.comparisonHeading}
          </h2>
          <div className="mt-4 space-y-5">
            {means.map(({ slot, summary }) =>
              summary.meanReactionTimeMs === null ? null : (
                <ComparisonBar
                  key={slot}
                  label={fill(copy.barCaption, { category: activity.labels[slot], attribute })}
                  seconds={toSeconds(summary.meanReactionTimeMs)}
                  value={summary.meanReactionTimeMs}
                  maxValue={maxMean}
                />
              ),
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{gapText}</p>
        </section>
      )}

      <div className="mt-7 space-y-3">
        {copy.sections.map((section) => (
          <Disclosure key={section.toggle} summary={section.toggle}>
            <p className="leading-relaxed">{section.body}</p>
          </Disclosure>
        ))}
      </div>

      <Button className="mt-8 w-full sm:w-auto sm:self-start" onClick={onContinue}>
        {copy.continueButton}
      </Button>
    </PageShell>
  );
}

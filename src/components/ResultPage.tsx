import type { ActivityDefinition } from '../config/activities';
import { CONTENT } from '../config/content';
import type { ActivityResult, TargetSummary } from '../utils/calculateResult';
import { Button } from './ui/Button';
import { Disclosure } from './ui/Disclosure';
import { Card, PageShell } from './ui/PageShell';

interface ResultPageProps {
  activity: ActivityDefinition;
  result: ActivityResult;
  onContinue: () => void;
}

/** Direction only. No sentence here carries how large the gap was. */
function patternSentence(activity: ActivityDefinition, result: ActivityResult): string {
  if (result.dScore === null) return CONTENT.result.incomplete;
  if (result.direction === 'similar') return activity.result.similar;
  return result.direction === 'fasterWithTargetA'
    ? activity.result.fasterWithTargetA
    : activity.result.fasterWithTargetB;
}

function formatMs(value: number | null): string {
  return value === null ? 'Not available' : `${Math.round(value)} ms`;
}

function formatAccuracy(value: number | null): string {
  return value === null ? 'Not available' : `${Math.round(value * 100)}%`;
}

/** Both bars use one colour: a difference in length is the only comparison
 * being made, and colour must not imply that either pairing is better. */
function ComparisonBar({ label, value, maxValue }: { label: string; value: number | null; maxValue: number }) {
  const width = value === null || maxValue === 0 ? 0 : Math.max((value / maxValue) * 100, 4);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm leading-snug text-ink">{label}</p>
        <p className="shrink-0 text-sm font-semibold text-ink">{formatMs(value)}</p>
      </div>
      <div aria-hidden="true" className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zone">
        <div className="h-full rounded-full bg-ink transition-[width]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TargetDetail({ summary, title }: { summary: TargetSummary; title: string }) {
  const { labels } = CONTENT.result;

  return (
    <div className="rounded-[8px] border border-line bg-surface px-4 py-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <dl className="mt-2 space-y-1 text-sm text-muted">
        <div className="flex justify-between gap-3">
          <dt>{labels.meanRow}</dt>
          <dd className="font-medium text-ink">{formatMs(summary.meanReactionTimeMs)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{labels.accuracyRow}</dt>
          <dd className="font-medium text-ink">{formatAccuracy(summary.accuracy)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{labels.usableRow}</dt>
          <dd className="font-medium text-ink">
            {summary.usableTrials} of {summary.scoredTrials}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function ResultPage({ activity, result, onContinue }: ResultPageProps) {
  const { result: copy } = CONTENT;
  const maxMean = Math.max(result.targetA.meanReactionTimeMs ?? 0, result.targetB.meanReactionTimeMs ?? 0);

  return (
    <PageShell wide>
      <h1 className="text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-semibold text-ink">{copy.heading}</h1>

      {/* Above the result, not below it. People read this page on their own,
          so the caveat has to land before the sentence it qualifies rather
          than as a footnote to something already accepted. */}
      <div className="mt-6 rounded-[8px] border border-line bg-zone px-4 py-4">
        <p className="text-sm font-semibold text-ink">{copy.chanceNoteHeading}</p>
        <p className="mt-2 leading-relaxed text-ink-soft">{copy.chanceNote}</p>
      </div>

      <Card className="mt-4">
        <p className="text-lg leading-relaxed text-ink">{patternSentence(activity, result)}</p>
        <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">{copy.disclaimer}</p>
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

      <section className="mt-6" aria-labelledby="comparison-heading">
        <h2 id="comparison-heading" className="text-lg font-semibold text-ink">
          {copy.comparisonHeading}
        </h2>
        <div className="mt-4 space-y-5">
          <ComparisonBar
            label={`${copy.labels.meanPrefix} — ${activity.blockLabels.targetAFocal}`}
            value={result.targetA.meanReactionTimeMs}
            maxValue={maxMean}
          />
          <ComparisonBar
            label={`${copy.labels.meanPrefix} — ${activity.blockLabels.targetBFocal}`}
            value={result.targetB.meanReactionTimeMs}
            maxValue={maxMean}
          />
        </div>
        {result.differenceMs !== null && (
          <p className="mt-4 text-sm text-muted">
            {copy.differenceLabel}: <span className="font-semibold text-ink">{result.differenceMs} ms</span>
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-muted">{copy.noStrengthNote}</p>
      </section>

      <section className="mt-7" aria-labelledby="detail-heading">
        <h2 id="detail-heading" className="text-lg font-semibold text-ink">
          {copy.detailHeading}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TargetDetail summary={result.targetA} title={activity.blockLabels.targetAFocal} />
          <TargetDetail summary={result.targetB} title={activity.blockLabels.targetBFocal} />
        </div>
      </section>

      {/* No score disclosure. The figure a D-score produces is a size, and this
          page reports direction only — printing the number, even behind a
          toggle, would put back exactly what the bands were removed for. */}
      <div className="mt-7 space-y-3">
        <Disclosure summary={copy.whatDoesThisMeanToggle}>
          <p className="leading-relaxed">{copy.whatDoesThisMean}</p>
        </Disclosure>
      </div>

      <Button className="mt-8 w-full sm:w-auto sm:self-start" onClick={onContinue}>
        {copy.continueButton}
      </Button>
    </PageShell>
  );
}

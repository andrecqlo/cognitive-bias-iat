import { CONTENT } from '../config/content';
import type { ActivityResult, RoundSummary } from '../utils/calculateResult';
import { Button } from './ui/Button';
import { Disclosure } from './ui/Disclosure';
import { Card, PageShell } from './ui/PageShell';

interface ResultPageProps {
  result: ActivityResult;
  onContinue: () => void;
}

function patternSentence(result: ActivityResult): string {
  const { patterns } = CONTENT.result;
  if (result.percentageDifference === null) return patterns.incomplete;
  const percent = String(result.percentageDifference);
  if (result.direction === 'similar') return patterns.similar;
  if (result.direction === 'fasterWithIncompetent') return patterns.fasterWithIncompetent.replace('{percent}', percent);
  return patterns.fasterWithCompetent.replace('{percent}', percent);
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

function RoundDetail({ summary, title }: { summary: RoundSummary; title: string }) {
  return (
    <div className="rounded-[8px] border border-line bg-surface px-4 py-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <dl className="mt-2 space-y-1 text-sm text-muted">
        <div className="flex justify-between gap-3">
          <dt>Median response time</dt>
          <dd className="font-medium text-ink">{formatMs(summary.medianReactionTimeMs)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>First-response accuracy</dt>
          <dd className="font-medium text-ink">{formatAccuracy(summary.accuracy)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Usable trials</dt>
          <dd className="font-medium text-ink">
            {summary.usableTrials} of {summary.totalTrials}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function ResultPage({ result, onContinue }: ResultPageProps) {
  const { result: copy } = CONTENT;
  const maxMedian = Math.max(result.pairingA.medianReactionTimeMs ?? 0, result.pairingB.medianReactionTimeMs ?? 0);

  return (
    <PageShell wide>
      <h1 className="text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-semibold text-ink">{copy.heading}</h1>

      <Card className="mt-6">
        <p className="text-lg leading-relaxed text-ink">{patternSentence(result)}</p>
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
          Response time comparison
        </h2>
        <div className="mt-4 space-y-5">
          <ComparisonBar label={copy.labels.medianA} value={result.pairingA.medianReactionTimeMs} maxValue={maxMedian} />
          <ComparisonBar label={copy.labels.medianB} value={result.pairingB.medianReactionTimeMs} maxValue={maxMedian} />
        </div>
        {result.percentageDifference !== null && (
          <p className="mt-4 text-sm text-muted">
            Difference between pairings: <span className="font-semibold text-ink">{result.percentageDifference}%</span>
          </p>
        )}
      </section>

      <section className="mt-7" aria-labelledby="detail-heading">
        <h2 id="detail-heading" className="text-lg font-semibold text-ink">
          Round detail
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <RoundDetail summary={result.pairingA} title="Neurodivergent + Incompetent pairing" />
          <RoundDetail summary={result.pairingB} title="Neurodivergent + Competent pairing" />
        </div>
      </section>

      <div className="mt-7">
        <Disclosure summary={copy.whatDoesThisMeanToggle}>
          <p className="leading-relaxed">{copy.whatDoesThisMean}</p>
        </Disclosure>
      </div>

      <Button className="mt-8 w-full sm:w-auto sm:self-start" onClick={onContinue}>
        Continue
      </Button>
    </PageShell>
  );
}

import { CONTENT } from '../config/content';
import { Button } from './ui/Button';
import { Card, PageShell } from './ui/PageShell';

interface InformationPageProps {
  acknowledged: boolean;
  onAcknowledge: (value: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function InformationPage({ acknowledged, onAcknowledge, onContinue, onBack }: InformationPageProps) {
  const { information } = CONTENT;

  return (
    <PageShell>
      <h1 className="text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-semibold text-ink">{information.heading}</h1>

      <ul className="mt-6 space-y-3">
        {information.points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" />
            <span className="leading-relaxed text-ink-soft">{point}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-[8px] border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
        {information.accessibilityNote}
      </p>

      <Card className="mt-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => onAcknowledge(event.target.checked)}
            className="mt-0.5 size-6 shrink-0 accent-[#FF6223]"
          />
          <span className="leading-relaxed text-ink">{information.acknowledgement}</span>
        </label>

        <Button className="mt-6 w-full" onClick={onContinue} disabled={!acknowledged}>
          {information.continueButton}
        </Button>
        {!acknowledged && (
          <p className="mt-3 text-center text-sm text-muted">
            Select the box above to continue.
          </p>
        )}
      </Card>

      <Button variant="quiet" className="mt-6 self-start px-0" onClick={onBack}>
        Back
      </Button>
    </PageShell>
  );
}

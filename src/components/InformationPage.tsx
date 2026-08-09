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

      <Card className="mt-8">
        <label className="flex cursor-pointer items-start gap-3">
          {/* The accent reads the palette variable rather than a literal, so it
              cannot be left behind when the brand colour changes. */}
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => onAcknowledge(event.target.checked)}
            className="mt-0.5 size-6 shrink-0 accent-[var(--color-signal)]"
          />
          <span className="leading-relaxed text-ink">{information.acknowledgement}</span>
        </label>

        <Button className="mt-6 w-full" onClick={onContinue} disabled={!acknowledged}>
          {information.continueButton}
        </Button>
        {!acknowledged && <p className="mt-3 text-center text-sm text-muted">{information.checkboxHint}</p>}
      </Card>

      <Button variant="quiet" className="mt-6 self-start px-0" onClick={onBack}>
        {information.backButton}
      </Button>
    </PageShell>
  );
}

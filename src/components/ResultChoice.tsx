import { CONTENT } from '../config/content';
import { Button } from './ui/Button';
import { Card, PageShell } from './ui/PageShell';

interface ResultChoiceProps {
  onShow: () => void;
  onSkip: () => void;
}

export function ResultChoice({ onShow, onSkip }: ResultChoiceProps) {
  const { resultChoice } = CONTENT;

  return (
    <PageShell>
      <Card>
        <h1 className="text-[clamp(1.5rem,6vw,2.25rem)] leading-tight font-semibold text-ink">{resultChoice.heading}</h1>
        <p className="mt-4 leading-relaxed text-muted">{resultChoice.body}</p>

        {/* Both options are given equal weight, so neither choice is nudged. */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={onShow}>
            {resultChoice.showButton}
          </Button>
          <Button variant="secondary" onClick={onSkip}>
            {resultChoice.skipButton}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}

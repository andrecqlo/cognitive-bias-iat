import { CONTENT } from '../config/content';
import { Button } from './ui/Button';
import { Card, PageShell } from './ui/PageShell';

interface CompletionPageProps {
  onStartAgain: () => void;
  onClearSession: () => void;
  onReturnHome: () => void;
  prefersReducedMotion: boolean;
}

export function CompletionPage({
  onStartAgain,
  onClearSession,
  onReturnHome,
  prefersReducedMotion,
}: CompletionPageProps) {
  const { completion } = CONTENT;

  return (
    <PageShell>
      <Card>
        {/* A single restrained mark stands in for a completion animation. */}
        <span
          aria-hidden="true"
          className={`flex size-12 items-center justify-center rounded-full bg-signal-tint text-xl text-signal ${
            prefersReducedMotion ? '' : 'transition-transform'
          }`}
        >
          ✓
        </span>
        <h1 className="mt-5 text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-semibold text-ink">
          {completion.heading}
        </h1>
        <p className="mt-4 leading-relaxed text-muted">{completion.body}</p>

        <div className="mt-7 grid gap-3">
          <Button onClick={onStartAgain}>{completion.startAgainButton}</Button>
          <Button variant="secondary" onClick={onReturnHome}>
            {completion.homeButton}
          </Button>
          <Button variant="quiet" onClick={onClearSession}>
            {completion.clearSessionButton}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}

import { CONTENT } from '../config/content';
import { Button } from './ui/Button';
import { Disclosure } from './ui/Disclosure';
import { PageShell } from './ui/PageShell';

interface LandingPageProps {
  onStart: () => void;
  onClearSession: () => void;
  sessionClearedNotice: boolean;
}

export function LandingPage({ onStart, onClearSession, sessionClearedNotice }: LandingPageProps) {
  const { landing } = CONTENT;

  return (
    <PageShell>
      {sessionClearedNotice && (
        <p role="status" className="mb-6 rounded-[8px] border border-line bg-surface px-4 py-3 text-sm text-ink">
          <span aria-hidden="true" className="mr-2 text-signal">
            ✓
          </span>
          Your session data has been cleared from this browser.
        </p>
      )}

      <p className="text-sm font-semibold tracking-wide text-signal uppercase">Neurodiversity Edition</p>
      <h1 className="mt-3 text-[clamp(2.25rem,9vw,3.5rem)] leading-none font-semibold text-ink">{landing.heading}</h1>
      <p className="mt-4 text-xl leading-snug text-ink-soft">{landing.subtitle}</p>
      <p className="mt-5 text-base leading-relaxed text-muted">{landing.intro}</p>

      <ul className="mt-7 grid gap-2 sm:grid-cols-2">
        {landing.facts.map((fact) => (
          <li key={fact} className="flex items-start gap-2 rounded-[8px] border border-line bg-surface px-4 py-3">
            <span aria-hidden="true" className="mt-0.5 text-signal">
              ●
            </span>
            <span className="text-sm text-ink">{fact}</span>
          </li>
        ))}
      </ul>

      <Button className="mt-8 w-full sm:w-auto sm:self-start" onClick={onStart}>
        {landing.startButton}
      </Button>

      <div className="mt-8">
        <Disclosure summary={landing.howItWorksToggle}>
          <p className="leading-relaxed">{landing.howItWorks}</p>
        </Disclosure>
      </div>

      <footer className="mt-10 border-t border-line pt-5">
        <Button variant="quiet" onClick={onClearSession} className="px-0">
          Clear my session
        </Button>
      </footer>
    </PageShell>
  );
}

import { ACTIVITIES } from '../config/activities';
import { CONTENT } from '../config/content';
import { Button } from './ui/Button';
import { Disclosure } from './ui/Disclosure';
import { PageShell } from './ui/PageShell';

interface LandingPageProps {
  onStart: (activityId: string) => void;
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

      <h1 className="text-[clamp(2.25rem,9vw,3.5rem)] leading-none font-semibold text-ink">{landing.heading}</h1>
      <p className="mt-4 text-xl leading-snug text-ink-soft">{landing.subtitle}</p>
      <p className="mt-5 text-base leading-relaxed text-muted">{landing.intro}</p>

      {/* One explainer, sitting with the intro it elaborates. */}
      <div className="mt-6">
        <Disclosure summary={landing.howItWorksToggle}>
          <p className="leading-relaxed">{landing.howItWorks}</p>
        </Disclosure>
      </div>

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

      <section className="mt-10" aria-labelledby="choose-heading">
        <h2 id="choose-heading" className="text-lg font-semibold text-ink">
          {landing.chooseHeading}
        </h2>
        <p className="mt-1 text-sm text-muted">{landing.chooseHint}</p>

        <ul className="mt-4 space-y-3">
          {ACTIVITIES.map((activity) => (
            <li key={activity.id} className="rounded-[8px] border border-line bg-surface px-4 py-4">
              <h3 className="text-base font-semibold text-ink">{activity.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{activity.summary}</p>
              <Button
                className="mt-4 w-full sm:w-auto"
                onClick={() => onStart(activity.id)}
                aria-label={`${landing.startButton}: ${activity.title}`}
              >
                {landing.startButton}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <Disclosure summary={landing.referencesToggle}>
          <p className="text-sm">{landing.referencesHint}</p>
          <ul className="mt-3 space-y-3">
            {landing.references.map((reference) => (
              <li key={reference.url}>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4 hover:text-signal"
                >
                  {reference.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <span aria-hidden="true" className="ml-1 text-signal">
                    ↗
                  </span>
                </a>
                <p className="mt-0.5 text-sm leading-relaxed">{reference.detail}</p>
              </li>
            ))}
          </ul>
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

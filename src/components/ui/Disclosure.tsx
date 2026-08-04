import type { ReactNode } from 'react';

interface DisclosureProps {
  summary: string;
  children: ReactNode;
}

/** Native details/summary, so it works without JavaScript state and is
 * keyboard- and screen-reader-friendly by default. */
export function Disclosure({ summary, children }: DisclosureProps) {
  return (
    <details className="group rounded-[8px] border border-line bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold text-ink">
        <span>{summary}</span>
        <span aria-hidden="true" className="text-signal transition-transform group-open:rotate-90">
          ▸
        </span>
      </summary>
      <div className="border-t border-line px-5 py-4 text-muted">{children}</div>
    </details>
  );
}

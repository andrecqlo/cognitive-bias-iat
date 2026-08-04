import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  /** Wider layout for the result screen's comparison bars. */
  wide?: boolean;
}

/**
 * Scrollable layout used by every non-timed screen. Flat geometric shapes give
 * the pages some character without gradients, shadows or illustration.
 */
export function PageShell({ children, wide = false }: PageShellProps) {
  return (
    // No overflow-hidden here: content taller than the viewport must still
    // scroll. The decorative layer clips itself instead.
    <div className="relative min-h-[100svh] bg-canvas">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-20 size-64 rounded-full bg-signal-tint sm:size-80" />
        <div className="absolute top-1/3 -left-24 size-48 rounded-[8px] bg-zone sm:size-64" />
        <div className="absolute -bottom-24 right-1/4 size-56 rounded-full bg-zone" />
      </div>

      {/* Top-aligned rather than vertically centred: flex centring pushes tall
          content above the top edge, where it cannot be scrolled back into view. */}
      <main
        className={`relative mx-auto flex w-full flex-col px-5 py-10 sm:px-8 ${wide ? 'max-w-3xl' : 'max-w-2xl'}`}
        style={{
          paddingLeft: 'max(1.25rem, env(safe-area-inset-left))',
          paddingRight: 'max(1.25rem, env(safe-area-inset-right))',
          paddingTop: 'max(2.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </main>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[8px] border border-line bg-surface p-6 sm:p-8 ${className}`}>{children}</div>;
}

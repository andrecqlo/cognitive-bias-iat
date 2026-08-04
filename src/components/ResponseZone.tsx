import { useRef } from 'react';
import type { Side } from '../types/activity';

interface ResponseZoneProps {
  side: Side;
  labels: string[];
  onRespond: (side: Side) => void;
  /** Shown only on pointer-and-keyboard devices; keyboard use is optional. */
  keyboardKey: string;
  disabled?: boolean;
}

const ARROW: Record<Side, string> = { left: '◀', right: '▶' };

export function ResponseZone({ side, labels, onRespond, keyboardKey, disabled = false }: ResponseZoneProps) {
  // Pointer input is handled on pointerdown so the reading is not delayed by
  // the browser's click synthesis; the follow-up click is then ignored.
  const handledPointerRef = useRef(false);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Respond ${side}: ${labels.join(' or ')}`}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        handledPointerRef.current = true;
        onRespond(side);
      }}
      onClick={() => {
        if (handledPointerRef.current) {
          handledPointerRef.current = false;
          return;
        }
        onRespond(side);
      }}
      className="no-select flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-[8px] border-2 border-line bg-zone px-2 py-3 transition-colors active:bg-zone-press disabled:opacity-60"
      style={{ WebkitTouchCallout: 'none' }}
    >
      <span aria-hidden="true" className="text-signal text-base leading-none">
        {ARROW[side]}
      </span>
      <span className="flex flex-col items-center leading-tight">
        {labels.map((label, index) => (
          <span key={label} className="flex flex-col items-center">
            {index > 0 && (
              <span aria-hidden="true" className="text-[0.7rem] font-normal text-muted uppercase tracking-wide">
                or
              </span>
            )}
            <span className="text-[clamp(0.9rem,3.6vw,1.25rem)] font-semibold text-ink">{label}</span>
          </span>
        ))}
      </span>
      <span aria-hidden="true" className="mt-1 hidden text-xs text-muted sm:block">
        {keyboardKey}
      </span>
    </button>
  );
}

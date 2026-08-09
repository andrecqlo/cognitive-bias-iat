import { CONTENT } from '../config/content';
import type { ActivityEngine } from '../hooks/useActivityEngine';
import { Button } from './ui/Button';
import { Card, PageShell } from './ui/PageShell';

/** Mirrors the response zones the participant is about to see, so the sides are
 * learned from the same layout rather than from a description of it. */
function SidePreview({ labels, align, caption }: { labels: string[]; align: 'left' | 'right'; caption: string }) {
  return (
    <div
      className={`flex flex-1 flex-col gap-1 rounded-[8px] border-2 border-line bg-zone px-4 py-4 ${
        align === 'left' ? 'items-start text-left' : 'items-end text-right'
      }`}
    >
      <span className="text-xs tracking-wide text-muted uppercase">{caption}</span>
      {labels.map((label, index) => (
        <span key={label} className="text-base font-semibold text-ink sm:text-lg">
          {index > 0 && <span className="mr-1 text-xs font-normal text-muted lowercase">or</span>}
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * Announces the two categories to watch for before each scored block.
 *
 * This screen is part of the procedure rather than a courtesy: the participant
 * has to know which two categories are focal before the block starts, because
 * the whole task is "is this word one of those two".
 */
export function BlockIntro({ engine }: { engine: ActivityEngine }) {
  const { blockIntro, round } = CONTENT;
  const { focal, currentBlock } = engine;
  if (!focal || !currentBlock) return null;

  const nonFocalLabels = [round.nonFocalLabel];
  const leftLabels = focal.focalSide === 'left' ? focal.focalLabels : nonFocalLabels;
  const rightLabels = focal.focalSide === 'right' ? focal.focalLabels : nonFocalLabels;
  // Every block after the first swaps one of the two, and saying so is what
  // stops the change being noticed three trials in.
  const hasChanged = currentBlock.blockNumber > 1;

  return (
    <PageShell>
      <Card>
        <p className="text-xs tracking-wide text-muted uppercase">{engine.blockLabel}</p>
        <h1 className="mt-2 text-[clamp(1.5rem,6vw,2.25rem)] leading-tight font-semibold text-ink">
          {blockIntro.heading}
        </h1>

        <div className="mt-5 rounded-[8px] border-2 border-ink bg-zone px-4 py-4 text-center">
          <p className="text-[clamp(1.1rem,5vw,1.6rem)] leading-tight font-semibold text-ink">
            {focal.focalLabels.map((label, index) => (
              <span key={label}>
                {index > 0 && <span className="mx-2 text-base font-normal text-muted lowercase">or</span>}
                {label}
              </span>
            ))}
          </p>
        </div>

        {hasChanged && <p className="mt-4 text-sm font-medium text-ink">{blockIntro.changedNote}</p>}
        <p className="mt-4 leading-relaxed text-muted">{blockIntro.body}</p>

        <div className="mt-6 flex gap-3">
          <SidePreview labels={leftLabels} align="left" caption="Left side" />
          <SidePreview labels={rightLabels} align="right" caption="Right side" />
        </div>

        <Button className="mt-7 w-full" onClick={engine.actions.startBlock}>
          {blockIntro.startButton}
        </Button>
      </Card>
    </PageShell>
  );
}

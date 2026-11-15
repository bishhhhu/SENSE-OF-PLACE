import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus, RotateCcw, RotateCw, Crosshair, X } from 'lucide-react';
import { useApp } from '../../state/store';
import { elementById } from '../../data/elements';
import { EvidenceBadge } from '../Evidence';
import { cameraNudge } from '../../scene/camera/CameraRig';

/**
 * Side panel on desktop, collapsible bottom sheet on phones.
 */
export function Dock({ title, kicker, children, wide = false }: { title: string; kicker?: string; children: ReactNode; wide?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <aside
      className={`panel pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex max-h-[52vh] flex-col rounded-t-md md:inset-x-auto md:bottom-4 md:left-4 md:top-[76px] md:max-h-none md:rounded-[3px] ${
        wide ? 'md:w-[380px]' : 'md:w-[340px]'
      }`}
    >
      <button
        className="flex w-full items-center justify-between gap-3 border-b border-charcoal/10 px-5 py-3 text-left md:cursor-default"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          {kicker && <span className="label block">{kicker}</span>}
          <span className="font-serif text-2xl leading-tight">{title}</span>
        </span>
        <span className="md:hidden">{open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</span>
      </button>
      <div className={`${open ? 'block' : 'hidden'} min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 md:block`}>{children}</div>
    </aside>
  );
}

export function ElementDetail({ id, compact = false }: { id: string; compact?: boolean }) {
  const el = elementById(id);
  const select = useApp((s) => s.select);
  if (!el) return null;
  return (
    <article>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">{el.category}</p>
          <h3 className="mt-1 font-serif text-[26px] leading-tight">{el.name}</h3>
        </div>
        <button className="tool shrink-0" onClick={() => select(null)} aria-label="Clear selection">
          <X size={16} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <EvidenceBadge e={el.evidence} />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal-soft">Levels: {el.levels.join(' · ')}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed">{el.description}</p>
      <p className="label mt-4">Purpose</p>
      <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">{el.purpose}</p>
      {!compact && (
        <>
          <p className="label mt-4">Seen in the render</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-charcoal-soft marker:text-olive">
            {el.observations.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          {el.assumptions && (
            <>
              <p className="label mt-4">Assumptions in the model</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-charcoal-soft marker:text-terracotta">
                {el.assumptions.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <button className="mt-4 inline-flex items-center gap-1.5 text-sm text-terracotta hover:text-terracotta-dark" onClick={() => select(el.id)}>
        <Crosshair size={14} /> Frame in view
      </button>
    </article>
  );
}

/** Floating element card for modes whose dock shows something else. */
export function SelectionCard() {
  const selected = useApp((s) => s.selected);
  const mode = useApp((s) => s.mode);
  if (!selected || mode === 'explore' || mode === 'tour' || mode === 'pano' || mode === 'plan' || mode === 'xr') return null;
  return (
    <div className="panel pointer-events-auto fixed right-4 top-[76px] z-20 hidden max-h-[calc(100vh-170px)] w-[340px] overflow-y-auto rounded-[3px] p-5 md:block">
      <ElementDetail id={selected} compact />
    </div>
  );
}

export function CameraTools() {
  const resetCamera = useApp((s) => s.resetCamera);
  return (
    <div className="pointer-events-auto fixed bottom-[calc(52vh+12px)] right-3 z-20 flex flex-col gap-1.5 md:bottom-4 md:right-4" role="toolbar" aria-label="Camera">
      <button className="tool" onClick={() => cameraNudge.zoom(-0.25)} aria-label="Zoom in" title="Zoom in">
        <Plus size={16} />
      </button>
      <button className="tool" onClick={() => cameraNudge.zoom(0.3)} aria-label="Zoom out" title="Zoom out">
        <Minus size={16} />
      </button>
      <button className="tool" onClick={() => cameraNudge.rotate(-30)} aria-label="Rotate left" title="Rotate left">
        <RotateCcw size={16} />
      </button>
      <button className="tool" onClick={() => cameraNudge.rotate(30)} aria-label="Rotate right" title="Rotate right">
        <RotateCw size={16} />
      </button>
      <button className="tool" onClick={resetCamera} aria-label="Reset camera" title="Reset camera">
        <Crosshair size={16} />
      </button>
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-5 border-l-2 border-olive/60 pl-3 text-xs leading-relaxed text-charcoal-soft">{children}</p>;
}

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, LogOut, Eye, EyeOff, Layers3, Building2 } from 'lucide-react';
import { useApp } from '../../state/store';
import { viewPresets, tourStops, panoPoints } from '../../data/views';
import { elements, type Category } from '../../data/elements';
import { levels, type LevelId } from '../../data/building';
import { zones, zoneTone } from '../../data/floors';
import { EvidenceBadge } from '../Evidence';
import { Dock, ElementDetail, Hint } from './common';

export function ModelPanel() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const current = viewPresets.find((v) => v.id === view)!;
  return (
    <Dock kicker="Interactive model" title="Views">
      <ul className="grid grid-cols-2 gap-1.5">
        {viewPresets.map((v, i) => (
          <li key={v.id}>
            <button
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              className={`w-full border px-3 py-2.5 text-left transition ${
                view === v.id ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/15 hover:border-charcoal/60'
              }`}
            >
              <span className="block font-mono text-[10px] opacity-70">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[13px]">{v.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-charcoal-soft">{current.note}</p>
      {view === 'section' && (
        <p className="mt-3 rounded-sm bg-terracotta/10 p-3 text-xs leading-relaxed text-terracotta-dark">
          Section cut is active. The model is cut through the canopy; floor slabs are shown, but room layouts behind the screen are not
          documented in the reference and are left empty.
        </p>
      )}
      <Hint>
        Drag to orbit · right-drag or two fingers to pan · scroll or pinch to zoom · click any part of the building to identify it.
      </Hint>
    </Dock>
  );
}

const cats: Category[] = ['Canopy', 'Envelope', 'Massing', 'Circulation', 'Public space', 'Landscape'];

export function ExplorePanel() {
  const selected = useApp((s) => s.selected);
  const select = useApp((s) => s.select);
  const ghost = useApp((s) => s.ghostOthers);
  const setGhost = useApp((s) => s.setGhostOthers);
  return (
    <Dock kicker="Building exploration" title={selected ? 'Element' : 'Elements'} wide>
      {selected ? (
        <>
          <ElementDetail id={selected} />
          <div className="hairline my-5" />
          <button className="btn-outline w-full !py-2 text-xs" onClick={() => setGhost(!ghost)} aria-pressed={ghost}>
            {ghost ? <EyeOff size={14} /> : <Eye size={14} />} {ghost ? 'Show everything' : 'Fade everything else'}
          </button>
          <button className="mt-2 w-full py-2 text-xs text-charcoal-soft underline underline-offset-4 hover:text-terracotta" onClick={() => select(null)}>
            Back to all elements
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-charcoal-soft">Choose an element, or click directly on the model.</p>
          {cats.map((c) => (
            <div key={c} className="mt-5">
              <p className="label mb-1.5">{c}</p>
              <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
                {elements
                  .filter((e) => e.category === c)
                  .map((e) => (
                    <li key={e.id}>
                      <button className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm hover:text-terracotta" onClick={() => select(e.id)}>
                        {e.name}
                        <EvidenceBadge e={e.evidence} />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </Dock>
  );
}

export function FloorsPanel() {
  const iso = useApp((s) => s.isolatedLevel);
  const setIso = useApp((s) => s.setIsolatedLevel);
  const exploded = useApp((s) => s.exploded);
  const setExploded = useApp((s) => s.setExploded);
  const requestCamera = useApp((s) => s.requestCamera);
  const select = useApp((s) => s.select);
  const level = iso ? levels.find((l) => l.id === iso)! : null;

  const isolate = (id: LevelId) => {
    setIso(id);
    const l = levels.find((x) => x.id === id)!;
    requestCamera({ position: [-62, l.elevation + 62, 70], target: [0, l.elevation, -4], fov: 32 });
  };
  const whole = () => {
    setIso(null);
    requestCamera({ position: [-80, 64, 100], target: [-2, 4, -2], fov: 32 });
  };
  const compare = () => {
    setExploded(true);
    requestCamera({ position: [-110, 70, 120], target: [0, 16, -4], fov: 32 });
  };

  return (
    <Dock kicker="Floor exploration" title={exploded ? 'Compare storeys' : level ? level.name : 'Storeys'} wide>
      <p className="text-sm leading-relaxed text-charcoal-soft">
        Three storeys and a roof are inferred from the facade. Select one to lift the storeys above it away and read a plan cut.
      </p>
      <div className="mt-4 flex gap-2">
        <div className="flex flex-col gap-1.5" role="group" aria-label="Storeys">
          {[...levels].reverse().map((l) => (
            <button
              key={l.id}
              onClick={() => isolate(l.id)}
              aria-pressed={iso === l.id}
              className={`grid h-11 w-11 place-items-center border font-mono text-sm transition ${
                iso === l.id ? 'border-terracotta bg-terracotta text-ivory' : 'border-charcoal/20 hover:border-charcoal'
              }`}
              title={l.name}
            >
              {l.short}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <button className={`btn !justify-start border !py-2.5 text-xs ${!iso && !exploded ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/20'}`} onClick={whole}>
            <Building2 size={15} /> Whole building
          </button>
          <button className={`btn !justify-start border !py-2.5 text-xs ${exploded ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/20'}`} onClick={compare}>
            <Layers3 size={15} /> Compare (exploded)
          </button>
          {level && (
            <div className="mt-1 border-l-2 border-terracotta pl-3">
              <EvidenceBadge e={level.evidence} />
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal-soft">Elevation +{level.elevation.toFixed(1)} m (est.)</p>
            </div>
          )}
        </div>
      </div>

      {level && (
        <>
          <p className="mt-5 text-sm leading-relaxed">{level.summary}</p>
          <p className="label mt-5 mb-2">Spatial organisation</p>
          <ul className="space-y-1.5">
            {zones
              .filter((z) => z.level === level.id && z.tone !== 'undocumented')
              .map((z) => (
                <li key={z.id}>
                  <button className="flex w-full items-start gap-2.5 text-left text-sm hover:text-terracotta" onClick={() => z.elementId && select(z.elementId, false)}>
                    <span className="mt-1 h-3 w-3 shrink-0" style={{ background: zoneTone[z.tone].fill }} />
                    <span>
                      {z.name} <EvidenceBadge e={z.evidence} className="ml-1 scale-90" />
                      <span className="block text-xs text-charcoal-soft">{z.note}</span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          <p className="mt-4 flex items-start gap-2.5 text-xs text-charcoal-soft">
            <span className="mt-0.5 h-3 w-3 shrink-0" style={{ background: zoneTone.undocumented.fill }} />
            Grey zones are block interiors the render does not show. They are left blank rather than invented.
          </p>
        </>
      )}

      {exploded && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-charcoal/20">
                <th className="label py-2 pr-2">Storey</th>
                <th className="label py-2 pr-2">Documented spaces</th>
                <th className="label py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {[...levels].reverse().map((l) => {
                const zs = zones.filter((z) => z.level === l.id && z.tone !== 'undocumented');
                return (
                  <tr key={l.id} className="border-b border-charcoal/10 align-top">
                    <td className="py-2 pr-2 font-serif text-base">{l.short}</td>
                    <td className="py-2 pr-2">{zs.map((z) => z.name).join(', ') || '—'}</td>
                    <td className="py-2">
                      <EvidenceBadge e={l.evidence} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Dock>
  );
}

const STOP_SECONDS = 9;

export function TourPanel({ onExit }: { onExit: () => void }) {
  const index = useApp((s) => s.tourIndex);
  const playing = useApp((s) => s.tourPlaying);
  const setTour = useApp((s) => s.setTour);
  const requestCamera = useApp((s) => s.requestCamera);
  const select = useApp((s) => s.select);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const stop = tourStops[index];
  const startTime = useRef(0);
  const elapsed = useRef(0);

  // move the camera to each stop and highlight its element
  useEffect(() => {
    if (!started) return;
    requestCamera({ position: stop.position, target: stop.target, fov: 40 });
    select(stop.elementId ?? null, false);
    elapsed.current = 0;
    setProgress(0);
  }, [index, started, stop, requestCamera, select]);

  // timed auto-advance with pause / resume
  useEffect(() => {
    if (!started || !playing) return;
    startTime.current = performance.now() - elapsed.current * 1000;
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - startTime.current) / 1000;
      elapsed.current = t;
      setProgress(Math.min(1, t / STOP_SECONDS));
      if (t >= STOP_SECONDS) {
        if (index < tourStops.length - 1) setTour(index + 1);
        else setTour(index, false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, playing, index, setTour]);

  useEffect(() => () => select(null, false), [select]);

  if (!started)
    return (
      <div className="panel pointer-events-auto fixed inset-x-3 bottom-4 z-20 mx-auto max-w-xl rounded-[3px] p-6 md:bottom-8">
        <p className="label">Guided architectural walkthrough</p>
        <h2 className="mt-2 font-serif text-3xl">Eight stops, about a minute and a half.</h2>
        <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
          The camera moves between predefined viewpoints with commentary. It advances on its own; you can pause, step back or forward, or
          leave at any time.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="btn-accent"
            onClick={() => {
              setTour(0, true);
              setStarted(true);
            }}
          >
            <Play size={16} /> Start walkthrough
          </button>
          <button className="btn-outline" onClick={onExit}>
            Not now
          </button>
        </div>
      </div>
    );

  const atEnd = index === tourStops.length - 1 && !playing && progress >= 1;

  return (
    <div className="panel pointer-events-auto fixed inset-x-3 bottom-4 z-20 mx-auto max-w-2xl rounded-[3px] md:bottom-8">
      <div className="h-[3px] w-full bg-stone">
        <div
          className="h-full bg-terracotta transition-[width] duration-100"
          style={{ width: `${((index + progress) / tourStops.length) * 100}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={tourStops.length}
          aria-valuenow={index + 1}
          aria-label="Walkthrough progress"
        />
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="label">
            Stop {index + 1} / {tourStops.length} {playing ? '' : atEnd ? '· end of walkthrough' : '· paused'}
          </p>
          <ol className="hidden gap-1 sm:flex" aria-label="Stops">
            {tourStops.map((s, i) => (
              <li key={s.id}>
                <button
                  className={`h-2 w-6 transition ${i === index ? 'bg-terracotta' : i < index ? 'bg-charcoal/50' : 'bg-charcoal/15 hover:bg-charcoal/40'}`}
                  onClick={() => setTour(i)}
                  aria-label={`Go to stop ${i + 1}: ${s.title}`}
                />
              </li>
            ))}
          </ol>
        </div>
        <h2 className="mt-2 font-serif text-[28px] leading-tight">{stop.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{stop.text}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="tool !h-10 !w-10" onClick={() => setTour(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous stop">
            <ChevronLeft size={18} />
          </button>
          {playing ? (
            <button className="btn-primary !py-2.5" onClick={() => setTour(index, false)}>
              <Pause size={15} /> Pause
            </button>
          ) : (
            <button
              className="btn-accent !py-2.5"
              onClick={() => {
                if (atEnd) {
                  elapsed.current = 0;
                  setTour(0, true);
                } else setTour(index, true);
              }}
            >
              <Play size={15} /> {atEnd ? 'Restart' : 'Resume'}
            </button>
          )}
          <button
            className="tool !h-10 !w-10"
            onClick={() => setTour(Math.min(tourStops.length - 1, index + 1))}
            disabled={index === tourStops.length - 1}
            aria-label="Next stop"
          >
            <ChevronRight size={18} />
          </button>
          <button className="btn ml-auto px-3 py-2.5 text-charcoal-soft hover:text-terracotta" onClick={onExit}>
            <LogOut size={15} /> Exit
          </button>
        </div>
      </div>
    </div>
  );
}

export function PanoPanel() {
  const index = useApp((s) => s.panoIndex);
  const setPano = useApp((s) => s.setPano);
  const p = panoPoints[index];
  return (
    <Dock kicker="360° viewpoints" title={p.name}>
      <p className="text-sm text-charcoal-soft">{p.note}</p>
      <p className="mt-3 rounded-sm bg-olive/10 p-3 text-xs leading-relaxed text-[#5d634b]">
        No panoramic photographs were supplied, so each 360° view is rendered live from the 3D reconstruction at eye level (1.65 m).
      </p>
      <p className="label mt-5 mb-2">Viewpoints</p>
      <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
        {panoPoints.map((pt, i) => (
          <li key={pt.id}>
            <button
              onClick={() => setPano(i)}
              aria-pressed={i === index}
              className={`flex w-full items-center justify-between py-2.5 text-left text-sm ${i === index ? 'text-terracotta' : 'hover:text-terracotta'}`}
            >
              <span>
                <span className="mr-2 font-mono text-[10px] text-charcoal-soft">{String(i + 1).padStart(2, '0')}</span>
                {pt.name}
              </span>
              <span className="font-mono text-[10px] uppercase text-charcoal-soft">{levels.find((l) => l.id === pt.level)!.short}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <button className="btn-outline flex-1 !py-2 text-xs" onClick={() => setPano((index - 1 + panoPoints.length) % panoPoints.length)}>
          <ChevronLeft size={14} /> Previous
        </button>
        <button className="btn-outline flex-1 !py-2 text-xs" onClick={() => setPano((index + 1) % panoPoints.length)}>
          Next <ChevronRight size={14} />
        </button>
      </div>
      <Hint>Drag to look around · scroll or pinch to zoom · click a round hotspot in the view to move there.</Hint>
    </Dock>
  );
}

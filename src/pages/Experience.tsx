import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Sun, Moon, Orbit, ScanEye, Layers, Map as MapIcon, Route, Compass, Glasses, LogOut } from 'lucide-react';
import { useApp, type Mode } from '../state/store';
import { href, replaceParams } from '../lib/router';
import { levels, type LevelId } from '../data/building';
import { elementById } from '../data/elements';
import { panoPoints, viewPresets, type ViewId } from '../data/views';
import { project } from '../data/project';
import { Loader } from '../ui/Loader';
import { CameraTools, SelectionCard } from '../ui/experience/common';
import { ExplorePanel, FloorsPanel, ModelPanel, PanoPanel, TourPanel } from '../ui/experience/panels';
import { SitePlan } from '../ui/experience/SitePlan';
import { AROverlay, XRPanel } from '../ui/experience/XRPanel';
import { xrBridge } from '../scene/xr/xrSupport';

const SceneRoot = lazy(() => import('../scene/SceneRoot'));

const tabs: { mode: Mode; label: string; icon: typeof Orbit }[] = [
  { mode: 'model', label: 'Model', icon: Orbit },
  { mode: 'explore', label: 'Explore', icon: ScanEye },
  { mode: 'floors', label: 'Floors', icon: Layers },
  { mode: 'plan', label: 'Site plan', icon: MapIcon },
  { mode: 'tour', label: 'Walkthrough', icon: Route },
  { mode: 'pano', label: '360°', icon: Compass },
  { mode: 'xr', label: 'VR / AR', icon: Glasses },
];
const MODES = tabs.map((t) => t.mode);

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Experience({ params }: { params: URLSearchParams }) {
  const mode = useApp((s) => s.mode);
  const setMode = useApp((s) => s.setMode);
  const env = useApp((s) => s.env);
  const setEnv = useApp((s) => s.setEnv);
  const ready = useApp((s) => s.sceneReady);
  const xr = useApp((s) => s.xrActive);
  const selected = useApp((s) => s.selected);
  const iso = useApp((s) => s.isolatedLevel);
  const view = useApp((s) => s.view);
  const panoIndex = useApp((s) => s.panoIndex);
  const overlay = useRef<HTMLDivElement>(null);
  const hasGL = useMemo(webglAvailable, []);

  // Deep links: #/experience?mode=explore&el=canopy, ?mode=floors&level=L1, ?view=section, ?point=deck
  // Re-applied whenever the hash changes from outside (our own URL updates use
  // replaceState, which does not fire hashchange, so they don't loop back here).
  useEffect(() => {
    const s = useApp.getState();
    const m = params.get('mode') as Mode | null;
    const nextMode: Mode = m && MODES.includes(m) ? m : 'model';
    s.setMode(nextMode);
    const v = params.get('view') as ViewId | null;
    if (v && viewPresets.some((p) => p.id === v)) s.setView(v);
    const el = params.get('el');
    if (el && elementById(el)) setTimeout(() => useApp.getState().select(el), 300);
    else s.select(null, false);
    const lv = params.get('level') as LevelId | null;
    if (lv && levels.some((l) => l.id === lv)) s.setIsolatedLevel(lv);
    else if (s.isolatedLevel || s.exploded) s.setIsolatedLevel(null);
    const pt = params.get('point');
    const pi = panoPoints.findIndex((p) => p.id === pt);
    if (pi >= 0) s.setPano(pi);
    if (params.get('env') === 'evening') s.setEnv('evening');
  }, [params]);

  // keep the URL shareable
  useEffect(() => {
    replaceParams('/experience', {
      mode,
      el: selected ?? undefined,
      level: mode === 'floors' ? iso ?? undefined : undefined,
      view: mode === 'model' && view !== 'perspective' ? view : undefined,
      point: mode === 'pano' ? panoPoints[panoIndex].id : undefined,
      env: env === 'evening' ? 'evening' : undefined,
    });
  }, [mode, selected, iso, view, panoIndex, env]);

  // reset per-mode state when switching
  const switchMode = (m: Mode) => {
    const s = useApp.getState();
    if (m !== 'floors') {
      if (s.isolatedLevel) s.setIsolatedLevel(null);
      if (s.exploded) s.setExploded(false);
    }
    if (m === 'tour') s.setTour(0, false);
    if (m !== 'explore') s.setGhostOthers(false);
    if (s.mode === 'tour' || s.mode === 'pano') s.resetCamera();
    if (m === 'model' && s.view !== 'perspective') s.setView(s.view);
    setMode(m);
  };

  useEffect(() => {
    document.title = `${project.title} — 3D experience`;
    return () => {
      document.title = `${project.title} — Architectural Exhibition`;
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#E9E5DA]">
      {hasGL ? (
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <SceneRoot overlay={overlay} />
          </Suspense>
        </div>
      ) : (
        <NoWebGL onPlan={() => switchMode('plan')} />
      )}

      {/* Top bar */}
      <header className="pointer-events-auto fixed inset-x-0 top-0 z-30 flex h-[60px] items-center gap-2 border-b border-charcoal/10 bg-ivory/90 px-2 backdrop-blur-md sm:gap-4 sm:px-4">
        <a href={href('/')} className="tool shrink-0" aria-label="Back to the exhibition" title="Back to the exhibition">
          <ArrowLeft size={16} />
        </a>
        <div className="hidden shrink-0 lg:block">
          <p className="font-serif text-xl leading-none">{project.title}</p>
          <p className="label mt-0.5 !text-[9px]">Conceptual 3D reconstruction</p>
        </div>
        <nav className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:justify-center" aria-label="Experience modes">
          {tabs.map((t) => (
            <button
              key={t.mode}
              onClick={() => switchMode(t.mode)}
              aria-pressed={mode === t.mode}
              className={`flex shrink-0 items-center gap-1.5 rounded-[2px] px-3 py-2 text-[12.5px] transition ${
                mode === t.mode ? 'bg-charcoal text-ivory' : 'text-charcoal-soft hover:bg-charcoal/5 hover:text-charcoal'
              }`}
            >
              <t.icon size={14} strokeWidth={1.75} />
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setEnv(env === 'day' ? 'evening' : 'day')}
          className="flex shrink-0 items-center gap-2 rounded-full border border-charcoal/15 bg-ivory py-1 pl-1 pr-3 text-[12px]"
          aria-label={`Switch to ${env === 'day' ? 'evening' : 'day'} lighting`}
          disabled={mode === 'plan'}
        >
          <span className={`grid h-7 w-7 place-items-center rounded-full transition ${env === 'day' ? 'bg-[#E9C46A] text-charcoal' : 'bg-charcoal text-[#F3C98B]'}`}>
            {env === 'day' ? <Sun size={14} /> : <Moon size={14} />}
          </span>
          <span className="hidden sm:inline">{env === 'day' ? 'Day' : 'Evening'}</span>
        </button>
      </header>

      {hasGL && !ready && <Loader label="Building the reconstruction" />}

      {/* Mode UI */}
      {xr === 'none' && (
        <>
          {mode === 'model' && <ModelPanel />}
          {mode === 'explore' && <ExplorePanel />}
          {mode === 'floors' && <FloorsPanel />}
          {mode === 'tour' && <TourPanel onExit={() => switchMode('model')} />}
          {mode === 'pano' && <PanoPanel />}
          {mode === 'xr' && <XRPanel onFallbackPano={() => switchMode('pano')} onFallbackModel={() => switchMode('model')} />}
          {mode === 'plan' && <SitePlan onOpen3D={() => switchMode('explore')} />}
          {(mode === 'model' || mode === 'explore' || mode === 'floors') && <CameraTools />}
          <SelectionCard />
          {mode !== 'plan' && <Badge />}
        </>
      )}

      {xr === 'vr' && (
        <div className="panel fixed inset-x-4 bottom-6 z-40 mx-auto flex max-w-md items-center justify-between gap-4 rounded-[3px] p-4">
          <p className="text-sm">VR session running in the headset.</p>
          <button className="btn-primary !py-2" onClick={() => xrBridge.exit?.()}>
            <LogOut size={15} /> Exit VR
          </button>
        </div>
      )}
      <AROverlay ref={overlay} />
    </div>
  );
}

function Badge() {
  const env = useApp((s) => s.env);
  return (
    <p className="pointer-events-none fixed bottom-4 right-16 z-10 hidden max-w-xs text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/60 md:block">
      Conceptual reconstruction from one render · not to scale · {env === 'day' ? 'daylight' : 'evening light'}
    </p>
  );
}

function NoWebGL({ onPlan }: { onPlan: () => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-ivory p-6 pt-24">
      <div className="max-w-xl text-center">
        <p className="label">3D unavailable</p>
        <h1 className="mt-3 font-serif text-4xl">This browser can’t display WebGL.</h1>
        <p className="mt-4 text-charcoal-soft">
          The interactive model needs WebGL. The site plan still works here, and the reference render and architectural analysis are
          available on the exhibition pages.
        </p>
        <img src={project.referenceImage} alt="Reference render" className="mt-6 w-full border border-charcoal/15" />
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button className="btn-primary" onClick={onPlan}>
            Open the site plan
          </button>
          <a className="btn-outline" href={href('/architecture')}>
            Architectural analysis
          </a>
        </div>
      </div>
    </div>
  );
}

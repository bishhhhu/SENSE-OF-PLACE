import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Gamepad2, RotateCcw, RotateCw, Sun, Moon, Orbit, ScanEye, Layers, Map as MapIcon, Route, Compass, Glasses, LogOut } from 'lucide-react';
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
import { vrInput, xrBridge } from '../scene/xr/xrSupport';

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
      {xr !== 'phonevr' && (
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
      )}

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
      {xr === 'phonevr' && <PhoneVROverlay />}
      <AROverlay ref={overlay} />
    </div>
  );
}

function PhoneVROverlay() {
  const [hint, setHint] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const denied = useApp((s) => s.phoneSensorDenied);
  const panoIndex = useApp((s) => s.panoIndex);
  const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth);
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 7000);
    const onResize = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  const pill = 'pointer-events-auto flex items-center gap-1.5 rounded-full bg-charcoal/75 px-3 py-2 text-xs text-ivory backdrop-blur-sm';
  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/60" />

      {/* top bar: viewpoints, controls toggle, exit */}
      <div className="absolute inset-x-0 top-2 flex items-center justify-center gap-2 px-2">
        <button className={pill} onClick={() => xrBridge.phoneVRGoTo?.(panoIndex - 1)} aria-label="Previous viewpoint">
          <ChevronLeft size={14} />
        </button>
        <span className="rounded-full bg-charcoal/75 px-3 py-2 text-xs text-ivory">{panoPoints[panoIndex]?.name}</span>
        <button className={pill} onClick={() => xrBridge.phoneVRGoTo?.(panoIndex + 1)} aria-label="Next viewpoint">
          <ChevronRight size={14} />
        </button>
        <button className={pill} onClick={() => setShowControls((v) => !v)} aria-pressed={showControls}>
          <Gamepad2 size={13} /> {showControls ? 'Hide controls' : 'Controls'}
        </button>
        <button className={pill} onClick={() => xrBridge.exitPhoneVR?.()}>
          <LogOut size={13} /> Exit
        </button>
      </div>

      {showControls && (
        <>
          {/* move pad (bottom left) */}
          <div className="pointer-events-auto absolute bottom-4 left-4 grid grid-cols-3 grid-rows-3 gap-1.5" role="group" aria-label="Move">
            <span />
            <HoldButton label="Walk forward" axis="forward" value={1}>
              <ArrowUp size={20} />
            </HoldButton>
            <span />
            <HoldButton label="Step left" axis="strafe" value={-1}>
              <ArrowLeft size={20} />
            </HoldButton>
            <span className="grid place-items-center text-[9px] uppercase tracking-wider text-ivory/80 [text-shadow:0_1px_2px_#000]">Move</span>
            <HoldButton label="Step right" axis="strafe" value={1}>
              <ArrowRight size={20} />
            </HoldButton>
            <span />
            <HoldButton label="Walk back" axis="forward" value={-1}>
              <ArrowDown size={20} />
            </HoldButton>
            <span />
          </div>
          {/* turn (bottom right) */}
          <div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col items-center gap-1.5" role="group" aria-label="Turn">
            <span className="text-[9px] uppercase tracking-wider text-ivory/80 [text-shadow:0_1px_2px_#000]">Turn</span>
            <div className="flex gap-1.5">
              <HoldButton label="Turn left" axis="turn" value={-1}>
                <RotateCcw size={20} />
              </HoldButton>
              <HoldButton label="Turn right" axis="turn" value={1}>
                <RotateCw size={20} />
              </HoldButton>
            </div>
          </div>
        </>
      )}

      {(hint || portrait) && (
        <p className="absolute bottom-24 left-1/2 w-[min(80vw,420px)] -translate-x-1/2 rounded-sm bg-charcoal/75 px-4 py-2 text-center text-xs leading-relaxed text-ivory">
          {portrait ? 'Turn your phone sideways (landscape) for VR. ' : ''}
          {denied ? 'Drag to look around. ' : 'Turn your head to look around. '}
          Hold the arrows to walk and turn, or tap the view to step forward. Keyboard: WASD / arrows, Q E to turn.
        </p>
      )}
    </div>
  );
}

/** Press-and-hold control that writes to the shared VR movement input. */
function HoldButton({ axis, value, label, children }: { axis: 'forward' | 'strafe' | 'turn'; value: number; label: string; children: React.ReactNode }) {
  const [held, setHeld] = useState(false);
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    vrInput[axis] = value;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is only a convenience; movement works without it */
    }
    setHeld(true);
  };
  const stop = () => {
    if (vrInput[axis] === value) vrInput[axis] = 0;
    setHeld(false);
  };
  useEffect(() => () => {
    if (vrInput[axis] === value) vrInput[axis] = 0;
  }, [axis, value]);
  return (
    <button
      aria-label={label}
      title={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={`grid h-12 w-12 touch-none place-items-center rounded-full border border-ivory/40 text-ivory backdrop-blur-sm transition ${
        held ? 'bg-terracotta/90' : 'bg-charcoal/60'
      }`}
    >
      {children}
    </button>
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

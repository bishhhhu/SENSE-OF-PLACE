import { forwardRef, useEffect, useRef, useState } from 'react';
import { Glasses, Smartphone, RotateCcw, RotateCw, Minus, Plus, Crosshair, LogOut, Compass, AlertTriangle, Check } from 'lucide-react';
import { useApp } from '../../state/store';
import { detectXR, xrBridge, type XRSupport } from '../../scene/xr/xrSupport';
import { panoPoints } from '../../data/views';
import { Dock } from './common';

export function XRPanel({ onFallbackPano, onFallbackModel }: { onFallbackPano: () => void; onFallbackModel: () => void }) {
  const [sup, setSup] = useState<XRSupport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'vr' | 'ar' | 'ql' | 'phone' | null>(null);
  const panoIndex = useApp((s) => s.panoIndex);
  const setPano = useApp((s) => s.setPano);

  useEffect(() => {
    detectXR().then(setSup);
  }, []);

  const run = async (kind: 'vr' | 'ar' | 'phone') => {
    setError(null);
    setBusy(kind);
    try {
      const fn = kind === 'vr' ? xrBridge.enterVR : kind === 'phone' ? xrBridge.enterPhoneVR : xrBridge.enterAR;
      if (!fn) throw new Error('The 3D scene is still loading.');
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const quickLook = async () => {
    setError(null);
    setBusy('ql');
    try {
      if (!xrBridge.exportUSDZ) throw new Error('The 3D scene is still loading.');
      const blob = await xrBridge.exportUSDZ();
      const a = document.createElement('a');
      a.rel = 'ar';
      a.href = URL.createObjectURL(blob);
      a.download = 'jaali-pavilion.usdz';
      a.appendChild(document.createElement('img'));
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dock kicker="Immersive" title="VR & AR" wide>
      {!sup ? (
        <p className="text-sm text-charcoal-soft">Checking what this device supports…</p>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-charcoal-soft">
            Uses the WebXR standard. Options are enabled only when this browser reports real support.
          </p>
          {!sup.secure && (
            <p className="mt-3 flex gap-2 rounded-sm bg-terracotta/10 p-3 text-xs text-terracotta-dark">
              <AlertTriangle size={14} className="shrink-0" /> WebXR needs a secure (HTTPS) connection. Open the published site to use VR or AR.
            </p>
          )}

          {/* VR */}
          <section className="mt-5 border border-charcoal/15 p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-2xl">
                <Glasses size={18} strokeWidth={1.5} /> Virtual reality
              </h3>
              <Status ok={sup.vr || sup.phoneVR} />
            </div>
            {sup.vr ? (
              <>
                <p className="mt-2 text-sm text-charcoal-soft">
                  Stand in the building at full scale. Left thumbstick moves, right thumbstick turns in 30° steps.
                </p>
                <label className="label mt-4 block" htmlFor="vr-start">
                  Start at
                </label>
                <select
                  id="vr-start"
                  className="mt-1 w-full border border-charcoal/20 bg-ivory px-3 py-2 text-sm"
                  value={panoIndex}
                  onChange={(e) => setPano(Number(e.target.value))}
                >
                  {panoPoints.map((p, i) => (
                    <option key={p.id} value={i}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button className="btn-accent mt-3 w-full" disabled={busy !== null} onClick={() => run('vr')}>
                  {busy === 'vr' ? 'Starting…' : 'Enter VR'}
                </button>
              </>
            ) : null}
            {sup.phoneVR && (
              <div className={sup.vr ? 'mt-4 border-t border-charcoal/10 pt-4' : ''}>
                <p className="label">Phone VR</p>
                <p className="mt-1 text-sm text-charcoal-soft">
                  Split-screen stereo for a Cardboard-style viewer (or just hold the phone up). Turn your head to look around; tap the
                  screen or the viewer's button to walk forward. Best in landscape.
                </p>
                {!sup.vr && (
                  <>
                    <label className="label mt-4 block" htmlFor="phone-vr-start">
                      Start at
                    </label>
                    <select
                      id="phone-vr-start"
                      className="mt-1 w-full border border-charcoal/20 bg-ivory px-3 py-2 text-sm"
                      value={panoIndex}
                      onChange={(e) => setPano(Number(e.target.value))}
                    >
                      {panoPoints.map((p, i) => (
                        <option key={p.id} value={i}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <button className={`${sup.vr ? 'btn-outline' : 'btn-accent'} mt-3 w-full`} disabled={busy !== null} onClick={() => run('phone')}>
                  {busy === 'phone' ? 'Starting…' : 'Enter phone VR'}
                </button>
              </div>
            )}
            {!sup.vr && !sup.phoneVR && (
              <>
                <p className="mt-2 text-sm text-charcoal-soft">
                  This computer has no VR headset connected to the browser, so VR can't start here. Open this page on a VR headset's
                  browser (e.g. Meta Quest), or on a phone to use phone VR with a Cardboard-style viewer.
                </p>
                <button className="btn-outline mt-3 w-full !py-2.5 text-xs" onClick={onFallbackPano}>
                  <Compass size={14} /> Use eye-level 360° views instead
                </button>
              </>
            )}
          </section>

          {/* AR */}
          <section className="mt-3 border border-charcoal/15 p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-2xl">
                <Smartphone size={18} strokeWidth={1.5} /> Augmented reality
              </h3>
              <Status ok={sup.ar || sup.quickLook} />
            </div>
            {sup.ar ? (
              <>
                <p className="mt-2 text-sm text-charcoal-soft">
                  Point the camera at a floor or table until the ring appears, then tap to place a scale model. Rotate, resize or place it
                  again from the on-screen controls.
                </p>
                <button className="btn-accent mt-3 w-full" disabled={busy !== null} onClick={() => run('ar')}>
                  {busy === 'ar' ? 'Starting…' : 'Start AR placement'}
                </button>
              </>
            ) : sup.quickLook ? (
              <>
                <p className="mt-2 text-sm text-charcoal-soft">
                  This device uses Apple AR Quick Look. The model is exported on the spot (1:100) and opened in Quick Look, where you can
                  place, rotate and scale it.
                </p>
                <button className="btn-accent mt-3 w-full" disabled={busy !== null} onClick={quickLook}>
                  {busy === 'ql' ? 'Preparing model…' : 'Open in AR Quick Look'}
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-charcoal-soft">
                  AR placement needs a phone or tablet with WebXR AR (Chrome on ARCore Android) or AR Quick Look (iPhone/iPad Safari).
                  On this device, use the interactive 3D model instead — orbit, zoom and isolate floors work the same way.
                </p>
                <button className="btn-outline mt-3 w-full !py-2.5 text-xs" onClick={onFallbackModel}>
                  Open the interactive 3D model
                </button>
              </>
            )}
          </section>
          {error && (
            <p className="mt-3 flex gap-2 rounded-sm bg-terracotta/10 p-3 text-xs text-terracotta-dark" role="alert">
              <AlertTriangle size={14} className="shrink-0" /> Could not start: {error}
            </p>
          )}
        </>
      )}
    </Dock>
  );
}

function Status({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="chip border-olive/40 bg-olive/15 text-[#5d634b]">
      <Check size={11} /> Supported
    </span>
  ) : (
    <span className="chip border-stone-dark bg-stone/50 text-charcoal-soft">Not available</span>
  );
}

/**
 * DOM overlay shown on top of the camera feed during an AR session. Taps on the
 * toolbar are excluded from XR "select" so they don't re-place the model.
 */
export const AROverlay = forwardRef<HTMLDivElement>(function AROverlay(_, ref) {
  const xr = useApp((s) => s.xrActive);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener('beforexrselect', stop);
    return () => el.removeEventListener('beforexrselect', stop);
  }, []);
  return (
    <div ref={ref} className={xr === 'ar' ? 'fixed inset-0 z-50 flex flex-col justify-between p-4' : 'hidden'}>
      <p className="mx-auto max-w-xs rounded-sm bg-charcoal/75 px-3 py-2 text-center text-xs text-ivory">
        Move the phone slowly to find a surface. Tap to place the model.
      </p>
      <div ref={bar} className="mx-auto flex flex-wrap justify-center gap-2 rounded-sm bg-ivory/90 p-2">
        <button className="tool !h-11 !w-11" onClick={() => xrBridge.arRotate(-20)} aria-label="Rotate left">
          <RotateCcw size={18} />
        </button>
        <button className="tool !h-11 !w-11" onClick={() => xrBridge.arRotate(20)} aria-label="Rotate right">
          <RotateCw size={18} />
        </button>
        <button className="tool !h-11 !w-11" onClick={() => xrBridge.arScale(1 / 1.25)} aria-label="Smaller">
          <Minus size={18} />
        </button>
        <button className="tool !h-11 !w-11" onClick={() => xrBridge.arScale(1.25)} aria-label="Larger">
          <Plus size={18} />
        </button>
        <button className="tool !h-11 !w-11" onClick={() => xrBridge.arReplace()} aria-label="Place again">
          <Crosshair size={18} />
        </button>
        <button className="tool !h-11 !w-11" onClick={() => xrBridge.exit?.()} aria-label="Exit AR">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
});

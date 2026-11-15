import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '../state/store';
import { Building } from './building/Building';
import { Site } from './site/Site';
import { Environment } from './env/Environment';
import { CameraRig } from './camera/CameraRig';
import { XRController } from './xr/XRController';
import { PhoneVR } from './xr/PhoneVR';
import { panoPoints, SECTION_Z } from '../data/views';

export default function SceneRoot({ overlay }: { overlay: RefObject<HTMLElement> }) {
  const mode = useApp((s) => s.mode);
  const setReady = useApp((s) => s.setSceneReady);
  const select = useApp((s) => s.select);
  const arRoot = useRef<THREE.Group>(null);
  const xr = useApp((s) => s.xrActive);
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  return (
    <Canvas
      shadows
      frameloop={mode === 'plan' && xr === 'none' ? 'never' : 'always'}
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ fov: 32, near: 0.05, far: 2400, position: [-74, 62, 92] }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.localClippingEnabled = true;
        setReady(true);
      }}
      onPointerMissed={(e) => {
        if (e.type === 'click' && (mode === 'model' || mode === 'explore' || mode === 'floors')) select(null);
      }}
    >
      <Suspense fallback={null}>
        <Environment />
        <group ref={arRoot}>
          <Building showPeople />
        </group>
        {xr !== 'ar' && <Site />}
        <SectionPlane />
        <PanelOffset />
        <PanoHotspots />
        <CameraRig />
        <XRController arRoot={arRoot} overlay={overlay} />
        <PhoneVR />
        <AdaptiveDpr pixelated={false} />
      </Suspense>
    </Canvas>
  );
}

/**
 * On wide screens the side panel covers the left of the canvas, so the
 * projection centre is shifted right to keep the building in the open area.
 */
function PanelOffset() {
  const mode = useApp((s) => s.mode);
  const xr = useApp((s) => s.xrActive);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const current = useRef({ x: 0, y: 0 });
  const withPanel = xr === 'none' && ['model', 'explore', 'floors', 'pano', 'xr'].includes(mode);
  const wide = size.width >= 768;
  // side panel on wide screens; bottom sheet (about half the height) on phones
  const tx = withPanel && wide ? Math.min(200, size.width * 0.14) : 0;
  const ty = withPanel && !wide ? size.height * 0.2 : !wide && mode === 'tour' ? size.height * 0.14 : 0;
  useFrame((_, dt) => {
    const c = current.current;
    const nx = THREE.MathUtils.damp(c.x, tx, 5, dt);
    const ny = THREE.MathUtils.damp(c.y, ty, 5, dt);
    const settled = Math.abs(nx - c.x) < 0.05 && Math.abs(ny - c.y) < 0.05;
    if (settled && camera.view?.enabled && camera.view.fullWidth === size.width && camera.view.fullHeight === size.height) return;
    c.x = nx;
    c.y = ny;
    camera.setViewOffset(size.width, size.height, -nx, ny, size.width, size.height);
  });
  useEffect(() => () => camera.clearViewOffset(), [camera]);
  return null;
}

/** Section view: a global clipping plane keeps everything north of the cut. */
function SectionPlane() {
  const view = useApp((s) => s.view);
  const mode = useApp((s) => s.mode);
  const gl = useThree((s) => s.gl);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), SECTION_Z), []);
  const xr = useApp((s) => s.xrActive);
  const on = view === 'section' && mode !== 'pano' && mode !== 'tour' && xr === 'none';
  useEffect(() => {
    gl.clippingPlanes = on ? [plane] : [];
    return () => {
      gl.clippingPlanes = [];
    };
  }, [on, gl, plane]);
  return null;
}

/** Round hotspots at the other viewpoints while looking around in 360° mode. */
function PanoHotspots() {
  const mode = useApp((s) => s.mode);
  const panoIndex = useApp((s) => s.panoIndex);
  const setPano = useApp((s) => s.setPano);
  if (mode !== 'pano') return null;
  const here = new THREE.Vector3(...panoPoints[panoIndex].position);
  return (
    <>
      {panoPoints.map((p, i) => {
        if (i === panoIndex) return null;
        const d = here.distanceTo(new THREE.Vector3(...p.position));
        if (d > 75) return null;
        return (
          <Html key={p.id} position={[p.position[0], p.position[1] - 0.6, p.position[2]]} center zIndexRange={[30, 0]}>
            <button
              onClick={() => setPano(i)}
              className="group flex -translate-y-1/2 flex-col items-center gap-1"
              aria-label={`Go to viewpoint: ${p.name}`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-ivory bg-terracotta/85 shadow-lg ring-4 ring-terracotta/25 transition group-hover:scale-110">
                <span className="h-2 w-2 rounded-full bg-ivory" />
              </span>
              <span className="whitespace-nowrap rounded-sm bg-charcoal/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ivory">
                {p.name} · {Math.round(d)} m
              </span>
            </button>
          </Html>
        );
      })}
    </>
  );
}

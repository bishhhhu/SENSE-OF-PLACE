import { create } from 'zustand';
import type { LevelId } from '../data/building';
import { viewPresets, type ViewId } from '../data/views';
import { elementById } from '../data/elements';

export type Mode = 'model' | 'explore' | 'floors' | 'plan' | 'tour' | 'pano' | 'xr';
export type EnvMode = 'day' | 'evening';
export type XRActive = 'none' | 'vr' | 'ar';

interface CameraRequest {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  // Increments on each request so repeated requests to the same view still fire.
  nonce: number;
  instant?: boolean;
}

interface AppState {
  mode: Mode;
  setMode: (m: Mode) => void;

  view: ViewId;
  setView: (v: ViewId) => void;
  cameraRequest: CameraRequest | null;
  requestCamera: (r: Omit<CameraRequest, 'nonce'>) => void;
  resetCamera: () => void;

  selected: string | null;
  hovered: string | null;
  select: (id: string | null, focus?: boolean) => void;
  hover: (id: string | null) => void;
  ghostOthers: boolean;
  setGhostOthers: (v: boolean) => void;

  isolatedLevel: LevelId | null;
  setIsolatedLevel: (l: LevelId | null) => void;
  exploded: boolean;
  setExploded: (v: boolean) => void;

  env: EnvMode;
  setEnv: (e: EnvMode) => void;

  tourIndex: number;
  tourPlaying: boolean;
  setTour: (i: number, playing?: boolean) => void;

  panoIndex: number;
  setPano: (i: number) => void;

  xrActive: XRActive;
  setXRActive: (x: XRActive) => void;

  sceneReady: boolean;
  setSceneReady: (v: boolean) => void;
}

let nonce = 0;

export const useApp = create<AppState>((set, get) => ({
  mode: 'model',
  setMode: (mode) => set({ mode }),

  view: 'perspective',
  setView: (view) => set({ view, cameraRequest: { ...presetRequest(view), nonce: ++nonce } }),
  cameraRequest: null,
  requestCamera: (r) => set({ cameraRequest: { ...r, nonce: ++nonce } }),
  resetCamera: () => set({ view: 'perspective', cameraRequest: { ...presetRequest('perspective'), nonce: ++nonce } }),

  selected: null,
  hovered: null,
  select: (id, focus = true) => {
    set({ selected: id });
    if (id && focus) {
      const el = elementById(id);
      if (el) {
        // pull back a little so the element sits comfortably beside the panels
        const [px, py, pz] = el.focus.position;
        const [tx, ty, tz] = el.focus.target;
        const k = 1.2;
        get().requestCamera({ position: [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k], target: el.focus.target });
      }
    }
  },
  hover: (hovered) => set({ hovered }),
  ghostOthers: false,
  setGhostOthers: (ghostOthers) => set({ ghostOthers }),

  isolatedLevel: null,
  setIsolatedLevel: (isolatedLevel) => set({ isolatedLevel, exploded: false }),
  exploded: false,
  setExploded: (exploded) => set({ exploded, isolatedLevel: null }),

  env: 'day',
  setEnv: (env) => set({ env }),

  tourIndex: 0,
  tourPlaying: false,
  setTour: (tourIndex, playing) => set((s) => ({ tourIndex, tourPlaying: playing ?? s.tourPlaying })),

  panoIndex: 0,
  setPano: (panoIndex) => set({ panoIndex }),

  xrActive: 'none',
  setXRActive: (xrActive) => set({ xrActive }),

  sceneReady: false,
  setSceneReady: (sceneReady) => set({ sceneReady }),
}));

function presetRequest(id: ViewId) {
  const p = viewPresets.find((v) => v.id === id)!;
  return { position: p.position, target: p.target, fov: p.fov };
}

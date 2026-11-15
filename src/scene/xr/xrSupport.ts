// Capability detection. Buttons for VR and AR only appear as active when the
// browser actually reports support; nothing is simulated.

export interface XRSupport {
  checked: boolean;
  secure: boolean;
  api: boolean;
  vr: boolean;
  ar: boolean;
  quickLook: boolean;
  /** Phone with a motion sensor: can run the Cardboard-style stereo VR mode. */
  phoneVR: boolean;
}

export async function detectXR(): Promise<XRSupport> {
  const secure = window.isSecureContext;
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  let vr = false;
  let ar = false;
  if (xr) {
    try {
      vr = await xr.isSessionSupported('immersive-vr');
    } catch {
      vr = false;
    }
    try {
      ar = await xr.isSessionSupported('immersive-ar');
    } catch {
      ar = false;
    }
  }
  const a = document.createElement('a');
  const quickLook = !!a.relList?.supports?.('ar');
  const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const phoneVR = touch && typeof window.DeviceOrientationEvent !== 'undefined';
  return { checked: true, secure, api: !!xr, vr, ar, quickLook, phoneVR };
}

/**
 * Movement input for phone VR, written by the on-screen controls while a
 * button is held: forward/strafe in -1..1, turn in -1..1 (left negative).
 */
export const vrInput = { forward: 0, strafe: 0, turn: 0 };

/** Commands the UI can send to the XR controller living inside the canvas. */
export const xrBridge: {
  enterVR: (() => Promise<void>) | null;
  enterPhoneVR: (() => Promise<void>) | null;
  exitPhoneVR: (() => void) | null;
  phoneVRGoTo: ((index: number) => void) | null;
  enterAR: (() => Promise<void>) | null;
  exit: (() => void) | null;
  arRotate: (deg: number) => void;
  arScale: (factor: number) => void;
  arReplace: () => void;
  exportUSDZ: (() => Promise<Blob>) | null;
} = {
  enterVR: null,
  enterPhoneVR: null,
  exitPhoneVR: null,
  phoneVRGoTo: null,
  enterAR: null,
  exit: null,
  arRotate: () => {},
  arScale: () => {},
  arReplace: () => {},
  exportUSDZ: null,
};

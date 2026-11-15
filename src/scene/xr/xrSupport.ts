// Capability detection. Buttons for VR and AR only appear as active when the
// browser actually reports support; nothing is simulated.

export interface XRSupport {
  checked: boolean;
  secure: boolean;
  api: boolean;
  vr: boolean;
  ar: boolean;
  quickLook: boolean;
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
  return { checked: true, secure, api: !!xr, vr, ar, quickLook };
}

/** Commands the UI can send to the XR controller living inside the canvas. */
export const xrBridge: {
  enterVR: (() => Promise<void>) | null;
  enterAR: (() => Promise<void>) | null;
  exit: (() => void) | null;
  arRotate: (deg: number) => void;
  arScale: (factor: number) => void;
  arReplace: () => void;
  exportUSDZ: (() => Promise<Blob>) | null;
} = {
  enterVR: null,
  enterAR: null,
  exit: null,
  arRotate: () => {},
  arScale: () => {},
  arReplace: () => {},
  exportUSDZ: null,
};

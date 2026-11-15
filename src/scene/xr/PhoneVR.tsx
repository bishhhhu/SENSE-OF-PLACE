import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect.js';
import { useApp } from '../../state/store';
import { panoPoints } from '../../data/views';
import { vrInput, xrBridge } from './xrSupport';

/**
 * Phone VR for Cardboard-style viewers on phones whose browser has no WebXR VR
 * (e.g. iPhone Safari, many Android browsers): side-by-side stereo rendering,
 * head tracking from the phone's motion sensor, tap (or the viewer's button)
 * to walk forward. Drag-to-look is used if the sensor is unavailable.
 */
export function PhoneVR() {
  const active = useApp((s) => s.xrActive === 'phonevr');
  const setXRActive = useApp((s) => s.setXRActive);

  useEffect(() => {
    xrBridge.enterPhoneVR = async () => {
      // Fullscreen and the motion-sensor prompt both need the user's tap, so
      // they start immediately. Neither is required: without the sensor the
      // view is steered by dragging.
      const fs = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
      const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      let sensorAllowed = true;
      if (typeof DOE?.requestPermission === 'function') {
        try {
          // iOS shows a prompt; give the user time to answer, but never hang forever
          sensorAllowed = (await withTimeout(DOE.requestPermission(), 20000)) === 'granted';
        } catch {
          sensorAllowed = false;
        }
      }
      await withTimeout(fs, 1500);
      try {
        await withTimeout((screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'), 1000);
      } catch {
        /* orientation lock is optional (not supported on iOS) */
      }
      useApp.setState({ phoneSensorDenied: !sensorAllowed });
      setXRActive('phonevr');
    };
    xrBridge.exitPhoneVR = () => {
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* ignore */
      }
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setXRActive('none');
      useApp.getState().resetCamera();
    };
    const onFs = () => {
      if (!document.fullscreenElement && useApp.getState().xrActive === 'phonevr') xrBridge.exitPhoneVR?.();
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      xrBridge.enterPhoneVR = null;
      xrBridge.exitPhoneVR = null;
    };
  }, [setXRActive]);

  return active ? <PhoneVRSession /> : null;
}

/** Resolves with the promise's value, or undefined after `ms` if it never settles. */
function withTimeout<T>(p: Promise<T> | undefined, ms: number): Promise<T | undefined> {
  if (!p) return Promise.resolve(undefined);
  return Promise.race([p.catch(() => undefined), new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))]);
}

const zee = new THREE.Vector3(0, 0, 1);
const backToFront = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // camera looks out of the back of the phone
const EYE_STEP = 2.5;
const WALK_SPEED = 3.2; // m/s
const TURN_SPEED = 1.6; // rad/s

function PhoneVRSession() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const effect = useMemo(() => new StereoEffect(gl), [gl]);
  const st = useRef({
    device: new THREE.Quaternion(),
    sensor: false,
    aligned: false,
    yawOffset: 0,
    dragYaw: 0,
    dragPitch: 0,
    targetYaw: 0,
    pos: new THREE.Vector3(),
  });
  const tmp = useMemo(() => ({ e: new THREE.Euler(), q: new THREE.Quaternion(), yq: new THREE.Quaternion(), v: new THREE.Vector3() }), []);

  // start at the selected viewpoint
  useEffect(() => {
    const p = panoPoints[useApp.getState().panoIndex] ?? panoPoints[0];
    const s = st.current;
    s.pos.set(...p.position);
    s.targetYaw = Math.atan2(-(p.lookAt[0] - p.position[0]), -(p.lookAt[2] - p.position[2]));
    s.aligned = false;
    s.sensor = false;
    s.dragYaw = 0;
    s.dragPitch = 0;
    const prevFov = camera.fov;
    camera.fov = 80;
    camera.updateProjectionMatrix();
    return () => {
      camera.fov = prevFov;
      camera.updateProjectionMatrix();
      // StereoEffect leaves the viewport on the right eye; restore the full
      // canvas using its current size (the phone may have rotated meanwhile).
      const full = gl.getSize(new THREE.Vector2());
      gl.setScissorTest(false);
      gl.setScissor(0, 0, full.x, full.y);
      gl.setViewport(0, 0, full.x, full.y);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl]);

  // motion sensor → head orientation
  useEffect(() => {
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null || e.gamma === null) return;
      const s = st.current;
      const orient = THREE.MathUtils.degToRad((screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation) || 0);
      tmp.e.set(THREE.MathUtils.degToRad(e.beta), THREE.MathUtils.degToRad(e.alpha), -THREE.MathUtils.degToRad(e.gamma), 'YXZ');
      s.device.setFromEuler(tmp.e).multiply(backToFront).multiply(tmp.q.setFromAxisAngle(zee, -orient));
      s.sensor = true;
      if (!s.aligned) {
        // turn the world so the phone's current heading faces the viewpoint's target
        tmp.e.setFromQuaternion(s.device, 'YXZ');
        s.yawOffset = s.targetYaw - tmp.e.y;
        s.aligned = true;
      }
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [tmp]);

  // tap = walk forward; drag = turn (and look up/down when there is no sensor)
  useEffect(() => {
    const el = gl.domElement;
    let down: { x: number; y: number; t: number; lx: number; ly: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, ly: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const s = st.current;
      s.dragYaw += (e.clientX - down.lx) * 0.006;
      if (!s.sensor) s.dragPitch = THREE.MathUtils.clamp(s.dragPitch + (e.clientY - down.ly) * 0.005, -1.3, 1.3);
      down.lx = e.clientX;
      down.ly = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 10 && performance.now() - down.t < 450) {
        tmp.v.set(0, 0, -1).applyQuaternion(camera.quaternion);
        tmp.v.y = 0;
        if (tmp.v.lengthSq() > 1e-4) st.current.pos.addScaledVector(tmp.v.normalize(), EYE_STEP);
      }
      down = null;
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [gl, camera, tmp]);

  // jump to another viewpoint (on-screen previous / next)
  useEffect(() => {
    xrBridge.phoneVRGoTo = (index: number) => {
      const p = panoPoints[(index + panoPoints.length) % panoPoints.length];
      const s = st.current;
      useApp.getState().setPano(panoPoints.indexOf(p));
      s.pos.set(...p.position);
      camera.position.copy(s.pos);
      s.targetYaw = Math.atan2(-(p.lookAt[0] - p.position[0]), -(p.lookAt[2] - p.position[2]));
      s.dragYaw = 0;
      s.dragPitch = 0;
      s.aligned = false; // re-align the sensor heading to the new view direction
    };
    return () => {
      xrBridge.phoneVRGoTo = null;
    };
  }, [camera]);

  // keyboard (and Bluetooth keyboards / remotes): WASD or arrows, Q/E to turn
  const keys = useRef(new Set<string>());
  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      vrInput.forward = vrInput.strafe = vrInput.turn = 0;
    };
  }, []);

  // priority 1 takes over rendering while this session is mounted
  useFrame((_, dt) => {
    const s = st.current;
    const step = Math.min(dt, 0.1);

    // combine on-screen controls, keyboard and any connected gamepad
    const k = keys.current;
    let fwd = vrInput.forward + (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    let strafe = vrInput.strafe + (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0);
    let turn = vrInput.turn + (k.has('e') || k.has('arrowright') ? 1 : 0) - (k.has('q') || k.has('arrowleft') ? 1 : 0);
    const pad = navigator.getGamepads?.().find((g) => g && g.connected);
    if (pad && pad.axes.length >= 2) {
      const dz = (v: number) => (Math.abs(v) > 0.15 ? v : 0);
      strafe += dz(pad.axes[0]);
      fwd -= dz(pad.axes[1]);
      if (pad.axes.length >= 4) turn += dz(pad.axes[2]);
      if (pad.buttons[12]?.pressed) fwd += 1;
      if (pad.buttons[13]?.pressed) fwd -= 1;
    }
    fwd = THREE.MathUtils.clamp(fwd, -1, 1);
    strafe = THREE.MathUtils.clamp(strafe, -1, 1);
    turn = THREE.MathUtils.clamp(turn, -1, 1);
    if (turn) s.dragYaw -= turn * TURN_SPEED * step;
    if (fwd || strafe) {
      tmp.v.set(0, 0, -1).applyQuaternion(camera.quaternion);
      tmp.v.y = 0;
      if (tmp.v.lengthSq() > 1e-4) {
        tmp.v.normalize();
        s.pos.addScaledVector(tmp.v, fwd * WALK_SPEED * step);
        s.pos.x += -tmp.v.z * strafe * WALK_SPEED * step;
        s.pos.z += tmp.v.x * strafe * WALK_SPEED * step;
      }
    }

    if (s.sensor) {
      tmp.yq.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, s.yawOffset + s.dragYaw);
      camera.quaternion.copy(tmp.yq).multiply(s.device);
    } else {
      tmp.e.set(-s.dragPitch, s.targetYaw + s.dragYaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(tmp.e);
    }
    camera.position.lerp(s.pos, 0.25);
    camera.updateMatrixWorld();
    effect.setSize(size.width, size.height);
    effect.render(scene, camera);
  }, 1);

  return null;
}

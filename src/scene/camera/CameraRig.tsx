import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import CameraControlsImpl from 'camera-controls';
import { useApp } from '../../state/store';
import { panoPoints, viewPresets } from '../../data/views';

const { ACTION } = CameraControlsImpl;

/**
 * Orbit / pan / zoom for the model, smooth transitions between views, and a
 * first-person look-around mode for the 360° viewpoints. Disabled during XR,
 * where the headset drives the camera.
 */
export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null);
  const request = useApp((s) => s.cameraRequest);
  const mode = useApp((s) => s.mode);
  const panoIndex = useApp((s) => s.panoIndex);
  const xr = useApp((s) => s.xrActive);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const targetFov = useRef(viewPresets[0].fov);
  const pano = mode === 'pano';

  useEffect(() => {
    cameraNudge.controls = ref.current;
    return () => {
      cameraNudge.controls = null;
    };
  }, []);

  // initial view
  useEffect(() => {
    const p = viewPresets[0];
    ref.current?.setLookAt(...portraitAdjust(p.position, p.target, camera.aspect), ...p.target, false);
    camera.fov = p.fov;
    camera.updateProjectionMatrix();
  }, [camera]);

  // camera requests (views, element focus, tour stops)
  useEffect(() => {
    if (!request || !ref.current || pano) return;
    if (request.fov) targetFov.current = request.fov;
    else if (targetFov.current < 26) targetFov.current = 32; // leave long-lens elevations when focusing
    const p = portraitAdjust(request.position, request.target, camera.aspect);
    ref.current.setLookAt(...p, ...request.target, !request.instant);
  }, [request, pano, camera]);

  // 360° viewpoints: stand at eye level and look around a point just ahead
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (pano) {
      const p = panoPoints[panoIndex];
      const pos = new THREE.Vector3(...p.position);
      const dir = new THREE.Vector3(...p.lookAt).sub(pos).normalize();
      const tgt = pos.clone().add(dir.multiplyScalar(0.05));
      c.minDistance = 0.01;
      c.maxDistance = 0.06;
      c.mouseButtons.wheel = ACTION.NONE;
      c.mouseButtons.right = ACTION.NONE;
      c.mouseButtons.middle = ACTION.NONE;
      c.touches.two = ACTION.NONE;
      c.touches.three = ACTION.NONE;
      c.azimuthRotateSpeed = -0.35;
      c.polarRotateSpeed = -0.35;
      c.minPolarAngle = 0.15;
      c.maxPolarAngle = Math.PI - 0.15;
      targetFov.current = 70;
      c.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, true);
    } else {
      c.minDistance = 4;
      c.maxDistance = 420;
      c.mouseButtons.wheel = ACTION.DOLLY;
      c.mouseButtons.right = ACTION.TRUCK;
      c.mouseButtons.middle = ACTION.DOLLY;
      c.touches.two = ACTION.TOUCH_DOLLY_TRUCK;
      c.touches.three = ACTION.TOUCH_TRUCK;
      c.azimuthRotateSpeed = 1;
      c.polarRotateSpeed = 1;
      c.minPolarAngle = 0;
      c.maxPolarAngle = Math.PI / 2 - 0.03;
    }
  }, [pano, panoIndex]);

  // leaving 360° mode: return to the exterior perspective
  const wasPano = useRef(false);
  useEffect(() => {
    if (wasPano.current && !pano) {
      const p = viewPresets[0];
      targetFov.current = p.fov;
      ref.current?.setLookAt(...p.position, ...p.target, true);
    }
    wasPano.current = pano;
  }, [pano]);

  // zoom in 360° mode changes the field of view instead of moving
  useEffect(() => {
    if (!pano) return;
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetFov.current = THREE.MathUtils.clamp(targetFov.current + e.deltaY * 0.03, 30, 95);
    };
    let pinch = 0;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinch) targetFov.current = THREE.MathUtils.clamp(targetFov.current - (d - pinch) * 0.12, 30, 95);
      pinch = d;
    };
    const onTouchEnd = () => (pinch = 0);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [pano, gl]);

  useFrame((_, dt) => {
    if (xr !== 'none') return;
    if (Math.abs(camera.fov - targetFov.current) > 0.05) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov.current, 4, dt);
      camera.updateProjectionMatrix();
    }
  });

  return <CameraControls ref={ref} makeDefault enabled={xr === 'none'} smoothTime={0.55} draggingSmoothTime={0.12} dollyToCursor={!pano} />;
}

/** Narrow portrait screens see less horizontally, so pull the camera back. */
function portraitAdjust(pos: [number, number, number], target: [number, number, number], aspect: number): [number, number, number] {
  if (!aspect || aspect >= 1.1) return pos;
  const k = Math.min(2.1, 1.1 / aspect) * 0.85;
  return [target[0] + (pos[0] - target[0]) * k, target[1] + (pos[1] - target[1]) * k, target[2] + (pos[2] - target[2]) * k];
}

/** On-screen helpers for touch devices and keyboards: zoom and rotate by steps. */
export const cameraNudge = {
  controls: null as CameraControlsImpl | null,
  rotate(deg: number) {
    this.controls?.rotate(THREE.MathUtils.degToRad(deg), 0, true);
  },
  zoom(factor: number) {
    const c = this.controls;
    if (c) c.dolly(c.distance * factor, true);
  },
};

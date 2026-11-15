import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { useApp } from '../../state/store';
import { EYE, panoPoints } from '../../data/views';
import { xrBridge } from './xrSupport';

const Y = new THREE.Vector3(0, 1, 0);
const ringGeom = new THREE.RingGeometry(0.07, 0.095, 40).rotateX(-Math.PI / 2);
const AR_DEFAULT_SCALE = 1 / 160; // ~80 m building → ~0.5 m tabletop model

/**
 * Real WebXR sessions driven straight through three.js:
 *  - VR ('immersive-vr'): full-scale walk-through from the chosen viewpoint,
 *    left thumbstick to move, right thumbstick to snap-turn.
 *  - AR ('immersive-ar' + hit-test): a reticle finds a surface, tap to place a
 *    scale model, then rotate / scale / re-place from the overlay.
 */
export function XRController({ arRoot, overlay }: { arRoot: RefObject<THREE.Group>; overlay: RefObject<HTMLElement> }) {
  const gl = useThree((s) => s.gl);
  const setXRActive = useApp((s) => s.setXRActive);
  const xrActive = useApp((s) => s.xrActive);
  const reticle = useRef<THREE.Mesh>(null);
  const hitSource = useRef<XRHitTestSource | null>(null);
  const vr = useRef({ P: new THREE.Vector3(), yaw: 0, base: null as XRReferenceSpace | null, turnLatch: false, floorOffset: 0 });
  const ar = useRef({ placed: false, scale: AR_DEFAULT_SCALE, rot: 0 });
  const tmp = useMemo(() => ({ q: new THREE.Quaternion(), v: new THREE.Vector3(), m: new THREE.Matrix4(), e: new THREE.Euler() }), []);

  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;

    const resetRoot = () => {
      const r = arRoot.current;
      if (!r) return;
      r.position.set(0, 0, 0);
      r.rotation.set(0, 0, 0);
      r.scale.setScalar(1);
      r.visible = true;
    };

    const onEnd = () => {
      hitSource.current?.cancel();
      hitSource.current = null;
      vr.current.base = null;
      ar.current = { placed: false, scale: AR_DEFAULT_SCALE, rot: 0 };
      resetRoot();
      setXRActive('none');
      useApp.getState().resetCamera();
    };

    xrBridge.enterVR = async () => {
      if (!xr) throw new Error('WebXR is not available in this browser.');
      // requestSession must be the first await so it runs inside the user gesture
      const session = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
      // Headsets with room tracking grant 'local-floor' (origin on the floor).
      // Phones and seated/3-DoF viewers often only grant 'local' (origin at the
      // head), so fall back to it and lift the origin to eye height instead.
      let floorOffset = 0;
      try {
        let type: XRReferenceSpaceType = 'local-floor';
        try {
          await session.requestReferenceSpace('local-floor');
        } catch {
          type = 'local';
          floorOffset = EYE;
        }
        gl.xr.enabled = true;
        gl.xr.setReferenceSpaceType(type);
        await gl.xr.setSession(session);
      } catch (err) {
        session.end().catch(() => {});
        throw err;
      }
      const start = panoPoints[useApp.getState().panoIndex] ?? panoPoints[0];
      const dx = start.lookAt[0] - start.position[0];
      const dz = start.lookAt[2] - start.position[2];
      vr.current.yaw = Math.atan2(-dx, -dz);
      vr.current.floorOffset = floorOffset;
      vr.current.P.set(start.position[0], start.position[1] - EYE + floorOffset, start.position[2]);
      vr.current.base = gl.xr.getReferenceSpace();
      applyOffset();
      // Trigger / screen tap (select) steps forward along the gaze — works on
      // every VR device, including controller-less and 3-DoF viewers.
      session.addEventListener('select', () => stepForward(2.5));
      session.addEventListener('end', onEnd, { once: true });
      setXRActive('vr');
    };

    xrBridge.enterAR = async () => {
      if (!xr) throw new Error('WebXR is not available in this browser.');
      const init: XRSessionInit = { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'] };
      if (overlay.current) init.domOverlay = { root: overlay.current };
      const session = await xr.requestSession('immersive-ar', init);
      try {
        gl.xr.enabled = true;
        gl.xr.setReferenceSpaceType('local');
        await gl.xr.setSession(session);
        const viewer = await session.requestReferenceSpace('viewer');
        hitSource.current = (await session.requestHitTestSource?.({ space: viewer })) ?? null;
      } catch (err) {
        session.end();
        throw err;
      }
      ar.current = { placed: false, scale: AR_DEFAULT_SCALE, rot: 0 };
      if (arRoot.current) arRoot.current.visible = false;
      session.addEventListener('select', () => {
        const ret = reticle.current;
        const root = arRoot.current;
        if (!ret?.visible || !root) return;
        ret.matrix.decompose(root.position, tmp.q, tmp.v);
        root.scale.setScalar(ar.current.scale);
        root.rotation.set(0, ar.current.rot, 0);
        root.visible = true;
        ar.current.placed = true;
      });
      session.addEventListener('end', onEnd, { once: true });
      setXRActive('ar');
    };

    xrBridge.exit = () => {
      gl.xr.getSession()?.end();
    };
    xrBridge.arRotate = (deg) => {
      ar.current.rot += THREE.MathUtils.degToRad(deg);
      if (arRoot.current) arRoot.current.rotation.y = ar.current.rot;
    };
    xrBridge.arScale = (f) => {
      ar.current.scale = THREE.MathUtils.clamp(ar.current.scale * f, 1 / 2000, 1 / 20);
      if (arRoot.current && ar.current.placed) arRoot.current.scale.setScalar(ar.current.scale);
    };
    xrBridge.arReplace = () => {
      ar.current.placed = false;
      if (arRoot.current) arRoot.current.visible = false;
    };
    xrBridge.exportUSDZ = async () => {
      const root = arRoot.current;
      if (!root) throw new Error('Model not ready');
      const out = new THREE.Group();
      root.updateMatrixWorld(true);
      root.traverseVisible((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh) return;
        const mat = mesh.material as THREE.Material;
        if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
        const copy = new THREE.Mesh(mesh.geometry, mat);
        copy.applyMatrix4(mesh.matrixWorld);
        out.add(copy);
      });
      out.scale.setScalar(0.01); // 1:100 — Quick Look lets the viewer scale it
      out.updateMatrixWorld(true);
      const data = await new USDZExporter().parseAsync(out);
      return new Blob([data], { type: 'model/vnd.usdz+zip' });
    };

    function applyOffset() {
      const s = vr.current;
      if (!s.base) return;
      // originOffset = R(-yaw) · T(-P)
      const pos = s.P.clone().negate().applyAxisAngle(Y, -s.yaw);
      tmp.q.setFromAxisAngle(Y, -s.yaw);
      const t = new XRRigidTransform({ x: pos.x, y: pos.y, z: pos.z }, { x: tmp.q.x, y: tmp.q.y, z: tmp.q.z, w: tmp.q.w });
      gl.xr.setReferenceSpace(s.base.getOffsetReferenceSpace(t));
    }
    vrApply.current = applyOffset;

    function stepForward(dist: number) {
      if (!vr.current.base) return;
      const xrCam = gl.xr.getCamera();
      xrCam.getWorldDirection(tmp.v);
      tmp.v.y = 0;
      if (tmp.v.lengthSq() < 1e-4) return;
      tmp.v.normalize();
      vr.current.P.addScaledVector(tmp.v, dist);
      applyOffset();
    }

    return () => {
      xrBridge.enterVR = null;
      xrBridge.enterAR = null;
      xrBridge.exit = null;
      xrBridge.exportUSDZ = null;
    };
  }, [gl, arRoot, overlay, setXRActive, tmp]);

  const vrApply = useRef<() => void>(() => {});

  useFrame((_, dt, frame?: XRFrame) => {
    if (!frame) return;
    const session = frame.session;

    if (xrActive === 'ar' && hitSource.current && reticle.current) {
      const ref = gl.xr.getReferenceSpace();
      const hits = frame.getHitTestResults(hitSource.current);
      const pose = ref && hits.length ? hits[0].getPose(ref) : null;
      reticle.current.visible = !!pose && !ar.current.placed;
      if (pose) reticle.current.matrix.fromArray(pose.transform.matrix);
    }

    if (xrActive === 'vr' && vr.current.base) {
      const s = vr.current;
      let moveX = 0;
      let moveY = 0;
      let turn = 0;
      const sticks: { hand: XRHandedness; x: number; y: number }[] = [];
      for (const src of session.inputSources) {
        const axes = src.gamepad?.axes;
        if (!axes || axes.length < 2) continue;
        // xr-standard mapping: thumbstick on axes 2/3, touchpad on 0/1
        const x = axes.length >= 4 && (axes[2] || axes[3]) ? axes[2] : axes[0];
        const y = axes.length >= 4 && (axes[2] || axes[3]) ? axes[3] : axes[1];
        sticks.push({ hand: src.handedness, x, y });
      }
      if (sticks.length === 1) {
        // one controller: push to walk, sideways to turn
        moveY = sticks[0].y;
        turn = Math.abs(sticks[0].x) > 0.65 ? sticks[0].x : 0;
      } else {
        for (const st of sticks) {
          if (st.hand === 'right') {
            turn = st.x;
            // right stick up/down also walks, for people who prefer one hand
            if (Math.abs(st.y) > Math.abs(moveY)) moveY = st.y;
          } else {
            moveX = st.x;
            moveY = Math.abs(st.y) > Math.abs(moveY) ? st.y : moveY;
          }
        }
      }
      let changed = false;
      // snap turn around the head position
      if (Math.abs(turn) > 0.65 && !s.turnLatch) {
        s.turnLatch = true;
        const viewer = frame.getViewerPose(s.base!);
        const h = viewer ? new THREE.Vector3(viewer.transform.position.x, 0, viewer.transform.position.z) : new THREE.Vector3();
        const headWorld = s.P.clone().add(h.clone().applyAxisAngle(Y, s.yaw));
        s.yaw -= Math.sign(turn) * THREE.MathUtils.degToRad(30);
        s.P.copy(headWorld.sub(h.applyAxisAngle(Y, s.yaw)));
        s.P.y = Math.round(s.P.y * 100) / 100;
        changed = true;
      } else if (Math.abs(turn) < 0.3) s.turnLatch = false;

      if (Math.abs(moveX) > 0.12 || Math.abs(moveY) > 0.12) {
        const xrCam = gl.xr.getCamera();
        xrCam.getWorldDirection(tmp.v);
        tmp.v.y = 0;
        if (tmp.v.lengthSq() < 1e-4) tmp.v.set(0, 0, -1);
        tmp.v.normalize();
        const right = new THREE.Vector3(-tmp.v.z, 0, tmp.v.x);
        const speed = 3.2 * dt;
        s.P.addScaledVector(tmp.v, -moveY * speed).addScaledVector(right, moveX * speed);
        changed = true;
      }
      if (changed) vrApply.current();
    }
  });

  return (
    <>
      <mesh ref={reticle} matrixAutoUpdate={false} visible={false} geometry={ringGeom}>
        <meshBasicMaterial color="#B66A4A" />
      </mesh>
      {xrActive === 'vr' && <ControllerRays />}
    </>
  );
}

const rayGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
const rayMat = new THREE.LineBasicMaterial({ color: '#F5F1E8', transparent: true, opacity: 0.7 });

/** Short pointer rays on the tracked controllers so users can see their hands. */
function ControllerRays() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const ctrls = [0, 1].map((i) => {
      const c = gl.xr.getController(i);
      const line = new THREE.Line(rayGeom, rayMat);
      line.scale.z = 1.5;
      c.add(line);
      scene.add(c);
      return { c, line };
    });
    return () => {
      for (const { c, line } of ctrls) {
        c.remove(line);
        scene.remove(c);
      }
    };
  }, [gl, scene]);
  return null;
}

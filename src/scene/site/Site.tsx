import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cars, plaza, site, streetLamps, trees } from '../../data/building';
import { box } from '../../lib/geom';
import { materials } from '../../lib/materials';
import { Selectable } from '../interaction/Selectable';
import { useApp } from '../../state/store';

const S = site;
const RW = S.roadWidth;
// Kerb lines of the four streets
const rx0 = S.x0 - S.sidewalk;
const rx1 = S.x1 + S.sidewalk;
const rz0 = S.z0 - S.sidewalk;
const rz1 = S.z1 + S.sidewalk;
const EXTENT = 170;

export function Site() {
  const mats = materials();
  const view = useApp((s) => s.view);
  const mode = useApp((s) => s.mode);
  // Elevation drawings leave out foreground trees and street furniture.
  const elevation = mode === 'model' && (view === 'front' || view === 'side');
  const g = useMemo(() => {
    const roads = [
      box(rx0 - RW, rx0, -0.05, 0.02, -EXTENT, EXTENT, 8),
      box(rx1, rx1 + RW, -0.05, 0.02, -EXTENT, EXTENT, 8),
      box(-EXTENT, EXTENT, -0.05, 0.021, rz1, rz1 + RW, 8),
      box(-EXTENT, EXTENT, -0.05, 0.021, rz0 - RW, rz0, 8),
    ];
    const walks = [
      box(rx0, rx1, 0, 0.16, rz0, S.z0, 2),
      box(rx0, rx1, 0, 0.16, S.z1, rz1, 2),
      box(rx0, S.x0, 0, 0.16, S.z0, S.z1, 2),
      box(S.x1, rx1, 0, 0.16, S.z0, S.z1, 2),
      // outer pavements across the streets
      box(rx0 - RW - 4, rx0 - RW, 0, 0.16, -EXTENT, EXTENT, 2),
      box(rx1 + RW, rx1 + RW + 4, 0, 0.16, -EXTENT, EXTENT, 2),
      box(-EXTENT, EXTENT, 0, 0.16, rz1 + RW, rz1 + RW + 4, 2),
      box(-EXTENT, EXTENT, 0, 0.16, rz0 - RW - 4, rz0 - RW, 2),
    ];
    const marks: THREE.BufferGeometry[] = [];
    for (let t = -EXTENT; t < EXTENT; t += 7) {
      marks.push(box(rx0 - RW / 2 - 0.1, rx0 - RW / 2 + 0.1, 0.02, 0.035, t, t + 3.5));
      marks.push(box(rx1 + RW / 2 - 0.1, rx1 + RW / 2 + 0.1, 0.02, 0.035, t, t + 3.5));
      marks.push(box(t, t + 3.5, 0.021, 0.036, rz1 + RW / 2 - 0.1, rz1 + RW / 2 + 0.1));
      marks.push(box(t, t + 3.5, 0.021, 0.036, rz0 - RW / 2 - 0.1, rz0 - RW / 2 + 0.1));
    }
    const lawn = box(S.x0, S.x1, 0, 0.1, S.z0, S.z1, 6);
    const pav = plaza.map((p) => box(p.x0, p.x1, 0, 0.14, p.z0, p.z1, 2));
    // raised planters in the plaza
    const planters = [
      box(40, 47, 0, 0.6, 28, 34, 1.2),
      box(42, 48, 0, 0.6, 8, 16, 1.2),
      box(42, 48, 0, 0.6, -12, -4, 1.2),
      box(42, 48, 0, 0.6, -32, -24, 1.2),
      box(21, 27, 0, 0.6, 30, 35, 1.2),
    ];
    return { roads, walks, marks, lawn, pav, planters };
  }, []);

  return (
    <group>
      {/* surrounding land */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.06, 0]} receiveShadow material={mats.ground}>
        <planeGeometry args={[EXTENT * 2.4, EXTENT * 2.4]} />
      </mesh>
      {g.roads.map((r, i) => (
        <mesh key={`r${i}`} geometry={r} material={mats.asphalt} receiveShadow />
      ))}
      {g.walks.map((r, i) => (
        <mesh key={`w${i}`} geometry={r} material={mats.sidewalk} receiveShadow />
      ))}
      <Merged list={g.marks} material={mats.marking} />
      <Selectable id="landscape">
        <mesh geometry={g.lawn} material={mats.lawn} receiveShadow />
        <Shrubs />
      </Selectable>
      <Selectable id="plaza">
        {g.pav.map((p, i) => (
          <mesh key={`p${i}`} geometry={p} material={mats.pavers} receiveShadow />
        ))}
        {g.planters.map((p, i) => (
          <mesh key={`pl${i}`} geometry={p} material={mats.cap} castShadow receiveShadow />
        ))}
      </Selectable>
      <group visible={!elevation}>
        <Trees />
        <Lamps />
      </group>
      <Cars />
    </group>
  );
}

function Merged({ list, material }: { list: THREE.BufferGeometry[]; material: THREE.Material }) {
  const geom = useMemo(() => mergeGeometries(list) ?? new THREE.BufferGeometry(), [list]);
  return <mesh geometry={geom} material={material} receiveShadow />;
}

const blob = new THREE.IcosahedronGeometry(1, 2);
const trunkGeom = new THREE.CylinderGeometry(0.22, 0.32, 1, 6);
trunkGeom.translate(0, 0.5, 0);

function Trees() {
  const crown = useRef<THREE.InstancedMesh>(null);
  const crown2 = useRef<THREE.InstancedMesh>(null);
  const trunk = useRef<THREE.InstancedMesh>(null);
  const mats = materials();
  const n = trees.length;
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    trees.forEach(([x, z, s], i) => {
      const h = 4.5 * s;
      o.position.set(x, 0, z);
      o.rotation.set(0, 0, 0);
      o.scale.set(s, h, s);
      o.updateMatrix();
      trunk.current!.setMatrixAt(i, o.matrix);
      o.position.set(x, h + 2.6 * s, z);
      o.rotation.set(i, i * 2.1, 0);
      o.scale.set(4.6 * s, 3.8 * s, 4.6 * s);
      o.updateMatrix();
      crown.current!.setMatrixAt(i, o.matrix);
      o.position.set(x + 1.8 * s * Math.cos(i), h + 3.6 * s, z + 1.6 * s * Math.sin(i));
      o.scale.set(3 * s, 2.6 * s, 3 * s);
      o.updateMatrix();
      crown2.current!.setMatrixAt(i, o.matrix);
    });
    for (const r of [trunk, crown, crown2]) r.current!.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <instancedMesh ref={trunk} args={[trunkGeom, mats.trunk, n]} castShadow />
      <instancedMesh ref={crown} args={[blob, mats.foliage, n]} castShadow receiveShadow />
      <instancedMesh ref={crown2} args={[blob, mats.foliageLight, n]} castShadow receiveShadow />
    </group>
  );
}

function Shrubs() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mats = materials();
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    let k = 0;
    // along the west street edge and the front of the podium
    for (let z = -42; z < 35; z += 2.6) out.push([-42 + Math.sin(k++) * 1.1, z, 0.8 + (k % 3) * 0.25]);
    for (let x = -38; x < 2; x += 2.8) out.push([x, 34 + Math.cos(k++) * 1.1, 0.8 + (k % 3) * 0.25]);
    for (let x = -44; x < 48; x += 3.2) out.push([x, -43 + Math.sin(k++), 0.7 + (k % 2) * 0.3]);
    return out;
  }, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    pts.forEach(([x, z, s], i) => {
      o.position.set(x, 0.3 * s, z);
      o.scale.set(1.3 * s, 0.9 * s, 1.3 * s);
      o.rotation.set(0, i, 0);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [pts]);
  return <instancedMesh ref={ref} args={[blob, mats.shrub, pts.length]} castShadow receiveShadow />;
}

const carColours = ['#8C8F93', '#D9D6CF', '#5D6B78', '#A64B3C', '#2F3236', '#C2B59B', '#6E7B6A'];

function Cars() {
  const mats = materials();
  return (
    <group>
      {cars.map(([x, z, r], i) => {
        const along = Math.abs(Math.sin(r)) > 0.5; // rotated to run along X
        const px = x < -50 ? rx0 - RW * (r === 0 ? 0.25 : 0.75) : x > 50 ? rx1 + RW * (r === 0 ? 0.75 : 0.25) : x;
        const pz = z > 30 ? rz1 + RW * (r > 0 ? 0.75 : 0.25) : z < -45 ? rz0 - RW * (r > 0 ? 0.25 : 0.75) : z;
        return (
          <group key={i} position={[px, 0, pz]} rotation-y={along ? Math.PI / 2 : 0}>
            <mesh position={[0, 0.65, 0]} castShadow>
              <boxGeometry args={[1.85, 0.75, 4.4]} />
              <meshStandardMaterial color={carColours[i % carColours.length]} roughness={0.35} metalness={0.4} />
            </mesh>
            <mesh position={[0, 1.25, -0.2]} castShadow material={mats.glass}>
              <boxGeometry args={[1.6, 0.55, 2.3]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Lamps() {
  const mats = materials();
  return (
    <group>
      {streetLamps.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 3.5, 0]} material={mats.pole} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 7, 6]} />
          </mesh>
          <mesh position={[0, 7.05, 0]} material={mats.lamp}>
            <boxGeometry args={[0.6, 0.18, 0.35]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

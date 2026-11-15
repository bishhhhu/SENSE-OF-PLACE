import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { blocks, levels, people, recesses, LEVEL_HEIGHT, type LevelId } from '../../data/building';
import { zones, zoneTone } from '../../data/floors';
import { blockLevelParts, linkLevelParts, podiumParts, roofParts } from '../../lib/buildingParts';
import { materials, stallColours } from '../../lib/materials';
import { box } from '../../lib/geom';
import { useApp } from '../../state/store';
import { Parts } from './Parts';
import { LevelGroup, useCut } from './LevelGroup';
import { Pavilion } from './Pavilion';
import { Selectable } from '../interaction/Selectable';

/**
 * The procedural reconstruction. To swap in an accurate Blender/GLTF model
 * later, replace the contents of each <LevelGroup> with that storey's GLTF
 * node (or replace <Building/> wholesale) — floor isolation, selection and XR
 * only depend on the LevelGroup and Selectable wrappers.
 */
export function Building({ showPeople = true }: { showPeople?: boolean }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <LevelGroup key={i} id={levels[i].id}>
          <Storey index={i} />
          {i === 0 && <Ground />}
          {i === 1 && <Pavilion />}
          {showPeople && <People level={i} />}
          <ZoneOverlay level={levels[i].id} />
        </LevelGroup>
      ))}
      <LevelGroup id="RF">
        <Parts build={() => blocks.flatMap((b) => roofParts(b))} deps={[]} />
        <ZoneOverlay level="RF" />
      </LevelGroup>
    </group>
  );
}

function Storey({ index }: { index: number }) {
  const cut = useCut();
  return (
    <>
      {blocks.map((b) => (
        <Parts key={b.id} build={() => blockLevelParts(b, index, cut)} deps={[b, index, cut]} />
      ))}
      <Parts build={() => linkLevelParts(index, cut)} deps={[index, cut]} />
    </>
  );
}

function Ground() {
  const cut = useCut();
  return (
    <>
      <Parts build={() => podiumParts(cut)} deps={[cut]} />
      <Stalls />
    </>
  );
}

/** Market stalls and goods in the open ground floor of the east block (visible in the render). */
function Stalls() {
  const mats = materials();
  const geom = useMemo(() => {
    const C = blocks.find((b) => b.id === 'C')!;
    const s = recesses.find((r) => r.block === 'C' && r.face === 's')!;
    const w = recesses.find((r) => r.block === 'C' && r.face === 'w')!;
    const tables: THREE.BufferGeometry[] = [];
    const goods: { g: THREE.BufferGeometry; c: string }[] = [];
    let k = 0;
    // along the south set-back wall
    for (let x = C.x0 + w.depth + 1; x < s.to - 1.5; x += 2.6) {
      const z = C.z1 - s.depth + 0.4;
      tables.push(box(x, x + 2, 0.75, 0.85, z, z + 1.1));
      for (let i = 0; i < 3; i++) goods.push({ g: box(x + 0.1 + i * 0.62, x + 0.6 + i * 0.62, 0.85, 1.2 + (i % 2) * 0.15, z + 0.1, z + 1), c: stallColours[k++ % stallColours.length] });
    }
    // along the west set-back wall
    for (let z = w.from + 1; z < C.z1 - s.depth - 1.5; z += 2.6) {
      const x = C.x0 + w.depth - 1.5;
      tables.push(box(x, x + 1.1, 0.75, 0.85, z, z + 2));
      for (let i = 0; i < 3; i++) goods.push({ g: box(x + 0.1, x + 1, 0.85, 1.15 + (i % 2) * 0.2, z + 0.1 + i * 0.62, z + 0.6 + i * 0.62), c: stallColours[k++ % stallColours.length] });
    }
    return { tables, goods };
  }, []);
  return (
    <Selectable id="arcade">
      {geom.tables.map((g, i) => (
        <mesh key={`t${i}`} geometry={g} material={mats.timber} castShadow receiveShadow />
      ))}
      {geom.goods.map((g, i) => (
        <mesh key={`g${i}`} geometry={g.g} castShadow>
          <meshStandardMaterial color={g.c} roughness={0.8} />
        </mesh>
      ))}
    </Selectable>
  );
}

const personGeom = new THREE.CapsuleGeometry(0.24, 1.1, 3, 8);
personGeom.translate(0, 0.79, 0);
const clothing = ['#3C4A5C', '#B66A4A', '#EDE7DA', '#5C6B47', '#7A3B3B', '#2F2F2C', '#C9A04A'];

function People({ level }: { level: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const list = useMemo(() => people.filter((p) => Math.round(p[1] / LEVEL_HEIGHT) === level), [level]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    list.forEach((p, i) => {
      o.position.set(p[0], p[1] + 0.12, p[2]);
      o.scale.setScalar(0.9 + ((i * 37) % 10) / 50);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, new THREE.Color(clothing[(i + level * 3) % clothing.length]));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [list, level]);
  if (!list.length) return null;
  return (
    <instancedMesh ref={ref} args={[personGeom, undefined, list.length]} castShadow>
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  );
}

/** Coloured plan zones on an isolated storey; undocumented interiors are hatched grey. */
function ZoneOverlay({ level }: { level: LevelId }) {
  const iso = useApp((s) => s.isolatedLevel);
  const select = useApp((s) => s.select);
  if (iso !== level) return null;
  const elev = levels.find((l) => l.id === level)!.elevation;
  const list = zones.filter((z) => z.level === level);
  return (
    <group>
      {list.map((z) => {
        const y = elev + (level === 'RF' ? 1.05 : 0.24);
        const cx = (z.x0 + z.x1) / 2;
        const cz = (z.z0 + z.z1) / 2;
        const documented = z.tone !== 'undocumented';
        return (
          <group key={z.id}>
            <mesh
              position={[cx, y, cz]}
              rotation-x={-Math.PI / 2}
              onClick={(e) => {
                if (e.delta > 6) return;
                e.stopPropagation();
                if (z.elementId) select(z.elementId, false);
              }}
            >
              <planeGeometry args={[z.x1 - z.x0 - 0.3, z.z1 - z.z0 - 0.3]} />
              <meshBasicMaterial color={zoneTone[z.tone].fill} transparent opacity={documented ? 0.62 : 0.3} depthWrite={false} />
            </mesh>
            <Html position={[cx, y + 0.4, cz]} center distanceFactor={70} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <div className={`whitespace-nowrap rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] shadow-sm ${documented ? 'border-charcoal/20 bg-ivory/95 text-charcoal' : 'border-stone-dark/60 bg-white/80 text-charcoal-soft'}`}>
                {documented ? z.name : `${z.name.split(' — ')[0]} · not documented`}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

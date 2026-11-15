import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { materials } from '../../lib/materials';
import { box } from '../../lib/geom';
import { archInfill, archPoints, hornGeometry, shellGeometry, shellRibs, tube } from '../../lib/pavilionGeom';
import { pavilion as P } from '../../data/building';
import { Selectable } from '../interaction/Selectable';
import { useCut } from './LevelGroup';

const SIDES = ['n', 's', 'e', 'w'] as const;
const CORNERS: [number, number][] = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

function merge(list: THREE.BufferGeometry[]) {
  return mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => {
    if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
    return g;
  }), false)!;
}

export function Pavilion() {
  const cut = useCut();
  const mats = materials();

  const geo = useMemo(() => {
    const horns = CORNERS.map(([sx, sz]) => hornGeometry(sx, sz));
    const shell = shellGeometry();
    const skin = merge([shell, ...horns.map((h) => h.geom)]);
    const ribs = merge([
      ...shellRibs(10),
      ...SIDES.map((s) => tube(archPoints(s), 0.2, 64)),
      ...horns.flatMap((h) => [tube(h.spine, 0.2, 32), ...h.edges.map((e) => tube(e, 0.1, 32))]),
    ]);
    const lattice = merge(SIDES.map((s) => archInfill(s)));
    const a = P.width / 2;
    const b = P.depth / 2;
    const deck = box(P.cx - a - 0.6, P.cx + a + 0.6, P.baseY - 0.05, P.baseY + 0.12, P.cz - b - 0.6, P.cz + b + 0.6, 2.5);
    // foot plates where the arches land on the deck
    const feet = merge(CORNERS.map(([sx, sz]) => box(P.cx + sx * a - 0.5, P.cx + sx * a + 0.5, P.baseY, P.baseY + 0.5, P.cz + sz * b - 0.5, P.cz + sz * b + 0.5)));
    return { skin, ribs, lattice, deck, feet };
  }, []);

  return (
    <group>
      <Selectable id="deck">
        <mesh geometry={geo.deck} material={mats.deck} receiveShadow castShadow />
      </Selectable>
      <Selectable id="canopy">
        <mesh geometry={geo.feet} material={mats.timber} castShadow />
        {!cut && (
          <>
            <mesh geometry={geo.skin} material={mats.membrane} castShadow receiveShadow />
            <mesh geometry={geo.ribs} material={mats.timber} castShadow />
          </>
        )}
      </Selectable>
      {!cut && (
        <Selectable id="canopy-lattice" also={['canopy']}>
          <mesh geometry={geo.lattice} material={mats.lattice} castShadow />
        </Selectable>
      )}
    </group>
  );
}

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../../state/store';
import { levels, type LevelId } from '../../data/building';

const CutContext = createContext(false);
export const useCut = () => useContext(CutContext);

export const EXPLODE_GAP = 9;

/**
 * One storey of the building. When a storey is isolated, every storey above it
 * lifts away and hides; the isolated storey itself is cut at plan height so its
 * layout can be read. In the exploded (compare) view, storeys separate vertically.
 */
export function LevelGroup({ id, children }: { id: LevelId; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const iso = useApp((s) => s.isolatedLevel);
  const exploded = useApp((s) => s.exploded);
  const level = levels.find((l) => l.id === id)!;
  const isoIndex = iso ? levels.find((l) => l.id === iso)!.index : -1;
  const lifted = iso !== null && level.index > isoIndex;
  const cut = iso === id;

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = exploded ? level.index * EXPLODE_GAP : lifted ? 60 + (level.index - isoIndex) * 10 : 0;
    g.position.y = THREE.MathUtils.damp(g.position.y, target, 4, dt);
    g.visible = !(lifted && g.position.y > 45);
  });

  return (
    <group ref={ref}>
      <CutContext.Provider value={cut}>{children}</CutContext.Provider>
    </group>
  );
}

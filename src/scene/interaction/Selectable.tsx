import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../../state/store';
import { glowing } from '../../lib/materials';

const HIGHLIGHT = new THREE.Color('#FFE2C6');
const HOVER = new THREE.Color('#FFF1E0');

interface Props {
  id: string;
  /** Other element ids that should also highlight this group (e.g. the brick screen). */
  also?: string[];
  children: ReactNode;
}

type Tracked = THREE.MeshStandardMaterial & {
  userData: { baseColor?: THREE.Color; baseOpacity?: number; baseTransparent?: boolean; owned?: boolean };
};

/**
 * Wraps part of the model so it can be hovered, clicked and highlighted.
 * Materials are cloned per group so tinting one element never affects another.
 */
export function Selectable({ id, also = [], children }: Props) {
  const group = useRef<THREE.Group>(null);
  const selected = useApp((s) => s.selected);
  const hovered = useApp((s) => s.hovered);
  const ghost = useApp((s) => s.ghostOthers);
  const mode = useApp((s) => s.mode);
  const select = useApp((s) => s.select);
  const hover = useApp((s) => s.hover);
  const interactive = mode === 'model' || mode === 'explore' || mode === 'floors';

  const active = selected === id || (selected !== null && also.includes(selected));
  const hot = hovered === id && interactive;
  const dim = ghost && selected !== null && !active;

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.noTint) return;
      let m = mesh.material as Tracked;
      if (!m.userData.owned) {
        const c = m.clone() as Tracked;
        c.userData = { ...m.userData, owned: true, baseColor: m.color.clone(), baseOpacity: m.opacity, baseTransparent: m.transparent };
        if (m.userData.glow) glowing.add(c);
        mesh.material = c;
        m = c;
      }
      const base = m.userData.baseColor!;
      m.color.copy(base);
      if (active) m.color.lerp(HIGHLIGHT, 0.42);
      else if (hot) m.color.lerp(HOVER, 0.22);
      const wantTransparent = dim || !!m.userData.baseTransparent;
      if (m.transparent !== wantTransparent) {
        m.transparent = wantTransparent;
        m.needsUpdate = true;
      }
      m.opacity = dim ? 0.13 : m.userData.baseOpacity ?? 1;
      m.depthWrite = !dim;
    });
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || e.delta > 6) return;
    e.stopPropagation();
    select(id);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    hover(id);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    if (useApp.getState().hovered === id) hover(null);
    document.body.style.cursor = '';
  };

  return (
    <>
      <group ref={group} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        {children}
      </group>
      {active && <BoundsOutline target={group} />}
    </>
  );
}

const unitEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

/** Thin architectural bounding frame drawn around the selected element. */
function BoundsOutline({ target }: { target: React.RefObject<THREE.Group> }) {
  const lines = useRef<THREE.LineSegments>(null);
  const box = useMemo(() => new THREE.Box3(), []);
  const inv = useMemo(() => new THREE.Matrix4(), []);
  const size = useMemo(() => new THREE.Vector3(), []);
  const centre = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const g = target.current;
    const l = lines.current;
    if (!g || !l || !l.parent) return;
    box.setFromObject(g);
    if (box.isEmpty()) return;
    inv.copy(l.parent.matrixWorld).invert();
    box.applyMatrix4(inv);
    box.getSize(size);
    box.getCenter(centre);
    l.position.copy(centre);
    l.scale.set(size.x + 0.6, size.y + 0.6, size.z + 0.6);
  });

  return (
    <lineSegments ref={lines} geometry={unitEdges} renderOrder={10}>
      <lineBasicMaterial color="#B66A4A" transparent opacity={0.95} depthTest={false} />
    </lineSegments>
  );
}

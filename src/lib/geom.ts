import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { MatKey } from './materials';

export interface Part {
  geom: THREE.BufferGeometry;
  mat: MatKey;
  tag: string;
}

/**
 * Axis-aligned box from min/max coordinates with UVs in world metres divided
 * by `tile`, so a tiling texture lines up across every wall, storey and block.
 */
export function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tile = 1) {
  const w = Math.max(0.001, x1 - x0);
  const h = Math.max(0.001, y1 - y0);
  const d = Math.max(0.001, z1 - z0);
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  worldUV(g, tile);
  return g;
}

export function worldUV(g: THREE.BufferGeometry, tile = 1) {
  const pos = g.getAttribute('position');
  const nor = g.getAttribute('normal');
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (ny > 0.5) uv.setXY(i, x / tile, z / tile);
    else if (nx > 0.5) uv.setXY(i, z / tile, y / tile);
    else uv.setXY(i, x / tile, y / tile);
  }
  uv.needsUpdate = true;
  return g;
}

/** Merge parts into one geometry per (tag, material) pair to keep draw calls low. */
export function mergeParts(parts: Part[]) {
  const groups = new Map<string, { tag: string; mat: MatKey; geoms: THREE.BufferGeometry[] }>();
  for (const p of parts) {
    const k = `${p.tag}|${p.mat}`;
    if (!groups.has(k)) groups.set(k, { tag: p.tag, mat: p.mat, geoms: [] });
    groups.get(k)!.geoms.push(p.geom.index ? p.geom.toNonIndexed() : p.geom);
  }
  const out: { tag: string; mat: MatKey; geom: THREE.BufferGeometry }[] = [];
  for (const g of groups.values()) {
    const merged = mergeGeometries(g.geoms, false);
    if (merged) {
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      out.push({ tag: g.tag, mat: g.mat, geom: merged });
    }
  }
  return out;
}

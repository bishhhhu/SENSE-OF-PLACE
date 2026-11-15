// Parametric reconstruction of the gridshell canopy.
//
// Read from the render: a square-ish shell on the podium deck; each side is a
// tall arch filled with lattice; the corners of the skin sweep up and outward
// into pointed tips; the centre rises as a low dome. The surface here is a
// groin vault (two crossing arches) with a dome bump, plus four corner sails.
import * as THREE from 'three';
import { pavilion as P } from '../data/building';

const a = P.width / 2;
const b = P.depth / 2;

export function archY(u: number) {
  const t = Math.min(1, Math.abs(u));
  return P.archRise * Math.pow(1 - t * t, 0.62);
}

/** Height of the shell above the deck at normalised plan coords (u, v) in [-1, 1]. */
export function shellH(u: number, v: number) {
  const groin = Math.max(archY(u), archY(v));
  const dome = (P.domeRise - P.archRise) * (1 - u * u) * (1 - v * v);
  return groin + dome;
}

const toWorld = (u: number, v: number, h: number) => new THREE.Vector3(P.cx + u * a, P.baseY + h, P.cz + v * b);

export function shellGeometry(seg = 72) {
  const g = new THREE.PlaneGeometry(1, 1, seg, seg);
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) * 2;
    const v = -pos.getY(i) * 2;
    const p = toWorld(u, v, shellH(u, v));
    pos.setXYZ(i, p.x, p.y, p.z);
    uv.setXY(i, (u + 1) * 3.2, (v + 1) * 3.2);
  }
  g.computeVertexNormals();
  return g;
}

/** Points along the arch on one side. side: 's' | 'n' (along X) or 'e' | 'w' (along Z). */
export function archPoints(side: 'n' | 's' | 'e' | 'w', n = 48, from = -1, to = 1) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    if (side === 's' || side === 'n') pts.push(toWorld(t, side === 's' ? 1 : -1, archY(t)));
    else pts.push(toWorld(side === 'e' ? 1 : -1, t, archY(t)));
  }
  return pts;
}

/** Flat lattice infill under one arch. */
export function archInfill(side: 'n' | 's' | 'e' | 'w', tile = 2.2) {
  const half = side === 's' || side === 'n' ? a : b;
  const shape = new THREE.Shape();
  shape.moveTo(-half, 0);
  for (let i = 0; i <= 48; i++) {
    const t = -1 + (2 * i) / 48;
    shape.lineTo(t * half, archY(t) - 0.05);
  }
  shape.lineTo(half, 0);
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape, 24);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tile, uv.getY(i) / tile);
  // place on the side
  if (side === 'e' || side === 'w') g.rotateY(-Math.PI / 2);
  const inset = 0.25;
  if (side === 's') g.translate(P.cx, P.baseY, P.cz + b - inset);
  if (side === 'n') g.translate(P.cx, P.baseY, P.cz - b + inset);
  if (side === 'e') g.translate(P.cx + a - inset, P.baseY, P.cz);
  if (side === 'w') g.translate(P.cx - a + inset, P.baseY, P.cz);
  return g;
}

export interface Horn {
  geom: THREE.BufferGeometry;
  spine: THREE.Vector3[];
  edges: THREE.Vector3[][];
  tip: THREE.Vector3;
}

/**
 * Corner sail: rises from the arch edges near a corner and sweeps up and out to
 * a pointed tip. sx, sz are the corner signs (-1 or 1).
 */
export function hornGeometry(sx: number, sz: number, segT = 28, segS = 24): Horn {
  const e = 0.6; // how far along each arch (from the corner) the sail starts
  const diag = new THREE.Vector3(sx, 0, sz).normalize();
  const base = toWorld(sx, sz, 0);
  const tip = base.clone().add(diag.clone().multiplyScalar(P.hornReach)).add(new THREE.Vector3(0, P.hornRise, 0));

  // lower boundary: along the X-side arch to the corner, then up the Z-side arch
  const boundary = (t: number) => {
    if (t <= 0.5) {
      const k = t / 0.5; // 0 → start on X-arch, 1 → corner
      const u = sx * (1 - e + e * k);
      return toWorld(u, sz, archY(u));
    }
    const k = (t - 0.5) / 0.5; // 0 → corner, 1 → up the Z-arch
    const v = sz * (1 - e * k);
    return toWorld(sx, v, archY(v));
  };

  const g = new THREE.BufferGeometry();
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const point = (t: number, s: number) => {
    const c = boundary(t);
    // control point: rises late so the sail is concave and the tip slender
    const q = c.clone().lerp(tip, 0.55);
    q.y = c.y + (tip.y - c.y) * 0.3;
    const mid = Math.sin(Math.PI * t); // fuller in the middle of the sail
    q.add(diag.clone().multiplyScalar(0.8 * mid));
    // quadratic Bezier c → q → tip
    const o = 1 - s;
    return new THREE.Vector3(
      o * o * c.x + 2 * o * s * q.x + s * s * tip.x,
      o * o * c.y + 2 * o * s * q.y + s * s * tip.y,
      o * o * c.z + 2 * o * s * q.z + s * s * tip.z,
    );
  };
  for (let j = 0; j <= segS; j++) {
    const s = j / segS;
    for (let i = 0; i <= segT; i++) {
      const t = i / segT;
      const p = point(t, s);
      verts.push(p.x, p.y, p.z);
      uvs.push(t * 3, s * 4);
    }
  }
  const row = segT + 1;
  for (let j = 0; j < segS; j++)
    for (let i = 0; i < segT; i++) {
      const p0 = j * row + i;
      idx.push(p0, p0 + 1, p0 + row, p0 + 1, p0 + row + 1, p0 + row);
    }
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();

  const spine: THREE.Vector3[] = [];
  const edgeA: THREE.Vector3[] = [];
  const edgeB: THREE.Vector3[] = [];
  for (let j = 0; j <= 24; j++) {
    spine.push(point(0.5, j / 24));
    edgeA.push(point(0, j / 24));
    edgeB.push(point(1, j / 24));
  }
  return { geom: g, spine, edges: [edgeA, edgeB], tip };
}

export function tube(points: THREE.Vector3[], radius: number, seg = 48) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, seg, radius, 6, false);
}

/** Lattice ribs drawn over the shell along constant-u and constant-v lines. */
export function shellRibs(count = 9) {
  const geoms: THREE.BufferGeometry[] = [];
  for (let k = 1; k < count; k++) {
    const c = -1 + (2 * k) / count;
    const lineU: THREE.Vector3[] = [];
    const lineV: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = -1 + (2 * i) / 40;
      lineU.push(toWorld(c, t, shellH(c, t) + 0.06));
      lineV.push(toWorld(t, c, shellH(t, c) + 0.06));
    }
    geoms.push(tube(lineU, 0.07, 40), tube(lineV, 0.07, 40));
  }
  return geoms;
}

export const pavilionFootprint = { x0: P.cx - a, x1: P.cx + a, z0: P.cz - b, z1: P.cz + b };

// Procedural geometry for the brick volumes, generated from data/building.ts.
// Each storey is built separately so floors can be isolated, cut or exploded.
import { JAALI_MODULE } from './textures';
import { box, type Part } from './geom';
import { links, loggias, podium, recesses, LEVEL_HEIGHT, type Block, type Recess } from '../data/building';

const T = 0.4; // screen wall thickness
const SLAB = 0.35;
export const CUT_HEIGHT = 1.3; // plan-cut height when a storey is isolated

type Face = 'n' | 's' | 'e' | 'w';

interface FaceInfo {
  // the face line and the direction along it
  axis: 'x' | 'z';
  line: number;
  a: number;
  b: number;
  inward: number; // +1/-1 direction pointing into the block along the normal axis
}

function faceInfo(b: Block, f: Face): FaceInfo {
  switch (f) {
    case 's':
      return { axis: 'x', line: b.z1, a: b.x0, b: b.x1, inward: -1 };
    case 'n':
      return { axis: 'x', line: b.z0, a: b.x0, b: b.x1, inward: 1 };
    case 'e':
      return { axis: 'z', line: b.x1, a: b.z0, b: b.z1, inward: -1 };
    case 'w':
      return { axis: 'z', line: b.x0, a: b.z0, b: b.z1, inward: 1 };
  }
}

/** A wall slab lying on a face: `from..to` along the face, `off` inward offset, thickness T inward. */
function faceBox(fi: FaceInfo, from: number, to: number, off: number, y0: number, y1: number, thick = T) {
  const n0 = fi.line + fi.inward * off;
  const n1 = n0 + fi.inward * thick;
  const [lo, hi] = n0 < n1 ? [n0, n1] : [n1, n0];
  return fi.axis === 'x'
    ? box(from, to, y0, y1, lo, hi, JAALI_MODULE)
    : box(lo, hi, y0, y1, from, to, JAALI_MODULE);
}

const isInWestOrEastAt = (f: Face) => f === 'w' || f === 'e';

/** Recess on an adjacent face that reaches the given corner on the same storey. */
function cornerRecessDepth(b: Block, level: number, face: Face, atStart: boolean): number {
  const fi = faceInfo(b, face);
  const corner = atStart ? fi.a : fi.b;
  // adjacent faces touching this end of the face
  const adj: Face[] = fi.axis === 'x' ? [corner === b.x0 ? 'w' : 'e'] : [corner === b.z0 ? 'n' : 's'];
  let depth = 0;
  for (const r of recesses) {
    if (r.block !== b.id || r.level !== level || !adj.includes(r.face)) continue;
    const afi = faceInfo(b, r.face);
    const touches = Math.abs(r.from - afi.a) < 0.01 || Math.abs(r.to - afi.b) < 0.01;
    const lineEnd = fi.line;
    if (touches && (Math.abs(r.from - lineEnd) < 0.01 || Math.abs(r.to - lineEnd) < 0.01)) depth = Math.max(depth, r.depth);
  }
  return depth;
}

export function blockLevelParts(b: Block, level: number, cut: boolean): Part[] {
  const parts: Part[] = [];
  const y0 = level * LEVEL_HEIGHT;
  const full = y0 + LEVEL_HEIGHT;
  const y1 = cut ? y0 + CUT_HEIGHT : full;
  const tag = b.elementId;

  // Floor slab (visible when a storey is isolated or cut in section)
  parts.push({ geom: box(b.x0 + T, b.x1 - T, y0 - 0.02, y0 + 0.18, b.z0 + T, b.z1 - T, 3), mat: 'concrete', tag });

  for (const face of ['n', 's', 'e', 'w'] as Face[]) {
    const fi = faceInfo(b, face);
    const recs = recesses.filter((r) => r.block === b.id && r.level === level && r.face === face);
    const logs = loggias.filter((l) => l.block === b.id && l.level === level && l.face === face);

    // openings along the face line: recesses and loggias
    const openings: { from: number; to: number; kind: 'recess' | 'loggia'; rec?: Recess; width?: number }[] = [
      ...recs.map((r) => ({ from: r.from, to: r.to, kind: 'recess' as const, rec: r })),
      ...logs.map((l) => ({ from: l.at - l.width / 2, to: l.at + l.width / 2, kind: 'loggia' as const, width: l.width })),
    ].sort((p, q) => p.from - q.from);

    // corners: walls on x-faces run full length, z-faces sit between them
    let a = fi.a;
    let bEnd = fi.b;
    if (isInWestOrEastAt(face)) {
      a += T;
      bEnd -= T;
    }

    let cursor = a;
    const solid = (from: number, to: number) => {
      if (to - from > 0.01) parts.push({ geom: faceBox(fi, from, to, 0, y0, y1), mat: 'jaali', tag });
    };

    for (const o of openings) {
      const from = Math.max(o.from, a);
      const to = Math.min(o.to, bEnd);
      solid(cursor, from);
      cursor = Math.max(cursor, to);
      if (o.kind === 'recess' && o.rec) {
        const r = o.rec;
        const tagR = r.kind === 'arcade' ? 'arcade' : 'galleries';
        // adjust the set-back wall where an adjacent face is also recessed at the corner
        let sFrom = from;
        let sTo = to;
        const startDepth = Math.abs(from - fi.a) < 0.5 ? cornerRecessDepth(b, level, face, true) : 0;
        const endDepth = Math.abs(to - fi.b) < 0.5 ? cornerRecessDepth(b, level, face, false) : 0;
        if (startDepth) sFrom = fi.a + startDepth;
        if (endDepth) sTo = fi.b - endDepth;
        // set-back wall: dark shopfront for arcades, brick for galleries
        parts.push({ geom: faceBox(fi, sFrom, sTo, r.depth, y0, y1, 0.3), mat: r.kind === 'arcade' ? 'shop' : 'jaali', tag: tagR });
        // returns at the open ends of the recess
        if (!startDepth && from > fi.a + 0.5) parts.push({ geom: returnBox(fi, from, r.depth, y0, y1), mat: 'jaali', tag });
        if (!endDepth && to < fi.b - 0.5) parts.push({ geom: returnBox(fi, to - T, r.depth, y0, y1), mat: 'jaali', tag });
        // exposed slab edge above (floor of the storey above) — the grey band in the render
        if (!cut) parts.push({ geom: faceBox(fi, from, to, 0, full - SLAB, full, r.depth), mat: 'concrete', tag: tagR });
        // exposed floor slab edge and railing for upper-storey galleries
        if (level > 0) {
          parts.push({ geom: faceBox(fi, from, to, -0.15, y0 - SLAB, y0 + 0.05, r.depth + 0.15), mat: 'concrete', tag: tagR });
          parts.push({ geom: faceBox(fi, from, to, 0.05, y0 + 0.05, y0 + 1.05, 0.06), mat: 'rail', tag: tagR });
        }
        // arcade piers along the face line
        if (r.kind === 'arcade') {
          const n = Math.max(1, Math.round((to - from) / 5));
          for (let i = 0; i <= n; i++) {
            const p = from + ((to - from) * i) / n;
            if ((i === 0 && startDepth === 0 && from > fi.a + 0.5) || (i === n && endDepth === 0 && to < fi.b - 0.5)) continue;
            const c0 = Math.min(Math.max(p - 0.25, from), to - 0.5);
            parts.push({ geom: faceBox(fi, c0, c0 + 0.5, 0, y0, y1, 0.5), mat: 'jaali', tag });
          }
        }
      } else if (o.kind === 'loggia') {
        const head = y0 + 3.0;
        const depth = 2.2;
        // wall above the opening
        if (!cut && head < y1) parts.push({ geom: faceBox(fi, from, to, 0, head, y1), mat: 'jaali', tag });
        // deep reveal: dark back wall, brick sides, floor
        parts.push({ geom: faceBox(fi, from, to, depth, y0, Math.min(head, y1), 0.2), mat: 'dark', tag: 'loggias' });
        parts.push({ geom: returnBox(fi, from, depth, y0, Math.min(head, y1)), mat: 'jaali', tag: 'loggias' });
        parts.push({ geom: returnBox(fi, to - T, depth, y0, Math.min(head, y1)), mat: 'jaali', tag: 'loggias' });
        parts.push({ geom: faceBox(fi, from, to, 0, y0, y0 + 0.12, depth), mat: 'concrete', tag: 'loggias' });
        if (!cut) parts.push({ geom: faceBox(fi, from, to, 0, head - 0.05, head + 0.05, depth), mat: 'dark', tag: 'loggias' });
      }
    }
    solid(cursor, bEnd);
  }
  return parts;
}

function returnBox(fi: FaceInfo, at: number, depth: number, y0: number, y1: number) {
  // A short wall perpendicular to the face, from the face line inward by `depth`.
  const n0 = fi.line;
  const n1 = fi.line + fi.inward * depth;
  const [lo, hi] = n0 < n1 ? [n0, n1] : [n1, n0];
  return fi.axis === 'x'
    ? box(at, at + T, y0, y1, lo, hi, JAALI_MODULE)
    : box(lo, hi, y0, y1, at, at + T, JAALI_MODULE);
}

export function roofParts(b: Block): Part[] {
  const y = b.storeys * LEVEL_HEIGHT;
  const p = 0.85;
  return [
    { geom: box(b.x0, b.x1, y - 0.3, y + 0.05, b.z0, b.z1, 4), mat: 'roof', tag: 'roofs' },
    // parapet ring with a lighter coping, as seen around every roof
    { geom: box(b.x0, b.x1, y, y + p, b.z1 - T, b.z1, JAALI_MODULE), mat: 'jaali', tag: b.elementId },
    { geom: box(b.x0, b.x1, y, y + p, b.z0, b.z0 + T, JAALI_MODULE), mat: 'jaali', tag: b.elementId },
    { geom: box(b.x0, b.x0 + T, y, y + p, b.z0 + T, b.z1 - T, JAALI_MODULE), mat: 'jaali', tag: b.elementId },
    { geom: box(b.x1 - T, b.x1, y, y + p, b.z0 + T, b.z1 - T, JAALI_MODULE), mat: 'jaali', tag: b.elementId },
    { geom: box(b.x0 - 0.05, b.x1 + 0.05, y + p, y + p + 0.1, b.z1 - T - 0.05, b.z1 + 0.05), mat: 'cap', tag: 'roofs' },
    { geom: box(b.x0 - 0.05, b.x1 + 0.05, y + p, y + p + 0.1, b.z0 - 0.05, b.z0 + T + 0.05), mat: 'cap', tag: 'roofs' },
    { geom: box(b.x0 - 0.05, b.x0 + T + 0.05, y + p, y + p + 0.1, b.z0, b.z1), mat: 'cap', tag: 'roofs' },
    { geom: box(b.x1 - T - 0.05, b.x1 + 0.05, y + p, y + p + 0.1, b.z0, b.z1), mat: 'cap', tag: 'roofs' },
  ];
}

/** Recessed links between blocks: dark set-back infill with slab edges at each floor. */
export function linkLevelParts(level: number, cut: boolean): Part[] {
  const parts: Part[] = [];
  const y0 = level * LEVEL_HEIGHT;
  const y1 = cut ? y0 + CUT_HEIGHT : y0 + LEVEL_HEIGHT;
  for (const l of links) {
    const alongX = l.x1 - l.x0 > l.z1 - l.z0;
    if (alongX) {
      const zc = (l.z0 + l.z1) / 2;
      parts.push({ geom: box(l.x0, l.x1, y0, y1, zc - 0.6, zc + 0.6), mat: 'dark', tag: 'galleries' });
    } else {
      const xc = (l.x0 + l.x1) / 2;
      parts.push({ geom: box(xc - 0.6, xc + 0.6, y0, y1, l.z0, l.z1), mat: 'dark', tag: 'galleries' });
    }
    if (level > 0) {
      parts.push({ geom: box(l.x0, l.x1, y0 - SLAB, y0 + 0.05, l.z0, l.z1, 3), mat: 'concrete', tag: 'galleries' });
      if (!cut) {
        if (alongX) {
          parts.push({ geom: box(l.x0, l.x1, y0 + 0.05, y0 + 1.05, l.z1 - 0.06, l.z1), mat: 'rail', tag: 'galleries' });
          parts.push({ geom: box(l.x0, l.x1, y0 + 0.05, y0 + 1.05, l.z0, l.z0 + 0.06), mat: 'rail', tag: 'galleries' });
        } else {
          parts.push({ geom: box(l.x0, l.x0 + 0.06, y0 + 0.05, y0 + 1.05, l.z0, l.z1), mat: 'rail', tag: 'galleries' });
          parts.push({ geom: box(l.x1 - 0.06, l.x1, y0 + 0.05, y0 + 1.05, l.z0, l.z1), mat: 'rail', tag: 'galleries' });
        }
      }
    }
    if (level === 2 && !cut) {
      // roof slab over the link, set slightly below the parapets
      parts.push({ geom: box(l.x0, l.x1, y0 + LEVEL_HEIGHT - SLAB, y0 + LEVEL_HEIGHT, l.z0, l.z1, 3), mat: 'concrete', tag: 'galleries' });
    }
  }
  return parts;
}

export function podiumParts(cut: boolean): Part[] {
  const parts: Part[] = [];
  const h = podium.height;
  const top = cut ? CUT_HEIGHT : h + podium.parapet;
  const tag = podium.elementId;
  const { x0, x1, z0, z1 } = podium;
  const J = JAALI_MODULE;
  // Street-facing walls rise above the deck as a parapet. The rear edge is
  // shared with the left block, so only the part beside the rear block is built.
  parts.push({ geom: box(x0, x0 + T, 0, top, z0, z1, J), mat: 'jaali', tag });
  parts.push({ geom: box(x1 - T, x1, 0, top, z0, z1, J), mat: 'jaali', tag });
  parts.push({ geom: box(x0, x1, 0, top, z1 - T, z1, J), mat: 'jaali', tag });
  const leftBlockEdge = -18;
  parts.push({ geom: box(leftBlockEdge, x1 - T, 0, top, z0, z0 + T, J), mat: 'jaali', tag });
  if (!cut) parts.push({ geom: box(x0 + T, x1 - T, h - 0.35, h, z0, z1 - T, 4), mat: 'roof', tag });
  parts.push({ geom: box(x0, x1, -0.02, 0.15, z0, z1, 3), mat: 'concrete', tag });
  return parts;
}

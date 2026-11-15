// Procedural textures drawn on canvas at startup. Nothing heavy is downloaded:
// the brick screen, paving and lattice are generated in a few milliseconds and
// tiled in world units (see worldUV.ts), so they stay crisp at any scale.
import * as THREE from 'three';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!] as const;
}

function toTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return `#${c.getHexString()}`;
}

/** Size in metres that one texture tile covers. */
export const JAALI_MODULE = 1.2;

export interface JaaliSet {
  map: THREE.Texture;
  bump: THREE.Texture;
  emissive: THREE.Texture;
}

// Perforated brick screen: a square grid of openings framed by brick, each
// opening split by a thin brick cross — read from the render's facade texture.
function makeJaali(): JaaliSet {
  const S = 256;
  const [c, g] = canvas(S);
  const [b, gb] = canvas(S);
  const [e, ge] = canvas(S);
  const r = rng(7);
  const px = S / JAALI_MODULE;
  const frame = 0.2 * px;
  const cross = 0.07 * px;

  // Brick body with coursing
  g.fillStyle = '#B06D4B';
  g.fillRect(0, 0, S, S);
  const course = 0.075 * px;
  for (let y = 0; y < S; y += course) {
    const row = Math.round(y / course);
    const off = row % 2 ? 0.12 * px : 0;
    for (let x = -off; x < S; x += 0.24 * px) {
      g.fillStyle = shade('#B06D4B', (r() - 0.5) * 0.08);
      g.fillRect(x + 1, y + 1, 0.24 * px - 2, course - 2);
    }
    g.fillStyle = 'rgba(232, 205, 180, 0.35)';
    g.fillRect(0, y, S, 1);
  }
  gb.fillStyle = '#ffffff';
  gb.fillRect(0, 0, S, S);
  ge.fillStyle = '#000000';
  ge.fillRect(0, 0, S, S);

  const inner = S - frame;
  const hole = (inner - cross) / 2;
  const o = frame / 2;
  for (const [hx, hy] of [
    [o, o],
    [o + hole + cross, o],
    [o, o + hole + cross],
    [o + hole + cross, o + hole + cross],
  ]) {
    const grad = g.createLinearGradient(0, hy, 0, hy + hole);
    grad.addColorStop(0, '#2B1C15');
    grad.addColorStop(0.35, '#4A3024');
    grad.addColorStop(1, '#6B4431');
    g.fillStyle = grad;
    g.fillRect(hx, hy, hole, hole);
    // lit reveal on the lower edge of each opening
    g.fillStyle = 'rgba(210, 150, 110, 0.55)';
    g.fillRect(hx, hy + hole - 3, hole, 3);
    gb.fillStyle = '#202020';
    gb.fillRect(hx, hy, hole, hole);
    ge.fillStyle = '#ffffff';
    ge.fillRect(hx + 2, hy + 2, hole - 4, hole - 4);
  }
  return { map: toTexture(c), bump: toTexture(b, false), emissive: toTexture(e) };
}

function makeRoofPaving() {
  const S = 512;
  const [c, g] = canvas(S);
  const r = rng(11);
  const tiles = 4; // 4 m per tile => 1 m pavers
  const t = S / tiles;
  for (let i = 0; i < tiles; i++)
    for (let j = 0; j < tiles; j++) {
      g.fillStyle = shade('#D3BE9B', (r() - 0.5) * 0.05);
      g.fillRect(i * t, j * t, t, t);
    }
  g.strokeStyle = 'rgba(120, 95, 70, 0.45)';
  g.lineWidth = 3;
  for (let i = 0; i <= tiles; i++) {
    g.beginPath();
    g.moveTo(i * t, 0);
    g.lineTo(i * t, S);
    g.moveTo(0, i * t);
    g.lineTo(S, i * t);
    g.stroke();
  }
  speckle(g, S, r, 2500, 'rgba(90,70,50,0.07)');
  return toTexture(c);
}

function makePavers() {
  const S = 512;
  const [c, g] = canvas(S);
  const r = rng(23);
  g.fillStyle = '#8E4E3A';
  g.fillRect(0, 0, S, S);
  // 2 m tile, 0.2 x 0.1 m bricks in a stretcher bond
  const px = S / 2;
  const bw = 0.2 * px;
  const bh = 0.1 * px;
  for (let y = 0; y < S; y += bh) {
    const off = Math.round(y / bh) % 2 ? bw / 2 : 0;
    for (let x = -off; x < S; x += bw) {
      g.fillStyle = shade('#A85C44', (r() - 0.5) * 0.1);
      g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
    }
  }
  return toTexture(c);
}

function makeAsphalt() {
  const S = 256;
  const [c, g] = canvas(S);
  const r = rng(5);
  g.fillStyle = '#6E6E6A';
  g.fillRect(0, 0, S, S);
  speckle(g, S, r, 4000, 'rgba(40,40,38,0.18)');
  speckle(g, S, r, 2000, 'rgba(200,200,195,0.12)');
  return toTexture(c);
}

function makeLawn() {
  const S = 256;
  const [c, g] = canvas(S);
  const r = rng(9);
  g.fillStyle = '#6E8A4E';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(${60 + r() * 40}, ${100 + r() * 40}, ${40 + r() * 20}, 0.25)`;
    g.beginPath();
    g.arc(r() * S, r() * S, 8 + r() * 26, 0, Math.PI * 2);
    g.fill();
  }
  speckle(g, S, r, 3000, 'rgba(40,60,25,0.2)');
  return toTexture(c);
}

function makeConcrete() {
  const S = 256;
  const [c, g] = canvas(S);
  const r = rng(31);
  g.fillStyle = '#B4AEA3';
  g.fillRect(0, 0, S, S);
  speckle(g, S, r, 3000, 'rgba(80,75,68,0.12)');
  return toTexture(c);
}

function makeDeck() {
  const S = 256;
  const [c, g] = canvas(S);
  const r = rng(41);
  const plank = S / 8;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = shade('#B89068', (r() - 0.5) * 0.08);
    g.fillRect(0, i * plank, S, plank - 2);
    g.fillStyle = 'rgba(60,40,25,0.5)';
    g.fillRect(0, i * plank + plank - 2, S, 2);
  }
  return toTexture(c);
}

// Diagonal lattice of slender members — used as an alpha cut-out on the
// canopy arches and as a pattern on the membrane.
function makeLattice(alpha: boolean) {
  const S = 512;
  const [c, g] = canvas(S);
  g.fillStyle = alpha ? '#000000' : '#E6D7B8';
  g.fillRect(0, 0, S, S);
  const n = 8;
  const step = S / n;
  g.strokeStyle = alpha ? '#ffffff' : 'rgba(150, 115, 72, 0.55)';
  g.lineWidth = alpha ? 9 : 4;
  for (let i = -n; i <= 2 * n; i++) {
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo(i * step + S, S);
    g.moveTo(i * step, 0);
    g.lineTo(i * step - S, S);
    g.stroke();
  }
  if (alpha) {
    g.lineWidth = 6;
    for (let i = 0; i <= n; i++) {
      g.beginPath();
      g.moveTo(i * step, 0);
      g.lineTo(i * step, S);
      g.stroke();
    }
  }
  return toTexture(c, !alpha);
}

function speckle(g: CanvasRenderingContext2D, S: number, r: () => number, n: number, color: string) {
  g.fillStyle = color;
  for (let i = 0; i < n; i++) g.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r() * 1.5);
}

let cache: ReturnType<typeof build> | null = null;
function build() {
  return {
    jaali: makeJaali(),
    roof: makeRoofPaving(),
    pavers: makePavers(),
    asphalt: makeAsphalt(),
    lawn: makeLawn(),
    concrete: makeConcrete(),
    deck: makeDeck(),
    latticeAlpha: makeLattice(true),
    membrane: makeLattice(false),
  };
}

export function textures() {
  if (!cache) cache = build();
  return cache;
}

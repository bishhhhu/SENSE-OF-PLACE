// Single source of truth for the reconstruction. The 3D model, the site plan,
// the floor navigator and the information panels are all generated from this
// file, so editing a dimension here updates every view.
//
// Coordinate system (metres): +X = right and +Z = towards the front street,
// as seen from the render's viewpoint (+Y up). The render gives no compass
// orientation, so the model uses the render's own left/right/front/rear.
// All dimensions are estimates scaled from a single aerial render. They are a
// conceptual reconstruction, not survey or construction data.

import type { Evidence } from './project';

export const LEVEL_HEIGHT = 4.2;

export type LevelId = 'L0' | 'L1' | 'L2' | 'RF';

export interface Level {
  id: LevelId;
  index: number;
  name: string;
  short: string;
  elevation: number;
  evidence: Evidence;
  summary: string;
}

// The render shows three storeys of brick screen plus flat roofs. The number of
// storeys is inferred from facade proportions and the people standing in the
// recessed openings; it is configurable here.
export const levels: Level[] = [
  {
    id: 'L0',
    index: 0,
    name: 'Ground level',
    short: 'G',
    elevation: 0,
    evidence: 'verified',
    summary:
      'Street level. An open shopfront with stalls and goods is visible at the corner of the plaza block; the podium below the pavilion is enclosed by brick screen.',
  },
  {
    id: 'L1',
    index: 1,
    name: 'Level 1 — pavilion deck',
    short: '1',
    elevation: LEVEL_HEIGHT,
    evidence: 'inferred',
    summary:
      'The canopy stands on the podium roof at roughly first-floor height. Concrete slab bands and people are visible in the recesses between the blocks at this level.',
  },
  {
    id: 'L2',
    index: 2,
    name: 'Level 2 — loggias',
    short: '2',
    elevation: LEVEL_HEIGHT * 2,
    evidence: 'inferred',
    summary:
      'Upper storey. Deep recessed openings (loggias) with people looking out are cut into the brick screen of the left and rear blocks.',
  },
  {
    id: 'RF',
    index: 3,
    name: 'Roof',
    short: 'R',
    elevation: LEVEL_HEIGHT * 3,
    evidence: 'verified',
    summary: 'Flat roofs finished in pale paving with a low raised edge on every block.',
  },
];

export interface Block {
  id: string;
  elementId: string;
  name: string;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  storeys: number;
}

// Read from the render: the long left block runs along the left-hand street;
// the podium continues that street line forward to the corner and carries the
// canopy; the rear block sits behind the canopy; the plaza block and the
// rear-right wing form the right-hand side.
export const blocks: Block[] = [
  { id: 'A', elementId: 'block-left', name: 'Left block', x0: -38, x1: -18, z0: -30, z1: 5, storeys: 3 },
  { id: 'B', elementId: 'block-rear', name: 'Rear block', x0: -14, x1: 8, z0: -30, z1: 2, storeys: 3 },
  { id: 'C', elementId: 'block-plaza', name: 'Plaza block', x0: 12, x1: 36, z0: -8, z1: 26, storeys: 3 },
  { id: 'D', elementId: 'block-rearright', name: 'Rear-right wing', x0: 14, x1: 42, z0: -38, z1: -12, storeys: 3 },
];

// Recesses in the brick screen on specific storeys. `face` is the side of the
// block, `depth` how far the screen steps back, `from`/`to` the extent along
// that face. Used for the open ground-floor shops and the slab-band galleries.
export interface Recess {
  block: string;
  level: number;
  face: 'n' | 's' | 'e' | 'w';
  from: number;
  to: number;
  depth: number;
  kind: 'arcade' | 'gallery';
}

export const recesses: Recess[] = [
  // Plaza block — open ground-floor shopfront at the corner facing the canopy (visible)
  { block: 'C', level: 0, face: 's', from: 12, to: 25, depth: 4, kind: 'arcade' },
  { block: 'C', level: 0, face: 'w', from: 8, to: 26, depth: 3.5, kind: 'arcade' },
  // Rear block — recessed gallery behind the canopy with an exposed slab edge (visible)
  { block: 'B', level: 1, face: 's', from: -14, to: 8, depth: 2.6, kind: 'gallery' },
  // Plaza block — slab band facing the canopy at level 1 (visible)
  { block: 'C', level: 1, face: 'w', from: -8, to: 12, depth: 2.4, kind: 'gallery' },
];

// Deep openings with people visible in the render.
export interface Loggia {
  block: string;
  level: number;
  face: 'n' | 's' | 'e' | 'w';
  at: number; // position along the face (x for n/s faces, z for e/w faces)
  width: number;
}

export const loggias: Loggia[] = [
  { block: 'A', level: 2, face: 's', at: -33, width: 3.4 },
  { block: 'A', level: 2, face: 's', at: -23.5, width: 3.4 },
  { block: 'A', level: 1, face: 's', at: -23.5, width: 3.4 },
  { block: 'B', level: 2, face: 's', at: 0, width: 3 },
  { block: 'B', level: 2, face: 's', at: 5, width: 2.6 },
];

// Recessed links between blocks: dark set-back walls with exposed concrete slab
// edges at each upper level (the grey bands seen between volumes in the render).
export interface Link {
  id: string;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export const links: Link[] = [
  { id: 'AB', x0: -18, x1: -14, z0: -26, z1: 2 },
  { id: 'BC', x0: 8, x1: 12, z0: -8, z1: 1 },
  { id: 'CD', x0: 14, x1: 36, z0: -12, z1: -8 },
];

// Podium: one-storey brick-screen base that carries the canopy deck, continuing
// the left block's street line forward to the corner. Outline clockwise from above.
export const podium = {
  elementId: 'podium',
  height: LEVEL_HEIGHT,
  parapet: 1.1,
  x0: -38,
  x1: -1,
  z0: 5,
  z1: 31,
  outline: [
    [-38, 5],
    [-1, 5],
    [-1, 31],
    [-38, 31],
  ] as [number, number][],
};

// Gridshell canopy. Centre and plan size on the podium deck.
export const pavilion = {
  elementId: 'canopy',
  cx: -18.5,
  cz: 18,
  width: 28, // along X
  depth: 22, // along Z
  baseY: LEVEL_HEIGHT,
  archRise: 8.2, // apex of the arched openings above the deck
  domeRise: 10.6, // apex of the shell above the deck
  hornRise: 10.6, // height of the upturned corner tips above the deck
  hornReach: 4, // horizontal projection of the corner tips beyond the footprint
};

export const site = {
  // Plot edge (inside the sidewalks)
  x0: -46,
  x1: 50,
  z0: -46,
  z1: 37,
  sidewalk: 4,
  roadWidth: 14,
};

// Brick-paved plaza and promenade along the plaza block and the front street (visible).
export const plaza = [
  { x0: -1, x1: 50, z0: 31, z1: 37 },
  { x0: -1, x1: 12, z0: 26, z1: 31 },
  { x0: 12, x1: 50, z0: 26, z1: 31 },
  { x0: 36, x1: 50, z0: -40, z1: 26 },
  { x0: -1, x1: 12, z0: 1, z1: 26 },
];

// Trees seen around the plot edge and in the plaza planters (positions approximate).
export const trees: [number, number, number][] = [
  // x, z, scale
  [-58, 42, 1.3], [-60, 22, 1.2], [-62, -4, 1.4], [-60, -30, 1.3], [-58, -58, 1.2],
  [-34, -62, 1.3], [-10, -64, 1.1], [16, -62, 1.2], [44, -62, 1.4], [66, -46, 1.2],
  [66, -18, 1.1], [66, 10, 1.3], [64, 40, 1.4], [38, 56, 1.2], [8, 58, 1.3], [-24, 58, 1.4],
  [44, 31, 0.8], [46, 12, 0.75], [46, -8, 0.8], [46, -28, 0.75], [24, 32, 0.7],
  [-43, 30, 0.6], [-43, 6, 0.6], [-43, -22, 0.65],
];

// People visible for scale (deck, plaza, shop, loggias). [x, y, z]
export const people: [number, number, number][] = [
  [-21, LEVEL_HEIGHT, 15], [-16, LEVEL_HEIGHT, 20], [-12, LEVEL_HEIGHT, 13], [-24, LEVEL_HEIGHT, 21],
  [-14, LEVEL_HEIGHT, 24], [-19, LEVEL_HEIGHT, 25], [-26, LEVEL_HEIGHT, 13], [-9, LEVEL_HEIGHT, 17],
  [-20, LEVEL_HEIGHT, 11], [-11, LEVEL_HEIGHT, 22],
  [24, 0, 31], [27, 0, 33], [16, 0, 23], [18, 0, 18], [7, 0, 14], [6, 0, 20], [38, 0, 34], [30, 0, 30],
  [-33, LEVEL_HEIGHT * 2, 4.1], [-23.5, LEVEL_HEIGHT * 2, 4.2], [-23, LEVEL_HEIGHT, 4.4],
  [0, LEVEL_HEIGHT * 2, 1.2], [-6, LEVEL_HEIGHT, 0.6], [4, LEVEL_HEIGHT, 0.4],
];

export const cars: [number, number, number][] = [
  // x, z, rotationY
  [-55, 24, 0], [-58, -26, Math.PI], [-20, 45, Math.PI / 2], [30, 45, -Math.PI / 2],
  [58, -8, Math.PI], [5, -52, Math.PI / 2], [-34, -52, -Math.PI / 2],
];

export const streetLamps: [number, number][] = [
  [-48, 36], [-48, 10], [-48, -16], [-48, -42], [-22, 39], [0, 39], [24, 39], [52, 39],
  [52, 10], [52, -20], [-20, -48], [20, -48],
];

export const levelOf = (id: LevelId) => levels.find((l) => l.id === id)!;

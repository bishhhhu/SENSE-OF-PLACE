import type { LevelId } from './building';

export type ViewId = 'perspective' | 'front' | 'side' | 'aerial' | 'iso' | 'section';

export interface ViewPreset {
  id: ViewId;
  label: string;
  note: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

// Elevations use a long lens from far away so they read close to orthographic
// while keeping the same orbit controls.
export const viewPresets: ViewPreset[] = [
  {
    id: 'perspective',
    label: 'Exterior perspective',
    note: 'Matches the viewpoint of the reference render — aerial, from the street corner.',
    position: [-80, 64, 100],
    target: [-2, 4, -2],
    fov: 32,
  },
  {
    id: 'front',
    label: 'Front elevation',
    note: 'Elevation from the front street, long-lens near-orthographic.',
    position: [2, 8, 240],
    target: [2, 8, 0],
    fov: 22,
  },
  {
    id: 'side',
    label: 'Side elevation',
    note: 'Elevation from the left-hand street with the planted edge.',
    position: [-240, 8, -4],
    target: [0, 8, -4],
    fov: 22,
  },
  {
    id: 'aerial',
    label: 'Aerial view',
    note: 'Near plan view from above — roofs, deck and plaza.',
    position: [0, 190, 8],
    target: [0, 0, -2],
    fov: 36,
  },
  {
    id: 'iso',
    label: 'Isometric',
    note: 'Axonometric-style view from the front-left corner at 45°.',
    position: [-150, 140, 150],
    target: [0, 4, -6],
    fov: 20,
  },
  {
    id: 'section',
    label: 'Section',
    note: 'Schematic cut through the canopy and rear block. Interiors beyond the cut are not documented in the reference.',
    position: [-52, 18, 80],
    target: [-12, 7, 0],
    fov: 30,
  },
];

// The section plane keeps everything behind (rear of) this Z value.
export const SECTION_Z = 18;

export interface TourStop {
  id: string;
  title: string;
  text: string;
  elementId?: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const tourStops: TourStop[] = [
  {
    id: 'arrival',
    title: 'Arrival at the corner',
    text: 'From the street corner the building reads as a set of brick boxes around a single soft, curved canopy — the one exception to its orthogonal geometry.',
    elementId: 'podium',
    position: [-46, 8, 70],
    target: [-18, 7, 16],
  },
  {
    id: 'screen',
    title: 'The brick screen',
    text: 'The volumes are wrapped in a perforated brick jaali. It shades and ventilates, and reads as one continuous texture with no floor lines.',
    elementId: 'jaali-screen',
    position: [-62, 6, -10],
    target: [-38, 7, -14],
  },
  {
    id: 'canopy',
    title: 'The canopy',
    text: 'Four arches spring from the deck and the corners of the shell sweep up into pointed tips, roughly as high as the blocks behind.',
    elementId: 'canopy',
    position: [-44, 15, 52],
    target: [-18, 9, 18],
  },
  {
    id: 'beneath',
    title: 'Beneath the shell',
    text: 'On the deck the lattice filters the light. This interior view is reconstructed — the render only shows people gathered here from outside.',
    elementId: 'deck',
    position: [-18, 6.2, 26],
    target: [-18, 11, 12],
  },
  {
    id: 'shops',
    title: 'The open shopfront',
    text: 'At the corner of the plaza block the brick screen lifts away at ground level to reveal stalls and goods facing the plaza.',
    elementId: 'arcade',
    position: [4, 4, 42],
    target: [18, 2, 20],
  },
  {
    id: 'galleries',
    title: 'Galleries and loggias',
    text: 'Behind the canopy the screen steps back to expose slab edges. People appear in these recesses and in deep openings in the brick.',
    elementId: 'galleries',
    position: [14, 16, 30],
    target: [-3, 7, 0],
  },
  {
    id: 'plaza',
    title: 'Plaza and street edge',
    text: 'A red-brick forecourt with planters runs along the right-hand side; lawn and shrubs soften the left-hand and front streets.',
    elementId: 'plaza',
    position: [68, 18, 62],
    target: [34, 0, 18],
  },
  {
    id: 'roofs',
    title: 'Roofscape',
    text: 'From above, four flat paved roofs frame the canopy. The composition is calm so the curved shell remains the focus.',
    elementId: 'roofs',
    position: [-20, 115, 80],
    target: [0, 8, -10],
  },
];

export interface PanoPoint {
  id: string;
  name: string;
  level: LevelId;
  position: [number, number, number];
  lookAt: [number, number, number];
  note: string;
}

export const EYE = 1.65;

export const panoPoints: PanoPoint[] = [
  { id: 'corner', name: 'Street corner', level: 'L0', position: [-48, EYE, 40], lookAt: [-18, 8, 16], note: 'Pavement at the front-left street corner.' },
  { id: 'west-street', name: 'Side street', level: 'L0', position: [-48.5, EYE, -10], lookAt: [-38, 6, -4], note: 'Along the planted left-hand edge.' },
  { id: 'plaza', name: 'Brick plaza', level: 'L0', position: [30, EYE, 33], lookAt: [20, 3, 20], note: 'Forecourt in front of the plaza block.' },
  { id: 'shops', name: 'Shopfront', level: 'L0', position: [14, EYE, 24], lookAt: [20, 1.5, 22.5], note: 'Inside the open ground floor of the plaza block.' },
  { id: 'passage', name: 'Entrance passage', level: 'L0', position: [7, EYE, 14], lookAt: [7, 2, 0], note: 'Between the podium and the plaza block.' },
  { id: 'deck', name: 'Under the canopy', level: 'L1', position: [-18, 4.2 + EYE, 19], lookAt: [-18, 12, 10], note: 'On the deck beneath the shell.' },
  { id: 'terrace', name: 'Podium terrace', level: 'L1', position: [-35, 4.2 + EYE, 27], lookAt: [-18, 10, 16], note: 'Podium deck at the street corner, beside the canopy.' },
  { id: 'loggia', name: 'Left block loggia', level: 'L2', position: [-23.5, 8.4 + EYE, 4.3], lookAt: [-14, 9, 18], note: 'Standing in an upper-level opening.' },
  { id: 'gallery', name: 'Rear gallery', level: 'L1', position: [-3, 4.2 + EYE, 0.6], lookAt: [-18, 9, 18], note: 'Recessed gallery behind the canopy.' },
  { id: 'roof', name: 'Rear block roof', level: 'RF', position: [-3, 12.6 + EYE, 0], lookAt: [-18, 10, 18], note: 'Roof edge overlooking the canopy.' },
];

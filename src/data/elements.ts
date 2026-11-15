// Architectural elements that can be selected in the 3D model and the site plan.
// Every statement is tied to what the reference render shows. Where something
// is reasoned rather than seen, the evidence field says so.

import type { Evidence } from './project';
import type { LevelId } from './building';

export type Category = 'Envelope' | 'Canopy' | 'Massing' | 'Circulation' | 'Public space' | 'Landscape';

export interface ArchElement {
  id: string;
  name: string;
  category: Category;
  evidence: Evidence;
  levels: LevelId[];
  description: string;
  purpose: string;
  observations: string[];
  assumptions?: string[];
  focus: { position: [number, number, number]; target: [number, number, number] };
}

export const elements: ArchElement[] = [
  {
    id: 'canopy',
    name: 'Gridshell canopy',
    category: 'Canopy',
    evidence: 'verified',
    levels: ['L1'],
    description:
      'A free-form shell raised on the podium deck. A pale, fabric-like skin is stretched over a dense lattice of slender members; its four corners sweep upward into pointed tips and each side opens as a tall lattice-filled arch.',
    purpose:
      'Acts as the civic centrepiece and a shaded gathering space. Its curved, light form contrasts with the heavy orthogonal brick blocks around it and marks the entrance from the street corner.',
    observations: [
      'Four upturned, pointed corners rise to roughly the height of the surrounding blocks.',
      'Each side is a tall arch infilled with a fine diagonal lattice.',
      'People stand beneath it on a raised deck, so the space is publicly accessible.',
    ],
    assumptions: [
      'Members are read as timber or bamboo and the skin as a tensioned membrane — the render does not label materials.',
      'Exact curvature is approximated with a parametric surface.',
    ],
    focus: { position: [-46, 20, 56], target: [-18, 9, 18] },
  },
  {
    id: 'canopy-lattice',
    name: 'Lattice arches',
    category: 'Canopy',
    evidence: 'verified',
    levels: ['L1'],
    description: 'The arched openings on each side of the canopy are filled with a fine diagonal lattice of slender members.',
    purpose: 'Filters light and views while keeping the pavilion open to air movement and visible from the street.',
    observations: ['Lattice is see-through: people inside are visible through it.', 'Arches spring from the four corners of the deck.'],
    assumptions: ['Member spacing is approximated.'],
    focus: { position: [-18, 9, 50], target: [-18, 8, 22] },
  },
  {
    id: 'jaali-screen',
    name: 'Brick jaali screen',
    category: 'Envelope',
    evidence: 'verified',
    levels: ['L0', 'L1', 'L2'],
    description:
      'Every block is wrapped in a perforated terracotta brick screen laid in a regular grid of square openings, giving the volumes a uniform, woven texture.',
    purpose:
      'A traditional climate device: it shades the interior, lets air pass through, provides privacy and glows from within after dark.',
    observations: ['The pattern is continuous across storeys, with no visible floor lines.', 'The same screen wraps the podium and the upper blocks.'],
    assumptions: ['Brick module and perforation size are estimated from the render.'],
    focus: { position: [-62, 10, -6], target: [-38, 7, -12] },
  },
  {
    id: 'block-left',
    name: 'Left block',
    category: 'Massing',
    evidence: 'verified',
    levels: ['L0', 'L1', 'L2', 'RF'],
    description: 'The largest volume, running along the left-hand street. Deep recessed openings are cut into its brick face near the canopy.',
    purpose: 'Defines the left-hand street edge and frames the canopy on one side.',
    observations: ['Roughly three storeys of brick screen with a flat roof.', 'Openings with people looking out at the upper levels.'],
    assumptions: ['Internal use is not shown in the render.'],
    focus: { position: [-80, 32, 30], target: [-28, 6, -12] },
  },
  {
    id: 'block-rear',
    name: 'Rear block',
    category: 'Massing',
    evidence: 'verified',
    levels: ['L0', 'L1', 'L2', 'RF'],
    description: 'A volume set back behind the canopy. Its first floor steps back to form a gallery with an exposed slab edge.',
    purpose: 'Forms the backdrop of the canopy and overlooks it from galleries and loggias.',
    observations: ['A grey slab band and people are visible in the recess behind the canopy.', 'Two recessed openings at the upper level.'],
    assumptions: ['Interior layout is not shown.'],
    focus: { position: [12, 24, 30], target: [-3, 7, -12] },
  },
  {
    id: 'block-plaza',
    name: 'Plaza block',
    category: 'Massing',
    evidence: 'verified',
    levels: ['L0', 'L1', 'L2', 'RF'],
    description: 'The volume on the plaza side. Its ground floor opens at the corner into a shopfront with stalls and goods on display.',
    purpose: 'Activates the street and the brick plaza with retail at ground level.',
    observations: ['Colourful goods and stalls are visible in the open ground floor.', 'A slab band is visible on the side facing the canopy.'],
    assumptions: ['The extent of the shopfront along the facade is estimated.'],
    focus: { position: [58, 16, 58], target: [24, 5, 10] },
  },
  {
    id: 'block-rearright',
    name: 'Rear-right wing',
    category: 'Massing',
    evidence: 'verified',
    levels: ['L0', 'L1', 'L2', 'RF'],
    description: 'A rear volume behind the plaza block, reading together with it as an L-shaped mass from above.',
    purpose: 'Completes the cluster of volumes on the right-hand side of the plot.',
    observations: ['Flat roof with a raised edge.', 'Separated from the plaza block by a recessed link.'],
    assumptions: ['Its full depth is partly hidden in the render and is estimated.'],
    focus: { position: [76, 42, -56], target: [28, 6, -26] },
  },
  {
    id: 'podium',
    name: 'Podium base',
    category: 'Massing',
    evidence: 'verified',
    levels: ['L0'],
    description: 'A one-storey brick-screen base along the street corner. Its roof forms the raised deck on which the canopy stands.',
    purpose: 'Lifts the pavilion above the street and gives the corner a continuous brick edge.',
    observations: ['Lower than the blocks behind it.', 'Same perforated brick as the upper volumes.'],
    assumptions: ['How the deck is reached (stairs, ramps) is not visible and is not modelled as fact.'],
    focus: { position: [-56, 9, 60], target: [-18, 3, 20] },
  },
  {
    id: 'deck',
    name: 'Pavilion deck',
    category: 'Public space',
    evidence: 'verified',
    levels: ['L1'],
    description: 'The raised platform under the canopy where people gather.',
    purpose: 'An elevated public room overlooking the street corner.',
    observations: ['Many people are shown standing beneath the canopy.'],
    focus: { position: [-18, 12, 38], target: [-18, 5, 17] },
  },
  {
    id: 'arcade',
    name: 'Ground-floor shopfront',
    category: 'Public space',
    evidence: 'verified',
    levels: ['L0'],
    description: 'An open, recessed ground floor at the corner of the plaza block, with stalls and colourful goods on display.',
    purpose: 'Market frontage: puts trading directly onto the plaza and the entrance passage.',
    observations: ['Goods in red, blue and yellow are visible.', 'People walk in front of it on the brick paving.'],
    assumptions: ['The type of goods and number of stalls are not knowable from the render.'],
    focus: { position: [6, 6, 42], target: [18, 2, 20] },
  },
  {
    id: 'galleries',
    name: 'Slab-band galleries',
    category: 'Circulation',
    evidence: 'verified',
    levels: ['L1', 'L2'],
    description: 'Recessed strips between and behind the blocks where the brick screen steps back and grey concrete slab edges are exposed.',
    purpose: 'Likely open circulation and terraces that connect the volumes and overlook the canopy.',
    observations: ['Grey horizontal bands are visible between the volumes.', 'People and parasols are visible on one of them.'],
    assumptions: ['Their exact role as corridors is inferred, not shown.'],
    focus: { position: [22, 18, 26], target: [0, 6, -2] },
  },
  {
    id: 'loggias',
    name: 'Loggias',
    category: 'Circulation',
    evidence: 'verified',
    levels: ['L1', 'L2'],
    description: 'Deep rectangular openings cut through the brick screen with people standing in them.',
    purpose: 'Framed outdoor rooms that break the uniform screen and give views over the canopy and street.',
    observations: ['Visible on the left block facing the street and on the rear block facing the canopy.'],
    focus: { position: [-30, 14, 26], target: [-28, 9, 4] },
  },
  {
    id: 'roofs',
    name: 'Flat roof terraces',
    category: 'Massing',
    evidence: 'verified',
    levels: ['RF'],
    description: 'Flat roofs finished in pale square paving, each edged by a low raised parapet.',
    purpose: 'Simple flat roofs that keep the composition calm and let the canopy be the only curved form.',
    observations: ['Paving grid is visible from above.', 'Parapets run around every block.'],
    assumptions: ['Roof access and use are not shown.'],
    focus: { position: [-10, 85, 50], target: [0, 12, -12] },
  },
  {
    id: 'plaza',
    name: 'Brick plaza and promenade',
    category: 'Landscape',
    evidence: 'verified',
    levels: ['L0'],
    description: 'A red brick-paved forecourt and promenade along the right-hand side, with planters and trees.',
    purpose: 'Public approach to the shops and a place to linger at the street edge.',
    observations: ['Paving in a darker red than the building brick.', 'Planted beds with small trees and shrubs.'],
    focus: { position: [66, 16, 60], target: [36, 0, 20] },
  },
  {
    id: 'landscape',
    name: 'Planted street edge',
    category: 'Landscape',
    evidence: 'verified',
    levels: ['L0'],
    description: 'A continuous strip of lawn and shrubs between the building and the pavement on the left-hand and front streets.',
    purpose: 'Softens the brick base and separates the building from traffic.',
    observations: ['Lawn with low shrubs along the podium and the left block.'],
    focus: { position: [-64, 8, 56], target: [-44, 0, 20] },
  },
];

export const elementById = (id: string | null | undefined) => elements.find((e) => e.id === id) ?? null;

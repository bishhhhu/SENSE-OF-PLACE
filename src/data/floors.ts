import type { Evidence } from './project';
import { blocks, loggias, pavilion, podium, recesses, type LevelId } from './building';

export interface Zone {
  id: string;
  level: LevelId;
  name: string;
  evidence: Evidence;
  elementId?: string;
  // Rectangle in plan, metres
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  tone: 'public' | 'trade' | 'circulation' | 'undocumented' | 'roof';
  note: string;
}

const blockInterior = (level: LevelId): Zone[] =>
  blocks.map((b) => ({
    id: `${level}-${b.id}-interior`,
    level,
    name: `${b.name} — interior`,
    evidence: 'unknown' as Evidence,
    elementId: b.elementId,
    x0: b.x0 + 0.4,
    x1: b.x1 - 0.4,
    z0: b.z0 + 0.4,
    z1: b.z1 - 0.4,
    tone: 'undocumented' as const,
    note: 'The render shows only the brick screen here. Internal layout is not documented and is deliberately left blank.',
  }));

const arcade = recesses.filter((r) => r.kind === 'arcade');
const C = blocks.find((b) => b.id === 'C')!;
const B = blocks.find((b) => b.id === 'B')!;

export const zones: Zone[] = [
  // Ground
  ...blockInterior('L0'),
  {
    id: 'L0-podium',
    level: 'L0',
    name: 'Podium — enclosed base',
    evidence: 'unknown',
    elementId: 'podium',
    x0: podium.x0,
    x1: podium.x1,
    z0: podium.z0,
    z1: podium.z1,
    tone: 'undocumented',
    note: 'Enclosed by brick screen on the street sides. Its use is not shown in the render.',
  },
  {
    id: 'L0-shops',
    level: 'L0',
    name: 'Open shopfront',
    evidence: 'verified',
    elementId: 'arcade',
    x0: C.x0,
    x1: arcade[0].to,
    z0: arcade[1].from,
    z1: C.z1,
    tone: 'trade',
    note: 'Stalls and goods are visible at the corner of the plaza block.',
  },
  {
    id: 'L0-passage',
    level: 'L0',
    name: 'Entrance passage',
    evidence: 'inferred',
    elementId: 'plaza',
    x0: podium.x1,
    x1: C.x0,
    z0: B.z1 - 1,
    z1: C.z1,
    tone: 'circulation',
    note: 'Paved gap between the podium and the plaza block, continuous with the plaza.',
  },
  // Level 1
  ...blockInterior('L1'),
  {
    id: 'L1-deck',
    level: 'L1',
    name: 'Pavilion deck',
    evidence: 'verified',
    elementId: 'deck',
    x0: pavilion.cx - pavilion.width / 2,
    x1: pavilion.cx + pavilion.width / 2,
    z0: pavilion.cz - pavilion.depth / 2,
    z1: pavilion.cz + pavilion.depth / 2,
    tone: 'public',
    note: 'People gather beneath the canopy.',
  },
  {
    id: 'L1-terrace',
    level: 'L1',
    name: 'Podium terrace',
    evidence: 'inferred',
    elementId: 'podium',
    x0: podium.x0,
    x1: pavilion.cx - pavilion.width / 2,
    z0: podium.z0,
    z1: podium.z1,
    tone: 'public',
    note: 'Open deck beside the canopy on the podium roof; a parapet edges it in the render.',
  },
  {
    id: 'L1-gallery-north',
    level: 'L1',
    name: 'Rear gallery',
    evidence: 'verified',
    elementId: 'galleries',
    x0: B.x0,
    x1: B.x1,
    z0: B.z1 - 2.6,
    z1: B.z1,
    tone: 'circulation',
    note: 'Recessed slab edge with people, behind the canopy.',
  },
  {
    id: 'L1-gallery-east',
    level: 'L1',
    name: 'Plaza-side gallery',
    evidence: 'verified',
    elementId: 'galleries',
    x0: C.x0,
    x1: C.x0 + 2.4,
    z0: C.z0,
    z1: 12,
    tone: 'circulation',
    note: 'Slab band on the plaza block facing the canopy.',
  },
  // Level 2
  ...blockInterior('L2'),
  ...loggias
    .filter((l) => l.level === 2)
    .map((l, i) => {
      const b = blocks.find((bb) => bb.id === l.block)!;
      return {
        id: `L2-loggia-${i}`,
        level: 'L2' as LevelId,
        name: `Loggia — ${b.name.toLowerCase()}`,
        evidence: 'verified' as Evidence,
        elementId: 'loggias',
        x0: l.at - l.width / 2,
        x1: l.at + l.width / 2,
        z0: b.z1 - 2.2,
        z1: b.z1,
        tone: 'public' as const,
        note: 'Deep opening in the brick screen with people visible.',
      };
    }),
  // Roof
  ...blocks.map((b) => ({
    id: `RF-${b.id}`,
    level: 'RF' as LevelId,
    name: `${b.name} roof`,
    evidence: 'verified' as Evidence,
    elementId: 'roofs',
    x0: b.x0,
    x1: b.x1,
    z0: b.z0,
    z1: b.z1,
    tone: 'roof' as const,
    note: 'Flat paved roof with a raised edge.',
  })),
];

export const zoneTone: Record<Zone['tone'], { fill: string; label: string }> = {
  public: { fill: '#B66A4A', label: 'Public / gathering' },
  trade: { fill: '#C9973F', label: 'Trading (visible)' },
  circulation: { fill: '#858B70', label: 'Circulation' },
  undocumented: { fill: '#B9B3A6', label: 'Not documented' },
  roof: { fill: '#D8C6A6', label: 'Roof' },
};

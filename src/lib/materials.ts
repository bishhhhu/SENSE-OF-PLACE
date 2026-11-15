import * as THREE from 'three';
import { textures } from './textures';

/**
 * Shared materials. `userData.glow` marks materials that light up in evening
 * mode; the environment controller scales their emissive intensity, and any
 * clone made for highlighting is registered here so it follows along.
 */
export const glowing = new Set<THREE.MeshStandardMaterial>();

function std(params: THREE.MeshStandardMaterialParameters, glow = 0) {
  const m = new THREE.MeshStandardMaterial(params);
  if (glow > 0) {
    m.userData.glow = glow;
    m.emissiveIntensity = 0;
    glowing.add(m);
  }
  return m;
}

let cache: ReturnType<typeof build> | null = null;

function build() {
  const t = textures();
  return {
    jaali: std(
      {
        map: t.jaali.map,
        bumpMap: t.jaali.bump,
        bumpScale: 3,
        emissiveMap: t.jaali.emissive,
        emissive: new THREE.Color('#F2A160'),
        roughness: 0.92,
      },
      0.42,
    ),
    roof: std({ map: t.roof, roughness: 0.95 }),
    cap: std({ color: '#C79C7A', roughness: 0.9 }),
    concrete: std({ map: t.concrete, roughness: 0.9 }),
    dark: std({ color: '#3B2C24', roughness: 1, emissive: new THREE.Color('#FFB772') }, 0.55),
    shop: std({ color: '#5A4232', roughness: 1, emissive: new THREE.Color('#FFC27E') }, 0.7),
    deck: std({ map: t.deck, roughness: 0.85 }),
    membrane: std(
      {
        map: t.membrane,
        side: THREE.DoubleSide,
        roughness: 0.8,
        transparent: true,
        opacity: 0.93,
        emissive: new THREE.Color('#FFD39A'),
      },
      0.45,
    ),
    lattice: std({
      color: '#B48555',
      alphaMap: t.latticeAlpha,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.8,
    }),
    timber: std({ color: '#A07447', roughness: 0.75 }),
    pavers: std({ map: t.pavers, roughness: 0.95 }),
    asphalt: std({ map: t.asphalt, roughness: 1 }),
    lawn: std({ map: t.lawn, roughness: 1 }),
    sidewalk: std({ color: '#CFC8BA', roughness: 0.95 }),
    kerb: std({ color: '#B8B1A4', roughness: 0.95 }),
    marking: std({ color: '#F1EEE6', roughness: 0.8 }),
    ground: std({ color: '#7F9460', roughness: 1 }),
    foliage: std({ color: '#55753F', roughness: 0.95, flatShading: true }),
    foliageLight: std({ color: '#6F8F4C', roughness: 0.95, flatShading: true }),
    shrub: std({ color: '#4C6B39', roughness: 1, flatShading: true }),
    trunk: std({ color: '#6A5240', roughness: 1 }),
    pole: std({ color: '#55574F', roughness: 0.6, metalness: 0.4 }),
    lamp: std({ color: '#F4EBD8', emissive: new THREE.Color('#FFD08A') }, 2.2),
    rail: std({ color: '#3A3B36', roughness: 0.5, metalness: 0.5 }),
    person: std({ color: '#ffffff', roughness: 0.9 }),
    car: std({ color: '#ffffff', roughness: 0.4, metalness: 0.3 }),
    glass: std({ color: '#2E3438', roughness: 0.15, metalness: 0.6 }),
    zone: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }),
  };
}

export type Materials = ReturnType<typeof build>;
export type MatKey = keyof Materials;

export function materials(): Materials {
  if (!cache) cache = build();
  return cache;
}

export const stallColours = ['#C8462F', '#E0A83A', '#2F6E9E', '#7A9A3A', '#D27A2C', '#8E3B5B', '#E9D7A8'];

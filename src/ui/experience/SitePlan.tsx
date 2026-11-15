import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Box, Minus, Plus, Maximize2 } from 'lucide-react';
import { blocks, levels, plaza, podium, site, trees, type LevelId } from '../../data/building';
import { zones, zoneTone } from '../../data/floors';
import { archY, pavilionFootprint } from '../../lib/pavilionGeom';
import { pavilion } from '../../data/building';
import { elementById } from '../../data/elements';
import { useApp } from '../../state/store';
import { EvidenceBadge } from '../Evidence';
import { ElementDetail } from './common';

// The plan is drawn in metres straight from data/building.ts (x right, z down
// = towards the front street, as in the render). No compass orientation is
// given in the reference, so no north arrow is drawn.
const VB = { x: -80, y: -70, w: 160, h: 135 };

export function SitePlan({ onOpen3D }: { onOpen3D: () => void }) {
  const [level, setLevel] = useState<LevelId | 'site'>('site');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const selected = useApp((s) => s.selected);
  const select = useApp((s) => s.select);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);

  const view = useMemo(() => {
    const w = VB.w / zoom;
    const h = VB.h / zoom;
    return `${VB.x + (VB.w - w) / 2 - pan.x} ${VB.y + (VB.h - h) / 2 - pan.y} ${w} ${h}`;
  }, [zoom, pan]);

  const unitsPerPx = () => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return 1;
    return Math.max(VB.w / zoom / r.width, VB.h / zoom / r.height);
  };

  const onDown = (e: RPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const onMove = (e: RPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current) setZoom((z) => clampZoom(z * (d / pinch.current)));
      pinch.current = d;
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    const u = unitsPerPx();
    setPan({ x: d.px + dx * u, y: d.py + dy * u });
  };
  const onUp = (e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = 0;
    setTimeout(() => (drag.current = null), 0);
  };
  const clickable = (id: string | undefined, zone?: string) => ({
    onClick: () => {
      if (drag.current?.moved) return;
      if (id) select(id, false);
      setZoneId(zone ?? null);
    },
    className: 'cursor-pointer',
  });

  const lvZones = level === 'site' ? [] : zones.filter((z) => z.level === level);
  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const pa = pavilion.width / 2;
  const pb = pavilion.depth / 2;
  const archPath = (side: 's' | 'n' | 'e' | 'w') => {
    // arches drawn in elevation-folded plan convention (dashed, outward)
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = -1 + (2 * i) / 24;
      const off = archY(t) * 0.18;
      if (side === 's') pts.push(`${pavilion.cx + t * pa},${pavilion.cz + pb + off}`);
      if (side === 'n') pts.push(`${pavilion.cx + t * pa},${pavilion.cz - pb - off}`);
      if (side === 'e') pts.push(`${pavilion.cx + pa + off},${pavilion.cz + t * pb}`);
      if (side === 'w') pts.push(`${pavilion.cx - pa - off},${pavilion.cz + t * pb}`);
    }
    return `M${pts.join(' L')}`;
  };

  const rx0 = site.x0 - site.sidewalk;
  const rx1 = site.x1 + site.sidewalk;
  const rz0 = site.z0 - site.sidewalk;
  const rz1 = site.z1 + site.sidewalk;
  const RW = site.roadWidth;
  const isSel = (id: string) => selected === id;

  return (
    <div className="fixed inset-0 top-[60px] z-10 flex flex-col bg-ivory md:flex-row">
      <div className="relative min-h-0 flex-1">
        <svg
          ref={svg}
          viewBox={view}
          className="h-full w-full touch-none select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={(e) => setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.12 : 1 / 1.12)))}
          role="img"
          aria-label="Interactive site plan"
        >
          <defs>
            <pattern id="jaali" width="1.2" height="1.2" patternUnits="userSpaceOnUse">
              <rect width="1.2" height="1.2" fill="#C98A6A" />
              <rect x="0.15" y="0.15" width="0.9" height="0.9" fill="#B66A4A" />
            </pattern>
            <pattern id="hatch" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="2" stroke="#9E978A" strokeWidth="0.25" />
            </pattern>
            <pattern id="fine" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0H0V10" fill="none" stroke="rgba(38,39,35,0.06)" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect x={-200} y={-200} width={400} height={400} fill="url(#fine)" />
          {/* streets */}
          <g fill="#D8D3C9">
            <rect x={rx0 - RW} y={-200} width={RW} height={400} />
            <rect x={rx1} y={-200} width={RW} height={400} />
            <rect x={-200} y={rz1} width={400} height={RW} />
            <rect x={-200} y={rz0 - RW} width={400} height={RW} />
          </g>
          <g stroke="#F5F1E8" strokeWidth="0.25" strokeDasharray="3.5 3.5">
            <line x1={rx0 - RW / 2} y1={-200} x2={rx0 - RW / 2} y2={200} />
            <line x1={rx1 + RW / 2} y1={-200} x2={rx1 + RW / 2} y2={200} />
            <line x1={-200} y1={rz1 + RW / 2} x2={200} y2={rz1 + RW / 2} />
            <line x1={-200} y1={rz0 - RW / 2} x2={200} y2={rz0 - RW / 2} />
          </g>
          {/* plot, lawn, plaza */}
          <rect x={rx0} y={rz0} width={rx1 - rx0} height={rz1 - rz0} fill="#EDE7DA" stroke="#B9B3A6" strokeWidth="0.2" />
          <rect x={site.x0} y={site.z0} width={site.x1 - site.x0} height={site.z1 - site.z0} fill="#CFD2C2" {...clickable('landscape')} stroke={isSel('landscape') ? '#B66A4A' : 'none'} strokeWidth="0.6" />
          <g {...clickable('plaza')}>
            {plaza.map((p, i) => (
              <rect key={i} x={p.x0} y={p.z0} width={p.x1 - p.x0} height={p.z1 - p.z0} fill="#D7A28A" stroke={isSel('plaza') ? '#B66A4A' : 'none'} strokeWidth="0.6" />
            ))}
          </g>
          {trees.map(([x, z, s], i) => (
            <circle key={i} cx={x} cy={z} r={3.6 * s} fill="#858B70" fillOpacity="0.45" stroke="#5d634b" strokeWidth="0.15" />
          ))}
          {/* podium */}
          <polygon
            points={podium.outline.map(([x, z]) => `${x},${z}`).join(' ')}
            fill={level === 'site' || level === 'L0' ? '#E7CBBB' : '#F1E6DC'}
            stroke={isSel('podium') ? '#B66A4A' : '#94533A'}
            strokeWidth={isSel('podium') ? 0.8 : 0.35}
            {...clickable('podium')}
          />
          {/* blocks */}
          {blocks.map((b) => (
            <g key={b.id} {...clickable(b.elementId)}>
              <rect
                x={b.x0}
                y={b.z0}
                width={b.x1 - b.x0}
                height={b.z1 - b.z0}
                fill={level === 'site' ? 'url(#jaali)' : '#F5F1E8'}
                fillOpacity={level === 'site' ? 0.85 : 1}
                stroke={isSel(b.elementId) ? '#262723' : '#94533A'}
                strokeWidth={isSel(b.elementId) ? 0.9 : 0.4}
              />
              {level === 'site' && (
                <text x={(b.x0 + b.x1) / 2} y={(b.z0 + b.z1) / 2} textAnchor="middle" dominantBaseline="middle" className="fill-ivory font-mono" fontSize="2">
                  {b.name.toUpperCase()}
                </text>
              )}
            </g>
          ))}
          {/* zones for the selected storey */}
          {lvZones.map((z) => (
            <g key={z.id} {...clickable(z.elementId, z.id)}>
              <rect
                x={z.x0 + 0.2}
                y={z.z0 + 0.2}
                width={z.x1 - z.x0 - 0.4}
                height={z.z1 - z.z0 - 0.4}
                fill={z.tone === 'undocumented' ? 'url(#hatch)' : zoneTone[z.tone].fill}
                fillOpacity={z.tone === 'undocumented' ? 1 : 0.55}
                stroke={zoneId === z.id ? '#262723' : 'rgba(38,39,35,0.35)'}
                strokeWidth={zoneId === z.id ? 0.7 : 0.2}
              />
              {z.tone !== 'undocumented' && z.x1 - z.x0 > 6 && (
                <text x={(z.x0 + z.x1) / 2} y={(z.z0 + z.z1) / 2} textAnchor="middle" dominantBaseline="middle" fontSize="1.5" className="fill-charcoal font-mono">
                  {z.name.toUpperCase()}
                </text>
              )}
            </g>
          ))}
          {/* pavilion: deck outline, diagonals (groins), arches folded out, corner tips */}
          {(level === 'site' || level === 'L1') && (
            <g {...clickable('canopy')} fill="none" stroke={isSel('canopy') ? '#262723' : '#94533A'}>
              <rect
                x={pavilionFootprint.x0}
                y={pavilionFootprint.z0}
                width={pavilion.width}
                height={pavilion.depth}
                fill="#F5F1E8"
                fillOpacity={level === 'L1' ? 0.4 : 0.9}
                strokeWidth="0.5"
              />
              <path d={`M${pavilionFootprint.x0},${pavilionFootprint.z0} L${pavilionFootprint.x1},${pavilionFootprint.z1} M${pavilionFootprint.x1},${pavilionFootprint.z0} L${pavilionFootprint.x0},${pavilionFootprint.z1}`} strokeWidth="0.25" strokeDasharray="1 0.6" />
              {(['n', 's', 'e', 'w'] as const).map((s) => (
                <path key={s} d={archPath(s)} strokeWidth="0.3" strokeDasharray="0.8 0.5" />
              ))}
              {[
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1],
              ].map(([sx, sz]) => {
                const bx = pavilion.cx + sx * pa;
                const bz = pavilion.cz + sz * pb;
                const tx = bx + sx * pavilion.hornReach * 0.707;
                const tz = bz + sz * pavilion.hornReach * 0.707;
                return <path key={`${sx}${sz}`} d={`M${bx},${bz} L${tx},${tz}`} strokeWidth="0.5" />;
              })}
              {level === 'site' && (
                <text x={pavilion.cx} y={pavilion.cz} textAnchor="middle" dominantBaseline="middle" fontSize="1.8" className="fill-charcoal font-mono" stroke="none">
                  CANOPY
                </text>
              )}
            </g>
          )}
          {/* scale bar */}
          <g transform={`translate(${rx0 + 2}, ${rz1 + RW + 7})`}>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={i * 5} y={0} width={5} height={1} fill={i % 2 ? '#F5F1E8' : '#262723'} stroke="#262723" strokeWidth="0.1" />
            ))}
            <text x={0} y={3.4} fontSize="1.6" className="fill-charcoal font-mono">0</text>
            <text x={20} y={3.4} fontSize="1.6" textAnchor="middle" className="fill-charcoal font-mono">20 m (approx.)</text>
          </g>
          <text x={rx0 + 2} y={rz0 - RW - 4} fontSize="1.8" className="fill-charcoal-soft font-mono">
            REAR STREET
          </text>
          <text x={rx0 + 2} y={rz1 + RW + 3.5} fontSize="1.8" className="fill-charcoal-soft font-mono">
            FRONT STREET — VIEWPOINT OF THE RENDER
          </text>
        </svg>

        <div className="absolute left-3 top-3 flex flex-wrap gap-1 md:left-4 md:top-4" role="group" aria-label="Plan level">
          {(['site', ...levels.map((l) => l.id)] as const).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLevel(l);
                setZoneId(null);
              }}
              aria-pressed={level === l}
              className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition ${
                level === l ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/20 bg-ivory/90 hover:border-charcoal'
              }`}
            >
              {l === 'site' ? 'Site' : levels.find((x) => x.id === l)!.name.split(' — ')[0]}
            </button>
          ))}
        </div>
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 md:bottom-4 md:right-4">
          <button className="tool" onClick={() => setZoom((z) => clampZoom(z * 1.3))} aria-label="Zoom in">
            <Plus size={16} />
          </button>
          <button className="tool" onClick={() => setZoom((z) => clampZoom(z / 1.3))} aria-label="Zoom out">
            <Minus size={16} />
          </button>
          <button
            className="tool"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            aria-label="Fit plan"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      <aside className="max-h-[42vh] overflow-y-auto border-t border-charcoal/10 bg-ivory p-5 md:max-h-none md:w-[360px] md:border-l md:border-t-0">
        <p className="label">Site plan</p>
        <h2 className="mt-1 font-serif text-3xl">{level === 'site' ? 'Plot & context' : levels.find((l) => l.id === level)!.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Drawn from the same data as the 3D model. Drag to pan, scroll or pinch to zoom, click a volume or zone. The render gives no
          compass bearing, so the plan is oriented as seen in it.
        </p>
        {level !== 'site' && (
          <ul className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {Object.entries(zoneTone).map(([k, v]) => (
              <li key={k} className="flex items-center gap-2">
                <span className="h-3 w-3" style={{ background: k === 'undocumented' ? '#D8D3C9' : v.fill }} />
                {v.label}
              </li>
            ))}
          </ul>
        )}
        <div className="hairline my-5" />
        {zone && (
          <div className="mb-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif text-xl">{zone.name}</h3>
              <EvidenceBadge e={zone.evidence} />
            </div>
            <p className="mt-1 text-sm text-charcoal-soft">{zone.note}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal-soft">
              ≈ {Math.round((zone.x1 - zone.x0) * (zone.z1 - zone.z0))} m² (estimated)
            </p>
          </div>
        )}
        {selected && elementById(selected) ? (
          <>
            <ElementDetail id={selected} compact />
            <button className="btn-primary mt-5 w-full" onClick={onOpen3D}>
              <Box size={16} /> View in 3D
            </button>
          </>
        ) : (
          <p className="text-sm text-charcoal-soft">Nothing selected.</p>
        )}
      </aside>
    </div>
  );
}

function clampZoom(z: number) {
  return Math.min(6, Math.max(0.6, z));
}

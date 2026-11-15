import { evidenceMeta, type Evidence } from '../data/project';

export function EvidenceBadge({ e, className = '' }: { e: Evidence; className?: string }) {
  const m = evidenceMeta[e];
  return (
    <span className={`chip ${m.tone} ${className}`} title={m.description}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {m.label}
    </span>
  );
}

export function EvidenceLegend({ single = false }: { single?: boolean }) {
  return (
    <ul className={`grid gap-3 ${single ? '' : 'sm:grid-cols-2'}`}>
      {(Object.keys(evidenceMeta) as Evidence[]).map((k) => (
        <li key={k} className="flex items-start gap-3">
          <EvidenceBadge e={k} className="shrink-0" />
          <span className="text-sm text-charcoal-soft">{evidenceMeta[k].description}</span>
        </li>
      ))}
    </ul>
  );
}

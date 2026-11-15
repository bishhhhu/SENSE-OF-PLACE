import { useMemo } from 'react';
import { mergeParts, type Part } from '../../lib/geom';
import { materials } from '../../lib/materials';
import { Selectable } from '../interaction/Selectable';

// Element ids that also light up when the brick screen as a whole is selected.
const SCREEN_HOSTS = new Set(['block-left', 'block-rear', 'block-plaza', 'block-rearright', 'podium']);

/** Renders generated parts, merged per (element, material), each element selectable. */
export function Parts({ build, deps }: { build: () => Part[]; deps: unknown[] }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const merged = useMemo(() => mergeParts(build()), deps);
  const mats = materials();
  const byTag = useMemo(() => {
    const m = new Map<string, typeof merged>();
    for (const p of merged) {
      if (!m.has(p.tag)) m.set(p.tag, []);
      m.get(p.tag)!.push(p);
    }
    return [...m.entries()];
  }, [merged]);

  return (
    <>
      {byTag.map(([tag, list]) => (
        <Selectable key={tag} id={tag} also={SCREEN_HOSTS.has(tag) ? ['jaali-screen'] : []}>
          {list.map((p) => (
            <mesh key={p.mat} geometry={p.geom} material={mats[p.mat]} castShadow receiveShadow />
          ))}
        </Selectable>
      ))}
    </>
  );
}

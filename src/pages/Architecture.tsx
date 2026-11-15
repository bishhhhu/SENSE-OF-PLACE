import { ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteHeader } from '../ui/SiteHeader';
import { EvidenceBadge, EvidenceLegend } from '../ui/Evidence';
import { Reveal } from '../ui/Reveal';
import { elements, type Category } from '../data/elements';
import { blocks, levels, pavilion, LEVEL_HEIGHT } from '../data/building';
import { href } from '../lib/router';
import { project } from '../data/project';

const order: Category[] = ['Canopy', 'Envelope', 'Massing', 'Circulation', 'Public space', 'Landscape'];

const dims = [
  { k: 'Storey height (assumed)', v: `${LEVEL_HEIGHT.toFixed(1)} m` },
  { k: 'Storeys (inferred)', v: `${blocks[0].storeys}` },
  { k: 'Canopy plan (estimated)', v: `${pavilion.width} × ${pavilion.depth} m` },
  { k: 'Canopy arch rise (estimated)', v: `${pavilion.archRise} m` },
  { k: 'Canopy tip height (estimated)', v: `${(pavilion.baseY + pavilion.hornRise).toFixed(1)} m above street` },
  { k: 'Volumes', v: `${blocks.length} blocks + podium` },
];

export default function Architecture() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative border-b border-charcoal/10">
        <div className="gridlines pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-8 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <p className="label">Architectural analysis</p>
            <h1 className="mt-6 font-serif text-[clamp(2.8rem,6vw,5.6rem)] leading-[0.95]">
              Elements of the <em className="text-terracotta">building</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-charcoal-soft">
              Each element of the reconstruction is listed with what is visible in the render, what it most likely does, and which
              parts of the model are assumptions. Open any of them directly in 3D.
            </p>
          </div>
          <div className="lg:col-span-5">
            <figure className="border border-charcoal/15 bg-white p-2">
              <img src={project.referenceImage} alt="Reference render of the building" className="w-full" loading="lazy" />
            </figure>
            <p className="label mt-3">Fig. 01 — Primary reference</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <p className="label mb-4">Evidence key</p>
            <EvidenceLegend single />
            <div className="hairline my-8" />
            <p className="label mb-4">Working dimensions</p>
            <dl className="divide-y divide-charcoal/10 border-y border-charcoal/10 text-sm">
              {dims.map((d) => (
                <div key={d.k} className="flex justify-between gap-3 py-2">
                  <dt className="text-charcoal-soft">{d.k}</dt>
                  <dd className="text-right font-mono text-xs">{d.v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-charcoal-soft">Scaled by eye from people, cars and lane widths in the render. Not survey data.</p>
            <div className="hairline my-8" />
            <p className="label mb-4">Storeys</p>
            <ul className="space-y-4">
              {[...levels].reverse().map((l) => (
                <li key={l.id}>
                  <div className="flex items-center justify-between gap-2">
                    <a className="font-serif text-lg hover:text-terracotta" href={href('/experience', { mode: 'floors', level: l.id })}>
                      {l.name}
                    </a>
                    <EvidenceBadge e={l.evidence} />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal-soft">{l.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="lg:col-span-9">
          {order.map((cat) => {
            const list = elements.filter((e) => e.category === cat);
            if (!list.length) return null;
            return (
              <div key={cat} className="mb-16">
                <div className="mb-6 flex items-baseline justify-between border-b border-charcoal pb-3">
                  <h2 className="font-serif text-3xl">{cat}</h2>
                  <span className="label">{list.length} element{list.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid gap-px bg-charcoal/10 md:grid-cols-2">
                  {list.map((e, i) => (
                    <Reveal key={e.id} delay={i * 0.04} className="bg-ivory">
                      <article id={e.id} className="flex h-full flex-col p-6">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-serif text-2xl leading-tight">{e.name}</h3>
                          <EvidenceBadge e={e.evidence} className="shrink-0" />
                        </div>
                        <p className="mt-3 text-sm leading-relaxed">{e.description}</p>
                        <p className="label mt-5">Architectural purpose</p>
                        <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">{e.purpose}</p>
                        <p className="label mt-5">Seen in the render</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-charcoal-soft marker:text-olive">
                          {e.observations.map((o) => (
                            <li key={o}>{o}</li>
                          ))}
                        </ul>
                        {e.assumptions && (
                          <>
                            <p className="label mt-5">Modelling assumptions</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-charcoal-soft marker:text-terracotta">
                              {e.assumptions.map((o) => (
                                <li key={o}>{o}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        <a
                          href={href('/experience', { mode: 'explore', el: e.id })}
                          className="mt-auto inline-flex items-center gap-1 pt-6 text-sm text-terracotta hover:text-terracotta-dark"
                        >
                          View in 3D <ArrowUpRight size={14} />
                        </a>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

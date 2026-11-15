import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Box, Compass, Glasses, Layers, Map, Orbit, Route, ScanEye } from 'lucide-react';
import { useState } from 'react';
import { SiteFooter, SiteHeader } from '../ui/SiteHeader';
import { EvidenceBadge, EvidenceLegend } from '../ui/Evidence';
import { Reveal } from '../ui/Reveal';
import { project } from '../data/project';
import { href } from '../lib/router';
import type { Evidence } from '../data/project';

// Annotation positions are percentages of the cropped hero image.
const annotations = [
  { n: '01', x: 47.6, y: 50.5, label: 'Gridshell canopy', side: 'right', el: 'canopy' },
  { n: '02', x: 14, y: 57, label: 'Brick jaali screen', side: 'right', el: 'jaali-screen' },
  { n: '03', x: 68.5, y: 64, label: 'Open shopfront', side: 'left', el: 'arcade' },
  { n: '04', x: 49, y: 20, label: 'Flat paved roofs', side: 'right', el: 'roofs' },
  { n: '05', x: 37.5, y: 39.5, label: 'Loggias', side: 'right', el: 'loggias' },
  { n: '06', x: 86, y: 61, label: 'Brick plaza', side: 'left', el: 'plaza' },
] as const;

const reading: { n: string; title: string; text: string; evidence: Evidence }[] = [
  {
    n: 'I',
    title: 'Massing',
    text: 'Four flat-roofed rectangular volumes of similar height, arranged around a lower podium at the street corner. Recessed links with exposed slab edges separate them.',
    evidence: 'verified',
  },
  {
    n: 'II',
    title: 'Envelope',
    text: 'One material does almost all the work: a perforated terracotta brick screen, laid as a continuous grid with no expressed floor lines.',
    evidence: 'verified',
  },
  {
    n: 'III',
    title: 'Canopy',
    text: 'A curved gridshell with four upturned corners and lattice-filled arches stands on the podium deck — the only non-orthogonal form on the site.',
    evidence: 'verified',
  },
  {
    n: 'IV',
    title: 'Storeys',
    text: 'About three storeys, read from the screen height and the people standing in its deep openings. Interior layouts are not shown and are not invented here.',
    evidence: 'inferred',
  },
];

const modes = [
  { icon: Orbit, title: 'Interactive model', text: 'Orbit, pan and zoom; switch between six architectural views.', mode: 'model' },
  { icon: ScanEye, title: 'Explore elements', text: 'Select the canopy, screen, loggias or plaza to read what each one is and does.', mode: 'explore' },
  { icon: Layers, title: 'Floors', text: 'Isolate a storey, read its plan cut, or separate all storeys to compare them.', mode: 'floors' },
  { icon: Map, title: 'Site plan', text: 'A measured-style plan drawn from the same data, with selectable zones.', mode: 'plan' },
  { icon: Route, title: 'Guided walkthrough', text: 'Eight viewpoints with commentary; pause, resume or step through.', mode: 'tour' },
  { icon: Compass, title: '360° viewpoints', text: 'Stand at eye level at ten points and look around; hotspots lead onward.', mode: 'pano' },
  { icon: Glasses, title: 'VR & AR', text: 'WebXR headset walk-through and tabletop placement where your device supports it.', mode: 'xr' },
];

export default function Landing() {
  const [hot, setHot] = useState<string | null>(null);
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="gridlines pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-4 pb-16 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-16">
          <div className="lg:col-span-5 lg:pt-8">
            <motion.p className="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
              {project.kicker} · Conceptual reconstruction
            </motion.p>
            <motion.h1
              className="mt-6 font-serif text-[clamp(3.4rem,8vw,7.6rem)] font-normal leading-[0.88] tracking-[-0.02em]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              The <em className="text-terracotta">Jaali</em>
              <br />
              Pavilion
            </motion.h1>
            <motion.p
              className="mt-8 max-w-[34rem] text-lg leading-relaxed text-charcoal-soft"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.25 }}
            >
              {project.subtitle}
            </motion.p>
            <motion.div
              className="mt-10 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <a href={href('/experience', { mode: 'explore' })} className="btn-accent">
                Explore Building <ArrowRight size={16} />
              </a>
              <a href={href('/experience', { mode: 'model' })} className="btn-outline">
                <Box size={16} /> Interactive 3D
              </a>
              <a href={href('/architecture')} className="btn group px-2 text-charcoal hover:text-terracotta">
                View Architecture <ArrowUpRight size={16} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </motion.div>
            <p className="mt-10 max-w-sm border-l border-terracotta pl-4 text-xs leading-relaxed text-charcoal-soft">{project.titleNote}</p>
          </div>

          <motion.figure
            className="lg:col-span-7"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative border border-charcoal/15 bg-white p-2 shadow-[0_30px_80px_-40px_rgba(38,39,35,0.45)] sm:p-3">
              <div className="relative overflow-hidden">
                <img
                  src={project.referenceImage}
                  alt="Aerial render of the building: brick-screen blocks around a curved gridshell canopy at a street corner"
                  className="block h-auto w-full"
                  width={1070}
                  height={597}
                />
                {annotations.map((a, i) => (
                  <motion.a
                    key={a.n}
                    href={href('/experience', { mode: 'explore', el: a.el })}
                    className="group absolute"
                    style={{ left: `${a.x}%`, top: `${a.y}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + i * 0.12 }}
                    onMouseEnter={() => setHot(a.n)}
                    onMouseLeave={() => setHot(null)}
                    aria-label={`${a.label} — open in the 3D model`}
                  >
                    <span className="absolute -left-2.5 -top-2.5 grid h-5 w-5 place-items-center rounded-full border border-ivory bg-terracotta font-mono text-[9px] text-ivory shadow ring-4 ring-ivory/30 transition group-hover:scale-110">
                      {Number(a.n)}
                    </span>
                    <span
                      className={`pointer-events-none absolute top-[-9px] hidden whitespace-nowrap bg-ivory/95 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal shadow-sm transition sm:block ${
                        a.side === 'right' ? 'left-4' : 'right-4'
                      } ${hot === a.n ? 'opacity-100' : 'opacity-0 lg:opacity-90'}`}
                    >
                      {a.label}
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>
            <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="label">Fig. 01 — Primary reference render</span>
              <span className="text-xs text-charcoal-soft">Numbered points open the matching element in 3D.</span>
            </figcaption>
            <ol className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 sm:hidden">
              {annotations.map((a) => (
                <li key={a.n} className="text-xs text-charcoal-soft">
                  <span className="font-mono text-terracotta">{Number(a.n)}</span> {a.label}
                </li>
              ))}
            </ol>
          </motion.figure>
        </div>
      </section>

      {/* OVERVIEW */}
      <section id="overview" className="border-t border-charcoal/10">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
          <Reveal className="lg:col-span-2">
            <p className="label">§ 01 — Overview</p>
          </Reveal>
          <Reveal className="lg:col-span-6" delay={0.05}>
            <p className="font-serif text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.18]">
              Heavy brick boxes and one weightless roof. The building pairs a uniform, perforated masonry skin with a single
              sculptural canopy raised above the street corner — a <em>shaded public room</em> framed by the market around it.
            </p>
            <p className="mt-8 max-w-xl leading-relaxed text-charcoal-soft">
              This exhibition rebuilds the project in 3D from one aerial render. Everything you can see in that image is modelled;
              everything it hides — interiors, structure, exact dimensions — is either left blank or clearly marked as an assumption.
              Each fact below carries its source.
            </p>
          </Reveal>
          <Reveal className="lg:col-span-4" delay={0.1}>
            <dl className="divide-y divide-charcoal/10 border-y border-charcoal/10">
              {project.facts.map((f) => (
                <div key={f.label} className="flex items-start justify-between gap-4 py-3">
                  <dt className="label pt-1">{f.label}</dt>
                  <dd className="text-right">
                    <span className="block text-sm">{f.value}</span>
                    <EvidenceBadge e={f.evidence} className="mt-1" />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* READING THE RENDER */}
      <section className="border-t border-charcoal/10 bg-ivory-deep">
        <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-2">
              <p className="label">§ 02 — Reading the render</p>
            </Reveal>
            <Reveal className="lg:col-span-7">
              <h2 className="font-serif text-[clamp(2.2rem,4.5vw,4rem)] leading-[1.02]">What the image tells us — and what it doesn’t.</h2>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-px border border-charcoal/10 bg-charcoal/10 sm:grid-cols-2 lg:grid-cols-4">
            {reading.map((r, i) => (
              <Reveal key={r.n} delay={i * 0.06} className="bg-ivory-deep">
                <article className="flex h-full flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-4xl italic text-terracotta">{r.n}</span>
                    <EvidenceBadge e={r.evidence} />
                  </div>
                  <h3 className="mt-8 font-serif text-2xl">{r.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">{r.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <EvidenceLegend />
            </div>
            <a href={href('/architecture')} className="btn-outline">
              Full architectural analysis <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* EXPERIENCE INDEX */}
      <section className="border-t border-charcoal/10">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
          <Reveal className="lg:col-span-4">
            <p className="label">§ 03 — The exhibition</p>
            <h2 className="mt-6 font-serif text-[clamp(2.2rem,4.5vw,4rem)] leading-[1.02]">Seven ways into the building.</h2>
            <p className="mt-6 max-w-sm leading-relaxed text-charcoal-soft">
              One shared data model drives the 3D reconstruction, the floors, the site plan and every information panel, so they always
              agree.
            </p>
            <a href={href('/experience', { mode: 'model' })} className="btn-primary mt-8">
              Open the 3D model <ArrowUpRight size={16} />
            </a>
          </Reveal>
          <ol className="lg:col-span-8">
            {modes.map((m, i) => (
              <Reveal key={m.mode} delay={i * 0.04}>
                <li>
                  <a
                    href={href('/experience', { mode: m.mode })}
                    className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-charcoal/10 py-5 transition hover:bg-white/50 sm:grid-cols-[4rem_14rem_1fr_auto] sm:px-3"
                  >
                    <span className="font-mono text-xs text-charcoal-soft">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex items-center gap-3 font-serif text-2xl">
                      <m.icon size={18} strokeWidth={1.5} className="hidden text-terracotta sm:block" /> {m.title}
                    </span>
                    <span className="col-span-3 row-start-2 text-sm text-charcoal-soft sm:col-span-1 sm:row-start-auto">{m.text}</span>
                    <ArrowRight size={18} className="col-start-3 row-start-1 text-charcoal-soft transition group-hover:translate-x-1 group-hover:text-terracotta sm:col-start-auto sm:row-start-auto" />
                  </a>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

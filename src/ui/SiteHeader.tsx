import { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { href } from '../lib/router';
import { project } from '../data/project';

const links = [
  { label: 'Overview', to: href('/', { section: 'overview' }) },
  { label: 'Architecture', to: href('/architecture') },
  { label: 'Site plan', to: href('/experience', { mode: 'plan' }) },
  { label: 'Walkthrough', to: href('/experience', { mode: 'tour' }) },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <a href={href('/')} className="flex items-baseline gap-3">
          <span className="font-serif text-2xl font-medium leading-none tracking-tight">{project.title.replace(/^The /, '')}</span>
          <span className="label hidden sm:inline">Digital exhibition</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <a key={l.label} href={l.to} className="text-[13px] text-charcoal-soft transition hover:text-terracotta">
              {l.label}
            </a>
          ))}
          <a href={href('/experience', { mode: 'model' })} className="btn-primary !py-2">
            Enter 3D <ArrowUpRight size={15} />
          </a>
        </nav>
        <button className="tool md:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-charcoal/10 px-4 pb-5 pt-2 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <a key={l.label} href={l.to} onClick={() => setOpen(false)} className="block border-b border-charcoal/10 py-3 font-serif text-xl">
              {l.label}
            </a>
          ))}
          <a href={href('/experience', { mode: 'model' })} className="btn-primary mt-4 w-full">
            Enter 3D <ArrowUpRight size={15} />
          </a>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-charcoal/15">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-serif text-3xl">{project.title}</p>
          <p className="mt-3 max-w-md text-sm text-charcoal-soft">
            A conceptual 3D reconstruction made from one aerial render. Dimensions and interiors are estimates and are marked as such
            throughout. {project.titleNote}
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="label mb-3">Exhibition</p>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-terracotta" href={href('/experience', { mode: 'model' })}>Interactive model</a></li>
            <li><a className="hover:text-terracotta" href={href('/experience', { mode: 'explore' })}>Explore elements</a></li>
            <li><a className="hover:text-terracotta" href={href('/experience', { mode: 'floors' })}>Floors</a></li>
            <li><a className="hover:text-terracotta" href={href('/experience', { mode: 'pano' })}>360° viewpoints</a></li>
            <li><a className="hover:text-terracotta" href={href('/experience', { mode: 'xr' })}>VR &amp; AR</a></li>
            <li><a className="hover:text-terracotta" href="legacy-360/">Earlier 360° photo walkthrough</a></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="label mb-3">Reference</p>
          <p className="text-sm text-charcoal-soft">{project.referenceCaption}</p>
          <a className="mt-2 inline-block text-sm underline decoration-terracotta/50 underline-offset-4 hover:text-terracotta" href={project.referenceImageOriginal} target="_blank" rel="noreferrer">
            Open the original reference image
          </a>
        </div>
      </div>
    </footer>
  );
}

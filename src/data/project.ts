// Project-level copy. The reference image does not name the building, so the
// title below is a working title — change it here and it updates everywhere.

export const project = {
  title: 'The Jaali Pavilion',
  titleNote: 'Working title — the reference render does not name the building.',
  kicker: 'A digital architectural exhibition',
  subtitle:
    'A brick-screen market building gathered around a sculptural timber gridshell canopy — reconstructed in 3D from a single aerial render.',
  referenceImage: 'assets/reference/building-hero.webp',
  referenceImageOriginal: 'assets/reference/building-reference.webp',
  referenceCaption: 'Primary reference: aerial render supplied for this project (cropped from the original; original preserved unaltered).',
  facts: [
    { label: 'Typology', value: 'Market / mixed-use building with public pavilion', evidence: 'inferred' },
    { label: 'Massing', value: 'Four rectangular brick volumes around a raised podium', evidence: 'verified' },
    { label: 'Height', value: 'About three storeys, flat roofs', evidence: 'inferred' },
    { label: 'Envelope', value: 'Perforated terracotta brick screen (jaali)', evidence: 'verified' },
    { label: 'Centrepiece', value: 'Gridshell canopy with four upturned corners', evidence: 'verified' },
    { label: 'Site', value: 'Corner plot bounded by roads, planted edge, brick plaza', evidence: 'verified' },
    { label: 'Location', value: 'Not stated in the reference', evidence: 'unknown' },
    { label: 'Architect / date', value: 'Not stated in the reference', evidence: 'unknown' },
  ],
} as const;

export type Evidence = 'verified' | 'inferred' | 'assumed' | 'unknown';

export const evidenceMeta: Record<Evidence, { label: string; description: string; tone: string }> = {
  verified: {
    label: 'Visible',
    description: 'Directly visible in the reference render.',
    tone: 'bg-olive/15 text-[#5d634b] border-olive/40',
  },
  inferred: {
    label: 'Inferred',
    description: 'Reasoned from visible proportions or context; not directly shown.',
    tone: 'bg-terracotta/10 text-terracotta-dark border-terracotta/40',
  },
  assumed: {
    label: 'Assumed',
    description: 'A conservative modelling assumption where the render shows nothing.',
    tone: 'bg-stone/50 text-charcoal-soft border-stone-dark',
  },
  unknown: {
    label: 'Not stated',
    description: 'The reference gives no information.',
    tone: 'bg-white/60 text-charcoal-soft border-stone',
  },
};

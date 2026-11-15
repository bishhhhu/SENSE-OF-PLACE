# The Jaali Pavilion — interactive architectural exhibition

A digital exhibition and **conceptual 3D reconstruction** of a brick-screen market
building with a timber gridshell canopy, rebuilt from a single aerial render
(`public/assets/reference/building-reference.webp`, preserved unaltered).

> The reference does not name the building, its location, architect or
> orientation. "The Jaali Pavilion" is a working title — change it in
> `src/data/project.ts`. Every element in the app is tagged *Visible*,
> *Inferred*, *Assumed* or *Not stated*.

## Features

| Area | What it does |
| --- | --- |
| Landing / Architecture pages | Editorial introduction, annotated reference render, evidence-tagged facts and element catalogue |
| Interactive model | Orbit / pan / zoom, six views (perspective, front & side elevation, aerial, isometric, section cut), reset, on-screen zoom/rotate buttons |
| Explore | Click or pick any element (canopy, lattice, brick screen, blocks, podium, deck, shopfront, galleries, loggias, roofs, plaza, planting) for description, purpose, observations and assumptions; optional "fade everything else" |
| Floors | Isolate G / 1 / 2 / Roof (storeys above lift away, plan cut with zones), exploded compare view and table |
| Site plan | SVG plan drawn from the same data; pan, zoom, pinch, storey filter, selectable zones, "View in 3D" |
| Walkthrough | 8 stops with commentary; start, previous, next, pause, resume, exit |
| 360° | 10 eye-level viewpoints rendered live from the model (no photo panoramas were supplied); drag to look, zoom, hotspots |
| Day / evening | Interpolated sun, sky, fog, exposure, glowing brick screen, canopy uplight |
| VR | WebXR `immersive-vr` at full scale; left stick moves, right stick snap-turns |
| AR | WebXR `immersive-ar` with hit-test: reticle, tap to place, rotate / scale / re-place; AR Quick Look export on iOS. Buttons only enable when the browser reports support |

## Architecture

```
src/
  data/        building.ts (all dimensions), elements.ts, floors.ts, views.ts, project.ts
  lib/         textures.ts (procedural canvas textures), materials.ts, geom.ts,
               buildingParts.ts (brick volumes), pavilionGeom.ts (canopy surface)
  scene/       SceneRoot.tsx, building/, site/, env/ (lighting), camera/, xr/, interaction/
  ui/          pages' shared components and experience/ panels (plan, tour, XR …)
  pages/       Landing, Architecture, Experience (lazy-loaded with three.js)
  state/       zustand store
```

Everything 3D is generated from `src/data/building.ts`, so the model, plan and
panels always agree. To replace the procedural model with an accurate Blender /
GLTF model, swap the contents of each `<LevelGroup>` in
`src/scene/building/Building.tsx` (or the whole `<Building/>`); floor isolation,
selection (`<Selectable id>`) and XR keep working.

## Earlier 360° walkthrough

The repository's previous single-file 360° viewer (Sense of Place) and its seven
renders are kept unchanged in `public/legacy-360/` and published at
`/legacy-360/`, linked from the site footer. `project_documentation_overview.md`
describes it.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview
```

## Deploy (GitHub Pages)

`vite.config.ts` uses a relative base and the app uses hash routes, so the build
works under any repository name. `.github/workflows/deploy.yml` builds and
publishes on every push to `main`. In the repository settings, set
**Pages → Source → GitHub Actions**.

WebXR (VR/AR) requires HTTPS, which GitHub Pages provides.

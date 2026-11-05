# PURNA MARKET — Sense of Place

An interactive 3D spatial web application and virtual reality architectural walkthrough showcasing the urban revitalization and spatial experience of **Purna Market**.

---

## 🏛️ Project Vision & Experience

The application is structured around a dual-level spatial navigation interface:

1. **Upper 3D Spatial Carousel**:
   - 7 floating architectural design cards arranged along a cylindrical curve.
   - Smooth horizontal swipe, mouse dragging, and arrow-key navigation.
   - Clean typographical hierarchy: Primary zone tags (**ZONE 1** to **ZONE 7**) with design subtitles (*The Walk*, *Live in the Space*, etc.).
   - Direct launch trigger to enter full 360° architectural exploration.

2. **Lower Perspective Neon Ground Map**:
   - Perspective-tilted vector street-grid plane with topographic isolines and arterial pedestrian pathways.
   - 7 vibrant neon drop pins (Electric Cyan, Neon Lime, Hot Pink, Amber, and Electric Blue) mapped to each zone coordinate.
   - **Click-to-Teleport**: Clicking any pin immediately launches the visitor directly into that space's 360° panoramic view.

3. **360° Spherical Panoramic Viewer**:
   - Seamless panoramic dragging/orbiting with inertia and touch-swipe controls.
   - Field of view (FOV) zoom control via scroll wheel or gestures.
   - Live cardinal orientation compass needle rotating in real time.
   - Interactive directional wayfinding hotspots linking adjacent architectural zones.
   - Bottom quick-dock thumbnail bar for rapid jumping between spaces.

---

## 🗺️ Architectural Zones

| Zone | Subtitle | Typology & Focus | Primary Asset File | Neon Pin Color |
| :--- | :--- | :--- | :--- | :--- |
| **ZONE 1** | *The Walk* | Pedestrian Concourse & Civic Boulevard | `pedestrian_5.jpg` | Electric Cyan (`#00f0ff`) |
| **ZONE 2** | *Live in the Space* | Thin-Shell Hypar Produce Market Hall | `building view_3.jpg` | Neon Lime Green (`#25f46a`) |
| **ZONE 3** | *Everyday Life* | Brick Arcade & Textile Promenade | `store.jpg` | Electric Blue (`#0099ff`) |
| **ZONE 4** | *The Path* | Landscape Colonnade & Kalamkari Pergola | `walkway-2.jpg` | Neon Lime Green (`#25f46a`) |
| **ZONE 5** | *The Rest* | Courtyard Oasis & Biophilic Otla Gathering | `seating image.jpg` | Hot Pink (`#ff2a85`) |
| **ZONE 6** | *Between Bricks* | Elevated Jali Gallery & Shaded Linkway | `jaali view one.jpg` | Luminous Amber (`#ffaa00`) |
| **ZONE 7** | *The Feel* | Nocturnal Bazaar & Festoon Boulevard | `market night view.jpg` | Electric Cyan (`#00f0ff`) |

---

## 📁 Repository File Structure

Ensure all files are placed in the same directory:

```text
purna-market-vr/
├── index.html                  # Single-file VR application & interface
├── README.md                   # Project overview & documentation
├── GITHUB_DEPLOYMENT_GUIDE.md  # Step-by-step deployment instructions
├── pedestrian_5.jpg            # Zone 1 visual render
├── building view_3.jpg         # Zone 2 visual render
├── store.jpg                   # Zone 3 visual render
├── walkway-2.jpg               # Zone 4 visual render
├── seating image.jpg           # Zone 5 visual render
├── jaali view one.jpg          # Zone 6 visual render
└── market night view.jpg       # Zone 7 visual render
```

---

## 🚀 Quick Start & Local Testing

1. Download or clone this repository to your computer.
2. Ensure the image files and `index.html` are located in the same folder.
3. Double-click `index.html` to open it in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
4. **Controls**:
   - **Left / Right Arrow Keys**: Rotate the 3D card carousel.
   - **Click Any Map Pin**: Teleport instantly into that space in full-screen 360°.
   - **Click & Drag**: Orbit through the space.
   - **Mouse Scroll**: Zoom in / out.
   - **Link Images Button**: Re-link or load custom render files dynamically from your system.

---

## 🌐 Free Live Deployment (GitHub Pages)

1. Create a public repository on [GitHub](https://github.com/new).
2. Upload `index.html`, `README.md`, and all 7 image files.
3. Open **Settings** &rarr; **Pages**.
4. Under **Branch**, select `main` (root) and click **Save**.
5. Your live URL will be active at:
   ```text
   https://<your-username>.github.io/<your-repo-name>/
   ```
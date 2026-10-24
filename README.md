# Cardiovascular Flow — 3D Anatomy Viewer

A browser-only educational model of the heart, pulmonary circulation, and systemic circulation. The interface uses a restrained radiology-workstation visual language and keeps the procedural surface intentionally small: drag to rotate, scroll or pinch to zoom, and use **Reset view** to return to the initial three-quarter orientation.

> For education and demonstration only. Not for clinical training or medical advice.

The model contains no patient data, backend, account system, API key, external image asset, or runtime network request. Anatomy, labels, valves, vessel paths, coronary surface vessels, and animated flow particles are generated in the browser with Three.js.

## Run locally

Use Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173/`.

Additional commands:

```bash
npm test          # Run the Vitest suite once
npm run build     # Strict TypeScript check and production build
npm run preview   # Preview the production build
npm run format    # Format source, tests, and project files
```

For a lockfile-exact installation, use `npm ci` instead of `npm install`.

## Controls

| Input                  | Result                                            |
| ---------------------- | ------------------------------------------------- |
| Mouse or trackpad drag | Rotate the complete cardiovascular model          |
| Wheel or pinch         | Zoom within controlled limits                     |
| Reset view             | Restore the initial three-quarter camera position |

Panning is disabled so the heart remains centered. The circulation phase shown in the information panel advances automatically; it is an explanatory display rather than a user control.

## Anatomy included

- Right atrium and right ventricle
- Tricuspid and pulmonary valves
- Pulmonary trunk and left/right pulmonary arteries
- Simplified bilateral lungs and pulmonary exchange beds
- Left/right pulmonary veins
- Left atrium and left ventricle
- Mitral and aortic valves
- Aortic root, arch, and descending aorta
- Superior and inferior vena cava
- Systemic arteries, capillary exchange bed, and systemic veins
- Simplified coronary artery branches and a cardiac vein on the heart surface

Chambers use overlapping procedural ellipsoids within a translucent myocardial envelope. Valves contain animated rings and leaflets. Vessels use Catmull–Rom centerlines and generated tube geometry. The model is schematic and intentionally not patient-specific.

## Circulation pathway

```text
Systemic veins
→ superior and inferior vena cava
→ right atrium
→ tricuspid valve
→ right ventricle
→ pulmonary valve
→ pulmonary artery
→ pulmonary capillaries in the lungs
→ pulmonary veins
→ left atrium
→ mitral valve
→ left ventricle
→ aortic valve
→ aorta
→ systemic arteries
→ systemic capillaries
→ systemic veins
```

Muted blue particles represent deoxygenated flow. Muted red particles represent oxygenated flow. Particles interpolate between those states through the pulmonary and systemic exchange segments. Vessel motion, chamber motion, and valve motion are restrained visual cues and do not represent measured pressure, volume, timing, or physiology.

## Architecture

```text
.
├── .github/workflows/
│   ├── ci.yml                    # Test and production-build checks
│   └── deploy.yml                # GitHub Pages build and deployment
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                   # Lifecycle and animation loop
│   ├── style.css                 # Workstation UI and responsive layout
│   ├── config/
│   │   └── cardiovascular.ts     # Anatomy, directed graph, paths, phases
│   ├── model/
│   │   ├── anatomy.ts            # Graph validation and adjacency helpers
│   │   ├── circulation.ts        # Pathway, oxygenation, valve rules
│   │   └── flow.ts               # Particle progress and geometry validation
│   ├── scene/
│   │   ├── heart.ts              # Chambers, myocardium, coronary vessels
│   │   ├── vessels.ts            # Vessels, lungs, exchange beds
│   │   ├── valves.ts             # Valve rings and animated leaflets
│   │   ├── particles.ts          # Instanced directional blood particles
│   │   └── renderer.ts           # Three.js renderer, camera, labels, cleanup
│   └── ui/
│       └── interface.ts          # Accessible semantic interface
└── tests/
    ├── app.test.ts
    ├── circulation.test.ts
    ├── geometry.test.ts
    └── interface.test.ts
```

The model layer has no DOM or renderer dependency. The scene modules translate immutable configuration into procedural Three.js objects. The interface module creates semantic HTML and exposes only the elements needed by the lifecycle. The renderer owns and disposes WebGL resources, observers, controls, labels, and scene objects during hot reload.

## Testing

`npm test` runs 60 tests covering:

- Presence of all 17 requested anatomy structures
- Correct circulation order with both vena cavae entering the right atrium in parallel
- Closed pulmonary and systemic loops
- Named valves at the four chamber transitions
- Oxygenation after pulmonary exchange and deoxygenation after systemic exchange
- One-way valve rules
- Continuous forward particle progress
- Four automatic education phases
- Finite centerline coordinates
- Continuous sampled centerlines
- Exact joins between central, pulmonary, aortic, and systemic flow segments
- Finite generated chamber, vessel, myocardial, and coronary geometry
- Outward-facing vessel normals
- No configured backend endpoints
- Interface initialization without a network request
- Persistent disclaimer, accessible phase status, concise educational text, and a single reset control

The production command runs `tsc --noEmit` before Vite, so strict TypeScript errors stop the build.

## GitHub Pages

The Vite base path is relative (`./`), allowing deployment beneath the repository path. The included `.github/workflows/deploy.yml` workflow runs tests, builds `dist/`, uploads the Pages artifact, and deploys it whenever `main` changes.

For this repository:

1. Upload or commit the updated source files to the `main` branch.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Open **Actions → Deploy Vite site to GitHub Pages** and wait for both jobs to turn green.
5. Visit `https://chrismarimon.github.io/cath-lab/`.

Do not upload `node_modules/` or `dist/`; GitHub Actions installs and builds them.

## Responsive behavior

The desktop layout presents the 3D viewport beside the circulation reference. Below 760 px, the reference moves below the viewer. At approximately 400 px, secondary orientation details and valve labels are suppressed, while the viewport, major labels, reset control, legend, pathway, and disclaimer remain available. Touch rotation and pinch zoom are handled by OrbitControls.

## Educational limitations

This is a visual teaching aid, not a validated anatomy, physiology, radiology, hemodynamics, or clinical-training simulator. Chamber dimensions, vessel positions, wall thicknesses, valve timing, particle speeds, lighting, and blood colors are illustrative. The lungs and systemic tissues are symbolic exchange regions. The model does not simulate gas partial pressures, pressure-volume loops, cardiac output, electrocardiography, disease, patient variation, diagnostic imaging, or treatment decisions. Spatial proportions and labels are simplified for legibility and should not be used to make medical judgments.

## Verification limits

Automated verification covers the data model, generated geometry, interface structure, strict TypeScript compilation, and production bundling. The application includes a readable WebGL fallback. Final appearance, GPU performance, screen-reader behavior, browser-specific WebGL differences, touch gestures, and label placement across every possible camera angle still require interactive testing in the target browsers and devices.

MIT licensed; see [`LICENSE`](LICENSE).

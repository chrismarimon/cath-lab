# Radial / PCI — educational cath lab

A complete browser-only Vite + strict TypeScript + Three.js project. No backend, account, API key, patient data, external image assets, or runtime network requests are required. All anatomy, instruments, ECG and sounds are generated locally.

> For education and demonstration only. Not for clinical training or medical advice.

## Setup

Use Node.js **22.12 or newer** and npm. From this repository root:

```bash
npm install
npm run dev
npm test
npm run build
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). `npm run preview` serves the production build locally. Use `npm ci` for an exact lockfile install; use `npm run format` to format source. The production files in `dist/` can be served by any static HTTP host. Vite uses a relative base path for hosting under a GitHub Pages repository path. The project does not automatically deploy or push to GitHub.

## Case and workflow

68-year-old, 80 kg patient with exertional angina and anterior ischemia; 90% mid-LAD lesion, 14 mm long, approximately 3 mm reference vessel, right radial access.

1. Advance the guide to the aortic root (100% travel).
2. Rotate near +20° and fine advance to selectively engage the left main.
3. Select wire, target LAD, keep the alignment near +20°, and advance beyond 48 mm. Resistance signals misalignment: retract/realign rather than force.
4. Use QCA and administer simulated heparin. Select a 2.5 × 15 mm balloon, place its center at 38 mm, inflate to 10 atm for approximately 12 seconds, then fully deflate.
5. Select a 3.0 × 18 mm stent at the same position, inflate to 12 atm, then fully deflate. Deployment is permanent.
6. Enable exposure, inject selective contrast, allow transit, then repeat in another projection. Two distinct views complete the final stage.

The **Run ideal demonstration** button dispatches the same public `Action` objects and reducer used by manual controls. It uses simulated time, performs all six stages, and produces an Excellent debrief. Pause freezes procedure time and playback. Closing the start screen begins manual mode; closing help returns to the case. Sound starts only after an explicit button/key gesture, as required by browsers.

A target can be changed only with the wire retracted to ≤15 mm. Guide rotation more than 65° away from the engagement orientation causes pop-out. Device position, rotation, sizing and selection lock while inflated. Balloon rupture occurs above the selected device's RBP + 4 atm (the nominal RBP is shown in source: balloon 14, stent 16 atm). Dissection from oversizing and wire forcing reduces modeled flow. D2 can lose flow when a deployed stent covers its modeled origin; D1 remains unaffected in this teaching case. All these thresholds are illustrative rules.

## Controls

| Input      | Action                                  |
| ---------- | --------------------------------------- |
| W / S      | Advance / retract active device         |
| A / D      | Rotate guide / wire                     |
| Shift      | Fine movement                           |
| E / Q      | Increase / decrease pressure by 1 atm   |
| Space      | Toggle fluoroscopy exposure             |
| C          | Inject contrast (requires exposure)     |
| G          | Simulated heparin; raise ACT once       |
| Tab        | Switch anatomy / fluoroscopy            |
| V          | Cycle projection presets                |
| Arrow keys | Adjust projection by 5°                 |
| L          | Toggle anatomy labels                   |
| F          | Follow instrument tip                   |
| M          | Toggle mentor panel                     |
| N          | Toggle Web Audio monitor / alarm sounds |
| H          | Open help and pause                     |
| Escape     | Pause / resume; dismiss help/debrief    |

Keyboard controls do not intercept typing in form inputs. Buttons provide equivalents for core procedural controls on touch screens. Orbit with drag, zoom with wheel/pinch. The device console exposes branch target, diameter and length. QCA and end-case controls are on the checklist panel. JSON export downloads a debrief with the disclaimer.

## Views and monitor

The anatomy viewport includes schematic heart, aorta, radial access, LM, LAD, LCx, RCA, D1 and D2; procedural guide, wire, balloon, deployed stent, contrast and vessel injury. The visible LAD lumen changes with residual stenosis. A low-amplitude heart beat and raycast-occluded labels aid spatial orientation.

Fluoroscopy is a separate grayscale display with procedurally generated ribs, spine and diaphragm, square collimation, pulsed noise, blur and vignette. Its canvas captures at **15 pulses per simulated second** during exposure and retains its last image when exposure stops. Before the first exposure its held frame is empty. This is a stylized projection, not an X-ray attenuation simulation.

Presets: RAO 30° / CRA 30°, AP / CRA 35°, LAO 45° / CRA 30°, LAO 45° / CAU 30°, RAO 30° / CAU 25°, and AP. Synthetic ECG, HR, BP, ST elevation, PVCs and an instability alarm respond to the pure model's occlusion/recovery state. None are diagnostic signals.

## Architecture and repository

```text
.
├── .github/workflows/ci.yml   # GitHub Actions: install, tests, build
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.ts                 # DOM, controls, animation, audio, export
│   ├── style.css               # Clinical responsive interface (400px+)
│   ├── config/anatomy.ts       # Case, branch junctions and projections
│   ├── physics/model.ts        # Pure immutable Action → State reducer
│   ├── procedure/
│   │   ├── demo.ts             # Public-action ideal procedure
│   │   └── debrief.ts          # Scoring and explanations
│   ├── scene/
│   │   ├── anatomy.ts          # Procedural meshes and centerlines
│   │   └── renderer.ts         # Three.js, orbit, labels, held fluoro frame
│   └── state/store.ts          # Small reducer store
└── tests/
    ├── model.test.ts
    ├── geometry.test.ts
    └── interface.test.ts
```

`physics/model.ts` has no DOM, Three.js, audio or timing dependencies. `step(state, action)` clones its input; `tick` explicitly advances bounded simulated time. Flow, TIMI, sizing, coverage and contrast transit are exported pure helpers. The model owns position/pressure locks, injury, recoil, heparin status, physiology and stage completion. The renderer reads model state and does not decide outcomes. Debrief grades derive from recorded state, not a separate demo success flag.

Debrief includes score/grade, residual stenosis, TIMI, stent/reference ratio, lesion coverage, heparin/ACT, pre-dilation, QCA, dissection, wire forcing, rupture, longest inflation, contrast volume, fluoroscopy time, final view count and explanatory feedback.

## Testing and verification

`npm test` runs 63 passing Vitest model, geometric and DOM wiring tests. Cases cover compliance and pressure; lesion coverage and geographic miss; TIMI; delayed contrast and distinct final views; LAD/LCx/D1/D2 steering; guide engagement/pop-out; wire forcing and dissection; sizing/movement/rotation locks; rupture; occlusion/ischemia/recovery; ACT; permanent deployment/recoil; the complete ideal demonstration; and the oversized, short, high-pressure stent failure. Mesh checks verify outward normals and triangle winding and continuous sampled branch curves with shared junction coordinates. Interface tests use jsdom and mock the WebGL viewport to check start, controls, pause, help, view/exposure and debrief/reset wiring.

The ideal case must complete all six stages, reach TIMI 3 and receive **Excellent**. The adverse case deploys a 4.5 × 8 mm stent at 20 atm and must show geographic miss, dissection, reduced flow and **Needs work**.

### Educational limitations

This is an illustrative software simulator, not a validated clinical simulator. Anatomy is schematic, not patient-specific, and source centerline units do not correspond to physical device travel. Coronary branches use simplified centerlines, device shapes and steering. The wire does not solve contact mechanics or true catheter deformation. Lesion coverage is a 1D overlap calculation. Pressure/compliance, recoil, dissection, D2 jailing, flow/TIMI, contrast transit, heparin/ACT and ischemia are deliberately simplified deterministic rules; they are not validated pharmacology, hemodynamics or medical decision models. No radiation dose estimate, clinical dosing recommendation, thrombus, true QCA segmentation, volumetric contrast transport, tissue perfusion or patient variability is modeled. A checklist marks milestones historically achieved; the final grade additionally penalizes injuries and incomplete final assessment.

### Known verification limits

Verified in this environment: 63/63 tests pass, strict compilation and production bundling pass, an isolated source copy installs with `npm install` and builds, and `npm run dev` serves HTTP 200. A pattern scan found no secret keys; Git ignore checks cover dependencies, build output, logs and environment files. A full WebGL browser, visual layout at 400px, actual orbit/touch behavior, GPU performance, audio playback/autoplay policy and downloaded JSON behavior need interactive browser verification. This environment lacked a browser executable and the browser download failed, so these are **not claimed as verified**. jsdom tests mock the renderer and audio is not exercised. The Three.js production bundle may produce a non-fatal chunk-size warning. No real GitHub remote, push, Pages deployment, accessibility audit or clinical validation was performed.

## GitHub handoff

Copy the source files and directories above to a new GitHub repository, or use this initialized local repository. No credentials are needed by the application. Add your own remote and commit/push when ready. `.gitignore` excludes `node_modules/`, `dist/`, coverage, logs, `.env`/`.env.*`, and local configuration files. Do not commit installed dependencies, build output, the delivery archive or local browser artifacts. The lockfile is included. Install dependencies once with an internet connection; the running application itself needs no external service.

MIT licensed; see `LICENSE`.

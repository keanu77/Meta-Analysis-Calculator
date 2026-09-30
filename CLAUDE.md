# Project guidance

Meta-Analysis Calculator is a static browser calculator with Traditional Chinese teaching material. Read README.md for the actual feature and privacy scope.

## Commands

- Node.js 22 or newer; no runtime package dependencies.
- `npm run dev`: build the reviewed runtime allowlist and preview on 127.0.0.1:8080.
- `npm test`: numerical examples, invalid-input regressions and build output boundary checks.
- `npm run build`: copy only reviewed app and hosting entries in `scripts/runtime-files.mjs` to `dist/`.
- `npm start -- --port=4431`: serve the existing `dist/` on loopback.
- `npm run firebase:deploy`: separate authorized deployment, requires user's Firebase CLI/project configuration.

## Runtime

`index.html`, `style.css`, `stats-math.js` (normal/t distribution functions), `calculator-core.js`, `modules/quantile-methods.js`, `modules/module-{a,b,c}.js`, `formula-display.js`. JavaScript is ordered classic scripts, not ES modules. Google Fonts and Font Awesome CSS are external resources; no external JavaScript, backend, login, AI providers or API keys are required.

RoB/GRADE tabs contain static learning material. `rob-assessment.js`, `chart-utils.js` and `pdf-export.js` are legacy source with no active UI; do not publish or load them without a fresh review. The shipped app must not access or mutate old `rob-studies` browser data.

## Constraints

- Preserve clinician-owned statistical methods and assessment decisions. Separate mathematical input/overflow guards from methodological changes.
- Quantile→Mean/SD formulas mirror the R package `meta` (`mean_sd_range`, `mean_sd_iqr`, `mean_sd_iqr_range`); regenerate test references with R when changing them.
- Numeric inputs must be finite; sample/event counts must be safe integers. Never silently truncate them.
- Calculation output must use textContent, not untrusted HTML.
- Do not add credentials or cloud storage to the frontend. Preserve the keyless design.
- Firebase/Zeabur must publish only `dist/`. Never point a static hosting service at repository root.
- Zeabur reads `zbpack.json` (`build_command`, `output_dir`), not the legacy `zeabur.json` fields. Run the configured `npm test && npm run build` release gate. `_headers` controls response headers; `404.html` enables missing-page responses. Verify actual production status codes after release.
- Fixed asset names require cache revalidation; check actual response headers after any authorized deployment.
- Keep local tests, historical audits and production verification distinct. Passing regression tests does not certify all medical/statistical methodology.

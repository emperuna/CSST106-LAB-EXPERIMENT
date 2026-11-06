# CSST106 Lab Experiments

Seven computer vision labs with a Web UI, for CSST106 (Perception and Computer Vision).
The submission is the Web UI with its source on GitHub, plus a printed report. The README covers
setup and the differences from the lab sheets.

## Stack decisions

These are settled, so don't suggest replacing them:

- App-centric monorepo with pnpm and a uv workspace. No Turborepo.
- Frontend: Astro with React islands and TanStack Query. No Next.js.
- Backend: FastAPI as a modular monolith.
- Python 3.12 only. PyTorch's last Intel Mac release (2.2.2) needs it, along with NumPy 1.x.

## Layout

- `apps/web`: Astro site. Lab code is in `src/features/lab-NN-*`, and lab text is in `src/content/labs`.
- `apps/api`: `src/api/modules/labNN_*` has one module per lab, and `src/api/core` holds shared code.
- `packages/cv-labs`: the computer vision code, samples, trained weights and tests.
- `packages/tokens`, `ui`, `api-client`, `config`: shared frontend code.

## Boundaries

- Apps depend on packages, never the reverse.
- Shared code belongs in `packages/`. Keep `apps/web/src/shared` small.
- A feature is imported only through its `index.ts`, and features don't import each other. ESLint
  enforces this.
- API modules use `api.core` and `cv_labs`, and don't import each other.
- `cv-labs` knows nothing about HTTP, and its functions take and return arrays.

## Commands

Run these from the repo root:

- Start the app: `pnpm dev:api` and `pnpm dev:web`, each in its own terminal.
- Python tests: `pnpm test:py`
- Frontend checks: `pnpm typecheck`, `pnpm lint`, `pnpm build`
- After changing `packages/ui` or `packages/api-client`, also run
  `pnpm --filter @csst106/ui exec tsc --noEmit` and the same for `@csst106/api-client`.
  `pnpm typecheck` only starts from `apps/web`.
- After changing an API schema or route: `pnpm gen:api`
- Regenerate lab results: `uv run python scripts/run_all.py`

## Backend rules

- Import PyTorch and Ultralytics inside functions, never at the top of a file. A test guards this
  for Labs 6 and 7, because importing them at startup makes the API slow to start.
- Wrap slow work in `exclusive()` from `api.core.jobs`, because the CPU can only handle one heavy job
  at a time.
- Lab endpoints return `LabResult` from `api.core.schemas`, which `ResultView` can display for any lab.
- Accept images through `resolve_image`, and shrink them with `limit_size` when an algorithm is slow.
- Only samples listed in `SAMPLE_LABELS` can be requested. `cells_truth.png` stays off that list
  because it's the answer key for `cells.png`.
- YOLO training stays out of the Web UI because it takes about 18 minutes. The page shows saved results.

## Frontend rules

- Follow `docs/design/brand.md` for the brand: a cartoon instrument called Vision Lab, starting in
  light mode.
- The home page follows the `design-taste-frontend` skill in full. Lab pages use only its system
  (tokens, one button style, one card style, even edges, hover behavior), not its marketing rules on
  captions, word counts, one section per screen or hero effects.
- Take colors, type and spacing from `packages/tokens/tokens.css`, not hardcoded values. Every
  color needs a light and dark value.
- Put shared styles in `packages/ui/src/styles.css`.
- Layouts must work at phone width without horizontal page scrolling.
- Keep logic in `.tsx` islands and `.astro` files thin, because `tsc` doesn't check `.astro` files.
  `astro check` crashes on a missing `@emnapi/core`, so it isn't used.
- Astro can't hydrate dynamic components, so each lab keeps its own page in `src/pages/labs`.
- An island needs `LabProvider` from `@csst106/api-client` to use TanStack Query.
- Generated files are never edited by hand: `packages/api-client/openapi.json` and `src/schema.d.ts`.

## Accuracy

The instructor compares the Web UI with the printed report, and both must reflect what was really
run. Keep these facts in the page text, the README and the report:

- Lab numbers follow the lab sheet file names (1 to 7), because the sheets' own numbering is inconsistent.
- Lab 4's SURF is this project's NumPy implementation, because OpenCV packages exclude it. Its time
  can't be compared with compiled SIFT or ORB.
- Lab 6 uses the public African Wildlife dataset, by the user's decision, not self-collected photos.
  It was trained for 30 epochs at 320 px on 120 images, not the sheet's 100 epochs at 640 px.
- Lab 7's semantic results have no IoU score, because no pixel labels are available for those images.

Never change a reported number by hand. Rerun the lab that produces it. If a result is poor, report it
as it is.

## Working with the user

- Work happens in this order: labs, Web UI, then report. Don't start the report or answer the lab
  sheets' written questions until asked.
- The user creates and manages the GitHub repo. Don't run `git init`, commit or push unless asked.
- Before calling work done, run the checks above. For UI changes, also run the page in a browser
  and say what couldn't be tested. The live webcam still hasn't been tested.

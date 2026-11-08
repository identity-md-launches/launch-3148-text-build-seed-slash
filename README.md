# Seed Slash

A complete, mobile-friendly nut-slicing browser arcade game starring Pip, an original hamster mascot. Built with React, TypeScript, Vite and a Canvas 2D game engine. All artwork, fonts and sound generation are local; the only optional external request is Squeekchain wheel telemetry.

## Play

Select **Start slicing**. The first visit includes a short tutorial, also available from **How to play**.

| Control | Action |
| --- | --- |
| Finger | Swipe through airborne nuts |
| Mouse | Hold the left button and drag through nuts |
| `1` `2` `3` `4` | Slash the four lanes, from left to right |
| `P` or `Esc` | Pause; press again to resume |
| Pause / Resume buttons | Take a break and continue the same round |
| Speaker button | Toggle synthesized sound; the preference is saved |

Sunflower seeds, almonds, cashews and walnuts give **10 points**. Golden seeds give **20 points**, twice the base score. Three or more nuts sliced less than half a second apart form a combo: the third hit adds 6 bonus points, the fourth adds 8, and so on. These bonuses are added to the base score.

Start with **3 lives**. Each bomb hit costs one life. Every **3 dropped nuts** also cost one life; missed bombs are harmless. Waves gradually get faster. The round ends when all lives are lost. **Play again** starts a fresh round. Your personal best is saved after a completed round in this browser's `localStorage`; scores are not shared between devices. If storage is blocked, the game still works and the result screen explains that the best score lasts for the visit.

The playing field suppresses touch scrolling and accidental selection. Leaving the tab or window pauses the round. Reduced-motion mode stops decorative movement and reduces particles, glow and flashes while preserving the essential game physics. This is a visual action game; lane keys provide a keyboard alternative, but a complete nonvisual game experience has not been established.

## Install, preview and rebuild

Use Node.js **22.12+**; the production build was checked with Node 24.21.0. The dependency lockfile is included.

```sh
npm ci
npm run dev
```

For the finished production site:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Vite prints the preview URL (normally `http://localhost:4173`). Serve the export over HTTP; opening an ES-module page directly with `file://` is not the supported preview method.

`dist/index.html`, its generated JS/CSS, the nine original SVG assets, the PNG share card, and both fonts and their licenses are delivered alongside the source. `vite.config.ts` sets `base: './'`. The production export uses relative asset URLs and has been exercised at `/seed-slash/`, including canvas sprite loading. There is one page, no server routing, no backend, and no environment variables or private credentials to configure.

## Squeekchain and honest fallback

The public [Squeekchain status endpoint](https://api.squeekchain.com/v1/status) was checked before integration on **2026-11-08**. An ordinary unauthenticated HTTP request returned **200 JSON**, with `access-control-allow-origin: *`. It reported an **IDLE** wheel, zero RPM, hardware provenance, an accepted oracle state and a recent signer verification timestamp. The exact initial relevant fields, the subsequent full response, HTTP evidence and the schema investigation are in [artifacts/squeekchain.md](artifacts/squeekchain.md).

The browser checks immediately and every **10 seconds**, with a 6-second deadline. Version-1 readings must be online, hardware-sourced, accepted by the oracle, recently generated and observed, and have recent signer verification. `ACTIVE` with positive RPM enables a **golden shower**; `IDLE` with zero RPM does not. Faults, expired readings, simulated/replayed/derived data, unsupported data and network failures cannot be labelled as live.

The game trusts the API's reported verification over HTTPS. It does not independently verify the hardware signature: the endpoint does not supply its enrollment public key. This limitation and the accepted fields are documented explicitly; the game never claims browser cryptographic verification.

When telemetry is unavailable or unsupported, the footer says **Local bonus mode**. That mode gives a 12-second golden shower every 30 seconds of active play, starting at the beginning of a round. The timer stops while paused. This is local game behavior, independent of any hamster activity. The status dialog explains it. Fresh supported telemetry automatically restores Squeekchain mode. Ordinary golden seeds can also appear outside a shower; showers increase their spawn probability from 7% to 45%.

The unmodified standalone browser request in this environment returned `net::ERR_EMPTY_RESPONSE`, so it correctly displayed local bonus mode, even though the direct HTTP investigation succeeded. Live running/idle transitions, stale and simulated data, failures and recovery were additionally checked using **explicit test fixtures**, never presented as an observation of the real wheel.

There are **no wallets, tokens, transactions, payments, gambling, analytics or remote font/CDN dependencies** in the shipped game. Audio is generated with Web Audio after a user gesture and gracefully remains silent if the browser disallows it.

## Validation

The final production build, independent typecheck and 15 game/API/storage tests passed. Browser validation checked the production export in Chromium, including actual mouse drags, emulated touch swipes, keyboard slicing, combo feedback, pause/resume, completed rounds, restart, score persistence, blocked storage, and API fallback/recovery. The primary flow also passed in WebKit at 390px. The pinned taste@1 probe passed **16/16** checks. Automated axe scans reported zero violations on home, tutorial, paused and game-over screens. Rendered background sampling also checked contrast over the actual forest/game scene.

To repeat the browser checks on a machine with the normal Playwright system libraries installed:

```sh
npx playwright install chromium webkit
npm run build
npm run test:browser
```

The script creates and closes its own foreground preview server at a subpath; it leaves results and screenshots under `test/scratch/browser-validation/`. It advances the browser clock to test timed behavior without waiting through long real-time rounds. Its API fixtures and canvas observation hooks live only in the test script and are not bundled into the game. If WebKit cannot launch, the report records that limitation; a successful Chromium run alone does not establish Safari coverage.

See [artifacts/validation.md](artifacts/validation.md) for the six-domain Better Interface review, exact findings and fixes, commands, captured results and remaining limits. No physical phone, screen-reader session, native 200% browser zoom, full RTL localization, slow-motion animation-panel review, or independent hardware-signature verification is claimed. These are worker checks, not an independent certification.

## Artwork and design

All game illustration is original vector artwork: a layered night forest, Pip on a mossy stump, four nuts, a golden seed, a bomb, and a hamster favicon. See `scripts/make-art.mjs` and `public/art/`. Regenerate it with `npm run art`. The share card can be regenerated from that art and the bundled font with `npm run art:social` after installing Chromium, followed by `npm run build`.

[DESIGN.md](DESIGN.md) documents the implemented palette, six-step type scale, typography, spacing, components, motion, layering and responsive behavior. Lilita One and Nunito are bundled as WOFF2 with their OFL notices in `public/fonts/`. Design guidance was adapted from Jakub Krehel's Better Interface (MIT); documentation guidance from Paul Bakaus's Impeccable (Apache-2.0). Their preserved license text is [artifacts/INTERFACE-GUIDE-LICENSES.txt](artifacts/INTERFACE-GUIDE-LICENSES.txt).

## IPFS delivery and path budget

The complete **`dist/` directory is the publication deliverable**. Pin it as a directory and serve `index.html` at its root; nested IPFS gateway paths work with the relative URLs. IdentityMD's publisher pins this submitted export after the job. No CID or hosted URL was returned during this task, so none is invented here. No publishing command was run.

The explicit `.gitignore` budget is limited to generated dependency/cache directories at any nesting level (`**/node_modules/`, `**/.npm-cache/`, `**/.vite/`, `**/.cache/`) and disposable `test/scratch/`. It excludes no source, lockfile, documentation, original art or production output. No registry mirror, dependency archive or submodule is part of delivery. The final submission file/byte inventory is recorded in `artifacts/bundle-budget.json` and is below the 8 MiB cap.

Run `npm run check:delivery` to repeat the byte inventory, metadata/relative-URL checks, lockfile consistency checks and original-to-export asset comparison. The ignore file also explicitly includes `dist/` and its contents, so the publication export stays in the submission.

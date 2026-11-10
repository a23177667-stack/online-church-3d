# Still · Online Church 3D

A peaceful, interactive Christian sanctuary built with Vite, JavaScript, and Three.js. Walk among wooden pews, light votive candles, and take a private moment to pray. No account, backend, external assets, paid services, or API keys.

## Develop

Requires Node.js **20.19+ or 22.12+** and npm (Node 24 used for validation).

```sh
npm ci
npm run dev
```

Open the address printed by Vite. The dev server listens on all interfaces for device testing. When npm's default cache is not writable, append `--cache /workspace/.npm-cache` to `npm ci`.

## Controls

- Choose **Enter the sanctuary**, then use **WASD / arrow keys** to walk and **drag** the scene to look. Walking is bounded by walls, pews, and the altar steps.
- On a phone or tablet, use the on-screen directional buttons and drag the scene to look. Tap objects to interact.
- Click a **candle** to light it, or use **Light a candle**. Candle states last for the current page session.
- Click a **pew**, or use **Sit & pray**, to enter seated prayer mode.
- Use **Return to the sanctuary** or **Escape** to leave prayer mode.
- **Sound off/on** toggles a quiet, synthesized ambient chord. Audio starts only after your click.
- **?** opens guidance. All key actions have focusable HTML controls.

## Prayer privacy

Prayer text exists only in the textarea in the current page's memory. It is never uploaded, logged, added to a URL, or saved to cookies, localStorage, sessionStorage, or a database. Exiting prayer mode or reloading clears it. No analytics, third-party fonts, remote audio, or service worker are included. Browser extensions, browser session restoration, device screenshots, and host-level logging are outside the application's control; avoid adding analytics or form-capture scripts when deploying.

## Build and preview

```sh
npm run build
npm run preview
```

The production output is `dist/`. Preview serves it for local testing; use a static host for deployment. No server-side runtime or secrets are required.

## Deploy

Deploy the **contents of `dist/`** to any static HTTPS host (for example, GitHub Pages, Netlify, Cloudflare Pages, or your own web server).

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Relative asset paths support deployment under a subdirectory such as `/online-church-3d/`.
- For GitHub Pages, upload `dist` with the official Pages Actions workflow, or publish its contents to your Pages branch. Enable Pages in repository settings. No deployment is performed by this MVP.
- Prefer HTTPS, compression, and caching for hashed files under `assets/`. Do not add prayer form handling.

## Tests

```sh
npm ci
npx playwright install chromium
npm test
```

If Chromium is already installed, use `CHROMIUM_PATH=/usr/bin/chromium npm test`. Tests launch Vite automatically and cover desktop and touch layouts, rendering, entry, candle lighting, direct pew interaction, walking/looking input, prayer clearing, absence of prayer network/storage writes, help, and sound toggles. Screenshots are written to ignored `test-results/`.

Validated in cloud Chromium with software WebGL at desktop 1440×900 and touch 390×844. Physical iOS/Android performance and Safari have not been verified.

## Rendering and assets

All scene geometry, wood texture, lighting effects, stained glass, and ambient sound are original procedural content in `src/main.js`. Three.js is MIT licensed; dependency licenses remain with their respective packages. No downloaded art or sound assets are used.

The renderer caps pixel ratio at 1.5, requests low-power GPU use, instances floor tiles, reuses box geometry, uses low-poly meshes, and avoids shadow maps, postprocessing, and external asset loads. Rendering pauses while the tab is hidden; reduced-motion preferences disable candle animation. WebGL failure provides a private-prayer fallback. A WebGL-capable browser is required for the 3D scene.

## Scope

This is a single-visitor MVP. Prayers and candles are not synchronized or persisted. No multiplayer, authentication, donations, tracking, or backend is included.

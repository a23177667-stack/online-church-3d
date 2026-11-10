## What this delivers

Builds the first working Online Church 3D MVP: a procedural stone-and-timber sanctuary with pews, altar, cross, stained glass, candles, and warm sunlight. Visitors can walk with WASD/arrow keys or mobile touch controls, drag to look, light candles, and select pews for private prayer.

Prayer text stays in page memory and clears on exit. Optional synthesized ambient audio, help, keyboard controls, mobile layout, and a WebGL-failure prayer fallback are included. No backend, third-party assets, tracking, paid APIs, or credentials are required.

## Validation

- `npm run build` passes.
- `CHROMIUM_PATH=/usr/bin/chromium npm test`: 4 tests pass across desktop and touch/mobile viewports.
- Tests cover rendering, candle lighting, direct pew selection, navigation inputs, prayer clearing without network/storage writes, sound, and help.
- `npm audit --omit=dev`: no vulnerabilities.
- README includes development, preview, static deployment, privacy, and test instructions.

Physical mobile devices and Safari remain untested. No deployment has been performed.

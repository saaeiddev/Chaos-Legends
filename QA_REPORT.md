# Chaos Legends QA

Test environment: Chromium 153, WebGL 2 via software SwiftShader, desktop
1280×800 and 1024×768, and a 390×844 touch-only mobile context.

The production build is tested below `/Chaos-Legends/`, including GLB models,
colormap textures, local fonts, CSS, JavaScript chunks and the icon.

- Seven unit checks cover movement collision, cover, opened/closed gates,
  jumping over low obstacles, ray intersections and weapon configuration.
- Twenty-five browser checks cover the playable systems and all seven mission
  objectives through mission completion, with no failed critical asset requests
  or critical console errors.
- Keyboard controls, pointer lock, reload, four weapon keys, chicken projectile
  flight/explosion, abilities, health pickups, melee, headshots, active enemy AI,
  ranged enemy damage, chest interaction, checkpoint restore, barricade shooting,
  bridge support, boss shield/damage, pause, restart, death/retry, Web Audio,
  HUD bounds and the friendly mobile fallback are exercised.
- Late mission stages use deterministic world and enemy setups to accelerate
  coverage. Camera orbit uses a synthetic relative mouse event after real pointer
  lock because CDP absolute mouse events do not consistently supply relative deltas.
- Browser test details are in `tests/browser.cjs`; runtime JSON reports are
  written to ignored `test-results/` during the test run.

Hardware 60 FPS is a design target. This test environment uses software
rendering and is not a representative desktop GPU performance benchmark.

## Live deployment verification

Verified on 2026-10-05 at:
https://saaeiddev.github.io/Chaos-Legends/

Tested gameplay commit: `c046b9b2094275095ff62744c6fe7c45140e6dc9`.
GitHub Actions build, seven unit tests, and Pages publication succeeded:
https://github.com/saaeiddev/Chaos-Legends/actions/runs/37323208544

All **25 browser checks passed against the real public HTTPS deployment**.
All 42 critical 3D assets loaded. No critical console errors or failed asset
requests were recorded. The complete objective sequence, boss, mission result,
checkpoint reload, audio, pause, restart, and mobile fallback passed.

The restricted test environment uses an HTTPS proxy. Packaged headless Chromium
needed a proxy certificate workaround; the live entry was also independently
fetched with the system HTTPS trust store. The deployed game's HTTPS and runtime
code were unchanged.

This is automated functional coverage with deterministic late-mission setups,
not a hardware GPU performance benchmark or a recorded human playthrough.
The final documentation update adds this report and dependency license notices;
it does not change the tested game or production assets.

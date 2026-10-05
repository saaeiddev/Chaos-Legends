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

Live deployment verification is recorded after publication.

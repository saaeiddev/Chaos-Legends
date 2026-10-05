# Asset credits

Only redistributable assets are included. All gameplay, level composition, interface,
procedural weapons, chicken characters, particles, props, and audio code are original
to this project. No commercial soundtrack, paid API, or external runtime asset CDN is used.

| Asset | Author | Primary source | License | Project use |
| --- | --- | --- | --- | --- |
| Fantasy Town Kit 2.0, 38 selected GLB models and colormap | Kenney | https://kenney.nl/assets/fantasy-town-kit | CC0 1.0 | Modular village walls, trees, rocks, fences, bridge boards, stalls, lanterns, and details |
| RPG Character Pack: Ranger, Rogue, Warrior | Quaternius | https://quaternius.com/packs/rpgcharacters.html | CC0 1.0 | Animated humanoids; Ranger adapted as Rook, tinted humanoids adapted as goblins/orcs |
| LowPoly Animated Monsters: Slime | Quaternius | https://quaternius.itch.io/lowpoly-animated-monsters | CC0 1.0 | Slime adapted as an exploding mushroom |
| Barlow Condensed Bold | Jeremy Tribby / Barlow contributors | https://github.com/jpt/barlow and https://github.com/google/fonts/tree/main/ofl/barlowcondensed | SIL Open Font License 1.1 | Menu, headings, numeric display |
| Weapon models, wizard chicken, flying chicken projectile, mushroom cap, crates, barrels, treasure chests, sculpted valley, custom house roofs and ruined towers | Chaos Legends project | `src/world/Art.js`, `src/world/World.js` | MIT | Original parametrically modeled art with beveled surfaces, custom extrusions and lathed profiles |
| Icon, hero goggles, interface, procedural character poses and arm IK | Chaos Legends project | `public/assets/icon.svg`, `src/player/Pose.js`, `src/ui/` | MIT | Original visual identity and animation additions |
| Music, ambience and sound effects | Chaos Legends project | `src/core/Audio.js` | MIT | Original Web Audio synthesis; no sampled recordings |

## Provenance and modifications

Kenney's original download was obtained from the download link on the source page.
Its license file is bundled at `public/assets/town/LICENSE.txt`.

Quaternius RPG and monster models were obtained from the redistributable mirror at
https://github.com/euuuuuuan/cairnfall-public/tree/main/assets/vendor after verifying
CC0 on the original author's pages. No code from that game is incorporated here.
RPG glTF files were repackaged as GLB without changing the mesh data. Animation
channels constant at the skeleton's rest transforms were omitted; pose-specific
constant channels were preserved. Embedded textures remain inside the GLBs.

The monster mirror converted the original FBX models to GLB and renamed some
animations; its provenance note is bundled at
`public/assets/characters/LICENSE-Monsters.txt`. Only the monster used by the
first mission is bundled, avoiding unused downloads.

Character material tints, hero goggles, weapon models, mushroom caps, chicken art,
custom jump/fall/land poses, and two-bone arm posing are applied by this project's code.

The complete font license is bundled at `public/assets/fonts/OFL.txt`.

CC0: https://creativecommons.org/publicdomain/zero/1.0/

All source assets are bundled locally; production URLs are repository-relative.

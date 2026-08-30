# Duck Scooter Dash 

A Mario-style side-scroller demo starring a rubber ducky in a propeller hat,
riding a kick scooter through a farmyard world. Built as a phone-portable
web game (plain HTML5 Canvas + JS — no framework lock-in, easy to wrap in
Cordova/Capacitor later for an actual app store build).

## Current scope (playable demo)

- Title screen with mouse-clickable START button
- Five levels (farm day → orchard sunset → midnight pond → dawn hayride → storm)
- Player controls:
  - Keyboard: Left / Right move, Up jump, Down duck, Space shoot
  - Touch (phones/tablets): on-screen buttons auto-appear on any touch-capable
    device once you tap START -- left/right pad, plus jump/duck/shoot buttons.
    Same underlying input state as the keyboard, so both work simultaneously.
- Enemies: frogs that hop between lily pads and shoot their tongue as a
  ranged attack. Stomp them from above (Mario-style) OR snipe them with a
  propeller shot to neutralize.
- Original instrumental soundtrack, synthesized live in the browser via the
  Web Audio API (no audio files -- same "everything's procedurally generated"
  philosophy as the pixel art). "Hacker techno" vibe: cold square-wave bass
  pulse that dips into a dissonant minor-second neighbor tone for tension,
  sparse irregular digital "data blip" hits, a deep sub-bass drone, and
  occasional glitchy clicks instead of a steady beat -- deliberately sparse
  and tense, not upbeat or melodic. The main theme stops the instant you win
  or lose, replaced by a short victory/game-over jingle. Press M or tap the
  on-screen note-icon button to mute.
- Simple platforming physics (gravity, ground/platform collision)

## Run it

Just open `index.html` in a browser. No build step, no server needed
(though if your browser complains about local module loading, run a quick
static server, e.g. `python -m http.server` from this folder and visit
`http://localhost:8000`).

## Project layout

```
index.html          entry point / canvas host
css/style.css        page chrome styling
js/                   all game code (ES modules)
  constants.js        tunable game constants
  input.js             keyboard state tracker (+ virtual input for touch)
  touchControls.js      on-screen touch buttons (phones/tablets)
  music.js               Web Audio synth engine + step sequencer
  musicData.js            song data (notes/patterns) the engine plays
  player.js                duck-scooter player entity
  projectile.js             propeller shot entity
  enemy.js                   frog enemy entity
  level.js                    level data + platform/collision layout
  camera.js                    side-scrolling camera
  titleScreen.js                 title screen state + START button
  game.js                         main game state machine + loop
  main.js                          bootstrap
assets/icons/         generated PWA app icons
```

## Levels

Five levels, each with its own theme, width and hazards:

| # | Name | Theme | New hazard | Music |
|---|------|-------|------------|-------|
| 1 | Farmyard Frolic | Day | Frogs (tongue attack) | 96bpm cold square-wave techno |
| 2 | Orchard Sunset | Sunset | Patrolling geese | 112bpm walking triangle bass |
| 3 | Midnight Pond | Night | Moving hay carts | 76bpm slow sine dread |
| 4 | Dawn Hayride | Dawn | Cart timing across every pond | 120bpm running triangle |
| 5 | Storm on the Pond | Storm | Back-to-back carts, no lily skip | 88bpm saw rumble |

Levels are **pure data** in `js/levels.js`; `js/level.js` builds them. Adding
another level is a data edit, never a code edit (plus a track in
`js/musicData.js`). Hearts carry between levels and you get one back for
clearing one.

### Level design constraint
Jump distance is finite, so a pond gap that's too wide makes a level literally
unbeatable. `js/constants.js` fixes the physics; the derived maximum is
**115.6px** (34 airborne frames x 3.4 max speed, simulated in the same
gravity-then-position order `player.js` integrates -- the closed-form answer is
~3px optimistic because airtime quantises to whole frames). Level data should
keep every edge-to-edge gap under ~92px to leave a real margin.

## Audio

Everything is synthesized live in the browser -- no audio files, same
"everything is code" rule the pixel art follows.

- `js/musicData.js` -- one TRACK per level (tempo, waveforms, patterns) plus
  the one-shot fanfares. Adding a level means adding a track object here.
- `js/sfx.js` -- nine gameplay sounds. Each creature gets its own timbre AND
  register so you can tell what happened without looking: frogs croak low and
  wet, geese honk nasal and harsh, carts creak like wood.
- `js/music.js` -- the engine (lookahead sequencer + node graph). It knows how
  to play things, never what is being played.

Music runs through a `musicGain` sub-mix while SFX go straight to `master`, so
a fanfare can duck the backing track without also ducking the sound effects.
Chord gains are divided by `sqrt(voiceCount)` so the eight-voice victory stack
doesn't clip.

Browsers block audio until a real user gesture, so the soundtrack starts on the
START click, not before. `Music.play()` no-ops safely if it's called before the
AudioContext exists -- gameplay must never depend on audio being available.

## Roadmap (not in current demo scope)

- Power-ups (speed boost, shield/star invincibility)
- More levels (just append to `js/levels.js`) / world map
- Sound effects (jump/hit/pickup blips) to go with the new music
- Score / lives / HUD polish
- Real native APK/.exe build (Capacitor/Electron) -- needs Node.js + Android
  SDK/Java toolchain, not installed in this project's dev environment yet

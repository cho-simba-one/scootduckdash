# Duck Scooter Dash

A Mario-style side-scroller demo starring a rubber ducky in a propeller hat,
riding a kick scooter. Built as a phone-portable web game (plain HTML5 Canvas
+ JS — no framework lock-in, easy to wrap in Cordova/Capacitor later).

The HUD never prints how far you have left. Clear a stage, get a START button
for the next one.

## Current scope (playable demo)

- Title screen with mouse-clickable START button
- Four worlds (farm, city, world tour, mill), each stage with its own track, a
  START button, and a skill to learn. Mill stages climb and reverse; the camera
  looks ahead by facing and follows Y.
- Player controls:
  - Keyboard: Left / Right move, Up jump, Down duck, Space shoot
  - Touch (phones/tablets): on-screen buttons auto-appear on any touch-capable
    device once you tap START -- left/right pad, plus jump/duck/shoot buttons.
    Same underlying input state as the keyboard, so both work simultaneously.
- Farm foes: frogs (tongue), geese, pigs, bees, moles, crows. Stomp or snipe.
- City foes: rats, pigeons, alley cats, security drones, slamming dumpsters.
  Taxi roofs are rideable; bumpers are not.
- Street gadgets: hydrant jets (duck), manhole steam (jump when off), conveyor
  belts, timed traffic, crane hooks, bounce crates, low pipes.
- Original instrumental soundtrack, synthesized live in the browser via the
  Web Audio API (no audio files). Press M or tap the on-screen note-icon
  button to mute.
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
  critters.js                 farm critters + bounce pads
  city.js                      city foes, cabs, steam, cranes, traffic
  hazards.js                    geese + moving carts
  level.js                       builder: data -> collision/entities
  levels.js                       declarative stage data
  camera.js                        side-scrolling camera (mill also follows Y)
  background.js                     sky / farm / city / mill parallax
  titleScreen.js                     title screen state + START button
  game.js                             main game state machine + loop
  main.js                              bootstrap
assets/icons/         generated PWA app icons
```

## Worlds

Stages are **pure data** in `js/levels.js`; `js/level.js` builds them. Adding
another stage is a data edit, never a code edit (plus a track in
`js/musicData.js`). Hearts carry between stages and you get one back for
clearing one. The player-facing UI shows the stage name only.

**Farm (1-10, COMPLETE)** teaches frogs, geese, hay carts, pigs, duck-under rails, bees,
bounce flowers, moles, crows, and wind.

**City (11-20, COMPLETE)** opens with a "THE CITY" card. It teaches rats, pigeons, taxi roofs,
hydrant jets, steam vents, conveyors, pouncing cats, dumpster lids, drones,
jump-over traffic, and crane lifts. Potholes reuse the pond death, painted
as caution stripes. Night / rain / neon tints sit on a live skyline (blinking
windows, elevated train, two-way traffic, storefronts, lamps, weather).

**World (21-30, COMPLETE)** is the travel tour. Giza through World Scoot-Off.
The hawk stole the bell clapper; Scoot puts the ding back. Grandma Goose
hears it from the farm. That is the last line of stage 30 and the lock.

**Mill (31-40)** opens with a "THE MILL" card. Grandma's thank-you pie is
in the grain mill. Stages climb onto catwalks and lofts, then turn left;
the camera looks ahead by facing and follows Y so a loft is not a clip.
Ledges, a placed flag, and saves are data. 1-30 keep the old X-only camera.

### Level design constraint
Jump distance is finite, so a pond gap that's too wide makes a stage literally
unbeatable. `js/constants.js` fixes the physics; the derived maximum is
**115.6px** (34 airborne frames x 3.4 max speed, simulated in the same
gravity-then-position order `player.js` integrates -- the closed-form answer is
~3px optimistic because airtime quantises to whole frames). Level data should
keep every edge-to-edge gap under ~92px to leave a real margin. Horizontal
taxis count as rides the same way carts do.

## Audio

Everything is synthesized live in the browser -- no audio files, same
"everything is code" rule the pixel art follows.

- `js/musicData.js` -- one TRACK per stage (tempo, waveforms, patterns) plus
  the one-shot fanfares. Adding a stage means adding a track object here.
- `js/sfx.js` -- gameplay sounds. Each creature gets its own timbre AND
  register so you can tell what happened without looking.
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
- Another world after the city
- Score / lives / HUD polish
- Real native APK/.exe build (Capacitor/Electron) -- needs Node.js + Android
  SDK/Java toolchain, not installed in this project's dev environment yet

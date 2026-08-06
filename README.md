# Duck Scooter Dash 

A Mario-style side-scroller demo starring a rubber ducky in a propeller hat,
riding a kick scooter through a farmyard world. Built as a phone-portable
web game (plain HTML5 Canvas + JS — no framework lock-in, easy to wrap in
Cordova/Capacitor later for an actual app store build).

## Current scope (playable demo)

- Title screen with mouse-clickable START button
- One farmyard level: farmhouse, barn, pond, background dogs & geese
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
  philosophy as the pixel art). An upbeat, driving arpeggio bassline in A
  minor (Knight-Rider-esque energy) with a catchy chiptune lead hook on top,
  using soft triangle waves + a gentle lowpass filter so it stays punchy
  without being harsh. The main theme stops the instant you win or lose,
  replaced by a short victory/game-over jingle. Press M or tap the on-screen
  note-icon button to mute.
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

## Roadmap (not in current demo scope)

- Power-ups (speed boost, shield/star invincibility)
- More levels / world map
- Sound effects (jump/hit/pickup blips) to go with the new music
- Score / lives / HUD polish
- Real native APK/.exe build (Capacitor/Electron) -- needs Node.js + Android
  SDK/Java toolchain, not installed in this project's dev environment yet

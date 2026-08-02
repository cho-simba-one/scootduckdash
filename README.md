# Duck Scooter Dash 

A Mario-style side-scroller demo starring a rubber ducky in a propeller hat,
riding a kick scooter through a farmyard world. Built as a phone-portable
web game (plain HTML5 Canvas + JS — no framework lock-in, easy to wrap in
Cordova/Capacitor later for an actual app store build).

## Current scope (playable demo)

- Title screen with mouse-clickable START button
- One farmyard level: farmhouse, barn, pond, background dogs & geese
- Player controls (keyboard, arrow keys only):
  - Left / Right — move
  - Up — jump
  - Down — duck
  - Space — shoot propeller projectile (unlimited ammo)
- Enemies: frogs that hop between lily pads and shoot their tongue as a
  ranged attack. Stomp them from above (Mario-style) OR snipe them with a
  propeller shot to neutralize.
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
  input.js             keyboard state tracker
  assets.js            image loading + chroma-key transparency helper
  player.js             duck-scooter player entity
  projectile.js         propeller shot entity
  enemy.js              frog enemy entity
  level.js               level data + platform/collision layout
  camera.js              side-scrolling camera
  titleScreen.js         title screen state + START button
  game.js                 main game state machine + loop
  main.js                 bootstrap
assets/images/        generated pixel-art sprites & backgrounds
```

## Roadmap (not in current demo scope)

- Power-ups (speed boost, shield/star invincibility)
- More levels / world map
- Touch controls for real mobile build
- Sound effects & music
- Score / lives / HUD polish

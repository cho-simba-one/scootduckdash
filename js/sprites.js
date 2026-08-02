// Hand-authored pixel-grid sprites. Each row is a string; each character
// is a PALETTE key from constants.js ('.' = transparent). Rows may be
// ragged -- the renderer pads short rows with transparency automatically.

/** Clone a base grid and swap out specific row indices. Keeps our pose
 * variants DRY instead of copy-pasting the whole duck for every frame. */
function patchRows(base, patches) {
  const grid = [...base];
  for (const [i, row] of Object.entries(patches)) grid[Number(i)] = row;
  return grid;
}

// ---- Duck-on-scooter (hero) -------------------------------------------
export const DUCK_IDLE = [
  '......rrrr........',
  '.....rkkkkr.......',
  '......bbbb.........',
  '.....bbbbbb.......',
  '....bkkkkkkb......',
  '.....yyyyyy.......',
  '....yYYYYYYy......',
  '....yYkYYYYy.o....',
  '....yYYYYYYyooo...',
  '....yyyyyyyyoo....',
  '...yyyyyyyyyy.....',
  '..yyyyyyyyyyyy....',
  '..yYYYYYYYYYYy....',
  '..yyyyyyyyyyyy....',
  '..yyoyyyyyyoyy....',
  '...yyyyyyyyyy.....',
  '....oo....oo......',
  '....kk....kk......',
  '...dddddddddddd...',
  '...d..........d...',
  '..s............s..',
  '..s............s..',
];

export const DUCK_RUN1 = patchRows(DUCK_IDLE, {
  16: '...oo......oo.....',
  17: '...kk......kk.....',
});

export const DUCK_RUN2 = patchRows(DUCK_IDLE, {
  16: '.....oo..oo.......',
  17: '.....kk..kk.......',
});

export const DUCK_JUMP = patchRows(DUCK_IDLE, {
  15: '...yyyoooyyy......',
  16: '.................',
  17: '.................',
});

// Shorter overall silhouette for ducking -- also used for the smaller
// hitbox height in player.js.
export const DUCK_DUCK = [
  '.....rrrr.........',
  '....rkkkkr........',
  '.....bbbbbb........',
  '....bkkkkkkb......',
  '...yYYYYYYYYy.....',
  '...yYkYYYYYYy.o...',
  '..yyyyyyyyyyyyooo.',
  '..yYYYYYYYYYYYyoo.',
  '..yyyyyyyyyyyyy...',
  '.oo....oo.........',
  '.kk....kk.........',
  'dddddddddddddd....',
  'd............d....',
  's............s....',
];

// ---- Propeller projectile ----------------------------------------------
// Drawn small and spun via ctx.rotate() in projectile.js, so one frame
// is all we need.
export const PROPELLER_ICON = [
  '....k....',
  '..rrrrr..',
  '.rrkkkrr.',
  'rrrkkkrrr',
  '..rkkkr..',
  'rrrkkkrrr',
  '.rrkkkrr.',
  '..rrrrr..',
  '....k....',
];

// ---- Frog enemy ----------------------------------------------------------
export const FROG_IDLE = [
  '..F....F....',
  '.FwkF..FkwF.',
  'GGGGGGGGGGGG',
  'GGGGGGGGGGGG',
  'GGGGGGGGGGGG',
  'GwwwwwwwwwwG',
  'GwwwwwwwwwwG',
  'GGGGGGGGGGGG',
  '.Gk......kG.',
  '.kk......kk.',
];

export const FROG_HOP = patchRows(FROG_IDLE, {
  8: 'k.Gk....kG.k',
  9: 'k..kk..kk..k',
});

// ---- Lily pad --------------------------------------------------------
export const LILYPAD = [
  '...GGGGGGGG...',
  '.GGGGGGGGGGGG.',
  'GGGGGGmGGGGGGG',
  '.GGGGGGGGGGGG.',
  '...GGGGGGGG...',
];

// ---- Background / scenery decor --------------------------------------
export const CLOUD = [
  '...wwww..wwww...',
  '..wwwwwwwwwwww..',
  '.wwwwwwwwwwwwww.',
  '..wwwwwwwwwwww..',
];

export const HAY_BALE = [
  '.hhhhhhhh.',
  'hhHhhhhHhh',
  'hhhhHhhhhh',
  'hhHhhhhHhh',
  'hhhhhhhhhh',
];

export const FARMHOUSE = [
  '............eeeeeeeeeeeeee............',
  '..........eeeeeeeeeeeeeeeeee..........',
  '........eeeeeeeeeeeeeeeeeeeeee........',
  '......eeeeeeeeeeeeeeeeeeeeeeeeee......',
  '....eeeeeeeeeeeeeeeeeeeeeeeeeeeeee....',
  'cccccccccccccccccccccccccccccccccccccc',
  'cc..bb........bb........bb..bb......cc',
  'cc..bb..cccc..bb..cccc..bb..bb......cc',
  'cc..bb..cccc..bb..cccc..bb..bb......cc',
  'cc..........................bb......cc',
  'cc..........................bb......cc',
  'cc..........................bb......cc',
  'cccccccccccccccccccccccccccccccccccccc',
];

export const BARN = [
  '..............RRRR..............',
  '............RRRRRRRR............',
  '..........RRRRRRRRRRRR..........',
  '........RRRRRRRRRRRRRRRR........',
  '......RRRRRRRRRRRRRRRRRRRR......',
  '....RRRRRRRRRRRRRRRRRRRRRRRR....',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRXXXXXXXXXXXXXXXXRRRRRRRRR',
  'RRRRRRRXXXX......XXXXXRRRRRRRRR',
  'RRRRRRRXXXX......XXXXXRRRRRRRRR',
  'RRRRRRRXXXX......XXXXXRRRRRRRRR',
  'RRRRRRRXXXXXXXXXXXXXXXXRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
];

export const DOG = [
  '..nnnn....',
  '.nNnnnn...',
  'nnnnnnnnn.',
  'nNnnnnnnnn',
  'nnnnnnnnn.',
  '.n.n..n.n.',
  '.k.k..k.k.',
];

export const GOOSE = [
  '...w......',
  '..wow.....',
  '.wwwww....',
  'wwwwwwww..',
  '.wwwwwwww.',
  '..wwwwww..',
  '...oo.oo..',
];

// A single tileable ground column: grass top + dirt beneath. level.js
// repeats this horizontally to build the whole running strip.
export const GROUND_TILE = [
  'llllllll',
  'lmlllmll',
  'tttttttt',
  'tttttttt',
  'tttttttt',
  'tttttttt',
];

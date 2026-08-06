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

// ---- Duck-on-scooter (hero) ---------------------------------------------
// A deliberately SMALL duck riding a properly-proportioned kick scooter:
// flat low deck, a real steering column rising to a T-handlebar (not just
// a skateboard), and small close-set wheels. The duck's wing reaches out
// (the diagonal 'y'/'s' pixels around the bill) to visually connect it to
// the grip instead of looking like two unrelated shapes stacked together.
export const DUCK_IDLE = [
  '....rrrr............',
  '.....rkkr...........',
  '....bbbbbb...........',
  '...bkkkkkkb..........',
  '...yYYYYYYy..........',
  '...yYkYYYYy.o..kkkkk.',
  '...yYYYYYYyooo.yss...',
  '..yyyyyyyyyoo...ys...',
  '.yyyyyyyyyyyy...s....',
  '.yYYYYYYYYYYy...s....',
  '.yyoyyyyyyoyy...s....',
  '..oo....oo......s....',
  '..kk....kk......s....',
  '.ssssssssssssssssss..',
  '.s................s..',
  '.kk..............kk.',
  '.ks..............sk.',
];

// Riding a scooter means one foot stays planted on the deck (fixed at
// columns 2-3, every frame) while only the OTHER foot kicks -- not a
// two-legs-alternating walk cycle. RUN1 = kick foot swung back for the
// push-off, RUN2 = kick foot swung forward/up on the recovery.
export const DUCK_RUN1 = patchRows(DUCK_IDLE, {
  11: '..oo........oo..s....',
  12: '..kk........kk..s....',
});

export const DUCK_RUN2 = patchRows(DUCK_IDLE, {
  11: '..oo.oo.........s....',
  12: '..kk.kk.........s....',
});

export const DUCK_JUMP = patchRows(DUCK_IDLE, {
  10: '.yyoooooooyy....s....',
  11: '................s....',
  12: '................s....',
});

// Shorter overall silhouette for ducking -- also used for the smaller
// hitbox height in player.js. Crouched low enough that the rider's head
// ends up right about at handlebar height.
export const DUCK_DUCK = [
  '....rrrr............',
  '...rkkkr............',
  '...bbbbbb............',
  '..bkkkkkkb...kkkkk...',
  '..yYYYYYYYy..yss.....',
  '..yYkYYYYYy.o.ys.....',
  '.yyyyyyyyyyyooo.s....',
  '.yYYYYYYYYYYyoo.s....',
  '.yyyyyyyyyyyyy..s....',
  '.oo....oo.......s....',
  '.kk....kk.......s....',
  'ssssssssssssssssss..',
  's................s..',
  'kk..............kk..',
  'ks..............sk..',
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

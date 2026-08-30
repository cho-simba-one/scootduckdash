// Level DATA -- pure declarative description, zero logic.
//
// level.js turns these into runtime objects. Keeping the two apart means
// adding a new level is a data edit, never a code edit, and the builder
// stays the single place that knows how a level is assembled.
//
// Coordinate notes:
//   ground : [startX, width]        -- solid floor strip
//   hay    : [x, topY]              -- small jumpable platform
//   pond   : [startX, endX]         -- deadly gap; fall in = lose a heart
//   lilies : [centerX, topY]        -- stepping stones across a pond
//   frogs  : [centerX, topY]        -- perched frog (usually on a lily/hay)
//   geese  : [x, y, patrolWidth]    -- flying patroller
//   carts  : [x, y, range, axis]    -- moving platform ('h' or 'v')

export const THEMES = {
  day: {
    skyTop: '#7ec8f2',
    skyBottom: '#cdeeff',
    sun: '#fff4cc',
    grass: '#3fae4a',
    water: ['#5ab6e8', '#3f8fc9'],
    overlay: null,
  },
  sunset: {
    skyTop: '#ff9e5e',
    skyBottom: '#ffd9a0',
    sun: '#fff0d0',
    grass: '#3a8f45',
    water: ['#e08a5a', '#a85f3e'],
    overlay: 'rgba(255,140,60,0.14)',
  },
  night: {
    skyTop: '#12183a',
    skyBottom: '#2b3566',
    sun: '#e8ecff', // doubles as the moon
    grass: '#1f6b34',
    water: ['#2c4f80', '#1b3255'],
    overlay: 'rgba(20,24,70,0.28)',
    stars: true,
  },
  dawn: {
    skyTop: '#f7a08c',
    skyBottom: '#ffe6c2',
    sun: '#fff5e0',
    grass: '#4aa84f',
    water: ['#6bb8d4', '#3d7fa3'],
    overlay: 'rgba(255,180,140,0.12)',
  },
  storm: {
    skyTop: '#2a3348',
    skyBottom: '#4a5568',
    sun: '#c5cde0',
    grass: '#2d5c38',
    water: ['#3a5878', '#243a52'],
    overlay: 'rgba(30,40,60,0.32)',
    stars: true,
  },
};

export const LEVELS = [
  {
    name: 'Farmyard Frolic',
    subtitle: 'Mind the frogs',
    width: 3600,
    theme: THEMES.day,
    ground: [[0, 720], [1120, 900], [2380, 1220]],
    hay: [[300, 175], [500, 150], [1300, 165], [1480, 130], [1660, 165], [2600, 160], [2800, 160]],
    ponds: [[720, 1120], [2020, 2380]],
    lilies: [[770, 200], [890, 180], [1010, 200], [2070, 205], [2190, 185], [2320, 205]],
    frogs: [[520, 150], [770, 200], [890, 180], [1010, 200], [1480, 130],
            [2070, 205], [2190, 185], [2320, 205], [2800, 160]],
    geese: [],
    carts: [],
    buildings: [['farmhouse', 180], ['barn', 560], ['barn', 2550]],
    animals: [['dog', 420], ['goose', 900], ['goose', 1500], ['dog', 2400], ['goose', 2900]],
  },
  {
    name: 'Orchard Sunset',
    subtitle: 'Geese on the wing',
    width: 4200,
    theme: THEMES.sunset,
    ground: [[0, 560], [900, 620], [1800, 480], [2600, 520], [3320, 880]],
    hay: [[220, 170], [380, 135], [1000, 160], [1180, 125], [1400, 160],
          [1900, 150], [2050, 120], [2750, 155], [2950, 120], [3450, 150]],
    ponds: [[560, 900], [1520, 1800], [2280, 2600], [3120, 3320]],
    lilies: [[610, 200], [730, 180], [850, 200], [1570, 195], [1690, 195],
             [2330, 200], [2450, 175], [2550, 200], [3170, 190], [3270, 190]],
    frogs: [[610, 200], [850, 200], [1690, 195], [2330, 200], [2550, 200], [3270, 190]],
    // Geese patrol the open air above the pond crossings -- you have to
    // time your lily-pad hops around them.
    geese: [[1000, 120, 260], [2100, 100, 300], [3000, 130, 280], [3600, 110, 320]],
    carts: [],
    buildings: [['barn', 260], ['farmhouse', 1250], ['barn', 3400]],
    animals: [['dog', 700], ['goose', 1700], ['dog', 2500], ['goose', 3500]],
  },
  {
    name: 'Midnight Pond',
    subtitle: 'Ride the carts, duck',
    width: 4800,
    theme: THEMES.night,
    ground: [[0, 480], [1080, 400], [2100, 380], [3100, 360], [4080, 720]],
    // The blocks flanking each lift cart (x=1250, x=3250) are kept a full
    // jump-length clear of the bonus hearts. Sitting any closer let players
    // hop straight up to the reward and skip the lift entirely, which made
    // the vertical carts pointless -- the exact thing they exist to fix.
    hay: [[200, 160], [340, 125], [1100, 155], [1440, 120], [2200, 150], [3110, 145], [4200, 150]],
    ponds: [[480, 1080], [1480, 2100], [2480, 3100], [3460, 4080]],
    // Pads sit close enough that every hop clears the safe-jump budget --
    // the challenge here is the carts and geese, not inhuman leaps.
    lilies: [
      [560, 195], [660, 190], [760, 195], [980, 195],
      [1560, 190], [1660, 195], [1760, 190], [2000, 190],
      [2560, 195], [2660, 190], [2760, 195], [3000, 195],
      [3540, 190], [3640, 195], [3740, 190], [3980, 190],
    ],
    frogs: [[660, 190], [980, 195], [1660, 195], [2000, 190],
            [2660, 190], [3000, 195], [3640, 195], [3980, 190]],
    geese: [[800, 105, 300], [1900, 95, 340], [2900, 110, 320], [3900, 100, 300]],
    // Carts bridge the one deliberately-wide stretch in each pond. The
    // vertical pair are LIFTS: they exist to carry you up to a bonus heart
    // that nothing else can reach, which is the only reason to ride one.
    carts: [[820, 195, 130, 'h'], [1820, 190, 150, 'h'], [2820, 195, 150, 'h'],
            [3800, 190, 150, 'h'], [1250, 150, 70, 'v'], [3250, 150, 70, 'v']],
    // Positioned at each vertical cart's apex -- see level.js for the check
    // that keeps them out of jump range from anywhere else.
    pickups: [[1270, 36, 'heart'], [3270, 36, 'heart']],
    buildings: [['farmhouse', 300], ['barn', 2150], ['farmhouse', 4150]],
    animals: [['dog', 250], ['goose', 2200], ['dog', 4250]],
  },
  {
    name: 'Dawn Hayride',
    subtitle: 'Time the carts',
    width: 5100,
    theme: THEMES.dawn,
    ground: [[0, 540], [1200, 380], [2240, 500], [3400, 520], [4580, 520]],
    hay: [[200, 170], [360, 155], [1240, 165], [3480, 165], [4700, 165], [4820, 155]],
    ponds: [[540, 1200], [1580, 2240], [2740, 3400], [3920, 4580]],
    // 100px lily centers = 58px edge gap. Carts sit in the one wide hole
    // of each pond -- same ride-or-swim pattern as Midnight, just faster.
    lilies: [
      [600, 195], [700, 190], [800, 195], [1140, 195],
      [1640, 195], [1740, 190], [1840, 195], [2180, 195],
      [2800, 195], [2900, 190], [3000, 195], [3340, 195],
      [3980, 195], [4080, 190], [4180, 195], [4520, 195],
    ],
    frogs: [[700, 190], [1140, 195], [1740, 190], [2180, 195],
            [2900, 190], [3340, 195], [4080, 190], [4520, 195]],
    geese: [[900, 110, 280], [1940, 100, 280], [3100, 110, 280], [4280, 100, 280]],
    carts: [
      [860, 195, 200, 'h'], [1900, 195, 200, 'h'],
      [3060, 195, 200, 'h'], [4240, 195, 200, 'h'],
      [1360, 150, 75, 'v'], [3660, 150, 75, 'v'],
    ],
    pickups: [[1380, 36, 'heart'], [3680, 36, 'heart']],
    buildings: [['farmhouse', 160], ['barn', 1280], ['farmhouse', 2460],
                ['barn', 3520], ['farmhouse', 4750]],
    animals: [['dog', 250], ['goose', 1400], ['dog', 2500], ['goose', 3700], ['dog', 4800]],
  },
  {
    name: 'Storm on the Pond',
    subtitle: 'Two carts. No lily skip.',
    width: 5600,
    theme: THEMES.storm,
    ground: [[0, 480], [1100, 360], [2100, 340], [3200, 380], [4500, 1100]],
    // Final-stretch hay is a staircase from the ground (170), never a
    // 100px first hop -- max jump height is 79px.
    hay: [[200, 170], [340, 155], [1180, 165], [2200, 165], [3280, 165],
          [4600, 170], [4720, 155], [4840, 155], [4960, 150]],
    ponds: [[480, 1100], [1460, 2100], [2440, 3200], [3580, 4500]],
    lilies: [
      [540, 195], [640, 190], [740, 195], [840, 190], [940, 195], [1040, 195],
      [1520, 195], [1620, 190], [1720, 195], [2040, 195],
      [2500, 195], [2600, 190], [2700, 195], [3120, 195],
      [3640, 195], [3740, 190], [4100, 195], [4420, 195],
    ],
    frogs: [[640, 190], [840, 190], [1040, 195], [1620, 190], [2040, 195],
            [2600, 190], [3120, 195], [3740, 190], [4420, 195]],
    geese: [[700, 100, 250], [1800, 95, 280], [2900, 90, 300],
            [3900, 100, 320], [4700, 110, 260]],
    carts: [
      [1780, 195, 180, 'h'], [2760, 195, 260, 'h'],
      [3800, 195, 200, 'h'], [4160, 195, 180, 'h'],
      [3380, 150, 80, 'v'],
    ],
    pickups: [[3400, 36, 'heart'], [4980, 110, 'heart']],
    buildings: [['barn', 200], ['farmhouse', 1180], ['barn', 2260],
                ['farmhouse', 3280], ['barn', 5200]],
    animals: [['dog', 200], ['goose', 1300], ['dog', 2300], ['goose', 3400], ['dog', 5000]],
  },
];

export const LEVEL_COUNT = LEVELS.length;

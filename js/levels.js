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
    hay: [[200, 160], [340, 125], [1150, 155], [1320, 120], [2200, 150], [3200, 145], [4200, 150]],
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
    // Carts bridge the one deliberately-wide stretch in each pond, and the
    // vertical pair act as lifts up to the hay route.
    carts: [[820, 195, 130, 'h'], [1820, 190, 150, 'h'], [2820, 195, 150, 'h'],
            [3800, 190, 150, 'h'], [1250, 150, 70, 'v'], [3250, 150, 70, 'v']],
    buildings: [['farmhouse', 300], ['barn', 2150], ['farmhouse', 4150]],
    animals: [['dog', 250], ['goose', 2200], ['dog', 4250]],
  },
];

export const LEVEL_COUNT = LEVELS.length;

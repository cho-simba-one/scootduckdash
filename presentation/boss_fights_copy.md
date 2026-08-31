# Boss Fight Copy — Duck Scooter Dash

Written to the house voice rule: two-line intro card, short/plain/warm sentences,
Scoot does not make speeches. Each entry: on-screen name/title, intro card, victory line.

Format read I took: main title in caps (matches the world cards — THE MILL, THE FAIR,
THE HOUSE), plus a short sentence-case subtitle (matches how every stage already
pairs a name with a subtitle, e.g. "Loading Dock — The floor is not the only floor").
If the on-screen boss card only has room for one line, drop the subtitle and keep
the caps title; the intro card carries the joke either way.

---

## 1. THE WORK BOSS — Level 40, end of The Mill

**On-screen title:** THE FOREMAN — Nobody Clocks Out Early

**Intro card:**
The raccoon works for someone, and that someone stamps Grandma's pie MILL PROPERTY.
He blocks the loading dock with his whole body. Scoot has never once had a job.

**Victory line:**
Shift's over. Scoot didn't stamp anything on the way out.

*Continuity note: this makes the foreman the raccoon's boss, which is why the raccoon
never seemed to be running the show. Nothing in the existing docs contradicts it.*

---

## 2. MRS. SCOOTER DUCK — Level 60, end of Carnival

**On-screen title:** MRS. SCOOTER DUCK — Ring Toss for Two

**Intro card:**
The prize duck at the ring-toss booth is not for sale, not for trade, and extremely
fast on a scooter of her own. Scoot loses the first three rounds on purpose.

**Victory line:**
Neither of them wanted the ticket that badly. They split a funnel cake instead.

*Continuity note: level 60's existing story line already has Scoot in a staring
contest with "the prize duck" ("Scoot takes the gold ticket. The prize duck stares.
Scoot stares back. He keeps the ticket."). This treats her as the same character —
it's a rewrite of that beat into a boss, not a new one bolted on.*

---

## 3. BABY SCOOTER DUCK — Level 70, end of Alpine Town

**On-screen title:** BABY SCOOTER DUCK — Not Done Being Upset

**Intro card:**
Grandma's cowbell went missing three streets ago. It's currently strapped to a
duckling half Scoot's height, and she is not done being upset about something.

**Victory line:**
The tantrum runs out around verse six. She conks out mid-clang, cowbell still in
her fist.

*Continuity note: the Alpine world's own design notes already flag the cowbell as
a plot device that "will get stolen" — this is that theft, explained. No combat:
the resolution is Scoot outlasting a tantrum, not beating a baby. If the build
needs an explicit non-violent win-state (a hum/lull mechanic, a timer, whatever),
that's a design/code call for Clyde, not something the copy can carry alone.*

---

## 4. GIANT SCOOTER DUCK — Level 90, end of The Manor

**On-screen title:** GIANT SCOOTER DUCK — His Own Worst Rival

**Intro card:**
The manor keeps a mirror three storeys tall, and something in it moves before
Scoot does. Same hat, same scooter, same bad habit of racing ahead.

**Victory line:**
The giant duck hops half a beat late, same as always. Scoot beats him by the
width of a hat brim.

*This is the one I'd hold up as the strongest of the four — "same as always" does
the Captain's brief ("his biggest enemy is himself") without a single word of
exposition, and it's funny on a reread instead of just the first pass.*

---

## Flags for the room (all of them, flat, no ranking)

- The base design doc states the original decade-boss philosophy as "a gauntlet,
  not a new entity" and "not a boss with an HP bar." This brief deliberately
  overrides that for these four fights. Worth a one-line sign-off from whoever
  owns the design doc so it doesn't read as drift later.
- The foreman (boss 1) and the giant mirror-duck (boss 2... 4) are new characters/
  set pieces with no prior seed in the design doc — they'll need their own sprite
  work and, for the Manor, a three-storey mirror room that doesn't exist in the
  current level layout. Mrs. Scooter Duck and Baby Scooter Duck reuse elements
  already planted (the prize duck, the cowbell), so those two are cheaper to land.
- The game currently renders one `story` string per level (see `level.js` /
  `game.js`, `wrapText(... level.story ...)`). There's no second field or render
  path for a post-fight victory line yet. That's a data-model and rendering change,
  which is code work I can't do — hand this whole packet to Clyde for wiring.
- No prices, dates, or specs were invented here — this is dialogue/narrative copy
  only, nothing that needs a [PLACEHOLDER].

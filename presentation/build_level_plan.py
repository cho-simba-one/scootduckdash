"""Build the Duck Scooter Dash 100-level presentation PDF."""
from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer,
    Table, TableStyle, HRFlowable,
)


ROOT = Path(__file__).resolve().parent
BG = ROOT / "backgrounds"
OUT = ROOT / "Duck_Scooter_Dash_100_Levels.pdf"
PAGE = landscape(letter)
INK = colors.HexColor("#1a1a1a")
GOLD = colors.HexColor("#ffd23f")
CREAM = colors.HexColor("#fff8e4")
DUST = colors.HexColor("#f3e6c4")
MILL = colors.HexColor("#8a6230")
NAVY = colors.HexColor("#12183a")
ROW_A = colors.HexColor("#fffdf6")
ROW_B = colors.HexColor("#f4ead0")
SHIP = colors.HexColor("#2a9d3f")
PLAN = colors.HexColor("#3a86ff")


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def styles():
    base = getSampleStyleSheet()
    s = {
        "cover": ParagraphStyle(
            "cover", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=28, leading=32, textColor=INK, alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "sub": ParagraphStyle(
            "sub", parent=base["Normal"], fontName="Helvetica",
            fontSize=12, leading=16, textColor=MILL, alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "h1": ParagraphStyle(
            "h1", parent=base["Heading1"], fontName="Helvetica-Bold",
            fontSize=16, leading=20, textColor=INK, spaceBefore=0, spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=12, leading=15, textColor=MILL, spaceBefore=4, spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body", parent=base["Normal"], fontName="Helvetica",
            fontSize=9.5, leading=13, textColor=INK, spaceAfter=6,
        ),
        "caption": ParagraphStyle(
            "caption", parent=base["Normal"], fontName="Helvetica-Oblique",
            fontSize=8, leading=10, textColor=colors.HexColor("#5c4632"),
            alignment=TA_CENTER, spaceAfter=8,
        ),
        "th": ParagraphStyle(
            "th", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=7.5, leading=9.5, textColor=INK,
        ),
        "td": ParagraphStyle(
            "td", parent=base["Normal"], fontName="Helvetica",
            fontSize=7.2, leading=9.4, textColor=INK,
        ),
        "tdc": ParagraphStyle(
            "tdc", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=7.2, leading=9.4, textColor=INK, alignment=TA_CENTER,
        ),
        "foot": ParagraphStyle(
            "foot", parent=base["Normal"], fontName="Helvetica",
            fontSize=7.5, leading=9, textColor=colors.HexColor("#5c4632"),
        ),
        "status": ParagraphStyle(
            "status", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=8, leading=10, textColor=SHIP,
        ),
    }
    return s


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = PAGE
    canvas.setFillColor(GOLD)
    canvas.rect(0, h - 18, w, 18, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(36, h - 13, "DUCK SCOOTER DASH")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 36, h - 13, "100-level plan  ·  presentation brief")
    canvas.setFillColor(INK)
    canvas.rect(0, 0, w, 22, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(36, 8, "Scoot  ·  one MacGuffin per decade  ·  the map is not a hallway")
    canvas.drawRightString(w - 36, 8, f"{doc.page}")
    canvas.restoreState()


def cover_page(canvas, doc):
    header_footer(canvas, doc)


def P(text, style):
    return Paragraph(esc(text) if "<" not in text else text, style)


def make_table(rows, col_widths, s):
    head = [Paragraph(f"<b>{esc(c)}</b>", s["th"]) for c in rows[0]]
    data = [head]
    for row in rows[1:]:
        cells = []
        for i, val in enumerate(row):
            st = s["tdc"] if i == 0 else s["td"]
            if val == "SHIPPED":
                cells.append(Paragraph("<font color='#2a9d3f'><b>SHIPPED</b></font>", s["tdc"]))
            elif val == "PROPOSED":
                cells.append(Paragraph("<font color='#3a86ff'><b>PROPOSED</b></font>", s["tdc"]))
            else:
                cells.append(Paragraph(esc(val), st))
        data.append(cells)
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), GOLD),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#c4a060")),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
    ]
    for i in range(1, len(data)):
        cmds.append(("BACKGROUND", (0, i), (-1, i), ROW_A if i % 2 else ROW_B))
    tbl.setStyle(TableStyle(cmds))
    return tbl


def img(path, width):
    pic = Image(str(path), width=width, height=width * 9 / 16)
    pic.hAlign = "CENTER"
    return pic


DECADES = [
    {
        "range": "1–10",
        "name": "The Farm",
        "status": "SHIPPED",
        "card": "none — you start in the yard",
        "macguffin": "the picnic sandwich",
        "teaches": "The verbs. Jump, duck, stomp, shoot, ride a cart, wait a mole, bounce, wind.",
        "why": (
            "A 1v1 of space that a cold tester can read in one sitting. The farm is the "
            "tutorial because every object already means something: a pond is death, a hay "
            "bale is a step, a cart is a ride. The sandwich is a joke that still has stakes — "
            "Scoot is not sharing — so clearing a stage feels like getting lunch back, not "
            "filling a bar. Ten stages, ten skies, ten tracks: that packing density is the "
            "template every later decade copies."
        ),
        "image": "01_farm.jpg",
        "caption": "Suggested farm backdrop — ponds, hay, barn. The play band is the grass strip.",
        "levels": [
            ("1", "Farmyard Frolic", "Frogs", "A frog punted Scoot's picnic sandwich across the yard. He is not sharing.", "First enemy, first read."),
            ("2", "Orchard Sunset", "Geese", "The sandwich is in the orchard. The geese have called dibs. Scoot has not.", "Air patrol, different height."),
            ("3", "Midnight Pond", "Ride the carts", "Night. Lunch is riding a hay cart. Scoot was not invited. Get on anyway.", "Moving floor."),
            ("4", "Dawn Hayride", "Time the carts", "Dawn. The carts are late and so is breakfast. Time the ride. Save the rye.", "Timing, not just jumping."),
            ("5", "Storm on the Pond", "Two carts, no skip", "The storm launched lunch into the wide pond. Two carts. Zero umbrellas.", "Commit to the ride."),
            ("6", "Pig Pen", "Jump pigs, duck rails", "Pigs found the sandwich and wore it as a hat. Jump the fashion show.", "Low tank + duck-under."),
            ("7", "Bee Meadow", "Shoot the swarm, bounce", "Grape jelly. Bees. Scoot regrets every choice except the scooter.", "Air pests + super-jump."),
            ("8", "Mole Patch", "Wait them out", "It dropped down a mole hole. Wait for the mole. Do not become the mole.", "Patience as a verb."),
            ("9", "Crow Ridge", "Wind is not a friend", "A crow has it. The wind has Scoot. Bounce, snatch, try not to emigrate.", "The world pushes you."),
            ("10", "Moonlit Fair", "Everything at once", "Scoot grabs the sandwich off the prize table, mud and all. Best lunch of his life. They give him a ribbon for Fastest Picnic.", "Decade boss as a gauntlet, not a new entity."),
        ],
    },
    {
        "range": "11–20",
        "name": "The City",
        "status": "SHIPPED",
        "card": "THE CITY",
        "macguffin": "a raffle ticket stuck to the jelly — first prize is a deluxe scooter bell",
        "teaches": "Urban gadgets: rats, taxi roofs, hydrants, steam, belts, cats, dumpsters, drones, traffic, cranes.",
        "why": (
            "The sandwich is won. The ticket is the reason to leave the yard without inventing "
            "a new combat system. City paint on the same physics: a pothole is still a pond, "
            "a taxi roof is still a cart, a hydrant is a duck-under with a timer. Night, rain, "
            "and neon are skies, not modes. The bell going ding at Neon Run is the first "
            "permanent toy — it has to matter later, which is why the hawk steals the clapper."
        ),
        "image": "02_city.jpg",
        "caption": "Suggested city backdrop — dusk skyline, elevated train, yellow curb as the play band.",
        "levels": [
            ("11", "Curb Check", "Rats", "Stuck to the jelly: a raffle ticket. First prize is a deluxe scooter bell. Drawing is downtown. Tonight.", "City gate. New low scurrier."),
            ("12", "Pigeon Square", "Dumpster bounce", "Pigeons filed the ticket under Bread. Bounce up there and file a complaint.", "Air pest, urban bounce."),
            ("13", "Rush Hour", "Ride the cab", "The ticket is on a taxi roof. Land on the cab. Hugging the bumper is a bad policy.", "Cart that can also hurt you."),
            ("14", "Alley Steam", "Duck the jet, jump steam", "Alley shortcut. Hydrants spit high. Manholes erupt. The ticket hates steam.", "Two timers, two answers."),
            ("15", "Belt Yard", "The street moves", "Warehouse belts. If this ticket ships to Ohio, the bell is someone else's.", "Floor as an enemy."),
            ("16", "Scaffold Run", "Duck the pipes", "Scaffolds. Cats. The ticket is taped to a low pipe. Duck, then un-tape.", "Pounce + duck-under."),
            ("17", "Night Market", "Wait the lid", "Night market. Someone tossed it. Wait for the dumpster lid. Then un-toss it.", "Mole logic, city paint."),
            ("18", "Overpass", "Wind plus cabs", "Gale off the overpass. Drones think it is a coupon. Hold the line anyway.", "Wind returns with drones."),
            ("19", "Hard Hat", "Traffic and cranes", "Last detour. Jump the traffic. That crane is holding something shiny.", "Vertical lift."),
            ("20", "Neon Run", "The city does not sleep", "Neon marquee. Scoot slaps the ticket on the glass. He wins the bell. It goes ding. Worth every pothole.", "Toy acquired. Decade lock."),
        ],
    },
    {
        "range": "21–30",
        "name": "The World",
        "status": "SHIPPED",
        "card": "THE WORLD",
        "macguffin": "the bell clapper, stolen by a souvenir hawk",
        "teaches": "Tail-whip in the air. Landmark stages. Travel foes (snakes, scorpions, goats, hawks).",
        "why": (
            "A scooter bell that never dings is a broken promise. The hawk is a chase, not a "
            "boss fight, so each postcard is a new backdrop and a new gag instead of a new "
            "HP bar. Whip is the one new verb this decade — a deck kick that stretches a jump "
            "and hits in front — because travel gaps are a little wider than farm ponds. "
            "Grandma Goose hearing the ding from the farm is the handoff line into the mill."
        ),
        "image": "03_world.jpg",
        "caption": "Suggested travel backdrop — pyramids, canyon, tower and harbor as far landmarks over one play band.",
        "levels": [
            ("21", "Giza Dawn", "Whip in the air", "A souvenir hawk stole the clapper from Scoot's new bell. First stop: Egypt. The hawk dropped a trail of sand.", "Travel gate. New verb."),
            ("22", "Sphinx Dunes", "Scorpions in the shade", "The hawk hid behind the Sphinx. Scorpions rented the shade. Scoot did not sign a lease.", "Low tank, desert paint."),
            ("23", "Nile Crossing", "Ride the felucca", "A felucca has the clapper in a picnic basket. Night on the Nile. Do not become a crocodile footnote.", "Cart as a boat."),
            ("24", "Canyon Rim", "The air shoves you", "Grand Canyon. The hawk is a speck over the drop. Grandma wanted a fridge magnet. Scoot wants not to become one.", "Wind + drop."),
            ("25", "Switchbacks", "Goats own the ledge", "Down on the switchbacks the goats have opinions about tourists. The magnet is in a nest. Of course it is.", "First hint that a path can fold."),
            ("26", "Paris Lights", "Bounce the Seine", "Paris. The hawk sold the clapper to a mime who will not admit he has it. Bounce up. Make him mime faster.", "Bounce as a joke and a tool."),
            ("27", "Great Wall", "Duck the bricks", "The Wall. Someone bricked the clapper into a souvenir stall. Duck the restorers. Un-brick the bell.", "Duck-under as restoration."),
            ("28", "Rio Ridge", "Hawks over the green", "Rio. The hawk is showing off for the statue. Scoot is not a tourist. He is a collection agency with a scooter.", "The chase shows off."),
            ("29", "Liberty Harbor", "One more postcard", "New York. The hawk dropped the clapper on a ferry roof. Scoot does not have a ticket. He has airtime.", "Taxi-roof logic on a ferry."),
            ("30", "World Scoot-Off", "Put the ding back", "The hawk is tired. Scoot is not. He snaps the clapper back in. The bell dings so loud Grandma Goose hears it from the farm.", "Decade lock. Handoff to the mill."),
        ],
    },
    {
        "range": "31–40",
        "name": "The Mill",
        "status": "SHIPPED",
        "card": "THE MILL",
        "macguffin": "Grandma's thank-you pie, rolled into the grain mill by a raccoon",
        "teaches": "Climb. Reverse. The flag is a coordinate. Camera looks ahead by facing and follows Y.",
        "why": (
            "Every stage before this is a hallway facing right. That is honest for teaching "
            "verbs and dishonest for a building. The mill exists because a grain mill is "
            "already stacked floors, catwalks, and a west loft you only find if you climb "
            "and turn around. The raccoon is story, not a fourth enemy type — pigs, rats, "
            "moles, bees, and belts wear mill paint. Look-ahead and camera-Y are gated to "
            "this world so 1–30 do not move a pixel. Stage 31 is still rightward so the "
            "climb is the only new sentence. Stage 32 is the first time the game says "
            "hold left. Stage 40 is a loop: the mill is a building."
        ),
        "image": "04_mill.jpg",
        "caption": "Suggested mill backdrop — silos, waterwheel, catwalks, wooden dock as the play band.",
        "levels": [
            ("31", "Loading Dock", "The floor is not the only floor", "Grandma's pie went into the mill. The raccoon left flour footprints up a ladder. Scoot does not do ladders. He does hops.", "Teach climb. Flag still right, but on the catwalk."),
            ("32", "Catwalk West", "Turn around", "The catwalk only goes left. The pie smell does too. Scoot argues with the architecture and loses.", "Climb, then hold left. Camera looks where you face."),
            ("33", "Hopper House", "Up, then left", "Grain hoppers. The raccoon took the upstairs hall. The downstairs hall is a rumor with a hole in it.", "Two floors. Decoy downstairs."),
            ("34", "Dead End East", "The goal is behind you", "East is a wall with a very confident arrow. West is the pie. Scoot has been betrayed by signage before.", "Spawn mid-map. East is a trap."),
            ("35", "Elevator Shaft", "The cart goes up", "The service lift still works. That is the good news. The raccoon packed it with moths. That is the rest of the news.", "Vertical cart is the floor change."),
            ("36", "West Wing", "Discovery is left", "A whole hallway pointing the wrong way. Scoot would like a word with whoever numbered these rooms.", "A real leftward chunk, not a stub. Egg in the loft."),
            ("37", "Gear Loft", "Floor moving against you", "Belts in here run west. Scoot is a polite guest and fights them anyway.", "Conveyors reverse you. Climb off, then west."),
            ("38", "Night Shift", "Both ways, in the dark", "Night mill. Moles in the grain, moths in the rafters, pie in the safe. Wait the moles. Do not become the grain.", "Everything from 31–37 at once."),
            ("39", "Dust Storm", "Up is not safer", "The roof wants Scoot in Kansas. The loft wants him west. Pick the loft.", "Wind on the roof. Shelter is reverse into the loft."),
            ("40", "Pie Safe", "The mill is a building", "The raccoon is tired. Scoot is not. He takes the pie. Grandma says it is a little dusty and also the best pie of his life.", "Loop: right, climb two, left, flag west of spawn."),
        ],
    },
    {
        "range": "41–50",
        "name": "Tide Caves",
        "status": "PROPOSED",
        "card": "THE TIDE",
        "macguffin": "Grandma's pie plate — the good china — washed into the sea caves",
        "teaches": "Wet reverse and low ceilings. Vertical is also a clock: the tide raises and lowers floors.",
        "why": (
            "The mill taught that a building has a west wing. Caves teach that a space can "
            "close. Duck-under is no longer a rail, it is a tunnel that floods. Reusing "
            "geysers and belts as blowholes and current keeps the verb set intact while the "
            "sky goes teal and the ceiling comes down. The plate is funnier than treasure — "
            "Scoot is still on a dishwashing errand — and a moon-pool loft is the mill loft "
            "with salt on it, so the camera-Y we just shipped gets a second job."
        ),
        "image": "05_caves.jpg",
        "caption": "Suggested tide-cave backdrop — low arches, moon pool, dry shelf opening left, wet sand play band.",
        "levels": [
            ("41", "Sluice Gate", "Wet floor, still right", "Scoot rinsed the pie plate in the creek. The creek had other plans.", "City-gate energy. New sky, old verbs."),
            ("42", "Low Tide Hall", "Duck is a tunnel", "The ceiling came down. Scoot did not. Duck, then un-duck, then duck again.", "Duck-under as architecture."),
            ("43", "Blowhole", "Geyser, then left", "A blowhole launched the china onto a shelf. The shelf only goes west.", "Mill 32 with salt."),
            ("44", "Kelp Switch", "Up a shelf, turn left", "Kelp hides a side cave. The plate clinked. Side caves are not optional.", "Discovery is a dry shelf."),
            ("45", "Moon Pool", "The tide is the lift", "The pool rises. That is the good news. It also falls. That is the rest of the news.", "Vertical cart as tide."),
            ("46", "West Grotto", "A cave pointing the wrong way", "A whole grotto numbered by someone who cannot count past left.", "West Wing, wet."),
            ("47", "Current Belt", "The water shoves you", "Current runs east. The china is west. Scoot is a polite guest and fights it.", "Gear Loft as current."),
            ("48", "Night Tide", "Both ways, bioluminescent", "Moles in the sand. Eels in the rafters. Wait the moles. Do not become the kelp.", "Night Shift, caves."),
            ("49", "Storm Surge", "Up is not drier", "The roof wants Scoot in the drink. The loft-grotto wants him west.", "Dust Storm with tide."),
            ("50", "China Shelf", "The cave is a building", "Scoot takes the plate. Grandma says it is a little salty and also the good china.", "Loop. Flag west in a loft-grotto."),
        ],
    },
    {
        "range": "51–60",
        "name": "Carnival",
        "status": "PROPOSED",
        "card": "THE FAIR",
        "macguffin": "a gold ticket for the county scooter circus, taped to a prize duck",
        "teaches": "Loops. Rides that return you. Progress that is circular on purpose.",
        "why": (
            "Hallway, building, cave — next is a ride that dumps you where you started unless "
            "you get off at the right height. A carnival is stacked by nature: Ferris legs, "
            "helter-skelter as switchback floors, a midway that only makes sense going left "
            "at night. Belts we already have become a coaster. The prize duck is Scoot "
            "meeting a worse version of himself. Keep the story mean and small."
        ),
        "image": "06_carnival.jpg",
        "caption": "Suggested carnival backdrop — Ferris wheel, helter-skelter, midway stalls, boardwalk play band.",
        "levels": [
            ("51", "Ticket Booth", "The fair faces right, once", "The china got entered as a pie tin. First prize is a gold ticket. Scoot did not enter.", "New gate, old LTR."),
            ("52", "Ferris Legs", "Climb the support, reverse the rail", "The ticket is in a gondola. Gondolas do not wait. The rail only goes left at the top.", "Climb + reverse on a circle."),
            ("53", "Funhouse Mirror", "False floors", "Mirrors lie about which way is out. The ticket does not.", "Dead End East as a joke."),
            ("54", "Bumper Pit", "The floor hits back", "Bumper cars. Hugging the bumper is still a bad policy.", "Taxi roofs that want to fight."),
            ("55", "Helter Skelter", "A spiral is just stacked reverse", "The slide is a decade of mill geometry wearing stripes.", "Switchbacks you paid to ride."),
            ("56", "Midway West", "Games pointing the wrong way", "Every stall faces left after dark. The egg is in the duck-pond booth. Of course it is.", "West Wing as a midway."),
            ("57", "Belt Coaster", "You do not pick the direction", "The coaster belt runs the ride's way. Get off at the loft, then walk.", "Gear Loft as a coaster."),
            ("58", "Night Lights", "Everything is open", "Moles under the tent. Moths in the bulbs. Wait the moles.", "Night Shift, bulbs."),
            ("59", "Gale Tent", "The canvas wants you in Kansas", "Hold the line. The prize duck is in the loft of the tent.", "Wind + reverse into canvas."),
            ("60", "Prize Booth", "The fair is a building", "Scoot takes the gold ticket. The prize duck stares. Scoot stares back. He keeps the ticket.", "Loop. Decade lock."),
        ],
    },
    {
        "range": "61–70",
        "name": "Alpine Town",
        "status": "PROPOSED",
        "card": "THE TOWN",
        "macguffin": "a postcard Grandma asked for, plus a cowbell that will not shut up",
        "teaches": "An inhabited mountain: switchbacks with doors, chimneys, a lift, a post office.",
        "why": (
            "We already had a canyon. A canyon is a drop. A town is people who live on the "
            "drop. Goats we already own sit on ledges that are streets. The postcard is the "
            "quietest MacGuffin in the game, which is the point — after a carnival, the "
            "player should want air and chimneys. Reverse here is 'the other alley,' not a "
            "gimmick. The cowbell is the scooter bell's cousin, and it will get stolen."
        ),
        "image": "07_alpine.jpg",
        "caption": "Suggested alpine backdrop — chalets on terraces, snow peaks, cobbles as the play band.",
        "levels": [
            ("61", "Base Camp", "The mountain faces right, once", "Grandma wanted a postcard. The town is up. The cowbell is already ringing.", "New gate."),
            ("62", "Switch Street", "A street that folds", "The road turns back on itself. Scoot argues with the architecture and loses, again.", "Inhabited switchbacks."),
            ("63", "Chimney Climb", "Roofs as floors", "The postcard is drying on a chimney. Hop the sacks. The sacks are snow.", "Mill climb, snow paint."),
            ("64", "Left Alley", "The alley only goes west", "West is where the bakers live. The postcard smells like rye.", "Catwalk West as an alley."),
            ("65", "Lift House", "The cart goes up the mountain", "The service lift still works. The goats packed it. That is the rest of the news.", "Elevator Shaft, alpine."),
            ("66", "West Terrace", "A terrace pointing the wrong way", "A whole street numbered by goats.", "West Wing, town."),
            ("67", "Roof Snow", "Belts of weather", "Wind and snow shove east. The loft is west.", "Gear Loft + gale."),
            ("68", "Night Village", "Both ways, lamplight", "Moles in the cellars. Crows on the peaks. Wait the moles.", "Night Shift, chimneys."),
            ("69", "Whiteout", "Up is not clearer", "The roof wants Scoot in a drift. The post office wants him west.", "Dust Storm, snow."),
            ("70", "Post Office", "The town is a building", "Scoot mails the postcard. The cowbell is still ringing. Grandma will hear it from the farm.", "Loop. Handoff: the bell is too loud."),
        ],
    },
    {
        "range": "71–80",
        "name": "Rooftops",
        "status": "PROPOSED",
        "card": "THE ROOFS",
        "macguffin": "the postcard, stolen by a pigeon syndicate onto the billboards",
        "teaches": "Layered roofs. Billboards you have to go left to read. Fire escapes as reverse stairs.",
        "why": (
            "City already happened at street level. Roofs are the city turned into a mill: "
            "water towers as silos, AC units as belts, a blank billboard as a wall that is "
            "also a floor. Leftward progress here is literal literacy — the copy on the board "
            "faces the other way. Pigeons we already have become a syndicate because the "
            "story already taught them as filing clerks. Neon letter at the end is Neon Run "
            "raised one storey."
        ),
        "image": "08_rooftops.jpg",
        "caption": "Suggested rooftop backdrop — water towers, fire escapes, blank billboard, tar play band.",
        "levels": [
            ("71", "Fire Escape", "The stairs go up and back", "Pigeons filed the postcard under Sky. Bounce up there and file a complaint.", "City 12, one floor up."),
            ("72", "Water Tower", "A silo that is a roof", "The postcard is taped to the tank. The tank is a climb.", "Mill silo as a toy."),
            ("73", "Billboard Back", "Read it from the other side", "The copy faces the street. Scoot is on the roof. Turn around.", "Reverse as reading."),
            ("74", "Dead End Antenna", "East is a very confident aerial", "West is the postcard. Scoot has been betrayed by signage before.", "Dead End East, roofs."),
            ("75", "Service Lift", "The cart goes up a building", "The lift still works. Drones packed it.", "Elevator Shaft, city."),
            ("76", "West Roof", "A whole roof pointing the wrong way", "Numbered by pigeons.", "West Wing, tar."),
            ("77", "AC Belts", "The units shove you", "Belts of warm air run east. The loft of the billboard is west.", "Gear Loft, HVAC."),
            ("78", "Night Cats", "Both ways, in the dark", "Cats. Drones. Wait the dumpster lids on the fire escape.", "Night Shift, roofs."),
            ("79", "Gale Edge", "Up is not safer", "The parapet wants Scoot in traffic. The billboard loft wants him west.", "Dust Storm, height."),
            ("80", "Neon Letter", "The roof is a building", "Scoot peels the postcard off the glass. It is addressed to Grandma. The pigeons had a stamp.", "Loop. Neon Run's cousin."),
        ],
    },
    {
        "range": "81–90",
        "name": "The Manor",
        "status": "PROPOSED",
        "card": "THE HOUSE",
        "macguffin": "a silver-spoon invitation that came with the postcard",
        "teaches": "Rooms. Doors that are just geometry. A house cut in cross-section.",
        "why": (
            "Once roofs exist, a house is the honest next map: stacked rooms, a west gallery, "
            "a dumbwaiter as the vertical cart, a false library as Dead End East with books. "
            "No new combat. The joke is Scoot in a dining room. The camera we shipped for the "
            "mill is what makes a cross-section readable — without Y-follow, a loft clock "
            "is a clip. The spoon will be for the Scoot Cup. Players who have been paying "
            "attention to Grandma already know that."
        ),
        "image": "09_manor.jpg",
        "caption": "Suggested manor backdrop — foyer, stair, gallery, clock loft, dining hall as stacked rooms.",
        "levels": [
            ("81", "Foyer", "A room that still faces right", "The invitation said eight o'clock. The raccoon from the mill is on the staff. Of course he is.", "New gate, old verbs."),
            ("82", "Stairwell", "Climb as etiquette", "The stairs only count if you take them. Scoot does hops.", "Loading Dock as stairs."),
            ("83", "Gallery West", "The paintings face the other way", "West is the good wing. East is a very confident bust.", "Catwalk West as a gallery."),
            ("84", "False Library", "A door that is a wall", "The obvious door is a painting. The real door is left and up.", "Dead End East as books."),
            ("85", "Dumbwaiter", "The cart goes up a house", "The service lift still works. It is full of spoons.", "Elevator Shaft, polite."),
            ("86", "West Gallery", "A hallway pointing the wrong way", "Numbered by butlers.", "West Wing, carpets."),
            ("87", "Clock Loft", "Gears again", "Belts in the clock run the hour's way. Get off at the loft, then walk.", "Gear Loft as a clock."),
            ("88", "Night Halls", "Both ways, candles", "Moles in the cellar. Moths in the sconces. Wait the moles.", "Night Shift, manor."),
            ("89", "Storm Attic", "Up is not quieter", "The roof wants Scoot in the weather. The loft wants him west.", "Dust Storm, rafters."),
            ("90", "Dining Room", "The house is a building", "Scoot takes the spoon. Grandma says it is for the Scoot Cup. He did not know there was a Scoot Cup.", "Loop. Handoff to the finale."),
        ],
    },
    {
        "range": "91–100",
        "name": "Scoot Cup",
        "status": "PROPOSED",
        "card": "THE CUP",
        "macguffin": "the cup itself — and the original sandwich, rematch",
        "teaches": "Everything. Then Grandma's picnic rematch. The game you already know, louder.",
        "why": (
            "A 100-level game that invents a new verb at 91 is a different game. The Cup is "
            "a remix: farm verbs, city gadgets, whip, climb, reverse, tide, loops, roofs, "
            "rooms. Each heat is a decade wearing a ribbon. Stage 100 is not a boss with a "
            "health bar. It is Moonlit Fair plus Pie Safe plus the sandwich. Scoot has been "
            "chasing lunch since stage 1. Let him sit down."
        ),
        "image": "10_scoot_cup.jpg",
        "caption": "Suggested finale backdrop — grandstand, lanterns, sandwich and ribbon, dirt-track play band.",
        "levels": [
            ("91", "Qualifier", "Farm verbs, cup paint", "The Cup is at the fairground. The sandwich is the trophy. Scoot has seen this movie.", "Farmyard, louder."),
            ("92", "Heat Two", "City gadgets on dirt", "Rats in the infield. A taxi used as a float. Hugging the bumper is still a bad policy.", "City on a track."),
            ("93", "Climb Heat", "The stands are a mill", "Hop the sacks. The sacks are spectators. The flag is on the catwalk.", "Loading Dock as a heat."),
            ("94", "Reverse Heat", "Hold left in front of a crowd", "The track only goes left after the climb. The crowd has opinions.", "Catwalk West as a heat."),
            ("95", "Vertical Final", "The cart goes up the cup", "The service lift still works. It is full of pie.", "Elevator Shaft as a heat."),
            ("96", "Discovery Heat", "A wing pointing the wrong way", "The egg is in the west bleachers. Miss it and miss the encore.", "West Wing as a heat."),
            ("97", "Belt Final", "The track shoves you", "Belts run the Cup's way. Get off at the loft, then walk.", "Gear Loft as a heat."),
            ("98", "Night Cup", "Both ways, fireworks", "Moles in the infield. Moths in the lanterns. Wait the moles.", "Night Shift as a heat."),
            ("99", "Gale Cup", "Up is not safer", "The roof wants Scoot in the stands. The loft wants him west.", "Dust Storm as a heat."),
            ("100", "Picnic Rematch", "Sit down", "The raccoon is tired. The hawk is tired. Scoot is not, and then he is. He takes the sandwich. Grandma says it is a little dusty and also the best lunch of his life. They give him a ribbon for Fastest Picnic. He already has one.", "The whole game in one picnic. Decade lock. Game lock."),
        ],
    },
]


def decade_block(d, s, usable):
    bits = []
    status_hex = "#2a9d3f" if d["status"] == "SHIPPED" else "#3a86ff"
    bits.append(Paragraph(
        f"{esc(d['range'])}  ·  {esc(d['name'])}  ·  "
        f"<font color='{status_hex}'>{esc(d['status'])}</font>",
        s["h1"],
    ))
    bits.append(Paragraph(
        f"Intro card: <b>{esc(d['card'])}</b>"
        f" &nbsp;&nbsp;|&nbsp;&nbsp; MacGuffin: <i>{esc(d['macguffin'])}</i>",
        s["h2"],
    ))
    bits.append(img(BG / d["image"], usable * 0.72))
    bits.append(Paragraph(d["caption"], s["caption"]))
    bits.append(Paragraph(f"<b>What it teaches.</b> {esc(d['teaches'])}", s["body"]))
    bits.append(Paragraph(f"<b>Why this decade.</b> {esc(d['why'])}", s["body"]))
    rows = [["#", "Stage", "Skill", "Story snippet", "Why this stage"]]
    rows.extend(d["levels"])
    bits.append(make_table(rows, [0.38 * inch, 1.35 * inch, 1.55 * inch, 3.55 * inch, 2.47 * inch], s))
    return bits


def build():
    s = styles()
    usable = PAGE[0] - 72
    story = []

    # Cover
    story.append(Spacer(1, 8))
    story.append(img(BG / "00_cover_scoot.jpg", usable * 0.92))
    story.append(Paragraph("Duck Scooter Dash", s["cover"]))
    story.append(Paragraph(
        "100 stages  ·  10 worlds  ·  one joke that keeps getting out of hand",
        s["sub"],
    ))
    story.append(Paragraph(
        "A level-design brief for the presentation. Stages <b>1–40 are in the game</b>. "
        "Stages <b>41–100 are the recommended next six decades</b>, written in the same "
        "voice, with the same packing: a MacGuffin, a skill, a new sky, a new track, "
        "and a two-line story on the intro card. Background paintings are concept stills "
        "for slides, not in-engine screenshots.",
        s["body"],
    ))

    story.append(PageBreak())
    story.append(Paragraph("How the 100 is built", s["h1"]))
    story.append(Paragraph(
        "The game is a side-scroller about a rubber duck on a kick scooter. The comedy "
        "is dry and small. The design rule that actually matters is: <b>the read is the game</b>. "
        "A player has a short jump, a duck, a shot, and later a whip. Each decade adds "
        "one new sentence in space, not a new movesheet.",
        s["body"],
    ))
    rules = [
        ["Rule", "What it means in practice"],
        ["Ten stages, one world", "Farm, City, World, Mill already prove the packing. Later decades copy it."],
        ["One MacGuffin", "Sandwich → ticket/bell → clapper → pie → plate → gold ticket → postcard → neon letter → spoon → cup/sandwich rematch."],
        ["One new sentence", "Farm = verbs. City = gadgets. World = whip + postcards. Mill = climb and reverse. Then tide, loops, town, roofs, rooms, remix."],
        ["Story is two lines", "Intro card, Palatino-plain, Scoot does not make speeches. Decade 10 of each world is a lock line, not a boss HP bar."],
        ["Reuse the verb set", "Ponds stay death. Carts stay rides. Belts stay shove. A raccoon is story. A hawk is a chase. No fourth combat system."],
        ["1–30 stay a hallway", "Mill is the first world allowed to look left and up. That camera is gated so shipped stages do not move."],
        ["New bodies, old clips", "A new backdrop uses the combat we already have until new clips arrive."],
    ]
    story.append(make_table(rules, [2.0 * inch, 7.3 * inch], s))
    story.append(Spacer(1, 8))
    story.append(Paragraph("The through-line, said as a chain", s["h2"]))
    story.append(Paragraph(
        "A frog steals lunch. A ticket on the jelly wins a bell. A hawk steals the clapper; "
        "Scoot puts the ding back; Grandma hears it from the farm. She mails a pie; a raccoon "
        "rolls it into the mill. The plate washes into the caves. The china is entered at the "
        "fair; Scoot wins a gold ticket. Grandma wants a postcard from the mountain town; "
        "pigeons steal it onto the roofs. The postcard was an invitation; the spoon is for "
        "the Scoot Cup. The trophy is the sandwich. He sits down.",
        s["body"],
    ))

    story.append(PageBreak())
    story.append(Paragraph("Decade map", s["h1"]))
    story.append(Paragraph(
        "<font color='#2a9d3f'><b>SHIPPED</b></font> is in the build. "
        "<font color='#3a86ff'><b>PROPOSED</b></font> is the recommended remainder. "
        "Each row is ten stages, ten tracks, ten skies.",
        s["body"],
    ))
    overview = [["Stages", "World", "Status", "MacGuffin", "The new sentence"]]
    for d in DECADES:
        overview.append([d["range"], d["name"], d["status"], d["macguffin"], d["teaches"]])
    story.append(make_table(overview, [0.75 * inch, 1.15 * inch, 0.95 * inch, 2.85 * inch, 3.6 * inch], s))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Why not 100 unique biomes", s["h2"]))
    story.append(Paragraph(
        "Ten worlds of ten is how a player remembers a game this size. A unique theme every "
        "stage would make 100 into a slideshow. Repeating the mill's climb/reverse lesson "
        "inside caves, carnival, town, roofs, and manor is the point: the camera we just "
        "shipped has to earn a career, not a cameo. The Cup is the exam.",
        s["body"],
    ))

    for d in DECADES:
        story.append(PageBreak())
        story.extend(decade_block(d, s, usable))

    story.append(PageBreak())
    story.append(Paragraph("What Mill changed in the engine (already shipped)", s["h1"]))
    story.append(Paragraph(
        "Stages 31–40 are not only new data. They needed three engine doors that 1–30 never "
        "open. Farm, city, and world tour still use the original X-only camera (player one-third "
        "in from the left, Y glued at 0) so they stay pixel-identical.",
        s["body"],
    ))
    engine = [
        ["Door", "Why the mill needs it"],
        ["Look-ahead by facing", "Going left with a right-facing camera shows the wall behind you. A catwalk west of the climb would be off-screen. Mill sits Scoot at two-thirds when facing left."],
        ["Camera Y", "Ground is at 230px. Catwalk ~88. Loft ~18. A 270px window cannot frame a loft without scrolling. HUD stays glued to the screen."],
        ["Goal as a coordinate", "Before Mill the flag was hardcoded to width-minus-120 on the floor. Reverse stages cannot finish at the right wall. The flag now sits on a loft, west of spawn, after a loop."],
        ["Ledges and saves", "Catwalks are wide planks at a given height, not 30px hay bales. Checkpoints are [x, y] along the route so dying on a reverse wing does not dump you at pond-logic."],
    ]
    story.append(make_table(engine, [1.9 * inch, 7.4 * inch], s))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Jump budget did not change: about 79px of height and 92px of honest gap. Climb is "
        "stacked platforms, bounce flowers, and the vertical carts the travel world already "
        "had. Reverse is geometry, not a new button.",
        s["body"],
    ))
    story.append(Paragraph(
        "Music is still live synth, one TRACK object per stage. Mill skies are millDay, "
        "millDusk, millNight, millLoft, millDust, millStorm, millFair — the same trick City "
        "used with day/dusk/rain/neon.",
        s["body"],
    ))

    story.append(PageBreak())
    story.append(Paragraph("How to use this in the room", s["h1"]))
    story.append(Paragraph(
        "Lead with the cover and the through-line (one paragraph). Put the decade map up "
        "while you say 'ten worlds of ten.' Spend the time on Farm (verbs), City (gadgets), "
        "World (whip + postcards), and Mill (the map is not a hallway) — those four are "
        "playable. Treat 41–100 as the promised career of the mill camera: caves, carnival, "
        "town, roofs, manor, cup. Close on Picnic Rematch. The sandwich was the first "
        "MacGuffin and the last.",
        s["body"],
    ))
    story.append(Paragraph("Slide order that fits a short slot", s["h2"]))
    slides = [
        ["Slide", "Show", "Say"],
        ["1", "Cover painting", "A duck on a scooter. 100 stages. The joke is lunch."],
        ["2", "Decade map", "Four worlds shipped. Six proposed. Same packing every time."],
        ["3", "Farm still", "Verbs. Sandwich. Ten skies."],
        ["4", "City still", "Gadgets. Ticket becomes a bell."],
        ["5", "World still", "Hawk steals the clapper. Grandma hears the ding."],
        ["6", "Mill still", "Climb, reverse, camera looks left and up. Pie."],
        ["7", "Caves / Carnival / Town", "The mill camera gets a career, not a cameo."],
        ["8", "Roofs / Manor / Cup", "Rooms, then the sandwich rematch."],
        ["9", "Engine doors", "Look-ahead, Y, flag as a coordinate. 1–30 untouched."],
    ]
    story.append(make_table(slides, [0.7 * inch, 2.4 * inch, 6.2 * inch], s))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
    story.append(Paragraph(
        "Playable now: stages 1–40 in the web build (warp IDKFA can open Loading Dock). "
        "Repo: cho-simba-one/scootduckdash, commit that landed the mill. Concept stills in "
        "this PDF are 16:9 pixel paintings for slides — they are not in-game captures.",
        s["body"],
    ))
    story.append(Paragraph(
        "Captain's standing order, still in force: a new body uses whatever combat clips "
        "we already have until new clips arrive. This plan does not mix those two piles.",
        s["body"],
    ))

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=PAGE,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=36,
        title="Duck Scooter Dash — 100-level plan",
        author="Duck Scooter Dash",
        subject="Level design presentation brief",
    )
    doc.build(story, onFirstPage=cover_page, onLaterPages=header_footer)
    print(f"wrote {OUT}  pages~{doc.page}")


if __name__ == "__main__":
    build()

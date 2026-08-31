# Duck Scooter Dash — Monetization Decision Brief
Prepared by Medici (CFO hat, CEO overlay). Date: per session. Sources: `README.md`, project tree, Captain's brief.

## RECOMMENDATION (one line)
Do not build payment infrastructure yet. The binding constraint is distribution, not monetization: submit the game to web portals (CrazyGames first, Poki second) and put a pay-what-you-want build on itch.io this month, and let retention data from strangers decide whether the paid level-pack, Steam, or mobile is worth another hour.

## THE STRUCTURAL FACT EVERYTHING HANGS ON
[KNOWN, from brief]: no existing audience, no store presence, no backend, solo operator.
A monetization model multiplies audience by conversion by price. The first factor is currently zero. Every path below is really a distribution channel first and a payment rail second. Rank accordingly.

## RANKED SHORT-LIST

### 1. Web portals — CrazyGames / Poki
- Upfront cost: $0 [KNOWN — both run free self-serve/submission developer programs].
- Effort: low-medium. SDK integration (ad breaks between levels, loading events) — days, not weeks, given the clean vanilla-JS codebase [INFERRED from project structure].
- Revenue model: revenue share on ads the PORTAL runs around and between sessions. Rates, fill, and rev-share percentages: [UNKNOWN — both publish developer terms; read them before signing. Some portals want exclusivity or timed exclusivity — check].
- Realistic revenue: [ASSUMPTION, wide] $0 if rejected or ignored; tens to low hundreds of dollars/month if featured and retention is decent; portal hit games reportedly earn much more but that is survivor data, not a plan.
- Why ranked #1: it is the only option on this list where someone else supplies the players. It also produces the demand data every other option needs.
- What must be true: portal editors accept it (they curate); players who didn't seek it out still finish several levels; the game reads well in a 30-second first impression.
- Note on ads: portal-served interstitials between levels are a different animal from stuffing banner ads inside your own build. The portal context sets player expectations; your premium feel survives it. Self-served in-game ads do not get this pass (see #7).

### 2. itch.io pay-what-you-want
- Upfront cost: $0 [KNOWN — itch charges no listing fee; default platform cut ~10%, adjustable — KNOWN public terms, verify current].
- Effort: very low. The game already runs from `index.html` with no build step [KNOWN — README]. An HTML5 upload is an afternoon.
- Realistic revenue: [ASSUMPTION] $0–$100 total for a no-audience launch. PWYW on itch without an audience is a tip jar, not a business. That is fine — its job here is signal and a permanent home URL.
- What must be true: nothing. This is nearly free and produces a public artifact, a comments section, and a place to send anyone who likes the portal version.

### 3. Premium level-pack unlock (worlds 1–4 free, decades 5–10 paid)
- Upfront cost: ~$0 for the mechanism if sold as an itch.io paid DLC/key or a Stripe payment link that emails an unlock code. [KNOWN — no backend exists, so entitlement must be client-side.]
- Effort: medium. Unlock code + localStorage gate is easy; the 60 levels and 4 bosses are the real cost — that content is planned but NOT built [KNOWN — brief; only 40 levels exist].
- Piracy note: a client-side unlock in readable vanilla JS is trivially crackable. For a family game at low price this is an acceptable loss, not a blocker — but know it going in.
- Price point: [ASSUMPTION] $3–$5 one-time fits the "charming premium web game" position. At itch's cut, ~$2.70–$4.50 net per sale.
- Realistic revenue: [ASSUMPTION] conversion from free web players to paid unlock in low single-digit percent AT BEST; a rough model: 10,000 free players × 1% × $4 net ≈ $400. If conversion is half that, $200. If you never reach 10,000 players, it rounds to zero — which is why this waits for the portal data.
- Why ranked #3: it is the RIGHT model for this game (honest, matches the free-demo-then-buy structure Mario-likes trained players on), but wrong TIMING until demand is shown and the paid content exists.
- What must be true: measurable cohort of players finishing world 4 and wanting more. That is a checkable fact, not a hope.

### 4. Steam via Electron/Tauri wrap
- Upfront cost: $100 Steam Direct fee [KNOWN — brief; recoupable after $1,000 gross per Steam's published terms — KNOWN public, verify current]. Steam cut 30% [KNOWN public].
- Effort: medium-high. Tauri/Electron wrap, achievements, store page, capsule art, builds — call it 1–3 weeks of attention [ASSUMPTION].
- Realistic revenue: [ASSUMPTION, rough industry heuristic, wide] the median outcome for an unmarketed hobby title on Steam is low hundreds of dollars gross; many earn less than the fee. Steam reviewers are also harsh on games that read as "wrapped web game," which is a real ratings risk for a canvas title.
- What must be true: proven retention elsewhere, all 100 levels + bosses shipped, and enough wishlists gathered BEFORE launch (Steam's algorithm rewards launch-week velocity — KNOWN public mechanic). Steam is a graduation, not a starting line.

### 5. Mobile stores via Capacitor
- Upfront cost: Apple $99/yr, Google $25 one-time [KNOWN — brief].
- Effort: high. Toolchain setup (Node + Android SDK/Java not installed — KNOWN, README roadmap), two review processes, ongoing update duty, and Apple REQUIRES its IAP for digital unlocks at 30% (15% under Small Business Program — KNOWN public terms, verify).
- Realistic revenue: [ASSUMPTION] near-zero without marketing spend; mobile store organic discovery for unknown premium games is the worst on this list.
- Compliance drag: a family-friendly game attracts children; children's-app rules (COPPA in the US, store kids-category policies) constrain ads and data. If mobile ever happens with ads, that needs a real lawyer before money moves. [Structural read, not legal advice.]
- Verdict: last, if ever. The PWA already installs on phones [KNOWN — manifest + service worker on disk], which captures most of the mobile value at zero fee.

### 6. Cosmetics
- Poor fit. Cosmetics monetize identity display, which needs multiplayer, accounts, or social surface. This game has none [KNOWN — no backend, single-player]. A hat shop for an audience of one is a novelty, not revenue. Skip. (A couple of free unlockable skins as retention rewards: cheap and worth doing — just not as a paid SKU.)

### 7. Self-served in-game ads (AdSense/AdMob inside your own build)
- Recommend against. Three reasons, no drama: (a) ad RPMs at tiny volume produce [ASSUMPTION] cents-to-dollars per thousand plays — immaterial money; (b) ads inside a handcrafted, procedural-music, premium-feel game destroy the exact quality that makes the level-pack model viable later — you'd trade the $4 sale for $0.002 of impressions; (c) kid-audience ad compliance risk (see #5). Portal-served ads (#1) are the acceptable form of this.

## THE ONE ASSUMPTION EVERYTHING RESTS ON
That strangers — not the Captain, not the crew — play past world 1 and come back. Every revenue figure above collapses to zero if day-1 retention from portal traffic is negligible, and every path gets better if it's strong. This is checkable within weeks for $0, which is why the sequencing below front-loads it. If retention is strong at half my assumed conversion, the level pack still pays for its own dev time in attention terms; if retention is weak, no channel on this list saves it and the honest move is to ship it free, take the portfolio credit, and move on.

## RISKS AND LOOSE ENDS (flat list, all of it)
- Portal rejection is a real possibility; both curate. Mitigation: itch is unconditional, so there is always a public home.
- Portal exclusivity clauses could conflict with a later Steam/itch paid release — read terms before integrating any SDK. [UNKNOWN until read.]
- The 60 remaining levels + 4 bosses are unbuilt [KNOWN]. The paid-pack model sells a promise until they exist. Do not take money for undelivered decades.
- Brand collision: THE FIST's crude-cheerful voice ("Please Fist Responsibly") is an asset elsewhere and a liability on kids' game portals and app stores. Publish the game under its own clean identity; keep the Fist branding off the storefront. This is contextual discipline, not sanitizing the brand.
- Mario-LIKE is fine; Mario assets/names are not. Nothing on disk suggests a problem [INFERRED from file listing]; keep it that way.
- All platform fees/cuts cited as KNOWN public terms are stable but should be verified against current pages before committing — I have no live data.
- No backend means no server-side analytics; portal dashboards + a lightweight privacy-safe counter will have to serve as the retention instrument. Plan the measurement before launch or the cheap test produces no data.

## SEQUENCING
- **This week:** itch.io page, PWYW, HTML5 embed. Add a discreet "enjoying this? tip the duck" link in the title screen — the tip trickle is a weak but free demand signal.
- **Weeks 1–3:** CrazyGames self-serve submission with their SDK; Poki pitch in parallel. Instrument level-completion events through whatever the portal SDK offers.
- **Weeks 4–8 (decision gate):** read the data. Meaningful metric: % of organic players clearing world 1, and any repeat sessions. If a real cohort finishes world 4, greenlight decades 5–10 as the paid pack ($3–$5 via itch keys — no custom payment infra). If not, stop spending attention on monetization.
- **Only after the paid pack sells at all:** consider Steam ($100, full 100-level build, wishlist campaign first). Mobile stores: default no.

## CHEAPEST DEMAND TEST
itch.io + CrazyGames submission: $0 cash, roughly a weekend of attention, and it answers the only question that matters — do strangers keep playing — before a single line of payment code is written.

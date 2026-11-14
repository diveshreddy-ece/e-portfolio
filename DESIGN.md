---
name: Divesh Reddy, Access Pass
description: One credential, three track colours; a portfolio built as an all-access pass to a tech event.
colors:
  ink: "#101014"
  ink-raised: "#1b1b21"
  ink-rule: "#2e2e37"
  stock: "#fbfbf8"
  stock-shade: "#f0f0ea"
  stock-rule: "#d6d6cd"
  on-ink: "#f4f4f0"
  on-ink-muted: "#b0b0b9"
  on-stock-muted: "#52525b"
  gap-rule: "#8d8d86"
  vlsi: "#2347ff"
  vlsi-press: "#1733d6"
  crew: "#ff6a13"
  crew-press: "#e85a06"
  media: "#12a150"
  media-press: "#0d8a43"
  chip-gold: "#d4b062"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3.75rem, 8.4vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3.5rem, 10vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.84
    letterSpacing: "-0.01em"
  headline-zone:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.005em"
  title-sm:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.01em"
  lede:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "clamp(1.1875rem, 1.6vw, 1.375rem)"
    fontWeight: 500
    lineHeight: 1.45
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  action:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  chip: "2px"
  tag: "4px"
  control: "6px"
  button: "8px"
  stub: "10px"
  card: "12px"
  sheet: "16px"
  pass: "18px"
  round: "50%"
spacing:
  xs: "6px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "48px"
  gutter: "clamp(16px, 4vw, 56px)"
  section: "clamp(56px, 8vw, 104px)"
  zone: "clamp(72px, 10vw, 128px)"
  strip: "60px"
  max: "1320px"
components:
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0 18px"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0 18px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.stock-shade}"
  strip-cta:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "44px"
  track-vlsi:
    backgroundColor: "{colors.vlsi}"
    textColor: "#ffffff"
  track-vlsi-hover:
    backgroundColor: "{colors.vlsi-press}"
  track-crew:
    backgroundColor: "{colors.crew}"
    textColor: "{colors.ink}"
  track-crew-hover:
    backgroundColor: "{colors.crew-press}"
  track-media:
    backgroundColor: "{colors.media}"
    textColor: "{colors.ink}"
  track-media-hover:
    backgroundColor: "{colors.media-press}"
  tear-off-stub:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.stub}"
    height: "64px"
  credential-stub:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "22px 22px 20px 20px"
  tag:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "6px 8px"
  gap-slot:
    backgroundColor: "transparent"
    textColor: "{colors.on-stock-muted}"
    rounded: "{rounded.card}"
    padding: "20px 22px"
  sheet-head:
    backgroundColor: "{colors.vlsi}"
    textColor: "#ffffff"
    padding: "10px 10px 10px 24px"
  reel-play:
    backgroundColor: "{colors.media}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "56px"
---

# Design System: Divesh Reddy, Access Pass

## Overview

**Creative North Star: "The All-Access Pass"**

The whole site is one event credential. An ink backdrop is the venue at night; pass-white stock is the printed card; three track colours are the ways in, and each one owns entire regions of the page rather than accenting them. A visitor meets the person on the pass, picks a track, reads proof stamped with its provenance, and leaves with a tear-off stub. Every device on the page is something a real lanyard pass or event printout would carry: punched slots, perforations, a smart-card chip pad, printed stripes, rubber stamps.

Density is confident and print-like: huge condensed caps for names and track titles, calm Barlow for reading, and a monospaced voice reserved for actual data. Surfaces are flat printed colour. The dark-neon developer portfolio and the headline-left, 3D-toy-right split hero are the rejected references; the pass is a credential with the name, not a toy beside it.

**Key Characteristics:**
- Ink ground, stock cards, three full-bleed track fields (VLSI blue, Crew orange, Media green).
- Barlow Condensed 800 caps for identity and track names; Barlow for prose; JetBrains Mono for real data only.
- Event-print devices (perforated stubs, punch dots, dashed tear lines, chip pad, rotated stamp) instead of generic cards.
- Flat printed colour: no glows, no sheen gradients, no glass.
- One continuous motion: the pass is issued on load, then a single signal trace draws down the page in each region's colour, becoming the VLSI flow rail, the event log's progress line and the featured edit's frame, and ending at the contact heading.

## Colors

A three-colour event palette printed on ink and white stock; each track colour is a territory, not a highlight.

### Primary
- **Pass Blue (VLSI)** (vlsi): The VLSI / RTL track field, the project write-up sheet header, flow-rail progress, project stub tabs, and the text-link colour on stock. Carries white text (vlsi-press darkens it on hover).

### Secondary
- **Event Orange (Crew)** (crew): The Leadership track field, the strap, the second hero name line, the availability stamp, focus rings on ink, selection and caret. Carries ink text, chosen over white for contrast (crew-press on hover).

### Tertiary
- **Field Green (Media)** (media): The Video track field, the play button on reels, the green resume stub tab, and text links on ink. Carries ink text, chosen over white for contrast (media-press on hover).
- **Chip Gold** (chip-gold): Only the smart-card chip pad painted on the 3D pass face. Never a UI colour.

### Neutral
- **Venue Ink** (ink): The page backdrop, the pass strip, the pass header band, outline borders and solid buttons on stock.
- **Raised Ink** (ink-raised): Hover fill for strip links on ink.
- **Ink Rule** (ink-rule): Hairlines and dividers on ink; the strip's resting bottom rule before a track is entered.
- **Pass Stock** (stock): The pass card, the About zone, track-body zones, stubs on ink, the write-up sheet.
- **Stock Shade** (stock-shade): Role chips in the event log, outline-button hover, the embedded-build stub tab.
- **Stock Rule** (stock-rule): Hairlines and tag borders on stock, the flow rail's unfilled track.
- **Ink-side Text** (on-ink) and **Ink-side Muted** (on-ink-muted): Primary and secondary text on ink.
- **Stock-side Muted** (on-stock-muted): Secondary text on stock; ink itself is the primary text on stock.
- **Gap Rule** (gap-rule): The dashed border of honest gap slots on stock.

### Named Rules
**The Territory Rule.** A track colour fills whole regions (track bands, band headers, the sheet header) or marks that track's own objects (stub tabs, chips, play button). It is never sprinkled as a generic accent on another track's content.

**The Contrast Pairing Rule.** VLSI blue carries white text; Crew orange and Media green carry ink text. Do not flip these pairings.

**The Live Strip Rule.** The pass strip's 4px bottom rule takes the colour of the track zone the visitor is in, and rests on ink-rule elsewhere.

## Typography

**Display Font:** Barlow Condensed 700/800 (with Arial Narrow, sans-serif)
**Body Font:** Barlow 400/500/600 (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono 500 (with ui-monospace, Menlo, monospace)

**Character:** Event-signage caps against a plain, friendly reading face, with a monospace voice that only appears where something is a datum. All three are self-hosted woff2 files.

### Hierarchy
- **Display** (800, clamp 3.75 to 6rem, 0.86): The hero name only, uppercase, second line in Crew orange.
- **Headline** (800, clamp 3.5 to 6rem, 0.84): Track band titles (VLSI / RTL, Leadership, Video), uppercase.
- **Headline Zone** (800, clamp 2.75 to 5rem, 0.9): Stock and ink zone titles (Who I am, Let's work together); the track band names in the Explore row use the same weight at clamp 2.5 to 4rem.
- **Title** (700, 1.75rem, 1): Project stub names, flow stages, write-up sheet title (800 at clamp 2 to 3rem); group titles at 1.625rem.
- **Title Small** (700, 1.375rem, 1.1): Reel titles, event-log names (1.5rem), stub titles (1.25rem).
- **Lede** (500, clamp 1.1875 to 1.375rem, 1.45): Opening paragraph of a zone, max 46ch. The band lede is set as condensed 700 caps instead.
- **Body** (400, 1.0625rem, 1.55): Reading text, max 60 to 62ch, text-wrap pretty.
- **Action** (700 condensed, 1.0625rem, 0.04em, uppercase): Buttons and the Contact CTA.
- **Label** (500 mono, 0.8125rem): Tools and tags, years, roles, dl terms, gap labels, file kind on stubs, contact channel names, write-up section heads.

### Named Rules
**The Real Data Rule.** JetBrains Mono sets only things that are data: tools, years, roles, field labels, file kinds, gap status. Never prose, never invented IDs or serial numbers.

**The No Kicker Rule.** Headings stand alone. Nothing small, tracked or monospaced sits above a heading as an eyebrow.

**The Caps For Names Rule.** Condensed caps are for names, track titles and actions. Sentences are set in Barlow, sentence case.

## Layout

One strict column grid inside a 1320px max container with a fluid gutter (clamp 16 to 56px). Sections alternate between ink and stock zones and full-bleed track bands; each zone is a wall of one material, separated by colour change rather than by cards. The sticky pass strip is 60px (56px under 860px). Content grids are two-column at 6/6, 7/5 or 7/4 ratios and collapse to one column under 860px.

The hero puts the 3D pass and the name side by side on desktop with the three track bands as a full-width bottom row of the first viewport. Under 860px the hero reorders: pass, name, one line, then the track bands, with the stamp and resume stubs after. Under 600px the track bands stack.

Vertical rhythm: zone padding clamp 72 to 128px for About and Contact, clamp 56 to 104px for band headers and track bodies, 48 to 72px between groups, 20px gaps in stub grids. Video reels sit in justified rows: each reel's flex-grow is its aspect ratio (--r) and its frame uses that ratio (--ar), so mixed 16:9 and vertical edits share one baseline-aligned row; under 720px rows wrap and the rest stack.

## Elevation & Depth

Flat printed colour by default. Depth comes from the physical metaphor (the 3D pass hanging on its strap, notched stubs) rather than from shadow layers. The few shadows are soft, dark and low, and appear on lift: hover on stubs, and the static fallback pass card. On stock, stubs use an inset 1.5px ink outline as their edge. The 3D pass faces use a matte finish with tone mapping off, so the printed colours read exactly as the CSS tokens.

### Shadow Vocabulary
- **Stub lift on ink** (`box-shadow: 0 14px 26px -16px rgba(0, 0, 0, 0.8)`): Tear-off stub hover, paired with a 2px rise.
- **Credential lift on stock** (`box-shadow: inset 0 0 0 1.5px #101014, 0 18px 30px -20px rgba(16, 16, 20, 0.55)`): Project stub hover, paired with a 3px rise.
- **Hanging pass** (`box-shadow: 0 30px 60px -24px rgba(0, 0, 0, 0.7)`): The static fallback pass card only.

### Named Rules
**The Printed Matter Rule.** Nothing glows. Colour is ink on stock; shadows appear only to lift a stub on hover or to hang the pass.

## Shapes

Corners follow real stationery: 2px track chips, 4px tags and role chips, 6px strip controls and stamp, 8px buttons, 10px tear-off stubs, 12px cards, frames and gap slots, 16px sheet, 18px pass card. Circles mark the punch, notches, play button and back-to-top.

Recurring geometry: a coloured tab on the left of every stub separated by a 2px dashed ink perforation, with half-circle notches cut top and bottom; dashed borders for anything missing or tearable; square nodes on the flow rail; a filled ink dot as the punch. The availability stamp is outlined and rotated -1.5deg. The strap and the pass's track stripe are printed stripes, which belong to the world.

## Components

### Buttons
Printed and square-shouldered.
- **Shape:** gently rounded (8px), 48px tall, condensed caps action type.
- **Solid:** ink fill with stock text; hover lifts to a lighter ink (#2a2a31).
- **Outline:** 2px ink border, transparent fill, ink text; hover fills stock-shade.
- **Contact CTA (strip):** stock fill with ink text, 44px, 6px radius; hover goes pure white.
- **Focus:** 3px Crew orange outline at 3px offset on ink; VLSI blue on stock; stock outline inset on track bands and the sheet header.

### Navigation (Pass strip)
Sticky ink bar with a 36px stock monogram tile and the name in condensed caps. Links are Barlow 600 at 0.9375rem in ink-side muted, each track link preceded by its 10px colour chip; the active link goes full ink-side text and its chip scales 1.35x. Resume links sit after an ink-rule divider. The 4px bottom rule follows the current track zone. Under 1080px the resume links drop; under 860px everything collapses to a 48px menu button and a drawer of condensed 1.5rem links plus stubs.

### Track bands (Explore paths)
Three equal full-bleed fields, one per track, each a link: the track name in condensed 800 caps, a one-line true count beneath, a down arrow top right. Hover darkens to the press shade and nudges the arrow 4px down. Choosing a band punches it: a 22px filled ink dot scales in beside the arrow, the 3D pass swings, and the page scrolls to that track.

### Tear-off stubs (resume)
Stock ticket on ink (white with an inset ink outline on stock), 64px tall, 10px corners, a coloured tab (VLSI for RTL, Media for graphic design) behind a dashed perforation, notches punched top and bottom in the surrounding ground colour, a download icon on the right. Title first in condensed caps, then the file kind ("PDF download") in mono beneath. Hover rises 2px with the stub lift shadow and nudges the icon down.

### Project credential stubs
Whole-card buttons that open the write-up sheet. White ticket with an inset 1.5px ink edge, 12px corners, a 22px VLSI tab (stock-shade for embedded builds) behind a dashed perforation, outlined notches. Body: condensed 1.75rem name, muted blurb, mono tool tags (4px, stock-rule border), and a dashed-topped "Read the write-up" row in VLSI blue. Hover rises 3px and the arrow slides 4px right.

### Event log
Rows on stock under a 3px ink top rule, hairline stock-rule between rows: mono year, condensed 1.5rem event name, a mono role chip on stock-shade, then a muted description spanning the row. Duties sit beside it as 1.5px ink-outlined pills led by a 9px ink dot.

### Honest gap slots
A 2px dashed gap-rule border, 12px corners, a mono status label ("Not yet published", "Not yet added", "Not yet documented") above a muted sentence naming what is missing. An ink variant swaps to a darker dash and ink-side text. Missing material is shown as a slot, never hidden or faked.

### Reels
Black 12px frames in justified rows by aspect ratio; a 56px Media-green round play/pause button at the lower left (72px on the featured reel), scaling 1.06x on hover. Beneath, a condensed caps title and a muted role line.

### Check-out desk
The ink contact zone under a 4px stock top rule. A stack of 72px link rows under a 3px stock rule: Crew-orange icon, a mono channel label (Email, LinkedIn, GitHub) above the address in Barlow 600. Hover slides the row 12px right and brightens to white. Resume stubs repeat below.

### Write-up sheet (dialog)
A native dialog up to 720px on a 72% ink scrim. Stock card with 16px corners; a VLSI header bar carrying the project's category in mono and a 48px close button; a scrolling body with the condensed 800 title, tool tags, mono section heads (Problem, Architecture, Implementation, Verification, What I learned) over 62ch paragraphs, a gap slot where artefacts are missing, and solid plus outline buttons.

### The pass (signature)
The 3D lanyard pass hangs from an orange strap on the hero. Front: ink header band reading ALL ACCESS with a mono course tag, colour portrait on stock, name in condensed caps, a gold chip pad, and a three-colour track stripe. Back: contact data and per-track counts. Faces are painted to canvas from the same palette, matte, with tone mapping off. A static HTML pass of the same design shows until the 3D stage reports live, and remains the permanent fallback without WebGL.

### Motion
**One signal trace (js/scroll-fx.js, GSAP 3.13 with ScrollTrigger, DrawSVG and SplitText).** A 2px line starts at a square node beside the name and draws itself down the left gutter as the visitor scrolls. Its tip leads at 55% of the viewport height. It takes the colour of the region it crosses, like the strip's bottom rule:
- muted on the ink hero;
- ink on About;
- blue in VLSI, orange in Leadership, green in Video;
- white on the ink Contact desk.

It is never drawn over a full-bleed track band: the band is the signal widening into its track. Corners are square, and nodes are flat squares that fill when the line reaches them. There is no glow.

| Section | What the trace does |
|---|---|
| Hero (load, about 2s, not scroll-driven) | The 3D pass drops in and swings as before. SplitText brings the name up out of its lines (masked, 0.09s stagger) and the copy in word by word. The stamp lands, overshooting from 1.35× at -7° to -1.5°. The stubs slide in and the bands rise from the hero's edge. Then the trace draws from its start node to the tip, and the node pulses twice and stops. Scrolling during the intro hands the trace straight to the scroll. |
| About | A branch reaches "Who I am" and its node fills. |
| VLSI (blue) | On desktop, the flow sits in a full-width opaque block that pins for 360px once its rail reaches the tip line. A lead runs from the gutter to the rail, the rail draws, and each stage node fills as the rail passes. The project grid meets the block at its natural gap when the pin ends. On phones and tablets the vertical rail draws with the scroll, without a pin. |
| Leadership (orange) | The gutter line is the event log's progress line, and each event's node fills as it passes. |
| Video (green) | On desktop the line draws a frame round the featured edit, which opens like a film gate, from a horizontal slit to the full frame, as it moves to the centre of the screen. Its caption follows. No video plays or loads because of scrolling. |
| Contact | A branch ends at "Let's work together" in a final, larger square node. |

**Mechanics:**
- One master timeline holds every scroll-linked piece. Its time unit is the tip position in px, labelled by section (`hero`, `about`, `vlsi`, `flow`, `leadership`, `video`, `contact`, `end`).
- It is rebuilt from the measured layout on every ScrollTrigger refresh. The playhead follows the tip through `gsap.quickTo` (0.45s catch-up), which is the scrub, so the trace reverses when scrolling up.
- Entrances off the trace (copy, rows, cards, chips, reels, desk links) use `ScrollTrigger.batch`: once, at most 6 per batch on desktop and 4 on phones, with an 80ms stagger.
- Elements waiting for their entrance cannot be clicked. Keyboard focus shows them at once, and focus inside the featured edit opens its gate.
- Animated properties: transform, opacity, SVG stroke (DrawSVG), the rail's scale through `--rail`, the node fills, and one clip-path (the film gate).

Routine state changes stay short (0.2 to 0.4s, ease-out cubic-bezier(0.16, 1, 0.3, 1)).

**Fallbacks:**
- **Reduced motion** (`gsap.matchMedia`, also applied live): the trace is fully drawn and nothing is hidden. There is no scrub, no pin and no hero intro, and scrolling is instant.
- **No GSAP** (blocked, failed, or Save-Data, which skips the download): scroll-fx draws the trace statically and hides nothing. The hero then plays its CSS entrance (`html.hero-go`) if the GSAP intro hasn't claimed it within 1000ms.

## Do's and Don'ts

### Do:
- **Do** give each track colour whole regions: a band, a header, a sheet bar, its own stubs and chips.
- **Do** pair VLSI blue with white text and Crew orange or Media green with ink text.
- **Do** set names, track titles and actions in Barlow Condensed caps, and reading text in Barlow at 1.0625rem/1.55.
- **Do** reserve JetBrains Mono for real data: tools, years, roles, field labels, file kinds, gap status.
- **Do** show missing material as a dashed gap slot with a plain status label.
- **Do** put the title first on a tear-off stub and the file kind after it.
- **Do** keep the strip's bottom rule in the current track's colour.
- **Do** keep a static HTML pass visible until the 3D pass is live.
- **Do** honour prefers-reduced-motion for every transition, entrance and the pass physics.
- **Do** route motion through the one signal trace; keep entrances to opacity and transform, play each once, and keep content visible whenever the script is missing.

### Don't:
- **Don't** add an eyebrow or kicker above a heading.
- **Don't** use mono for prose or for invented IDs, serials or codes.
- **Don't** add glows, neon, glass or sheen gradients; printed stripes on the strap and pass are the only repeating patterns.
- **Don't** add separate per-section effects beside the trace, or draw the trace over a track band.
- **Don't** animate layout properties or the video elements, and never start playback on scroll; the film gate is the only clip-path.
- **Don't** use ScrollSmoother: the sticky strip, anchors and the pass depend on native scroll.
- **Don't** use chip gold anywhere but the pass's chip pad.
- **Don't** fake content to fill a slot; use a gap slot.

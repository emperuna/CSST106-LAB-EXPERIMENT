---
version: alpha
name: Reticle
description: >-
  The Reticle design system: a flat measuring instrument in graphite and teal, built for running
  computer vision experiments and reading their results. Dark is the only theme. The source of
  truth in code is packages/tokens/tokens.css.
colors:
  primary: "#4aa3b8"
  on-primary: "#0a0a0a"
  primary-hover: "#63b5c8"
  primary-container: "#173840"
  background: "#121414"
  surface: "#1a1d1e"
  surface-sunken: "#232728"
  on-surface: "#ecebe6"
  on-surface-muted: "#a9aaa5"
  outline: "#2c3133"
  outline-strong: "#6e7578"
  chart-grid: "#262a2b"
  image-well: "#2b2b2b"
  viewfinder-tick: "#4aa3b8"
  success: "#6cc48c"
  error: "#ff8a65"
  error-container: "#36201a"
  chart-1: "#3987e5"
  chart-2: "#d95926"
  chart-3: "#199e70"
  chart-4: "#c98500"
  chart-5: "#d55181"
typography:
  display-lg:
    fontFamily: Geist Serif
    fontSize: 4rem
    fontWeight: 400
    lineHeight: 1.1
  headline-lg:
    fontFamily: Geist Serif
    fontSize: 2.5rem
    fontWeight: 400
    lineHeight: 1.1
  headline-md:
    fontFamily: Geist Serif
    fontSize: 1.625rem
    fontWeight: 400
    lineHeight: 1.1
  title-md:
    fontFamily: Geist Serif
    fontSize: 1.25rem
    fontWeight: 400
    lineHeight: 1.2
  title-sm:
    fontFamily: Geist Serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.2
  body-md:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.2
  label-sm:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: 600
    lineHeight: 1.2
  readout-sm:
    fontFamily: DM Mono
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
  readout-lg:
    fontFamily: DM Mono
    fontSize: 1.25rem
    fontWeight: 500
    lineHeight: 1.2
rounded:
  sm: 4px
  md: 6px
  lg: 10px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
components:
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
  heading:
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 0 20px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    height: 40px
  button-small:
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    height: 32px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 20px
  card-outline:
    backgroundColor: "{colors.outline}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 40px
  field-outline:
    backgroundColor: "{colors.outline-strong}"
  field-hint:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-sm}"
  readout:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.on-surface}"
    typography: "{typography.readout-sm}"
    rounded: "{rounded.sm}"
    padding: 1px 8px
  fader-fill:
    backgroundColor: "{colors.primary}"
    height: 4px
  fader-cap:
    backgroundColor: "{colors.on-surface}"
    rounded: 3px
    width: 10px
    height: 20px
  segmented-control:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 2px
  segmented-control-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
  drop-zone-active:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-surface}"
  image-frame:
    backgroundColor: "{colors.image-well}"
    rounded: "{rounded.md}"
    padding: 20px
  image-frame-tick:
    backgroundColor: "{colors.viewfinder-tick}"
    size: 10px
  status-success:
    backgroundColor: "{colors.success}"
    size: 8px
  error-message:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
  error-message-outline:
    backgroundColor: "{colors.error}"
  gauge-value:
    textColor: "{colors.on-surface}"
    typography: "{typography.readout-lg}"
  page-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-lg}"
  hero-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.display-lg}"
  section-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.title-md}"
  result-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.title-sm}"
  chart-grid:
    backgroundColor: "{colors.chart-grid}"
  chart-series-1:
    backgroundColor: "{colors.chart-1}"
  chart-series-2:
    backgroundColor: "{colors.chart-2}"
  chart-series-3:
    backgroundColor: "{colors.chart-3}"
  chart-series-4:
    backgroundColor: "{colors.chart-4}"
  chart-series-5:
    backgroundColor: "{colors.chart-5}"

---

## Overview

Reticle makes the site feel like a flat measuring instrument: calm, precise and quiet, so the images
and their measurements stand out. Surfaces are separated by tone and 1 px hairlines, never by shadows.
Instrument details carry the character: values in recessed mono readouts, sliders built as faders over
a tick scale, a segmented mode switch, dials with scales, and viewfinder ticks around every image.

Geist Serif headings give the precision an editorial voice, and Geist Sans keeps explanations plain
and easy to read.

Reticle is dark only: one theme, so every color has a single value. The tokens in code live
in `packages/tokens/tokens.css`, the components in `packages/ui`, and `/design-system` shows them all.
Brand identity, the logo and voice are in `BRAND.md`.

## Colors

Graphite and teal: a calm, dark laboratory palette, so images and their measurements are the
brightest things on the page.

- **Primary (#4aa3b8):** teal, used only for actions and the current selection, with near-black
  (#0a0a0a) text on it at 6.8:1.
- **Background (#121414) and surface (#1a1d1e):** graphite tones. Surfaces sit on the background, and
  recessed panels and readouts use surface-sunken (#232728).
- **On-surface (#ecebe6) and on-surface-muted (#a9aaa5):** text, at 15.5:1 and 7.9:1 on the
  background. Muted text is for hints, metadata and axis labels only.
- **Outline (#2c3133) and outline-strong (#6e7578):** hairlines and control borders. Control borders
  stay at least 3:1 against the surface (3.6:1).
- **Image well (#2b2b2b):** a neutral grey behind every result image, so the palette never tints what
  is being measured.
- **Success (#6cc48c) and error (#ff8a65):** status only, always with a word or icon, never color alone.
- **Chart 1 to 5:** categorical series, always assigned in this order. They were validated for color
  vision deficiency on the dark background.

Primary is a fill first. As text on the background it reaches 6.4:1, so a teal link is allowed, but
keep teal for actions and selection rather than reading text.

## Typography

- **Geist Serif** (400, its only weight): page and section headings, and result group titles.
- **Geist Sans:** body text (400), labels and buttons (600).
- **DM Mono** (500): every measured value, coordinate, parameter and table number.

Nothing is set below 13 px. Text uses sentence case, with no tracked capitals.

## Layout

Spacing follows a 4 px base: 4, 8, 12, 16, 24, 32, 48 and 64 px. In code these are `--space-1` to
`--space-16`, named by multiples of 4.

Lab pages use a workbench: controls in a fixed-width card on the left, results on the right, stacking
into one column below 832 px. No page scrolls sideways at 390 px.

## Elevation & Depth

There is no elevation. Nothing casts a shadow. Depth comes from tone: background, then surface, then
surface-sunken for recessed parts. A modal image view darkens the page behind it.

## Shapes

Corners are small and consistent: 4 px for small controls and readouts, 6 px for buttons, fields and
image frames, and 10 px for cards. Pills (999 px) are only for status badges and the site bar. The
logo is a dithered lens of square pixels in one colour, and its app icon sets a simpler lens in white
on a near-black tile with 14/64 rounded corners.

## Components

- **Buttons:** primary is a teal fill. Secondary is the surface color with a strong outline. Hover
  changes the fill or outline color only, and a press seats the button 1 px, like a hardware key.
- **Fields:** a 1 px strong outline that darkens to text color on hover, with a 2 px focus ring.
- **Faders:** a 4 px track filled with teal, a 10 x 20 px cap, and a 10-step tick scale beneath.
- **Readouts:** the current value of a control, in DM Mono on a recessed chip.
- **Segmented controls:** the tabs. The selected item becomes a raised
  surface with a hairline.
- **Image frames:** the image on a neutral well with viewfinder ticks in the margin, never on the
  image. The title and a mono readout sit below. Clicking enlarges the image, and hover zooms it 2%.
- **Cards and charts:** surface with a hairline and 10 px corners. Chart marks are thin 2 px lines,
  and every chart with two or more series has a legend and a data table.
- **Gauge:** a thin arc with a tick scale, a needle, and the exact value below in DM Mono.
- **Loader:** a scan line sweeping a small viewfinder.
- **Icons:** Lucide outline icons at a 1.75 stroke, sized to the text beside them (1.15 em). They
  inherit the text color and always sit next to a word, never alone. The set is curated in
  `packages/ui/src/icons`.
- **Error message:** the error surface with a hairline in the error color and an alert icon.
- **Site bar and menus:** a transparent bar with one pill in the centre. The logo shows at the top of
  the page and fades away once the page scrolls, leaving only the pill, so no text runs behind it. The labs menu opens in
  240 ms (`--duration-panel`): it fades in, drops 8 px into place and unrolls from the top, and its
  rows follow 25 ms apart. Closing reverses it. Under reduced motion it opens at once.

## Do's and Don'ts

- Do keep every color, size and radius in the tokens. Never hardcode a value.
- Do keep to the one dark theme. There is no light mode and no theme switch.
- Do show measured values in DM Mono, exactly as the lab computed them.
- Don't add shadows, gradients or glows.
- Don't lift, bounce or scale controls on hover.
- Don't draw anything over a result image, or tint the image well.
- Don't use teal for body text or as a status color.
- Don't use violet or lavender anywhere.

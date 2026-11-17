# Brand

## Name

**Reticle**, the Web UI for CSST106 (Perception and Computer Vision), named after the crosshair in a
lens. The course name, CSST106, appears beside it where the course needs to be clear. The site and its
design system share the name.

## Idea

A flat measuring instrument that students run images through. The interface is calm and precise, so the
images and their measurements are what stand out. Serif headings and small instrument details make it
approachable rather than clinical.

## Personality

- **Precise:** every number is exact, comes from a real run, and is shown in a mono typeface.
- **Calm:** flat surfaces, a quiet palette, and motion that never bounces.
- **Honest:** it states limitations plainly, such as where a result can't be measured or where this
  implementation differs from the lab sheet.
- **Approachable:** serif headings and plain language, written for students.

## Voice

- Plain, direct sentences in sentence case. Name the thing, then what it does.
- Buttons are a verb and an object: "Detect objects", "Fit PCA and train SVM".
- Explain a result's limits in a note, never with apologies or marketing language.
- Use the lab sheets' terms (Canny, CLAHE, IoU), with a short explanation the first time.

## Logo

**The dithered lens.** A circle, the lens, filled with square pixels in an ordered (Bayer) dither:
solid on the left, thinning to nothing at the right edge. It shows an image becoming pixels, and it
uses the same dither thresholds as the hero's shader, so the mark and the site speak the same
language. References: the CBS eye (one eye shape, one colour), Paul Rand's IBM stripes (a solid form
broken into lines that still reads whole), and Vercel and Linear (one shape, a plain typeset name).

The wordmark is "Reticle" in Geist at weight 560, converted to outlines so it never depends on a
font being installed. The dot of the i is a square pixel, a little larger than the stem and
lifted, so the name carries the same pixel as the mark.

The logo is one colour only: white on the site, which is dark only, and near-black `#0a0a0a` for print
and light documents such as the report. No teal,
gradients or second colour. The marks are generated from exact geometry, so edit them only to change
the logo itself, never to fit a layout.

| Version | File in `packages/tokens/brand` | Use |
| --- | --- | --- |
| Logo | `reticle-logo-dark.svg` | White, used on the site |
| Logo, print | `reticle-logo-light.svg` | Near-black, for print and light documents such as the report |
| Mark | `reticle-mark-dark.svg` (white), `reticle-mark-light.svg` (print) | Where the name is already nearby |
| App icon | `reticle-app-icon.svg` | A simpler 8-pixel lens in white on a near-black tile, for small sizes |

Files are named `reticle-<asset>-<background>.svg`, after the background they sit on. The favicons in `apps/web/public` keep the names
browsers expect: `favicon.svg` (the app icon) and `apple-touch-icon.png` (180 px).

- Below 24 px, use the app icon: its lens has fewer, larger pixels, so it stays a lens, not noise.
- Keep clear space of at least a quarter of the mark's width around the logo.
- Don't recolour, stretch, rotate, outline or add effects, and don't rearrange the pixels.

## Color and type

- **Palette:** graphite and teal, dark only. Teal marks actions and the current selection. Images
  always sit on neutral grey, so the brand never tints a result.
- **Type:** Geist Serif for headings, Geist Sans for reading, DM Mono for values. The wordmark is
  Geist, outlined, so it needs no font.

Exact values and component rules are in `DESIGN.md`. In code, they live in
`packages/tokens/tokens.css`.

## Applying the design skill

All design and redesign work uses the `design-taste-frontend` skill, on every page. On lab pages, result
labels are data readouts, so its no-caption rule doesn't apply to them.

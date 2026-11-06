# Brand and design direction

**Name:** CSST106 Vision Lab, shortened to Vision Lab.

**Direction:** a cartoon instrument. The casing is playful, and the readings are exact.

## Principles

- **Cartoon casing:** thick ink outlines, rounded corners, hard offset shadows, flat fills, and chunky
  controls that press down.
- **Scientific glass:** images sit in neutral grey wells, and nothing draws over a result except its
  frame ticks. Cartoon styling never tints or distorts what is being measured.
- **Exact readings:** every measured value is in DM Mono and comes from a real run.
- **Creative layout:** the layout can be playful as long as results stay readable.

## Logo

A cartoon eye with a pixel for its highlight, inside viewfinder corners. Files are in
`packages/tokens/brand`. Use `favicon.svg` below 32 px, where the corners blur together.

## Color

| Role | Light (default) | Dark |
| --- | --- | --- |
| Background | `#f7f2e7` | `#141311` |
| Surface | `#fffdf7` | `#1c1b19` |
| Ink and outlines | `#1d1b18` | `#f7f2e7` |
| Muted text | `#5e574c` | `#b8b1a3` |
| Amber (actions and current item) | `#f5b301` | `#f5b301` |
| Teal (success) | `#0b6e70` | `#4cc9c0` |
| Tomato (errors) | `#c23f1c` | `#ff8a65` |
| Image well | `#d6d6d6` | `#2a2a2a` |

Amber is a fill, with ink text on top. Never use it as text on paper or surface, because its contrast
is too low.

## Type

- **Fredoka:** logo, names and headings only.
- **Instrument Sans:** body text and labels.
- **DM Mono:** values, coordinates and parameters.

## Page split

- **Home page:** follows the `design-taste-frontend` skill in full.
- **Lab pages:** use the skill's system (tokens, one button style, one card style, even edges and hover
  behavior), but not its marketing rules on captions, word counts, one section per screen or hero
  effects. Result labels are data readouts, so they stay.

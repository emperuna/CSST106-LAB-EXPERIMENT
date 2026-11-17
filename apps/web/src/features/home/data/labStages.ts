/**
 * The seven labs grouped into the three stages of the home page's journey, each with one real
 * result picture from outputs/. Where a saved figure has several panels or titles, `crop` or
 * `panels` pick panels out by their pixel rectangles, measured from the image itself.
 */
import type { ImageMetadata } from "astro";
import lab1 from "@outputs/lab01/channel_red.png";
import lab2 from "@outputs/lab02/canny.png";
import lab3 from "@outputs/lab03/clahe.png";
import lab4 from "@outputs/lab04/surf_matches.png";
import lab5 from "@outputs/lab05/eigenfaces.png";
import lab6 from "@outputs/lab06/test_1 (66).jpg";
import lab7 from "@outputs/lab07/semantic_bus.png";
import type { Rect } from "../utils/crop";

export interface LabTile {
  number: number;
  image: ImageMetadata;
  /** What the picture shows, for its alt text. */
  alt: string;
  /** One panel of a saved figure, filling the tile. */
  crop?: Rect;
  /** Several panels of a saved figure, side by side on the image well. */
  panels?: Rect[];
}

export interface Stage {
  name: string;
  blurb: string;
  /** Width / height of the stage's pictures: they grow larger as the labs get harder. */
  aspect: number;
  labs: LabTile[];
}

export const stages: Stage[] = [
  {
    name: "Pixels",
    blurb: "Read, change and clean up the numbers themselves.",
    aspect: 4 / 3,
    labs: [
      { number: 1, image: lab1, alt: "The red channel of the astronaut photo, in grayscale" },
      { number: 2, image: lab2, alt: "Canny edges of the astronaut photo" },
      { number: 3, image: lab3, alt: "The low-contrast sample image after CLAHE" },
    ],
  },
  {
    name: "Features",
    blurb: "Find the points that survive a turn or a resize, and the patterns that tell faces apart.",
    aspect: 16 / 10,
    labs: [
      { number: 4, image: lab4, alt: "SURF matches between the cameraman photo and a copy rotated 30 degrees and scaled 0.8" },
      {
        number: 5,
        image: lab5,
        alt: "Eigenfaces 0, 5 and 7 from the PCA model: the patterns it uses to tell faces apart",
        // Inside the black frames of eigenfaces 0, 5 and 7 in the 4 x 3 figure.
        panels: [
          { x: 30, y: 94, w: 159, h: 215 },
          { x: 269, y: 407, w: 159, h: 215 },
          { x: 748, y: 407, w: 159, h: 215 },
        ],
      },
    ],
  },
  {
    name: "Understanding",
    blurb: "Name what is in a picture, then label every pixel in it.",
    aspect: 4 / 3,
    labs: [
      {
        number: 6,
        image: lab6,
        alt: "Two buffalo found by the custom-trained wildlife model in an unseen test image, at 0.93 and 0.92 confidence",
      },
      {
        number: 7,
        image: lab7,
        alt: "A street scene with every pixel labelled as bus, person or background",
        crop: { x: 1198, y: 50, w: 401, h: 534 },
      },
    ],
  },
];

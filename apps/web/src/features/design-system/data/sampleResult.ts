import type { ResultData } from "@reticle/ui";
import CANNY from "../assets/canny.png?url";
import ORIGINAL from "../assets/original.png?url";

export { CANNY, ORIGINAL };

const ANGLES = ["0", "5", "10", "15", "30", "45", "90", "180"];
const SURF = [600, 309, 225, 190, 131, 110, 345, 302];
const USURF = [600, 307, 199, 109, 4, 0, 0, 0];

// Saved values from outputs/lab02 and outputs/lab04, so the examples show real results.
export const RESULT: ResultData = {
  notes: ["Values on this page come from the saved Lab 2 and Lab 4 results."],
  panels: [
    { title: "Original", image: ORIGINAL, caption: "512 x 512 px", group: "Image frames", step: 1 },
    {
      title: "Canny",
      image: CANNY,
      caption: "Thresholds 100 and 200",
      group: "Image frames",
      step: 4,
    },
  ],
  readouts: [
    { label: "SURF keypoints", value: 600, step: 2 },
    { label: "SURF correct matches", value: 77.2, unit: "%", step: 4 },
  ],
  charts: [
    {
      title: "Keypoints by Hessian threshold",
      kind: "line",
      x_label: "Hessian threshold",
      y_label: "Keypoints",
      series: [
        {
          label: "SURF",
          x: ["100", "200", "400", "800", "1600", "3200"],
          y: [1262, 896, 600, 381, 224, 136],
        },
      ],
    },
    {
      title: "Correct matches under rotation",
      kind: "line",
      x_label: "Rotation (degrees)",
      y_label: "Correct matches",
      series: [
        { label: "SURF", x: ANGLES, y: SURF },
        { label: "U-SURF", x: ANGLES, y: USURF },
      ],
    },
  ],
  tables: [
    {
      title: "Table",
      columns: ["Method", "Keypoints", "Correct (%)"],
      rows: [
        ["SURF", 600, 77.2],
        ["U-SURF", 600, 6.2],
        ["SIFT", 791, 97.1],
        ["ORB", 1973, 95.4],
      ],
    },
  ],
};

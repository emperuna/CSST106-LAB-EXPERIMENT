/**
 * "Controls to code": the Lab 2 controls a visitor sees, and the exact lines of code each one
 * feeds. Every code line is copied verbatim from the files named here; keep them in step if those
 * files change. The three Canny settings and their edge percentages are the saved threshold sweep.
 */
import lab2 from "@outputs/lab02/metrics.json";
import type { Rect } from "../utils/crop";

export type ControlKey = "image" | "blur" | "sobel" | "canny" | "run";

export interface CodeLine {
  text: string;
  /** The control this line takes its value from. */
  key?: ControlKey;
  /** Indented lines sit inside a function. */
  indent?: boolean;
}

export interface CodeFile {
  path: string;
  lines: CodeLine[];
}

export const codeFiles: CodeFile[] = [
  {
    path: "apps/api/src/api/modules/lab02_edges/router.py",
    lines: [
      { text: '@router.post("/run", operation_id="runLab02")', key: "run" },
      {
        text: 'picture = limit_size(resolve_image(image, sample, "input.jpg"), 1600, notes := [])',
        key: "image",
        indent: true,
      },
    ],
  },
  {
    path: "apps/api/src/api/modules/lab02_edges/service.py",
    lines: [
      { text: "def run(image: np.ndarray, blur: int, sobel_size: int, low: int, high: int) -> LabResult:" },
      { text: "gray = to_gray(image)", key: "image", indent: true },
      { text: "blurred = lab.preprocess(gray, blur)", key: "blur", indent: true },
      { text: "gradients = lab.sobel(blurred, sobel_size)", key: "sobel", indent: true },
      { text: "edges = lab.canny(blurred, low, high)", key: "canny", indent: true },
    ],
  },
  {
    path: "packages/cv-labs/src/cv_labs/lab02_edges.py",
    lines: [
      { text: "return cv2.GaussianBlur(gray, (ksize, ksize), 0)", key: "blur", indent: true },
      { text: "gx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=ksize)", key: "sobel", indent: true },
      { text: "return cv2.Canny(blurred, low, high)", key: "canny", indent: true },
    ],
  },
];

export interface CannySetting {
  low: number;
  high: number;
  /** Percentage of pixels marked as edges, from the saved sweep. */
  percent: number;
  /** This setting's panel in outputs/lab02/canny_thresholds.png, measured from the image. */
  panel: Rect;
}

const sweep = lab2.canny_threshold_sweep;
const panelAt = (x: number): Rect => ({ x: x + 1, y: 46, w: 402, h: 401 });

export const cannySettings: CannySetting[] = [
  { low: 30, high: 90, percent: sweep["30-90"], panel: panelAt(82) },
  { low: 100, high: 200, percent: sweep["100-200"], panel: panelAt(617) },
  { low: 200, high: 300, percent: sweep["200-300"], panel: panelAt(1152) },
];

/** The value each control passes in, shown beside its line of code. */
export function valueFor(key: ControlKey, canny: CannySetting) {
  switch (key) {
    case "blur":
      return "blur=3";
    case "sobel":
      return "sobel_size=3";
    case "canny":
      return `low=${canny.low}, high=${canny.high}`;
    case "image":
      return 'sample="input.jpg"';
    default:
      return null;
  }
}

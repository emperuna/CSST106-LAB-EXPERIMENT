/**
 * The home page's notes, drawn as a diff against the lab sheets: what each sheet asks for, what this
 * project did instead, and why. The sheet side follows the README's "Where the code differs from the
 * lab sheets"; every number is read from the saved outputs, never typed in.
 */
import lab4 from "@outputs/lab04/metrics.json";
import lab6Dataset from "@outputs/lab06/dataset.json";
import lab6 from "@outputs/lab06/evaluation.json";
import lab6Args from "@outputs/lab06/training_args.yaml?raw";
import lab7 from "@outputs/lab07/metrics.json";

export interface SheetNote {
  lab: string;
  title: string;
  /** What the lab sheet asks for, or null where the sheet says nothing on it. */
  sheet: string | null;
  project: string;
  why: string;
  /** One measured value that shows the consequence, from the saved outputs. */
  evidence?: { value: string; label: string };
}

const setting = (yaml: string, key: string) => yaml.match(new RegExp(`^${key}:\\s*(\\S+)`, "m"))?.[1];
const surf = lab4.comparison.SURF;
const usurf = lab4.comparison["U-SURF"];
const classes = Object.entries(lab6.per_class).sort(([, a], [, b]) => a.mAP50 - b.mAP50);
const [weakestName, weakest] = classes[0]!;
const seg = lab7.cells_with_ground_truth;
const bestIou = Math.max(...Object.values(seg.methods).map((m) => m.iou));
const regionGrowing = seg.methods["Region growing"];

export const notes: SheetNote[] = [
  {
    lab: "All labs",
    title: "Lab numbers",
    sheet: "Numbered inconsistently inside the sheets",
    project: "Numbered 1 to 7 by the sheet file names",
    why: "So each lab has one number across this site, the code and the report.",
  },
  {
    lab: "Lab 4",
    title: "SURF",
    sheet: "cv2.xfeatures2d.SURF_create()",
    project: "surf.py: the published method, written in NumPy",
    why: "The OpenCV wheels on PyPI leave out patented algorithms, so SURF_create fails. OpenCV's own version is used when a build includes it. Its timings can't be compared with compiled SIFT and ORB.",
    evidence: { value: `${surf.correct_percent.toFixed(1)}%`, label: "of SURF matches correct" },
  },
  {
    lab: "Lab 6",
    title: "YOLO training",
    sheet: "100 epochs at 640 px",
    project: `${setting(lab6Args, "epochs")} epochs at ${setting(lab6Args, "imgsz")} px on a ${lab6Dataset.splits.train.images}-image subset`,
    why: "This computer trains on a dual-core CPU. Training stays out of the Web UI; the page shows the saved run.",
    evidence: {
      value: lab6.mAP50.toFixed(2),
      label: `mAP50 on ${lab6Dataset.splits.test.images} unseen images`,
    },
  },
  {
    lab: "Lab 6",
    title: "Dataset",
    sheet: "Self-collected photos",
    project: `The public African Wildlife dataset: ${lab6Dataset.names.join(", ")}`,
    why: "The project's author chose a public, labelled dataset instead of collecting and labelling photos.",
    evidence: {
      value: weakest.mAP50.toFixed(2),
      label: `mAP50 for ${weakestName}, the weakest class`,
    },
  },
  {
    lab: "Lab 6",
    title: "Weights",
    sheet: "YOLOv11n.pt",
    project: "yolo11n.pt",
    why: "The name of the file Ultralytics actually publishes.",
  },
  {
    lab: "All labs",
    title: "Sample images",
    sheet: "input.jpg and other files that were not included",
    project: "Public test images from scikit-image and Ultralytics, plus a synthetic image with a known answer",
    why: "The named files never came with the sheets. The synthetic discs are what make Lab 7's IoU possible.",
    evidence: { value: bestIou.toFixed(3), label: "best IoU on the synthetic discs" },
  },
  {
    lab: "Lab 7",
    title: "Semantic scores",
    sheet: null,
    project: "IoU is reported only where an answer key exists",
    why: "The semantic photos have no pixel labels, so there is nothing to score them against. They show labels and percentages instead.",
    evidence: { value: "—", label: "IoU for semantic results" },
  },
];

/** Weak results not already shown in a note above, reported exactly as measured. */
export const weakResults = [
  `U-SURF gets ${usurf.correct_percent.toFixed(1)}% of matches right on a copy rotated 30 degrees`,
  `Region growing finds ${regionGrowing.objects_found} of ${seg.true_objects} objects`,
];

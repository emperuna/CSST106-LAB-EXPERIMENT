/**
 * The home page's readout board: one measured number per lab, read straight from the lab's saved
 * outputs so every figure is the one the lab produced. Nothing here is typed in by hand; rerun a
 * lab (uv run python scripts/run_all.py) to change a number.
 */
import lab2 from "@outputs/lab02/metrics.json";
import lab3 from "@outputs/lab03/metrics.json";
import lab4 from "@outputs/lab04/metrics.json";
import lab5 from "@outputs/lab05/metrics.json";
import lab6Dataset from "@outputs/lab06/dataset.json";
import lab6 from "@outputs/lab06/evaluation.json";
import lab6Args from "@outputs/lab06/training_args.yaml?raw";
import lab7 from "@outputs/lab07/metrics.json";

export interface Bar {
  label: string;
  /** 0 to 1, the bar's length. */
  share: number;
  text: string;
  /** The bar the headline number refers to. */
  current?: boolean;
}

export type Visual =
  | { kind: "pixels"; lit: number; total: number }
  | { kind: "bars"; bars: Bar[] }
  | { kind: "objects"; truth: number; rows: { label: string; found: number; current?: boolean }[] };

export interface Readout {
  lab: number;
  title: string;
  value: string;
  unit: string;
  /** What the number measures, in a few words. */
  label: string;
  /** Under what conditions, and its limits. */
  note: string;
  visual: Visual;
}

const pct = (value: number, digits = 1) => (value * (value <= 1 ? 100 : 1)).toFixed(digits);
const setting = (yaml: string, key: string) => yaml.match(new RegExp(`^${key}:\\s*(\\S+)`, "m"))?.[1];

// Lab 2: the share of pixels Canny keeps as edges.
const canny = lab2.canny_percent_edge_pixels;
const looseCanny = lab2.canny_threshold_sweep["30-90"];

// Lab 3: detail kept (entropy) and noise added in flat areas, per method.
const v3 = lab3.versions;
const entropyMax = Math.max(...Object.values(v3).map((v) => v.entropy_bits));

// Lab 4: correct matches on the rotated, scaled copy.
const detectors = lab4.comparison;
const surf = detectors.SURF;

// Lab 5: face recognition on the held-out test set.
const svm = lab5.svm_tuned.accuracy;

// Lab 6: the custom wildlife model on its unseen test split.
const classes = Object.entries(lab6.per_class);

// Lab 7: objects found against the synthetic image's known answer.
const seg = lab7.cells_with_ground_truth;
const methods = Object.entries(seg.methods);
const bestIou = Math.max(...methods.map(([, m]) => m.iou));
const tiedBest = methods.filter(([, m]) => m.iou === bestIou).map(([name]) => name.toLowerCase());

export const readouts: Readout[] = [
  {
    lab: 2,
    title: "Edge detection",
    value: canny.toFixed(2),
    unit: "%",
    label: "of pixels marked as edges",
    note: `Canny at thresholds 100 and 200 on the astronaut photo. Loosen them to 30 and 90 and it marks ${looseCanny.toFixed(2)}%.`,
    visual: { kind: "pixels", lit: Math.round(canny), total: 100 },
  },
  {
    lab: 3,
    title: "Histogram equalization",
    value: v3.clahe.entropy_bits.toFixed(2),
    unit: "bits",
    label: "of detail kept by CLAHE",
    note: `The most of any method. Global equalization raises noise in flat areas to ${v3.global.flat_region_noise.toFixed(2)}; CLAHE keeps it at ${v3.clahe.flat_region_noise.toFixed(2)}.`,
    visual: {
      kind: "bars",
      bars: [
        ["Original", v3.original],
        ["Stretched", v3.stretched],
        ["Global", v3.global],
        ["CLAHE", v3.clahe],
      ].map(([label, v]) => {
        const version = v as typeof v3.clahe;
        return {
          label: label as string,
          share: version.entropy_bits / entropyMax,
          text: version.entropy_bits.toFixed(2),
          current: label === "CLAHE",
        };
      }),
    },
  },
  {
    lab: 4,
    title: "SURF features",
    value: pct(surf.correct_percent),
    unit: "%",
    label: "of SURF matches are correct",
    note: `${surf.correct_matches} of ${surf.ratio_test_matches}, matching the cameraman photo to a copy ${lab4.second_image.replace("image 1 ", "")}. Times aren't compared: this SURF is NumPy, SIFT and ORB are compiled.`,
    visual: {
      kind: "bars",
      bars: Object.entries(detectors).map(([name, d]) => ({
        label: name,
        share: d.correct_percent / 100,
        text: `${pct(d.correct_percent)}%`,
        current: name === "SURF",
      })),
    },
  },
  {
    lab: 5,
    title: "PCA and eigenfaces",
    value: pct(svm),
    unit: "%",
    label: "of unseen faces recognised",
    note: `Tuned SVM on ${lab5.pca.n_components} PCA components, tested on ${lab5.dataset.test} faces of ${lab5.dataset.n_classes} people it never trained on.`,
    visual: {
      kind: "bars",
      bars: [
        ["No whitening", lab5.svm_without_whitening.accuracy, false],
        ["Baseline", lab5.svm_baseline.accuracy, false],
        ["Tuned", svm, true],
      ].map(([label, value, current]) => ({
        label: label as string,
        share: value as number,
        text: `${pct(value as number)}%`,
        current: current as boolean,
      })),
    },
  },
  {
    lab: 6,
    title: "YOLO detection",
    value: lab6.mAP50.toFixed(2),
    unit: "mAP50",
    label: "on unseen wildlife photos",
    note: `The custom model, trained for ${setting(lab6Args, "epochs")} epochs at ${setting(lab6Args, "imgsz")} px on ${lab6Dataset.splits.train.images} images, then tested on ${lab6Dataset.splits.test.images} it never saw. Precision ${lab6.precision.toFixed(2)}, recall ${lab6.recall.toFixed(2)}.`,
    visual: {
      kind: "bars",
      bars: classes.map(([name, c]) => ({
        label: name[0]!.toUpperCase() + name.slice(1),
        share: c.mAP50,
        text: c.mAP50.toFixed(3),
      })),
    },
  },
  {
    lab: 7,
    title: "Segmentation",
    value: `${seg.methods.Watershed.objects_found}/${seg.true_objects}`,
    unit: "",
    label: "objects separated by watershed",
    note: `Five methods on synthetic discs with a known answer. On pixel overlap, ${tiedBest.join(" and ")} tie at IoU ${bestIou.toFixed(3)}; only watershed splits the touching discs.`,
    visual: {
      kind: "objects",
      truth: seg.true_objects,
      rows: methods.map(([name, m]) => ({
        label: name,
        found: m.objects_found,
        current: name === "Watershed",
      })),
    },
  },
];

/**
 * Which cells of a pixel grid are lit, spread evenly with a small fixed offset each, so 6 of 100
 * reads as a sparse scatter rather than a solid run.
 */
export function litCells(visual: Extract<Visual, { kind: "pixels" }>): boolean[] {
  const lit = new Set(
    Array.from(
      { length: visual.lit },
      (_, k) => Math.floor(((k + 0.5) * visual.total) / visual.lit) + ((k * 7) % 5) - 2,
    ),
  );
  return Array.from({ length: visual.total }, (_, i) => lit.has(i));
}

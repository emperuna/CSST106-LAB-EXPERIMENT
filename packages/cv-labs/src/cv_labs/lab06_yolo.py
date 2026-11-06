"""Lab 6 - Object Detection with YOLOv11: inference, custom dataset, training, evaluation.

Commands (run with: python -m cv_labs.lab06_yolo <command>):
  detect   --image samples/bus.jpg     Part 1: pre-trained detection on one image
  stream   --source 0 --show           Part 1: webcam (0) or a video file path
  prepare                              Part 2: build data/dataset and data/data.yaml
  prepare --own DIR --names a,b        Part 2: use your own annotated dataset instead
  train    --epochs 100 --imgsz 640    Part 3: train on the custom dataset
  evaluate                             Part 4: precision, recall, mAP and test images

The lab sheet writes the weights as YOLOv11n.pt; the file Ultralytics publishes is
yolo11n.pt, and the name is case-sensitive.
"""
from __future__ import annotations

import argparse
import random
import shutil
import time
import urllib.request
import zipfile
from pathlib import Path
from typing import TYPE_CHECKING

import cv2
import numpy as np

from .common import DATA, MODELS, ROOT, SAMPLES, WEIGHTS, load_image, montage, out_dir, save_image, save_json

if TYPE_CHECKING:
    from ultralytics import YOLO

PRETRAINED = MODELS / "yolo11n.pt"
PRETRAINED_URL = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt"
DATASET_URL = "https://github.com/ultralytics/assets/releases/download/v0.0.0/african-wildlife.zip"
DATASET = DATA / "dataset"
DATA_YAML = DATA / "data.yaml"
RUNS = ROOT / "runs"
TRAINED = WEIGHTS / "best.pt"


def download(url: str, target: Path) -> Path:
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        print(f"Downloading {url}")
        urllib.request.urlretrieve(url, target)
    return target


def load_model(weights=None) -> YOLO:
    """Ultralytics is imported here, not at the top, because it loads PyTorch and takes seconds."""
    from ultralytics import YOLO

    return YOLO(str(weights or download(PRETRAINED_URL, PRETRAINED)))


# ---------- Part 1: inference ----------

def detect(model: YOLO, image: np.ndarray, conf: float = 0.25, imgsz: int = 640) -> dict:
    """Detect objects in a BGR image; returns the drawn image, the boxes and the time taken."""
    result = model.predict(image, conf=conf, imgsz=imgsz, verbose=False)[0]
    boxes = [{"label": result.names[int(c)], "confidence": float(p), "xyxy": [float(v) for v in xyxy]}
             for c, p, xyxy in zip(result.boxes.cls, result.boxes.conf, result.boxes.xyxy)]
    return {"annotated": result.plot(), "boxes": boxes, "inference_ms": float(result.speed["inference"])}


def stream(model: YOLO, source=0, conf: float = 0.25, imgsz: int = 640, show: bool = False,
           save_path=None, max_frames: int | None = None) -> dict:
    """Detect on a webcam or video, frame by frame, measuring real throughput.

    With show=True it opens a window; press q to stop.
    """
    capture = cv2.VideoCapture(source)
    if not capture.isOpened():
        raise RuntimeError(f"Cannot open video source: {source}")
    writer, frames, labels = None, 0, {}
    started = time.perf_counter()
    try:
        while max_frames is None or frames < max_frames:
            ok, frame = capture.read()
            if not ok:
                break
            found = detect(model, frame, conf, imgsz)
            frames += 1
            for box in found["boxes"]:
                labels[box["label"]] = labels.get(box["label"], 0) + 1
            drawn = found["annotated"]
            fps = frames / (time.perf_counter() - started)
            cv2.putText(drawn, f"{fps:.1f} FPS", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            if save_path and writer is None:
                h, w = drawn.shape[:2]
                writer = cv2.VideoWriter(str(save_path), cv2.VideoWriter_fourcc(*"mp4v"),
                                         capture.get(cv2.CAP_PROP_FPS) or 20, (w, h))
            if writer:
                writer.write(drawn)
            if show:
                cv2.imshow("YOLOv11 detection (q to quit)", drawn)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
    finally:
        capture.release()
        if writer:
            writer.release()
        if show:
            cv2.destroyAllWindows()
    seconds = time.perf_counter() - started
    return {"source": str(source), "frames": frames, "seconds": seconds, "fps": frames / max(seconds, 1e-9),
            "detections_by_label": labels}


def make_demo_video(path: Path, image_path=SAMPLES / "bus.jpg", frames: int = 40) -> Path:
    """Pan across a still photo to get a small video for testing the stream code."""
    image = load_image(image_path)
    h, w = image.shape[:2]
    crop_w, crop_h = int(w * 0.8), int(h * 0.8)
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 20, (crop_w, crop_h))
    for i in range(frames):
        x = int((w - crop_w) * i / max(frames - 1, 1))
        y = int((h - crop_h) * i / max(frames - 1, 1))
        writer.write(image[y:y + crop_h, x:x + crop_w])
    writer.release()
    return path


# ---------- Part 2: dataset ----------

def write_data_yaml(dataset: Path, names: list[str], path: Path = DATA_YAML) -> Path:
    """Dataset description read by Ultralytics, in the format from the lab sheet."""
    root = dataset.resolve()
    lines = [f"train: {root}/images/train", f"val: {root}/images/val"]
    if (root / "images" / "test").exists():
        lines.append(f"test: {root}/images/test")
    lines += [f"nc: {len(names)}", f"names: {names}"]
    path.write_text("\n".join(lines) + "\n")
    return path


def check_labels(dataset: Path, n_classes: int) -> dict:
    """Confirm each image has a label file with valid, normalized YOLO values.

    Each line is: class_id x_center y_center width height (all coordinates 0-1).
    """
    summary = {}
    for split in sorted(p.name for p in (dataset / "images").iterdir() if p.is_dir()):
        images = [p for p in (dataset / "images" / split).iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png")]
        objects = np.zeros(n_classes, dtype=int)
        for image in images:
            label = dataset / "labels" / split / f"{image.stem}.txt"
            if not label.exists():
                raise ValueError(f"Missing label file for {image}")
            for line in label.read_text().splitlines():
                values = line.split()
                if len(values) != 5:
                    raise ValueError(f"{label}: expected 5 values, got: {line}")
                objects[int(values[0])] += 1
                if not all(0 <= float(v) <= 1 for v in values[1:]):
                    raise ValueError(f"{label}: coordinates must be normalized: {line}")
        summary[split] = {"images": len(images), "objects_per_class": objects.tolist()}
    return summary


def use_own_dataset(folder, names: list[str]) -> dict:
    """Check a dataset you annotated yourself and point data.yaml at it.

    The folder must contain images/train, images/val, labels/train and labels/val.
    """
    folder = Path(folder)
    summary = check_labels(folder, len(names))
    write_data_yaml(folder, names)
    save_json(out_dir("lab06") / "dataset.json", {"source": str(folder), "names": names, "splits": summary})
    return summary


def prepare_dataset(train: int = 120, val: int = 30, test: int = 30, seed: int = 42) -> dict:
    """Build dataset/ in the lab's folder layout from a public, already annotated dataset.

    African Wildlife (Ultralytics): buffalo, elephant, rhino, zebra. It stands in for
    self-collected photos; a dataset of your own in the same layout works the same way.
    A subset is used so training is practical on a CPU.
    """
    archive = download(DATASET_URL, DATA / "african-wildlife.zip")
    extracted = DATA / "african-wildlife"
    if not extracted.exists():
        with zipfile.ZipFile(archive) as z:
            z.extractall(extracted)
    if DATASET.exists():
        shutil.rmtree(DATASET)

    names = ["buffalo", "elephant", "rhino", "zebra"]
    rng = random.Random(seed)
    for split, count in (("train", train), ("val", val), ("test", test)):
        images = sorted((extracted / "images" / split).glob("*.jpg"))
        # Take the same number from each animal, using the class of each image's first box.
        by_class: dict[int, list[Path]] = {i: [] for i in range(len(names))}
        for image in images:
            lines = (extracted / "labels" / split / f"{image.stem}.txt").read_text().split("\n")
            if lines[0].strip():
                by_class[int(lines[0].split()[0])].append(image)
        chosen = []
        for pool in by_class.values():
            rng.shuffle(pool)
            chosen += pool[: count // len(names)]
        for sub in ("images", "labels"):
            (DATASET / sub / split).mkdir(parents=True, exist_ok=True)
        for image in chosen:
            shutil.copy(image, DATASET / "images" / split / image.name)
            shutil.copy(extracted / "labels" / split / f"{image.stem}.txt",
                        DATASET / "labels" / split / f"{image.stem}.txt")
    write_data_yaml(DATASET, names)
    summary = check_labels(DATASET, len(names))
    save_json(out_dir("lab06") / "dataset.json", {"source": DATASET_URL, "names": names, "splits": summary})
    return summary


# ---------- Part 3: training ----------

def train(data=DATA_YAML, epochs: int = 100, imgsz: int = 640, batch: int = 16, patience: int = 100,
          weights=None, name: str = "train") -> Path:
    """Fine-tune the pre-trained model. Output goes to runs/detect/<name>."""
    model = load_model(weights)
    model.train(data=str(data), epochs=epochs, imgsz=imgsz, batch=batch, patience=patience, device="cpu",
                workers=2, project=str(RUNS / "detect"), name=name, exist_ok=True, plots=True, seed=42)
    run_dir = RUNS / "detect" / name
    TRAINED.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(run_dir / "weights" / "best.pt", TRAINED)
    results = out_dir("lab06")
    for plot in ("results.png", "confusion_matrix.png", "BoxPR_curve.png", "PR_curve.png", "results.csv", "args.yaml"):
        if (run_dir / plot).exists():
            shutil.copy(run_dir / plot, results / f"training_{plot}")
    return TRAINED


# ---------- Part 4: evaluation ----------

def evaluate(weights=TRAINED, data=DATA_YAML, split: str = "test", imgsz: int | None = None, n_examples: int = 8) -> dict:
    """Score the trained model on images it never saw, then save example detections."""
    model = load_model(weights)
    imgsz = imgsz or int(model.ckpt["train_args"]["imgsz"])
    results = model.val(data=str(data), split=split, imgsz=imgsz, device="cpu", workers=0, verbose=False,
                        project=str(RUNS / "detect"), name=f"eval_{split}", exist_ok=True)
    out = out_dir("lab06")
    box = results.box
    names = results.names
    per_class = {names[int(c)]: {"precision": float(p), "recall": float(r), "mAP50": float(m50), "mAP50_95": float(m)}
                 for c, p, r, m50, m in zip(box.ap_class_index, box.p, box.r, box.ap50, box.ap)}
    metrics = {"weights": str(weights), "split": split, "imgsz": imgsz, "precision": float(box.mp),
               "recall": float(box.mr), "mAP50": float(box.map50), "mAP50_95": float(box.map),
               "per_class": per_class}

    # Example detections on unseen test images.
    pictures = sorted((DATASET / "images" / split).glob("*.jpg"))
    rng = random.Random(0)
    rng.shuffle(pictures)
    panels = []
    for picture in pictures[:n_examples]:
        found = detect(model, load_image(picture), imgsz=imgsz)
        save_image(out / f"test_{picture.stem}.jpg", found["annotated"])
        panels.append((picture.name, found["annotated"]))
    if panels:
        montage(panels, out / "test_examples.png", cols=4, cell=(3.6, 3.0))
    save_json(out / "evaluation.json", metrics)
    return metrics


def run_inference_demo(conf: float = 0.25) -> dict:
    """Part 1 on the sample photos and a short demo video."""
    out = out_dir("lab06")
    model = load_model()
    report = {}
    for name in ("bus.jpg", "zidane.jpg"):
        found = detect(model, load_image(SAMPLES / name), conf)
        save_image(out / f"pretrained_{name}", found["annotated"])
        report[name] = {"inference_ms": found["inference_ms"], "boxes": found["boxes"]}
    video = make_demo_video(out / "demo_input.mp4")
    report["video"] = stream(model, video, conf, imgsz=320, save_path=out / "demo_output.mp4")
    save_json(out / "pretrained.json", report)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("detect")
    p.add_argument("--image", default=None)
    p.add_argument("--weights", default=None)
    p.add_argument("--conf", type=float, default=0.25)
    p = sub.add_parser("stream")
    p.add_argument("--source", default="0", help="0 for the webcam, or a video path")
    p.add_argument("--weights", default=None)
    p.add_argument("--conf", type=float, default=0.25)
    p.add_argument("--imgsz", type=int, default=320)
    p.add_argument("--show", action="store_true")
    p.add_argument("--save", default=None)
    p = sub.add_parser("prepare")
    p.add_argument("--train", type=int, default=120)
    p.add_argument("--val", type=int, default=30)
    p.add_argument("--test", type=int, default=30)
    p.add_argument("--own", default=None, help="Folder holding your own annotated dataset")
    p.add_argument("--names", default=None, help="Comma-separated class names, used with --own")
    p = sub.add_parser("train")
    p.add_argument("--data", default=DATA_YAML)
    p.add_argument("--epochs", type=int, default=100)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--batch", type=int, default=16)
    p.add_argument("--weights", default=None, help="Starting weights, for example models/yolo11s.pt")
    p = sub.add_parser("evaluate")
    p.add_argument("--weights", default=TRAINED)
    p.add_argument("--data", default=DATA_YAML)
    p.add_argument("--split", default="test")
    args = parser.parse_args()

    if args.command == "detect":
        if args.image:
            found = detect(load_model(args.weights), load_image(args.image), args.conf)
            save_image(out_dir("lab06") / f"detect_{Path(args.image).name}", found["annotated"])
            print(found["inference_ms"], found["boxes"])
        else:
            print(run_inference_demo(args.conf))
    elif args.command == "stream":
        source = int(args.source) if args.source.isdigit() else args.source
        print(stream(load_model(args.weights), source, args.conf, args.imgsz, args.show, args.save))
    elif args.command == "prepare":
        if args.own:
            if not args.names:
                parser.error("--own needs --names, for example --names mug,phone")
            print(use_own_dataset(args.own, args.names.split(",")))
        else:
            print(prepare_dataset(args.train, args.val, args.test))
    elif args.command == "train":
        print(train(args.data, args.epochs, args.imgsz, args.batch, weights=args.weights))
    elif args.command == "evaluate":
        print(evaluate(args.weights, args.data, args.split))

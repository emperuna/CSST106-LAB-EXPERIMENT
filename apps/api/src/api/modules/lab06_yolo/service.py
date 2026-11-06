"""Lab 6: YOLOv11 detection with the pre-trained and custom-trained models."""
import base64
import json
import tempfile
from pathlib import Path

import cv2
import numpy as np
from cv_labs import lab06_yolo as lab
from cv_labs.common import OUTPUTS
from fastapi import HTTPException

from api.core.images import file_to_data_url, to_data_url
from api.core.schemas import LabResult, Panel, Table, Video

MAX_FRAMES = 120
RESULTS = OUTPUTS / "lab06"
_models: dict = {}


def get_model(name: str):
    """Load a model on first use and keep it, because loading takes seconds."""
    if name not in _models:
        _models[name] = lab.load_model(lab.TRAINED if name == "wildlife" else None)
    return _models[name]


def detect_image(image: np.ndarray, model_name: str, conf: float, imgsz: int) -> LabResult:
    found = lab.detect(get_model(model_name), image, conf, imgsz)
    rows = [[box["label"], round(box["confidence"], 3), *[round(v) for v in box["xyxy"]]] for box in found["boxes"]]
    return LabResult(
        panels=[Panel(title="Detections", image=to_data_url(found["annotated"]),
                      caption=f'{len(rows)} objects, {found["inference_ms"]:.0f} ms inference', large=True)],
        tables=[Table(title="Detected objects", columns=["Label", "Confidence", "x1", "y1", "x2", "y2"], rows=rows)],
    )


def _open_writer(path: str, fps: float, size: tuple[int, int]) -> tuple[cv2.VideoWriter, str]:
    """H.264 plays in every browser. VP8 is the fallback where H.264 encoding is unavailable."""
    for codec, suffix, mime in (("avc1", ".mp4", "video/mp4"), ("VP80", ".webm", "video/webm")):
        writer = cv2.VideoWriter(path + suffix, cv2.VideoWriter_fourcc(*codec), fps, size)
        if writer.isOpened():
            return writer, mime
        writer.release()
    raise HTTPException(status_code=500, detail="No browser-playable video encoder is available.")


def detect_video(data: bytes, model_name: str, conf: float, imgsz: int) -> LabResult:
    model = get_model(model_name)
    with tempfile.TemporaryDirectory() as folder:
        source = Path(folder) / "input"
        source.write_bytes(data)
        capture = cv2.VideoCapture(str(source))
        if not capture.isOpened():
            raise HTTPException(status_code=400, detail="That file could not be read as a video.")
        fps = capture.get(cv2.CAP_PROP_FPS) or 20
        total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        # Sample evenly so a long video still finishes, and stays in step when played back.
        stride = max(1, int(np.ceil(total / MAX_FRAMES))) if total > 0 else 1
        target = str(Path(folder) / "output")
        writer, mime, frames, index, inference, labels = None, "", 0, 0, 0.0, {}
        try:
            while frames < MAX_FRAMES:
                ok, frame = capture.read()
                if not ok:
                    break
                index += 1
                if (index - 1) % stride:
                    continue
                if max(frame.shape[:2]) > 960:
                    scale = 960 / max(frame.shape[:2])
                    frame = cv2.resize(frame, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
                found = lab.detect(model, frame, conf, imgsz)
                inference += found["inference_ms"]
                for box in found["boxes"]:
                    labels[box["label"]] = labels.get(box["label"], 0) + 1
                drawn = found["annotated"]
                # H.264 needs even dimensions.
                drawn = drawn[: drawn.shape[0] & ~1, : drawn.shape[1] & ~1]
                if writer is None:
                    writer, mime = _open_writer(target, fps / stride, (drawn.shape[1], drawn.shape[0]))
                writer.write(drawn)
                frames += 1
        finally:
            capture.release()
            if writer is not None:
                writer.release()
        if frames == 0:
            raise HTTPException(status_code=400, detail="No frames could be read from that video.")
        output = Path(target + (".mp4" if mime == "video/mp4" else ".webm"))
        encoded = base64.b64encode(output.read_bytes()).decode()

    rows = [["Frames processed", frames], ["Frames reported by the file", total], ["Average inference (ms)", round(inference / frames)],
            ["Inference speed (FPS)", round(1000 * frames / max(inference, 1e-6), 1)]]
    notes = [f"Used every {stride} frames to stay within {MAX_FRAMES} frames."] if stride > 1 else []
    return LabResult(
        videos=[Video(title="Detections", source=f"data:{mime};base64,{encoded}")],
        tables=[Table(title="Run summary", columns=["Measure", "Value"], rows=rows),
                Table(title="Detections across all frames", columns=["Label", "Count"],
                      rows=[[label, count] for label, count in sorted(labels.items(), key=lambda item: -item[1])])],
        notes=notes,
    )


def training_summary() -> LabResult:
    """The saved results of the custom training run; training itself takes too long to run on request."""
    paths = {name: RESULTS / name for name in ("evaluation.json", "dataset.json")}
    if not all(path.exists() for path in paths.values()):
        raise HTTPException(status_code=503, detail="Saved training results not found. See the README for the Lab 6 commands.")
    evaluation = json.loads(paths["evaluation.json"].read_text())
    dataset = json.loads(paths["dataset.json"].read_text())
    names = dataset["names"]

    panels = []
    for title, name in (("Training curves", "training_results.png"), ("Confusion matrix", "training_confusion_matrix.png"),
                        ("Precision-recall curve", "training_BoxPR_curve.png"), ("Detections on unseen test images", "test_examples.png")):
        if (RESULTS / name).exists():
            panels.append(Panel(title=title, image=file_to_data_url(RESULTS / name), large=True))

    split_rows = [[split, info["images"], *info["objects_per_class"]] for split, info in dataset["splits"].items()]
    class_rows = [[name, *[round(values[k], 3) for k in ("precision", "recall", "mAP50", "mAP50_95")]]
                  for name, values in evaluation["per_class"].items()]
    class_rows.insert(0, ["All classes", *[round(evaluation[k], 3) for k in ("precision", "recall", "mAP50", "mAP50_95")]])
    return LabResult(
        panels=panels,
        tables=[
            Table(title="Dataset", columns=["Split", "Images", *names], rows=split_rows),
            Table(title=f'Evaluation on the {evaluation["split"]} split', columns=["Class", "Precision", "Recall", "mAP50", "mAP50-95"], rows=class_rows),
        ],
        notes=["Trained for 30 epochs at 320 px on 120 images on a CPU, using the public African Wildlife dataset. "
               "With only 28 test images, these scores are a rough guide."],
    )

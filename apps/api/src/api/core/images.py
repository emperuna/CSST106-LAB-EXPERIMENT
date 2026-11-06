"""Turning uploads and sample names into images, and images back into data URLs."""
import base64
from pathlib import Path

import cv2
import numpy as np
from cv_labs.common import SAMPLES
from fastapi import HTTPException, UploadFile

MAX_UPLOAD_BYTES = 15 * 1024 * 1024

# Sample name -> display label. cells_truth.png is left out: it is the answer key for cells.png.
SAMPLE_LABELS = {
    "input.jpg": "Astronaut",
    "coffee.jpg": "Coffee cup",
    "low_contrast.png": "Moon surface (low contrast)",
    "camera.png": "Cameraman",
    "coins.png": "Coins",
    "page.png": "Scanned page",
    "cells.png": "Synthetic discs (has true mask)",
    "bus.jpg": "Street with a bus",
    "zidane.jpg": "Two people",
}


def sample_path(name: str) -> Path:
    """Only names in the fixed list are accepted, so no other file can be requested."""
    if name not in SAMPLE_LABELS:
        raise HTTPException(status_code=400, detail=f"Unknown sample image: {name}")
    return SAMPLES / name


def read_upload(upload: UploadFile, limit: int = MAX_UPLOAD_BYTES) -> bytes:
    data = upload.file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(status_code=413, detail=f"File is larger than {limit // (1024 * 1024)} MB.")
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    return data


def decode_image(data: bytes) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="That file could not be read as an image.")
    return image


def resolve_image(upload: UploadFile | None, sample: str | None, default: str) -> np.ndarray:
    """Use the uploaded file if there is one, otherwise the chosen or default sample."""
    if upload is not None and upload.filename:
        return decode_image(read_upload(upload))
    return decode_image(sample_path(sample or default).read_bytes())


def limit_size(image: np.ndarray, longest: int, notes: list[str] | None = None) -> np.ndarray:
    """Shrink images beyond `longest` pixels so the slower algorithms stay responsive."""
    h, w = image.shape[:2]
    if max(h, w) <= longest:
        return image
    scale = longest / max(h, w)
    resized = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    if notes is not None:
        notes.append(f"The image was reduced from {w}x{h} to {resized.shape[1]}x{resized.shape[0]} pixels for speed.")
    return resized


def to_data_url(image: np.ndarray, lossless: bool = False) -> str:
    """Grayscale and masks stay PNG so edges stay exact; color photos use JPEG to stay small."""
    use_png = lossless or image.ndim == 2
    ok, buffer = cv2.imencode(".png" if use_png else ".jpg", image, [] if use_png else [cv2.IMWRITE_JPEG_QUALITY, 88])
    if not ok:
        raise HTTPException(status_code=500, detail="Could not encode the result image.")
    kind = "png" if use_png else "jpeg"
    return f"data:image/{kind};base64,{base64.b64encode(buffer).decode()}"


def file_to_data_url(path: Path) -> str:
    """Send an already saved figure, such as a training plot, inline."""
    kind = "png" if path.suffix == ".png" else "jpeg"
    return f"data:image/{kind};base64,{base64.b64encode(path.read_bytes()).decode()}"

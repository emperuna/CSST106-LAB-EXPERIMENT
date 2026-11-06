"""Helpers shared by every lab: paths, image I/O, figures and result files.

Each lab keeps its algorithms in plain functions that take and return NumPy
arrays and dictionaries. Nothing opens a window, so the same functions work
from the command line and from the Web UI that will be built on top of them.
"""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import matplotlib

matplotlib.use("Agg")  # Draw to files; no display is needed.
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

PACKAGE_ROOT = Path(__file__).resolve().parents[2]  # packages/cv-labs
ROOT = PACKAGE_ROOT.parents[1]                      # repository root
SAMPLES = PACKAGE_ROOT / "samples"
WEIGHTS = PACKAGE_ROOT / "weights"
OUTPUTS = ROOT / "outputs"
MODELS = ROOT / "models"
DATA = ROOT / "data"


def out_dir(lab: str) -> Path:
    """Return outputs/<lab>, creating it if needed."""
    path = OUTPUTS / lab
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_image(path, flags: int = cv2.IMREAD_COLOR) -> np.ndarray:
    """Read an image with OpenCV and fail loudly when it cannot be read."""
    image = cv2.imread(str(path), flags)
    if image is None:
        raise FileNotFoundError(f"Image not found or unreadable: {path}")
    return image


def to_gray(image: np.ndarray) -> np.ndarray:
    """Return a single-channel copy of a grayscale or BGR image."""
    return image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def to_uint8(image: np.ndarray) -> np.ndarray:
    """Scale a float image (such as a gradient magnitude) to 0-255 for display."""
    return cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)


def save_image(path, image: np.ndarray) -> None:
    if not cv2.imwrite(str(path), image):
        raise OSError(f"Could not write image: {path}")


def _jsonable(value):
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, np.ndarray):
        return value.tolist()
    raise TypeError(f"Cannot serialise {type(value)}")


def save_json(path, data: dict) -> None:
    Path(path).write_text(json.dumps(data, indent=2, default=_jsonable) + "\n")


def _show(ax, image: np.ndarray, title: str) -> None:
    if image.ndim == 2:
        ax.imshow(image, cmap="gray", vmin=0, vmax=255)
    else:
        ax.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    ax.set_title(title, fontsize=10)
    ax.axis("off")


def montage(panels: list[tuple[str, np.ndarray]], path, cols: int = 3, cell=(4.2, 3.6)) -> None:
    """Save (title, image) pairs side by side as one figure."""
    rows = int(np.ceil(len(panels) / cols))
    fig, axes = plt.subplots(rows, cols, figsize=(cell[0] * cols, cell[1] * rows), squeeze=False)
    flat = axes.ravel()
    for ax in flat:
        ax.axis("off")
    for ax, (title, image) in zip(flat, panels):
        _show(ax, image, title)
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)

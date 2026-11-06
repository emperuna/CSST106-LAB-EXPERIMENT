"""Lab 1 - Image Manipulation: how images are stored and basic OpenCV operations.

Run with: python -m cv_labs.lab01_images [--image path]
"""
from __future__ import annotations

import argparse

import cv2
import numpy as np

from .common import SAMPLES, load_image, montage, out_dir, save_image, save_json


def describe(image: np.ndarray) -> dict:
    """Report the array properties that define a digital image."""
    height, width = image.shape[:2]
    return {
        "shape": image.shape,
        "height": height,
        "width": width,
        "channels": 1 if image.ndim == 2 else image.shape[2],
        "dtype": str(image.dtype),
        "total_pixels": height * width,
        "min_intensity": image.min(),
        "max_intensity": image.max(),
    }


def to_grayscale(image: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def split_bgr(image: np.ndarray) -> dict[str, np.ndarray]:
    """OpenCV stores color pixels in Blue, Green, Red order, not RGB."""
    blue, green, red = cv2.split(image)
    return {"blue": blue, "green": green, "red": red}


def get_pixel(image: np.ndarray, y: int, x: int) -> list[int]:
    """Read one pixel. NumPy indexes by row (y) first, then column (x)."""
    return np.atleast_1d(image[y, x]).tolist()


def set_pixel(image: np.ndarray, y: int, x: int, bgr=(0, 0, 255)) -> np.ndarray:
    """Return a copy of the image with one pixel changed."""
    changed = image.copy()
    changed[y, x] = bgr
    return changed


def zoom_around(image: np.ndarray, y: int, x: int, radius: int = 10, scale: int = 15) -> np.ndarray:
    """Enlarge the area around a pixel; a single changed pixel is otherwise invisible."""
    top, left = max(y - radius, 0), max(x - radius, 0)
    patch = image[top:y + radius + 1, left:x + radius + 1]
    return cv2.resize(patch, None, fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST)


def crop(image: np.ndarray, y1: int, y2: int, x1: int, x2: int) -> np.ndarray:
    """Cut a region of interest with array slicing."""
    return image[y1:y2, x1:x2].copy()


def resize(image: np.ndarray, scale: float) -> np.ndarray:
    """Scale up or down, using the interpolation suited to each direction."""
    method = cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC
    return cv2.resize(image, None, fx=scale, fy=scale, interpolation=method)


def rotate90(image: np.ndarray, clockwise: bool = True) -> np.ndarray:
    code = cv2.ROTATE_90_CLOCKWISE if clockwise else cv2.ROTATE_90_COUNTERCLOCKWISE
    return cv2.rotate(image, code)


def run(image_path=SAMPLES / "input.jpg", out=None) -> dict:
    out = out or out_dir("lab01")
    image = load_image(image_path)
    gray = to_grayscale(image)
    height, width = image.shape[:2]

    # Part 1: pixel inspection and modification (center of the image by default).
    y, x = height // 2, width // 2
    changed = set_pixel(image, y, x, (0, 0, 255))

    # Part 2: crop the central half, shrink, enlarge and rotate.
    roi = crop(image, height // 4, 3 * height // 4, width // 4, 3 * width // 4)
    smaller, larger = resize(image, 0.5), resize(image, 1.5)
    rotated = rotate90(image)
    channels = split_bgr(image)

    outputs = {"original": image, "grayscale": gray, "pixel_changed": changed,
               "pixel_zoom_before": zoom_around(image, y, x),
               "pixel_zoom_after": zoom_around(changed, y, x),
               "crop": roi, "resized_small": smaller, "resized_large": larger,
               "rotated_90": rotated, **{f"channel_{k}": v for k, v in channels.items()}}
    for name, result in outputs.items():
        save_image(out / f"{name}.png", result)

    montage([("Original (BGR)", image), ("Grayscale", gray),
             (f"Crop {roi.shape[1]}x{roi.shape[0]}", roi),
             (f"Resized 0.5x: {smaller.shape[1]}x{smaller.shape[0]}", smaller),
             (f"Resized 1.5x: {larger.shape[1]}x{larger.shape[0]}", larger),
             ("Rotated 90 degrees clockwise", rotated),
             ("Blue channel", channels["blue"]), ("Green channel", channels["green"]),
             ("Red channel", channels["red"])], out / "summary.png")
    montage([(f"Before: pixel ({x},{y}) = {get_pixel(image, y, x)}", zoom_around(image, y, x)),
             (f"After: pixel ({x},{y}) = {get_pixel(changed, y, x)}", zoom_around(changed, y, x))],
            out / "pixel_change.png", cols=2)

    metrics = {
        "image": str(image_path),
        "color": describe(image),
        "grayscale": describe(gray),
        "pixel": {"y": y, "x": x, "bgr_before": get_pixel(image, y, x),
                  "bgr_after": get_pixel(changed, y, x), "gray_value": get_pixel(gray, y, x)},
        "sizes": {"crop": roi.shape, "small": smaller.shape, "large": larger.shape,
                  "rotated": rotated.shape},
    }
    save_json(out / "metrics.json", metrics)
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", default=SAMPLES / "input.jpg")
    print(run(parser.parse_args().image))

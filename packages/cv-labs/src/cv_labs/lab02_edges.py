"""Lab 2 - Edge Detection: Sobel and Canny on the same image, side by side.

Run with: python -m cv_labs.lab02_edges [--image path] [--low 100] [--high 200]
"""
from __future__ import annotations

import argparse

import cv2
import numpy as np

from .common import SAMPLES, load_image, montage, out_dir, save_image, save_json, to_gray, to_uint8


def preprocess(gray: np.ndarray, ksize: int = 3) -> np.ndarray:
    """Blur before differentiating, because derivatives amplify noise."""
    return cv2.GaussianBlur(gray, (ksize, ksize), 0)


def sobel(blurred: np.ndarray, ksize: int = 3) -> dict[str, np.ndarray]:
    """Return x and y gradients and their magnitude (64-bit, keeps negative slopes)."""
    gx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=ksize)
    gy = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=ksize)
    return {"x": gx, "y": gy, "magnitude": cv2.magnitude(gx, gy)}


def canny(blurred: np.ndarray, low: int = 100, high: int = 200) -> np.ndarray:
    """Gradient + non-maximum suppression + hysteresis thresholding."""
    return cv2.Canny(blurred, low, high)


def percent_marked(binary: np.ndarray) -> float:
    """Percentage of pixels marked as edge."""
    return float(100 * np.count_nonzero(binary) / binary.size)


def run(image_path=SAMPLES / "input.jpg", low: int = 100, high: int = 200, out=None) -> dict:
    out = out or out_dir("lab02")
    gray = to_gray(load_image(image_path))
    blurred = preprocess(gray)
    gradients = sobel(blurred)
    edges = canny(blurred, low, high)

    sobel_x = to_uint8(np.abs(gradients["x"]))
    sobel_y = to_uint8(np.abs(gradients["y"]))
    sobel_mag = to_uint8(gradients["magnitude"])
    for name, result in {"original": gray, "sobel_x": sobel_x, "sobel_y": sobel_y,
                         "sobel_combined": sobel_mag, "canny": edges}.items():
        save_image(out / f"{name}.png", result)

    # The side-by-side comparison the lab asks for.
    montage([("Original Image", gray), ("Sobel Edge Detection", sobel_mag),
             (f"Canny Edge Detection ({low}, {high})", edges)], out / "comparison.png")
    montage([("Sobel X (vertical edges)", sobel_x), ("Sobel Y (horizontal edges)", sobel_y),
             ("Combined magnitude", sobel_mag)], out / "sobel_directions.png")
    settings = [(30, 90), (100, 200), (200, 300)]
    montage([(f"Canny ({a}, {b})", canny(blurred, a, b)) for a, b in settings],
            out / "canny_thresholds.png")

    # Sobel gives a continuous strength map, so count how much of it has any response;
    # Canny gives a binary one-pixel-wide map.
    metrics = {
        "image": str(image_path),
        "sobel_distinct_levels": int(np.unique(sobel_mag).size),
        "canny_distinct_levels": int(np.unique(edges).size),
        "sobel_percent_above_10pct_of_max": percent_marked(sobel_mag > 25),
        "canny_percent_edge_pixels": percent_marked(edges),
        "canny_threshold_sweep": {f"{a}-{b}": percent_marked(canny(blurred, a, b)) for a, b in settings},
    }
    save_json(out / "metrics.json", metrics)
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", default=SAMPLES / "input.jpg")
    parser.add_argument("--low", type=int, default=100)
    parser.add_argument("--high", type=int, default=200)
    args = parser.parse_args()
    print(run(args.image, args.low, args.high))

"""Lab 3 - Histogram Equalization and Contrast Adjustment.

Run with: python -m cv_labs.lab03_histogram [--image path] [--color-image path]
"""
from __future__ import annotations

import argparse

import cv2
import matplotlib.pyplot as plt
import numpy as np

from .common import SAMPLES, load_image, montage, out_dir, save_image, save_json, to_gray


def histogram(gray: np.ndarray) -> np.ndarray:
    return cv2.calcHist([gray], [0], None, [256], [0, 256]).ravel()


def equalize_manual(gray: np.ndarray) -> np.ndarray:
    """Part 3: histogram equalization written out step by step.

    1. Count how many pixels have each intensity (the histogram).
    2. Sum those counts to get the cumulative distribution (CDF).
    3. Rescale the CDF so it spans 0-255; this becomes a lookup table.
    4. Replace every pixel using the table, spreading crowded intensities apart.
    """
    hist = np.bincount(gray.ravel(), minlength=256)
    cdf = hist.cumsum()
    cdf_min = cdf[cdf > 0][0]
    if gray.size == cdf_min:      # One flat intensity: nothing to spread.
        return gray.copy()
    table = np.round((cdf - cdf_min) / (gray.size - cdf_min) * 255)
    return np.clip(table, 0, 255).astype(np.uint8)[gray]


def equalize_global(gray: np.ndarray) -> np.ndarray:
    return cv2.equalizeHist(gray)


def equalize_color(image: np.ndarray, space: str = "yuv") -> np.ndarray:
    """Equalize brightness only; doing each BGR channel separately would shift colors."""
    if space == "yuv":
        yuv = cv2.cvtColor(image, cv2.COLOR_BGR2YUV)
        yuv[:, :, 0] = cv2.equalizeHist(yuv[:, :, 0])
        return cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
    if space == "hsv":
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hsv[:, :, 2] = cv2.equalizeHist(hsv[:, :, 2])
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    raise ValueError(f"Unknown color space: {space}")


def contrast_stretch(gray: np.ndarray, low_pct: float = 2, high_pct: float = 98) -> np.ndarray:
    """Linear stretch: map the low..high percentile range onto 0..255.

    Percentiles stop a few extreme pixels from fixing the range and cancelling the effect.
    """
    low, high = np.percentile(gray, (low_pct, high_pct))
    if high <= low:
        return gray.copy()
    return np.clip((gray.astype(np.float32) - low) * 255 / (high - low), 0, 255).astype(np.uint8)


def apply_clahe(gray: np.ndarray, clip_limit: float = 2.0, grid: int = 8) -> np.ndarray:
    return cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(grid, grid)).apply(gray)


def entropy(gray: np.ndarray) -> float:
    """Shannon entropy in bits: how evenly intensities are used."""
    p = histogram(gray) / gray.size
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())


def flat_region_noise(gray: np.ndarray, reference: np.ndarray, patch: int = 8) -> float:
    """Median patch standard deviation in the flattest 10% of the *reference* image.

    The same patches are used for every version, so a rise means texture or
    noise in smooth areas was amplified.
    """
    h, w = (dim - dim % patch for dim in gray.shape)
    def stds(img):
        blocks = img[:h, :w].astype(np.float32).reshape(h // patch, patch, w // patch, patch)
        return blocks.std(axis=(1, 3)).ravel()
    base = stds(reference)
    return float(np.median(stds(gray)[base <= np.percentile(base, 10)]))


def stats(gray: np.ndarray, reference: np.ndarray) -> dict:
    return {"mean": float(gray.mean()), "std_contrast": float(gray.std()),
            "min": int(gray.min()), "max": int(gray.max()), "entropy_bits": entropy(gray),
            "flat_region_noise": flat_region_noise(gray, reference)}


def plot_histograms(versions: dict[str, np.ndarray], path) -> None:
    """Each image above its histogram and CDF."""
    n = len(versions)
    fig, axes = plt.subplots(2, n, figsize=(3.8 * n, 6.2), squeeze=False)
    for i, (title, gray) in enumerate(versions.items()):
        axes[0, i].imshow(gray, cmap="gray", vmin=0, vmax=255)
        axes[0, i].set_title(title, fontsize=10)
        axes[0, i].axis("off")
        hist = histogram(gray)
        axes[1, i].bar(range(256), hist, width=1, color="#3b6ea5")
        axes[1, i].set_xlim(0, 255)
        axes[1, i].set_xlabel("Intensity")
        axes[1, i].set_ylabel("Pixels" if i == 0 else "")
        cdf_axis = axes[1, i].twinx()
        cdf_axis.plot(hist.cumsum() / gray.size, color="#c4532d", lw=1.2)
        cdf_axis.set_ylim(0, 1.02)
        cdf_axis.set_ylabel("Cumulative share" if i == n - 1 else "")
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def run(image_path=SAMPLES / "low_contrast.png", color_path=SAMPLES / "coffee.jpg", out=None) -> dict:
    out = out or out_dir("lab03")
    gray = to_gray(load_image(image_path))
    color = load_image(color_path)

    equalized = equalize_global(gray)
    manual = equalize_manual(gray)
    stretched = contrast_stretch(gray)
    clahe = apply_clahe(gray)
    color_yuv, color_hsv = equalize_color(color, "yuv"), equalize_color(color, "hsv")

    for name, result in {"original": gray, "equalized": equalized, "equalized_manual": manual,
                         "stretched": stretched, "clahe": clahe, "color_yuv": color_yuv,
                         "color_hsv": color_hsv}.items():
        save_image(out / f"{name}.png", result)

    plot_histograms({"Original": gray, "Global equalization": equalized}, out / "part1_histograms.png")
    plot_histograms({"Original": gray, "Contrast stretching": stretched, "Global equalization": equalized,
                     "CLAHE": clahe}, out / "part2_histograms.png")
    montage([("Original color", color), ("Equalized on Y (YUV)", color_yuv),
             ("Equalized on V (HSV)", color_hsv)], out / "part1_color.png")
    montage([(f"CLAHE clip={c}", apply_clahe(gray, c)) for c in (1.0, 2.0, 4.0, 8.0)],
            out / "clahe_clip_limits.png", cols=4)

    difference = np.abs(manual.astype(int) - equalized.astype(int))
    metrics = {
        "image": str(image_path),
        "color_image": str(color_path),
        "versions": {name: stats(result, gray) for name, result in
                     {"original": gray, "stretched": stretched, "global": equalized, "clahe": clahe}.items()},
        "manual_vs_opencv": {"max_difference": int(difference.max()),
                             "identical_pixels_percent": float(100 * (difference == 0).mean())},
        "clahe_clip_sweep": {str(c): stats(apply_clahe(gray, c), gray) for c in (1.0, 2.0, 4.0, 8.0)},
    }
    save_json(out / "metrics.json", metrics)
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", default=SAMPLES / "low_contrast.png")
    parser.add_argument("--color-image", default=SAMPLES / "coffee.jpg")
    args = parser.parse_args()
    print(run(args.image, args.color_image))

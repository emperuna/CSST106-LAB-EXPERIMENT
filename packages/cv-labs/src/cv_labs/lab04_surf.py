"""Lab 4 - SURF feature detection, matching, and comparison with SIFT, ORB and U-SURF.

Run with: python -m cv_labs.lab04_surf [--image path] [--second path] [--threshold 400]

Without --second, the second image is a known rotation and scaling of the first.
The true position of every point is then known, so matches can be scored as right
or wrong rather than only counted.
"""
from __future__ import annotations

import argparse
import time

import cv2
import matplotlib.pyplot as plt
import numpy as np

from .common import SAMPLES, load_image, out_dir, save_image, save_json, to_gray
from .surf import create_surf

PIXEL_TOLERANCE = 3.0  # A match counts as correct within this distance of the true position.


def make_detectors(hessian_threshold: float = 400) -> dict:
    """The four methods compared, with the distance measure each descriptor needs."""
    return {
        "SURF": (create_surf(hessian_threshold), cv2.NORM_L2),
        "U-SURF": (create_surf(hessian_threshold, upright=True), cv2.NORM_L2),
        "SIFT": (cv2.SIFT_create(), cv2.NORM_L2),
        "ORB": (cv2.ORB_create(nfeatures=2000), cv2.NORM_HAMMING),
    }


def detect(detector, gray: np.ndarray):
    """Return keypoints, descriptors and the elapsed milliseconds."""
    start = time.perf_counter()
    keypoints, descriptors = detector.detectAndCompute(gray, None)
    return keypoints, descriptors, (time.perf_counter() - start) * 1000


def draw_keypoints(gray: np.ndarray, keypoints) -> np.ndarray:
    """Circles show each keypoint's scale; the radius line shows its orientation."""
    return cv2.drawKeypoints(gray, keypoints, None, (255, 0, 0),
                             cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)


def match(desc1, desc2, norm: int, ratio: float = 0.75) -> list:
    """Brute-force 2-nearest-neighbor matching with Lowe's ratio test.

    A match is kept only if it is clearly better than the second-best candidate.
    """
    if desc1 is None or desc2 is None or len(desc1) < 2 or len(desc2) < 2:
        return []
    pairs = cv2.BFMatcher(norm).knnMatch(desc1, desc2, k=2)
    return [p[0] for p in pairs if len(p) == 2 and p[0].distance < ratio * p[1].distance]


def ransac_inliers(kp1, kp2, matches) -> int:
    """How many matches agree on a single perspective transform."""
    if len(matches) < 4:
        return 0
    src = np.float32([kp1[m.queryIdx].pt for m in matches])
    dst = np.float32([kp2[m.trainIdx].pt for m in matches])
    _, mask = cv2.findHomography(src, dst, cv2.RANSAC, PIXEL_TOLERANCE)
    return 0 if mask is None else int(mask.sum())


def correct_matches(kp1, kp2, matches, true_h: np.ndarray) -> list:
    """Matches whose second point lies where the known transform says it should."""
    if not matches:
        return []
    src = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    dst = np.float32([kp2[m.trainIdx].pt for m in matches])
    expected = cv2.perspectiveTransform(src, true_h).reshape(-1, 2)
    errors = np.linalg.norm(expected - dst, axis=1)
    return [m for m, e in zip(matches, errors) if e <= PIXEL_TOLERANCE]


def warp(gray: np.ndarray, degrees: float = 30, scale: float = 0.8):
    """Rotate and scale about the center; returns the image and its 3x3 transform."""
    h, w = gray.shape
    matrix = np.vstack([cv2.getRotationMatrix2D((w / 2, h / 2), degrees, scale), [0, 0, 1]])
    return cv2.warpPerspective(gray, matrix, (w, h)), matrix


def compare(gray1, gray2, true_h=None, hessian_threshold: float = 400) -> tuple[dict, dict]:
    """Run every method on the same pair. Returns the table and the data for drawing."""
    table, drawn = {}, {}
    for name, (detector, norm) in make_detectors(hessian_threshold).items():
        kp1, desc1, ms1 = detect(detector, gray1)
        kp2, desc2, ms2 = detect(detector, gray2)
        matches = match(desc1, desc2, norm)
        row = {
            "backend": getattr(detector, "backend", "opencv"),
            "keypoints_image1": len(kp1), "keypoints_image2": len(kp2),
            "descriptor_length": 0 if desc1 is None else int(desc1.shape[1]),
            "descriptor_type": "binary" if norm == cv2.NORM_HAMMING else "float",
            "time_ms_image1": ms1, "ms_per_keypoint": ms1 / max(len(kp1), 1),
            "ratio_test_matches": len(matches),
            "ransac_inliers": ransac_inliers(kp1, kp2, matches),
        }
        if true_h is not None:
            good = correct_matches(kp1, kp2, matches, true_h)
            row["correct_matches"] = len(good)
            row["correct_percent"] = 100 * len(good) / max(len(matches), 1)
        table[name] = row
        drawn[name] = (kp1, kp2, matches)
    return table, drawn


def threshold_sweep(gray: np.ndarray, thresholds=(100, 200, 400, 800, 1600, 3200)) -> dict:
    """The Hessian threshold controls how strong a blob must be to count as a keypoint."""
    return {t: len(create_surf(t).detectAndCompute(gray, None)[0]) for t in thresholds}


def rotation_sweep(gray: np.ndarray, angles=(0, 5, 10, 15, 30, 45, 90, 180), threshold: float = 400) -> dict:
    """Correct matches as rotation grows, for SURF and U-SURF, at unchanged scale."""
    result = {"SURF": {}, "U-SURF": {}}
    surf, upright = create_surf(threshold), create_surf(threshold, upright=True)
    for name, detector in (("SURF", surf), ("U-SURF", upright)):
        kp1, desc1, _ = detect(detector, gray)
        for angle in angles:
            rotated, matrix = warp(gray, angle, 1.0)
            kp2, desc2, _ = detect(detector, rotated)
            result[name][angle] = len(correct_matches(kp1, kp2, match(desc1, desc2, cv2.NORM_L2), matrix))
    return result


def _plot_line(data: dict, path, xlabel: str, ylabel: str, title: str) -> None:
    fig, ax = plt.subplots(figsize=(6.6, 3.8))
    for label, series in data.items():
        ax.plot(list(map(str, series)), list(series.values()), marker="o", label=label)
    ax.set(xlabel=xlabel, ylabel=ylabel, title=title)
    ax.grid(alpha=0.3)
    if len(data) > 1:
        ax.legend()
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def _plot_comparison(table: dict, path) -> None:
    names = list(table)
    fields = [("keypoints_image1", "Keypoints"), ("ratio_test_matches", "Matches"),
              ("correct_percent", "Correct matches (%)"), ("ransac_inliers", "RANSAC inliers")]
    fields = [f for f in fields if f[0] in table[names[0]]]
    fig, axes = plt.subplots(1, len(fields), figsize=(3.1 * len(fields), 3.2))
    for ax, (key, label) in zip(np.atleast_1d(axes), fields):
        values = [table[n][key] for n in names]
        bars = ax.bar(names, values, color="#3b6ea5")
        ax.bar_label(bars, fmt="%.0f", fontsize=8)
        ax.set_title(label, fontsize=10)
        ax.tick_params(axis="x", labelsize=8)
        ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def run(image_path=SAMPLES / "camera.png", second_path=None, hessian_threshold: float = 400, out=None) -> dict:
    out = out or out_dir("lab04")
    gray1 = to_gray(load_image(image_path))
    if second_path:
        gray2, true_h = to_gray(load_image(second_path)), None
    else:
        gray2, true_h = warp(gray1)

    table, drawn = compare(gray1, gray2, true_h, hessian_threshold)

    # Keypoints and matches for each method.
    for name, (kp1, kp2, matches) in drawn.items():
        slug = name.lower().replace("-", "")
        save_image(out / f"{slug}_keypoints.png", draw_keypoints(gray1, kp1))
        best = sorted(matches, key=lambda m: m.distance)[:60]
        save_image(out / f"{slug}_matches.png",
                   cv2.drawMatches(gray1, kp1, gray2, kp2, best, None,
                                   flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS))
    save_image(out / "second_image.png", gray2)
    _plot_comparison(table, out / "comparison.png")

    sweep = threshold_sweep(gray1)
    _plot_line({"SURF": sweep}, out / "hessian_threshold.png", "Hessian threshold", "Keypoints",
               "Higher threshold, fewer keypoints")
    rotation = rotation_sweep(gray1, threshold=hessian_threshold)
    _plot_line(rotation, out / "usurf_rotation.png", "Rotation (degrees)", "Correct matches",
               "SURF vs U-SURF under rotation")

    metrics = {
        "image": str(image_path),
        "second_image": str(second_path) if second_path else "image 1 rotated 30 degrees, scaled 0.8",
        "hessian_threshold": hessian_threshold,
        "comparison": table,
        "keypoints_by_threshold": sweep,
        "correct_matches_by_rotation": rotation,
        "timing_note": "The NumPy SURF is pure Python array code; SIFT and ORB are compiled C++. "
                       "Their times show this implementation difference, not the algorithms' relative speed.",
    }
    save_json(out / "metrics.json", metrics)
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", default=SAMPLES / "camera.png")
    parser.add_argument("--second", default=None)
    parser.add_argument("--threshold", type=float, default=400)
    args = parser.parse_args()
    print(run(args.image, args.second, args.threshold))

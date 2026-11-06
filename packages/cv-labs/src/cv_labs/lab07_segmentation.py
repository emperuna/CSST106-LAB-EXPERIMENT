"""Lab 7 - Segmentation: thresholding, region-based, edge-based and semantic methods.

Run with: python -m cv_labs.lab07_segmentation [--semantic-image path]

Three kinds of test image are used:
  cells.png  synthetic touching discs with an exact mask, so IoU can be measured
  coins.png  a real photo of touching objects
  page.png   a real scan with uneven lighting
Semantic segmentation runs on natural scenes. No pixel-level labels are included
for those, so its output is judged by eye and not given an IoU score.
"""
from __future__ import annotations

import argparse
import time
from collections import deque

import cv2
import matplotlib.pyplot as plt
import numpy as np
from scipy import ndimage as ndi
from skimage.segmentation import watershed as skimage_watershed

from .common import MODELS, SAMPLES, load_image, montage, out_dir, save_image, save_json, to_gray


# ---------- 1. Thresholding ----------

def otsu(gray: np.ndarray) -> tuple[np.ndarray, float]:
    """One global threshold, chosen to best separate the two intensity groups."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    value, mask = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return mask, float(value)


def adaptive(gray: np.ndarray, block: int = 51, c: float = 5) -> np.ndarray:
    """A separate threshold per neighborhood: the local weighted mean minus c."""
    return cv2.adaptiveThreshold(cv2.GaussianBlur(gray, (5, 5), 0), 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY, block | 1, c)


# ---------- 2. Region-based ----------

def region_grow(gray: np.ndarray, seeds: list[tuple[int, int]], tolerance: float = 25) -> np.ndarray:
    """Grow from each (y, x) seed, adding neighbors close to the region's running mean.

    Returns a label image: 0 is unassigned and 1..n identify the region from each seed.
    """
    h, w = gray.shape
    labels = np.zeros((h, w), np.int32)
    values = gray.astype(np.float64)
    neighbors = ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1))
    for region, (sy, sx) in enumerate(seeds, start=1):
        if labels[sy, sx]:
            continue    # An earlier seed already reached this point.
        labels[sy, sx] = region
        queue = deque([(sy, sx)])
        total, count = values[sy, sx], 1
        while queue:
            y, x = queue.popleft()
            for dy, dx in neighbors:
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not labels[ny, nx] and abs(values[ny, nx] - total / count) <= tolerance:
                    labels[ny, nx] = region
                    total += values[ny, nx]
                    count += 1
                    queue.append((ny, nx))
    return labels


def find_seeds(mask: np.ndarray, min_distance: int = 15) -> list[tuple[int, int]]:
    """Choose seeds automatically at distance-transform peaks, deep inside foreground blobs."""
    distance = cv2.distanceTransform((mask > 0).astype(np.uint8), cv2.DIST_L2, 5)
    size = 2 * min_distance + 1
    peaks = (distance == ndi.maximum_filter(distance, size=size)) & (distance > 0.4 * distance.max())
    # Plateaus can yield several adjacent peaks; keep one point from each.
    labelled, n = ndi.label(peaks)
    centers = ndi.center_of_mass(peaks, labelled, range(1, n + 1))
    return [(int(round(y)), int(round(x))) for y, x in centers]


def clean(mask: np.ndarray, size: int = 5) -> np.ndarray:
    """Morphological opening then closing: removes specks and closes small gaps."""
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size))
    opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    return cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)


def fill_holes(mask: np.ndarray) -> np.ndarray:
    return ndi.binary_fill_holes(mask > 0).astype(np.uint8) * 255


def watershed(foreground: np.ndarray, min_distance: int = 15) -> np.ndarray:
    """Separate touching objects: flood from one marker per object until the floods meet.

    The flood runs over the inverted distance map, so object centers are basins and the
    narrow neck between two touching objects is a ridge. Flooding the photo itself would
    follow surface texture instead of object shape.
    Returns labels: 1 is background, 2+ are objects and -1 marks the dividing lines.
    """
    markers = np.zeros(foreground.shape, np.int32)
    for number, (y, x) in enumerate(find_seeds(foreground, min_distance), start=1):
        markers[y, x] = number
    # Foreground specks with no marker are noise, not objects: treat them as background.
    components, _ = ndi.label(foreground > 0)
    inside = np.isin(components, np.unique(components[markers > 0]))
    distance = cv2.distanceTransform(foreground, cv2.DIST_L2, 5)
    flooded = skimage_watershed(-distance, markers, mask=inside, watershed_line=True)
    labels = flooded + 1            # Objects start at 2.
    labels[~inside] = 1
    labels[inside & (flooded == 0)] = -1
    return labels


# ---------- 3. Edge-based ----------

def edge_segment(gray: np.ndarray, low: int = 50, high: int = 150, min_area: int = 100, close: int = 5):
    """Canny, then close gaps in the outlines, then fill each closed outer contour."""
    edges = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), low, high)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close))
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = [c for c in contours if cv2.contourArea(c) >= min_area]
    mask = np.zeros_like(gray)
    cv2.drawContours(mask, contours, -1, 255, cv2.FILLED)
    return mask, edges, contours


# ---------- 4. Semantic ----------

_semantic_model = None


def load_semantic_model():
    """DeepLabV3 (MobileNetV3 backbone) trained on COCO images with the 20 PASCAL VOC classes."""
    global _semantic_model
    if _semantic_model is None:
        # Imported here, not at the top, because PyTorch takes seconds to load.
        import torch
        from torchvision.models.segmentation import DeepLabV3_MobileNet_V3_Large_Weights, deeplabv3_mobilenet_v3_large

        torch.hub.set_dir(str(MODELS / "torch"))
        weights = DeepLabV3_MobileNet_V3_Large_Weights.COCO_WITH_VOC_LABELS_V1
        _semantic_model = (deeplabv3_mobilenet_v3_large(weights=weights).eval(), weights)
    return _semantic_model


def semantic_segment(image: np.ndarray) -> dict:
    """Assign one of 21 classes (20 objects + background) to every pixel of a BGR image."""
    import torch

    model, weights = load_semantic_model()
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    tensor = torch.from_numpy(rgb).permute(2, 0, 1)
    batch = weights.transforms()(tensor).unsqueeze(0)
    start = time.perf_counter()
    with torch.inference_mode():
        logits = model(batch)["out"]
    seconds = time.perf_counter() - start
    # The model resizes its input, so scale the prediction back to the original size.
    logits = torch.nn.functional.interpolate(logits, size=image.shape[:2], mode="bilinear", align_corners=False)
    classes = logits.argmax(1)[0].numpy().astype(np.uint8)
    names = weights.meta["categories"]
    shares = {names[c]: float(100 * (classes == c).mean()) for c in np.unique(classes)}
    return {"classes": classes, "names": names, "percent_of_pixels": shares, "seconds": seconds}


def voc_colors(n: int = 21) -> np.ndarray:
    """The standard PASCAL VOC color for each class, as BGR."""
    colors = np.zeros((n, 3), np.uint8)
    for i in range(n):
        value, r, g, b = i, 0, 0, 0
        for bit in range(8):
            r |= ((value >> 0) & 1) << (7 - bit)
            g |= ((value >> 1) & 1) << (7 - bit)
            b |= ((value >> 2) & 1) << (7 - bit)
            value >>= 3
        colors[i] = (b, g, r)
    return colors


def semantic_figure(image: np.ndarray, result: dict, path) -> None:
    """Original, class map and overlay, with a legend naming the classes found."""
    colors = voc_colors()
    painted = colors[result["classes"]]
    overlay = cv2.addWeighted(image, 0.55, painted, 0.45, 0)
    fig, axes = plt.subplots(1, 3, figsize=(13, 5))
    for ax, picture, title in zip(axes, (image, painted, overlay), ("Original", "Class per pixel", "Overlay")):
        ax.imshow(cv2.cvtColor(picture, cv2.COLOR_BGR2RGB))
        ax.set_title(title)
        ax.axis("off")
    handles = [plt.Rectangle((0, 0), 1, 1, color=colors[result["names"].index(name)][::-1] / 255)
               for name in result["percent_of_pixels"]]
    labels = [f"{name}: {share:.1f}%" for name, share in result["percent_of_pixels"].items()]
    fig.legend(handles, labels, loc="lower center", ncol=min(len(labels), 6), frameon=False)
    fig.tight_layout(rect=(0, 0.07, 1, 1))
    fig.savefig(path, dpi=130)
    plt.close(fig)


# ---------- Measuring ----------

def score(mask: np.ndarray, truth: np.ndarray) -> dict:
    """Overlap with the true mask. IoU = intersection / union; Dice = 2*intersection / total area."""
    pred, real = mask > 0, truth > 0
    intersection = np.logical_and(pred, real).sum()
    union = np.logical_or(pred, real).sum()
    return {"iou": float(intersection / max(union, 1)),
            "dice": float(2 * intersection / max(pred.sum() + real.sum(), 1)),
            "pixel_accuracy": float((pred == real).mean())}


def count_objects(mask: np.ndarray, min_area: int = 100) -> int:
    n, _, stats, _ = cv2.connectedComponentsWithStats((mask > 0).astype(np.uint8))
    return int((stats[1:, cv2.CC_STAT_AREA] >= min_area).sum()) if n > 1 else 0


def border(mask: np.ndarray) -> np.ndarray:
    return cv2.morphologyEx((mask > 0).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0


def border_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Average pixel distance between two segmentation outlines, measured both ways."""
    edge_a, edge_b = border(a), border(b)
    if not edge_a.any() or not edge_b.any():
        return float("nan")
    from_b = ndi.distance_transform_edt(~edge_b)
    from_a = ndi.distance_transform_edt(~edge_a)
    return float((from_b[edge_a].mean() + from_a[edge_b].mean()) / 2)


def timed(function, *args, **kwargs):
    start = time.perf_counter()
    result = function(*args, **kwargs)
    return result, (time.perf_counter() - start) * 1000


def outline(gray: np.ndarray, mask_or_labels: np.ndarray, color=(0, 255, 0), from_labels: bool = False) -> np.ndarray:
    picture = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    if from_labels:
        picture[mask_or_labels == -1] = color
    else:
        picture[border(mask_or_labels)] = color
    return picture


def label_colors(labels: np.ndarray, seed: int = 1) -> np.ndarray:
    """A distinct color per region, with background (label <= 1 for watershed) left black."""
    rng = np.random.default_rng(seed)
    palette = rng.integers(60, 255, (max(labels.max(), 1) + 1, 3), dtype=np.uint8)
    painted = palette[np.maximum(labels, 0)]
    painted[labels <= 0] = 0
    return painted


# ---------- Running the experiments ----------

def classical_methods(gray: np.ndarray, block: int, c: float, tolerance: float, canny=(50, 150),
                      min_distance: int = 15) -> dict:
    """Apply each classical method to one image and collect masks and timings."""
    results = {}
    (otsu_mask, otsu_value), ms = timed(otsu, gray)
    results["Otsu threshold"] = {"mask": otsu_mask, "ms": ms, "threshold": otsu_value}

    raw_adaptive, ms = timed(adaptive, gray, block, c)
    adaptive_mask = fill_holes(clean(raw_adaptive))
    results["Adaptive threshold"] = {"mask": adaptive_mask, "ms": ms, "raw": raw_adaptive}

    # Seeds come from the adaptive result, so region growing has starting points inside objects.
    seeds = find_seeds(adaptive_mask, min_distance)
    # Blurring first keeps surface texture from stopping the growth.
    labels, ms = timed(region_grow, cv2.GaussianBlur(gray, (5, 5), 0), seeds, tolerance)
    results["Region growing"] = {"mask": fill_holes(clean((labels > 0).astype(np.uint8) * 255)), "ms": ms,
                                 "labels": labels, "seeds": seeds}

    water, ms = timed(watershed, adaptive_mask, min_distance)
    # Dividing lines between two objects are still foreground for the overlap score.
    water_mask = (water > 1) | (water == -1)
    results["Watershed"] = {"mask": water_mask.astype(np.uint8) * 255, "ms": ms, "labels": water,
                            "objects": int(len(np.unique(water[water > 1])))}

    (edge_mask, edges, contours), ms = timed(edge_segment, gray, *canny)
    results["Edge + contours"] = {"mask": edge_mask, "ms": ms, "edges": edges, "contours": len(contours)}
    return results


def report_rows(results: dict, truth=None) -> dict:
    rows = {}
    for name, item in results.items():
        row = {"time_ms": item["ms"], "objects_found": item.get("objects", count_objects(item["mask"]))}
        if truth is not None:
            row.update(score(item["mask"], truth))
        rows[name] = row
    return rows


def run_classical(name: str, path, out, truth=None, **settings) -> dict:
    gray = to_gray(load_image(path))
    results = classical_methods(gray, **settings)
    panels = [("Original", gray)]
    for method, item in results.items():
        panels.append((method, outline(gray, item["mask"])))
    panels.append(("Watershed regions", label_colors(results["Watershed"]["labels"] - 1)))
    seeded = outline(gray, results["Region growing"]["mask"])
    for y, x in results["Region growing"]["seeds"]:
        cv2.circle(seeded, (x, y), 4, (0, 0, 255), -1)
    panels.append(("Region growing seeds", seeded))
    panels.append(("Canny edges", results["Edge + contours"]["edges"]))
    montage(panels, out / f"{name}_comparison.png", cols=3, cell=(3.8, 3.4))
    for method, item in results.items():
        slug = method.lower().replace(" ", "_").replace("+", "and")
        save_image(out / f"{name}_{slug}.png", item["mask"])
    return {
        "image": str(path),
        "methods": report_rows(results, truth),
        "otsu_threshold": results["Otsu threshold"]["threshold"],
        "seeds": len(results["Region growing"]["seeds"]),
        "edge_vs_watershed_border_px": border_distance(results["Edge + contours"]["mask"], results["Watershed"]["mask"]),
        "edge_vs_region_growing_border_px": border_distance(results["Edge + contours"]["mask"], results["Region growing"]["mask"]),
    }


def noise_sensitivity(gray: np.ndarray, truth: np.ndarray, settings: dict, levels=(0, 10, 20, 40)) -> dict:
    """IoU of each method as Gaussian noise grows, using the image with a known mask."""
    rng = np.random.default_rng(0)
    table = {}
    for sigma in levels:
        noisy = np.clip(gray + rng.normal(0, sigma, gray.shape), 0, 255).astype(np.uint8)
        results = classical_methods(noisy, **settings)
        table[sigma] = {method: score(item["mask"], truth)["iou"] for method, item in results.items()}
    return table


def plot_iou(rows: dict, noise: dict, path) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(11, 3.9))
    names = list(rows)
    bars = axes[0].barh(names[::-1], [rows[n]["iou"] for n in names[::-1]], color="#3b6ea5")
    axes[0].bar_label(bars, fmt="%.3f", fontsize=8)
    axes[0].set(xlim=(0, 1.1), xlabel="IoU with the true mask", title="Accuracy on the synthetic image")
    for method in names:
        axes[1].plot(list(map(str, noise)), [noise[s][method] for s in noise], marker="o", label=method)
    axes[1].set(xlabel="Added noise (standard deviation)", ylabel="IoU", ylim=(0, 1.02), title="Sensitivity to noise")
    axes[1].grid(alpha=0.3)
    axes[1].legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


CELLS = dict(block=151, c=-5, tolerance=30)
COINS = dict(block=101, c=-5, tolerance=45, canny=(80, 180), min_distance=22)
PAGE = dict(block=35, c=12, tolerance=25)


def run(semantic_images=(SAMPLES / "bus.jpg", SAMPLES / "zidane.jpg", SAMPLES / "input.jpg"), out=None) -> dict:
    out = out or out_dir("lab07")

    truth = to_gray(load_image(SAMPLES / "cells_truth.png"))
    cells_gray = to_gray(load_image(SAMPLES / "cells.png"))
    cells = run_classical("cells", SAMPLES / "cells.png", out, truth, **CELLS)
    cells["true_objects"] = 8
    noise = noise_sensitivity(cells_gray, truth, CELLS)
    plot_iou(cells["methods"], noise, out / "iou_comparison.png")

    coins = run_classical("coins", SAMPLES / "coins.png", out, **COINS)
    coins["coins_counted_by_eye"] = 24

    # Region growing depends heavily on its tolerance: too low stalls, too high leaks.
    coins_gray = to_gray(load_image(SAMPLES / "coins.png"))
    coin_seeds = find_seeds(fill_holes(clean(adaptive(coins_gray, COINS["block"], COINS["c"]))), COINS["min_distance"])
    coins_blurred = cv2.GaussianBlur(coins_gray, (5, 5), 0)
    panels = []
    for tolerance in (15, 45, 90):
        grown = region_grow(coins_blurred, coin_seeds, tolerance)
        panels.append((f"Tolerance {tolerance}: {100 * (grown > 0).mean():.0f}% of image", outline(coins_gray, (grown > 0).astype(np.uint8) * 255)))
    montage(panels, out / "region_growing_tolerance.png", cols=3)

    # Page: global versus local thresholds on uneven lighting.
    page = to_gray(load_image(SAMPLES / "page.png"))
    page_otsu, page_otsu_value = otsu(page)
    page_adaptive = adaptive(page, PAGE["block"], PAGE["c"])
    montage([("Scanned page", page), (f"Otsu (T={page_otsu_value:.0f})", page_otsu), ("Adaptive", page_adaptive)],
            out / "page_thresholds.png", cols=1, cell=(8, 3.2))

    semantic = {}
    for path in semantic_images:
        image = load_image(path)
        result = semantic_segment(image)
        semantic_figure(image, result, out / f"semantic_{path.stem}.png")
        semantic[path.name] = {"seconds": result["seconds"], "percent_of_pixels": result["percent_of_pixels"]}

    metrics = {"cells_with_ground_truth": cells, "noise_iou": noise, "coins": coins,
               "page": {"otsu_threshold": page_otsu_value}, "semantic": semantic,
               "semantic_model": "DeepLabV3 MobileNetV3-Large, COCO_WITH_VOC_LABELS_V1"}
    save_json(out / "metrics.json", metrics)
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--semantic-image", action="append", help="May be repeated; defaults to the samples")
    args = parser.parse_args()
    from pathlib import Path
    images = [Path(p) for p in args.semantic_image] if args.semantic_image else None
    print(run(images) if images else run())

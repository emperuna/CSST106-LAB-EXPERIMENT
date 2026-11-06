"""Lab 7: thresholding, region-based, edge-based and semantic segmentation."""
import cv2
import numpy as np
from cv_labs import lab07_segmentation as lab
from cv_labs.common import SAMPLES, load_image, to_gray

from api.core.images import to_data_url
from api.core.schemas import Chart, LabResult, LegendItem, Panel, Series, Table


def classical(image: np.ndarray, use_truth: bool, block: int, c: float, tolerance: float, low: int, high: int,
              min_distance: int) -> LabResult:
    gray = to_gray(image)
    settings = dict(block=block, c=c, tolerance=tolerance, canny=(low, high), min_distance=min_distance)
    results = lab.classical_methods(gray, **settings)
    truth = to_gray(load_image(SAMPLES / "cells_truth.png")) if use_truth else None

    seeded = lab.outline(gray, results["Region growing"]["mask"])
    for y, x in results["Region growing"]["seeds"]:
        cv2.circle(seeded, (x, y), 4, (0, 0, 255), -1)
    panels = [
        Panel(title="Original", image=to_data_url(gray), group="Input"),
        Panel(title=f'Otsu (threshold {results["Otsu threshold"]["threshold"]:.0f})',
              image=to_data_url(lab.outline(gray, results["Otsu threshold"]["mask"])), group="Thresholding"),
        Panel(title="Adaptive threshold", image=to_data_url(results["Adaptive threshold"]["raw"]),
              caption="Raw result, before cleanup", group="Thresholding"),
        Panel(title="Adaptive, cleaned", image=to_data_url(lab.outline(gray, results["Adaptive threshold"]["mask"])), group="Thresholding"),
        Panel(title="Region growing", image=to_data_url(seeded), caption=f'{len(results["Region growing"]["seeds"])} seeds in red', group="Region-based"),
        Panel(title="Watershed regions", image=to_data_url(lab.label_colors(results["Watershed"]["labels"] - 1)),
              caption=f'{results["Watershed"]["objects"]} objects separated', group="Region-based"),
        Panel(title="Canny edges", image=to_data_url(results["Edge + contours"]["edges"]), group="Edge-based"),
        Panel(title="Filled closed contours", image=to_data_url(lab.outline(gray, results["Edge + contours"]["mask"])), group="Edge-based"),
    ]

    rows = lab.report_rows(results, truth)
    columns = ["Method", "Objects found", "Time (ms)"]
    if truth is not None:
        columns += ["IoU", "Dice", "Pixel accuracy"]
    table_rows = []
    for name, row in rows.items():
        values = [name, row["objects_found"], round(row["time_ms"], 1)]
        if truth is not None:
            values += [round(row["iou"], 3), round(row["dice"], 3), round(row["pixel_accuracy"], 3)]
        table_rows.append(values)

    charts, notes = [], []
    if truth is not None:
        noise = lab.noise_sensitivity(gray, truth, settings)
        methods = list(results)
        charts.append(Chart(title="IoU as noise increases", x_label="Added noise (standard deviation)", y_label="IoU",
                            series=[Series(label=m, x=[str(s) for s in noise], y=[noise[s][m] for s in noise]) for m in methods]))
        notes.append("This synthetic image has 8 objects and an exact true mask, so IoU can be measured.")
    else:
        notes.append("IoU needs a true mask, which is only available for the synthetic discs sample.")
    tables = [Table(title="Method comparison", columns=columns, rows=table_rows),
              Table(title="Border agreement with edge-based result (average pixels apart)", columns=["Compared with", "Distance"], rows=[
                  [other, round(lab.border_distance(results["Edge + contours"]["mask"], results[other]["mask"]), 2)]
                  for other in ("Watershed", "Region growing")])]
    return LabResult(panels=panels, tables=tables, charts=charts, notes=notes)


def semantic(image: np.ndarray) -> LabResult:
    result = lab.semantic_segment(image)
    colors = lab.voc_colors()
    painted = colors[result["classes"]]
    overlay = cv2.addWeighted(image, 0.55, painted, 0.45, 0)
    names = result["names"]
    display = lambda n: "background" if n == "__background__" else n  # noqa: E731
    legend = []
    for name in result["percent_of_pixels"]:
        b, g, r = colors[names.index(name)]
        legend.append(LegendItem(label=display(name), color=f"#{r:02x}{g:02x}{b:02x}"))
    shares = sorted(result["percent_of_pixels"].items(), key=lambda item: -item[1])
    return LabResult(
        panels=[Panel(title="Original", image=to_data_url(image), large=True),
                Panel(title="Class per pixel", image=to_data_url(painted, lossless=True), large=True),
                Panel(title="Overlay", image=to_data_url(overlay), large=True)],
        legend=legend,
        tables=[Table(title="Share of the image per class", columns=["Class", "Pixels (%)"],
                      rows=[[display(n), round(s, 1)] for n, s in shares])],
        notes=["DeepLabV3 with a MobileNetV3 backbone recognizes 20 PASCAL VOC classes. Anything else counts as background. "
               "No pixel labels are available for these images, so IoU is not measured."],
    )

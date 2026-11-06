"""Lab 4: SURF keypoints and matching, compared with U-SURF, SIFT and ORB."""
import cv2
import numpy as np
from cv_labs import lab04_surf as lab
from cv_labs.common import to_gray

from api.core.images import to_data_url
from api.core.schemas import Chart, LabResult, Panel, Series, Table


def run(image: np.ndarray, second: np.ndarray | None, threshold: float, degrees: float, scale: float,
        include_sweeps: bool) -> LabResult:
    gray = to_gray(image)
    if second is not None:
        other, truth = to_gray(second), None
        pair_note = "Two separate images were used, so the true position of each point is unknown and correct matches cannot be counted."
    else:
        other, truth = lab.warp(gray, degrees, scale)
        pair_note = f"The second image is the first rotated {degrees:g} degrees and scaled {scale:g}x, so each match can be checked against the known transform."

    table, drawn = lab.compare(gray, other, truth, threshold)
    panels = []
    for name, (kp1, kp2, matches) in drawn.items():
        panels.append(Panel(title=f"{name} keypoints", image=to_data_url(lab.draw_keypoints(gray, kp1)),
                            caption=f"{len(kp1)} keypoints", group=name, large=True))
        best = sorted(matches, key=lambda m: m.distance)[:60]
        picture = cv2.drawMatches(gray, kp1, other, kp2, best, None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
        panels.append(Panel(title=f"{name} matches", image=to_data_url(picture),
                            caption=f"Best {len(best)} of {len(matches)} matches", group=name, large=True))

    columns = ["Method", "Keypoints", "Descriptor", "Matches", "RANSAC inliers"]
    if truth is not None:
        columns += ["Correct", "Correct (%)"]
    columns.append("Time (ms)")
    rows = []
    for name, row in table.items():
        values = [name, row["keypoints_image1"], f'{row["descriptor_length"]} {row["descriptor_type"]}',
                  row["ratio_test_matches"], row["ransac_inliers"]]
        if truth is not None:
            values += [row["correct_matches"], round(row["correct_percent"], 1)]
        rows.append([*values, round(row["time_ms_image1"])])

    surf_backend = table["SURF"]["backend"]
    notes = [pair_note]
    if surf_backend != "opencv":
        notes.append("Standard OpenCV packages exclude SURF because it is patented, so this runs the project's own NumPy "
                     "implementation. It is slower than compiled code, so its time cannot be compared with SIFT or ORB.")

    charts = []
    if include_sweeps:
        sweep = lab.threshold_sweep(gray)
        charts.append(Chart(title="Keypoints by Hessian threshold", x_label="Hessian threshold", y_label="Keypoints",
                            series=[Series(label="SURF", x=[str(t) for t in sweep], y=[float(v) for v in sweep.values()])]))
        rotation = lab.rotation_sweep(gray, threshold=threshold)
        charts.append(Chart(title="Correct matches under rotation", x_label="Rotation (degrees)", y_label="Correct matches",
                            series=[Series(label=name, x=[str(a) for a in values], y=[float(v) for v in values.values()])
                                    for name, values in rotation.items()]))
    return LabResult(panels=panels, charts=charts, notes=notes,
                     tables=[Table(title="Method comparison", columns=columns, rows=rows)])

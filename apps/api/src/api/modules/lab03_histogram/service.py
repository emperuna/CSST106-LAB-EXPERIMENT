"""Lab 3: histogram equalization, contrast stretching and CLAHE."""
import numpy as np
from cv_labs import lab03_histogram as lab
from cv_labs.common import to_gray

from api.core.images import to_data_url
from api.core.schemas import Chart, LabResult, Panel, Series, Table

LEVELS = list(range(256))


def run(image: np.ndarray, clip_limit: float, grid: int, low_pct: float, high_pct: float) -> LabResult:
    gray = to_gray(image)
    versions = {
        "Original": gray,
        "Contrast stretching": lab.contrast_stretch(gray, low_pct, high_pct),
        "Global equalization": lab.equalize_global(gray),
        "CLAHE": lab.apply_clahe(gray, clip_limit, grid),
    }
    manual = lab.equalize_manual(gray)
    matches = float(100 * (manual == versions["Global equalization"]).mean())

    panels = [Panel(title=name, image=to_data_url(result), group="Grayscale versions") for name, result in versions.items()]
    panels.append(Panel(title="Equalized by hand (Part 3)", image=to_data_url(manual),
                        caption=f"{matches:.2f}% of pixels match cv2.equalizeHist", group="Grayscale versions"))
    is_color = image.ndim == 3 and not (
        np.array_equal(image[:, :, 0], image[:, :, 1]) and np.array_equal(image[:, :, 1], image[:, :, 2]))
    if is_color:
        panels += [
            Panel(title="Original color", image=to_data_url(image), group="Color equalization"),
            Panel(title="Equalized on Y (YUV)", image=to_data_url(lab.equalize_color(image, "yuv")), group="Color equalization"),
            Panel(title="Equalized on V (HSV)", image=to_data_url(lab.equalize_color(image, "hsv")), group="Color equalization"),
        ]

    charts = [Chart(title=name, kind="histogram", x_label="Intensity", y_label="Pixels",
                    series=[Series(label=name, x=LEVELS, y=lab.histogram(result).tolist())], group="Histograms")
              for name, result in versions.items()]
    rows = []
    for name, result in versions.items():
        s = lab.stats(result, gray)
        rows.append([name, round(s["mean"], 1), round(s["std_contrast"], 1), s["min"], s["max"],
                     round(s["entropy_bits"], 2), round(s["flat_region_noise"], 2)])
    table = Table(title="Effect on the image",
                  columns=["Version", "Mean", "Contrast (std)", "Min", "Max", "Entropy (bits)", "Noise in flat areas"], rows=rows)
    notes = ["Noise in flat areas is the median variation in the flattest 10% of the original image. "
             "A rise means smooth regions were amplified."]
    return LabResult(panels=panels, charts=charts, tables=[table], notes=notes)

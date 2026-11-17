"""Lab 2: Sobel and Canny edge detection."""
import numpy as np
from cv_labs import lab02_edges as lab
from cv_labs.common import to_gray, to_uint8

from api.core.images import to_data_url
from api.core.schemas import LabResult, Panel, Readout, Table


def run(image: np.ndarray, blur: int, sobel_size: int, low: int, high: int) -> LabResult:
    gray = to_gray(image)
    blurred = lab.preprocess(gray, blur)
    gradients = lab.sobel(blurred, sobel_size)
    edges = lab.canny(blurred, low, high)
    magnitude = to_uint8(gradients["magnitude"])
    sobel_marked = round(lab.percent_marked(magnitude > 25), 2)
    canny_marked = round(lab.percent_marked(edges), 2)
    sobel_levels = int(np.unique(magnitude).size)
    return LabResult(
        panels=[
            Panel(title="Original Image", image=to_data_url(gray), group="Comparison", step=1),
            Panel(title="Sobel Edge Detection", image=to_data_url(magnitude),
                  caption="Brighter means a stronger gradient", group="Comparison", step=3),
            Panel(title="Canny Edge Detection", image=to_data_url(edges),
                  caption=f"Thresholds {low} and {high}", group="Comparison", step=4),
            Panel(title="Sobel X", image=to_data_url(to_uint8(np.abs(gradients["x"]))),
                  caption="Responds to vertical edges", group="Sobel directions", step=3),
            Panel(title="Sobel Y", image=to_data_url(to_uint8(np.abs(gradients["y"]))),
                  caption="Responds to horizontal edges", group="Sobel directions", step=3),
        ],
        tables=[Table(title="Edge map comparison", columns=["Measure", "Sobel", "Canny"], rows=[
            ["Distinct intensity levels", sobel_levels, int(np.unique(edges).size)],
            ["Pixels marked as edge (%)", sobel_marked, canny_marked],
        ])],
        readouts=[
            Readout(label="Sobel edge pixels", value=sobel_marked, unit="%", step=3),
            Readout(label="Canny edge pixels", value=canny_marked, unit="%", step=4),
            Readout(label="Sobel intensity levels", value=sobel_levels, step=3),
        ],
        notes=["Sobel's percentage counts pixels above 10% of the strongest possible display value."],
    )

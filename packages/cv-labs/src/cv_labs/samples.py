"""Create the sample images used by the labs (packages/cv-labs/samples).

The lab sheets name files such as input.jpg and sample_image.jpg but do not
include them, so public test images are used. Any image can be substituted with
each lab's --image option.

Sources: scikit-image's data module and the Ultralytics package's example images.
Run with: python -m cv_labs.samples
"""
from __future__ import annotations

import shutil
from pathlib import Path

import cv2
import numpy as np
import skimage
from skimage import data

from .common import SAMPLES, save_image


def synthetic_cells(seed: int = 7, size: int = 400):
    """Touching bright discs on uneven lighting, plus their exact foreground mask.

    Because the true mask is known, Lab 7 can measure IoU for each classical
    segmentation method instead of only judging by eye.
    """
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[:size, :size]
    circles = [(90, 95, 52), (168, 110, 48), (290, 90, 55), (110, 275, 58), (195, 300, 50),
               (310, 255, 60), (345, 335, 34), (235, 200, 30)]
    mask = np.zeros((size, size), bool)
    for cx, cy, radius in circles:
        mask |= (xx - cx) ** 2 + (yy - cy) ** 2 <= radius**2
    lighting = 45 + 75 * xx / size                      # Brightness ramp left to right.
    image = lighting + mask * 85 + rng.normal(0, 7, (size, size))
    image = cv2.GaussianBlur(np.clip(image, 0, 255).astype(np.uint8), (3, 3), 0)
    return image, mask.astype(np.uint8) * 255


def main() -> None:
    SAMPLES.mkdir(exist_ok=True)
    color = lambda rgb: cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)  # noqa: E731
    save_image(SAMPLES / "input.jpg", color(data.astronaut()))      # Labs 1, 2
    save_image(SAMPLES / "coffee.jpg", color(data.coffee()))        # Lab 3 color, Lab 4
    save_image(SAMPLES / "low_contrast.png", data.moon())           # Lab 3 low contrast
    save_image(SAMPLES / "camera.png", data.camera())               # Lab 4
    save_image(SAMPLES / "coins.png", data.coins())                 # Lab 7 touching objects
    save_image(SAMPLES / "page.png", data.page())                   # Lab 7 uneven lighting
    cells, truth = synthetic_cells()
    save_image(SAMPLES / "cells.png", cells)                        # Lab 7 with ground truth
    save_image(SAMPLES / "cells_truth.png", truth)
    import ultralytics
    assets = Path(ultralytics.__file__).parent / "assets"
    for name in ("bus.jpg", "zidane.jpg"):                          # Labs 6, 7
        shutil.copy(assets / name, SAMPLES / name)
    print(f"Samples written to {SAMPLES} (scikit-image {skimage.__version__})")


if __name__ == "__main__":
    main()

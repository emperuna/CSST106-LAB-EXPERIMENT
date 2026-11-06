"""Lab 1: image representation and basic operations."""
import numpy as np
from cv_labs import lab01_images as lab

from api.core.images import to_data_url
from api.core.schemas import LabResult, Panel, Table


def run(image: np.ndarray, pixel_x: int | None, pixel_y: int | None, color: tuple[int, int, int],
        crop_percent: tuple[int, int, int, int], scale: float, clockwise: bool) -> LabResult:
    h, w = image.shape[:2]
    # Out-of-range coordinates snap to the image edge, so any image works with any input.
    x = min(max(pixel_x if pixel_x is not None else w // 2, 0), w - 1)
    y = min(max(pixel_y if pixel_y is not None else h // 2, 0), h - 1)

    left, top, right, bottom = crop_percent
    x1, x2 = sorted((w * left // 100, w * right // 100))
    y1, y2 = sorted((h * top // 100, h * bottom // 100))
    if x2 - x1 < 1 or y2 - y1 < 1:
        x1, x2, y1, y2 = 0, w, 0, h

    gray = lab.to_grayscale(image)
    changed = lab.set_pixel(image, y, x, color)
    roi = lab.crop(image, y1, y2, x1, x2)
    resized = lab.resize(image, scale)
    rotated = lab.rotate90(image, clockwise)
    channels = lab.split_bgr(image)

    size = lambda a: f"{a.shape[1]} x {a.shape[0]} px"  # noqa: E731
    panels = [
        Panel(title="Original", image=to_data_url(image), caption=size(image), group="Color and grayscale"),
        Panel(title="Grayscale", image=to_data_url(gray), caption="One channel per pixel", group="Color and grayscale"),
        Panel(title="Blue channel", image=to_data_url(channels["blue"]), caption="Channel 0 in OpenCV", group="BGR channels"),
        Panel(title="Green channel", image=to_data_url(channels["green"]), caption="Channel 1", group="BGR channels"),
        Panel(title="Red channel", image=to_data_url(channels["red"]), caption="Channel 2", group="BGR channels"),
        Panel(title="Pixel before", image=to_data_url(lab.zoom_around(image, y, x), lossless=True),
              caption=f"Area around ({x}, {y}), enlarged 15x", group="Changing one pixel"),
        Panel(title="Pixel after", image=to_data_url(lab.zoom_around(changed, y, x), lossless=True),
              caption=f"BGR value is now {list(color)}", group="Changing one pixel"),
        Panel(title="Cropped region", image=to_data_url(roi), caption=size(roi), group="Basic operations"),
        Panel(title=f"Resized {scale:g}x", image=to_data_url(resized), caption=size(resized), group="Basic operations"),
        Panel(title="Rotated 90 degrees " + ("clockwise" if clockwise else "counterclockwise"),
              image=to_data_url(rotated), caption=size(rotated), group="Basic operations"),
    ]
    info, gray_info = lab.describe(image), lab.describe(gray)
    rows = [
        ["img.shape", str(info["shape"]), str(gray_info["shape"])],
        ["Height", info["height"], gray_info["height"]],
        ["Width", info["width"], gray_info["width"]],
        ["Channels", info["channels"], gray_info["channels"]],
        ["Data type", info["dtype"], gray_info["dtype"]],
        ["Lowest value", int(info["min_intensity"]), int(gray_info["min_intensity"])],
        ["Highest value", int(info["max_intensity"]), int(gray_info["max_intensity"])],
    ]
    pixel_rows = [
        ["Position (x, y)", f"({x}, {y})"],
        ["BGR before", str(lab.get_pixel(image, y, x))],
        ["BGR after", str(lab.get_pixel(changed, y, x))],
        ["Grayscale value", lab.get_pixel(gray, y, x)[0]],
    ]
    return LabResult(panels=panels, tables=[
        Table(title="Image properties", columns=["Property", "Color", "Grayscale"], rows=rows),
        Table(title="Pixel inspection", columns=["Item", "Value"], rows=pixel_rows),
    ])

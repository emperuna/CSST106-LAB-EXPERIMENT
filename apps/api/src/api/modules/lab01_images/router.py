from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from api.core.images import limit_size, resolve_image
from api.core.schemas import LabResult
from api.core.timing import stopwatch

from . import service

router = APIRouter(prefix="/labs/lab01", tags=["Lab 1"])


def parse_hex(color: str) -> tuple[int, int, int]:
    """Convert #rrggbb from a color picker to OpenCV's (blue, green, red)."""
    try:
        red, green, blue = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Color must look like #ff0000.") from error
    return blue, green, red


@router.post("/run", operation_id="runLab01")
def run(
    image: Annotated[UploadFile | None, File()] = None,
    sample: Annotated[str | None, Form()] = None,
    pixel_x: Annotated[int | None, Form()] = None,
    pixel_y: Annotated[int | None, Form()] = None,
    color: Annotated[str, Form(pattern="^#[0-9a-fA-F]{6}$")] = "#ff0000",
    crop_left: Annotated[int, Form(ge=0, le=100)] = 25,
    crop_top: Annotated[int, Form(ge=0, le=100)] = 25,
    crop_right: Annotated[int, Form(ge=0, le=100)] = 75,
    crop_bottom: Annotated[int, Form(ge=0, le=100)] = 75,
    scale: Annotated[float, Form(ge=0.1, le=3)] = 0.5,
    clockwise: Annotated[bool, Form()] = True,
) -> LabResult:
    picture = limit_size(resolve_image(image, sample, "input.jpg"), 1280, notes := [])
    with stopwatch() as elapsed:
        result = service.run(picture, pixel_x, pixel_y, parse_hex(color),
                             (crop_left, crop_top, crop_right, crop_bottom), scale, clockwise)
    result.notes += notes
    result.elapsed_ms = elapsed[0]
    return result

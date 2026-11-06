from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from api.core.images import decode_image, limit_size, read_upload, resolve_image
from api.core.jobs import exclusive
from api.core.schemas import LabResult
from api.core.timing import stopwatch

from . import service

router = APIRouter(prefix="/labs/lab04", tags=["Lab 4"])

LONGEST_SIDE = 800  # The NumPy SURF takes a few seconds beyond this size.


@router.post("/run", operation_id="runLab04")
def run(
    image: Annotated[UploadFile | None, File()] = None,
    second_image: Annotated[UploadFile | None, File()] = None,
    sample: Annotated[str | None, Form()] = None,
    threshold: Annotated[float, Form(ge=10, le=10000)] = 400,
    degrees: Annotated[float, Form(ge=-180, le=180)] = 30,
    scale: Annotated[float, Form(ge=0.4, le=1.5)] = 0.8,
    include_sweeps: Annotated[bool, Form()] = False,
) -> LabResult:
    notes: list[str] = []
    picture = limit_size(resolve_image(image, sample, "camera.png"), LONGEST_SIDE, notes)
    second = None
    if second_image is not None and second_image.filename:
        second = limit_size(decode_image(read_upload(second_image)), LONGEST_SIDE, notes)
    with exclusive(), stopwatch() as elapsed:
        result = service.run(picture, second, threshold, degrees, scale, include_sweeps)
    result.notes += notes
    result.elapsed_ms = elapsed[0]
    return result

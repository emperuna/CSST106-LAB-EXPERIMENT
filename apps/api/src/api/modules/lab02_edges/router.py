from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from api.core.images import limit_size, resolve_image
from api.core.schemas import LabResult
from api.core.timing import stopwatch

from . import service

router = APIRouter(prefix="/labs/lab02", tags=["Lab 2"])


@router.post("/run", operation_id="runLab02")
def run(
    image: Annotated[UploadFile | None, File()] = None,
    sample: Annotated[str | None, Form()] = None,
    blur: Annotated[int, Form(ge=1, le=15)] = 3,
    sobel_size: Annotated[int, Form(ge=1, le=7)] = 3,
    low: Annotated[int, Form(ge=0, le=500)] = 100,
    high: Annotated[int, Form(ge=0, le=500)] = 200,
) -> LabResult:
    if blur % 2 == 0 or sobel_size % 2 == 0:
        raise HTTPException(status_code=422, detail="Blur and Sobel kernel sizes must be odd numbers.")
    picture = limit_size(resolve_image(image, sample, "input.jpg"), 1600, notes := [])
    with stopwatch() as elapsed:
        result = service.run(picture, blur, sobel_size, low, high)
    result.notes += notes
    result.elapsed_ms = elapsed[0]
    return result

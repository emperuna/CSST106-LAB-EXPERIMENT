from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from api.core.images import limit_size, resolve_image
from api.core.schemas import LabResult
from api.core.timing import stopwatch

from . import service

router = APIRouter(prefix="/labs/lab03", tags=["Lab 3"])


@router.post("/run", operation_id="runLab03")
def run(
    image: Annotated[UploadFile | None, File()] = None,
    sample: Annotated[str | None, Form()] = None,
    clip_limit: Annotated[float, Form(gt=0, le=40)] = 2.0,
    grid: Annotated[int, Form(ge=2, le=32)] = 8,
    low_pct: Annotated[float, Form(ge=0, le=49)] = 2,
    high_pct: Annotated[float, Form(ge=51, le=100)] = 98,
) -> LabResult:
    if low_pct >= high_pct:
        raise HTTPException(status_code=422, detail="The low percentile must be below the high percentile.")
    picture = limit_size(resolve_image(image, sample, "low_contrast.png"), 1600, notes := [])
    with stopwatch() as elapsed:
        result = service.run(picture, clip_limit, grid, low_pct, high_pct)
    result.notes += notes
    result.elapsed_ms = elapsed[0]
    return result

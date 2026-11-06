from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from api.core.images import limit_size, resolve_image
from api.core.jobs import exclusive
from api.core.schemas import LabResult
from api.core.timing import stopwatch

from . import service

router = APIRouter(prefix="/labs/lab07", tags=["Lab 7"])


@router.post("/classical", operation_id="classicalLab07")
def classical(
    image: Annotated[UploadFile | None, File()] = None,
    sample: Annotated[str | None, Form()] = None,
    block: Annotated[int, Form(ge=3, le=301)] = 151,
    c: Annotated[float, Form(ge=-50, le=50)] = -5,
    tolerance: Annotated[float, Form(ge=1, le=150)] = 30,
    low: Annotated[int, Form(ge=0, le=500)] = 50,
    high: Annotated[int, Form(ge=0, le=500)] = 150,
    min_distance: Annotated[int, Form(ge=3, le=100)] = 15,
) -> LabResult:
    uploaded = image is not None and bool(image.filename)
    use_truth = not uploaded and (sample or "cells.png") == "cells.png"
    # Region growing visits pixels one at a time in Python, so large images are reduced.
    picture = limit_size(resolve_image(image, sample, "cells.png"), 800, notes := [])
    with exclusive(), stopwatch() as elapsed:
        result = service.classical(picture, use_truth, block, c, tolerance, low, high, min_distance)
    result.notes += notes
    result.elapsed_ms = elapsed[0]
    return result


@router.post("/semantic", operation_id="semanticLab07")
def semantic(
    image: Annotated[UploadFile | None, File()] = None,
    sample: Annotated[str | None, Form()] = None,
) -> LabResult:
    picture = limit_size(resolve_image(image, sample, "bus.jpg"), 1024, notes := [])
    with exclusive(), stopwatch() as elapsed:
        result = service.semantic(picture)
    result.notes += notes
    result.elapsed_ms = elapsed[0]
    return result

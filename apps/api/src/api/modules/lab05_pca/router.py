from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from api.core.images import decode_image, read_upload
from api.core.jobs import exclusive
from api.core.schemas import LabResult
from api.core.timing import stopwatch

from . import service

router = APIRouter(prefix="/labs/lab05", tags=["Lab 5"])


@router.post("/train", operation_id="trainLab05")
def train(
    n_components: Annotated[int, Form(ge=12, le=500)] = 150,
    whiten: Annotated[bool, Form()] = True,
    c: Annotated[float, Form(gt=0, le=100000)] = 1,
    gamma: Annotated[str, Form()] = "scale",
) -> LabResult:
    try:
        gamma_value: str | float = gamma if gamma == "scale" else float(gamma)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Gamma must be 'scale' or a number.") from error
    with exclusive(), stopwatch() as elapsed:
        result = service.train(n_components, whiten, c, gamma_value)
    result.elapsed_ms = elapsed[0]
    return result


@router.post("/recognize", operation_id="recognizeLab05")
def recognize(
    image: Annotated[UploadFile | None, File()] = None,
    test_index: Annotated[int | None, Form(ge=0)] = None,
) -> LabResult:
    if image is not None and image.filename:
        picture = decode_image(read_upload(image))
        with exclusive(), stopwatch() as elapsed:
            result = service.closest_match(picture)
    else:
        with exclusive(), stopwatch() as elapsed:
            result = service.recognize_test_face(test_index or 0)
    result.elapsed_ms = elapsed[0]
    return result

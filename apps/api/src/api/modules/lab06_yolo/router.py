from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from api.core.images import limit_size, read_upload, resolve_image
from api.core.jobs import exclusive
from api.core.schemas import LabResult
from api.core.timing import stopwatch

from . import service

router = APIRouter(prefix="/labs/lab06", tags=["Lab 6"])

ModelName = Literal["coco", "wildlife"]
MAX_VIDEO_BYTES = 60 * 1024 * 1024


def check_size(imgsz: int) -> None:
    if imgsz not in (320, 640):
        raise HTTPException(status_code=422, detail="Image size must be 320 or 640.")


@router.post("/detect", operation_id="detectLab06")
def detect(
    image: Annotated[UploadFile | None, File()] = None,
    sample: Annotated[str | None, Form()] = None,
    model: Annotated[ModelName, Form()] = "coco",
    conf: Annotated[float, Form(ge=0.01, le=1)] = 0.25,
    imgsz: Annotated[int, Form()] = 640,
) -> LabResult:
    check_size(imgsz)
    picture = limit_size(resolve_image(image, sample, "bus.jpg"), 1600, notes := [])
    with exclusive(), stopwatch() as elapsed:
        result = service.detect_image(picture, model, conf, imgsz)
    result.notes += notes
    result.elapsed_ms = elapsed[0]
    return result


@router.post("/video", operation_id="videoLab06")
def video(
    file: Annotated[UploadFile, File()],
    model: Annotated[ModelName, Form()] = "coco",
    conf: Annotated[float, Form(ge=0.01, le=1)] = 0.25,
    imgsz: Annotated[int, Form()] = 320,
) -> LabResult:
    check_size(imgsz)
    data = read_upload(file, MAX_VIDEO_BYTES)
    with exclusive(), stopwatch() as elapsed:
        result = service.detect_video(data, model, conf, imgsz)
    result.elapsed_ms = elapsed[0]
    return result


@router.get("/training", operation_id="trainingLab06")
def training() -> LabResult:
    return service.training_summary()

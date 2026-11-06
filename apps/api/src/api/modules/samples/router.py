from cv_labs.common import SAMPLES
from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel

from api.core.images import SAMPLE_LABELS, sample_path

router = APIRouter(prefix="/samples", tags=["samples"])


class Sample(BaseModel):
    name: str
    label: str


@router.get("", operation_id="listSamples")
def list_samples() -> list[Sample]:
    return [Sample(name=n, label=l) for n, l in SAMPLE_LABELS.items() if (SAMPLES / n).exists()]


@router.get("/{name}", operation_id="getSampleImage", response_class=FileResponse)
def sample_image(name: str) -> FileResponse:
    return FileResponse(sample_path(name))

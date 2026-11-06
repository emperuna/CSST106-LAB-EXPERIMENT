"""The response shape shared by every lab, so the Web UI can display any lab's results."""
from pydantic import BaseModel, Field


class Panel(BaseModel):
    """One result image, sent inline as a data URL."""

    title: str
    image: str
    caption: str | None = None
    group: str | None = None
    large: bool = False  # Show bigger: detail matters, or there are only a few images.


class Table(BaseModel):
    title: str
    columns: list[str]
    rows: list[list[str | int | float | None]]


class Series(BaseModel):
    label: str
    x: list[float | str]
    y: list[float]


class Chart(BaseModel):
    title: str
    kind: str = "line"  # "line" or "histogram"
    x_label: str
    y_label: str
    series: list[Series]
    group: str | None = None


class LegendItem(BaseModel):
    label: str
    color: str


class Video(BaseModel):
    title: str
    source: str


class LabResult(BaseModel):
    panels: list[Panel] = Field(default_factory=list)
    tables: list[Table] = Field(default_factory=list)
    charts: list[Chart] = Field(default_factory=list)
    legend: list[LegendItem] = Field(default_factory=list)
    videos: list[Video] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    elapsed_ms: float = 0

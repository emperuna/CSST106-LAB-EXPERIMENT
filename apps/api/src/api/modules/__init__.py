"""One sub-package per lab, each with router.py and service.py (schemas are in api.core).

Modules may use api.core and cv_labs, but must not import from each other.
Add each module's router to ROUTERS so main.py can mount it.
"""
from fastapi import APIRouter

from .lab01_images.router import router as lab01
from .lab02_edges.router import router as lab02
from .lab03_histogram.router import router as lab03
from .lab04_features.router import router as lab04
from .lab05_pca.router import router as lab05
from .lab06_yolo.router import router as lab06
from .lab07_segmentation.router import router as lab07
from .samples.router import router as samples

ROUTERS: list[APIRouter] = [samples, lab01, lab02, lab03, lab04, lab05, lab06, lab07]

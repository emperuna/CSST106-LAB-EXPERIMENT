# syntax=docker/dockerfile:1
#
# The CSST106 API (FastAPI + cv-labs) for a container host such as Render.
#
# - PyTorch is the CPU build: the PyPI build for Linux pulls in about 2.5 GB of CUDA libraries
#   that a CPU host never uses. Every other dependency is installed exactly as uv.lock pins it.
# - cv_labs finds outputs/, models/, data/, the samples and the weights from its place in the
#   repository, so the image keeps the repository layout and installs both packages in editable mode.
# - YOLO11n, DeepLabV3 and the Labeled Faces in the Wild data are downloaded at build time, so the
#   first request for Labs 5, 6 and 7 doesn't wait on a download.
#
# Memory: Labs 1 to 5 need a few hundred MB. Labs 6 and 7 load PyTorch with YOLO or DeepLabV3,
# which needs more than 512 MB, so give the service at least 2 GB of RAM.
#
# Build and run locally:
#   docker build -t csst106-api .
#   docker run --rm -p 8000:8000 -e CORS_ORIGINS=http://localhost:4321 csst106-api

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    MPLCONFIGDIR=/tmp/matplotlib \
    YOLO_CONFIG_DIR=/tmp/ultralytics

# OpenCV's full build (opencv-python) needs these system libraries.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.11.25 /uv /usr/local/bin/uv

WORKDIR /app

# 1. Third-party dependencies, from the lockfile. Copied before the source so this layer is reused
#    while only code changes.
COPY pyproject.toml uv.lock ./
COPY apps/api/pyproject.toml apps/api/pyproject.toml
COPY packages/cv-labs/pyproject.toml packages/cv-labs/pyproject.toml
RUN uv export --frozen --no-dev --no-emit-workspace --no-hashes --no-annotate --no-header \
        -o /tmp/requirements.txt \
    && grep -vE '^(torch|torchvision|triton|nvidia-)' /tmp/requirements.txt > /tmp/requirements-cpu.txt \
    && uv pip install --system --no-cache \
        --index-url https://download.pytorch.org/whl/cpu \
        torch==2.2.2+cpu torchvision==0.17.2+cpu \
    && uv pip install --system --no-cache -r /tmp/requirements-cpu.txt \
    && rm /tmp/requirements*.txt

# 2. The code, the saved lab results and the trained weights.
COPY packages/cv-labs packages/cv-labs
COPY apps/api apps/api
COPY outputs outputs
RUN uv pip install --system --no-cache --no-deps -e packages/cv-labs -e apps/api

# 3. Models and data the labs would otherwise download on first use.
RUN python -c "from cv_labs import lab06_yolo as y; y.download(y.PRETRAINED_URL, y.PRETRAINED)" \
    && python -c "from cv_labs.lab07_segmentation import load_semantic_model; load_semantic_model()" \
    && python -c "from cv_labs.lab05_pca import load_data; load_data()"

# Run as an unprivileged user.
RUN useradd --create-home --uid 1000 app && chown -R app:app /app
USER app

# Render sets PORT; locally it falls back to 8000.
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

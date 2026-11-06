"""Exercise every lab endpoint through HTTP, with samples and with real uploads."""
import base64
import io

import cv2
import numpy as np
import pytest
from cv_labs import lab06_yolo
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def image_file(name="photo.jpg", size=(240, 320)):
    rng = np.random.default_rng(0)
    picture = cv2.GaussianBlur(rng.integers(0, 255, (*size, 3), dtype=np.uint8), (9, 9), 0)
    ok, buffer = cv2.imencode(".jpg", picture)
    assert ok
    return {"image": (name, io.BytesIO(buffer.tobytes()), "image/jpeg")}


def decode_panel(panel):
    payload = panel["image"].split(",", 1)[1]
    return cv2.imdecode(np.frombuffer(base64.b64decode(payload), np.uint8), cv2.IMREAD_UNCHANGED)


def post(path, data=None, files=None, status=200):
    response = client.post(path, data=data, files=files)
    assert response.status_code == status, response.text
    return response.json()


def titles(result):
    return [p["title"] for p in result["panels"]]


def test_samples_listed_and_served():
    samples = client.get("/api/samples").json()
    names = {s["name"] for s in samples}
    assert {"input.jpg", "cells.png", "bus.jpg"} <= names
    assert "cells_truth.png" not in names
    assert client.get("/api/samples/input.jpg").headers["content-type"] == "image/jpeg"


@pytest.mark.parametrize("name", ["../pyproject.toml", "cells_truth.png", "nope.png"])
def test_sample_allowlist(name):
    assert client.get(f"/api/samples/{name}").status_code in (400, 404)
    post("/api/labs/lab02/run", {"sample": name}, status=400)


def test_rejects_non_images_and_bad_params():
    post("/api/labs/lab02/run", files={"image": ("a.jpg", io.BytesIO(b"not an image"), "image/jpeg")}, status=400)
    post("/api/labs/lab02/run", {"blur": 4}, status=422)
    post("/api/labs/lab02/run", {"low": -1}, status=422)
    post("/api/labs/lab01/run", {"color": "red"}, status=422)
    post("/api/labs/lab03/run", {"clip_limit": 0}, status=422)


def test_lab01_values_and_clamping():
    result = post("/api/labs/lab01/run", {"sample": "input.jpg", "pixel_x": 99999, "pixel_y": 0, "color": "#ff0102",
                                          "crop_left": 0, "crop_right": 50, "crop_top": 0, "crop_bottom": 100, "scale": 2})
    pixels = {row[0]: row[1] for row in result["tables"][1]["rows"]}
    assert pixels["Position (x, y)"] == "(511, 0)"
    assert pixels["BGR after"] == "[2, 1, 255]"  # #ff0102 is red 255, green 1, blue 2.
    panels = {p["title"]: decode_panel(p) for p in result["panels"]}
    assert panels["Cropped region"].shape[:2] == (512, 256)
    assert panels["Resized 2x"].shape[:2] == (1024, 1024)
    assert result["tables"][0]["rows"][0][1] == "(512, 512, 3)"


def test_lab01_empty_crop_uses_whole_image():
    result = post("/api/labs/lab01/run", {"crop_left": 50, "crop_right": 50})
    panels = {p["title"]: decode_panel(p) for p in result["panels"]}
    assert panels["Cropped region"].shape[:2] == (512, 512)


def test_lab02_upload_and_sample():
    result = post("/api/labs/lab02/run", files=image_file())
    assert titles(result)[:3] == ["Original Image", "Sobel Edge Detection", "Canny Edge Detection"]
    canny = decode_panel(result["panels"][2])
    assert canny.shape[:2] == (240, 320)
    assert set(np.unique(canny)) <= {0, 255}


def test_lab03_color_and_gray_outputs():
    gray_result = post("/api/labs/lab03/run", {"sample": "low_contrast.png"})
    assert not any(p["group"] == "Color equalization" for p in gray_result["panels"])
    assert "100.00%" in next(p for p in gray_result["panels"] if "by hand" in p["title"])["caption"]
    assert len(gray_result["charts"]) == 4
    assert len(gray_result["charts"][0]["series"][0]["y"]) == 256
    color = post("/api/labs/lab03/run", {"sample": "coffee.jpg"})
    assert any(p["group"] == "Color equalization" for p in color["panels"])


def test_lab04_known_transform_and_second_image():
    result = post("/api/labs/lab04/run", {"sample": "camera.png", "degrees": 20, "scale": 0.9})
    assert [r[0] for r in result["tables"][0]["rows"]] == ["SURF", "U-SURF", "SIFT", "ORB"]
    assert "Correct (%)" in result["tables"][0]["columns"]
    files = {**image_file(), "second_image": image_file("b.jpg")["image"]}
    pair = post("/api/labs/lab04/run", files=files)
    assert "Correct (%)" not in pair["tables"][0]["columns"]


def test_lab05_train_and_recognize():
    result = post("/api/labs/lab05/train", {"n_components": 40, "whiten": "true"})
    summary = {row[0]: row[1] for row in result["tables"][0]["rows"]}
    assert summary["Components used"] == 40
    assert 40 < summary["Test accuracy (%)"] <= 100
    assert len(result["charts"][0]["series"][0]["y"]) == 40
    baseline = post("/api/labs/lab05/train", {})
    baseline_summary = {row[0]: row[1] for row in baseline["tables"][0]["rows"]}
    assert baseline_summary["Test accuracy (%)"] == 84.9     # Matches the saved Lab 5 baseline.
    assert baseline_summary["Components for 90% of variance"] == 85
    post("/api/labs/lab05/train", {"gamma": "abc"}, status=422)

    test_face = post("/api/labs/lab05/recognize", {"test_index": 3})
    assert len(test_face["tables"][0]["rows"]) == 7
    uploaded = post("/api/labs/lab05/recognize", files=image_file())
    assert any("does not identify" in note for note in uploaded["notes"])


def test_lab06_models_and_training_summary():
    result = post("/api/labs/lab06/detect", {"sample": "bus.jpg", "conf": 0.5})
    labels = {row[0] for row in result["tables"][0]["rows"]}
    assert {"bus", "person"} <= labels
    high = post("/api/labs/lab06/detect", {"sample": "bus.jpg", "conf": 0.99})
    assert high["tables"][0]["rows"] == []
    post("/api/labs/lab06/detect", {"sample": "bus.jpg", "model": "wildlife", "imgsz": 320})
    post("/api/labs/lab06/detect", {"imgsz": 500}, status=422)
    summary = client.get("/api/labs/lab06/training").json()
    assert summary["tables"][1]["rows"][0][0] == "All classes"
    assert summary["panels"]


def test_lab06_video(tmp_path):
    source = lab06_yolo.make_demo_video(tmp_path / "in.mp4", frames=6)
    result = post("/api/labs/lab06/video", files={"file": ("in.mp4", source.open("rb"), "video/mp4")}, data={"imgsz": 320})
    assert result["videos"][0]["source"].startswith("data:video/")
    summary = {row[0]: row[1] for row in result["tables"][0]["rows"]}
    assert summary["Frames processed"] == 6
    target = tmp_path / "out.mp4"
    target.write_bytes(base64.b64decode(result["videos"][0]["source"].split(",", 1)[1]))
    capture = cv2.VideoCapture(str(target))
    assert int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) == 6
    capture.release()
    post("/api/labs/lab06/video", files={"file": ("a.mp4", io.BytesIO(b"nope"), "video/mp4")}, status=400)


def test_lab07_classical_with_and_without_truth():
    cells = post("/api/labs/lab07/classical", {"sample": "cells.png"})
    rows = {row[0]: row for row in cells["tables"][0]["rows"]}
    assert rows["Watershed"][1] == 8
    assert rows["Watershed"][3] > 0.98
    assert cells["charts"]
    coins = post("/api/labs/lab07/classical", {"sample": "coins.png", "block": 101, "tolerance": 45, "min_distance": 22})
    assert "IoU" not in coins["tables"][0]["columns"]
    uploaded = post("/api/labs/lab07/classical", files=image_file())
    assert "IoU" not in uploaded["tables"][0]["columns"]


def test_lab07_semantic():
    result = post("/api/labs/lab07/semantic", {"sample": "bus.jpg"})
    assert {"bus", "person", "background"} == {item["label"] for item in result["legend"]}
    assert titles(result) == ["Original", "Class per pixel", "Overlay"]

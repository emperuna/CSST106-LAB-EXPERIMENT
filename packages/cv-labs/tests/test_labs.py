"""Checks with known answers. Run with: uv run pytest"""
import subprocess
import sys

import cv2
import numpy as np

from cv_labs import lab01_images as lab1
from cv_labs import lab02_edges as lab2
from cv_labs import lab03_histogram as lab3
from cv_labs import lab04_surf as lab4
from cv_labs import lab07_segmentation as lab7
from cv_labs.lab06_yolo import TRAINED
from cv_labs.common import SAMPLES, load_image, to_gray
from cv_labs.samples import synthetic_cells
from cv_labs.surf import SURF


def color_image():
    return load_image(SAMPLES / "input.jpg")


def test_lab1_pixel_and_geometry():
    image = color_image()
    changed = lab1.set_pixel(image, 10, 20, (1, 2, 3))
    assert lab1.get_pixel(changed, 10, 20) == [1, 2, 3]
    assert np.count_nonzero((changed != image).any(axis=2)) <= 1
    assert lab1.crop(image, 0, 50, 0, 80).shape == (50, 80, 3)
    assert lab1.resize(image, 0.5).shape[:2] == (image.shape[0] // 2, image.shape[1] // 2)
    tall = image[:100, :200]
    assert lab1.rotate90(tall).shape == (200, 100, 3)
    assert lab1.rotate90(tall)[0, -1].tolist() == tall[0, 0].tolist()  # Top-left moves to top-right.


def test_lab1_bgr_order():
    pure_red = np.zeros((1, 1, 3), np.uint8)
    pure_red[0, 0] = (0, 0, 255)
    assert lab1.split_bgr(pure_red)["red"][0, 0] == 255
    assert lab1.split_bgr(pure_red)["blue"][0, 0] == 0


def test_lab2_vertical_edge_appears_only_in_x_gradient():
    step = np.zeros((40, 40), np.uint8)
    step[:, 20:] = 200
    gradients = lab2.sobel(lab2.preprocess(step))
    assert np.abs(gradients["x"]).max() > 100
    assert np.abs(gradients["y"]).max() == 0
    edges = lab2.canny(lab2.preprocess(step))
    assert set(np.unique(edges)) == {0, 255}
    assert edges[:, :15].max() == 0


def test_lab3_manual_matches_opencv():
    gray = to_gray(load_image(SAMPLES / "low_contrast.png"))
    assert np.array_equal(lab3.equalize_manual(gray), cv2.equalizeHist(gray))


def test_lab3_improves_contrast_and_keeps_flat_images():
    gray = to_gray(load_image(SAMPLES / "low_contrast.png"))
    assert lab3.equalize_global(gray).std() > gray.std()
    assert lab3.contrast_stretch(gray).std() > gray.std()
    assert lab3.apply_clahe(gray).std() > gray.std()
    flat = np.full((10, 10), 90, np.uint8)
    assert np.array_equal(lab3.equalize_manual(flat), flat)
    assert np.array_equal(lab3.contrast_stretch(flat), flat)


def test_surf_threshold_descriptor_and_matching():
    gray = to_gray(load_image(SAMPLES / "camera.png"))
    few = SURF(3000).detectAndCompute(gray)[0]
    keypoints, descriptors = SURF(400).detectAndCompute(gray)
    assert len(few) < len(keypoints)
    assert descriptors.shape == (len(keypoints), 64)
    assert np.allclose(np.linalg.norm(descriptors, axis=1), 1, atol=1e-5)

    rotated, matrix = lab4.warp(gray, 30, 0.8)
    kp2, desc2 = SURF(400).detectAndCompute(rotated)
    matches = lab4.match(descriptors, desc2, cv2.NORM_L2)
    correct = lab4.correct_matches(keypoints, kp2, matches, matrix)
    assert len(correct) > 50
    assert len(correct) / len(matches) > 0.6


def test_surf_flat_image_has_no_keypoints():
    keypoints, descriptors = SURF(400).detectAndCompute(np.full((200, 200), 128, np.uint8))
    assert keypoints == [] and descriptors is None


def test_usurf_needs_upright_images():
    gray = to_gray(load_image(SAMPLES / "camera.png"))
    rotation = lab4.rotation_sweep(gray, angles=(0, 45))
    assert rotation["U-SURF"][45] < rotation["SURF"][45] / 5


def test_lab7_iou_values():
    a = np.zeros((10, 10), np.uint8)
    a[:5] = 255
    b = np.zeros((10, 10), np.uint8)
    b[:, :5] = 255
    assert lab7.score(a, a)["iou"] == 1
    assert abs(lab7.score(a, b)["iou"] - 25 / 75) < 1e-9
    assert lab7.score(a, 255 - a)["iou"] == 0


def test_lab7_region_grow_stops_at_boundary():
    image = np.zeros((30, 30), np.uint8)
    image[5:15, 5:15] = 200
    labels = lab7.region_grow(image, [(10, 10)], tolerance=20)
    assert np.array_equal(labels > 0, image > 0)


def test_lab7_watershed_splits_touching_discs():
    image, truth = synthetic_cells()
    labels = lab7.watershed(truth)
    assert len(np.unique(labels[labels > 1])) == 8
    assert (labels == -1).any()
    assert lab7.score(((labels > 1) | (labels == -1)).astype(np.uint8) * 255, truth)["iou"] > 0.99
    assert image.shape == truth.shape


def test_lab7_semantic_finds_bus_and_person():
    result = lab7.semantic_segment(load_image(SAMPLES / "bus.jpg"))
    assert {"bus", "person"} <= set(result["percent_of_pixels"])
    assert result["classes"].shape == load_image(SAMPLES / "bus.jpg").shape[:2]


def test_importing_labs_does_not_load_pytorch():
    """The API imports every lab at startup, so the heavy libraries must stay lazy."""
    code = ("import sys; import cv_labs.lab06_yolo, cv_labs.lab07_segmentation; "
            "sys.exit('torch' in sys.modules or 'ultralytics' in sys.modules)")
    assert subprocess.run([sys.executable, "-c", code]).returncode == 0


def test_trained_weights_are_in_the_package():
    assert TRAINED.exists()

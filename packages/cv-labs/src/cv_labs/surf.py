"""SURF (Speeded-Up Robust Features), implemented with NumPy.

Why this file exists: the lab sheet calls cv2.xfeatures2d.SURF_create, but the
opencv-contrib-python packages on PyPI are built without patented algorithms, so
that call raises "This algorithm is patented and is excluded in this
configuration". create_surf() still uses OpenCV's version when a build has it and
otherwise uses this implementation of the published method (Bay et al., 2008).

Steps:
1. Integral image: any box sum costs four lookups, whatever the box size.
2. Fast-Hessian detector: box filters approximate second Gaussian derivatives.
   A blob is a local maximum of det(H) = Dxx*Dyy - (0.9*Dxy)^2 in (x, y, scale).
3. Orientation: dominant direction of Haar wavelet responses around the point.
   U-SURF skips this step, assuming the image is upright.
4. Descriptor: a 4x4 grid of (sum dx, sum dy, sum |dx|, sum |dy|), 64 values.

The Hessian threshold uses the same scale as OpenCV (pixels 0-255, each filter box
averaged by its area), so the lab's value of 400 means roughly the same thing.
"""
from __future__ import annotations

import cv2
import numpy as np

# Box-filter sizes per octave, as in the original paper and OpenCV.
_OCTAVE_LAYERS = 4
_BASE_SIZE = 9
_SIZE_STEP = 6


def integral_image(gray: np.ndarray) -> np.ndarray:
    """Summed-area table, one row and column larger than the image."""
    return cv2.integral(gray, sdepth=cv2.CV_64F)


def _box(ii: np.ndarray, top, left, bottom, right) -> np.ndarray:
    """Vectorized sum over rows top..bottom-1 and cols left..right-1 (clipped to the image)."""
    h, w = ii.shape[0] - 1, ii.shape[1] - 1
    top, bottom = np.clip(top, 0, h), np.clip(bottom, 0, h)
    left, right = np.clip(left, 0, w), np.clip(right, 0, w)
    return ii[bottom, right] - ii[top, right] - ii[bottom, left] + ii[top, left]


def _pattern(ii: np.ndarray, top, left, boxes, size: int):
    """Weighted sum of box means. Boxes are defined for the 9x9 filter and scaled to `size`.

    Each box is divided by its own area, so every filter sums to zero even when
    rounding makes the scaled boxes slightly unequal; flat regions then give no response.
    """
    ratio = size / 9.0
    total = 0.0
    for x1, y1, x2, y2, weight in boxes:
        dx1, dy1, dx2, dy2 = (int(round(ratio * v)) for v in (x1, y1, x2, y2))
        area = (dx2 - dx1) * (dy2 - dy1)
        total = total + weight / area * _box(ii, top + dy1, left + dx1, top + dy2, left + dx2)
    return total


# (x1, y1, x2, y2, weight) for the 9x9 second-derivative approximations.
_DXX = ((0, 2, 3, 7, 1), (3, 2, 6, 7, -2), (6, 2, 9, 7, 1))
_DYY = ((2, 0, 7, 3, 1), (2, 3, 7, 6, -2), (2, 6, 7, 9, 1))
_DXY = ((1, 1, 4, 4, 1), (5, 1, 8, 4, -1), (1, 5, 4, 8, -1), (5, 5, 8, 8, 1))


def _hessian_layer(ii: np.ndarray, size: int, step: int):
    """Determinant and Laplacian sign for one filter size, on a grid spaced by `step`."""
    h, w = ii.shape[0] - 1, ii.shape[1] - 1
    if size > h or size > w:
        return None
    margin = (size // 2) // step            # Grid cells between window corner and center.
    rows = np.arange(0, 1 + (h - size) // step)
    cols = np.arange(0, 1 + (w - size) // step)
    top, left = np.meshgrid(rows * step, cols * step, indexing="ij")
    dxx = _pattern(ii, top, left, _DXX, size)
    dyy = _pattern(ii, top, left, _DYY, size)
    dxy = _pattern(ii, top, left, _DXY, size)
    return {"det": (dxx * dyy - 0.81 * dxy * dxy).astype(np.float32),
            "sign": np.where(dxx + dyy >= 0, 1, -1),
            "ys": (rows + margin) * step, "xs": (cols + margin) * step, "size": size}


def _refine(stack: np.ndarray, layer: int, r: int, c: int):
    """Sub-sample position from a 3-D quadratic fit; None if it moves too far or is a saddle."""
    s = stack
    gradient = 0.5 * np.array([s[layer, r, c + 1] - s[layer, r, c - 1],
                               s[layer, r + 1, c] - s[layer, r - 1, c],
                               s[layer + 1, r, c] - s[layer - 1, r, c]])
    centre = s[layer, r, c]
    dxx = s[layer, r, c + 1] + s[layer, r, c - 1] - 2 * centre
    dyy = s[layer, r + 1, c] + s[layer, r - 1, c] - 2 * centre
    dss = s[layer + 1, r, c] + s[layer - 1, r, c] - 2 * centre
    dxy = 0.25 * (s[layer, r + 1, c + 1] - s[layer, r + 1, c - 1] - s[layer, r - 1, c + 1] + s[layer, r - 1, c - 1])
    dxs = 0.25 * (s[layer + 1, r, c + 1] - s[layer + 1, r, c - 1] - s[layer - 1, r, c + 1] + s[layer - 1, r, c - 1])
    dys = 0.25 * (s[layer + 1, r + 1, c] - s[layer + 1, r - 1, c] - s[layer - 1, r + 1, c] + s[layer - 1, r - 1, c])
    hessian = np.array([[dxx, dxy, dxs], [dxy, dyy, dys], [dxs, dys, dss]])
    try:
        offset = -np.linalg.solve(hessian, gradient)
    except np.linalg.LinAlgError:
        return None
    return None if np.any(np.abs(offset) >= 1) else offset


def detect(gray: np.ndarray, hessian_threshold: float = 400, n_octaves: int = 4):
    """Fast-Hessian detector. Returns arrays x, y, scale (sigma), response and sign."""
    ii = integral_image(gray)
    found = []
    for octave in range(n_octaves):
        step = 2 ** octave
        layers = [_hessian_layer(ii, (_BASE_SIZE + i * _SIZE_STEP) * step, step) for i in range(_OCTAVE_LAYERS)]
        if any(layer is None for layer in layers):
            break
        # Larger filters start further from the border: crop all to the smallest grid.
        ys, xs = layers[-1]["ys"], layers[-1]["xs"]
        stack, signs = [], []
        for layer in layers:
            r0 = np.searchsorted(layer["ys"], ys[0])
            c0 = np.searchsorted(layer["xs"], xs[0])
            window = (slice(r0, r0 + ys.size), slice(c0, c0 + xs.size))
            stack.append(layer["det"][window])
            signs.append(layer["sign"][window])
        stack = np.stack(stack)
        if min(stack.shape[1:]) < 3:
            break

        # Non-maximum suppression in a 3x3x3 neighborhood over the middle layers.
        maxima = cv2.dilate(stack.transpose(1, 2, 0), np.ones((3, 3), np.uint8))
        for index in (1, 2):
            peak = np.maximum.reduce([maxima[:, :, index - 1], maxima[:, :, index], maxima[:, :, index + 1]])
            candidates = (stack[index] >= peak) & (stack[index] > hessian_threshold)
            candidates[[0, -1], :] = False
            candidates[:, [0, -1]] = False
            for r, c in zip(*np.nonzero(candidates)):
                offset = _refine(stack, index, r, c)
                if offset is None:
                    continue
                size = layers[index]["size"] + offset[2] * _SIZE_STEP * step
                # Even-sized windows are centered between pixels, hence the half-step shift.
                shift = 0.5 * (step - 1)
                found.append((xs[c] + shift + offset[0] * step, ys[r] + shift + offset[1] * step, 1.2 * size / 9.0,
                              stack[index, r, c], signs[index][r, c]))
    if not found:
        return np.empty((0, 5))
    return np.array(found, dtype=np.float64)


def _haar(ii: np.ndarray, x: np.ndarray, y: np.ndarray, size: np.ndarray):
    """Haar wavelet responses (right-left, bottom-top) of side `size`, centered at (x, y)."""
    half = np.maximum(np.round(size / 2).astype(int), 1)
    xi, yi = np.round(x).astype(int), np.round(y).astype(int)
    left = _box(ii, yi - half, xi - half, yi + half, xi)
    right = _box(ii, yi - half, xi, yi + half, xi + half)
    top = _box(ii, yi - half, xi - half, yi, xi + half)
    bottom = _box(ii, yi, xi - half, yi + half, xi + half)
    area = (2.0 * half) ** 2       # Keeps responses independent of the wavelet size.
    return (right - left) / area, (bottom - top) / area


def orientations(ii: np.ndarray, kp: np.ndarray) -> np.ndarray:
    """Dominant direction per keypoint: strongest sum of Haar responses in a 60-degree window."""
    grid = np.arange(-6, 7)
    gx, gy = np.meshgrid(grid, grid)
    keep = gx**2 + gy**2 <= 36
    gx, gy = gx[keep].astype(float), gy[keep].astype(float)
    weight = np.exp(-(gx**2 + gy**2) / (2 * 2.5**2))

    angles = np.zeros(len(kp))
    window_starts = np.arange(0, 2 * np.pi, np.pi / 21)
    for start in range(0, len(kp), 1024):
        batch = kp[start:start + 1024]
        s = batch[:, 2:3]
        dx, dy = _haar(ii, batch[:, 0:1] + gx * s, batch[:, 1:2] + gy * s, np.broadcast_to(4 * s, (batch.shape[0], gx.size)))
        dx, dy = dx * weight, dy * weight
        theta = np.arctan2(dy, dx) % (2 * np.pi)
        for i in range(len(batch)):
            # Which responses fall in each sliding window (wrapping around 360 degrees).
            inside = ((theta[i] - window_starts[:, None]) % (2 * np.pi)) < np.pi / 3
            sx, sy = inside @ dx[i], inside @ dy[i]
            best = np.argmax(sx**2 + sy**2)
            angles[start + i] = np.arctan2(sy[best], sx[best])
    return angles


def describe(ii: np.ndarray, kp: np.ndarray, angles: np.ndarray) -> np.ndarray:
    """64-value descriptor from a 20s x 20s window aligned with each keypoint's direction."""
    # 20 x 20 sample positions, s apart, split into 4 x 4 subregions of 5 x 5.
    coords = np.arange(20) - 9.5
    v, u = np.meshgrid(coords, coords, indexing="ij")
    u, v = u.ravel(), v.ravel()
    region = (np.arange(20) // 5)
    rv, ru = np.meshgrid(region, region, indexing="ij")
    cell = (rv * 4 + ru).ravel()
    weight = np.exp(-(u**2 + v**2) / (2 * 3.3**2))

    descriptors = np.zeros((len(kp), 64), dtype=np.float32)
    for start in range(0, len(kp), 1024):
        batch, theta = kp[start:start + 1024], angles[start:start + 1024]
        s = batch[:, 2:3]
        cos, sin = np.cos(theta)[:, None], np.sin(theta)[:, None]
        x = batch[:, 0:1] + (cos * u - sin * v) * s
        y = batch[:, 1:2] + (sin * u + cos * v) * s
        dx, dy = _haar(ii, x, y, np.broadcast_to(2 * s, x.shape))
        # Express responses in the keypoint's own rotated frame.
        rx = (cos * dx + sin * dy) * weight
        ry = (-sin * dx + cos * dy) * weight
        for i in range(len(batch)):
            sums = np.stack([np.bincount(cell, rx[i], 16), np.bincount(cell, ry[i], 16),
                             np.bincount(cell, np.abs(rx[i]), 16), np.bincount(cell, np.abs(ry[i]), 16)], axis=1)
            descriptors[start + i] = sums.ravel()
    norms = np.linalg.norm(descriptors, axis=1, keepdims=True)
    return descriptors / np.maximum(norms, 1e-12)


class SURF:
    """Same detectAndCompute interface as OpenCV detectors."""

    backend = "numpy (cv_labs/surf.py)"

    def __init__(self, hessianThreshold: float = 400, nOctaves: int = 4, upright: bool = False):
        self.threshold, self.octaves, self.upright = hessianThreshold, nOctaves, upright

    def detectAndCompute(self, image: np.ndarray, _mask=None):
        gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        kp = detect(gray, self.threshold, self.octaves)
        if len(kp) == 0:
            return [], None
        ii = integral_image(gray)
        angles = np.zeros(len(kp)) if self.upright else orientations(ii, kp)
        descriptors = describe(ii, kp, angles)
        keypoints = [cv2.KeyPoint(float(x), float(y), float(2 * 2.0 * s), float(np.degrees(a) % 360), float(r), 0, int(sign))
                     for (x, y, s, r, sign), a in zip(kp, angles)]
        return keypoints, descriptors


def create_surf(hessian_threshold: float = 400, upright: bool = False):
    """Use OpenCV's SURF when this build includes it, otherwise the implementation above."""
    try:
        surf = cv2.xfeatures2d.SURF_create(hessianThreshold=hessian_threshold, upright=upright)
        surf.backend = "opencv"
        return surf
    except (AttributeError, cv2.error):
        return SURF(hessian_threshold, upright=upright)

"""Lab 5: Eigenfaces with an SVM on Labeled Faces in the Wild.

The labs' fitted model is saved in outputs/lab05; the dataset is kept in memory after
its first load because PCA and the SVM fit fast enough to rerun on request.
"""
from functools import lru_cache

import cv2
import joblib
import numpy as np
from cv_labs import lab05_pca as lab
from cv_labs.common import OUTPUTS, to_gray
from fastapi import HTTPException
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from api.core.images import to_data_url
from api.core.schemas import Chart, LabResult, Panel, Series, Table

MODEL_PATH = OUTPUTS / "lab05" / "model.joblib"
SCALE = 3  # LFW images here are only 37 x 50 pixels, so they are enlarged for display.


@lru_cache(maxsize=1)
def dataset() -> dict:
    return lab.load_data()


@lru_cache(maxsize=1)
def saved_model() -> dict:
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="Saved model not found. Run: uv run python -m cv_labs.lab05_pca")
    return joblib.load(MODEL_PATH)


def _face_image(values: np.ndarray, h: int, w: int) -> np.ndarray:
    """Stretch a face or eigenface to 0-255 and enlarge it without smoothing."""
    face = values.reshape(h, w).astype(np.float32)
    face = cv2.normalize(face, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return cv2.resize(face, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_NEAREST)


def _surname(name: str) -> str:
    return name.split()[-1]


def train(n_components: int, whiten: bool, c: float, gamma: str | float) -> LabResult:
    data = dataset()
    X_train, X_test, y_train, y_test = data["X_train"], data["X_test"], data["y_train"], data["y_test"]
    h, w, names = data["h"], data["w"], data["target_names"]

    pca, pca_seconds = lab.fit_pca(X_train, n_components, whiten)
    clf, svm_seconds = lab.fit_svm(pca.transform(X_train), y_train, C=c, gamma=gamma)
    predicted = clf.predict(pca.transform(X_test))

    panels = [Panel(title=f"Eigenface {i}", image=to_data_url(_face_image(pca.components_[i], h, w)), group="First eigenfaces")
              for i in range(min(12, n_components))]
    panels += [Panel(title=f"Eigenface {i}", image=to_data_url(_face_image(pca.components_[i], h, w)), group="Last eigenfaces")
               for i in range(max(12, n_components - 3), n_components)]
    wrong = np.flatnonzero(predicted != y_test)
    panels += [Panel(title=f"Predicted {_surname(names[predicted[i]])}", caption=f"True: {_surname(names[y_test[i]])}",
                     image=to_data_url(_face_image(X_test[i], h, w)), group=f"Wrong predictions (first 12 of {wrong.size})")
               for i in wrong[:12]]

    cumulative = pca.explained_variance_ratio_.cumsum()
    needed = lab.components_for_variance(pca)
    report = classification_report(y_test, predicted, target_names=names, zero_division=0, output_dict=True)
    report_rows = [[name, round(report[name]["precision"], 2), round(report[name]["recall"], 2),
                    round(report[name]["f1-score"], 2), int(report[name]["support"])] for name in names]
    matrix = confusion_matrix(y_test, predicted)
    summary = [
        ["Images (train / test)", f"{len(X_train)} / {len(X_test)}"],
        ["Pixels per image", data["n_features"]],
        ["People", int(data["n_classes"])],
        ["Components used", n_components],
        ["Variance retained (%)", round(float(cumulative[-1]) * 100, 1)],
        ["Components for 90% of variance", needed if needed > 0 else f"More than {n_components}"],
        ["Test accuracy (%)", round(accuracy_score(y_test, predicted) * 100, 1)],
        ["PCA fit (ms)", round(pca_seconds * 1000)],
        ["SVM fit (ms)", round(svm_seconds * 1000)],
    ]
    return LabResult(
        panels=panels,
        charts=[Chart(title="Cumulative explained variance", x_label="Number of components", y_label="Share of variance",
                      series=[Series(label="Cumulative variance", x=list(range(1, n_components + 1)), y=cumulative.tolist())])],
        tables=[
            Table(title="Summary", columns=["Measure", "Value"], rows=summary),
            Table(title="Classification report", columns=["Person", "Precision", "Recall", "F1-score", "Test images"], rows=report_rows),
            Table(title="Confusion matrix (rows are true, columns are predicted)",
                  columns=["True \\ Predicted", *[_surname(n) for n in names]],
                  rows=[[_surname(names[i]), *row.tolist()] for i, row in enumerate(matrix)]),
        ],
    )


def _predict(face: np.ndarray, model: dict) -> tuple[list[list], str, np.ndarray]:
    """Rank the seven known people for one flattened face, and rebuild it from its components."""
    weights = model["pca"].transform(face[None])
    scores = model["svm"].decision_function(weights)[0]
    names = model["target_names"]
    order = np.argsort(scores)[::-1]
    rows = [[names[i], round(float(scores[i]), 2)] for i in order]
    return rows, names[order[0]], model["pca"].inverse_transform(weights)[0]


def recognize_test_face(index: int) -> LabResult:
    data, model = dataset(), saved_model()
    h, w = data["h"], data["w"]
    index = index % len(data["X_test"])
    face = data["X_test"][index]
    rows, best, rebuilt = _predict(face, model)
    true_name = data["target_names"][data["y_test"][index]]
    outcome = "correct" if best == true_name else "incorrect"
    return LabResult(
        panels=[Panel(title="Test image", image=to_data_url(_face_image(face, h, w)), caption=f"True: {true_name}"),
                Panel(title="Rebuilt from 150 components", image=to_data_url(_face_image(rebuilt, h, w)),
                      caption=f"Predicted: {best} ({outcome})")],
        tables=[Table(title="SVM scores", columns=["Person", "Score"], rows=rows)],
    )


_face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def closest_match(image: np.ndarray) -> LabResult:
    """Fit an uploaded photo to the model. Any face gets a result, so this is not identification."""
    model = saved_model()
    h, w = model["h"], model["w"]
    gray = to_gray(image)
    found = _face_detector.detectMultiScale(gray, 1.1, 5, minSize=(40, 40))
    notes = ["The model only knows seven people, so it always picks one of them. "
             "This shows the closest fit in eigenface space and does not identify the person in the photo."]
    if len(found):
        x, y, fw, fh = max(found, key=lambda box: box[2] * box[3])
        # LFW crops are taller than a detected face box and include some of the chin and forehead.
        target_h = int(fw * h / w)
        top = max(y - (target_h - fh) // 2, 0)
        crop = gray[top:top + target_h, x:x + fw]
    else:
        crop = gray
        notes.append("No face was detected, so the whole image was used. The result will not be meaningful.")
    face = cv2.resize(crop, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32).ravel() / 255
    rows, _, rebuilt = _predict(face, model)
    return LabResult(
        panels=[Panel(title="Input after cropping", image=to_data_url(_face_image(face, h, w))),
                Panel(title="Rebuilt from 150 components", image=to_data_url(_face_image(rebuilt, h, w)))],
        tables=[Table(title="SVM scores (closest fit first)", columns=["Person", "Score"], rows=rows)],
        notes=notes,
    )

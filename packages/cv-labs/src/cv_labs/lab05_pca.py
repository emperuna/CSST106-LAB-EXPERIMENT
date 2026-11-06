"""Lab 5 - Facial recognition with PCA (Eigenfaces) and an SVM classifier.

Run with: python -m cv_labs.lab05_pca
The Labeled Faces in the Wild dataset (about 200 MB) downloads on the first run.
"""
from __future__ import annotations

import time

import joblib
import matplotlib.pyplot as plt
import numpy as np
from sklearn.datasets import fetch_lfw_people
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.svm import SVC

from .common import DATA, out_dir, save_json

N_COMPONENTS = 150


def load_data() -> dict:
    """Task 1: fetch people with at least 70 photos and split 80% train, 20% test.

    Each image is flattened into one row of X, so one image is one point in a
    high-dimensional space with one axis per pixel.
    """
    lfw = fetch_lfw_people(min_faces_per_person=70, resize=0.4, data_home=str(DATA / "sklearn"))
    n_samples, h, w = lfw.images.shape
    X_train, X_test, y_train, y_test = train_test_split(lfw.data, lfw.target, test_size=0.2, random_state=42)
    return {"X_train": X_train, "X_test": X_test, "y_train": y_train, "y_test": y_test,
            "h": h, "w": w, "n_samples": n_samples, "n_features": lfw.data.shape[1],
            "target_names": lfw.target_names, "n_classes": lfw.target_names.shape[0]}


def fit_pca(X_train: np.ndarray, n_components: int = N_COMPONENTS, whiten: bool = True) -> tuple[PCA, float]:
    """Task 2: fit on training data only, so nothing about the test set leaks into the model.

    scikit-learn subtracts the mean face before computing the components.
    """
    start = time.perf_counter()
    pca = PCA(n_components=n_components, svd_solver="randomized", whiten=whiten, random_state=42).fit(X_train)
    return pca, time.perf_counter() - start


def fit_svm(X_train_pca: np.ndarray, y_train: np.ndarray, **params) -> tuple[SVC, float]:
    """Task 4: an RBF SVM; balanced class weights offset the many George W. Bush photos."""
    start = time.perf_counter()
    clf = SVC(kernel="rbf", class_weight="balanced", **params).fit(X_train_pca, y_train)
    return clf, time.perf_counter() - start


def tune_svm(X_train_pca: np.ndarray, y_train: np.ndarray) -> GridSearchCV:
    """Search C and gamma by 5-fold cross-validation on the training set only."""
    grid = {"C": [1, 10, 100, 1000, 10000], "gamma": ["scale", 0.0005, 0.001, 0.005, 0.01]}
    search = GridSearchCV(SVC(kernel="rbf", class_weight="balanced"), grid, cv=5, scoring="f1_macro", n_jobs=-1)
    return search.fit(X_train_pca, y_train)


def components_for_variance(pca: PCA, target: float = 0.90) -> int:
    """Post-lab Q1: the smallest number of components reaching the target variance."""
    cumulative = pca.explained_variance_ratio_.cumsum()
    return int(np.searchsorted(cumulative, target) + 1) if cumulative[-1] >= target else -1


def plot_gallery(images, titles, h: int, w: int, path, n_row: int = 3, n_col: int = 4) -> None:
    """Task 3: the plotting helper from the lab sheet, saved to a file instead of shown."""
    n_row = min(n_row, int(np.ceil(len(images) / n_col)))
    fig = plt.figure(figsize=(1.8 * n_col, 2.4 * n_row))
    fig.subplots_adjust(bottom=0, left=0.01, right=0.99, top=0.90, hspace=0.45)
    for i in range(min(n_row * n_col, len(images))):
        ax = fig.add_subplot(n_row, n_col, i + 1)
        ax.imshow(images[i].reshape(h, w), cmap="gray")
        ax.set_title(titles[i], size=8)
        ax.set_xticks(())
        ax.set_yticks(())
    fig.savefig(path, dpi=130)
    plt.close(fig)


def plot_variance(pca: PCA, needed: int, path) -> None:
    """Post-lab Q1: cumulative explained variance against the number of components."""
    cumulative = pca.explained_variance_ratio_.cumsum()
    fig, ax = plt.subplots(figsize=(6.6, 3.8))
    ax.plot(range(1, cumulative.size + 1), cumulative, color="#3b6ea5")
    ax.axhline(0.90, color="#c4532d", ls="--", lw=1, label="90% of variance")
    ax.axvline(needed, color="#c4532d", ls=":", lw=1, label=f"{needed} components")
    ax.set(xlabel="Number of components", ylabel="Cumulative explained variance",
           title="Variance retained by PCA", ylim=(0, 1))
    ax.grid(alpha=0.3)
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def plot_confusion(matrix: np.ndarray, names, path) -> None:
    fig, ax = plt.subplots(figsize=(6.4, 5.4))
    ax.imshow(matrix, cmap="Blues")
    short = [n.split()[-1] for n in names]
    ax.set_xticks(range(len(short)), short, rotation=45, ha="right")
    ax.set_yticks(range(len(short)), short)
    ax.set(xlabel="Predicted", ylabel="True", title="Test set confusion matrix")
    for (r, c), value in np.ndenumerate(matrix):
        ax.text(c, r, value, ha="center", va="center", fontsize=9,
                color="white" if value > matrix.max() / 2 else "black")
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def reconstruction_error(pca: PCA, X: np.ndarray) -> np.ndarray:
    """Per-image mean squared difference from its PCA reconstruction."""
    return ((X - pca.inverse_transform(pca.transform(X))) ** 2).mean(axis=1)


def failure_analysis(data: dict, pca: PCA, y_pred: np.ndarray, out) -> dict:
    """Post-lab Q4: find wrong predictions programmatically and compare them with right ones."""
    X_test, y_test, names = data["X_test"], data["y_test"], data["target_names"]
    wrong = np.flatnonzero(y_pred != y_test)
    right = np.flatnonzero(y_pred == y_test)
    short = lambda i: names[i].split()[-1]  # noqa: E731
    titles = [f"predicted: {short(y_pred[i])}\ntrue: {short(y_test[i])}" for i in wrong]
    plot_gallery(X_test[wrong], titles, data["h"], data["w"], out / "failures.png", n_row=4, n_col=5)

    errors = reconstruction_error(pca, X_test)
    h, w = data["h"], data["w"]
    faces = X_test.reshape(-1, h, w)
    # Difference between left and right halves: large values mean side lighting or a turned head.
    left, right_half = faces[:, :, : w // 2].mean(axis=(1, 2)), faces[:, :, w - w // 2:].mean(axis=(1, 2))
    asymmetry = np.abs(left - right_half)
    brightness = X_test.mean(axis=1)
    summary = lambda v: {"correct_mean": float(v[right].mean()), "incorrect_mean": float(v[wrong].mean())}  # noqa: E731
    return {
        "test_images": int(y_test.size), "incorrect": int(wrong.size),
        "reconstruction_error": summary(errors),
        "left_right_asymmetry": summary(asymmetry),
        "mean_brightness": summary(brightness),
        "errors_by_true_person": {names[i]: int((y_test[wrong] == i).sum()) for i in range(len(names))},
        "photos_by_true_person_in_test": {names[i]: int((y_test == i).sum()) for i in range(len(names))},
    }


def run(out=None) -> dict:
    out = out or out_dir("lab05")
    data = load_data()
    X_train, X_test, y_train, y_test = data["X_train"], data["X_test"], data["y_train"], data["y_test"]
    h, w, names = data["h"], data["w"], data["target_names"]

    # Task 2: reduce 1,850 pixels per image to 150 values.
    pca, pca_seconds = fit_pca(X_train)
    X_train_pca, X_test_pca = pca.transform(X_train), pca.transform(X_test)

    # Task 3: components are vectors of pixels, so they can be shown as images.
    eigenfaces = pca.components_.reshape((N_COMPONENTS, h, w))
    plot_gallery(eigenfaces, [f"eigenface {i}" for i in range(12)], h, w, out / "eigenfaces.png")
    picks = [0, 1, 2, N_COMPONENTS - 3, N_COMPONENTS - 2, N_COMPONENTS - 1]
    plot_gallery(eigenfaces[picks], [f"eigenface {i}" for i in picks], h, w, out / "first_vs_last_eigenfaces.png",
                 n_row=2, n_col=3)
    plot_gallery(pca.mean_[None], ["mean face"], h, w, out / "mean_face.png", n_row=1, n_col=1)

    # Task 4: the classifier the lab specifies, with default C and gamma.
    clf, svm_seconds = fit_svm(X_train_pca, y_train)
    y_pred = clf.predict(X_test_pca)
    report_text = classification_report(y_test, y_pred, target_names=names, zero_division=0)
    (out / "classification_report.txt").write_text(report_text)
    plot_confusion(confusion_matrix(y_test, y_pred), names, out / "confusion_matrix.png")

    # Post-lab Q1.
    needed = components_for_variance(pca)
    plot_variance(pca, needed, out / "cumulative_variance.png")

    # Post-lab Q3: the same SVM with and without whitening.
    plain, _ = fit_pca(X_train, whiten=False)
    plain_clf, _ = fit_svm(plain.transform(X_train), y_train)
    plain_pred = plain_clf.predict(plain.transform(X_test))
    train_std = X_train_pca.std(axis=0)
    plain_std = plain.transform(X_train).std(axis=0)

    # Better parameters, chosen on training data only, reported beside the required baseline.
    search = tune_svm(X_train_pca, y_train)
    tuned_pred = search.predict(X_test_pca)
    (out / "classification_report_tuned.txt").write_text(
        classification_report(y_test, tuned_pred, target_names=names, zero_division=0))
    plot_confusion(confusion_matrix(y_test, tuned_pred), names, out / "confusion_matrix_tuned.png")

    # Reconstructions: how a face looks when rebuilt from k components.
    sample = X_test[:4]
    rows, titles = [], []
    for k in (10, 50, 150):
        model = PCA(n_components=k, svd_solver="randomized", random_state=42).fit(X_train)
        rows.extend(model.inverse_transform(model.transform(sample)))
        titles.extend([f"{k} components"] * len(sample))
    rows.extend(sample)
    titles.extend(["original"] * len(sample))
    plot_gallery(np.array(rows), titles, h, w, out / "reconstructions.png", n_row=4, n_col=4)

    # Post-lab Q4 uses the tuned model, the best one available.
    failures = failure_analysis(data, pca, tuned_pred, out)

    # Keep the fitted models and test split so the Web UI can show predictions without retraining.
    joblib.dump({"pca": pca, "svm": search.best_estimator_, "target_names": names, "h": h, "w": w},
                out / "model.joblib")

    score = lambda y: {"accuracy": accuracy_score(y_test, y), "macro_f1": f1_score(y_test, y, average="macro")}  # noqa: E731
    metrics = {
        "dataset": {"n_samples": data["n_samples"], "n_features": data["n_features"], "image_size": [h, w],
                    "n_classes": int(data["n_classes"]), "names": names, "train": len(X_train), "test": len(X_test)},
        "pca": {"n_components": N_COMPONENTS, "fit_seconds": pca_seconds,
                "variance_retained": float(pca.explained_variance_ratio_.sum()),
                "components_for_90_percent": needed,
                "first_three_component_variance": pca.explained_variance_ratio_[:3]},
        "svm_baseline": {"fit_seconds": svm_seconds, **score(y_pred)},
        "svm_without_whitening": score(plain_pred),
        "whitening_effect": {
            "whitened_std_first_last": [float(train_std[0]), float(train_std[-1])],
            "plain_std_first_last": [float(plain_std[0]), float(plain_std[-1])]},
        "svm_tuned": {"best_params": search.best_params_, "cv_macro_f1": search.best_score_, **score(tuned_pred)},
        "failure_analysis": failures,
    }
    save_json(out / "metrics.json", metrics)
    print(report_text)
    return metrics


if __name__ == "__main__":
    print(run())

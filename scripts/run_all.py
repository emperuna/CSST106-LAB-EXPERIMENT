"""Run the labs and regenerate outputs/. Usage: uv run python scripts/run_all.py

Lab 6 training is left out because it takes a long time on a CPU. This script runs
its pre-trained detection and, if a trained model exists, its evaluation.
"""
from cv_labs import lab01_images, lab02_edges, lab03_histogram, lab04_surf, lab05_pca, lab06_yolo, lab07_segmentation, samples


def main() -> None:
    samples.main()
    for label, step in (("Lab 1", lab01_images.run), ("Lab 2", lab02_edges.run), ("Lab 3", lab03_histogram.run),
                        ("Lab 4", lab04_surf.run), ("Lab 5", lab05_pca.run),
                        ("Lab 6 detection", lab06_yolo.run_inference_demo), ("Lab 7", lab07_segmentation.run)):
        print(f"--- {label}", flush=True)
        step()
    if lab06_yolo.TRAINED.exists():
        print("--- Lab 6 evaluation", flush=True)
        lab06_yolo.evaluate()
    print("Done. Results are in outputs/")


if __name__ == "__main__":
    main()

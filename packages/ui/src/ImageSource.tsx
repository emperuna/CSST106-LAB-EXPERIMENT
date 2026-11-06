import { useEffect, useId, useState, type DragEvent } from "react";

export interface SampleOption {
  name: string;
  label: string;
  url: string;
}

export type ImageValue = { sample: string } | { file: File };

interface Props {
  samples: SampleOption[];
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  label?: string;
}

/** Choose a sample image or upload your own, by file picker or drag and drop. */
export function ImageSource({ samples, value, onChange, label = "Input image" }: Props) {
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(false);
  const file = "file" in value ? value.file : null;

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function accept(candidate: File | undefined) {
    if (!candidate) return;
    const ok = candidate.type.startsWith("image/");
    setRejected(!ok);
    if (ok) onChange({ file: candidate });
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  return (
    <fieldset className="image-source">
      <legend className="field-label">{label}</legend>
      <div className="sample-grid">
        {samples.map((sample) => {
          const selected = "sample" in value && value.sample === sample.name;
          return (
            <button
              key={sample.name}
              type="button"
              className="sample"
              aria-pressed={selected}
              title={sample.label}
              onClick={() => onChange({ sample: sample.name })}
            >
              <img src={sample.url} alt={sample.label} loading="lazy" />
            </button>
          );
        })}
      </div>
      {"sample" in value && (
        <p className="field-hint">
          {samples.find((s) => s.name === value.sample)?.label ?? value.sample}
        </p>
      )}
      <label
        htmlFor={inputId}
        className={`dropzone${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
      >
        {preview && file ? (
          <>
            <img src={preview} alt="" className="dropzone-preview" />
            <span className="dropzone-name">{file.name}</span>
          </>
        ) : (
          <span>Upload an image, or drop one here</span>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(event) => {
            accept(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      {rejected && <p className="field-error">That file is not an image.</p>}
    </fieldset>
  );
}

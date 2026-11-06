import {
  api,
  formBody,
  imageFields,
  LabProvider,
  unwrap,
  useSamples,
  type ImageChoice,
} from "@csst106/api-client";
import {
  FileField,
  ImageSource,
  RangeField,
  ResultView,
  SelectField,
  Tabs,
  Workbench,
} from "@csst106/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { WebcamTab } from "./WebcamTab";

export type ModelName = "coco" | "wildlife";

const MODELS: { value: ModelName; label: string }[] = [
  { value: "coco", label: "Pre-trained (80 classes)" },
  { value: "wildlife", label: "Custom wildlife (4 classes)" },
];
const SIZES = [
  { value: 320, label: "320 px (faster)" },
  { value: 640, label: "640 px (more accurate)" },
];
const percent = (value: number) => `${Math.round(value * 100)}%`;

function ImageTab() {
  const samples = useSamples(["bus.jpg", "zidane.jpg", "input.jpg", "coffee.jpg"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "bus.jpg" });
  const [model, setModel] = useState<ModelName>("coco");
  const [conf, setConf] = useState(0.25);
  const [imgsz, setImgsz] = useState(640);
  const run = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab06/detect", {
          body: { ...imageFields(image), model, conf, imgsz },
          bodySerializer: formBody,
        }),
      ),
  });
  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Detecting"
      runLabel="Detect objects"
      emptyMessage="Run to detect objects. The first run also loads the model."
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <ImageSource samples={samples} value={image} onChange={setImage} />
          <SelectField label="Model" value={model} options={MODELS} onChange={setModel} />
          <RangeField
            label="Confidence threshold"
            value={conf}
            min={0.05}
            max={0.95}
            step={0.05}
            format={percent}
            onChange={setConf}
          />
          <SelectField
            label="Network input size"
            value={imgsz}
            options={SIZES}
            onChange={setImgsz}
          />
        </>
      }
    />
  );
}

function VideoTab() {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<ModelName>("coco");
  const [conf, setConf] = useState(0.25);
  const run = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab06/video", {
          body: { file: file as unknown as string, model, conf, imgsz: 320 },
          bodySerializer: formBody,
        }),
      ),
  });
  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Processing video"
      runLabel="Detect in video"
      disabled={!file}
      emptyMessage="Choose a video file. Up to 120 evenly spaced frames are processed."
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <FileField
            label="Video file"
            accept="video/*"
            file={file}
            onChange={setFile}
            hint="Up to 60 MB. MP4 works best."
          />
          <SelectField label="Model" value={model} options={MODELS} onChange={setModel} />
          <RangeField
            label="Confidence threshold"
            value={conf}
            min={0.05}
            max={0.95}
            step={0.05}
            format={percent}
            onChange={setConf}
          />
        </>
      }
    />
  );
}

function TrainingTab() {
  const { data, error, isPending } = useQuery({
    queryKey: ["lab06-training"],
    queryFn: () => unwrap(api.GET("/api/labs/lab06/training")),
  });
  if (isPending) return <p className="waiting">Loading saved results…</p>;
  if (error) {
    return (
      <p className="error" role="alert">
        {error.message}
      </p>
    );
  }
  return <ResultView result={data} />;
}

export function YoloLab() {
  return (
    <LabProvider>
      <Tabs
        tabs={[
          { label: "Image", content: <ImageTab /> },
          { label: "Video", content: <VideoTab /> },
          { label: "Webcam", content: <WebcamTab models={MODELS} /> },
          { label: "Custom training", content: <TrainingTab /> },
        ]}
      />
    </LabProvider>
  );
}

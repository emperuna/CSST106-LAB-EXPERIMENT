import { Play } from "@reticle/ui";
import { useRef, useState } from "react";
import { cannySettings, codeFiles, valueFor, type ControlKey } from "../data/runCode";
import { useLinkLine } from "../hooks/useLinkLine";
import { cropRules } from "../utils/crop";

interface Props {
  /** The Lab 2 sample photo. */
  input: string;
  /** The saved Canny threshold sweep figure, with its size for cropping one panel out. */
  sweep: { src: string; width: number; height: number };
}

const CONTROLS: { key: ControlKey; label: string }[] = [
  { key: "image", label: "Input image" },
  { key: "blur", label: "Gaussian blur" },
  { key: "sobel", label: "Sobel kernel" },
  { key: "canny", label: "Canny thresholds" },
];

/**
 * How a lab works, shown on Lab 2: its controls on the left and the exact code they feed on the
 * right. Pointing at or focusing a control lights its lines and draws a line between them. The
 * Canny thresholds switch between the three settings the lab saved, with their real results.
 */
export function ControlsToCode({ input, sweep }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ControlKey>("canny");
  const [settingIndex, setSettingIndex] = useState(1);
  const setting = cannySettings[settingIndex]!;
  const link = useLinkLine(rootRef, active);

  const focus = (key: ControlKey) => ({
    onPointerEnter: () => setActive(key),
    onFocus: () => setActive(key),
  });

  return (
    <div ref={rootRef} className="c2c">
      <div className="c2c-page">
        <span className="c2c-label">The lab page</span>
        <div className="c2c-controls">
          {CONTROLS.map((control) => (
            <div
              key={control.key}
              className="c2c-control"
              data-control={control.key}
              data-active={active === control.key || undefined}
              {...focus(control.key)}
            >
              <span className="c2c-control-name">{control.label}</span>
              {control.key === "image" && (
                <span className="c2c-control-value" tabIndex={0}>
                  <img src={input} alt="" />
                  input.jpg
                </span>
              )}
              {control.key === "blur" && (
                <span className="c2c-control-value" tabIndex={0}>
                  3 × 3
                </span>
              )}
              {control.key === "sobel" && (
                <span className="c2c-control-value" tabIndex={0}>
                  3 × 3
                </span>
              )}
              {control.key === "canny" && (
                <span className="c2c-segmented" role="group" aria-label="Canny thresholds">
                  {cannySettings.map((option, index) => (
                    <button
                      key={option.low}
                      type="button"
                      aria-pressed={index === settingIndex}
                      onClick={() => {
                        setSettingIndex(index);
                        setActive("canny");
                      }}
                    >
                      {option.low} / {option.high}
                    </button>
                  ))}
                </span>
              )}
            </div>
          ))}
          <span
            className="c2c-run"
            data-control="run"
            data-active={active === "run" || undefined}
            tabIndex={0}
            {...focus("run")}
          >
            <Play aria-hidden="true" />
            Run
          </span>
        </div>

        <figure className="c2c-result">
          <span className="c2c-result-frame">
            <img
              src={sweep.src}
              alt={`Canny edges of the astronaut photo at thresholds ${setting.low} and ${setting.high}`}
              style={cropRules(sweep, setting.panel, 1)}
            />
          </span>
          <figcaption>
            <span className="c2c-result-value">{setting.percent.toFixed(2)}%</span>
            <span>
              of pixels marked as edges at {setting.low} / {setting.high}, from the saved run
            </span>
          </figcaption>
        </figure>
      </div>

      <div className="c2c-code">
        <span className="c2c-label">The code it runs</span>
        {codeFiles.map((file) => {
          const annotate = file.path.endsWith("service.py");
          return (
            <div key={file.path} className="c2c-file">
              <span className="c2c-path">{file.path}</span>
              <pre>
                {file.lines.map((line) => {
                  const value = annotate && line.key ? valueFor(line.key, setting) : null;
                  return (
                    <code
                      key={line.text}
                      className="c2c-line"
                      // The line the connector points at: the service call, or the route for Run.
                      data-line={annotate || line.key === "run" ? line.key : undefined}
                      data-key={line.key}
                      data-active={line.key === active || undefined}
                      data-indent={line.indent || undefined}
                    >
                      {line.text}
                      {value && <span className="c2c-value"> # {value}</span>}
                    </code>
                  );
                })}
              </pre>
            </div>
          );
        })}
      </div>

      {link && (
        <svg
          className="c2c-link"
          viewBox={`0 0 ${link.width} ${link.height}`}
          width={link.width}
          height={link.height}
          aria-hidden="true"
        >
          <path d={link.d} />
        </svg>
      )}
    </div>
  );
}

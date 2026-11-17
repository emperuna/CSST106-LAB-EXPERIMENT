import { X } from "lucide-react";
import { useRef, useState } from "react";
import { Histogram, LineChart, type ChartData } from "../charts/charts";
import { ImageFrame } from "../image-frame/ImageFrame";

interface PanelData {
  title: string;
  image: string;
  caption?: string | null;
  group?: string | null;
  large?: boolean;
  step?: number | null;
}

interface ReadoutData {
  label: string;
  value: string | number;
  unit?: string | null;
  step?: number | null;
}

/** Matches the API's LabResult, so any lab's response can be shown here. */
export interface ResultData {
  panels?: PanelData[];
  tables?: { title: string; columns: string[]; rows: (string | number | null)[][] }[];
  charts?: (ChartData & { kind: string; group?: string | null })[];
  legend?: { label: string; color: string }[];
  videos?: { title: string; source: string }[];
  notes?: string[];
  readouts?: ReadoutData[];
  elapsed_ms?: number;
}

const pad = (value: number) => String(value).padStart(2, "0");
const stepTag = (step?: number | null) => (step ? `Step ${pad(step)}` : undefined);

/** The run's headline measurements, large and in mono, each marked with its procedure step. */
function Readouts({ readouts }: { readouts: ReadoutData[] }) {
  return (
    <dl className="readouts">
      {readouts.map((readout) => (
        <div key={readout.label} className="readout-card">
          <dt>
            {readout.step && <span className="readout-step">{pad(readout.step)}</span>}
            {readout.label}
          </dt>
          <dd>
            {typeof readout.value === "number"
              ? readout.value.toLocaleString("en-US")
              : readout.value}
            {readout.unit && <span className="readout-unit">{readout.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function groupBy<T extends { group?: string | null }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.group ?? "";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
}

/**
 * The viewer: one result large, with a filmstrip of every result to switch between. The stage
 * opens the full-size image. A rerun keeps the same result selected when it is still there.
 */
function Viewer({ panels }: { panels: PanelData[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const current = panels.find((panel) => panel.title === selected) ?? panels[0]!;

  return (
    <section className="viewer" aria-label="Results">
      <ImageFrame
        src={current.image}
        alt={current.title}
        title={current.title}
        readout={current.caption}
        tag={stepTag(current.step)}
        onOpen={() => dialog.current?.showModal()}
      />
      {panels.length > 1 && (
        <div className="filmstrip">
          {groupBy(panels).map(([group, items]) => (
            <div
              key={group}
              className="filmstrip-group"
              role="group"
              aria-label={group || "Results"}
            >
              {group && <span className="filmstrip-label">{group}</span>}
              <div className="filmstrip-items">
                {items.map((panel) => (
                  <button
                    key={panel.title}
                    type="button"
                    className="filmstrip-item"
                    aria-pressed={panel === current}
                    onClick={() => setSelected(panel.title)}
                  >
                    <img src={panel.image} alt="" />
                    <span>
                      {panel.step && <span className="filmstrip-step">{pad(panel.step)}</span>}
                      {panel.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <dialog ref={dialog} className="lightbox">
        <div className="lightbox-head">
          <strong>{current.title}</strong>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => dialog.current?.close()}
          >
            <X aria-hidden="true" />
            Close
          </button>
        </div>
        <img src={current.image} alt={current.title} />
      </dialog>
    </section>
  );
}

function ResultTable({ table }: { table: NonNullable<ResultData["tables"]>[number] }) {
  return (
    <section className="result-table">
      <h3>{table.title}</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th scope="col" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length} className="table-empty">
                  Nothing found.
                </td>
              </tr>
            )}
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) =>
                  c === 0 ? (
                    <th scope="row" key={c}>
                      {cell}
                    </th>
                  ) : (
                    <td key={c}>
                      {typeof cell === "number" ? cell.toLocaleString("en-US") : cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ResultView({ result }: { result: ResultData }) {
  const {
    panels = [],
    tables = [],
    charts = [],
    legend = [],
    videos = [],
    notes = [],
    readouts = [],
    elapsed_ms = 0,
  } = result;
  return (
    <div className="results">
      {readouts.length > 0 && <Readouts readouts={readouts} />}
      {videos.map((video) => (
        <section key={video.title} className="result-group">
          <h3>{video.title}</h3>
          <video src={video.source} controls muted loop playsInline className="result-video" />
        </section>
      ))}
      {panels.length > 0 && <Viewer panels={panels} />}
      {legend.length > 0 && (
        <ul className="legend" aria-label="Classes">
          {legend.map((item) => (
            <li key={item.label}>
              <i style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      {groupBy(charts).map(([group, charts]) => (
        <section key={group} className="result-group">
          {group && <h3>{group}</h3>}
          <div className="chart-grid">
            {charts.map((chart) =>
              chart.kind === "histogram" ? (
                <Histogram key={chart.title} chart={chart} />
              ) : (
                <LineChart key={chart.title} chart={chart} />
              ),
            )}
          </div>
        </section>
      ))}
      <div className="table-grid">
        {tables.map((table) => (
          <ResultTable key={table.title} table={table} />
        ))}
      </div>
      {notes.length > 0 && (
        <ul className="notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      {elapsed_ms > 0 && <p className="elapsed">Computed in {(elapsed_ms / 1000).toFixed(2)} s</p>}
    </div>
  );
}

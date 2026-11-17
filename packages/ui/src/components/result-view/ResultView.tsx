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
}

/** Matches the API's LabResult, so any lab's response can be shown here. */
export interface ResultData {
  panels?: PanelData[];
  tables?: { title: string; columns: string[]; rows: (string | number | null)[][] }[];
  charts?: (ChartData & { kind: string; group?: string | null })[];
  legend?: { label: string; color: string }[];
  videos?: { title: string; source: string }[];
  notes?: string[];
  elapsed_ms?: number;
}

function groupBy<T extends { group?: string | null }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.group ?? "";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
}

function Panels({ panels }: { panels: PanelData[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<PanelData | null>(null);

  function show(panel: PanelData) {
    setOpen(panel);
    dialog.current?.showModal();
  }

  return (
    <>
      {groupBy(panels).map(([group, items]) => (
        <section key={group} className="result-group">
          {group && <h3>{group}</h3>}
          <div className={`panel-grid${items.some((item) => item.large) ? " is-large" : ""}`}>
            {items.map((panel) => (
              <ImageFrame
                key={panel.title}
                src={panel.image}
                alt={panel.title}
                title={panel.title}
                readout={panel.caption}
                onOpen={() => show(panel)}
              />
            ))}
          </div>
        </section>
      ))}
      <dialog ref={dialog} className="lightbox" onClose={() => setOpen(null)}>
        {open && (
          <>
            <div className="lightbox-head">
              <strong>{open.title}</strong>
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={() => dialog.current?.close()}
              >
                <X aria-hidden="true" />
                Close
              </button>
            </div>
            <img src={open.image} alt={open.title} />
          </>
        )}
      </dialog>
    </>
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
    elapsed_ms = 0,
  } = result;
  return (
    <div className="results">
      {notes.length > 0 && (
        <ul className="notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      {videos.map((video) => (
        <section key={video.title} className="result-group">
          <h3>{video.title}</h3>
          <video src={video.source} controls muted loop playsInline className="result-video" />
        </section>
      ))}
      <Panels panels={panels} />
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
      {elapsed_ms > 0 && <p className="elapsed">Computed in {(elapsed_ms / 1000).toFixed(2)} s</p>}
    </div>
  );
}

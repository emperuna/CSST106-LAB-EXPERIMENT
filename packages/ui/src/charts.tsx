import { useEffect, useId, useRef, useState, type PointerEvent } from "react";

export interface ChartData {
  title: string;
  x_label: string;
  y_label: string;
  series: { label: string; x: (number | string)[]; y: number[] }[];
}

const HEIGHT = 270;
const MARGIN = { top: 12, right: 18, bottom: 44, left: 58 };

/** Draw at the chart's real pixel width, so axis text stays readable at any size. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const fraction = value / power;
  // Each step divides evenly into the five intervals between gridlines.
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => fraction <= candidate) ?? 10;
  return step * power;
}

function formatValue(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("en-US");
  return value.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

function formatTick(value: number): string {
  if (value >= 1000) return `${Number((value / 1000).toFixed(1))}k`;
  return String(Number(value.toFixed(2)));
}

function Axes({
  yMax,
  ticks,
  xLabel,
  yLabel,
  plotRight,
}: {
  yMax: number;
  ticks: { x: number; label: string }[];
  xLabel: string;
  yLabel: string;
  plotRight: number;
}) {
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((share) => share * yMax);
  return (
    <g className="chart-axes">
      {yTicks.map((tick) => {
        const y = MARGIN.top + plotHeight - (tick / yMax) * plotHeight;
        return (
          <g key={tick}>
            <line x1={MARGIN.left} x2={plotRight} y1={y} y2={y} className="chart-gridline" />
            <text x={MARGIN.left - 8} y={y + 4} textAnchor="end">
              {formatTick(tick)}
            </text>
          </g>
        );
      })}
      {ticks.map((tick) => (
        <text key={tick.x} x={tick.x} y={HEIGHT - MARGIN.bottom + 18} textAnchor="middle">
          {tick.label}
        </text>
      ))}
      <text x={(MARGIN.left + plotRight) / 2} y={HEIGHT - 6} textAnchor="middle">
        {xLabel}
      </text>
      <text
        transform={`translate(13 ${MARGIN.top + plotHeight / 2}) rotate(-90)`}
        textAnchor="middle"
      >
        {yLabel}
      </text>
    </g>
  );
}

function pickTicks(count: number, wanted: number): number[] {
  if (count <= wanted) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (wanted - 1);
  return Array.from({ length: wanted }, (_, i) => Math.round(i * step));
}

function DataTable({ chart }: { chart: ChartData }) {
  const first = chart.series[0];
  if (!first) return null;
  return (
    <details className="chart-table">
      <summary>Show data table</summary>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{chart.x_label}</th>
              {chart.series.map((s) => (
                <th scope="col" key={s.label}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {first.x.map((x, i) => (
              <tr key={String(x)}>
                <th scope="row">{x}</th>
                {chart.series.map((s) => (
                  <td key={s.label}>{formatValue(s.y[i] ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function useHover(count: number, width: number, plotLeft: number, plotRight: number) {
  const [index, setIndex] = useState<number | null>(null);
  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * width;
    const share = (x - plotLeft) / (plotRight - plotLeft);
    setIndex(
      share < -0.05 || share > 1.05
        ? null
        : Math.min(count - 1, Math.max(0, Math.round(share * (count - 1)))),
    );
  }
  return { index, onPointerMove, onPointerLeave: () => setIndex(null) };
}

function Tooltip({
  share,
  heading,
  rows,
}: {
  share: number;
  heading: string;
  rows: { label: string; value: string; color: string }[];
}) {
  return (
    <div
      className={`chart-tooltip${share > 0.6 ? " flip" : ""}`}
      style={{ left: `${share * 100}%` }}
    >
      <strong>{heading}</strong>
      {rows.map((row) => (
        <span key={row.label}>
          <i style={{ background: row.color }} />
          {row.label}: {row.value}
        </span>
      ))}
    </div>
  );
}

const seriesColor = (index: number) => `var(--series-${index + 1})`;

/** Lines over a shared x axis. Series colors follow a fixed order; five series at most. */
export function LineChart({ chart }: { chart: ChartData }) {
  const titleId = useId();
  const first = chart.series[0];
  const labelSpace = chart.series.length >= 2 && chart.series.length <= 4 ? 62 : 0;
  const { ref, width } = useWidth();
  const plotRight = width - MARGIN.right - labelSpace;
  const count = first?.x.length ?? 0;
  const hover = useHover(count, width, MARGIN.left, plotRight);
  if (!first || count === 0) return null;

  const yMax = niceMax(Math.max(...chart.series.flatMap((s) => s.y)));
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const px = (i: number) =>
    MARGIN.left + (count === 1 ? 0 : (i / (count - 1)) * (plotRight - MARGIN.left));
  const py = (v: number) => MARGIN.top + plotHeight - (v / yMax) * plotHeight;
  const ticks = pickTicks(count, width < 420 ? 5 : 8).map((i) => ({
    x: px(i),
    label: String(first.x[i]),
  }));
  const showMarkers = count <= 12;

  // End labels, pushed apart when two series finish close together.
  const ends = chart.series
    .map((s, i) => ({ label: s.label, color: seriesColor(i), y: py(s.y[count - 1] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  ends.forEach((end, i) => {
    const previous = ends[i - 1];
    if (previous && end.y - previous.y < 14) end.y = previous.y + 14;
  });

  const active = hover.index;
  return (
    <figure className="chart">
      <figcaption id={titleId}>{chart.title}</figcaption>
      {chart.series.length >= 2 && (
        <ul className="legend">
          {chart.series.map((s, i) => (
            <li key={s.label}>
              <i style={{ background: seriesColor(i) }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div className="chart-plot" ref={ref}>
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-labelledby={titleId}
          onPointerMove={hover.onPointerMove}
          onPointerLeave={hover.onPointerLeave}
        >
          <Axes
            yMax={yMax}
            ticks={ticks}
            xLabel={chart.x_label}
            yLabel={chart.y_label}
            plotRight={plotRight}
          />
          {active !== null && (
            <line
              x1={px(active)}
              x2={px(active)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
              className="chart-crosshair"
            />
          )}
          {chart.series.map((s, i) => (
            <g key={s.label}>
              <path
                d={s.y
                  .map((v, j) => `${j ? "L" : "M"}${px(j).toFixed(1)} ${py(v).toFixed(1)}`)
                  .join(" ")}
                fill="none"
                stroke={seriesColor(i)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {showMarkers &&
                s.y.map((v, j) => (
                  <circle
                    key={j}
                    cx={px(j)}
                    cy={py(v)}
                    r={4}
                    fill={seriesColor(i)}
                    className="chart-marker"
                  />
                ))}
              {active !== null && !showMarkers && (
                <circle
                  cx={px(active)}
                  cy={py(s.y[active] ?? 0)}
                  r={4}
                  fill={seriesColor(i)}
                  className="chart-marker"
                />
              )}
            </g>
          ))}
          {labelSpace > 0 &&
            ends.map((end) => (
              <text key={end.label} x={plotRight + 8} y={end.y + 4} className="chart-direct-label">
                {end.label}
              </text>
            ))}
        </svg>
        {active !== null && (
          <Tooltip
            share={px(active) / width}
            heading={`${chart.x_label}: ${first.x[active]}`}
            rows={chart.series.map((s, i) => ({
              label: s.label,
              value: formatValue(s.y[active] ?? 0),
              color: seriesColor(i),
            }))}
          />
        )}
      </div>
      <DataTable chart={chart} />
    </figure>
  );
}

/** A 256-level intensity histogram. Bins are too narrow for separate bars, so it is one filled shape. */
export function Histogram({ chart }: { chart: ChartData }) {
  const titleId = useId();
  const series = chart.series[0];
  const { ref, width } = useWidth();
  const plotRight = width - MARGIN.right;
  const count = series?.y.length ?? 0;
  const hover = useHover(count, width, MARGIN.left, plotRight);
  if (!series || count === 0) return null;

  const yMax = niceMax(Math.max(...series.y));
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const px = (i: number) => MARGIN.left + (i / (count - 1)) * (plotRight - MARGIN.left);
  const py = (v: number) => MARGIN.top + plotHeight - (v / yMax) * plotHeight;
  const ticks = [0, 51, 102, 153, 204, 255]
    .filter((i) => i < count)
    .map((i) => ({ x: px(i), label: String(i) }));
  const baseline = py(0);
  const shape = series.y.map((v, i) => `L${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
  const active = hover.index;

  return (
    <figure className="chart">
      <figcaption id={titleId}>{chart.title}</figcaption>
      <div className="chart-plot" ref={ref}>
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-labelledby={titleId}
          onPointerMove={hover.onPointerMove}
          onPointerLeave={hover.onPointerLeave}
        >
          <Axes
            yMax={yMax}
            ticks={ticks}
            xLabel={chart.x_label}
            yLabel={chart.y_label}
            plotRight={plotRight}
          />
          <path
            d={`M${px(0)} ${baseline} ${shape} L${px(count - 1)} ${baseline} Z`}
            fill={seriesColor(0)}
          />
          {active !== null && (
            <line
              x1={px(active)}
              x2={px(active)}
              y1={MARGIN.top}
              y2={baseline}
              className="chart-crosshair"
            />
          )}
        </svg>
        {active !== null && (
          <Tooltip
            share={px(active) / width}
            heading={`${chart.x_label}: ${series.x[active]}`}
            rows={[
              {
                label: chart.y_label,
                value: formatValue(series.y[active] ?? 0),
                color: seriesColor(0),
              },
            ]}
          />
        )}
      </div>
    </figure>
  );
}

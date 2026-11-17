interface Props {
  label: string;
  value: number;
  min?: number;
  max: number;
  format?: (value: number) => string;
}

const RADIUS = 78;
const CENTER = { x: 100, y: 96 };
const TICKS = 10;

function pointAt(share: number, radius = RADIUS) {
  const angle = Math.PI * (1 - share);
  return { x: CENTER.x + radius * Math.cos(angle), y: CENTER.y - radius * Math.sin(angle) };
}

function arc(from: number, to: number) {
  const a = pointAt(from);
  const b = pointAt(to);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}A${RADIUS} ${RADIUS} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** A dial for one measured value, with a scale. The number below is always the exact reading. */
export function Gauge({ label, value, min = 0, max, format = String }: Props) {
  const share = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const needle = pointAt(share, RADIUS - 16);
  return (
    <figure className="gauge">
      <figcaption>{label}</figcaption>
      <svg viewBox="0 0 200 112" role="img" aria-label={`${label}: ${format(value)}`}>
        <path className="gauge-track" d={arc(0, 1)} />
        {share > 0 && <path className="gauge-fill" d={arc(0, share)} />}
        {Array.from({ length: TICKS + 1 }, (_, i) => {
          const outer = pointAt(i / TICKS, RADIUS + 9);
          const inner = pointAt(i / TICKS, RADIUS + (i % 5 === 0 ? 2 : 5));
          return (
            <line
              key={i}
              className="gauge-tick"
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
            />
          );
        })}
        <line className="gauge-needle" x1={CENTER.x} y1={CENTER.y} x2={needle.x} y2={needle.y} />
        <circle className="gauge-hub" cx={CENTER.x} cy={CENTER.y} r="4" />
      </svg>
      <p className="gauge-value">{format(value)}</p>
      <p className="gauge-scale">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </p>
    </figure>
  );
}

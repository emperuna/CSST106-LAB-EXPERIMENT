/** A scan line sweeping a small viewfinder while a lab runs. */
export function Loader({ label }: { label: string }) {
  return (
    <div className="loader" role="status">
      <span className="loader-scope" aria-hidden="true">
        <i />
      </span>
      <span>{label}…</span>
    </div>
  );
}

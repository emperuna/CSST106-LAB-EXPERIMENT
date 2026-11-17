import type { ReactNode } from "react";

export type StatusTone = "neutral" | "success" | "danger";

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return (
    <span role="status" className={`badge badge-${tone}`}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

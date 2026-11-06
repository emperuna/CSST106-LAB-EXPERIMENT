import type { ReactNode } from "react";

export type StatusTone = "neutral" | "success" | "danger";

const toneColor: Record<StatusTone, string> = {
  neutral: "var(--color-muted)",
  success: "var(--color-success)",
  danger: "var(--color-danger)",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      role="status"
      style={{
        display: "inline-block",
        padding: "var(--space-1) var(--space-3)",
        border: `1px solid ${toneColor[tone]}`,
        borderRadius: "var(--radius)",
        color: toneColor[tone],
        fontSize: "var(--text-sm)",
      }}
    >
      {children}
    </span>
  );
}

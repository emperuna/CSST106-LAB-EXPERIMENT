import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p className="error" role="alert">
      <CircleAlert aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

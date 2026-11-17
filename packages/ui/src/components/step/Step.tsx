import type { ReactNode } from "react";

interface Props {
  /** The lab sheet's procedure step these controls feed. Leave out for inputs outside the steps. */
  number?: number;
  title: string;
  /** The call this step runs, as it appears in the lab's code. */
  code?: string;
  children: ReactNode;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** A group of controls for one procedure step, numbered like the lab sheet. */
export function Step({ number, title, code, children }: Props) {
  return (
    <fieldset className="step">
      <legend className="step-head">
        {number !== undefined && <span className="step-number">{pad(number)}</span>}
        <span className="step-title">{title}</span>
      </legend>
      {code && <code className="step-code">{code}</code>}
      <div className="step-fields">{children}</div>
    </fieldset>
  );
}

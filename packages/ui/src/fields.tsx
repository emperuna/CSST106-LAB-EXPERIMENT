import { useId, type ReactNode } from "react";

function Label({
  id,
  label,
  value,
  hint,
}: {
  id: string;
  label: string;
  value?: ReactNode;
  hint?: string;
}) {
  return (
    <>
      <label className="field-label" htmlFor={id}>
        <span>{label}</span>
        {value !== undefined && <output htmlFor={id}>{value}</output>}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
    </>
  );
}

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  hint?: string;
  disabled?: boolean;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  hint,
  disabled,
  format,
  onChange,
}: RangeProps) {
  const id = useId();
  return (
    <div className="field">
      <Label id={id} label={label} value={format ? format(value) : value} hint={hint} />
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

interface NumberProps {
  label: string;
  value: number | undefined;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  placeholder?: string;
  onChange: (value: number | undefined) => void;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step,
  hint,
  placeholder,
  onChange,
}: NumberProps) {
  const id = useId();
  return (
    <div className="field">
      <Label id={id} label={label} hint={hint} />
      <input
        id={id}
        type="number"
        className="input"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : Number(event.target.value))
        }
      />
    </div>
  );
}

interface SelectProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  hint?: string;
  onChange: (value: T) => void;
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  hint,
  onChange,
}: SelectProps<T>) {
  const id = useId();
  return (
    <div className="field">
      <Label id={id} label={label} hint={hint} />
      <select
        id={id}
        className="input"
        value={String(value)}
        onChange={(event) => {
          const match = options.find((option) => String(option.value) === event.target.value);
          if (match) onChange(match.value);
        }}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckField(props: {
  label: string;
  checked: boolean;
  hint?: string;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <label className="field-check" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={props.checked}
          onChange={(event) => props.onChange(event.target.checked)}
        />
        <span>{props.label}</span>
      </label>
      {props.hint && <p className="field-hint">{props.hint}</p>}
    </div>
  );
}

export function ColorField(props: {
  label: string;
  value: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <Label id={id} label={props.label} value={props.value} hint={props.hint} />
      <input
        id={id}
        type="color"
        className="input-color"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

interface FileProps {
  label: string;
  accept: string;
  file: File | null;
  hint?: string;
  onChange: (file: File | null) => void;
}

export function FileField({ label, accept, file, hint, onChange }: FileProps) {
  const id = useId();
  return (
    <div className="field">
      <Label id={id} label={label} hint={hint} />
      <input
        id={id}
        type="file"
        className="input-file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {file && (
        <button type="button" className="link-button" onClick={() => onChange(null)}>
          Remove {file.name}
        </button>
      )}
    </div>
  );
}

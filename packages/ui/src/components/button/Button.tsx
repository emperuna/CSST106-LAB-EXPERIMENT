import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "medium" | "small";
}

export function Button({ variant = "primary", size = "medium", className, type, ...rest }: Props) {
  const classes = [
    "button",
    variant === "secondary" && "button-secondary",
    size === "small" && "button-small",
    className,
  ];
  return <button type={type ?? "button"} className={classes.filter(Boolean).join(" ")} {...rest} />;
}

// components/ui/Button.tsx
import * as React from "react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" };
export function Button({ className = "", variant = "primary", ...rest }: Props) {
  const base = "btn " + (variant === "primary" ? "btn-primary" : "btn-outline");
  return <button className={`${base} ${className}`} {...rest} />;
}

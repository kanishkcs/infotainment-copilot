// components/ui/Card.tsx
import * as React from "react";
export function Card({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`card-header ${className}`}>{children}</div>;
}
export function CardTitle({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <h3 className={`card-title ${className}`}>{children}</h3>;
}
export function CardContent({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`card-content ${className}`}>{children}</div>;
}

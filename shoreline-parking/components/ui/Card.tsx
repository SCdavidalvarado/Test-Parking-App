import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl2 bg-surface border border-line shadow-soft",
        className
      )}
      {...props}
    />
  );
}

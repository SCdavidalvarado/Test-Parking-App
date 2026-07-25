import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-charcoal text-cream hover:bg-charcoal/90",
        variant === "secondary" &&
          "bg-surface-muted text-charcoal border border-line hover:bg-line/50",
        variant === "ghost" && "text-charcoal-muted hover:text-charcoal",
        className
      )}
      {...props}
    />
  );
}

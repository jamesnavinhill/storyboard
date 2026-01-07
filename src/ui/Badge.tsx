import React from "react";

export type BadgeVariant = "soft" | "solid" | "outline";

export interface BadgeProps {
  children: React.ReactNode;
  color?: "primary" | "neutral" | "danger" | "success" | "warning";
  variant?: BadgeVariant;
  className?: string;
  onClose?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = "primary",
  variant = "soft",
  className,
  onClose,
}) => {
  const colorBase =
    color === "primary"
      ? "primary"
      : color === "danger"
        ? "destructive"
        : color === "success"
          ? "emerald"
          : color === "warning"
            ? "amber"
            : "muted";

  const base =
    variant === "solid"
      ? `bg-${colorBase} text-background`
      : variant === "outline"
        ? `border border-${colorBase} text-${colorBase}`
        : `badge badge-soft-${color === "primary" ? "primary" : "neutral"}`;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-sm ${base} ${className ?? ""
        }`.trim()}
    >
      {children}
      {onClose && (
        <button
          type="button"
          className="opacity-70 hover:opacity-100"
          onClick={onClose}
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
};

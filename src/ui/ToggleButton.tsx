import React from "react";

export interface ToggleButtonProps<T extends string = string> {
  options: Array<{
    value: T;
    label?: string;
    icon?: React.ReactNode;
    aria?: string;
  }>;
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function ToggleButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: ToggleButtonProps<T>) {
  const sz = size === "sm" ? "p-1.5 text-xs" : "p-2 text-sm";
  return (
    <div className={`inline-flex items-center gap-1 ${className ?? ""}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`btn-base ${sz} ${
            value === opt.value ? "btn-soft-primary" : "btn-ghost"
          }`}
          aria-label={opt.aria ?? opt.label}
          onClick={() => onChange(opt.value)}
          title={opt.label}
        >
          {opt.icon ?? opt.label}
        </button>
      ))}
    </div>
  );
}

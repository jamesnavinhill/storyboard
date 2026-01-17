import React from "react";

interface GroupBadgeProps {
  label: string;
  color?: string | null;
  onClick?: () => void;
  onRemove?: () => void;
  title?: string;
}

const COLOR_CLASS_MAP: Record<string, string> = {
  "#f97316": "bg-orange-500/30 text-orange-100",
  "#ec4899": "bg-pink-500/30 text-pink-100",
  "#6366f1": "bg-indigo-500/30 text-indigo-100",
  "#22c55e": "bg-emerald-500/30 text-emerald-100",
  "#14b8a6": "bg-teal-500/30 text-teal-100",
  "#0ea5e9": "bg-sky-500/30 text-sky-100",
  "#facc15": "bg-amber-500/30 text-amber-900",
  "#ef4444": "bg-red-500/30 text-red-100",
};

const normalizeColorKey = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (/^#?[0-9a-f]{3,8}$/i.test(trimmed)) {
    return trimmed.startsWith("#")
      ? trimmed.toLowerCase()
      : `#${trimmed.toLowerCase()}`;
  }
  return null;
};

export const GroupBadge: React.FC<GroupBadgeProps> = ({
  label,
  color,
  onClick,
  onRemove,
  title,
}) => {
  const normalizedColor = normalizeColorKey(color);
  const paletteClass = normalizedColor
    ? COLOR_CLASS_MAP[normalizedColor]
    : undefined;
  const baseClass =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm bg-white/15 text-white";
  const cursorClass = onClick ? "cursor-pointer" : "";

  return (
    <span
      className={`group-badge ${baseClass} ${
        paletteClass ?? ""
      } ${cursorClass}`.trim()}
      onClick={onClick}
      title={title}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/30 text-[10px] text-white/80 hover:bg-black/40"
          aria-label={`Remove group ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

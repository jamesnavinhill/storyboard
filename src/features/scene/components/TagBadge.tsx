import React from "react";

interface TagBadgeProps {
  label: string;
  color?: string | null;
  onRemove?: () => void;
}

const COLOR_CLASS_MAP: Record<string, string> = {
  "#f97316": "bg-orange-500/20 text-orange-100",
  "#ec4899": "bg-pink-500/20 text-pink-100",
  "#6366f1": "bg-indigo-500/20 text-indigo-100",
  "#22c55e": "bg-emerald-500/20 text-emerald-100",
  "#14b8a6": "bg-teal-500/20 text-teal-100",
  "#0ea5e9": "bg-sky-500/20 text-sky-100",
  "#facc15": "bg-amber-500/20 text-amber-900",
  "#ef4444": "bg-red-500/20 text-red-100",
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

export const TagBadge: React.FC<TagBadgeProps> = ({
  label,
  color,
  onRemove,
}) => {
  const normalizedColor = normalizeColorKey(color);
  const paletteClass = normalizedColor
    ? COLOR_CLASS_MAP[normalizedColor]
    : undefined;

  return (
    <span
      className={`tag-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-white/10 text-white ${
        paletteClass ?? ""
      }`.trim()}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/30 text-[9px] text-white/80 hover:bg-black/40"
          aria-label={`Remove tag ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

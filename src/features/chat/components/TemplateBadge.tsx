import React from "react";
import { X } from "lucide-react";

interface TemplateBadgeProps {
  templateName: string;
  onRemove: () => void;
}

export const TemplateBadge: React.FC<TemplateBadgeProps> = ({
  templateName,
  onRemove,
}) => {
  return (
    <div
      className="inline-flex items-center gap-2 px-2 py-0.5 bg-primary-soft border border-soft-primary rounded-md text-xs text-primary transition-colors"
      role="status"
      aria-label={`Selected template: ${templateName}`}
    >
      <span className="whitespace-nowrap">{templateName}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center p-0.5 rounded-full hover:bg-primary-soft transition-colors"
        aria-label="Remove template"
        title="Remove template"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

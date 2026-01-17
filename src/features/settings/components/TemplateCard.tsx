import React from "react";
import { Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/ui/Badge";
import type { StyleTemplate } from "../../../types/gemini-enhancement";

interface TemplateCardProps {
  template: StyleTemplate;
  isActive?: boolean;
  onSelect?: (template: StyleTemplate) => void;
  onEdit?: (template: StyleTemplate) => void;
  onDelete?: (templateId: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isActive = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm("Are you sure you want to delete this template?")) {
      onDelete(template.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(template);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(template);
    }
  };

  return (
    <div
      onClick={handleSelect}
      className={`border rounded-sm p-3 transition-all ${isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-muted hover:bg-accent/50 hover:border-accent"
        } ${onSelect ? "cursor-pointer" : ""}`}
    >
      {/* Thumbnail or Placeholder */}
      {template.thumbnail ? (
        <div className="w-full h-24 mb-3 rounded-sm overflow-hidden bg-muted">
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-24 mb-3 rounded-sm bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <span className="text-xs text-foreground-muted font-semibold">
            {template.name.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate flex items-center gap-1.5">
              {template.name}
              {template.tested && (
                <span title="Tested">
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-success flex-shrink-0"
                    aria-label="Tested"
                  />
                </span>
              )}
            </h4>
          </div>

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-1 hover:bg-accent rounded-sm"
                  title="Edit template"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1 hover:bg-destructive/10 text-destructive rounded-sm"
                  title="Delete template"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-foreground-muted line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Categories */}
        {template.category && template.category.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.category.slice(0, 3).map((cat, idx) => (
              <Badge key={idx} variant="soft" color="neutral">
                {cat}
              </Badge>
            ))}
            {template.category.length > 3 && (
              <Badge variant="soft" color="neutral">
                +{template.category.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Active Indicator */}
        {isActive && (
          <div className="pt-2 border-t border-primary/30">
            <p className="text-xs text-primary font-semibold">
              Active Template
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

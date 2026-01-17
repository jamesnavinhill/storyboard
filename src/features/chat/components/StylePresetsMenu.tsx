import React, { useState, useEffect } from "react";
import { X, Settings } from "lucide-react";
import type { StyleTemplate } from "@/types/gemini-enhancement";

interface StylePresetsMenuProps {
  isOpen: boolean;
  selectedTemplateIds: string[];
  onTemplateSelect: (templateId: string) => void;
  onManageTemplates: () => void;
  onClose: () => void;
}

export const StylePresetsMenu: React.FC<StylePresetsMenuProps> = ({
  isOpen,
  selectedTemplateIds,
  onTemplateSelect,
  onManageTemplates,
  onClose,
}) => {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch("/api/templates");
          if (!response.ok) {
            throw new Error("Failed to fetch templates");
          }
          const data = await response.json();
          setTemplates(data.templates || []);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load templates"
          );
        } finally {
          setIsLoading(false);
        }
      };

      void fetchTemplates();
    }
  }, [isOpen]);

  const handleTemplateClick = (templateId: string) => {
    onTemplateSelect(templateId);
    onClose();
  };

  const handleManageClick = () => {
    onManageTemplates();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-card z-50 flex flex-col">
      {/* Header matching SettingsPanel style */}
      <div className="flex items-center justify-between p-4 border-b border-muted">
        <h2 className="text-lg font-semibold">Style Templates</h2>
        <button
          type="button"
          onClick={onClose}
          className="btn-base btn-ghost p-2"
          aria-label="Close style templates"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Template list - scrollable */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        {isLoading && (
          <div className="p-4 text-sm text-muted text-center">
            Loading templates...
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-500 text-center">{error}</div>
        )}

        {!isLoading && !error && templates.length === 0 && (
          <div className="p-4 text-sm text-muted text-center">
            No templates available
          </div>
        )}

        {!isLoading && !error && templates.length > 0 && (
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateClick(template.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${(selectedTemplateIds || []).includes(template.id)
                  ? "border-primary bg-primary/10"
                  : "border-muted hover:bg-muted/50"
                  }`}
              >
                <div className="font-medium">{template.name}</div>
                {template.description && (
                  <div className="text-sm text-muted mt-1">
                    {template.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Manage and Done buttons */}
      <div className="p-4 border-t border-muted space-y-2">
        <button
          type="button"
          onClick={handleManageClick}
          className="w-full text-center py-1.5 text-xs btn-base btn-outline-destructive rounded flex items-center justify-center gap-2"
        >
          <Settings className="w-3.5 h-3.5" />
          Manage Templates
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center py-1.5 text-xs btn-base btn-outline-destructive rounded"
          aria-label="Close style templates"
        >
          Done
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { useSettingsStore } from "../state";
import type { StyleTemplate } from "../../../types/gemini-enhancement";

interface TemplateLibraryProps {
  activeTemplateId?: string | null;
  onSelect?: (template: StyleTemplate) => void;
  onCreate: () => void;
  onEdit: (template: StyleTemplate) => void;
  onDelete: (templateId: string) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  activeTemplateId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const templates = useSettingsStore((state) => state.templates);
  const isLoading = useSettingsStore((state) => state.isTemplatesLoading);
  const fetchTemplates = useSettingsStore((state) => state.fetchTemplates);
  const deleteTemplate = useSettingsStore((state) => state.deleteTemplate);

  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setError(null);
        await fetchTemplates();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load templates"
        );
      }
    };
    void loadTemplates();
  }, [fetchTemplates]);

  // Filter templates based on category and search
  const filteredTemplates = templates.filter((template) => {
    if (categoryFilter && !template.category.includes(categoryFilter)) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.stylePrompt.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Extract unique categories from templates
  const allCategories = React.useMemo(() => {
    const categorySet = new Set<string>();
    templates.forEach((template) => {
      if (template.category) {
        template.category.forEach((cat) => categorySet.add(cat));
      }
    });
    return Array.from(categorySet).sort();
  }, [templates]);

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      onDelete(templateId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-foreground-muted">Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => void fetchTemplates()}
          className="text-xs btn-outline px-3 py-1 rounded-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Style Templates</h3>
        <button
          onClick={onCreate}
          className="btn-soft-primary text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base text-xs py-1.5"
        />

        {allCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`text-xs px-2 py-1 rounded-sm ${categoryFilter === null ? "btn-soft-primary" : "btn-outline"
                }`}
            >
              All
            </button>
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`text-xs px-2 py-1 rounded-sm ${categoryFilter === category
                    ? "btn-soft-primary"
                    : "btn-outline"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-foreground-muted">No templates found</p>
          <button
            onClick={onCreate}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={template.id === activeTemplateId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { X, Save, TestTube } from "lucide-react";
import type { StyleTemplate } from "../../../types/gemini-enhancement";

interface TemplateEditorProps {
  template?: StyleTemplate | null;
  onSave: (template: StyleTemplate) => void;
  onCancel: () => void;
  onTest?: (template: StyleTemplate) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  onTest,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stylePrompt: "",
    tested: false,
    thumbnail: "",
    categories: [] as string[],
    categoryInput: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || "",
        stylePrompt: template.stylePrompt,
        tested: template.tested,
        thumbnail: template.thumbnail || "",
        categories: template.category || [],
        categoryInput: "",
      });
    }
  }, [template]);

  const handleAddCategory = () => {
    const category = formData.categoryInput.trim();
    if (category && !formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
        categoryInput: "",
      });
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((c) => c !== category),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.stylePrompt.trim()) {
      setError("Style prompt is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        stylePrompt: formData.stylePrompt.trim(),
        tested: formData.tested,
        thumbnail: formData.thumbnail.trim() || undefined,
        category:
          formData.categories.length > 0 ? formData.categories : undefined,
      };

      const url = template ? `/api/templates/${template.id}` : "/api/templates";
      const method = template ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save template");
      }

      const data = await response.json();
      onSave(data.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = () => {
    if (onTest) {
      const testTemplate: StyleTemplate = {
        id: template?.id || "test",
        name: formData.name,
        description: formData.description,
        stylePrompt: formData.stylePrompt,
        tested: formData.tested,
        // Optional fields should be omitted when empty/unused
        ...(formData.thumbnail.trim()
          ? { thumbnail: formData.thumbnail.trim() }
          : {}),
        category: [...formData.categories],
        metadata: {},
      };
      onTest(testTemplate);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-muted rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-sm font-semibold">
            {template ? "Edit Template" : "Create Template"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-accent rounded"
            disabled={saving}
            aria-label="Close template editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4"
        >
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="template-name"
              className="block text-xs font-semibold mb-1"
            >
              Name *
            </label>
            <input
              id="template-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Cinematic Film Look"
              className="input-base text-xs"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="template-description"
              className="block text-xs font-semibold mb-1"
            >
              Description
            </label>
            <textarea
              id="template-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this style..."
              className="input-base text-xs resize-y min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Categories
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formData.categoryInput}
                onChange={(e) =>
                  setFormData({ ...formData, categoryInput: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="Add category..."
                className="input-base flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="text-xs btn-outline px-3 py-2 rounded"
              >
                Add
              </button>
            </div>
            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.categories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-accent border border-muted"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category)}
                      className="hover:text-destructive"
                      aria-label={`Remove ${category}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Style Prompt */}
          <div>
            <label
              htmlFor="template-style-prompt"
              className="block text-xs font-semibold mb-1"
            >
              Style Prompt *
            </label>
            <textarea
              id="template-style-prompt"
              value={formData.stylePrompt}
              onChange={(e) =>
                setFormData({ ...formData, stylePrompt: e.target.value })
              }
              placeholder="Enter the style prompt that will be appended to generation requests..."
              className="input-base text-xs resize-y min-h-[120px] font-mono"
              required
            />
            <p className="text-xs text-foreground-muted mt-1">
              This prompt will be automatically appended to all generation
              requests when this template is active.
            </p>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label
              htmlFor="template-thumbnail"
              className="block text-xs font-semibold mb-1"
            >
              Thumbnail URL
            </label>
            <input
              id="template-thumbnail"
              type="text"
              value={formData.thumbnail}
              onChange={(e) =>
                setFormData({ ...formData, thumbnail: e.target.value })
              }
              placeholder="https://example.com/thumbnail.jpg"
              className="input-base text-xs"
            />
          </div>

          {/* Tested Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="template-tested"
              type="checkbox"
              checked={formData.tested}
              onChange={(e) =>
                setFormData({ ...formData, tested: e.target.checked })
              }
              className="w-4 h-4 rounded border-muted"
            />
            <label htmlFor="template-tested" className="text-xs">
              Mark as tested (indicates this template has been validated)
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-muted">
          <div>
            {onTest && (
              <button
                type="button"
                onClick={handleTest}
                className="text-xs btn-outline px-3 py-2 rounded flex items-center gap-1.5"
                disabled={saving}
              >
                <TestTube className="w-3.5 h-3.5" />
                Test Template
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs btn-outline px-4 py-2 rounded"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="text-xs btn-soft-primary px-4 py-2 rounded flex items-center gap-1.5"
              disabled={saving}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

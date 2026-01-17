import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { SystemInstructionEditor } from "./SystemInstructionEditor";
import type { Workflow } from "../../../types/gemini-enhancement";

interface WorkflowEditorProps {
  workflow?: Workflow | null;
  onSave: (workflow: Workflow) => void;
  onCancel: () => void;
}

type WorkflowCategory =
  | "music-video"
  | "commercial"
  | "social"
  | "explainer"
  | "custom"
  | "concept-art";

const CATEGORY_OPTIONS: Array<{ value: WorkflowCategory; label: string }> = [
  { value: "music-video", label: "Music Video" },
  { value: "commercial", label: "Commercial" },
  { value: "social", label: "Social" },
  { value: "explainer", label: "Explainer" },
  { value: "custom", label: "Custom" },
  { value: "concept-art", label: "Concept Art" },
];

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflow,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "custom" as WorkflowCategory,
    systemInstruction: "",
    artStyle: "",
    thumbnail: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description || "",
        category: workflow.category,
        systemInstruction: workflow.systemInstruction,
        artStyle: workflow.artStyle || "",
        thumbnail: workflow.thumbnail || "",
      });
    }
  }, [workflow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.systemInstruction.trim()) {
      setError("System instruction is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        systemInstruction: formData.systemInstruction.trim(),
        artStyle: formData.artStyle.trim() || undefined,
        thumbnail: formData.thumbnail.trim() || undefined,
      };

      const url = workflow ? `/api/workflows/${workflow.id}` : "/api/workflows";
      const method = workflow ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save workflow");
      }

      const data = await response.json();
      onSave(data.workflow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workflow");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-muted rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-sm font-semibold">
            {workflow ? "Edit Workflow" : "Create Workflow"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-accent rounded"
            disabled={saving}
            aria-label="Close workflow editor"
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
              htmlFor="workflow-name"
              className="block text-xs font-semibold mb-1"
            >
              Name *
            </label>
            <input
              id="workflow-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Cinematic Music Video"
              className="input-base text-xs"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="workflow-description"
              className="block text-xs font-semibold mb-1"
            >
              Description
            </label>
            <textarea
              id="workflow-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this workflow..."
              className="input-base text-xs resize-y min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="workflow-category"
              className="block text-xs font-semibold mb-1"
            >
              Category *
            </label>
            <select
              id="workflow-category"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as WorkflowCategory,
                })
              }
              className="select-base text-xs px-3 py-2"
              required
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Art Style */}
          <div>
            <label
              htmlFor="workflow-art-style"
              className="block text-xs font-semibold mb-1"
            >
              Art Style
            </label>
            <input
              id="workflow-art-style"
              type="text"
              value={formData.artStyle}
              onChange={(e) =>
                setFormData({ ...formData, artStyle: e.target.value })
              }
              placeholder="e.g., Cinematic, Minimalist, Vibrant"
              className="input-base text-xs"
            />
          </div>

          {/* Thumbnail URL */}
          <div>
            <label
              htmlFor="workflow-thumbnail"
              className="block text-xs font-semibold mb-1"
            >
              Thumbnail URL
            </label>
            <input
              id="workflow-thumbnail"
              type="text"
              value={formData.thumbnail}
              onChange={(e) =>
                setFormData({ ...formData, thumbnail: e.target.value })
              }
              placeholder="https://example.com/thumbnail.jpg"
              className="input-base text-xs"
            />
          </div>

          {/* System Instructions */}
          <SystemInstructionEditor
            value={formData.systemInstruction}
            onChange={(value) =>
              setFormData({ ...formData, systemInstruction: value })
            }
          />
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-muted">
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
            {saving ? "Saving..." : "Save Workflow"}
          </button>
        </div>
      </div>
    </div>
  );
};

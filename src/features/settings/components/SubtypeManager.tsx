import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save } from "lucide-react";

export interface WorkflowSubtype {
  id: string;
  workflowId: string;
  name: string;
  description: string | null;
  instructionModifier: string;
  createdAt: string;
  updatedAt: string;
}

interface SubtypeManagerProps {
  workflowId: string;
  workflowName: string;
  onClose?: () => void;
}

export const SubtypeManager: React.FC<SubtypeManagerProps> = ({
  workflowId,
  workflowName,
  onClose,
}) => {
  const [subtypes, setSubtypes] = useState<WorkflowSubtype[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSubtype, setEditingSubtype] = useState<WorkflowSubtype | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  const fetchSubtypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${workflowId}/subtypes`);
      if (!response.ok) {
        throw new Error("Failed to fetch subtypes");
      }

      const data = await response.json();
      setSubtypes(data.subtypes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subtypes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtypes();
  }, [workflowId]);

  const handleDelete = async (subtypeId: string) => {
    if (!confirm("Are you sure you want to delete this subtype?")) {
      return;
    }

    try {
      const response = await fetch(`/api/subtypes/${subtypeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete subtype");
      }

      fetchSubtypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete subtype");
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingSubtype(null);
  };

  const handleEdit = (subtype: WorkflowSubtype) => {
    setEditingSubtype(subtype);
    setIsCreating(false);
  };

  const handleSave = () => {
    setEditingSubtype(null);
    setIsCreating(false);
    fetchSubtypes();
  };

  const handleCancel = () => {
    setEditingSubtype(null);
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-foreground-muted">Loading subtypes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={fetchSubtypes}
          className="text-xs btn-outline px-3 py-1 rounded"
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
        <div>
          <h3 className="text-sm font-semibold">Workflow Subtypes</h3>
          <p className="text-xs text-foreground-muted">{workflowName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            className="btn-soft-primary text-xs px-3 py-1.5 rounded flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Subtype
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-accent rounded"
              aria-label="Close subtype manager"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      {(isCreating || editingSubtype) && (
        <SubtypeEditor
          workflowId={workflowId}
          subtype={editingSubtype}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Subtype List */}
      {subtypes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-foreground-muted">No subtypes defined</p>
          <button
            onClick={handleCreate}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Add your first subtype
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {subtypes.map((subtype) => (
            <div
              key={subtype.id}
              className="border border-muted rounded-md p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold mb-1">{subtype.name}</h4>
                  {subtype.description && (
                    <p className="text-xs text-foreground-muted mb-2">
                      {subtype.description}
                    </p>
                  )}
                  <div className="text-xs text-foreground-muted bg-accent/30 p-2 rounded font-mono">
                    {subtype.instructionModifier}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(subtype)}
                    className="p-1.5 hover:bg-accent rounded"
                    title="Edit subtype"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(subtype.id)}
                    className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                    title="Delete subtype"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Subtype Editor Component
interface SubtypeEditorProps {
  workflowId: string;
  subtype: WorkflowSubtype | null;
  onSave: () => void;
  onCancel: () => void;
}

const SubtypeEditor: React.FC<SubtypeEditorProps> = ({
  workflowId,
  subtype,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: subtype?.name || "",
    description: subtype?.description || "",
    instructionModifier: subtype?.instructionModifier || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.instructionModifier.trim()) {
      setError("Instruction modifier is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        instructionModifier: formData.instructionModifier.trim(),
      };

      const url = subtype
        ? `/api/subtypes/${subtype.id}`
        : `/api/workflows/${workflowId}/subtypes`;
      const method = subtype ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save subtype");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subtype");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-primary/30 rounded-md p-4 bg-primary/5">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Dark/Moody"
            className="input-base text-xs"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description..."
            className="input-base text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Instruction Modifier *
          </label>
          <textarea
            value={formData.instructionModifier}
            onChange={(e) =>
              setFormData({ ...formData, instructionModifier: e.target.value })
            }
            placeholder="Additional instructions to append to base system instruction..."
            className="input-base text-xs resize-y min-h-[80px] font-mono"
            required
          />
          <p className="text-xs text-foreground-muted mt-1">
            This text will be appended to the workflow's base system
            instruction.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs btn-outline px-3 py-1.5 rounded"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="text-xs btn-soft-primary px-3 py-1.5 rounded flex items-center gap-1.5"
            disabled={saving}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Subtype"}
          </button>
        </div>
      </form>
    </div>
  );
};

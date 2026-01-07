import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/ui/Badge";
import { useSettingsStore } from "../state";
import type { Workflow } from "../../../types/gemini-enhancement";

interface WorkflowManagerProps {
  onEdit: (workflow: Workflow) => void;
  onCreate: () => void;
  onDelete: (workflowId: string) => void;
}

const CATEGORY_LABELS: Record<Workflow["category"], string> = {
  "music-video": "Music Video",
  commercial: "Commercial",
  social: "Social",
  explainer: "Explainer",
  custom: "Custom",
  "concept-art": "Concept Art",
};

const CATEGORY_COLORS: Record<
  Workflow["category"],
  "primary" | "success" | "warning" | "danger" | "neutral"
> = {
  "music-video": "primary",
  commercial: "success",
  social: "warning",
  explainer: "neutral",
  custom: "neutral",
  "concept-art": "primary",
};

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  onEdit,
  onCreate,
  onDelete,
}) => {
  const workflows = useSettingsStore((state) => state.workflows);
  const isLoading = useSettingsStore((state) => state.isWorkflowsLoading);
  const fetchWorkflows = useSettingsStore((state) => state.fetchWorkflows);
  const deleteWorkflow = useSettingsStore((state) => state.deleteWorkflow);

  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setError(null);
        await fetchWorkflows();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load workflows"
        );
      }
    };
    void loadWorkflows();
  }, [fetchWorkflows]);

  const handleDelete = async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) {
      return;
    }

    try {
      await deleteWorkflow(workflowId);
      onDelete(workflowId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete workflow");
    }
  };

  // Filter workflows based on category and search
  const filteredWorkflows = workflows.filter((workflow) => {
    if (categoryFilter && workflow.category !== categoryFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        workflow.name.toLowerCase().includes(query) ||
        workflow.description?.toLowerCase().includes(query) ||
        workflow.artStyle?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-foreground-muted">Loading workflows...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => void fetchWorkflows()}
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
        <h3 className="text-sm font-semibold">
          Workflows & System Instructions
        </h3>
        <button
          onClick={onCreate}
          className="btn-soft-primary text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base text-xs py-1.5"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`text-xs px-2 py-1 rounded-sm ${categoryFilter === null ? "btn-soft-primary" : "btn-outline"
              }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCategoryFilter(value)}
              className={`text-xs px-2 py-1 rounded-sm ${categoryFilter === value ? "btn-soft-primary" : "btn-outline"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow List */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-foreground-muted">No workflows found</p>
          <button
            onClick={onCreate}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Create your first workflow
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className="border border-muted rounded-sm p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold truncate">
                      {workflow.name}
                    </h4>
                    <Badge
                      color={CATEGORY_COLORS[workflow.category]}
                      variant="soft"
                    >
                      {CATEGORY_LABELS[workflow.category]}
                    </Badge>
                  </div>
                  {workflow.description && (
                    <p className="text-xs text-foreground-muted line-clamp-2">
                      {workflow.description}
                    </p>
                  )}
                  {workflow.artStyle && (
                    <p className="text-xs text-foreground-muted mt-1">
                      Style: {workflow.artStyle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(workflow)}
                    className="p-1.5 hover:bg-accent rounded-sm"
                    title="Edit workflow"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    className="p-1.5 hover:bg-destructive/10 text-destructive rounded-sm"
                    title="Delete workflow"
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

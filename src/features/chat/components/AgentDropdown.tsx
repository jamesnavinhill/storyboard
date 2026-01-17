import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Settings } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  category:
    | "music-video"
    | "commercial"
    | "social"
    | "explainer"
    | "custom"
    | "concept-art";
  systemInstruction: string;
}

interface WorkflowSubtype {
  id: string;
  workflowId: string;
  name: string;
  description: string | null;
  instructionModifier: string;
}

interface WorkflowWithSubtypes extends Workflow {
  subtypes: WorkflowSubtype[];
}

interface AgentDropdownProps {
  selectedWorkflowId: string | null;
  selectedSubtypeId: string | null;
  onWorkflowSelect: (workflowId: string, subtypeId: string | null) => void;
  onManageWorkflows: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  "music-video": "Music Video",
  commercial: "Product Commercial",
  social: "Viral Social",
  explainer: "Explainer Video",
  custom: "Custom",
  "concept-art": "Concept Art",
};

export const AgentDropdown: React.FC<AgentDropdownProps> = ({
  selectedWorkflowId,
  selectedSubtypeId,
  onWorkflowSelect,
  onManageWorkflows,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowWithSubtypes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["music-video"]) // Initialize with first category expanded
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch workflows on mount
  useEffect(() => {
    const fetchWorkflows = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/workflows");
        if (!response.ok) {
          throw new Error("Failed to fetch workflows");
        }
        const data = await response.json();

        // Fetch subtypes for each workflow
        const workflowsWithSubtypes = await Promise.all(
          data.workflows.map(async (workflow: Workflow) => {
            try {
              const subtypesResponse = await fetch(
                `/api/workflows/${workflow.id}/subtypes`
              );
              if (subtypesResponse.ok) {
                const subtypesData = await subtypesResponse.json();
                return { ...workflow, subtypes: subtypesData.subtypes || [] };
              }
              return { ...workflow, subtypes: [] };
            } catch {
              return { ...workflow, subtypes: [] };
            }
          })
        );

        setWorkflows(workflowsWithSubtypes);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load workflows"
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchWorkflows();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId);
  const selectedSubtype = selectedWorkflow?.subtypes.find(
    (s) => s.id === selectedSubtypeId
  );

  const displayText = selectedSubtype
    ? `${selectedWorkflow?.name} - ${selectedSubtype.name}`
    : selectedWorkflow?.name || "Select Workflow";

  // Group workflows by category
  const workflowsByCategory = workflows.reduce((acc, workflow) => {
    if (!acc[workflow.category]) {
      acc[workflow.category] = [];
    }
    acc[workflow.category].push(workflow);
    return acc;
  }, {} as Record<string, WorkflowWithSubtypes[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleWorkflowClick = (workflowId: string) => {
    onWorkflowSelect(workflowId, null);
    setIsOpen(false);
  };

  const handleSubtypeClick = (workflowId: string, subtypeId: string) => {
    onWorkflowSelect(workflowId, subtypeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-base btn-ghost px-3 py-1.5 rounded-md gap-1.5 text-xs font-medium hover-primary transition-colors flex items-center"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="max-w-[150px] truncate">{displayText}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-muted rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto hide-scrollbar">
          {isLoading && (
            <div className="p-4 text-sm text-muted text-center">
              Loading workflows...
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-500 text-center">{error}</div>
          )}

          {!isLoading && !error && workflows.length === 0 && (
            <div className="p-4 text-sm text-muted text-center">
              No workflows available
            </div>
          )}

          {!isLoading && !error && workflows.length > 0 && (
            <>
              {Object.entries(workflowsByCategory).map(
                ([category, categoryWorkflows]) => {
                  const isExpanded = expandedCategories.has(category);
                  return (
                    <div
                      key={category}
                      className="border-b border-muted last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full px-3 py-2 text-xs font-semibold text-muted uppercase hover:bg-muted/30 transition-colors flex items-center gap-2"
                      >
                        <span className="text-sm">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                        {CATEGORY_LABELS[category] || category}
                      </button>
                      {isExpanded &&
                        categoryWorkflows.map((workflow) => (
                          <div key={workflow.id}>
                            <button
                              type="button"
                              onClick={() => handleWorkflowClick(workflow.id)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors ${
                                selectedWorkflowId === workflow.id &&
                                !selectedSubtypeId
                                  ? "bg-primary/10 text-primary"
                                  : ""
                              }`}
                            >
                              <div className="font-medium">{workflow.name}</div>
                              {workflow.description && (
                                <div className="text-xs text-muted mt-0.5">
                                  {workflow.description}
                                </div>
                              )}
                            </button>

                            {workflow.subtypes.length > 0 && (
                              <div className="pl-4 border-l-2 border-muted/30 ml-4">
                                {workflow.subtypes.map((subtype) => (
                                  <button
                                    key={subtype.id}
                                    type="button"
                                    onClick={() =>
                                      handleSubtypeClick(
                                        workflow.id,
                                        subtype.id
                                      )
                                    }
                                    className={`w-full text-left px-4 py-1.5 text-xs hover:bg-muted/50 transition-colors ${
                                      selectedSubtypeId === subtype.id
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted"
                                    }`}
                                  >
                                    {subtype.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  );
                }
              )}

              <button
                type="button"
                onClick={() => {
                  onManageWorkflows();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-primary hover:bg-muted/50 transition-colors border-t border-muted flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Manage Workflows
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

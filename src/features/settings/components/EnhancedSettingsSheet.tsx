import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";
import { WorkflowManager } from "./WorkflowManager";
import { WorkflowEditor } from "./WorkflowEditor";
import { SubtypeManager } from "./SubtypeManager";
import { TemplateLibrary } from "./TemplateLibrary";
import { TemplateEditor } from "./TemplateEditor";
import type {
  Workflow,
  StyleTemplate,
} from "../../../types/gemini-enhancement";
import { useSettingsStore } from "../state";

interface EnhancedSettingsSheetProps {
  isOpen: boolean;
  activeTab: "workflow" | "templates" | "models" | "app";
  settings: any;
  theme: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  activeTemplateId?: string | null;
  onClose: () => void;
  onTabChange: (tab: "workflow" | "templates" | "models" | "app") => void;
  onSettingsChange: (settings: any) => void;
  onToggleTheme: () => void;
  onAspectRatioChange: (ratio: "16:9" | "9:16" | "1:1") => void;
  onTemplateSelect?: (template: StyleTemplate) => void;
}

export const EnhancedSettingsSheet: React.FC<EnhancedSettingsSheetProps> = ({
  isOpen,
  activeTab,
  settings,
  theme,
  aspectRatio,
  activeTemplateId,
  onClose,
  onTabChange,
  onSettingsChange,
  onToggleTheme,
  onAspectRatioChange,
  onTemplateSelect,
}) => {
  // Workflow management state
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [managingSubtypesFor, setManagingSubtypesFor] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Template management state
  const [editingTemplate, setEditingTemplate] = useState<StyleTemplate | null>(
    null
  );
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // Thinking mode state (from environment or settings)
  const [thinkingModeEnabled, setThinkingModeEnabled] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleWorkflowCreate = () => {
    setIsCreatingWorkflow(true);
    setEditingWorkflow(null);
  };

  const handleWorkflowEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setIsCreatingWorkflow(false);
  };

  const handleWorkflowSave = () => {
    setEditingWorkflow(null);
    setIsCreatingWorkflow(false);
    // Refresh workflows list to show the newly created one
    useSettingsStore.getState().fetchWorkflows(true);
  };

  const handleWorkflowCancel = () => {
    setEditingWorkflow(null);
    setIsCreatingWorkflow(false);
  };

  const handleTemplateCreate = () => {
    setIsCreatingTemplate(true);
    setEditingTemplate(null);
  };

  const handleTemplateEdit = (template: StyleTemplate) => {
    setEditingTemplate(template);
    setIsCreatingTemplate(false);
  };

  const handleTemplateSave = () => {
    setEditingTemplate(null);
    setIsCreatingTemplate(false);
  };

  const handleTemplateCancel = () => {
    setEditingTemplate(null);
    setIsCreatingTemplate(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        {/* Left attached 3/4 sheet */}
        <div className="relative h-full settings-sheet bg-card border-r border-muted shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-muted px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold tracking-wide">
                Settings
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-base btn-ghost p-1.5"
              aria-label="Close settings"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-muted px-3 py-2 flex items-center gap-1">
            {(
              [
                { key: "workflow", label: "Workflows" },
                { key: "templates", label: "Templates" },
                { key: "models", label: "Models" },
                { key: "app", label: "App" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`btn-base px-3 py-1.5 text-sm rounded-t-lg ${activeTab === tab.key ? "btn-soft-primary" : "btn-ghost"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
            {/* Workflows Tab */}
            {activeTab === "workflow" && (
              <div className="space-y-6">
                {/* Workflow & System Instructions Section */}
                {!managingSubtypesFor && (
                  <WorkflowManager
                    onCreate={handleWorkflowCreate}
                    onEdit={(workflow) => {
                      handleWorkflowEdit(workflow);
                    }}
                    onDelete={() => {
                      // Refresh handled by WorkflowManager
                    }}
                  />
                )}

                {/* Subtype Manager (when managing subtypes) */}
                {managingSubtypesFor && (
                  <SubtypeManager
                    workflowId={managingSubtypesFor.id}
                    workflowName={managingSubtypesFor.name}
                    onClose={() => setManagingSubtypesFor(null)}
                  />
                )}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === "templates" && (
              <TemplateLibrary
                activeTemplateId={activeTemplateId}
                onSelect={onTemplateSelect}
                onCreate={handleTemplateCreate}
                onEdit={handleTemplateEdit}
                onDelete={() => {
                  // Refresh handled by TemplateLibrary
                }}
              />
            )}

            {/* Models Tab */}
            {activeTab === "models" && (
              <div className="space-y-6">
                <SettingsPanel
                  key={JSON.stringify(settings)}
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                  onClose={onClose}
                  aspectRatio={aspectRatio}
                  setAspectRatio={onAspectRatioChange}
                  variant="sheet"
                  sections={["chatModel", "imageModel", "videoModel"]}
                />

                {/* Thinking Mode Toggle */}
                <div className="border-t border-muted pt-6">
                  <h3 className="text-sm font-semibold mb-4">
                    Advanced Options
                  </h3>
                  <div className="card p-3 border border-muted rounded-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold mb-1">
                          Thinking Mode
                        </h4>
                        <p className="text-xs text-foreground-muted">
                          Enable thinking mode for complex tasks. Improves
                          quality but increases cost and response time.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thinkingModeEnabled}
                          onChange={(e) =>
                            setThinkingModeEnabled(e.target.checked)
                          }
                          className="sr-only peer"
                          aria-label="Enable thinking mode"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* App Tab */}
            {activeTab === "app" && (
              <div className="space-y-6">
                {/* Theme Setting */}
                <div className="card p-3 border border-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Theme</h3>
                      <p className="text-xs text-foreground-muted">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="btn-base btn-soft-primary px-3 py-1.5 text-sm rounded-md"
                    >
                      Toggle Theme
                    </button>
                  </div>
                </div>

                {/* General Settings */}
                <div className="border-t border-muted pt-6">
                  <h3 className="text-sm font-semibold mb-4">
                    General Settings
                  </h3>
                  <SettingsPanel
                    key={JSON.stringify(settings)}
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                    onClose={onClose}
                    aspectRatio={aspectRatio}
                    setAspectRatio={onAspectRatioChange}
                    variant="sheet"
                    sections={["scenes", "workflow", "autoplay"]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop to close */}
        <button
          type="button"
          className="flex-1 bg-black/40"
          aria-label="Close settings"
          onClick={onClose}
        />
      </div>

      {/* Workflow Editor Modal */}
      {(isCreatingWorkflow || editingWorkflow) && (
        <WorkflowEditor
          workflow={editingWorkflow}
          onSave={handleWorkflowSave}
          onCancel={handleWorkflowCancel}
        />
      )}

      {/* Template Editor Modal */}
      {(isCreatingTemplate || editingTemplate) && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleTemplateSave}
          onCancel={handleTemplateCancel}
        />
      )}
    </>
  );
};

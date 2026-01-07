import React, { useEffect, useRef, useState } from "react";
import type {
  ChatAgent,
  ChatMessage,
  PresetStyle,
  Scene,
  Settings,
} from "@/types";
import type { StyleTemplate } from "@/types/gemini-enhancement";
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  MessageCircle,
  File,
  Mic,
  Settings as SettingsIcon,
} from "lucide-react";
import { Loader } from "@/components/Loader";
import { StylePresetPicker } from "@/features/storyboard/components/StylePresetPicker";
import {
  useImageAttachment,
  type ImageAttachment,
} from "@/hooks/useImageAttachment";
import { useToast } from "@/components/toast/useToast";
import { SettingsPanel } from "@/features/settings/components/SettingsPanel";
import { AgentDropdown } from "./AgentDropdown";
import { StylePresetsMenu } from "./StylePresetsMenu";
import { ChatModeDropdown, type ChatMode } from "./ChatModeDropdown";
import { UploadDropzone } from "./UploadDropzone";
import { FileThumb } from "./FileThumb";
import { FilePurposeSelector, type FilePurpose } from "./FilePurposeSelector";
import { TemplateBadge } from "./TemplateBadge";

// --- ICONS (In-component to avoid new files) ---
const PaintBrushIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M19.46,3.82a2.2,2.2,0,0,0-3.11,0L3.5,16.67,2.22,21.2a1,1,0,0,0,.3.9,1,1,0,0,0,.9.3L7.87,21.12,20.72,8.27a2.2,2.2,0,0,0,0-3.11Z" />
  </svg>
);

// Chat mode configuration
interface ChatModeConfig {
  mode: ChatMode;
  showWorkflowSelector: boolean;
  showFileUpload: boolean;
  enableAgentFeatures: boolean;
  placeholder: string;
}

const CHAT_MODE_CONFIGS: Record<ChatMode, ChatModeConfig> = {
  simple: {
    mode: "simple",
    showWorkflowSelector: false,
    showFileUpload: false,
    enableAgentFeatures: false,
    placeholder: "Chat about your storyboard...",
  },
  concept: {
    mode: "concept",
    showWorkflowSelector: false,
    showFileUpload: false,
    enableAgentFeatures: false,
    placeholder: "Describe your video concept...",
  },
  style: {
    mode: "style",
    showWorkflowSelector: false,
    showFileUpload: false,
    enableAgentFeatures: false,
    placeholder: "Describe the visual style you're exploring...",
  },
  agent: {
    mode: "agent",
    showWorkflowSelector: true,
    showFileUpload: true,
    enableAgentFeatures: true,
    placeholder: "Select a workflow to get started...",
  },
};

// Helper function to determine placeholder text based on mode and selected workflow
const getPlaceholder = (
  chatMode: ChatMode,
  selectedWorkflowId: string | null,
  selectedSubtypeId: string | null,
  workflows: Array<{
    id: string;
    name: string;
    subtypes?: Array<{ id: string; name: string }>;
  }>
): string => {
  const modeConfig = CHAT_MODE_CONFIGS[chatMode];

  // For non-agent modes, use the mode's default placeholder
  if (!modeConfig.enableAgentFeatures) {
    return modeConfig.placeholder;
  }

  // For agent mode, use workflow-specific placeholder
  if (!selectedWorkflowId) {
    return modeConfig.placeholder;
  }

  // Find the selected workflow
  const workflow = workflows.find((w) => w.id === selectedWorkflowId);
  if (!workflow) {
    return "Describe your video concept...";
  }

  // If a subtype is selected, use it in the placeholder
  if (selectedSubtypeId && workflow.subtypes) {
    const subtype = workflow.subtypes.find((s) => s.id === selectedSubtypeId);
    if (subtype) {
      return `Describe your ${subtype.name} concept...`;
    }
  }

  // Use the workflow name in the placeholder
  return `Describe your ${workflow.name} concept...`;
};

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: FilePurpose;
  uri?: string;
  inlineData?: string;
  thumbnail?: string;
}

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  loadingText: string;
  onSendMessage: (
    message: string,
    image?: ImageAttachment
  ) => Promise<void> | void;
  aspectRatio: Scene["aspectRatio"];
  setAspectRatio:
  | React.Dispatch<React.SetStateAction<Scene["aspectRatio"]>>
  | ((ratio: Scene["aspectRatio"]) => void);
  presetStyles: PresetStyle[];
  selectedStyles: PresetStyle[];
  setSelectedStyles:
  | React.Dispatch<React.SetStateAction<PresetStyle[]>>
  | ((styles: PresetStyle[]) => void);
  selectedTemplateIds: string[];
  setSelectedTemplateIds: (templateIds: string[]) => void;
  agent: ChatAgent;
  onAgentChange: (agent: ChatAgent) => void;
  effectiveSettings: Settings;
  onSessionSettingsChange: (next: Partial<Settings>) => void;
  children?: React.ReactNode;
  mobileView: "chat" | "storyboard";
  setMobileView: (view: "chat" | "storyboard") => void;
  projectId?: string | null;
  onOpenGlobalSettings?: (
    tab?: "workflow" | "templates" | "models" | "app"
  ) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatHistory,
  isLoading,
  loadingText,
  onSendMessage,
  aspectRatio,
  setAspectRatio,
  presetStyles,
  selectedStyles,
  setSelectedStyles,
  selectedTemplateIds,
  setSelectedTemplateIds,
  agent,
  onAgentChange,
  effectiveSettings,
  onSessionSettingsChange,
  children,
  mobileView,
  setMobileView,
  projectId,
  onOpenGlobalSettings,
}) => {
  const [input, setInput] = useState("");
  const {
    attachment: imageAttachment,
    handleFiles,
    clearAttachment,
    isReading: isReadingAttachment,
    error: attachmentError,
  } = useImageAttachment({ maxSizeBytes: 5 * 1024 * 1024 });
  const [selectedTemplates, setSelectedTemplates] = useState<StyleTemplate[]>(
    []
  );
  const { show } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSessionSettingsOpen, setIsSessionSettingsOpen] = useState(false);
  const [isStylePresetsOpen, setIsStylePresetsOpen] = useState(false);

  // New state for workflow and chat mode
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [selectedSubtypeId, setSelectedSubtypeId] = useState<string | null>(
    null
  );

  // Initialize chat mode from localStorage or default to "simple"
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    try {
      const stored = localStorage.getItem("chatMode");
      if (
        stored &&
        (stored === "simple" ||
          stored === "concept" ||
          stored === "style" ||
          stored === "agent")
      ) {
        return stored as ChatMode;
      }
    } catch {
      // Ignore localStorage errors
    }
    return "simple";
  });

  // State for workflows (needed for placeholder text)
  const [workflows, setWorkflows] = useState<
    Array<{
      id: string;
      name: string;
      subtypes?: Array<{ id: string; name: string }>;
    }>
  >([]);

  // New state for file uploads
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [filePurposeSelector, setFilePurposeSelector] = useState<{
    fileId: string;
    fileName: string;
    currentPurpose: FilePurpose;
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Fetch templates by IDs
  const fetchTemplatesByIds = async (templateIds: string[]) => {
    if (templateIds.length === 0) {
      setSelectedTemplates([]);
      return;
    }

    try {
      const promises = templateIds.map((id) =>
        fetch(`/api/templates/${id}`).then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch template ${id}`);
          return res.json();
        })
      );

      const results = await Promise.allSettled(promises);
      const templates = results
        .filter(
          (result): result is PromiseFulfilledResult<{ template: StyleTemplate }> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value.template);

      setSelectedTemplates(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      // Keep existing templates if fetch fails completely (should cover partial failure via Promise.allSettled)
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, mobileView]);

  useEffect(adjustTextareaHeight, [input]);

  // Fetch templates when selectedTemplateIds changes
  useEffect(() => {
    void fetchTemplatesByIds(selectedTemplateIds);
  }, [selectedTemplateIds]);

  // Clear template selection on component unmount (session-only persistence)
  useEffect(() => {
    return () => {
      // Cleanup: clear template selection when component unmounts
      setSelectedTemplateIds([]);
    };
  }, [setSelectedTemplateIds]);

  // Fetch workflows for placeholder text
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch("/api/workflows");
        if (!response.ok) {
          return;
        }
        const data = await response.json();

        // Fetch subtypes for each workflow
        const workflowsWithSubtypes = await Promise.all(
          data.workflows.map(async (workflow: { id: string; name: string }) => {
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
      } catch {
        // Silently fail - placeholder will use default text
      }
    };

    void fetchWorkflows();
  }, []);

  useEffect(() => {
    if (attachmentError) {
      show({ description: attachmentError, variant: "error" });
    }
  }, [attachmentError, show]);

  // Persist chat mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("chatMode", chatMode);
    } catch {
      // Ignore localStorage errors
    }
  }, [chatMode]);

  // Auto-switch to chat view when chat mode changes (Task 2.1)
  useEffect(() => {
    if (chatMode !== "simple") {
      setMobileView("chat");
    }
  }, [chatMode, setMobileView]);

  // Auto-switch chat mode based on workflow selection
  useEffect(() => {
    if (selectedWorkflowId) {
      setChatMode("agent");
    }
  }, [selectedWorkflowId]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    await handleFiles(event.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    clearAttachment();
  };

  const handleToggleStyle = (style: PresetStyle) => {
    const newStyles = selectedStyles.some((s) => s.id === style.id)
      ? selectedStyles.filter((s) => s.id !== style.id)
      : [...selectedStyles, style];

    // Handle both Dispatch and simple function types
    (setSelectedStyles as any)(newStyles);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input.trim() && !isLoading && !isReadingAttachment) {
      void onSendMessage(input, imageAttachment ?? undefined);
      setInput("");
      clearAttachment();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  // Workflow selection handler
  const handleWorkflowSelect = (
    workflowId: string,
    subtypeId: string | null
  ) => {
    setSelectedWorkflowId(workflowId);
    setSelectedSubtypeId(subtypeId);
    // TODO: Apply workflow system instructions to chat context
  };

  const handleManageWorkflows = () => {
    // Open global settings sheet with workflow tab (Task 2.3)
    if (onOpenGlobalSettings) {
      onOpenGlobalSettings("workflow");
    } else {
      // Fallback to session settings if global settings handler not provided
      setIsSessionSettingsOpen(true);
    }
  };

  const handleManageTemplates = () => {
    // Open global settings sheet with templates tab
    if (onOpenGlobalSettings) {
      onOpenGlobalSettings("templates");
    } else {
      // Fallback to session settings if global settings handler not provided
      setIsSessionSettingsOpen(true);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    // Toggle behavior: if already selected, remove it. If not, add it.
    if (selectedTemplateIds.includes(templateId)) {
      setSelectedTemplateIds(selectedTemplateIds.filter((id) => id !== templateId));
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, templateId]);
    }
  };

  const handleTemplateRemove = (templateId: string) => {
    setSelectedTemplateIds(selectedTemplateIds.filter((id) => id !== templateId));
  };

  // File upload handlers
  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    show({
      description: `${files.length} file(s) uploaded successfully`,
      variant: "success",
    });
  };

  const handleFileUploadError = (error: string) => {
    show({ description: error, variant: "error" });
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      show({ description: "File deleted", variant: "success" });
    } catch (err) {
      show({ description: "Failed to delete file", variant: "error" });
    }
  };

  const handleFilePurposeClick = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file) {
      setFilePurposeSelector({
        fileId: file.id,
        fileName: file.name,
        currentPurpose: file.purpose,
      });
    }
  };

  const handleFilePurposeSelect = (fileId: string, purpose: FilePurpose) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, purpose } : f))
    );
    setFilePurposeSelector(null);
    show({ description: "File purpose updated", variant: "success" });
  };

  // Get the current mode configuration
  const modeConfig = CHAT_MODE_CONFIGS[chatMode];

  const placeholderText = getPlaceholder(
    chatMode,
    selectedWorkflowId,
    selectedSubtypeId,
    workflows
  );

  const ChatHistoryContent = (
    <>
      {chatHistory.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
            }`}
        >
          <div
            className={`max-w-xs lg:max-w-sm xl:max-w-md text-sm rounded-lg border ${msg.role === "user" ? "bubble-user" : "bubble-assistant"
              }`}
          >
            {msg.image && (
              <img
                src={msg.image}
                alt="User upload"
                className="mb-2 max-h-48 rounded-t-lg"
              />
            )}
            <p className="p-3 whitespace-pre-wrap">{msg.text}</p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="card p-3 inline-flex items-center space-x-2 rounded-lg">
            <Loader />
            <span className="text-sm">{loadingText}</span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      <div className="px-3 py-2">
        {/* Workflow and Chat Mode dropdowns (left-aligned) */}
        <div className="flex items-center gap-2">
          <ChatModeDropdown
            selectedMode={chatMode}
            onModeSelect={setChatMode}
          />
          {modeConfig.showWorkflowSelector && (
            <AgentDropdown
              selectedWorkflowId={selectedWorkflowId}
              selectedSubtypeId={selectedSubtypeId}
              onWorkflowSelect={handleWorkflowSelect}
              onManageWorkflows={handleManageWorkflows}
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        <div className="md:hidden h-full">
          {mobileView === "chat" ? (
            <div className="p-4 space-y-4">{ChatHistoryContent}</div>
          ) : (
            children
          )}
        </div>
        <div className="hidden md:block p-4 space-y-4 h-full">
          {ChatHistoryContent}
        </div>
      </div>

      <div className="md:hidden py-2 flex justify-center items-center gap-3">
        <button
          onClick={() => setMobileView("chat")}
          aria-label="Show chat view"
          className={`w-2 h-2 rounded-full transition-colors ${mobileView === "chat" ? "bg-primary" : "bg-muted hover-primary"
            }`}
        />
        <button
          onClick={() => setMobileView("storyboard")}
          aria-label="Show storyboard view"
          className={`w-2 h-2 rounded-full transition-colors ${mobileView === "storyboard"
            ? "bg-primary"
            : "bg-muted hover-primary"
            }`}
        />
      </div>

      {isSessionSettingsOpen && (
        <SettingsPanel
          settings={effectiveSettings}
          onSettingsChange={(partial) => onSessionSettingsChange(partial)}
          onClose={() => setIsSessionSettingsOpen(false)}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          variant="popover"
          sections={[
            "scenes",
            "workflow",
            "chatModel",
            "imageModel",
            "videoModel",
          ]}
        />
      )}

      {isStylePresetsOpen && (
        <StylePresetsMenu
          isOpen={isStylePresetsOpen}
          selectedTemplateIds={selectedTemplateIds}
          onTemplateSelect={handleTemplateSelect}
          onManageTemplates={handleManageTemplates}
          onClose={() => setIsStylePresetsOpen(false)}
        />
      )}

      <div className="chat-input-container p-2 sm:px-3 sm:py-2.5">
        {/* Attached files area - collapses when empty, scrolls when full */}
        <div className="attached-files-area">
          {/* File thumbnails */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {uploadedFiles.map((file) => (
                <FileThumb
                  key={file.id}
                  file={file}
                  onDelete={handleDeleteFile}
                  onPurposeClick={handleFilePurposeClick}
                  isDraggable={false}
                />
              ))}
            </div>
          )}

          {/* Image attachment preview (simple chat mode) */}
          {(imageAttachment || isReadingAttachment) && (
            <div className="mt-2">
              <div className="relative inline-block">
                {isReadingAttachment ? (
                  <div className="h-24 w-32 rounded-md bg-black/40 flex items-center justify-center border border-muted">
                    <Loader />
                  </div>
                ) : (
                  <>
                    <img
                      src={imageAttachment!.preview}
                      alt="upload preview"
                      className="max-h-24 rounded-md border border-muted"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-zinc-800/80 text-white rounded-full p-1 hover:bg-zinc-700"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload zone - fixed position in layout */}
        <div className="upload-zone-fixed">
          {/* File upload dropzone - shown when mode allows file uploads */}
          {modeConfig.showFileUpload && projectId && (
            <UploadDropzone
              projectId={projectId}
              onFilesUploaded={handleFilesUploaded}
              onError={handleFileUploadError}
            />
          )}
        </div>

        {/* Message input area */}
        <div className="message-input-area">
          {selectedStyles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedStyles.map((style) => (
                <div
                  key={style.id}
                  className="badge badge-soft-primary flex items-center px-2 py-1"
                >
                  <span>{style.name}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleStyle(style)}
                    className="ml-1.5 hover-primary opacity-70"
                    title={`Remove ${style.name}`}
                    aria-label={`Remove ${style.name} style`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Template Badges */}
          {selectedTemplates.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedTemplates.map((template) => (
                <TemplateBadge
                  key={template.id}
                  templateName={template.name}
                  onRemove={() => handleTemplateRemove(template.id)}
                />
              ))}
            </div>
          )}

          {/* Unified composer with internal divider */}
          <div className="composer">
            <form onSubmit={handleSubmit} className="composer-top">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                className="composer-input"
                rows={1}
                disabled={isReadingAttachment}
                aria-label="Chat message input"
              />
            </form>

            <div className="composer-divider" />

            <div className="composer-bottom">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-base btn-ghost p-3"
                  title="Attach image"
                  aria-label="Attach image"
                  disabled={isReadingAttachment}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  title="Select image to attach"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setIsStylePresetsOpen(true)}
                  className="btn-base btn-ghost p-3"
                  title="Style templates"
                  aria-label="Style templates"
                >
                  <PaintBrushIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSessionSettingsOpen((p) => !p)}
                  className="btn-base btn-ghost p-3"
                  title="Session settings"
                  aria-label="Session settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="btn-base btn-ghost p-3 cursor-not-allowed opacity-60"
                  title="Voice input coming soon"
                  aria-disabled="true"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || isReadingAttachment || !input.trim()}
                  className="btn-base btn-ghost p-3"
                  aria-label="Send message"
                  title="Send (Ctrl/Cmd+Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {
        isSessionSettingsOpen && (
          <SettingsPanel
            settings={effectiveSettings}
            onSettingsChange={(partial) => onSessionSettingsChange(partial)}
            onClose={() => setIsSessionSettingsOpen(false)}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            variant="popover"
            sections={[
              "scenes",
              "workflow",
              "chatModel",
              "imageModel",
              "videoModel",
            ]}
          />
        )
      }

      {
        isStylePresetsOpen && (
          <StylePresetsMenu
            isOpen={isStylePresetsOpen}
            selectedTemplateIds={selectedTemplateIds}
            onTemplateSelect={handleTemplateSelect}
            onManageTemplates={handleManageTemplates}
            onClose={() => setIsStylePresetsOpen(false)}
          />
        )
      }

      {/* File Purpose Selector Modal */}
      {
        filePurposeSelector && (
          <FilePurposeSelector
            fileId={filePurposeSelector.fileId}
            fileName={filePurposeSelector.fileName}
            currentPurpose={filePurposeSelector.currentPurpose}
            onSelect={handleFilePurposeSelect}
            onCancel={() => setFilePurposeSelector(null)}
          />
        )
      }
    </div >
  );
};

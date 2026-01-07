import React, { useState } from "react";
import { X, HelpCircle, Info } from "lucide-react";
import type { Scene } from "@/types";
import { ChatInputArea } from "@/components/ChatInputArea";
import { MODEL_INFO } from "@/constants/videoModelCapabilities";

interface ExtendModalProps {
  scene: Scene;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    sceneId: string,
    prompt: string,
    extensionCount: number,
    model: string
  ) => void;
  isBusy: boolean;
  videoAssetMetadata?: Record<string, unknown> | null;
}

export const ExtendModal: React.FC<ExtendModalProps> = ({
  scene,
  isOpen,
  onClose,
  onSubmit,
  isBusy,
  videoAssetMetadata,
}) => {
  const [prompt, setPrompt] = useState("");
  const [extensionCount, setExtensionCount] = useState(1);
  const [selectedModel, setSelectedModel] = useState<string>(
    "veo-3.1-fast-generate-preview"
  );

  if (!isOpen) return null;

  // Calculate current video duration and max extensions
  const currentDuration = scene.duration || 0;
  const maxExtensions = Math.min(20, Math.floor((141 - currentDuration) / 7));
  const finalDuration = currentDuration + extensionCount * 7;

  // Check if video was generated with ANY Veo model (any Veo video can be extended)
  const videoModel =
    typeof videoAssetMetadata?.model === "string"
      ? videoAssetMetadata.model
      : null;
  const isVeoGenerated = videoModel?.startsWith("veo-") ?? false;
  const canExtend = isVeoGenerated && maxExtensions >= 1;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isBusy || !canExtend) return;
    onSubmit(scene.id, prompt.trim(), extensionCount, selectedModel);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content modal-centered">
        <div className="modal-header">
          <h2 className="modal-title">Extend Video</h2>
          <div className="flex items-center gap-2">
            <a
              href="https://ai.google.dev/api/generate-video"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              aria-label="View Veo API documentation"
              title="View Veo API documentation"
            >
              <HelpCircle className="icon-md" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn"
              aria-label="Close"
            >
              <X className="icon-md" />
            </button>
          </div>
        </div>

        <div className="modal-body hide-scrollbar">
          {/* Display current video */}
          {scene.videoUrl && (
            <div className="mb-4">
              <video
                src={scene.videoUrl}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: "300px" }}
              />
            </div>
          )}

          {/* Scene description */}
          <div
            className="mb-4 p-3 rounded-lg"
            style={{
              backgroundColor: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-sm text-muted">{scene.description}</p>
          </div>

          {/* Info about extension capabilities */}
          <div
            className="mb-4 p-3 rounded-lg"
            style={{
              backgroundColor: "var(--primary-soft-bg)",
              border: "1px solid var(--primary-soft-border)",
            }}
          >
            <div className="flex items-start gap-2">
              <Info
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "var(--primary)" }}
              />
              <div className="flex-1">
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--primary-soft-text)" }}
                >
                  Current: {currentDuration}s | Each extension adds 7s | Max:
                  141s total
                </p>
                {videoModel && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--primary-soft-text)" }}
                  >
                    Original model: {MODEL_INFO[videoModel]?.name || videoModel}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Model selector for extension - only 3.1 models can perform extension */}
          <div className="mb-4">
            <label
              htmlFor="extension-model"
              className="text-sm font-medium mb-2 block"
            >
              Extension Model
            </label>
            <select
              id="extension-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={{
                backgroundColor: "var(--input-bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              disabled={!canExtend}
            >
              <option value="veo-3.1-fast-generate-preview">
                Veo 3.1 Fast (Recommended)
              </option>
              <option value="veo-3.1-generate-preview">
                Veo 3.1 (Best Quality)
              </option>
            </select>
            <p className="text-xs text-muted mt-1">
              Only Veo 3.1 models can extend videos. Any Veo-generated video can
              be extended.
            </p>
          </div>

          {/* Extension count selector */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="extension-count"
                className="text-sm font-medium mb-2 block"
              >
                Number of Extensions (1-{maxExtensions})
              </label>
              <input
                id="extension-count"
                type="range"
                min="1"
                max={maxExtensions}
                value={extensionCount}
                onChange={(e) => setExtensionCount(Number(e.target.value))}
                className="w-full accent-primary"
                disabled={maxExtensions < 1}
                aria-label={`Extension count: ${extensionCount}`}
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>1 extension</span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  {extensionCount} extension{extensionCount !== 1 ? "s" : ""}
                </span>
                <span>{maxExtensions} max</span>
              </div>
            </div>

            {/* Final duration display */}
            <div
              className="mb-4 p-3 rounded-lg text-center"
              style={{
                backgroundColor: "var(--muted)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-sm font-medium">
                Final Duration: {finalDuration}s
              </p>
            </div>

            {/* Prompt input */}
            <div className="mb-4">
              <ChatInputArea
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleSubmit}
                placeholder="Describe what happens next..."
                disabled={isBusy || !canExtend}
                maxHeight="150px"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-base btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isBusy || !canExtend}
                className="btn-base btn-primary flex-1"
                title={
                  !canExtend && !isVeoGenerated
                    ? "Only Veo-generated videos can be extended"
                    : !canExtend
                    ? "Maximum video duration reached"
                    : undefined
                }
              >
                {isBusy ? "Extending..." : "Extend Video"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

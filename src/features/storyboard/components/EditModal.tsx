import React, { useState } from "react";
import { X, Sparkles, HelpCircle } from "lucide-react";
import type { Scene } from "@/types";
import { ChatInputArea } from "@/components/ChatInputArea";

interface EditModalProps {
  scene: Scene;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sceneId: string, prompt: string) => void;
  onSuggestPrompt: (sceneId: string) => Promise<string | null>;
  isBusy: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({
  scene,
  isOpen,
  onClose,
  onSubmit,
  onSuggestPrompt,
  isBusy,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);

  if (!isOpen) return null;

  const handleSuggest = async () => {
    setIsSuggesting(true);
    try {
      const suggested = await onSuggestPrompt(scene.id);
      if (suggested) {
        setPrompt(suggested);
      }
    } catch (error) {
      console.error("Failed to suggest prompt", error);
    } finally {
      setIsSuggesting(false);
    }
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
          <h2 className="modal-title">Edit Scene Image</h2>
          <div className="flex items-center gap-2">
            <a
              href="https://ai.google.dev/api/generate-images"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              aria-label="View Imagen API documentation"
              title="View Imagen API documentation"
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
          {/* Display current image */}
          {scene.imageUrl && (
            <div className="mb-4">
              <img
                src={scene.imageUrl}
                alt={scene.description}
                className="w-full rounded-lg"
                style={{ maxHeight: "300px", objectFit: "contain" }}
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

          {/* Prompt input */}
          <div className="mb-4">
            <ChatInputArea
              value={prompt}
              onChange={setPrompt}
              onSubmit={() => {
                if (prompt.trim() && !isBusy) {
                  onSubmit(scene.id, prompt.trim());
                }
              }}
              placeholder="Describe your edits..."
              disabled={isBusy}
              actions={[
                {
                  icon: Sparkles,
                  label: "AI Suggest",
                  onClick: handleSuggest,
                  disabled: isSuggesting,
                },
              ]}
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
              type="button"
              onClick={() => {
                if (prompt.trim() && !isBusy) {
                  onSubmit(scene.id, prompt.trim());
                }
              }}
              disabled={!prompt.trim() || isBusy}
              className="btn-base btn-primary flex-1"
            >
              {isBusy ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

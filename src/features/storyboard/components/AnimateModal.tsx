import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import type { Scene, Settings } from "@/types";
import { ChatInputArea, type AttachedFile } from "@/components/ChatInputArea";
import { InfoTooltip } from "@/components/InfoTooltip";
import {
  MODEL_CAPABILITIES,
  MODEL_INFO,
  getDefaultDuration,
  getDefaultResolution,
} from "@/constants/videoModelCapabilities";

interface AnimateModalProps {
  scene: Scene;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    sceneId: string,
    prompt: string,
    options: {
      model?: string;
      resolution?: "1080p" | "720p";
      duration?: number;
      referenceImages?: File[];
      lastFrame?: File;
    }
  ) => void;
  onSuggestPrompt: (sceneId: string) => Promise<string | null>;
  isBusy: boolean;
  currentSettings: Settings;
}

export const AnimateModal: React.FC<AnimateModalProps> = ({
  scene,
  isOpen,
  onClose,
  onSubmit,
  onSuggestPrompt,
  isBusy,
  currentSettings,
}) => {
  const [prompt, setPrompt] = useState(scene.description);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [lastFrame, setLastFrame] = useState<File | null>(null);

  // New state for model, resolution, and duration
  const [selectedModel, setSelectedModel] = useState<string>(
    currentSettings.videoModel
  );
  const [selectedResolution, setSelectedResolution] = useState<
    "1080p" | "720p"
  >(currentSettings.videoResolution);
  const [selectedDuration, setSelectedDuration] = useState<number>(6);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  // Helper functions for validation
  const getModelCapabilities = () => {
    return MODEL_CAPABILITIES[selectedModel];
  };

  const isResolutionSupported = (resolution: "1080p" | "720p"): boolean => {
    const caps = getModelCapabilities();
    if (!caps) return false;

    if (resolution === "1080p") {
      if (scene.aspectRatio === "9:16") {
        return caps.aspectRatioConstraints["9:16"].maxResolution === "1080p";
      }
      return caps.aspectRatioConstraints["16:9"].maxResolution === "1080p";
    }

    return true; // 720p always supported
  };

  const isDurationSupported = (duration: number): boolean => {
    const caps = getModelCapabilities();
    if (!caps) return false;

    // Video models don't support 1:1 aspect ratio
    if (scene.aspectRatio === "1:1") return false;

    const constraints = caps.aspectRatioConstraints[scene.aspectRatio];
    if (!constraints) return false;

    // If 1080p selected, check duration constraints
    if (selectedResolution === "1080p" && constraints.durationConstraints) {
      const allowedDurations = constraints.durationConstraints["1080p"] || [];
      if (allowedDurations.length > 0 && !allowedDurations.includes(duration)) {
        return false;
      }
    }

    // If reference images or last frame, only 8s is valid
    if ((referenceImages.length > 0 || lastFrame) && duration !== 8) {
      return false;
    }

    return constraints.supportedDurations.includes(duration);
  };

  const validateConfiguration = (): string[] => {
    const errors: string[] = [];
    const caps = getModelCapabilities();

    if (!caps) {
      errors.push("Unknown model selected");
      return errors;
    }

    // Video models don't support 1:1 aspect ratio
    if (scene.aspectRatio === "1:1") {
      errors.push(
        "Video generation is not supported for 1:1 (square) aspect ratio"
      );
      return errors;
    }

    // Check resolution support
    if (selectedResolution === "1080p") {
      const maxRes =
        caps.aspectRatioConstraints[scene.aspectRatio].maxResolution;
      if (maxRes === "720p") {
        errors.push(
          `${
            MODEL_INFO[selectedModel]?.name || selectedModel
          } does not support 1080p for ${
            scene.aspectRatio
          } aspect ratio. Maximum: 720p`
        );
      }

      const constraints =
        caps.aspectRatioConstraints[scene.aspectRatio].durationConstraints;
      if (constraints && constraints["1080p"]) {
        const allowedDurations = constraints["1080p"];
        if (!allowedDurations.includes(selectedDuration)) {
          errors.push(
            `1080p resolution requires ${allowedDurations.join(
              " or "
            )}s duration`
          );
        }
      }
    }

    // Check reference images
    if (referenceImages.length > 0) {
      if (!caps.supportsReferenceImages) {
        errors.push(
          "Reference images are only supported on Veo 3.1 models. Please select Veo 3.1 or Veo 3.1 Fast"
        );
      }
      if (scene.aspectRatio !== "16:9") {
        errors.push(
          `Reference images require 16:9 aspect ratio. Current: ${scene.aspectRatio}`
        );
      }
      if (selectedDuration !== 8) {
        errors.push("Reference images require 8-second duration");
      }
    }

    // Check last frame
    if (lastFrame) {
      if (!caps.supportsLastFrame) {
        errors.push(
          "Last frame interpolation is only supported on Veo 3.1 models. Please select Veo 3.1 or Veo 3.1 Fast"
        );
      }
      if (selectedDuration !== 8) {
        errors.push("Last frame interpolation requires 8-second duration");
      }
    }

    return errors;
  };

  // Auto-adjust duration when 1080p selected
  useEffect(() => {
    if (selectedResolution === "1080p" && selectedDuration !== 8) {
      const caps = getModelCapabilities();
      if (caps && scene.aspectRatio !== "1:1") {
        const constraints =
          caps.aspectRatioConstraints[scene.aspectRatio].durationConstraints;
        if (constraints && constraints["1080p"]) {
          const allowedDurations = constraints["1080p"];
          if (allowedDurations.length > 0 && allowedDurations.includes(8)) {
            setSelectedDuration(8);
          }
        }
      }
    }
  }, [selectedResolution, scene.aspectRatio]);

  // Auto-adjust duration when reference images or last frame added
  useEffect(() => {
    if ((referenceImages.length > 0 || lastFrame) && selectedDuration !== 8) {
      setSelectedDuration(8);
    }
  }, [referenceImages, lastFrame]);

  // Run validation whenever settings change
  useEffect(() => {
    const errors = validateConfiguration();
    setValidationErrors(errors);
  }, [
    selectedModel,
    selectedResolution,
    selectedDuration,
    referenceImages,
    lastFrame,
  ]);

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultRes = getDefaultResolution(selectedModel, scene.aspectRatio);
      if (defaultRes) {
        setSelectedResolution(defaultRes);
      }
      const defaultDur = getDefaultDuration(
        selectedModel,
        defaultRes,
        referenceImages.length > 0,
        !!lastFrame
      );
      setSelectedDuration(defaultDur);
    }
  }, [isOpen, selectedModel]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isBusy || validationErrors.length > 0) return;
    const finalPrompt = prompt.trim() || scene.description;
    onSubmit(scene.id, finalPrompt, {
      model: selectedModel,
      resolution: selectedResolution,
      duration: selectedDuration,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      lastFrame: lastFrame ?? undefined,
    });
  };

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

  const handleFileUpload = (files: File[]) => {
    const caps = getModelCapabilities();
    if (!caps) return;

    // Determine if these are reference images or last frame based on current state
    if (referenceImages.length < 3 && !lastFrame) {
      // Add as reference images
      const remainingSlots = 3 - referenceImages.length;
      const newRefImages = files.slice(0, remainingSlots);
      setReferenceImages([...referenceImages, ...newRefImages]);

      // If there are more files and no last frame, set the next one as last frame
      if (files.length > remainingSlots && !lastFrame) {
        setLastFrame(files[remainingSlots]);
      }
    } else if (!lastFrame && files.length > 0) {
      // Set as last frame
      setLastFrame(files[0]);
    } else if (referenceImages.length < 3) {
      // Add remaining as reference images
      const remainingSlots = 3 - referenceImages.length;
      const newRefImages = files.slice(0, remainingSlots);
      setReferenceImages([...referenceImages, ...newRefImages]);
    }
  };

  const handleFileRemove = (fileId: string) => {
    if (fileId === "last-frame") {
      setLastFrame(null);
    } else if (fileId.startsWith("ref-")) {
      const index = parseInt(fileId.split("-")[1], 10);
      setReferenceImages(referenceImages.filter((_, i) => i !== index));
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);

    // Reset resolution and duration to defaults for new model
    const defaultRes = getDefaultResolution(newModel, scene.aspectRatio);
    if (defaultRes) {
      setSelectedResolution(defaultRes);
    }
    const defaultDur = getDefaultDuration(
      newModel,
      defaultRes,
      referenceImages.length > 0,
      !!lastFrame
    );
    setSelectedDuration(defaultDur);
  };

  const getResolutionTooltip = (): string => {
    const caps = getModelCapabilities();
    if (!caps) return "";

    // Video models don't support 1:1 aspect ratio
    if (scene.aspectRatio === "1:1") {
      return "Video generation is not supported for 1:1 (square) aspect ratio";
    }

    const maxRes = caps.aspectRatioConstraints[scene.aspectRatio].maxResolution;
    if (maxRes === "720p") {
      return `This model supports up to 720p for ${scene.aspectRatio} aspect ratio`;
    }
    return `1080p requires 8-second duration. 720p supports 4s, 6s, or 8s`;
  };

  const getDurationTooltip = (): string => {
    if (selectedResolution === "1080p") {
      return "1080p resolution requires 8-second duration";
    }
    if (referenceImages.length > 0 || lastFrame) {
      return "Reference images and interpolation require 8-second duration";
    }
    return "Choose video length: 4s, 6s, or 8s";
  };

  // Prepare attached files for ChatInputArea
  const attachedFiles: AttachedFile[] = [
    ...referenceImages.map((file, idx) => ({
      id: `ref-${idx}`,
      name: file.name,
      preview: URL.createObjectURL(file),
    })),
    ...(lastFrame
      ? [
          {
            id: "last-frame",
            name: lastFrame.name,
            preview: URL.createObjectURL(lastFrame),
          },
        ]
      : []),
  ];

  const modelSupportsFileUpload =
    getModelCapabilities()?.supportsReferenceImages ||
    getModelCapabilities()?.supportsLastFrame;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content modal-centered">
        <div className="modal-header">
          <h2 className="modal-title">Animate Scene</h2>
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

          <form onSubmit={handleSubmit}>
            {/* Model Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 flex items-center">
                Video Model
                <InfoTooltip content="Different models offer different quality/speed tradeoffs. Veo 3.1 models support reference images and interpolation." />
              </label>
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--background)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
                disabled={isBusy}
                aria-label="Select video model"
              >
                {Object.entries(MODEL_INFO).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.name} - {info.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Resolution Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 flex items-center">
                Resolution
                <InfoTooltip content={getResolutionTooltip()} />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedResolution("720p")}
                  disabled={!isResolutionSupported("720p") || isBusy}
                  className={`btn-base flex-1 ${
                    selectedResolution === "720p"
                      ? "btn-primary"
                      : "btn-outline"
                  }`}
                >
                  720p
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedResolution("1080p")}
                  disabled={!isResolutionSupported("1080p") || isBusy}
                  className={`btn-base flex-1 ${
                    selectedResolution === "1080p"
                      ? "btn-primary"
                      : "btn-outline"
                  }`}
                >
                  1080p
                  {selectedResolution === "1080p" && (
                    <span className="text-xs ml-1">(8s)</span>
                  )}
                </button>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 flex items-center">
                Duration
                <InfoTooltip content={getDurationTooltip()} />
              </label>
              <div className="flex gap-2">
                {[4, 6, 8].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    disabled={!isDurationSupported(dur) || isBusy}
                    className={`btn-base flex-1 ${
                      selectedDuration === dur ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Warnings */}
            {validationErrors.length > 0 && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className="flex-shrink-0 mt-0.5"
                    style={{ width: "20px", height: "20px", color: "#ef4444" }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: "#ef4444" }}
                    >
                      Invalid Configuration
                    </p>
                    <ul
                      className="text-xs space-y-1"
                      style={{ color: "#dc2626" }}
                    >
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Input with ChatInputArea */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Animation Prompt (optional)
              </label>
              <ChatInputArea
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleSubmit}
                placeholder="Describe the animation... (optional, will use scene description)"
                disabled={isBusy}
                showFileUpload={modelSupportsFileUpload}
                onFileUpload={handleFileUpload}
                attachedFiles={attachedFiles}
                onFileRemove={handleFileRemove}
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
              {modelSupportsFileUpload && (
                <p className="text-xs text-muted mt-2">
                  Upload up to 3 reference images or 1 last frame for
                  interpolation (Veo 3.1 only, requires 16:9 aspect ratio)
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="btn-base btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBusy || validationErrors.length > 0}
                className="btn-base btn-primary flex-1"
              >
                {isBusy ? "Generating..." : "Generate Video"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

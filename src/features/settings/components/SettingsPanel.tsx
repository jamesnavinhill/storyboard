import React from "react";
import type { Settings } from "@/types";

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onClose: () => void;
  aspectRatio: "16:9" | "9:16" | "1:1";
  setAspectRatio: (ratio: "16:9" | "9:16" | "1:1") => void;
  variant?: "popover" | "sheet";
  sections?: Array<
    | "scenes"
    | "workflow"
    | "autoplay"
    | "chatModel"
    | "imageModel"
    | "videoModel"
    | "videoResolution"
  >;
}

const ModelOption: React.FC<{
  title: string;
  description: string;
  value: string;
  current: string;
  onClick: (value: string) => void;
}> = ({ title, description, value, current, onClick }) => {
  const isSelected = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      title={description}
      aria-label={`${title} — ${description}`}
      className={`text-left p-2 border rounded-md transition-colors w-full ${isSelected ? "btn-soft-primary" : "btn-outline"
        }`}
    >
      <p className={`font-semibold text-xs`}>{title}</p>
    </button>
  );
};

const WORKFLOW_OPTIONS: Array<{
  value: Settings["workflow"];
  title: string;
  description: string;
}> = [
    {
      value: "music-video",
      title: "Music Video",
      description: "Artsy, abstract, and ethereal visuals.",
    },
    {
      value: "product-commercial",
      title: "Product Commercial",
      description: "Clean, modern, and high-end product shots.",
    },
    {
      value: "viral-social",
      title: "Viral Social",
      description: "Fast-paced, trendy, and engaging clips.",
    },
    {
      value: "explainer-video",
      title: "Explainer Video",
      description: "Clear, simple, and informative animations.",
    },
  ];

const VIDEO_AUTOPLAY_OPTIONS: Array<{
  value: Settings["videoAutoplay"];
  title: string;
  description: string;
}> = [
    {
      value: "on-generate",
      title: "Autoplay on Generate",
      description: "Play new videos automatically when they finish rendering.",
    },
    {
      value: "never",
      title: "Manual Playback",
      description: "Keep videos paused until you press play.",
    },
  ];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onClose,
  aspectRatio,
  setAspectRatio,
  variant = "popover",
  sections,
}) => {
  const allow = (
    key:
      | "scenes"
      | "workflow"
      | "autoplay"
      | "chatModel"
      | "imageModel"
      | "videoModel"
      | "videoResolution"
  ) => !sections || sections.includes(key);
  const containerClasses =
    variant === "sheet"
      ? "flex h-full flex-col"
      : "popover popover-elevated absolute left-0 right-0 top-0 bottom-0 p-3 z-30 flex flex-col";
  const scrollAreaClasses =
    variant === "sheet"
      ? "space-y-6 overflow-y-auto hide-scrollbar pr-1 flex-1 pt-1 pb-6 bg-card"
      : "space-y-6 overflow-y-auto hide-scrollbar pr-1 flex-1 pt-1 pb-8";
  const footerClasses =
    variant === "sheet"
      ? "pt-2 border-t border-muted mt-2 bg-card"
      : "pt-2 sticky bottom-0 bg-popover/80 backdrop-blur border-t border-muted -mx-3 px-3";
  return (
    <div className={containerClasses}>
      <div className={scrollAreaClasses}>
        {/* Generation Settings Section */}
        {(allow("scenes") || allow("workflow") || allow("autoplay")) && (
          <div className="space-y-4">
            {variant === "sheet" && (
              <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                Generation Settings
              </h3>
            )}
            <div className="grid grid-cols-2 gap-4">
              {allow("scenes") && (
                <>
                  <div>
                    <label
                      htmlFor="scene-count"
                      className="block text-xs sm:text-sm font-semibold mb-2"
                    >
                      Scenes:{" "}
                      <span className="font-bold text-primary">
                        {settings.sceneCount}
                      </span>
                    </label>
                    <input
                      id="scene-count"
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={settings.sceneCount}
                      onChange={(e) =>
                        onSettingsChange({ sceneCount: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-muted appearance-none cursor-pointer rounded-full accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2">
                      Aspect Ratio
                    </label>
                    <div className="flex items-center border rounded-md border-muted">
                      <button
                        type="button"
                        onClick={() => setAspectRatio("16:9")}
                        className={`w-full px-2.5 sm:px-3 py-1 text-[11px] font-semibold rounded-l-md transition-colors ${aspectRatio === "16:9"
                            ? "btn-soft-primary"
                            : "btn-ghost hover:bg-accent"
                          }`}
                        aria-label="Set aspect ratio to 16:9"
                      >
                        16:9
                      </button>
                      <button
                        type="button"
                        onClick={() => setAspectRatio("1:1")}
                        className={`w-full px-2.5 sm:px-3 py-1 text-[11px] font-semibold transition-colors ${aspectRatio === "1:1"
                            ? "btn-soft-primary"
                            : "btn-ghost hover:bg-accent"
                          }`}
                        aria-label="Set aspect ratio to 1:1 (Square)"
                        title="1:1 (Square)"
                      >
                        1:1
                      </button>
                      <button
                        type="button"
                        onClick={() => setAspectRatio("9:16")}
                        className={`w-full px-2.5 sm:px-3 py-1 text-[11px] font-semibold rounded-r-md transition-colors ${aspectRatio === "9:16"
                            ? "btn-soft-primary"
                            : "btn-ghost hover:bg-accent"
                          }`}
                        aria-label="Set aspect ratio to 9:16"
                      >
                        9:16
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {allow("workflow") && (
              <div>
                <h3 className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
                  Workflow
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {WORKFLOW_OPTIONS.map((option) => (
                    <ModelOption
                      key={option.value}
                      title={option.title}
                      description={option.description}
                      value={option.value}
                      current={settings.workflow}
                      onClick={(value) =>
                        onSettingsChange({
                          workflow: value as Settings["workflow"],
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {allow("autoplay") && (
              <div>
                <h3 className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
                  Video Autoplay
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VIDEO_AUTOPLAY_OPTIONS.map((option) => (
                    <ModelOption
                      key={option.value}
                      title={option.title}
                      description={option.description}
                      value={option.value}
                      current={settings.videoAutoplay}
                      onClick={(value) =>
                        onSettingsChange({
                          videoAutoplay: value as Settings["videoAutoplay"],
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Model Configuration Section */}
        {(allow("chatModel") || allow("imageModel") || allow("videoModel")) && (
          <div className="space-y-4">
            {variant === "sheet" && (
              <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide border-t border-muted pt-6">
                Model Configuration
              </h3>
            )}

            {/* Chat Model */}
            {allow("chatModel") && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-2">
                  Creative Chat Model
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <ModelOption
                    title="Gemini 2.5 Pro"
                    description="Most capable."
                    value="gemini-2.5-pro"
                    current={settings.chatModel}
                    onClick={(v) =>
                      onSettingsChange({
                        chatModel: v as Settings["chatModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Gemini 2.5 Flash"
                    description="Balanced."
                    value="gemini-2.5-flash"
                    current={settings.chatModel}
                    onClick={(v) =>
                      onSettingsChange({
                        chatModel: v as Settings["chatModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Gemini 2.5 Flash Lite"
                    description="Fastest."
                    value="gemini-2.5-flash-lite"
                    current={settings.chatModel}
                    onClick={(v) =>
                      onSettingsChange({
                        chatModel: v as Settings["chatModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Gemini 3 Pro"
                    description="With Image Preview."
                    value="gemini-3-pro-image-preview"
                    current={settings.chatModel}
                    onClick={(v) =>
                      onSettingsChange({
                        chatModel: v as Settings["chatModel"],
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Image Model */}
            {allow("imageModel") && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-2">
                  Image Generation Model
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ModelOption
                    title="Imagen 4"
                    description="Highest quality."
                    value="imagen-4.0-generate-001"
                    current={settings.imageModel}
                    onClick={(v) =>
                      onSettingsChange({
                        imageModel: v as Settings["imageModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Imagen 4 Ultra"
                    description="Ultra high quality."
                    value="imagen-4.0-ultra-generate-001"
                    current={settings.imageModel}
                    onClick={(v) =>
                      onSettingsChange({
                        imageModel: v as Settings["imageModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Imagen 4 Fast"
                    description="Optimized for speed."
                    value="imagen-4.0-fast-generate-001"
                    current={settings.imageModel}
                    onClick={(v) =>
                      onSettingsChange({
                        imageModel: v as Settings["imageModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Imagen 3"
                    description="Excellent quality."
                    value="imagen-3.0-generate-002"
                    current={settings.imageModel}
                    onClick={(v) =>
                      onSettingsChange({
                        imageModel: v as Settings["imageModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Flash Image (Nano)"
                    description="Fast, versatile edit model."
                    value="gemini-2.5-flash-image"
                    current={settings.imageModel}
                    onClick={(v) =>
                      onSettingsChange({
                        imageModel: v as Settings["imageModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Gemini 3 Pro"
                    description="Image Preview & Text."
                    value="gemini-3-pro-image-preview"
                    current={settings.imageModel}
                    onClick={(v) =>
                      onSettingsChange({
                        imageModel: v as Settings["imageModel"],
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Video Model */}
            {allow("videoModel") && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-2">
                  Video Generation Model
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ModelOption
                    title="Veo 3.1"
                    description="Latest, 1080p all ratios."
                    value="veo-3.1-generate-preview"
                    current={settings.videoModel}
                    onClick={(v) =>
                      onSettingsChange({
                        videoModel: v as Settings["videoModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Veo 3.1 Fast"
                    description="Fast 1080p generation."
                    value="veo-3.1-fast-generate-preview"
                    current={settings.videoModel}
                    onClick={(v) =>
                      onSettingsChange({
                        videoModel: v as Settings["videoModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Veo 3"
                    description="High quality generation."
                    value="veo-3.0-generate-001"
                    current={settings.videoModel}
                    onClick={(v) =>
                      onSettingsChange({
                        videoModel: v as Settings["videoModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Veo 3 Fast"
                    description="Optimized for speed."
                    value="veo-3.0-fast-generate-001"
                    current={settings.videoModel}
                    onClick={(v) =>
                      onSettingsChange({
                        videoModel: v as Settings["videoModel"],
                      })
                    }
                  />
                  <ModelOption
                    title="Veo 2"
                    description="Proven quality."
                    value="veo-2.0-generate-001"
                    current={settings.videoModel}
                    onClick={(v) =>
                      onSettingsChange({
                        videoModel: v as Settings["videoModel"],
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Video Resolution */}
            {allow("videoResolution") && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-2">
                  Video Resolution
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <ModelOption
                    title="1080p"
                    description="High quality (default)"
                    value="1080p"
                    current={settings.videoResolution}
                    onClick={(v) =>
                      onSettingsChange({
                        videoResolution: v as Settings["videoResolution"],
                      })
                    }
                  />
                  <ModelOption
                    title="720p"
                    description="Faster generation"
                    value="720p"
                    current={settings.videoResolution}
                    onClick={(v) =>
                      onSettingsChange({
                        videoResolution: v as Settings["videoResolution"],
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted mt-2">
                  Note: Veo 2.0 ignores resolution setting. Some features like
                  video extension only support 720p.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={footerClasses}>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full text-center py-1.5 text-xs btn-base btn-outline-destructive rounded"
          aria-label="Close settings"
        >
          Done
        </button>
      </div>
    </div>
  );
};

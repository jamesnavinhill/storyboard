import { Select } from "@/ui/Select";
import React, { useMemo, useState } from "react";
import { Sparkles, Plus, Upload, Image as ImageIcon, Film } from "lucide-react";
import { useToast } from "@/components/toast/useToast";
import { uploadAsset } from "@/services/projectService";

interface GhostSceneCardProps {
  onCreateManual: (
    description: string,
    aspectRatio: "16:9" | "9:16" | "1:1"
  ) => Promise<string>; // returns new sceneId
  onCreateAI: () => void;
  defaultAspectRatio: "16:9" | "9:16" | "1:1";
  projectId?: string | null;
  onUpdateScene?: (
    sceneId: string,
    updates: Partial<
      { description: string; aspectRatio: "16:9" | "9:16" | "1:1" } & {
        primaryImageAssetId?: string | null;
        primaryVideoAssetId?: string | null;
      }
    >
  ) => Promise<void>;
}

const GhostSceneCardComponent: React.FC<GhostSceneCardProps> = ({
  onCreateManual,
  onCreateAI,
  defaultAspectRatio,
  projectId,
  onUpdateScene,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">(
    defaultAspectRatio
  );
  const [mode, setMode] = useState<"agent" | "manual">("agent");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { show: showToast } = useToast();

  const hasProject = Boolean(projectId);
  const canSubmitManual = useMemo(() => {
    return (
      hasProject &&
      description.trim().length > 0 &&
      files.length > 0 &&
      !isUploading
    );
  }, [hasProject, description, files.length, isUploading]);

  const onFilesPicked = (picked: FileList | null) => {
    if (!picked) return;
    const arr = Array.from(picked);
    // Basic filter to images/videos only for assets
    const filtered = arr.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setFiles(filtered);
  };

  const fileTypeFor = (mime: string): "image" | "video" | "attachment" => {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    return "attachment";
  };

  const readAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URL prefix if present
        const idx = result.indexOf(",");
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "agent") {
      if (description.trim()) {
        void onCreateManual(description.trim(), aspectRatio).then(() => {
          setDescription("");
          setIsExpanded(false);
        });
      }
      return;
    }
    // Manual mode: upload assets first, then create scene
    void (async () => {
      if (!projectId) {
        showToast({
          variant: "error",
          description:
            "No active project selected. Select a project to upload assets.",
        });
        return;
      }
      if (!description.trim() || files.length === 0) return;
      try {
        setIsUploading(true);
        // Create scene first so we can attach assets
        const sceneId = await onCreateManual(description.trim(), aspectRatio);

        // Upload each selected file as an asset attached to the scene
        const uploadedAssetIds: { image?: string; video?: string } = {};
        for (const file of files) {
          const base64 = await readAsBase64(file);
          const { asset } = await uploadAsset({
            projectId,
            sceneId,
            type: fileTypeFor(file.type),
            mimeType: file.type,
            fileName: title.trim()
              ? `${title.trim()}${file.name.substring(
                file.name.lastIndexOf(".")
              )}`
              : file.name,
            data: base64,
            metadata: { source: "new-scene-manual" },
          });
          if (file.type.startsWith("image/") && !uploadedAssetIds.image) {
            uploadedAssetIds.image = asset.id;
          }
          if (file.type.startsWith("video/") && !uploadedAssetIds.video) {
            uploadedAssetIds.video = asset.id;
          }
        }

        // Update scene primary assets (if handler provided) so UI reflects immediately
        if (
          onUpdateScene &&
          (uploadedAssetIds.image || uploadedAssetIds.video)
        ) {
          await onUpdateScene(sceneId, {
            primaryImageAssetId: uploadedAssetIds.image ?? null,
            primaryVideoAssetId: uploadedAssetIds.video ?? null,
          });
        }
        showToast({
          variant: "success",
          description: `Uploaded ${files.length} asset${files.length > 1 ? "s" : ""
            } and created scene`,
        });
        // Reset state
        setTitle("");
        setFiles([]);
        setDescription("");
        setIsExpanded(false);
      } catch (err) {
        console.error(err);
        showToast({
          variant: "error",
          description:
            err instanceof Error
              ? err.message
              : "Failed to create scene with assets",
        });
      } finally {
        setIsUploading(false);
      }
    })();
  };

  const handleAICreate = () => {
    onCreateAI();
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className={`scene-card group relative w-full max-w-full hover-card ${defaultAspectRatio === "9:16" ? "aspect-portrait" : "aspect-video"
          } flex flex-col items-center justify-center placeholder-dashed bg-transparent transition-all cursor-pointer`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(true);
          }
        }}
      >
        <Plus className="w-12 h-12 text-muted group-hover:text-primary transition-colors" />
        <p className="mt-3 text-sm text-muted group-hover:text-primary transition-colors">
          Add New Scene
        </p>
      </div>
    );
  }

  return (
    <div className="scene-card card relative flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">New Scene</h3>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setDescription("");
            setFiles([]);
            setTitle("");
            setMode("agent");
          }}
          className="btn-base btn-ghost px-2 py-1"
          aria-label="Cancel"
        >
          ×
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          className={`btn-base rounded-md px-3 py-1.5 text-sm ${mode === "agent" ? "btn-soft-primary" : "btn-ghost"
            }`}
          onClick={() => setMode("agent")}
        >
          Agent
        </button>
        <button
          type="button"
          className={`btn-base rounded-md px-3 py-1.5 text-sm ${mode === "manual" ? "btn-soft-primary" : "btn-ghost"
            }`}
          onClick={() => setMode("manual")}
        >
          Manual
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        <div className="flex-1">
          <label
            htmlFor="scene-description"
            className="block text-sm font-medium mb-2"
          >
            Scene Description
          </label>
          <textarea
            id="scene-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your scene..."
            className="input-base h-32 resize-none"
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="aspect-ratio"
            className="block text-sm font-medium mb-2"
          >
            Aspect Ratio
          </label>
          <Select
            value={aspectRatio}
            onChange={(v) => setAspectRatio(v as "16:9" | "9:16" | "1:1")}
            options={[
              { value: "16:9", label: "16:9 (Landscape)" },
              { value: "1:1", label: "1:1 (Square)" },
              { value: "9:16", label: "9:16 (Portrait)" },
            ]}
            ariaLabel="Aspect ratio"
            title="Aspect ratio"
          />
        </div>

        {mode === "manual" && (
          <div className="space-y-3">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                htmlFor="scene-title"
              >
                Title (optional)
              </label>
              <input
                id="scene-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title for your asset(s)"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload images/videos
              </label>
              <div
                className={`placeholder-dashed px-4 py-6 cursor-pointer ${isUploading ? "opacity-60" : ""
                  }`}
              >
                <input
                  id="scene-assets"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => onFilesPicked(e.target.files)}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="scene-assets"
                  className="flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? "Uploading…" : "Select files"}</span>
                </label>
              </div>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {files.map((f, idx) => (
                    <li
                      key={`${f.name}-${idx}`}
                      className="flex items-center gap-2"
                    >
                      {f.type.startsWith("image/") ? (
                        <ImageIcon className="w-3.5 h-3.5" />
                      ) : (
                        <Film className="w-3.5 h-3.5" />
                      )}
                      <span className="truncate">{f.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!hasProject && (
                <p className="mt-2 text-xs text-warning">
                  Select a project to enable uploads.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-auto">
          <button
            type="submit"
            disabled={mode === "agent" ? !description.trim() : !canSubmitManual}
            className="btn-base btn-soft-primary flex-1 px-4 py-2 rounded-md"
          >
            {mode === "agent"
              ? "Create Scene"
              : isUploading
                ? "Uploading…"
                : "Create with Uploads"}
          </button>
          <button
            type="button"
            onClick={handleAICreate}
            className="btn-base btn-soft-primary flex items-center gap-2 px-4 py-2 rounded-md"
            title="Use AI to generate scene"
            aria-label="Use AI to generate scene"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assist</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const GhostSceneCard = React.memo(GhostSceneCardComponent);
GhostSceneCard.displayName = "GhostSceneCard";

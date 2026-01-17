import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Image } from "lucide-react";
import { Select } from "@/ui/Select";
import type { Scene } from "@/types";
import type { ProjectSummary } from "@/types/services";

export interface DetailsTabProps {
  selectedScene: Scene | null;
  selectedProject: ProjectSummary | null;
  scenes: Scene[];
  onUpdateScene: (
    sceneId: string,
    updates: Partial<Pick<Scene, "description" | "aspectRatio">>
  ) => Promise<void> | void;
  onExportImage: (imageUrl: string, description: string) => void;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({
  selectedScene,
  selectedProject,
  scenes,
  onUpdateScene,
  onExportImage,
}) => {
  if (selectedScene) {
    return (
      <div className="flex flex-col gap-3">
        {/* Thumbnail */}
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          {selectedScene.videoUrl ? (
            <video
              src={selectedScene.videoUrl}
              className="h-full w-full object-cover"
              muted
              loop
              controls
            />
          ) : selectedScene.imageUrl ? (
            <img
              src={selectedScene.imageUrl}
              alt={selectedScene.description}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted">
              No preview
            </div>
          )}
        </div>
        {/* Details Editor */}
        <DetailsEditor
          scene={selectedScene}
          onUpdateScene={onUpdateScene}
          onExportImage={onExportImage}
        />
      </div>
    );
  }

  if (selectedProject) {
    return <ProjectDetails project={selectedProject} scenes={scenes} />;
  }

  return (
    <div className="h-full flex items-center justify-center text-muted">
      Select a project or scene to view details.
    </div>
  );
};

// --- Details Editor ---
const DetailsEditor: React.FC<{
  scene: Scene;
  onUpdateScene: (
    sceneId: string,
    updates: Partial<Pick<Scene, "description" | "aspectRatio">>
  ) => Promise<void> | void;
  onExportImage: (imageUrl: string, description: string) => void;
}> = ({ scene, onUpdateScene, onExportImage }) => {
  const [draftDescription, setDraftDescription] = useState(scene.description);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const autoSize = useCallback(() => {
    const el = descRef.current;
    if (!el) return;
    // Reset height to measure accurate scrollHeight and then set it
    el.style.height = "auto";
    // Cap growth a bit so it doesn't take over the whole drawer
    const max = 420; // px ~12-14 lines depending on fonts
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
  }, []);
  const [draftAspect, setDraftAspect] = useState<"16:9" | "9:16" | "1:1">(
    scene.aspectRatio ?? "16:9"
  );
  const derivedTitle = useMemo(() => {
    const d = scene.description?.trim() || "Untitled Scene";
    // take first sentence or first 60 chars
    const sentenceEnd = d.indexOf(".");
    const first = sentenceEnd > 0 ? d.slice(0, sentenceEnd) : d;
    return first.length > 60 ? first.slice(0, 57) + "…" : first;
  }, [scene.id, scene.description]);

  useEffect(() => {
    setDraftDescription(scene.description);
    setDraftAspect(scene.aspectRatio ?? "16:9");
  }, [scene.id]);

  useEffect(() => {
    autoSize();
  }, [draftDescription, autoSize]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs uppercase tracking-wide text-muted">
          Title
        </label>
        <input
          value={derivedTitle}
          readOnly
          className="input-base mt-1 w-full p-2 text-sm rounded-md bg-white/5"
          aria-label="Title"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-muted">
          Description
        </label>
        <textarea
          ref={descRef}
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          onFocus={autoSize}
          className="input-base mt-1 w-full min-h-[90px] p-2 text-sm rounded-md resize-none overflow-hidden"
          placeholder="Describe the scene…"
          aria-label="Scene description"
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-wide text-muted">
          Aspect
        </label>
        <Select
          value={draftAspect}
          onChange={(v) => setDraftAspect(v as "16:9" | "9:16" | "1:1")}
          options={[
            { value: "16:9", label: "16:9" },
            { value: "1:1", label: "1:1 (Square)" },
            { value: "9:16", label: "9:16" },
          ]}
          ariaLabel="Select aspect ratio"
          title="Aspect ratio"
          size="sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              if (!scene.imageUrl) return;
              onExportImage(scene.imageUrl!, scene.description);
            }}
            disabled={!scene.imageUrl}
            className="btn-base btn-outline px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Export Image
          </button>
          <button
            onClick={() =>
              onUpdateScene(scene.id, {
                description: draftDescription,
                aspectRatio: draftAspect,
              })
            }
            className="btn-base btn-soft-primary px-3 py-1.5 text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Project Details ---
const ProjectDetails: React.FC<{
  project: ProjectSummary;
  scenes: Scene[];
}> = ({ project, scenes }) => {
  // pick first scene with media as project thumbnail
  const media = useMemo(() => {
    const withMedia = scenes.find((s) => s.imageUrl || s.videoUrl);
    return withMedia ?? null;
  }, [scenes]);

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        {media?.videoUrl ? (
          <video
            src={media.videoUrl}
            className="h-full w-full object-cover"
            muted
            loop
            controls
          />
        ) : media?.imageUrl ? (
          <img
            src={media.imageUrl}
            alt={project.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-muted">
            No preview
          </div>
        )}
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-muted">
          Title
        </label>
        <input
          value={project.name}
          readOnly
          className="input-base mt-1 w-full p-2 text-sm rounded-md bg-white/5"
          aria-label="Project title"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-muted">
          Description
        </label>
        <textarea
          value={(project.description ?? "").trim()}
          readOnly
          className="input-base mt-1 w-full min-h-[90px] p-2 text-sm rounded-md bg-white/5"
          placeholder="No description"
          aria-label="Project description"
        />
      </div>
    </div>
  );
};

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Scene } from "../../../types";
import { Select } from "@/ui/Select";

export const DetailsEditor: React.FC<{
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
    el.style.height = "auto";
    const max = 420;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
  }, []);
  const [draftAspect, setDraftAspect] = useState<"16:9" | "9:16" | "1:1">(
    scene.aspectRatio ?? "16:9"
  );
  const derivedTitle = useMemo(() => {
    const d = scene.description?.trim() || "Untitled Scene";
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

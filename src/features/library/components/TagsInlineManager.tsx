import React, { useMemo, useState } from "react";
import type { Scene, SceneTag } from "../../../types";
import { Select } from "@/ui/Select";

export const TagsInlineManager: React.FC<{
  tags: SceneTag[];
  scenes: Scene[];
  search: string;
  onCreateTag: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onDeleteTag: (tagId: string) => Promise<void> | void;
  onAssignTag: (sceneId: string, tagIds: string[]) => Promise<void> | void;
  onRemoveTag: (sceneId: string, tagIds: string[]) => Promise<void> | void;
}> = ({
  tags,
  scenes,
  search,
  onCreateTag,
  onDeleteTag,
  onAssignTag,
  onRemoveTag,
}) => {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>("#f97316");

  const visibleTags = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? tags : tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          void onCreateTag({ name, color: newColor });
          setNewName("");
          setNewColor("#f97316");
        }}
        className="grid gap-2 grid-cols-[1fr,auto,auto]"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New tag name"
          className="input-base text-sm"
        />
        <Select
          value={newColor}
          onChange={(v) => setNewColor(v)}
          options={[
            { value: "#f97316", label: "Orange" },
            { value: "#ec4899", label: "Pink" },
            { value: "#6366f1", label: "Indigo" },
            { value: "#22c55e", label: "Emerald" },
            { value: "#14b8a6", label: "Teal" },
            { value: "#0ea5e9", label: "Sky" },
            { value: "#facc15", label: "Amber" },
            { value: "#ef4444", label: "Red" },
          ]}
          ariaLabel="Tag color"
          title="Tag color"
          size="sm"
        />
        <button className="btn-base btn-soft-primary px-3 py-1.5 text-sm">
          Create
        </button>
      </form>

      {visibleTags.length === 0 ? (
        <p className="text-sm text-muted">No tags.</p>
      ) : (
        <div className="space-y-4">
          {visibleTags.map((tag) => (
            <div key={tag.id} className="rounded-md p-3 bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {tag.name}
                  </span>
                  <span className="text-xs text-muted">
                    {tag.sceneIds?.length ?? 0} scenes
                  </span>
                </div>
                <button
                  className="btn-base border border-danger text-danger px-2 py-1 text-xs hover:bg-danger/10"
                  onClick={() => void onDeleteTag(tag.id)}
                >
                  Delete
                </button>
              </div>
              <div className="mt-3">
                <h4 className="text-xs uppercase tracking-wide text-muted">
                  Assign Scenes
                </h4>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {scenes.map((scene, index) => {
                    const checked = (tag.sceneIds ?? []).includes(scene.id);
                    const label = scene.description?.trim() || "Untitled scene";
                    const truncated =
                      label.length > 80 ? `${label.slice(0, 77)}…` : label;
                    return (
                      <label
                        key={scene.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            e.target.checked
                              ? onAssignTag(scene.id, [tag.id])
                              : onRemoveTag(scene.id, [tag.id])
                          }
                        />
                        <span className="truncate text-xs text-muted">
                          Scene {index + 1}: {truncated}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

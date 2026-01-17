import React, { useState, useMemo } from "react";
import { Select } from "@/ui/Select";
import type { Scene, SceneGroup, SceneTag } from "@/types";
import type { GTSubTab } from "../hooks/useDrawerTabs";

export interface GroupsTagsTabProps {
  gtSubTab: GTSubTab;
  search: string;
  groups: SceneGroup[];
  tags: SceneTag[];
  scenes: Scene[];
  onCreateGroup: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onUpdateGroup: (
    groupId: string,
    updates: { name?: string; color?: string | null }
  ) => Promise<void> | void;
  onDeleteGroup: (groupId: string) => Promise<void> | void;
  onAssignScenesToGroup: (
    groupId: string,
    sceneIds: string[]
  ) => Promise<void> | void;
  onRemoveScenesFromGroup: (
    groupId: string,
    sceneIds: string[]
  ) => Promise<void> | void;
  onCreateTag: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onDeleteTag: (tagId: string) => Promise<void> | void;
  onAssignTagToScene: (
    sceneId: string,
    tagIds: string[]
  ) => Promise<void> | void;
  onRemoveTagFromScene: (
    sceneId: string,
    tagIds: string[]
  ) => Promise<void> | void;
}

export const GroupsTagsTab: React.FC<GroupsTagsTabProps> = ({
  gtSubTab,
  search,
  groups,
  tags,
  scenes,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignScenesToGroup,
  onRemoveScenesFromGroup,
  onCreateTag,
  onDeleteTag,
  onAssignTagToScene,
  onRemoveTagFromScene,
}) => {
  return (
    <>
      {gtSubTab === "groups" ? (
        <GroupsInlineManager
          groups={groups}
          scenes={scenes}
          search={search}
          onCreateGroup={onCreateGroup}
          onUpdateGroup={onUpdateGroup}
          onDeleteGroup={onDeleteGroup}
          onAssignScenes={onAssignScenesToGroup}
          onRemoveScenes={onRemoveScenesFromGroup}
        />
      ) : (
        <TagsInlineManager
          key="tags-inline-manager"
          tags={tags}
          scenes={scenes}
          search={search}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
          onAssignTag={onAssignTagToScene}
          onRemoveTag={onRemoveTagFromScene}
        />
      )}
    </>
  );
};

// --- Groups Inline Manager ---
const GroupsInlineManager: React.FC<{
  groups: SceneGroup[];
  scenes: Scene[];
  search: string;
  onCreateGroup: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onUpdateGroup: (
    groupId: string,
    updates: { name?: string; color?: string | null }
  ) => Promise<void> | void;
  onDeleteGroup: (groupId: string) => Promise<void> | void;
  onAssignScenes: (groupId: string, sceneIds: string[]) => Promise<void> | void;
  onRemoveScenes: (groupId: string, sceneIds: string[]) => Promise<void> | void;
}> = ({
  groups,
  scenes,
  search,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignScenes,
  onRemoveScenes,
}) => {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>("#f97316");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<string>("#f97316");

  const visibleGroups = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? groups : groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          void onCreateGroup({ name, color: newColor });
          setNewName("");
          setNewColor("#f97316");
        }}
        className="grid gap-2 grid-cols-[1fr,auto,auto]"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New group name"
          className="input-base text-sm"
          aria-label="New group name"
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
          ariaLabel="Group color"
          title="Group color"
          size="sm"
        />
        <button className="btn-base btn-soft-primary px-3 py-1.5 text-sm">
          Create
        </button>
      </form>

      {visibleGroups.length === 0 ? (
        <p className="text-sm text-muted">No groups.</p>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((group) => {
            const isEditing = editingId === group.id;
            return (
              <div key={group.id} className="rounded-md p-3 bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="input-base text-sm px-2 py-1"
                          placeholder="Group name"
                          aria-label="Group name"
                        />
                        <Select
                          value={draftColor}
                          onChange={(v) => setDraftColor(v)}
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
                          ariaLabel="Group color"
                          title="Group color"
                          size="sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {group.name}
                        </span>
                        <span className="text-xs text-muted">
                          {group.sceneIds?.length ?? 0} scenes
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          className="btn-base btn-soft-primary px-2 py-1 text-xs"
                          onClick={() => {
                            const name = draftName.trim();
                            if (!name) return;
                            void onUpdateGroup(group.id, {
                              name,
                              color: draftColor,
                            });
                            setEditingId(null);
                          }}
                        >
                          Save
                        </button>
                        <button
                          className="btn-base btn-ghost px-2 py-1 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-base btn-ghost px-2 py-1 text-xs"
                          onClick={() => {
                            setEditingId(group.id);
                            setDraftName(group.name);
                            setDraftColor(group.color ?? "#f97316");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-base border border-danger text-danger px-2 py-1 text-xs hover:bg-danger/10"
                          onClick={() => void onDeleteGroup(group.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <h4 className="text-xs uppercase tracking-wide text-muted">
                    Assign Scenes
                  </h4>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {scenes.map((scene, index) => {
                      const checked = (group.sceneIds ?? []).includes(scene.id);
                      const label =
                        scene.description?.trim() || "Untitled scene";
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
                                ? onAssignScenes(group.id, [scene.id])
                                : onRemoveScenes(group.id, [scene.id])
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
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Tags Inline Manager ---
const TagsInlineManager: React.FC<{
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

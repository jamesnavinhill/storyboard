import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Select } from "@/ui/Select";
import type { Scene, SceneGroup, SceneTag } from "@/types";

// --- Groups Inline Manager ---
// Groups use single-selection behavior: auto-collapse after assigning a scene
// because scenes can only belong to one group at a time.
export const GroupsInlineManager: React.FC<{
  groups: SceneGroup[];
  scenes: Scene[];
  search?: string;
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
  defaultCollapsed?: boolean;
}> = ({
  groups,
  scenes,
  search = "",
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignScenes,
  onRemoveScenes,
  defaultCollapsed = true,
}) => {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>("#f97316");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<string>("#f97316");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const visibleGroups = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? groups : groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const collapseGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  };

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
        <button
          type="submit"
          className="btn-base btn-soft-primary px-3 py-1.5 text-sm"
        >
          Create
        </button>
      </form>

      {visibleGroups.length === 0 ? (
        <p className="text-sm text-muted">No groups.</p>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((group) => {
            const isEditing = editingId === group.id;
            const isExpanded = expandedGroups.has(group.id);
            const sceneCount = group.sceneIds?.length ?? 0;
            const colorIndicator = group.color ?? "#f97316";

            return (
              <div key={group.id} className="rounded-md bg-white/5">
                {/* Collapsible Header */}
                <div className="collapsible-header flex items-center justify-between gap-2 p-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                    onClick={() => !isEditing && toggleGroupExpansion(group.id)}
                    onKeyDown={(e) => {
                      if (!isEditing && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        toggleGroupExpansion(group.id);
                      }
                    }}
                    aria-expanded={isExpanded ? "true" : "false"}
                    aria-controls={`group-${group.id}-content`}
                    id={`group-${group.id}-header`}
                    disabled={isEditing}
                  >
                    {!isEditing &&
                      (isExpanded ? (
                        <ChevronDown className="collapsible-chevron w-4 h-4 text-muted flex-shrink-0" />
                      ) : (
                        <ChevronRight className="collapsible-chevron w-4 h-4 text-muted flex-shrink-0" />
                      ))}
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
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
                      <>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colorIndicator }}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium truncate">
                          {group.name}
                        </span>
                        <span className="text-xs text-muted flex-shrink-0">
                          • {sceneCount} scenes
                        </span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
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
                          type="button"
                          className="btn-base btn-ghost px-2 py-1 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
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
                          type="button"
                          className="btn-base border border-danger text-danger px-2 py-1 text-xs hover:bg-danger/10"
                          onClick={() => void onDeleteGroup(group.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div
                    id={`group-${group.id}-content`}
                    role="region"
                    aria-labelledby={`group-${group.id}-header`}
                    className="collapsible-content px-3 pb-3"
                  >
                    <div className="mt-2">
                      <h4 className="text-xs uppercase tracking-wide text-muted">
                        Assign Scenes
                      </h4>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {scenes.map((scene, index) => {
                          const checked = (group.sceneIds ?? []).includes(
                            scene.id
                          );
                          const label =
                            scene.description?.trim() || "Untitled scene";
                          const truncated =
                            label.length > 80
                              ? `${label.slice(0, 77)}…`
                              : label;
                          return (
                            <label
                              key={scene.id}
                              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    onAssignScenes(group.id, [scene.id]);
                                    // Auto-collapse after assignment (single-selection behavior)
                                    collapseGroup(group.id);
                                  } else {
                                    onRemoveScenes(group.id, [scene.id]);
                                  }
                                }}
                              />
                              <span className="truncate text-xs text-muted">
                                Scene {index + 1}: {truncated}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="btn-base btn-soft-primary px-4 py-1.5 text-sm"
                          onClick={() => collapseGroup(group.id)}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Tags Inline Manager ---
// Tags use multi-selection behavior: remain expanded when checkboxes are toggled
// to allow assigning multiple scenes without reopening. Only "Done" button or
// header click collapses the section.
export const TagsInlineManager: React.FC<{
  tags: SceneTag[];
  scenes: Scene[];
  search?: string;
  onCreateTag: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onDeleteTag: (tagId: string) => Promise<void> | void;
  onAssignTag: (sceneId: string, tagIds: string[]) => Promise<void> | void;
  onRemoveTag: (sceneId: string, tagIds: string[]) => Promise<void> | void;
  defaultCollapsed?: boolean;
  expandedTagIds?: Set<string>;
  onExpandedTagIdsChange?: (ids: Set<string>) => void;
}> = ({
  tags,
  scenes,
  search = "",
  onCreateTag,
  onDeleteTag,
  onAssignTag,
  onRemoveTag,
  defaultCollapsed = true,
  expandedTagIds,
  onExpandedTagIdsChange,
}) => {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>("#f97316");
  const [internalExpandedTags, setInternalExpandedTags] = useState<Set<string>>(
    new Set()
  );

  const expandedTags = expandedTagIds ?? internalExpandedTags;
  const setExpandedTags = onExpandedTagIdsChange ?? setInternalExpandedTags;

  const visibleTags = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? tags : tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  const toggleTagExpansion = (tagId: string) => {
    const next = new Set(expandedTags);
    if (next.has(tagId)) {
      next.delete(tagId);
    } else {
      next.add(tagId);
    }
    setExpandedTags(next);
  };

  const collapseTag = (tagId: string) => {
    const next = new Set(expandedTags);
    next.delete(tagId);
    setExpandedTags(next);
  };

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
        <button
          type="submit"
          className="btn-base btn-soft-primary px-3 py-1.5 text-sm"
        >
          Create
        </button>
      </form>

      {visibleTags.length === 0 ? (
        <p className="text-sm text-muted">No tags.</p>
      ) : (
        <div className="space-y-4">
          {visibleTags.map((tag) => {
            const isExpanded = expandedTags.has(tag.id);
            const sceneCount = tag.sceneIds?.length ?? 0;
            const colorIndicator = tag.color ?? "#f97316";

            return (
              <div key={tag.id} className="rounded-md bg-white/5">
                {/* Collapsible Header */}
                <div className="collapsible-header flex items-center justify-between gap-2 p-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                    onClick={() => toggleTagExpansion(tag.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleTagExpansion(tag.id);
                      }
                    }}
                    aria-expanded={isExpanded ? "true" : "false"}
                    aria-controls={`tag-${tag.id}-content`}
                    id={`tag-${tag.id}-header`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="collapsible-chevron w-4 h-4 text-muted flex-shrink-0" />
                    ) : (
                      <ChevronRight className="collapsible-chevron w-4 h-4 text-muted flex-shrink-0" />
                    )}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colorIndicator }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium truncate">
                      {tag.name}
                    </span>
                    <span className="text-xs text-muted flex-shrink-0">
                      • {sceneCount} scenes
                    </span>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      className="btn-base border border-danger text-danger px-2 py-1 text-xs hover:bg-danger/10"
                      onClick={() => void onDeleteTag(tag.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div
                    id={`tag-${tag.id}-content`}
                    role="region"
                    aria-labelledby={`tag-${tag.id}-header`}
                    className="collapsible-content px-3 pb-3"
                  >
                    <div className="mt-2">
                      <h4 className="text-xs uppercase tracking-wide text-muted">
                        Assign Scenes
                      </h4>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {scenes.map((scene, index) => {
                          const checked = (tag.sceneIds ?? []).includes(
                            scene.id
                          );
                          const label =
                            scene.description?.trim() || "Untitled scene";
                          const truncated =
                            label.length > 80
                              ? `${label.slice(0, 77)}…`
                              : label;
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
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="btn-base btn-soft-primary px-4 py-1.5 text-sm"
                          onClick={() => collapseTag(tag.id)}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

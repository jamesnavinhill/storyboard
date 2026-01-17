import type { StateCreator } from "zustand";
import type { SceneTag, Scene } from "../../../types";
import type { ProjectServices } from "../services/projectServices";

// Tag slice state interface
export interface TagSlice {
  tags: SceneTag[];
  activeTagFilter: string | null;

  // Tag CRUD operations
  createTag: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;

  // Tag-scene assignment operations
  assignTagsToScene: (sceneId: string, tagIds: string[]) => Promise<void>;
  removeTagsFromScene: (sceneId: string, tagIds: string[]) => Promise<void>;

  // Filter operations
  setTagFilter: (tagId: string | null) => void;
}

// Type for accessing other store slices
type StoreGetter = () => {
  _services: ProjectServices | null;
  activeProjectId: string | null;
  scenes: Scene[];
  tags: SceneTag[];
  activeTagFilter: string | null;
};

export const createTagSlice: StateCreator<TagSlice, [], [], TagSlice> = (
  set,
  get
) => ({
  tags: [],
  activeTagFilter: null,

  createTag: async (payload) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId) {
      console.error("[createTag] Missing services or activeProjectId", {
        services: !!services,
        activeProjectId,
      });
      return;
    }

    console.log("[createTag] Creating tag:", payload);
    const tag = await services.createTag(activeProjectId, payload);
    console.log("[createTag] Tag created:", tag);

    set((s) => {
      const newTags = [...s.tags, { ...tag, sceneIds: tag.sceneIds ?? [] }];
      console.log(
        "[createTag] Updating store. Old tags:",
        s.tags.length,
        "New tags:",
        newTags.length
      );
      return { tags: newTags };
    });
  },

  deleteTag: async (tagId) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId) return;

    await services.deleteTag(activeProjectId, tagId);

    // Update both tags and scenes in a single set call
    set((s: any) => ({
      tags: s.tags.filter((t: any) => t.id !== tagId),
      activeTagFilter: s.activeTagFilter === tagId ? null : s.activeTagFilter,
      scenes: s.scenes.map((scene: any) =>
        scene.tagIds?.includes(tagId)
          ? {
              ...scene,
              tagIds: scene.tagIds.filter((id: string) => id !== tagId),
            }
          : scene
      ),
    }));
  },

  assignTagsToScene: async (sceneId, tagIds) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId || tagIds.length === 0) return;

    await services.assignTags(activeProjectId, sceneId, tagIds);

    // Update both tags and scenes in a single set call
    set((s: any) => ({
      tags: s.tags.map((tag: any) =>
        tagIds.includes(tag.id)
          ? {
              ...tag,
              sceneIds: Array.from(new Set([...(tag.sceneIds ?? []), sceneId])),
            }
          : tag
      ),
      scenes: s.scenes.map((scene: any) =>
        scene.id === sceneId
          ? {
              ...scene,
              tagIds: Array.from(new Set([...(scene.tagIds ?? []), ...tagIds])),
            }
          : scene
      ),
    }));
  },

  removeTagsFromScene: async (sceneId, tagIds) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId || tagIds.length === 0) return;

    await services.removeTags(activeProjectId, sceneId, tagIds);

    // Update both tags and scenes in a single set call
    set((s: any) => ({
      tags: s.tags.map((tag: any) =>
        tagIds.includes(tag.id)
          ? {
              ...tag,
              sceneIds: (tag.sceneIds ?? []).filter(
                (id: string) => id !== sceneId
              ),
            }
          : tag
      ),
      scenes: s.scenes.map((scene: any) =>
        scene.id === sceneId
          ? {
              ...scene,
              tagIds: (scene.tagIds ?? []).filter(
                (id: string) => !tagIds.includes(id)
              ),
            }
          : scene
      ),
    }));
  },

  setTagFilter: (tagId) => set({ activeTagFilter: tagId }),
});

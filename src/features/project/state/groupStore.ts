import type { StateCreator } from "zustand";
import type { SceneGroup, Scene } from "../../../types";
import type { ProjectServices } from "../services/projectServices";

// Group slice state interface
export interface GroupSlice {
  groups: SceneGroup[];
  activeGroupFilter: string | null;

  // Group CRUD operations
  createGroup: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void>;
  updateGroup: (
    groupId: string,
    updates: { name?: string; color?: string | null }
  ) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;

  // Group-scene assignment operations
  assignScenesToGroup: (groupId: string, sceneIds: string[]) => Promise<void>;
  removeScenesFromGroup: (groupId: string, sceneIds: string[]) => Promise<void>;

  // Filter operations
  setGroupFilter: (groupId: string | null) => void;
}

// Type for accessing other store slices
type StoreGetter = () => {
  _services: ProjectServices | null;
  activeProjectId: string | null;
  scenes: Scene[];
  groups: SceneGroup[];
  activeGroupFilter: string | null;
};

export const createGroupSlice: StateCreator<GroupSlice, [], [], GroupSlice> = (
  set,
  get
) => ({
  groups: [],
  activeGroupFilter: null,

  createGroup: async (payload) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId) {
      console.error("[createGroup] Missing services or activeProjectId", {
        services: !!services,
        activeProjectId,
      });
      return;
    }

    console.log("[createGroup] Creating group:", payload);
    const group = await services.createGroup(activeProjectId, payload);
    console.log("[createGroup] Group created:", group);

    set((s) => {
      const newGroups = [
        ...s.groups,
        { ...group, sceneIds: group.sceneIds ?? [] },
      ];
      console.log(
        "[createGroup] Updating store. Old groups:",
        s.groups.length,
        "New groups:",
        newGroups.length
      );
      return { groups: newGroups };
    });
  },

  updateGroup: async (groupId, updates) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId) return;

    const updated = await services.updateGroup(
      activeProjectId,
      groupId,
      updates
    );
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              name: updated.name,
              color: updated.color ?? null,
              sceneIds: updated.sceneIds ?? g.sceneIds ?? [],
            }
          : g
      ),
    }));
  },

  deleteGroup: async (groupId) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId) return;

    await services.deleteGroup(activeProjectId, groupId);

    // Update both groups and scenes in a single set call
    set((s: any) => ({
      groups: s.groups.filter((g: any) => g.id !== groupId),
      activeGroupFilter:
        s.activeGroupFilter === groupId ? null : s.activeGroupFilter,
      scenes: s.scenes.map((scene: any) =>
        scene.groupId === groupId
          ? { ...scene, groupId: null, groupIds: [] }
          : scene
      ),
    }));
  },

  assignScenesToGroup: async (groupId, sceneIds) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId || sceneIds.length === 0) return;

    await services.assignScenesToGroup(activeProjectId, groupId, sceneIds);

    // Update both groups and scenes in a single set call
    set((s: any) => ({
      groups: s.groups.map((group: any) => {
        const withoutScenes = (group.sceneIds ?? []).filter(
          (id: string) => !sceneIds.includes(id)
        );
        if (group.id === groupId) {
          const merged = Array.from(new Set([...withoutScenes, ...sceneIds]));
          return { ...group, sceneIds: merged };
        }
        return { ...group, sceneIds: withoutScenes };
      }),
      scenes: s.scenes.map((scene: any) =>
        sceneIds.includes(scene.id)
          ? { ...scene, groupId, groupIds: [groupId] }
          : scene
      ),
    }));
  },

  removeScenesFromGroup: async (groupId, sceneIds) => {
    const storeState = get() as unknown as ReturnType<StoreGetter>;
    const services = storeState._services;
    const activeProjectId = storeState.activeProjectId;
    if (!services || !activeProjectId || sceneIds.length === 0) return;

    await services.removeScenesFromGroup(activeProjectId, groupId, sceneIds);

    // Update both groups and scenes in a single set call
    set((s: any) => ({
      groups: s.groups.map((group: any) =>
        group.id === groupId
          ? {
              ...group,
              sceneIds: (group.sceneIds ?? []).filter(
                (id: string) => !sceneIds.includes(id)
              ),
            }
          : group
      ),
      scenes: s.scenes.map((scene: any) =>
        sceneIds.includes(scene.id)
          ? { ...scene, groupId: null, groupIds: [] }
          : scene
      ),
    }));
  },

  setGroupFilter: (groupId) => set({ activeGroupFilter: groupId }),
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ProjectSummary, SceneRecord } from "../../../../types/services";
import type { Settings, ChatMessage } from "../../../../types";
import { useProjectStore } from "../projectStore";
import type { ProjectServices } from "../../services/projectServices";

const defaultSettings: Settings = {
  sceneCount: 8,
  chatModel: "gemini-2.5-pro",
  imageModel: "imagen-4.0-generate-001",
  videoModel: "veo-3.1-generate-preview",
  workflow: "music-video",
  videoAutoplay: "on-generate",
  videoResolution: "1080p",
  videoDuration: 8,
};

const welcomeMessage: ChatMessage = { role: "model", text: "hi" };

const makeProject = (id = "p1"): ProjectSummary => ({
  id,
  name: "Test",
  createdAt: "",
  updatedAt: "",
  description: null,
});

const makeScene = (id: string, orderIndex: number): SceneRecord => ({
  id,
  projectId: "p1",
  description: id,
  aspectRatio: "16:9",
  orderIndex,
  createdAt: "",
  updatedAt: "",
});

const makeServices = (opts?: { reorderFails?: boolean }): ProjectServices => {
  let scenes = [makeScene("a", 0), makeScene("b", 1), makeScene("c", 2)];
  const project = makeProject();
  return {
    listProjects: async () => [project],
    createProject: async (p) => ({ ...project, name: p.name }),
    getProjectDetail: async () => ({ project, scenes }),
    createScenes: async (_pid, input) =>
      input.map((s, i) => makeScene(`${Date.now()}-${i}`, s.orderIndex ?? i)),
    updateScene: async (_pid, id, updates) =>
      ({
        ...scenes.find((s) => s.id === id)!,
        ...updates,
        updatedAt: "",
      } as SceneRecord),
    appendChatMessage: async () => ({
      id: "c",
      projectId: "p1",
      role: "model",
      text: "",
      createdAt: "",
    }),
    upsertSettings: async () => ({ projectId: "p1", data: {}, updatedAt: "" }),
    fetchSettings: async () => null,
    updateProject: async (_pid, updates) => ({ ...project, ...updates }),
    deleteProject: async () => ({
      deletedProjectId: "p1",
      deletedProjectName: "Test",
      nextProject: null,
      replacementProject: null,
    }),
    exportProject: async () => new Blob([]),
    importProject: async () => project,
    reorderScenes: async (_pid, sceneIds) => {
      if (opts?.reorderFails) {
        throw new Error("boom");
      }
      scenes = sceneIds.map((id, idx) => ({
        ...scenes.find((s) => s.id === id)!,
        orderIndex: idx,
      }));
      return scenes;
    },
    createGroup: async () => ({
      id: "g1",
      projectId: "p1",
      name: "G",
      color: null,
      orderIndex: 0,
      sceneIds: [],
    }),
    updateGroup: async () => ({
      id: "g1",
      projectId: "p1",
      name: "G2",
      color: null,
      orderIndex: 0,
      sceneIds: [],
    }),
    deleteGroup: async () => {},
    assignScenesToGroup: async () => {},
    removeScenesFromGroup: async () => {},
    createTag: async () => ({
      id: "t1",
      projectId: "p1",
      name: "T",
      color: null,
      sceneIds: [],
    }),
    deleteTag: async () => {},
    assignTags: async () => {},
    removeTags: async () => {},
    listSceneHistory: async () => [],
    restoreSceneFromHistory: async () => makeScene("a", 0),
  };
};

describe("projectStore scenes reorder", () => {
  beforeEach(() => {
    // reset store between tests
    const store = useProjectStore.getState();
    // @ts-ignore private
    store._services = null;
    useProjectStore.setState({
      projects: [],
      isProjectsLoading: false,
      activeProjectId: null,
      isProjectLoading: false,
      scenes: [],
      groups: [],
      tags: [],
      activeGroupFilter: null,
      activeTagFilter: null,
      chatHistory: [],
      settings: defaultSettings,
      welcomeMessage,
      defaultSettings,
      toasts: [],
    });
  });

  it("reorders scenes on success", async () => {
    const store = useProjectStore.getState();
    await store.init(makeServices(), { defaultSettings, welcomeMessage });
    expect(useProjectStore.getState().scenes.map((s) => s.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    await useProjectStore.getState().reorderScenes(["c", "b", "a"]);
    expect(useProjectStore.getState().scenes.map((s) => s.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("rolls back and emits toast on failure", async () => {
    const store = useProjectStore.getState();
    await store.init(makeServices({ reorderFails: true }), {
      defaultSettings,
      welcomeMessage,
    });
    expect(useProjectStore.getState().scenes.map((s) => s.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    await useProjectStore.getState().reorderScenes(["c", "b", "a"]);
    // should reload original order
    expect(useProjectStore.getState().scenes.map((s) => s.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    // and emit a toast
    expect(useProjectStore.getState().toasts.length).toBeGreaterThan(0);
    expect(useProjectStore.getState().toasts[0].type).toBe("error");
  });
});

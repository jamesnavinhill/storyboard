import React, { useEffect } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ServiceProvider } from "../../../../services/registry";
import type { ServiceRegistry, SceneRecord } from "../../../../types/services";
import { useMediaTasks } from "../useMediaTasks";
import { useProjectStore } from "../../../project/state/projectStore";
import type { Settings, Scene } from "../../../../types";

const defaultSettings: Settings = {
  sceneCount: 8,
  chatModel: "gemini-2.5-pro",
  imageModel: "imagen-4.0-generate-001",
  videoModel: "veo-3.0-generate-001",
  workflow: "music-video",
  videoAutoplay: "on-generate",
  videoResolution: "1080p",
};

const makeSceneRecord = (id: string, orderIndex: number): SceneRecord => ({
  id,
  projectId: "p1",
  description: id,
  aspectRatio: "16:9",
  orderIndex,
  createdAt: "",
  updatedAt: "",
});

const makeDomainScene = (id: string, orderIndex: number): Scene => ({
  id,
  projectId: "p1",
  description: id,
  aspectRatio: "16:9",
  orderIndex,
  imageStatus: "absent",
  videoStatus: "absent",
  duration: 5, // Default duration
  uiState: {
    activity: "idle",
    panels: { edit: false, animate: false },
    lastError: null,
  },
});

const makeRegistry = (): ServiceRegistry => ({
  chatProvider: {
    async generateResponse() {
      return "";
    },
  },
  storyboardGenerator: {
    async generateScenes() {
      return { scenes: [], modelResponse: "" };
    },
    async regenerateDescription() {
      return "";
    },
    async generateStylePreviews() {
      return [];
    },
    async generateEnhancedStoryboard() {
      return [];
    },
  },
  mediaGenerator: {
    async generateImage() {
      return makeSceneRecord("a", 0);
    },
    async editImage() {
      return makeSceneRecord("a", 0);
    },
    async suggestVideoPrompt() {
      return "";
    },
    async suggestImageEditPrompt() {
      return "";
    },
    async generateVideo() {
      return makeSceneRecord("a", 0);
    },
  },
  projectStorage: {
    async listProjects() {
      return [];
    },
    async createProject() {
      throw new Error("not used");
    },
    async getProjectDetail() {
      throw new Error("not used");
    },
    async createScenes() {
      throw new Error("not used");
    },
    async updateScene() {
      throw new Error("not used");
    },
    async appendChatMessage() {
      throw new Error("not used");
    },
    async uploadAsset() {
      throw new Error("not used");
    },
    async upsertSettings() {
      throw new Error("not used");
    },
    async fetchSettings() {
      return null;
    },
    async updateProject() {
      throw new Error("not used");
    },
    async deleteProject() {
      throw new Error("not used");
    },
    async searchProjects() {
      return [];
    },
    async exportProject() {
      return new Blob([]);
    },
    async importProject() {
      throw new Error("not used");
    },
    async reorderScenes() {
      throw new Error("not used");
    },
    async listGroups() {
      return [];
    },
    async createGroup() {
      throw new Error("not used");
    },
    async updateGroup() {
      throw new Error("not used");
    },
    async deleteGroup() {
      throw new Error("not used");
    },
    async assignScenesToGroup() {
      throw new Error("not used");
    },
    async removeScenesFromGroup() {
      throw new Error("not used");
    },
    async listTags() {
      return [];
    },
    async createTag() {
      throw new Error("not used");
    },
    async deleteTag() {
      throw new Error("not used");
    },
    async assignTags() {
      throw new Error("not used");
    },
    async removeTags() {
      throw new Error("not used");
    },
    async listSceneHistory() {
      return [];
    },
    async restoreSceneFromHistory() {
      throw new Error("not used");
    },
  },
});

const ProjectStateShim = {
  get activeProjectId() {
    return useProjectStore.getState().activeProjectId;
  },
  get scenes() {
    return useProjectStore.getState().scenes;
  },
  get settings() {
    return useProjectStore.getState().settings;
  },
  setSceneActivity(sceneId: string, activity: any) {
    useProjectStore.getState().setSceneActivity(sceneId, activity);
  },
  resetSceneState(sceneId: string) {
    useProjectStore.getState().resetSceneState(sceneId);
  },
  updateSceneRecord(record: SceneRecord) {
    useProjectStore.getState().updateSceneRecord(record);
  },
  setSceneError(sceneId: string, error: any) {
    useProjectStore.getState().setSceneError(sceneId, error);
  },
  toggleScenePanel(sceneId: string, panel: any) {
    useProjectStore.getState().toggleScenePanel(sceneId, panel);
  },
  setScenePanelState(sceneId: string, panel: any, open: boolean) {
    useProjectStore.getState().setScenePanelState(sceneId, panel, open);
  },
  setSceneUiState(sceneId: string, updater: any) {
    useProjectStore.getState().setSceneUiState(sceneId, updater);
  },
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ServiceProvider registry={makeRegistry()}>{children}</ServiceProvider>
);

describe("useMediaTasks", () => {
  beforeEach(() => {
    const store = useProjectStore.getState();
    // @ts-ignore
    store._services = null;
    useProjectStore.setState({
      projects: [],
      isProjectsLoading: false,
      activeProjectId: "p1",
      isProjectLoading: false,
      scenes: [makeDomainScene("a", 0)],
      groups: [],
      tags: [],
      activeGroupFilter: null,
      activeTagFilter: null,
      chatHistory: [],
      settings: defaultSettings,
      welcomeMessage: { role: "model", text: "hi" },
      defaultSettings,
      toasts: [],
    });
  });

  it("updates scene record after image generation", async () => {
    const Test: React.FC = () => {
      const { generateImage } = useMediaTasks({
        projectState: ProjectStateShim,
      });
      useEffect(() => {
        void generateImage("a", []);
      }, [generateImage]);
      return null;
    };
    render(
      <Wrapper>
        <Test />
      </Wrapper>
    );
    await Promise.resolve();
    await Promise.resolve();
    const scene = useProjectStore.getState().scenes.find((s) => s.id === "a");
    expect(scene).toBeTruthy();
  });
});

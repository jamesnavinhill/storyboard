import React, { useEffect } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ServiceProvider } from "../../../../services/registry";
import type { ServiceRegistry, SceneRecord } from "../../../../types/services";
import { useStoryboardGeneration } from "../useStoryboardGeneration";
import { useProjectStore } from "../../../project/state/projectStore";
import type { Settings, ChatMessage } from "../../../../types";

const defaultSettings: Settings = {
  sceneCount: 8,
  chatModel: "gemini-2.5-pro",
  imageModel: "imagen-4.0-generate-001",
  videoModel: "veo-3.0-generate-001",
  workflow: "music-video",
  videoAutoplay: "on-generate",
  videoResolution: "1080p",
};

const makeScene = (id: string, orderIndex: number): SceneRecord => ({
  id,
  projectId: "p1",
  description: id,
  aspectRatio: "16:9",
  orderIndex,
  createdAt: "",
  updatedAt: "",
});

const makeRegistry = (): ServiceRegistry => ({
  chatProvider: {
    async generateResponse() {
      return "";
    },
  },
  storyboardGenerator: {
    async generateScenes() {
      return {
        scenes: [{ description: "one" }, { description: "two" }],
        modelResponse: "ok",
      };
    },
    async regenerateDescription() {
      return "new";
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
      throw new Error("not used");
    },
    async editImage() {
      throw new Error("not used");
    },
    async suggestVideoPrompt() {
      return "";
    },
    async suggestImageEditPrompt() {
      return "";
    },
    async generateVideo() {
      throw new Error("not used");
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
    async createScenes(_pid, scenes) {
      return scenes.map((s, i) => makeScene(`n${i}`, s.orderIndex ?? i));
    },
    async updateScene(_pid, _sid, updates) {
      return { ...makeScene("a", 0), ...updates } as SceneRecord;
    },
    async appendChatMessage() {
      return {
        id: "c1",
        projectId: "p1",
        role: "user",
        text: "",
        createdAt: "",
      };
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
  get chatHistory() {
    return useProjectStore.getState().chatHistory;
  },
  get settings() {
    return useProjectStore.getState().settings;
  },
  appendChatMessage(msg: ChatMessage) {
    useProjectStore.getState().appendChatMessage(msg);
  },
  appendSceneRecords(records: SceneRecord[]) {
    useProjectStore.getState().appendSceneRecords(records);
  },
  updateSceneRecord(record: SceneRecord) {
    useProjectStore.getState().updateSceneRecord(record);
  },
  setSceneActivity(sceneId: string, activity: any) {
    useProjectStore.getState().setSceneActivity(sceneId, activity);
  },
  resetSceneState(sceneId: string) {
    useProjectStore.getState().resetSceneState(sceneId);
  },
  setSceneError(sceneId: string, error: any) {
    useProjectStore.getState().setSceneError(sceneId, error);
  },
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ServiceProvider registry={makeRegistry()}>{children}</ServiceProvider>
);

describe("useStoryboardGeneration", () => {
  beforeEach(() => {
    const store = useProjectStore.getState();
    // @ts-ignore
    store._services = null;
    useProjectStore.setState({
      projects: [],
      isProjectsLoading: false,
      activeProjectId: "p1",
      isProjectLoading: false,
      scenes: [],
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

  it("persists generated scenes and appends to store", async () => {
    const Test: React.FC = () => {
      const { submitConcept } = useStoryboardGeneration({
        projectState: ProjectStateShim,
      });
      useEffect(() => {
        void submitConcept({
          text: "idea",
          aspectRatio: "16:9",
          selectedStyles: [],
          entryPoint: "agent:generate",
        });
      }, [submitConcept]);
      return null;
    };
    render(
      <Wrapper>
        <Test />
      </Wrapper>
    );
    await waitFor(() => {
      expect(useProjectStore.getState().scenes.length).toBeGreaterThan(1);
    });
  });
});

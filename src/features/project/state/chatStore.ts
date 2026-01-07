import type { StateCreator } from "zustand";
import type { ChatMessage, Settings } from "../../../types";
import type { ChatRecord } from "../../../types/services";
import type { ProjectServices } from "../services/projectServices";
import type { ProjectStoreState } from "./projectStore";

// Helper function to create chat message from record
export const createChatMessage = (record: ChatRecord): ChatMessage => ({
  role: record.role,
  text: record.text,
  image: record.imageUrl ?? undefined,
});

// Chat slice state interface
export interface ChatSlice {
  chatHistory: ChatMessage[];
  settings: Settings;
  welcomeMessage: ChatMessage;
  defaultSettings: Settings;

  // Chat operations
  appendChatMessage: (message: ChatMessage) => void;
  replaceChatHistory: (messages: ChatMessage[]) => void;

  // Settings operations
  setSettings: (
    updater: Settings | ((prev: Settings) => Settings)
  ) => Promise<void>;
}

// Type for accessing other store slices
type StoreGetter = () => {
  _services: ProjectServices | null;
  activeProjectId: string | null;
  settings: Settings;
  defaultSettings: Settings;
};

export const createChatSlice: StateCreator<ChatSlice, [], [], ChatSlice> = (
  set,
  get
) => ({
  chatHistory: [],
  settings: {
    sceneCount: 8,
    chatModel: "gemini-2.5-pro",
    imageModel: "imagen-4.0-generate-001",
    videoModel: "veo-3.1-generate-preview",
    workflow: "music-video",
    videoAutoplay: "on-generate",
    videoResolution: "1080p",
    videoDuration: 8,
  },
  welcomeMessage: { role: "model", text: "Welcome", image: undefined },
  defaultSettings: {
    sceneCount: 8,
    chatModel: "gemini-2.5-pro",
    imageModel: "imagen-4.0-generate-001",
    videoModel: "veo-3.1-generate-preview",
    workflow: "music-video",
    videoAutoplay: "on-generate",
    videoResolution: "1080p",
    videoDuration: 8,
  },

  appendChatMessage: (message) =>
    set((s) => ({ chatHistory: [...s.chatHistory, message] })),

  replaceChatHistory: (messages) => set({ chatHistory: messages }),

  setSettings: async (updater) => {
    // 1. Update local state immediately
    set((s) => ({
      settings:
        typeof updater === "function"
          ? (updater as (v: Settings) => Settings)(s.settings)
          : updater,
    }));

    // 2. Persist to backend
    const state = get() as unknown as ProjectStoreState;
    const services = state._services;
    const activeProjectId = state.activeProjectId;
    const currentSettings = state.settings;

    if (!services || !activeProjectId) return;

    await services.upsertSettings(activeProjectId, currentSettings);
  },
});

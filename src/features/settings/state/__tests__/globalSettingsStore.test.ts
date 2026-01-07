import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "../settingsStore";
import type { Settings } from "../../../../types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Global Settings Store", () => {
  beforeEach(() => {
    localStorageMock.clear();
    useSettingsStore.setState({
      globalSettings: {
        sceneCount: 8,
        chatModel: "gemini-2.5-pro",
        imageModel: "imagen-4.0-generate-001",
        videoModel: "veo-3.1-generate-preview",
        workflow: "music-video",
        videoAutoplay: "on-generate",
        videoResolution: "1080p",
        videoDuration: 8,
      },
    });
  });

  it("should initialize with default settings", () => {
    const { globalSettings } = useSettingsStore.getState();

    expect(globalSettings).toEqual({
      sceneCount: 8,
      chatModel: "gemini-2.5-pro",
      imageModel: "imagen-4.0-generate-001",
      videoModel: "veo-3.1-generate-preview",
      workflow: "music-video",
      videoAutoplay: "on-generate",
      videoResolution: "1080p",
      videoDuration: 8,
    });
  });

  it("should update global settings", () => {
    const { updateGlobalSettings } = useSettingsStore.getState();

    updateGlobalSettings({ sceneCount: 5 });

    const { globalSettings } = useSettingsStore.getState();
    expect(globalSettings.sceneCount).toBe(5);
  });

  it("should update multiple settings at once", () => {
    const { updateGlobalSettings } = useSettingsStore.getState();

    updateGlobalSettings({
      sceneCount: 6,
      chatModel: "gemini-2.5-flash",
      workflow: "product-commercial",
    });

    const { globalSettings } = useSettingsStore.getState();
    expect(globalSettings.sceneCount).toBe(6);
    expect(globalSettings.chatModel).toBe("gemini-2.5-flash");
    expect(globalSettings.workflow).toBe("product-commercial");
  });

  it("should reset to default settings", () => {
    const { updateGlobalSettings, resetGlobalSettings } =
      useSettingsStore.getState();

    // Change settings
    updateGlobalSettings({
      sceneCount: 3,
      chatModel: "gemini-2.5-flash-lite",
    });

    // Reset
    resetGlobalSettings();

    const { globalSettings } = useSettingsStore.getState();
    expect(globalSettings).toEqual({
      sceneCount: 8,
      chatModel: "gemini-2.5-pro",
      imageModel: "imagen-4.0-generate-001",
      videoModel: "veo-3.1-generate-preview",
      workflow: "music-video",
      videoAutoplay: "on-generate",
      videoResolution: "1080p",
      videoDuration: 8,
    });
  });

  it("should include all required fields", () => {
    const { globalSettings } = useSettingsStore.getState();

    // Verify model selection fields
    expect(globalSettings).toHaveProperty("chatModel");
    expect(globalSettings).toHaveProperty("imageModel");
    expect(globalSettings).toHaveProperty("videoModel");

    // Verify app preferences
    expect(globalSettings).toHaveProperty("videoAutoplay");
    expect(globalSettings).toHaveProperty("videoResolution");
    expect(globalSettings).toHaveProperty("videoDuration");

    // Verify additional fields
    expect(globalSettings).toHaveProperty("sceneCount");
    expect(globalSettings).toHaveProperty("workflow");
  });
});

import type { StateCreator } from "zustand";
import type { Settings } from "../../../types";
import { safeGet, safeSet } from "../../../utils/localStorage";
import { debounce } from "../../../utils/debounce";

const STORAGE_KEY = "vb:settings:global";

// Default global settings
const DEFAULT_GLOBAL_SETTINGS: Settings = {
  sceneCount: 8,
  chatModel: "gemini-2.5-pro",
  imageModel: "imagen-4.0-generate-001",
  videoModel: "veo-3.1-generate-preview",
  workflow: "music-video",
  videoAutoplay: "on-generate",
  videoResolution: "1080p",
  videoDuration: 8,
};

// Load persisted settings from localStorage
function loadPersistedSettings(): Settings {
  if (typeof window === "undefined") {
    return DEFAULT_GLOBAL_SETTINGS;
  }

  try {
    const stored = safeGet(STORAGE_KEY, null);
    if (!stored) {
      return DEFAULT_GLOBAL_SETTINGS;
    }

    const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_GLOBAL_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.warn("Failed to load persisted settings:", error);
    return DEFAULT_GLOBAL_SETTINGS;
  }
}

// Persist settings to localStorage with debouncing (500ms)
const debouncedPersist = debounce(
  (settings: Settings) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      safeSet(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to persist settings:", error);
    }
  },
  { delay: 500 }
);

// Global settings slice state interface
export interface GlobalSettingsSlice {
  globalSettings: Settings;
  updateGlobalSettings: (updates: Partial<Settings>) => void;
  resetGlobalSettings: () => void;
}

export const createGlobalSettingsSlice: StateCreator<
  GlobalSettingsSlice,
  [],
  [],
  GlobalSettingsSlice
> = (set) => ({
  globalSettings: loadPersistedSettings(),

  updateGlobalSettings: (updates) => {
    set((state) => {
      const newSettings = {
        ...state.globalSettings,
        ...updates,
      };

      // Persist to localStorage with debouncing
      debouncedPersist(newSettings);

      return { globalSettings: newSettings };
    });
  },

  resetGlobalSettings: () => {
    set({ globalSettings: DEFAULT_GLOBAL_SETTINGS });
    debouncedPersist(DEFAULT_GLOBAL_SETTINGS);
  },
});

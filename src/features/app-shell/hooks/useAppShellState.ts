import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ChatAgent,
  ChatMessage,
  PresetStyle,
  Settings,
} from "../../../types";
import { useProjectState } from "../../project/state/useProjectState";
import { useChatResponse } from "../../generation/hooks/useChatResponse";
import { useStoryboardGeneration } from "../../generation/hooks/useStoryboardGeneration";
import { useMediaTasks } from "../../generation/hooks/useMediaTasks";
import { useLayout } from "../../layout";
import { useSceneActions, useSceneManager } from "../../scene/hooks";
import { useProjectActions } from "../../project/hooks";
import { useLibraryState } from "../../library/hooks/useLibraryState";
import { useSessionOverrides } from "./useSessionOverrides";
import { useToastBridge } from "./useToastBridge";

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

const welcomeMessage: ChatMessage = {
  role: "model",
  text: "Welcome to StoryBoard! Use 'Storyboard' mode to generate scenes from your concept, or switch to 'Chat' mode to brainstorm and refine your ideas first.",
};

export interface AppShellState {
  // Project state
  project: ReturnType<typeof useProjectState>;

  // Layout state
  layout: ReturnType<typeof useLayout>;

  // Scene state
  scene: {
    actions: ReturnType<typeof useSceneActions>;
    manager: ReturnType<typeof useSceneManager>;
  };

  // Library state
  library: ReturnType<typeof useLibraryState>;

  // Generation state
  generation: {
    chat: ReturnType<typeof useChatResponse>;
    storyboard: ReturnType<typeof useStoryboardGeneration>;
    media: ReturnType<typeof useMediaTasks>;
  };

  // Project actions
  projectActions: ReturnType<typeof useProjectActions>;

  // UI state
  ui: {
    aspectRatio: "16:9" | "9:16" | "1:1";
    setAspectRatio: (ratio: "16:9" | "9:16" | "1:1") => void;
    selectedStyles: PresetStyle[];
    setSelectedStyles: (styles: PresetStyle[]) => void;
    selectedTemplateIds: string[];
    setSelectedTemplateIds: (templateIds: string[]) => void;
    chatAgent: ChatAgent;
    setChatAgent: (agent: ChatAgent) => void;
    managerTopTab: "library" | "details" | "groups-tags" | "history";
    setManagerTopTab: (
      tab: "library" | "details" | "groups-tags" | "history"
    ) => void;
    groupTagSubTab: "groups" | "tags";
    setGroupTagSubTab: (tab: "groups" | "tags") => void;
    mobileView: "chat" | "storyboard";
    setMobileView: (view: "chat" | "storyboard") => void;
    currentView: "storyboard" | "library" | "document";
    setCurrentView: (view: "storyboard" | "library" | "document") => void;
    isSettingsSheetOpen: boolean;
    setSettingsSheetOpen: (open: boolean) => void;
    settingsTab: "workflow" | "models" | "templates" | "app";
    setSettingsTab: (tab: "workflow" | "models" | "templates" | "app") => void;
  };

  // Session state
  session: {
    overrides: Partial<Settings>;
    setOverrides: (
      overrides:
        | Partial<Settings>
        | ((prev: Partial<Settings>) => Partial<Settings>)
    ) => void;
    effectiveSettings: Settings;
  };

  // Computed state
  computed: {
    filteredScenes: ReturnType<typeof useProjectState>["scenes"];
    filtersActive: boolean;
    hasImagesToExport: boolean;
    isBusy: boolean;
    loadingText: string;
  };
}

export const useAppShellState = (): AppShellState => {
  // Session overrides
  const [sessionOverrides, setSessionOverrides] = useSessionOverrides();

  // Core project state
  const projectState = useProjectState({
    defaultSettings,
    welcomeMessage,
  });

  // Layout management
  const layout = useLayout();

  // Generation hooks
  const chat = useChatResponse({ projectState, sessionOverrides });
  const storyboardGen = useStoryboardGeneration({
    projectState,
    sessionOverrides,
  });
  const media = useMediaTasks({ projectState, sessionOverrides });

  // UI state
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">(
    "16:9"
  );
  const [selectedStyles, setSelectedStyles] = useState<PresetStyle[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [chatAgent, setChatAgent] = useState<ChatAgent>("generate");
  const [managerTopTab, setManagerTopTab] = useState<
    "library" | "details" | "groups-tags" | "history"
  >(() => {
    if (typeof window === "undefined") {
      return "library";
    }
    const stored = window.localStorage.getItem("vb:lmd:topTab");
    return stored === "details" ||
      stored === "groups-tags" ||
      stored === "history"
      ? stored
      : "library";
  });
  const [groupTagSubTab, setGroupTagSubTab] = useState<"groups" | "tags">(
    () => {
      if (typeof window === "undefined") {
        return "groups";
      }
      const stored = window.localStorage.getItem("vb:lmd:gtSub");
      return stored === "tags" ? "tags" : "groups";
    }
  );
  const [mobileView, setMobileView] = useState<"chat" | "storyboard">("chat");
  const [currentView, setCurrentView] = useState<
    "storyboard" | "library" | "document"
  >(() => {
    if (typeof window === "undefined") {
      return "storyboard";
    }
    const stored = window.localStorage.getItem("vb:ui:currentView");
    if (stored === "library" || stored === "document") {
      return stored;
    }
    return "storyboard";
  });
  const [isSettingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "workflow" | "models" | "templates" | "app"
  >("workflow");

  // Persist UI state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("vb:lmd:topTab", managerTopTab);
    } catch { }
  }, [managerTopTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("vb:lmd:gtSub", groupTagSubTab);
    } catch { }
  }, [groupTagSubTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("vb:ui:currentView", currentView);
    } catch { }
  }, [currentView]);

  // Library state
  const library = useLibraryState({
    projects: projectState.projects,
    scenes: projectState.scenes.map((s) => ({
      id: s.id,
      description: s.description,
    })),
  });

  // Scene management hooks
  const sceneActions = useSceneActions({
    activeProjectId: projectState.activeProjectId,
    scenes: projectState.scenes,
    updateSceneRecord: projectState.updateSceneRecord,
    duplicateScene: projectState.duplicateScene,
    deleteScene: projectState.deleteScene,
    createManualScene: projectState.createManualScene,
    assignScenesToGroup: projectState.assignScenesToGroup,
    removeScenesFromGroup: projectState.removeScenesFromGroup,
    assignTagsToScene: projectState.assignTagsToScene,
    removeTagsFromScene: projectState.removeTagsFromScene,
    reorderScenes: projectState.reorderScenes,
  });

  const sceneManager = useSceneManager({
    scenes: projectState.scenes,
    loadSceneHistory: projectState.loadSceneHistory,
    restoreSceneFromHistory: async (sceneId: string, historyId: string) => {
      await projectState.restoreSceneFromHistory(sceneId, historyId);
    },
    isSceneManagerCollapsed: layout.isSceneManagerCollapsed,
    toggleSceneManagerCollapse: layout.toggleSceneManagerCollapse,
  });

  // Project management actions
  const projectActions = useProjectActions({
    createProject: projectState.createProject,
    renameProject: projectState.renameProject,
    deleteProject: projectState.deleteProject,
    exportProject: projectState.exportProject,
    importProject: projectState.importProject,
    selectProject: projectState.selectProject,
    projectsLength: projectState.projects.length,
    onProjectCreated: () => {
      setSelectedStyles([]);
      setAspectRatio("16:9");
      setMobileView("chat");
    },
    onProjectSelected: () => {
      setMobileView("chat");
    },
  });

  // Bridge store toasts to UI
  useToastBridge(projectState.__toasts, projectState.__dequeueToast);

  // Compute effective settings
  const effectiveSettings: Settings = useMemo(() => {
    return {
      ...projectState.settings,
      ...sessionOverrides,
    } as Settings;
  }, [projectState.settings, sessionOverrides]);

  // Computed state
  const filteredScenes = useMemo(() => {
    if (!projectState.activeGroupFilter && !projectState.activeTagFilter) {
      return projectState.scenes;
    }
    return projectState.scenes.filter((scene) => {
      const matchesGroup = !projectState.activeGroupFilter
        ? true
        : scene.groupId === projectState.activeGroupFilter ||
        scene.groupIds?.includes(projectState.activeGroupFilter);
      const matchesTag = !projectState.activeTagFilter
        ? true
        : (scene.tagIds ?? []).includes(projectState.activeTagFilter);
      return matchesGroup && matchesTag;
    });
  }, [
    projectState.scenes,
    projectState.activeGroupFilter,
    projectState.activeTagFilter,
  ]);

  const filtersActive = Boolean(
    projectState.activeGroupFilter || projectState.activeTagFilter
  );
  const hasImagesToExport = projectState.scenes.some(
    (scene) => !!scene.imageUrl
  );
  const isBusy =
    chat.isBusy || storyboardGen.isBusy || projectState.isProjectLoading;
  const loadingText =
    chatAgent === "generate"
      ? "Generating ideas..."
      : chatAgent === "chat"
        ? "Gathering guidance..."
        : "Thinking...";

  // Prevent body scroll when settings sheet is open
  useEffect(() => {
    if (!isSettingsSheetOpen) {
      return;
    }
    if (typeof document === "undefined") {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isSettingsSheetOpen]);

  // Clear autoplayPending when a video starts playing
  useEffect(() => {
    function onClear(ev: Event) {
      const e = ev as CustomEvent<{ sceneId: string }>;
      const id = e.detail?.sceneId;
      if (!id) return;
      projectState.setSceneUiState(id, (state) =>
        state.autoplayPending ? { ...state, autoplayPending: false } : state
      );
    }
    window.addEventListener(
      "scene:clearAutoplayPending",
      onClear as EventListener
    );
    return () =>
      window.removeEventListener(
        "scene:clearAutoplayPending",
        onClear as EventListener
      );
  }, [projectState]);

  return {
    project: projectState,
    layout,
    scene: {
      actions: sceneActions,
      manager: sceneManager,
    },
    library,
    generation: {
      chat,
      storyboard: storyboardGen,
      media,
    },
    projectActions,
    ui: {
      aspectRatio,
      setAspectRatio,
      selectedStyles,
      setSelectedStyles,
      selectedTemplateIds,
      setSelectedTemplateIds,
      chatAgent,
      setChatAgent,
      managerTopTab,
      setManagerTopTab,
      groupTagSubTab,
      setGroupTagSubTab,
      mobileView,
      setMobileView,
      currentView,
      setCurrentView,
      isSettingsSheetOpen,
      setSettingsSheetOpen,
      settingsTab,
      setSettingsTab,
    },
    session: {
      overrides: sessionOverrides,
      setOverrides: setSessionOverrides,
      effectiveSettings,
    },
    computed: {
      filteredScenes,
      filtersActive,
      hasImagesToExport,
      isBusy,
      loadingText,
    },
  };
};

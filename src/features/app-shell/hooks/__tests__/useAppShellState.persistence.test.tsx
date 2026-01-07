import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAppShellState } from "../useAppShellState";

// Mock all the dependencies
vi.mock("../../project/state/useProjectState");
vi.mock("../../generation/hooks/useChatResponse");
vi.mock("../../generation/hooks/useStoryboardGeneration");
vi.mock("../../generation/hooks/useMediaTasks");
vi.mock("../../layout");
vi.mock("../../scene/hooks");
vi.mock("../../project/hooks");
vi.mock("../../library/hooks/useLibraryState");
vi.mock("./useSessionOverrides");
vi.mock("./useToastBridge");

describe("useAppShellState - UI State Persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe("Chat agent persistence", () => {
    it("should initialize with default chat agent when no persisted value exists", () => {
      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.chatAgent).toBe("generate");
    });

    it("should restore chat agent from localStorage", () => {
      window.localStorage.setItem("vb:ui:chatAgent", "chat");

      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.chatAgent).toBe("chat");
    });

    it("should persist chat agent changes to localStorage", async () => {
      const { result } = renderHook(() => useAppShellState());

      act(() => {
        result.current.ui.setChatAgent("chat");
      });

      await waitFor(() => {
        const stored = window.localStorage.getItem("vb:ui:chatAgent");
        expect(stored).toBe("chat");
      });
    });

    it("should persist chat agent as 'extend'", async () => {
      const { result } = renderHook(() => useAppShellState());

      act(() => {
        result.current.ui.setChatAgent("extend");
      });

      await waitFor(() => {
        const stored = window.localStorage.getItem("vb:ui:chatAgent");
        expect(stored).toBe("extend");
      });
    });
  });

  describe("Current view persistence", () => {
    it("should initialize with default view when no persisted value exists", () => {
      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.currentView).toBe("storyboard");
    });

    it("should restore current view from localStorage", () => {
      window.localStorage.setItem("vb:ui:currentView", "library");

      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.currentView).toBe("library");
    });

    it("should restore document view from localStorage", () => {
      window.localStorage.setItem("vb:ui:currentView", "document");

      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.currentView).toBe("document");
    });

    it("should persist current view changes to localStorage", async () => {
      const { result } = renderHook(() => useAppShellState());

      act(() => {
        result.current.ui.setCurrentView("library");
      });

      await waitFor(() => {
        const stored = window.localStorage.getItem("vb:ui:currentView");
        expect(stored).toBe("library");
      });
    });

    it("should persist document view to localStorage", async () => {
      const { result } = renderHook(() => useAppShellState());

      act(() => {
        result.current.ui.setCurrentView("document");
      });

      await waitFor(() => {
        const stored = window.localStorage.getItem("vb:ui:currentView");
        expect(stored).toBe("document");
      });
    });

    it("should fall back to storyboard for invalid persisted view", () => {
      window.localStorage.setItem("vb:ui:currentView", "invalid");

      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.currentView).toBe("storyboard");
    });
  });

  describe("Aspect ratio persistence", () => {
    it("should initialize with default aspect ratio", () => {
      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.aspectRatio).toBe("16:9");
    });

    it("should restore aspect ratio from localStorage", () => {
      window.localStorage.setItem("vb:ui:aspectRatio", "9:16");

      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.aspectRatio).toBe("9:16");
    });

    it("should persist aspect ratio changes to localStorage", async () => {
      const { result } = renderHook(() => useAppShellState());

      act(() => {
        result.current.ui.setAspectRatio("9:16");
      });

      await waitFor(() => {
        const stored = window.localStorage.getItem("vb:ui:aspectRatio");
        expect(stored).toBe("9:16");
      });
    });
  });

  describe("Manager tab persistence", () => {
    it("should initialize with default manager tab", () => {
      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.managerTopTab).toBe("library");
    });

    it("should restore manager tab from localStorage", () => {
      window.localStorage.setItem("vb:lmd:topTab", "details");

      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.managerTopTab).toBe("details");
    });

    it("should persist manager tab changes to localStorage", async () => {
      const { result } = renderHook(() => useAppShellState());

      act(() => {
        result.current.ui.setManagerTopTab("groups-tags");
      });

      await waitFor(() => {
        const stored = window.localStorage.getItem("vb:lmd:topTab");
        expect(stored).toBe("groups-tags");
      });
    });
  });

  describe("Group/Tag sub-tab persistence", () => {
    it("should initialize with default sub-tab", () => {
      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.groupTagSubTab).toBe("groups");
    });

    it("should restore sub-tab from localStorage", () => {
      window.localStorage.setItem("vb:lmd:gtSub", "tags");

      const { result } = renderHook(() => useAppShellState());

      expect(result.current.ui.groupTagSubTab).toBe("tags");
    });

    it("should persist sub-tab changes to localStorage", async () => {
      const { result } = renderHook(() => useAppShellState());

      act(() => {
        result.current.ui.setGroupTagSubTab("tags");
      });

      await waitFor(() => {
        const stored = window.localStorage.getItem("vb:lmd:gtSub");
        expect(stored).toBe("tags");
      });
    });
  });
});

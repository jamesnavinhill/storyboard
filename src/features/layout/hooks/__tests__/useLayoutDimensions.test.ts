import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLayoutDimensions } from "../useLayoutDimensions";
import { LAYOUT_STORAGE_KEYS } from "../../utils/layoutConstants";

describe("useLayoutDimensions - Layout Initialization and Persistence", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe("Default layout values on first load", () => {
    it("should initialize with default sidebar width when no persisted value exists", () => {
      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sidebarWidth).toBe(288);
    });

    it("should initialize with default chat width when no persisted value exists", () => {
      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.chatWidth).toBe(420);
    });

    it("should initialize with default scene manager width when no persisted value exists", () => {
      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sceneManagerWidth).toBe(440);
    });
  });

  describe("Layout state restoration from localStorage", () => {
    it("should restore sidebar width from localStorage", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sidebarWidth, "350");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sidebarWidth).toBe(350);
    });

    it("should restore chat width from localStorage", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.chatWidth, "500");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.chatWidth).toBe(500);
    });

    it("should restore scene manager width from localStorage", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sceneManagerWidth, "380");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sceneManagerWidth).toBe(380);
    });

    it("should restore all dimensions from localStorage", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sidebarWidth, "300");
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.chatWidth, "450");
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sceneManagerWidth, "400");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sidebarWidth).toBe(300);
      expect(result.current.chatWidth).toBe(450);
      expect(result.current.sceneManagerWidth).toBe(400);
    });
  });

  describe("Invalid persisted values falling back to defaults", () => {
    it("should fall back to default when sidebar width is invalid", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sidebarWidth, "invalid");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sidebarWidth).toBe(288);
    });

    it("should fall back to default when chat width is invalid", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.chatWidth, "NaN");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.chatWidth).toBe(420);
    });

    it("should fall back to default when scene manager width is invalid", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sceneManagerWidth, "");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sceneManagerWidth).toBe(440);
    });

    it("should clamp sidebar width below minimum to minimum value", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sidebarWidth, "100");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sidebarWidth).toBe(240); // SIDEBAR_MIN_WIDTH
    });

    it("should clamp sidebar width above maximum to maximum value", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sidebarWidth, "500");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sidebarWidth).toBe(420); // SIDEBAR_MAX_WIDTH
    });

    it("should clamp chat width below minimum to minimum value", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.chatWidth, "200");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.chatWidth).toBe(320); // CHAT_MIN_WIDTH
    });

    it("should clamp chat width above maximum to maximum value", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.chatWidth, "800");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.chatWidth).toBe(720); // CHAT_MAX_WIDTH
    });

    it("should clamp scene manager width below minimum to minimum value", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sceneManagerWidth, "200");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sceneManagerWidth).toBe(320); // SCENE_MANAGER_MIN_WIDTH
    });

    it("should clamp scene manager width above maximum to maximum value", () => {
      window.localStorage.setItem(LAYOUT_STORAGE_KEYS.sceneManagerWidth, "700");

      const { result } = renderHook(() => useLayoutDimensions());

      expect(result.current.sceneManagerWidth).toBe(600); // SCENE_MANAGER_MAX_WIDTH
    });
  });
});

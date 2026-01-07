import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionOverrides } from "../useSessionOverrides";

describe("useSessionOverrides - Session Settings Management", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe("Session overrides not persisting", () => {
    it("should initialize with empty overrides", () => {
      const { result } = renderHook(() => useSessionOverrides());

      expect(result.current[0]).toEqual({});
    });

    it("should allow setting session overrides", () => {
      const { result } = renderHook(() => useSessionOverrides());

      act(() => {
        result.current[1]({ chatModel: "gemini-2.0-flash" });
      });

      expect(result.current[0]).toEqual({ chatModel: "gemini-2.0-flash" });
    });

    it("should not persist session overrides to localStorage", () => {
      const { result } = renderHook(() => useSessionOverrides());

      act(() => {
        result.current[1]({ chatModel: "gemini-2.0-flash", temperature: 0.8 });
      });

      // Check that overrides are not in localStorage
      const storedChatModel = window.localStorage.getItem("vb:ui:chatModel");
      const storedTemp = window.localStorage.getItem("vb:ui:temperature");

      expect(storedChatModel).toBeNull();
      expect(storedTemp).toBeNull();
    });

    it("should allow updating session overrides", () => {
      const { result } = renderHook(() => useSessionOverrides());

      act(() => {
        result.current[1]({ chatModel: "gemini-2.0-flash" });
      });

      expect(result.current[0]).toEqual({ chatModel: "gemini-2.0-flash" });

      act(() => {
        result.current[1]({ temperature: 0.7 });
      });

      expect(result.current[0]).toEqual({ temperature: 0.7 });
    });

    it("should allow clearing session overrides", () => {
      const { result } = renderHook(() => useSessionOverrides());

      act(() => {
        result.current[1]({ chatModel: "gemini-2.0-flash", temperature: 0.8 });
      });

      expect(result.current[0]).toEqual({
        chatModel: "gemini-2.0-flash",
        temperature: 0.8,
      });

      act(() => {
        result.current[1]({});
      });

      expect(result.current[0]).toEqual({});
    });

    it("should reset overrides on unmount", () => {
      const { result, unmount } = renderHook(() => useSessionOverrides());

      act(() => {
        result.current[1]({ chatModel: "gemini-2.0-flash" });
      });

      expect(result.current[0]).toEqual({ chatModel: "gemini-2.0-flash" });

      unmount();

      // Remount and verify overrides are gone
      const { result: newResult } = renderHook(() => useSessionOverrides());
      expect(newResult.current[0]).toEqual({});
    });
  });

  describe("Settings priority resolution", () => {
    it("should support function-based updates", () => {
      const { result } = renderHook(() => useSessionOverrides());

      act(() => {
        result.current[1]({ chatModel: "gemini-2.0-flash" });
      });

      act(() => {
        result.current[1]((prev) => ({ ...prev, temperature: 0.9 }));
      });

      expect(result.current[0]).toEqual({
        chatModel: "gemini-2.0-flash",
        temperature: 0.9,
      });
    });

    it("should allow partial overrides", () => {
      const { result } = renderHook(() => useSessionOverrides());

      act(() => {
        result.current[1]({
          chatModel: "gemini-2.0-flash",
          imageModel: "imagen-4.0-generate-001",
          temperature: 0.7,
        });
      });

      expect(result.current[0]).toEqual({
        chatModel: "gemini-2.0-flash",
        imageModel: "imagen-4.0-generate-001",
        temperature: 0.7,
      });
    });
  });
});

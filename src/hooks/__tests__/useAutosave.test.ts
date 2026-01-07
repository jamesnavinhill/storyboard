import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutosave } from "../useAutosave";

describe("useAutosave - Autosave Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Hook initialization", () => {
    it("should initialize with default state", () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ data: "initial", onSave, delay: 2000 })
      );

      expect(result.current.isSaving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.forceSave).toBe("function");
    });

    it("should not trigger save on initial mount", () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderHook(() => useAutosave({ data: "initial", onSave, delay: 2000 }));

      // Should not have called save on mount
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Force save functionality", () => {
    it("should allow force save immediately", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ data: "test data", onSave, delay: 2000 })
      );

      // Force save without waiting for debounce
      await act(async () => {
        await result.current.forceSave();
      });

      expect(onSave).toHaveBeenCalledWith("test data");
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("should save current data when force save is called", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result, rerender } = renderHook(
        ({ data }) => useAutosave({ data, onSave, delay: 2000 }),
        { initialProps: { data: "initial" } }
      );

      // Update data
      rerender({ data: "updated data" });

      // Force save
      await act(async () => {
        await result.current.forceSave();
      });

      expect(onSave).toHaveBeenCalledWith("updated data");
    });

    it("should work with complex data types", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const complexData = {
        name: "Test",
        items: [1, 2, 3],
        nested: { value: true },
      };

      const { result } = renderHook(() =>
        useAutosave({ data: complexData, onSave, delay: 2000 })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      expect(onSave).toHaveBeenCalledWith(complexData);
    });
  });

  describe("Autosave error handling", () => {
    it("should set error state when save fails", async () => {
      const error = new Error("Save failed");
      const onSave = vi.fn().mockRejectedValue(error);
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000 })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
    });

    it("should clear error on successful save", async () => {
      const error = new Error("Save failed");
      const onSave = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000 })
      );

      // First save fails
      await act(async () => {
        await result.current.forceSave();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      // Second save succeeds
      await act(async () => {
        await result.current.forceSave();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it("should set isSaving to false after error", async () => {
      const error = new Error("Save failed");
      const onSave = vi.fn().mockRejectedValue(error);
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000 })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
        expect(result.current.error).toEqual(error);
      });
    });

    it("should handle non-Error exceptions", async () => {
      const onSave = vi.fn().mockRejectedValue("String error");
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000 })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("Save failed");
      });
    });
  });

  describe("Saving state tracking", () => {
    it("should set isSaving to true during save", async () => {
      let resolveSave: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      const onSave = vi.fn().mockReturnValue(savePromise);

      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000 })
      );

      // Start save
      act(() => {
        void result.current.forceSave();
      });

      // Should be saving
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      // Complete save
      await act(async () => {
        resolveSave!();
        await savePromise;
      });
    });

    it("should set isSaving to false after save completes", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000 })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });

    it("should update lastSaved timestamp after successful save", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000 })
      );

      expect(result.current.lastSaved).toBeNull();

      await act(async () => {
        await result.current.forceSave();
      });

      await waitFor(() => {
        expect(result.current.lastSaved).toBeInstanceOf(Date);
      });
    });

    it("should not update lastSaved on failed save", async () => {
      const onSave = vi.fn().mockRejectedValue(new Error("Failed"));
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000 })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      await waitFor(() => {
        expect(result.current.lastSaved).toBeNull();
      });
    });
  });

  describe("Enabled/disabled state", () => {
    it("should respect enabled flag when true", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000, enabled: true })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      expect(onSave).toHaveBeenCalledWith("test");
    });

    it("should not save when disabled", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 2000, enabled: false })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      // When disabled, even force save won't trigger
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Data changes", () => {
    it("should handle data updates", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result, rerender } = renderHook(
        ({ data }) => useAutosave({ data, onSave, delay: 2000 }),
        { initialProps: { data: "initial" } }
      );

      // Update data
      rerender({ data: "updated" });

      // Force save to verify new data
      await act(async () => {
        await result.current.forceSave();
      });

      expect(onSave).toHaveBeenCalledWith("updated");
    });

    it("should handle multiple data updates", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result, rerender } = renderHook(
        ({ data }) => useAutosave({ data, onSave, delay: 2000 }),
        { initialProps: { data: "v1" } }
      );

      rerender({ data: "v2" });
      rerender({ data: "v3" });
      rerender({ data: "v4" });

      // Force save should use latest data
      await act(async () => {
        await result.current.forceSave();
      });

      expect(onSave).toHaveBeenCalledWith("v4");
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe("Custom delay configuration", () => {
    it("should accept custom delay value", () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 5000 })
      );

      // Hook should initialize successfully with custom delay
      expect(result.current.isSaving).toBe(false);
    });

    it("should accept short delay value", () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ data: "test", onSave, delay: 100 })
      );

      expect(result.current.isSaving).toBe(false);
    });
  });
});

import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useModelCapabilities } from "../useModelCapabilities";

describe("useModelCapabilities", () => {
  it("should return correct capabilities for Veo 3.1 with 16:9", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.1-generate-preview", "16:9")
    );

    expect(result.current.capabilities).toBeDefined();
    expect(result.current.availableResolutions).toEqual(["1080p", "720p"]);
    expect(result.current.availableDurations).toEqual([4, 6, 8]);
    expect(result.current.supportsReferenceImages).toBe(true);
    expect(result.current.supportsLastFrame).toBe(true);
    expect(result.current.supportsExtension).toBe(true);
  });

  it("should return correct capabilities for Veo 3.0 with 9:16", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.0-generate-001", "9:16")
    );

    expect(result.current.availableResolutions).toEqual(["720p"]);
    expect(result.current.supportsReferenceImages).toBe(false);
    expect(result.current.supportsLastFrame).toBe(false);
    expect(result.current.supportsExtension).toBe(false);
  });

  it("should return correct capabilities for Veo 3.0 Fast", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.0-fast-generate-001", "16:9")
    );

    expect(result.current.availableResolutions).toEqual(["720p"]);
    expect(result.current.supportsReferenceImages).toBe(false);
  });

  it("should return empty resolutions for Veo 2.0", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-2.0-generate-001", "16:9")
    );

    expect(result.current.availableResolutions).toEqual([]);
    expect(result.current.capabilities?.supportsResolution).toBe(false);
  });

  it("should correctly validate resolution support", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.1-generate-preview", "16:9")
    );

    expect(result.current.isResolutionSupported("1080p")).toBe(true);
    expect(result.current.isResolutionSupported("720p")).toBe(true);
  });

  it("should correctly validate resolution support for 9:16 on Veo 3.0", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.0-generate-001", "9:16")
    );

    expect(result.current.isResolutionSupported("1080p")).toBe(false);
    expect(result.current.isResolutionSupported("720p")).toBe(true);
  });

  it("should correctly validate duration support", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.1-generate-preview", "16:9")
    );

    expect(result.current.isDurationSupported(4)).toBe(true);
    expect(result.current.isDurationSupported(6)).toBe(true);
    expect(result.current.isDurationSupported(8)).toBe(true);
    expect(result.current.isDurationSupported(10)).toBe(false);
  });

  it("should correctly validate duration constraints for 1080p", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.1-generate-preview", "16:9")
    );

    expect(result.current.isDurationSupported(8, "1080p")).toBe(true);
    expect(result.current.isDurationSupported(6, "1080p")).toBe(false);
    expect(result.current.isDurationSupported(4, "1080p")).toBe(false);
  });

  it("should correctly validate duration constraints for 720p", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.1-generate-preview", "16:9")
    );

    expect(result.current.isDurationSupported(4, "720p")).toBe(true);
    expect(result.current.isDurationSupported(6, "720p")).toBe(true);
    expect(result.current.isDurationSupported(8, "720p")).toBe(true);
  });

  it("should return correct max resolution", () => {
    const { result: result1 } = renderHook(() =>
      useModelCapabilities("veo-3.1-generate-preview", "16:9")
    );
    expect(result1.current.getMaxResolution()).toBe("1080p");

    const { result: result2 } = renderHook(() =>
      useModelCapabilities("veo-3.0-generate-001", "9:16")
    );
    expect(result2.current.getMaxResolution()).toBe("720p");

    const { result: result3 } = renderHook(() =>
      useModelCapabilities("veo-2.0-generate-001", "16:9")
    );
    expect(result3.current.getMaxResolution()).toBeUndefined();
  });

  it("should return correct duration constraints", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("veo-3.1-generate-preview", "16:9")
    );

    expect(result.current.getDurationConstraints("1080p")).toEqual([8]);
    expect(result.current.getDurationConstraints("720p")).toEqual([4, 6, 8]);
  });

  it("should handle unknown model gracefully", () => {
    const { result } = renderHook(() =>
      useModelCapabilities("unknown-model", "16:9")
    );

    expect(result.current.capabilities).toBeUndefined();
    expect(result.current.availableResolutions).toEqual([]);
    expect(result.current.availableDurations).toEqual([]);
    expect(result.current.supportsReferenceImages).toBe(false);
    expect(result.current.supportsLastFrame).toBe(false);
    expect(result.current.supportsExtension).toBe(false);
  });
});

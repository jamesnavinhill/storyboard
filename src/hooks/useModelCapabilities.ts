import { useMemo } from "react";
import {
  MODEL_CAPABILITIES,
  getModelCapabilities,
  type ModelCapabilities,
} from "../constants/videoModelCapabilities";

export interface ModelCapabilitiesResult {
  capabilities: ModelCapabilities | undefined;
  availableResolutions: Array<"1080p" | "720p">;
  availableDurations: number[];
  supportsReferenceImages: boolean;
  supportsLastFrame: boolean;
  supportsExtension: boolean;
  isResolutionSupported: (resolution: "1080p" | "720p") => boolean;
  isDurationSupported: (
    duration: number,
    resolution?: "1080p" | "720p"
  ) => boolean;
  getMaxResolution: () => "1080p" | "720p" | undefined;
  getDurationConstraints: (
    resolution: "1080p" | "720p"
  ) => number[] | undefined;
}

/**
 * Hook to get model capabilities and helper functions for validation
 *
 * @param model - The video model name
 * @param aspectRatio - The aspect ratio (16:9 or 9:16)
 * @returns Object with capabilities and helper functions
 */
export const useModelCapabilities = (
  model: string,
  aspectRatio: "16:9" | "9:16" | "1:1"
): ModelCapabilitiesResult => {
  const capabilities = useMemo(() => getModelCapabilities(model), [model]);

  const availableResolutions = useMemo(() => {
    if (!capabilities || !capabilities.supportsResolution) {
      return [];
    }

    // Video models don't support 1:1 aspect ratio
    if (aspectRatio === "1:1") {
      return [];
    }

    const maxRes =
      capabilities.aspectRatioConstraints[aspectRatio]?.maxResolution;

    // If max is 1080p, both 1080p and 720p are available
    if (maxRes === "1080p") {
      return ["1080p", "720p"] as Array<"1080p" | "720p">;
    }

    // If max is 720p, only 720p is available
    if (maxRes === "720p") {
      return ["720p"] as Array<"1080p" | "720p">;
    }

    return [];
  }, [capabilities, aspectRatio]);

  const availableDurations = useMemo(() => {
    if (!capabilities) {
      return [];
    }

    // Video models don't support 1:1 aspect ratio
    if (aspectRatio === "1:1") {
      return [];
    }

    return (
      capabilities.aspectRatioConstraints[aspectRatio]?.supportedDurations || []
    );
  }, [capabilities, aspectRatio]);

  const supportsReferenceImages = useMemo(
    () => capabilities?.supportsReferenceImages ?? false,
    [capabilities]
  );

  const supportsLastFrame = useMemo(
    () => capabilities?.supportsLastFrame ?? false,
    [capabilities]
  );

  const supportsExtension = useMemo(
    () => capabilities?.supportsExtension ?? false,
    [capabilities]
  );

  const isResolutionSupported = useMemo(
    () => (resolution: "1080p" | "720p") => {
      if (!capabilities || !capabilities.supportsResolution) {
        return false;
      }

      // Video models don't support 1:1 aspect ratio
      if (aspectRatio === "1:1") {
        return false;
      }

      const maxRes =
        capabilities.aspectRatioConstraints[aspectRatio]?.maxResolution;

      // If max is 1080p, both resolutions are supported
      if (maxRes === "1080p") {
        return true;
      }

      // If max is 720p, only 720p is supported
      if (maxRes === "720p") {
        return resolution === "720p";
      }

      return false;
    },
    [capabilities, aspectRatio]
  );

  const isDurationSupported = useMemo(
    () => (duration: number, resolution?: "1080p" | "720p") => {
      if (!capabilities) {
        return false;
      }

      // Video models don't support 1:1 aspect ratio
      if (aspectRatio === "1:1") {
        return false;
      }

      const constraints =
        capabilities.aspectRatioConstraints[aspectRatio]?.durationConstraints;

      // If resolution is specified and has constraints, check those
      if (resolution && constraints) {
        const allowedDurations = constraints[resolution];
        if (allowedDurations && allowedDurations.length > 0) {
          return allowedDurations.includes(duration);
        }
      }

      // Otherwise, check general supported durations
      const supportedDurations =
        capabilities.aspectRatioConstraints[aspectRatio]?.supportedDurations ||
        [];
      return supportedDurations.includes(duration);
    },
    [capabilities, aspectRatio]
  );

  const getMaxResolution = useMemo(
    () => () => {
      if (!capabilities || !capabilities.supportsResolution) {
        return undefined;
      }

      // Video models don't support 1:1 aspect ratio
      if (aspectRatio === "1:1") {
        return undefined;
      }

      return capabilities.aspectRatioConstraints[aspectRatio]?.maxResolution;
    },
    [capabilities, aspectRatio]
  );

  const getDurationConstraints = useMemo(
    () => (resolution: "1080p" | "720p") => {
      if (!capabilities) {
        return undefined;
      }

      // Video models don't support 1:1 aspect ratio
      if (aspectRatio === "1:1") {
        return undefined;
      }

      const constraints =
        capabilities.aspectRatioConstraints[aspectRatio]?.durationConstraints;

      return constraints?.[resolution];
    },
    [capabilities, aspectRatio]
  );

  return {
    capabilities,
    availableResolutions,
    availableDurations,
    supportsReferenceImages,
    supportsLastFrame,
    supportsExtension,
    isResolutionSupported,
    isDurationSupported,
    getMaxResolution,
    getDurationConstraints,
  };
};

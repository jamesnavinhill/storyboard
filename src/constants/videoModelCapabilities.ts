/**
 * Video Model Capabilities (Frontend)
 *
 * This is a frontend-compatible version of the model capabilities matrix.
 * It mirrors the backend validation logic for client-side validation.
 */

export interface ModelCapabilities {
  supportsResolution: boolean;
  supportedResolutions: Array<"1080p" | "720p">;
  supportsReferenceImages: boolean;
  supportsLastFrame: boolean;
  supportsExtension: boolean;
  aspectRatioConstraints: {
    "16:9": {
      maxResolution: "1080p" | "720p";
      supportedDurations: number[];
      durationConstraints?: {
        "1080p"?: number[];
        "720p"?: number[];
      };
    };
    "9:16": {
      maxResolution: "1080p" | "720p";
      supportedDurations: number[];
      durationConstraints?: {
        "1080p"?: number[];
        "720p"?: number[];
      };
    };
  };
}

/**
 * Model capabilities matrix based on Google's Veo API documentation
 */
export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  "veo-3.1-generate-preview": {
    supportsResolution: true,
    supportedResolutions: ["1080p", "720p"],
    supportsReferenceImages: true,
    supportsLastFrame: true,
    supportsExtension: true,
    aspectRatioConstraints: {
      "16:9": {
        maxResolution: "1080p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "1080p": [8], // 1080p requires 8s only
          "720p": [4, 6, 8],
        },
      },
      "9:16": {
        maxResolution: "1080p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "1080p": [8], // 1080p requires 8s only
          "720p": [4, 6, 8],
        },
      },
    },
  },
  "veo-3.1-fast-generate-preview": {
    supportsResolution: true,
    supportedResolutions: ["1080p", "720p"],
    supportsReferenceImages: true,
    supportsLastFrame: true,
    supportsExtension: true,
    aspectRatioConstraints: {
      "16:9": {
        maxResolution: "1080p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "1080p": [8], // 1080p requires 8s only
          "720p": [4, 6, 8],
        },
      },
      "9:16": {
        maxResolution: "1080p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "1080p": [8], // 1080p requires 8s only
          "720p": [4, 6, 8],
        },
      },
    },
  },
  "veo-3.0-generate-001": {
    supportsResolution: true,
    supportedResolutions: ["1080p", "720p"],
    supportsReferenceImages: false,
    supportsLastFrame: false,
    supportsExtension: false,
    aspectRatioConstraints: {
      "16:9": {
        maxResolution: "1080p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "1080p": [4, 6, 8],
          "720p": [4, 6, 8],
        },
      },
      "9:16": {
        maxResolution: "720p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "720p": [4, 6, 8],
        },
      },
    },
  },
  "veo-3.0-fast-generate-001": {
    supportsResolution: true,
    supportedResolutions: ["720p"],
    supportsReferenceImages: false,
    supportsLastFrame: false,
    supportsExtension: false,
    aspectRatioConstraints: {
      "16:9": {
        maxResolution: "720p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "720p": [4, 6, 8],
        },
      },
      "9:16": {
        maxResolution: "720p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "720p": [4, 6, 8],
        },
      },
    },
  },
  "veo-2.0-generate-001": {
    supportsResolution: false,
    supportedResolutions: [],
    supportsReferenceImages: false,
    supportsLastFrame: false,
    supportsExtension: false,
    aspectRatioConstraints: {
      "16:9": {
        maxResolution: "720p",
        supportedDurations: [5, 6, 8],
      },
      "9:16": {
        maxResolution: "720p",
        supportedDurations: [5, 6, 8],
      },
    },
  },
};

/**
 * Get model capabilities for a specific model
 */
export const getModelCapabilities = (
  model: string
): ModelCapabilities | undefined => {
  return MODEL_CAPABILITIES[model];
};

/**
 * Get default duration based on model, resolution, and features
 */
export const getDefaultDuration = (
  model: string,
  resolution?: "1080p" | "720p",
  hasReferenceImages?: boolean,
  hasLastFrame?: boolean
): number => {
  // 1080p always requires 8 seconds
  if (resolution === "1080p") {
    return 8;
  }

  // Reference images require 8 seconds
  if (hasReferenceImages) {
    return 8;
  }

  // Last frame interpolation requires 8 seconds
  if (hasLastFrame) {
    return 8;
  }

  // Default to 6 seconds for all other cases
  return 6;
};

/**
 * Get default resolution based on model and aspect ratio
 */
export const getDefaultResolution = (
  model: string,
  aspectRatio: "16:9" | "9:16" | "1:1"
): "1080p" | "720p" | undefined => {
  const capabilities = MODEL_CAPABILITIES[model];

  if (!capabilities) {
    return undefined;
  }

  // Veo 2.0 doesn't support resolution parameter
  if (!capabilities.supportsResolution) {
    return undefined;
  }

  // Video models don't support 1:1 aspect ratio
  if (aspectRatio === "1:1") {
    return undefined;
  }

  // Return the maximum resolution supported for the aspect ratio
  return capabilities.aspectRatioConstraints[aspectRatio]?.maxResolution;
};

/**
 * Model display information
 */
export const MODEL_INFO: Record<string, { name: string; description: string }> =
  {
    "veo-3.1-generate-preview": {
      name: "Veo 3.1",
      description:
        "Best quality, all features (reference images, interpolation)",
    },
    "veo-3.1-fast-generate-preview": {
      name: "Veo 3.1 Fast",
      description: "Fast generation, all features",
    },
    "veo-3.0-generate-001": {
      name: "Veo 3.0",
      description: "High quality, standard features",
    },
    "veo-3.0-fast-generate-001": {
      name: "Veo 3.0 Fast",
      description: "Fastest generation, 720p only",
    },
    "veo-2.0-generate-001": {
      name: "Veo 2.0",
      description: "Legacy model, fixed resolution",
    },
  };

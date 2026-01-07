/**
 * Video Model Capabilities and Validation
 *
 * This module defines the capabilities of each video generation model
 * and provides validation functions to ensure API parameters match
 * Google's official documentation constraints.
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
    "1:1"?: {
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
 * Validation error class with detailed information
 */
export class VideoParameterValidationError extends Error {
  public readonly statusCode = 400;
  public readonly errorCode = "VIDEO_PARAMETER_VALIDATION_ERROR";
  public readonly retryable = false;

  constructor(message: string) {
    super(message);
    this.name = "VideoParameterValidationError";
  }
}

/**
 * Get default duration based on model, resolution, and features
 *
 * @param model - The video model being used
 * @param resolution - The requested resolution (1080p or 720p)
 * @param hasReferenceImages - Whether reference images are being used
 * @param hasLastFrame - Whether last frame interpolation is being used
 * @returns Default duration in seconds
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
 *
 * @param model - The video model being used
 * @param aspectRatio - The requested aspect ratio (16:9, 9:16, or 1:1)
 * @returns Default resolution or undefined for models that don't support resolution parameter
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

  // Return the maximum resolution supported for the aspect ratio
  return capabilities.aspectRatioConstraints[aspectRatio]?.maxResolution;
};

/**
 * Validate parameter combination holistically
 *
 * @param model - The video model being used
 * @param resolution - The requested resolution
 * @param duration - The requested duration in seconds
 * @param aspectRatio - The requested aspect ratio
 * @param hasReferenceImages - Whether reference images are being used
 * @param hasLastFrame - Whether last frame interpolation is being used
 * @returns Object with validation result and array of error messages
 */
export const validateParameterCombination = (
  model: string,
  resolution: string | undefined,
  duration: number,
  aspectRatio: "16:9" | "9:16" | "1:1",
  hasReferenceImages: boolean,
  hasLastFrame: boolean
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const capabilities = MODEL_CAPABILITIES[model];

  if (!capabilities) {
    errors.push(`Unknown video model: ${model}. Please use a supported model.`);
    return { valid: false, errors };
  }

  // Validate resolution + duration combination
  if (resolution && capabilities.supportsResolution) {
    const constraints =
      capabilities.aspectRatioConstraints[aspectRatio]?.durationConstraints;

    if (constraints) {
      const allowedDurations =
        constraints[resolution as "1080p" | "720p"] || [];
      if (allowedDurations.length > 0 && !allowedDurations.includes(duration)) {
        errors.push(
          `${resolution} resolution with ${aspectRatio} aspect ratio requires duration to be one of: ${allowedDurations.join(
            ", "
          )}s. You requested ${duration}s. Suggestion: Use ${
            allowedDurations[allowedDurations.length - 1]
          }s duration.`
        );
      }
    }

    // Check if resolution exceeds max for aspect ratio
    const maxRes =
      capabilities.aspectRatioConstraints[aspectRatio]?.maxResolution;
    if (resolution === "1080p" && maxRes === "720p") {
      errors.push(
        `Model ${model} does not support 1080p for ${aspectRatio} aspect ratio. Maximum resolution: ${maxRes}. Suggestion: Use 720p resolution.`
      );
    }
  }

  // Validate reference images + aspect ratio
  if (hasReferenceImages) {
    if (!capabilities.supportsReferenceImages) {
      errors.push(
        `Model ${model} does not support reference images. Suggestion: Use Veo 3.1 or Veo 3.1 Fast models.`
      );
    }

    if (aspectRatio !== "16:9") {
      errors.push(
        `Reference images require 16:9 aspect ratio. Current: ${aspectRatio}. Suggestion: Change aspect ratio to 16:9.`
      );
    }

    if (duration !== 8) {
      errors.push(
        `Reference images require 8-second duration. Current: ${duration}s. Suggestion: Set duration to 8s.`
      );
    }
  }

  // Validate last frame + initial image
  if (hasLastFrame) {
    if (!capabilities.supportsLastFrame) {
      errors.push(
        `Model ${model} does not support last frame interpolation. Suggestion: Use Veo 3.1 or Veo 3.1 Fast models.`
      );
    }

    if (duration !== 8) {
      errors.push(
        `Last frame interpolation requires 8-second duration. Current: ${duration}s. Suggestion: Set duration to 8s.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validates resolution parameter against model capabilities
 *
 * @param model - The video model being used
 * @param resolution - The requested resolution (1080p or 720p)
 * @param aspectRatio - The requested aspect ratio (16:9, 9:16, or 1:1)
 * @param duration - The requested duration in seconds (optional)
 * @throws {VideoParameterValidationError} If validation fails
 */
export const validateResolution = (
  model: string,
  resolution: string | undefined,
  aspectRatio: "16:9" | "9:16" | "1:1",
  duration?: number
): void => {
  const capabilities = MODEL_CAPABILITIES[model];

  if (!capabilities) {
    throw new VideoParameterValidationError(
      `Unknown video model: ${model}. Please use a supported model.`
    );
  }

  // If no resolution specified, that's fine - will use defaults
  if (!resolution) {
    return;
  }

  // Check if model supports resolution parameter at all
  if (!capabilities.supportsResolution) {
    throw new VideoParameterValidationError(
      `Model ${model} does not support the resolution parameter. Resolution setting will be ignored by this model.`
    );
  }

  // Check if the specific resolution is supported
  if (
    !capabilities.supportedResolutions.includes(resolution as "1080p" | "720p")
  ) {
    throw new VideoParameterValidationError(
      `Model ${model} does not support ${resolution} resolution. Supported resolutions: ${capabilities.supportedResolutions.join(
        ", "
      )}`
    );
  }

  // Check aspect ratio constraints
  const maxRes =
    capabilities.aspectRatioConstraints[aspectRatio]?.maxResolution;
  if (resolution === "1080p" && maxRes === "720p") {
    throw new VideoParameterValidationError(
      `Model ${model} does not support 1080p for ${aspectRatio} aspect ratio. Maximum resolution for ${aspectRatio}: ${maxRes}`
    );
  }

  // Check duration constraints if duration is provided
  if (duration !== undefined) {
    const constraints =
      capabilities.aspectRatioConstraints[aspectRatio]?.durationConstraints;

    if (constraints) {
      const allowedDurations =
        constraints[resolution as "1080p" | "720p"] || [];
      if (allowedDurations.length > 0 && !allowedDurations.includes(duration)) {
        throw new VideoParameterValidationError(
          `${resolution} resolution with ${aspectRatio} aspect ratio requires duration to be one of: ${allowedDurations.join(
            ", "
          )}s. You requested ${duration}s. Please use ${
            allowedDurations[allowedDurations.length - 1]
          }s duration.`
        );
      }
    }
  }
};

/**
 * Validates reference images parameter against model capabilities
 *
 * @param model - The video model being used
 * @param referenceImages - Array of reference images (max 3)
 * @param aspectRatio - The requested aspect ratio (must be 16:9 for reference images)
 * @throws {VideoParameterValidationError} If validation fails
 */
export const validateReferenceImages = (
  model: string,
  referenceImages: any[] | undefined,
  aspectRatio: "16:9" | "9:16" | "1:1"
): void => {
  // If no reference images, nothing to validate
  if (!referenceImages || referenceImages.length === 0) {
    return;
  }

  const capabilities = MODEL_CAPABILITIES[model];

  if (!capabilities) {
    throw new VideoParameterValidationError(
      `Unknown video model: ${model}. Please use a supported model.`
    );
  }

  // Check if model supports reference images
  if (!capabilities.supportsReferenceImages) {
    throw new VideoParameterValidationError(
      `Model ${model} does not support reference images. This feature is only available in Veo 3.1 models. Current model: ${model}`
    );
  }

  // Check maximum count
  if (referenceImages.length > 3) {
    throw new VideoParameterValidationError(
      `Maximum 3 reference images allowed. You provided ${referenceImages.length} images.`
    );
  }

  // Check aspect ratio constraint
  if (aspectRatio !== "16:9") {
    throw new VideoParameterValidationError(
      `Reference images only support 16:9 aspect ratio. Current aspect ratio: ${aspectRatio}. Please change to 16:9 to use reference images.`
    );
  }
};

/**
 * Validates last frame parameter against model capabilities
 *
 * @param model - The video model being used
 * @param lastFrame - The last frame image for interpolation
 * @param hasInitialImage - Whether an initial image is provided
 * @throws {VideoParameterValidationError} If validation fails
 */
export const validateLastFrame = (
  model: string,
  lastFrame: any | undefined,
  hasInitialImage: boolean
): void => {
  // If no last frame, nothing to validate
  if (!lastFrame) {
    return;
  }

  const capabilities = MODEL_CAPABILITIES[model];

  if (!capabilities) {
    throw new VideoParameterValidationError(
      `Unknown video model: ${model}. Please use a supported model.`
    );
  }

  // Check if model supports last frame interpolation
  if (!capabilities.supportsLastFrame) {
    throw new VideoParameterValidationError(
      `Model ${model} does not support last frame interpolation. This feature is only available in Veo 3.1 models. Current model: ${model}`
    );
  }

  // Check if initial image is provided
  if (!hasInitialImage) {
    throw new VideoParameterValidationError(
      `Last frame interpolation requires both an initial image and a last frame. Please provide an initial image.`
    );
  }
};

/**
 * Validates video extension parameters against model capabilities
 *
 * @param model - The video model being used
 * @param currentDuration - Current video duration in seconds
 * @param extensionCount - Number of extensions requested (1-20)
 * @throws {VideoParameterValidationError} If validation fails
 */
export const validateVideoExtension = (
  model: string,
  currentDuration: number,
  extensionCount: number
): void => {
  const capabilities = MODEL_CAPABILITIES[model];

  if (!capabilities) {
    throw new VideoParameterValidationError(
      `Unknown video model: ${model}. Please use a supported model.`
    );
  }

  // Check if model supports video extension
  if (!capabilities.supportsExtension) {
    throw new VideoParameterValidationError(
      `Model ${model} does not support video extension. This feature is only available in Veo 3.1 models. Current model: ${model}`
    );
  }

  // Validate extension count range
  if (extensionCount < 1 || extensionCount > 20) {
    throw new VideoParameterValidationError(
      `Extension count must be between 1 and 20. You requested ${extensionCount} extensions.`
    );
  }

  // Validate current video duration
  if (currentDuration > 141) {
    throw new VideoParameterValidationError(
      `Video must be 141 seconds or less to extend. Current duration: ${currentDuration}s. Maximum allowed: 141s`
    );
  }

  // Calculate final duration and check if it exceeds limit
  const finalDuration = currentDuration + extensionCount * 7;
  if (finalDuration > 148) {
    const maxExtensions = Math.floor((148 - currentDuration) / 7);
    throw new VideoParameterValidationError(
      `Video extension would exceed maximum duration. Current: ${currentDuration}s, Requested extensions: ${extensionCount} (${
        extensionCount * 7
      }s), Final would be: ${finalDuration}s, Maximum allowed: 148s. You can extend up to ${maxExtensions} more time(s).`
    );
  }
};

/**
 * Get model capabilities for a specific model
 *
 * @param model - The video model name
 * @returns Model capabilities or undefined if model not found
 */
export const getModelCapabilities = (
  model: string
): ModelCapabilities | undefined => {
  return MODEL_CAPABILITIES[model];
};

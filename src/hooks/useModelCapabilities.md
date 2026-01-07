# useModelCapabilities Hook

A React hook that provides model capabilities and validation helpers for video generation.

## Usage

```tsx
import { useModelCapabilities } from '../hooks/useModelCapabilities';

function VideoGenerationModal() {
  const [selectedModel, setSelectedModel] = useState('veo-3.1-generate-preview');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const {
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
  } = useModelCapabilities(selectedModel, aspectRatio);

  return (
    <div>
      {/* Resolution selector */}
      <div>
        {availableResolutions.map((res) => (
          <button
            key={res}
            disabled={!isResolutionSupported(res)}
          >
            {res}
          </button>
        ))}
      </div>

      {/* Duration selector */}
      <div>
        {[4, 6, 8].map((dur) => (
          <button
            key={dur}
            disabled={!isDurationSupported(dur, selectedResolution)}
          >
            {dur}s
          </button>
        ))}
      </div>

      {/* Feature availability */}
      {supportsReferenceImages && (
        <div>Upload reference images (up to 3)</div>
      )}
      
      {supportsLastFrame && (
        <div>Upload last frame for interpolation</div>
      )}
    </div>
  );
}
```

## API

### Parameters

- `model: string` - The video model name (e.g., "veo-3.1-generate-preview")
- `aspectRatio: "16:9" | "9:16"` - The aspect ratio

### Return Value

```typescript
interface ModelCapabilitiesResult {
  // Raw capabilities object
  capabilities: ModelCapabilities | undefined;
  
  // Available options for the current model/aspect ratio
  availableResolutions: Array<"1080p" | "720p">;
  availableDurations: number[];
  
  // Feature support flags
  supportsReferenceImages: boolean;
  supportsLastFrame: boolean;
  supportsExtension: boolean;
  
  // Validation helpers
  isResolutionSupported: (resolution: "1080p" | "720p") => boolean;
  isDurationSupported: (duration: number, resolution?: "1080p" | "720p") => boolean;
  
  // Utility functions
  getMaxResolution: () => "1080p" | "720p" | undefined;
  getDurationConstraints: (resolution: "1080p" | "720p") => number[] | undefined;
}
```

## Examples

### Check if 1080p is supported

```tsx
const { isResolutionSupported } = useModelCapabilities(model, aspectRatio);

if (isResolutionSupported("1080p")) {
  // Enable 1080p option
}
```

### Validate duration for specific resolution

```tsx
const { isDurationSupported } = useModelCapabilities(model, aspectRatio);

// Check if 6s is valid for 1080p
if (isDurationSupported(6, "1080p")) {
  // Valid combination
} else {
  // Invalid - 1080p requires 8s
}
```

### Get duration constraints

```tsx
const { getDurationConstraints } = useModelCapabilities(model, aspectRatio);

const constraints = getDurationConstraints("1080p");
// For Veo 3.1: [8]
// For Veo 3.0: [4, 6, 8]
```

### Display available options

```tsx
const { availableResolutions, availableDurations } = useModelCapabilities(
  model,
  aspectRatio
);

console.log("Available resolutions:", availableResolutions);
// Veo 3.1 with 16:9: ["1080p", "720p"]
// Veo 3.0 with 9:16: ["720p"]

console.log("Available durations:", availableDurations);
// Veo 3.1: [4, 6, 8]
// Veo 2.0: [5, 6, 8]
```

## Model Capabilities

### Veo 3.1 / Veo 3.1 Fast
- Resolutions: 1080p, 720p (both aspect ratios)
- Durations: 4s, 6s, 8s
- Features: Reference images, last frame, extension
- Constraints: 1080p requires 8s duration

### Veo 3.0
- Resolutions: 1080p (16:9 only), 720p (both)
- Durations: 4s, 6s, 8s
- Features: None
- Constraints: 9:16 limited to 720p

### Veo 3.0 Fast
- Resolutions: 720p only
- Durations: 4s, 6s, 8s
- Features: None

### Veo 2.0
- Resolutions: Fixed (no parameter)
- Durations: 5s, 6s, 8s
- Features: None
- Note: Resolution parameter not supported

## Related

- `MODEL_CAPABILITIES` - Raw capabilities matrix
- `getModelCapabilities()` - Get capabilities for a model
- `getDefaultDuration()` - Get default duration
- `getDefaultResolution()` - Get default resolution

# Design Document

## Overview

This design addresses critical video generation issues in StoryBoard by implementing proper Veo model capability validation, fixing resolution/duration parameter handling, enabling video extension, and improving the UI for video generation modals. The solution involves updates to backend validation logic, frontend modal components, and the addition of model-aware configuration UI.

### Key Problems Identified

1. **Backend Issues:**
   - Incorrect duration defaults causing 1080p + 6s conflicts
   - Missing `personGeneration` parameter for reference images and interpolation
   - Encoding parameter sent to extension API (not supported)
   - Resolution parameter sent to Veo 2.0 (not supported)

2. **Frontend Issues:**
   - No UI for selecting resolution or duration
   - No UI for selecting video model
   - Modals use basic textarea instead of reusable chat input component
   - No validation feedback before submission
   - No display of model capabilities or constraints

3. **Validation Issues:**
   - Model capabilities matrix exists but has incorrect duration logic
   - No pre-submission validation in UI
   - Error messages don't provide actionable guidance

## Architecture

### Component Hierarchy

```
AnimateModal / EditModal / ExtendModal
├── Modal Container (backdrop + centered content)
├── Modal Header (title + close button)
└── Modal Body
    ├── Media Preview (image/video)
    ├── Scene Description Display
    ├── Model Selector (NEW - AnimateModal only)
    ├── Settings Panel (NEW)
    │   ├── Resolution Selector
    │   ├── Duration Selector
    │   └── Validation Warnings
    ├── ChatInputArea (REFACTORED - reuse chat component)
    │   ├── Prompt Textarea
    │   ├── Icon Row (AI Suggest, Upload, etc.)
    │   └── File Attachments Display
    └── Action Buttons (Cancel, Submit)
```

### Data Flow

```
User Action (Modal Open)
    ↓
Load Current Settings (from settingsStore)
    ↓
Determine Model Capabilities (from MODEL_CAPABILITIES)
    ↓
Set Default Resolution/Duration (based on model + aspect ratio)
    ↓
User Adjusts Settings
    ↓
Validate Parameters (client-side)
    ↓
Display Warnings/Errors (if invalid)
    ↓
User Submits
    ↓
Backend Validation (server-side)
    ↓
API Call with Correct Parameters
    ↓
Success/Error Response
```

## Components and Interfaces

### 1. Enhanced Model Capabilities Module

**File:** `server/services/videoModelCapabilities.ts`

**Changes:**
- Fix duration logic in `generateSceneVideo` to respect 1080p → 8s requirement
- Add `getDefaultDuration()` helper function
- Add `getDefaultResolution()` helper function
- Add `validateParameterCombination()` for holistic validation
- Update `MODEL_CAPABILITIES` with correct duration constraints

**New Functions:**

```typescript
export const getDefaultDuration = (
  model: string,
  resolution?: "1080p" | "720p",
  hasReferenceImages?: boolean,
  hasLastFrame?: boolean
): number => {
  // Returns 8 if 1080p or if using reference images/last frame
  // Otherwise returns 6 as default
};

export const getDefaultResolution = (
  model: string,
  aspectRatio: "16:9" | "9:16"
): "1080p" | "720p" => {
  // Returns max supported resolution for model + aspect ratio
};

export const validateParameterCombination = (
  model: string,
  resolution: string | undefined,
  duration: number,
  aspectRatio: "16:9" | "9:16",
  hasReferenceImages: boolean,
  hasLastFrame: boolean
): { valid: boolean; errors: string[] } => {
  // Validates all parameters together
  // Returns array of error messages
};
```


### 2. Updated Video Generation Service

**File:** `server/services/geminiClient.ts`

**Function:** `generateSceneVideo()`

**Changes:**
- Use `getDefaultDuration()` to set duration based on resolution and features
- Add `personGeneration` parameter when using reference images or last frame
- Remove hardcoded duration logic
- Add comprehensive logging for debugging

**Updated Logic:**

```typescript
export const generateSceneVideo = async (
  image: { data: string; mimeType: string },
  prompt: string,
  model: string,
  aspectRatio: "16:9" | "9:16",
  resolution?: "1080p" | "720p",
  referenceImages?: Array<{ data: string; mimeType: string }>,
  lastFrame?: { data: string; mimeType: string },
  duration?: number // NEW: Allow explicit duration override
): Promise<{ data: ArrayBuffer; mimeType: string; metadata?: any }> => {
  
  // Validate parameters
  validateResolution(model, resolution, aspectRatio);
  validateReferenceImages(model, referenceImages, aspectRatio);
  validateLastFrame(model, lastFrame, !!image);
  
  // Determine resolution
  let finalResolution: "1080p" | "720p" | undefined;
  if (model === "veo-2.0-generate-001") {
    finalResolution = undefined; // Veo 2.0 doesn't support resolution param
  } else {
    finalResolution = resolution ?? getDefaultResolution(model, aspectRatio);
  }
  
  // Determine duration
  const hasReferenceImages = referenceImages && referenceImages.length > 0;
  const hasLastFrame = !!lastFrame;
  const finalDuration = duration ?? getDefaultDuration(
    model,
    finalResolution,
    hasReferenceImages,
    hasLastFrame
  );
  
  // Build config
  const config: any = {
    numberOfVideos: 1,
    aspectRatio: aspectRatio,
    durationSeconds: finalDuration,
    quality: "hd",
    includePeople: true,
    safetySettings: [...],
  };
  
  // Add resolution if supported
  if (finalResolution) {
    config.resolution = finalResolution;
  }
  
  // Add reference images with required personGeneration
  if (hasReferenceImages) {
    config.referenceImages = referenceImages.map((img) => ({
      imageBytes: img.data,
      mimeType: img.mimeType,
    }));
    config.personGeneration = "allow_adult"; // Required for reference images
  }
  
  // Add last frame with required personGeneration
  if (hasLastFrame) {
    config.lastFrame = {
      imageBytes: lastFrame.data,
      mimeType: lastFrame.mimeType,
    };
    config.personGeneration = "allow_adult"; // Required for interpolation
  }
  
  // Log for debugging
  console.log(`[Video Generation] Model: ${model}, Resolution: ${finalResolution}, Duration: ${finalDuration}s, Ref Images: ${referenceImages?.length ?? 0}, Last Frame: ${hasLastFrame}`);
  
  // Generate video
  let operation = await client.models.generateVideos({
    model,
    prompt,
    image: { imageBytes: image.data, mimeType: image.mimeType },
    config,
  });
  
  // Poll until complete
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    operation = await client.operations.getVideosOperation({ operation });
  }
  
  // Download and return
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation did not return a download link.");
  }
  
  const response = await fetch(`${downloadLink}&key=${apiKey}`);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  
  const mimeType = response.headers.get("content-type") ?? "video/mp4";
  const buffer = await response.arrayBuffer();
  
  return {
    data: buffer,
    mimeType,
    metadata: {
      requestedAspectRatio: aspectRatio,
      requestedResolution: finalResolution,
      requestedDuration: finalDuration,
      model,
    },
  };
};
```

### 3. Fixed Video Extension Service

**File:** `server/services/geminiClient.ts`

**Function:** `extendSceneVideo()`

**Changes:**
- Remove `encoding` parameter (not supported by extension API)
- Ensure 720p resolution (only supported resolution for extension)
- Add proper error handling for unsupported models

**Updated Logic:**

```typescript
export const extendSceneVideo = async (
  video: { data: string; mimeType: string },
  prompt: string,
  model: string,
  aspectRatio: "16:9" | "9:16",
  extensionCount: number = 1,
  currentDuration: number = 0
): Promise<{ data: ArrayBuffer; mimeType: string }> => {
  const { client, apiKey } = ensureClient();
  
  // Validate extension parameters
  validateVideoExtension(model, currentDuration, extensionCount);
  
  console.log(`[Video Extension] Model: ${model}, Extensions: ${extensionCount}, Current: ${currentDuration}s`);
  
  let currentVideo = video;
  
  for (let i = 0; i < extensionCount; i++) {
    console.log(`[Video Extension] Processing ${i + 1}/${extensionCount}`);
    
    const config: any = {
      numberOfVideos: 1,
      aspectRatio: aspectRatio,
      resolution: "720p", // Only 720p supported for extension
      quality: "hd",
      includePeople: true,
      personGeneration: "allow_all", // Required for extension
      safetySettings: [...],
      // NOTE: Do NOT include 'encoding' parameter - not supported by extension API
    };
    
    let operation = await client.models.generateVideos({
      model,
      prompt,
      video: {
        videoBytes: currentVideo.data,
        mimeType: currentVideo.mimeType,
      },
      config,
    });
    
    // Poll and download (same as before)
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      operation = await client.operations.getVideosOperation({ operation });
    }
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error(`Extension ${i + 1}/${extensionCount} failed: no download link`);
    }
    
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to download extended video: ${response.statusText}`);
    }
    
    const mimeType = response.headers.get("content-type") ?? "video/mp4";
    const buffer = await response.arrayBuffer();
    
    currentVideo = {
      data: Buffer.from(buffer).toString("base64"),
      mimeType,
    };
  }
  
  return {
    data: Buffer.from(currentVideo.data, "base64").buffer as ArrayBuffer,
    mimeType: currentVideo.mimeType,
  };
};
```


### 4. Enhanced AnimateModal Component

**File:** `src/features/storyboard/components/AnimateModal.tsx`

**New Props:**

```typescript
interface AnimateModalProps {
  scene: Scene;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    sceneId: string,
    prompt: string,
    options: {
      model?: string;
      resolution?: "1080p" | "720p";
      duration?: number;
      referenceImages?: File[];
      lastFrame?: File;
    }
  ) => void;
  onSuggestPrompt: (sceneId: string) => Promise<string | null>;
  isBusy: boolean;
  currentSettings: Settings; // NEW: Access to current settings
}
```

**New State:**

```typescript
const [selectedModel, setSelectedModel] = useState<string>(currentSettings.videoModel);
const [selectedResolution, setSelectedResolution] = useState<"1080p" | "720p">(currentSettings.videoResolution);
const [selectedDuration, setSelectedDuration] = useState<number>(6);
const [validationErrors, setValidationErrors] = useState<string[]>([]);
const [referenceImages, setReferenceImages] = useState<File[]>([]);
const [lastFrame, setLastFrame] = useState<File | null>(null);
```

**New UI Sections:**

1. **Model Selector:**
```tsx
<div className="mb-4">
  <label className="text-sm font-medium mb-2 block">
    Video Model
    <InfoTooltip content="Different models offer different quality/speed tradeoffs" />
  </label>
  <select
    value={selectedModel}
    onChange={handleModelChange}
    className="w-full px-3 py-2 rounded-lg"
  >
    <option value="veo-3.1-generate-preview">Veo 3.1 (Best Quality, All Features)</option>
    <option value="veo-3.1-fast-generate-preview">Veo 3.1 Fast (Fast, All Features)</option>
    <option value="veo-3.0-generate-001">Veo 3.0 (High Quality)</option>
    <option value="veo-3.0-fast-generate-001">Veo 3.0 Fast (Fastest)</option>
    <option value="veo-2.0-generate-001">Veo 2.0 (Legacy)</option>
  </select>
</div>
```

2. **Resolution Selector:**
```tsx
<div className="mb-4">
  <label className="text-sm font-medium mb-2 block">
    Resolution
    <InfoTooltip content={getResolutionTooltip(selectedModel, scene.aspectRatio)} />
  </label>
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setSelectedResolution("720p")}
      disabled={!isResolutionSupported("720p")}
      className={`btn-base flex-1 ${selectedResolution === "720p" ? "btn-primary" : "btn-outline"}`}
    >
      720p
    </button>
    <button
      type="button"
      onClick={() => setSelectedResolution("1080p")}
      disabled={!isResolutionSupported("1080p")}
      className={`btn-base flex-1 ${selectedResolution === "1080p" ? "btn-primary" : "btn-outline"}`}
    >
      1080p
      {selectedResolution === "1080p" && <span className="text-xs ml-1">(8s)</span>}
    </button>
  </div>
</div>
```

3. **Duration Selector:**
```tsx
<div className="mb-4">
  <label className="text-sm font-medium mb-2 block">
    Duration
    <InfoTooltip content="1080p requires 8 seconds. Reference images and interpolation also require 8 seconds." />
  </label>
  <div className="flex gap-2">
    {[4, 6, 8].map((dur) => (
      <button
        key={dur}
        type="button"
        onClick={() => setSelectedDuration(dur)}
        disabled={!isDurationSupported(dur)}
        className={`btn-base flex-1 ${selectedDuration === dur ? "btn-primary" : "btn-outline"}`}
      >
        {dur}s
      </button>
    ))}
  </div>
</div>
```

4. **Validation Warnings:**
```tsx
{validationErrors.length > 0 && (
  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
    <div className="flex items-start gap-2">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-900 mb-1">Invalid Configuration</p>
        <ul className="text-xs text-red-700 space-y-1">
          {validationErrors.map((error, idx) => (
            <li key={idx}>• {error}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}
```

**Helper Functions:**

```typescript
const getModelCapabilities = (model: string) => {
  // Returns capabilities from MODEL_CAPABILITIES
  // Imported from shared constants or fetched from API
};

const isResolutionSupported = (resolution: "1080p" | "720p"): boolean => {
  const caps = getModelCapabilities(selectedModel);
  if (!caps) return false;
  
  if (resolution === "1080p") {
    if (scene.aspectRatio === "9:16") {
      return caps.aspectRatioConstraints["9:16"].maxResolution === "1080p";
    }
    return caps.aspectRatioConstraints["16:9"].maxResolution === "1080p";
  }
  
  return true; // 720p always supported
};

const isDurationSupported = (duration: number): boolean => {
  const caps = getModelCapabilities(selectedModel);
  if (!caps) return false;
  
  const supportedDurations = caps.aspectRatioConstraints[scene.aspectRatio].supportedDurations;
  
  // If 1080p selected, only 8s is valid
  if (selectedResolution === "1080p" && duration !== 8) {
    return false;
  }
  
  // If reference images or last frame, only 8s is valid
  if ((referenceImages.length > 0 || lastFrame) && duration !== 8) {
    return false;
  }
  
  return supportedDurations.includes(duration);
};

const validateConfiguration = (): string[] => {
  const errors: string[] = [];
  const caps = getModelCapabilities(selectedModel);
  
  if (!caps) {
    errors.push("Unknown model selected");
    return errors;
  }
  
  // Check resolution support
  if (selectedResolution === "1080p") {
    const maxRes = caps.aspectRatioConstraints[scene.aspectRatio].maxResolution;
    if (maxRes === "720p") {
      errors.push(`${selectedModel} does not support 1080p for ${scene.aspectRatio} aspect ratio`);
    }
    
    if (selectedDuration !== 8) {
      errors.push("1080p resolution requires 8-second duration");
    }
  }
  
  // Check reference images
  if (referenceImages.length > 0) {
    if (!caps.supportsReferenceImages) {
      errors.push("Reference images are only supported on Veo 3.1 models");
    }
    if (scene.aspectRatio !== "16:9") {
      errors.push("Reference images require 16:9 aspect ratio");
    }
    if (selectedDuration !== 8) {
      errors.push("Reference images require 8-second duration");
    }
  }
  
  // Check last frame
  if (lastFrame) {
    if (!caps.supportsLastFrame) {
      errors.push("Last frame interpolation is only supported on Veo 3.1 models");
    }
    if (selectedDuration !== 8) {
      errors.push("Last frame interpolation requires 8-second duration");
    }
  }
  
  return errors;
};

// Run validation whenever settings change
useEffect(() => {
  const errors = validateConfiguration();
  setValidationErrors(errors);
}, [selectedModel, selectedResolution, selectedDuration, referenceImages, lastFrame]);

// Auto-adjust duration when 1080p selected
useEffect(() => {
  if (selectedResolution === "1080p" && selectedDuration !== 8) {
    setSelectedDuration(8);
  }
}, [selectedResolution]);

// Auto-adjust duration when reference images or last frame added
useEffect(() => {
  if ((referenceImages.length > 0 || lastFrame) && selectedDuration !== 8) {
    setSelectedDuration(8);
  }
}, [referenceImages, lastFrame]);
```


### 5. Reusable ChatInputArea Component

**File:** `src/components/ChatInputArea.tsx` (NEW)

**Purpose:** Extract the chat input UI from ChatPanel to make it reusable in modals.

**Props:**

```typescript
interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  showFileUpload?: boolean;
  onFileUpload?: (files: File[]) => void;
  attachedFiles?: Array<{ id: string; name: string; preview?: string }>;
  onFileRemove?: (fileId: string) => void;
  actions?: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
  maxHeight?: string;
}
```

**Structure:**

```tsx
export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  showFileUpload = false,
  onFileUpload,
  attachedFiles = [],
  onFileRemove,
  actions = [],
  maxHeight = "200px",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileUpload) {
      onFileUpload(files);
    }
    e.target.value = ""; // Reset input
  };
  
  return (
    <div className="chat-input-area">
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="attached-files-preview mb-2">
          <div className="flex gap-2 flex-wrap">
            {attachedFiles.map((file) => (
              <div key={file.id} className="relative">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded border border-muted"
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center rounded border border-muted bg-muted">
                    <FileIcon className="w-6 h-6 text-muted" />
                  </div>
                )}
                {onFileRemove && (
                  <button
                    type="button"
                    onClick={() => onFileRemove(file.id)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    style={{ width: "20px", height: "20px" }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Input composer */}
      <div className="composer">
        <div className="composer-top">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="composer-input"
            rows={1}
            disabled={disabled}
            style={{ maxHeight }}
          />
        </div>
        
        <div className="composer-divider" />
        
        <div className="composer-bottom">
          <div className="flex items-center gap-1">
            {/* File upload button */}
            {showFileUpload && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-base btn-ghost p-2"
                  title="Attach file"
                  disabled={disabled}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </>
            )}
            
            {/* Custom action buttons */}
            {actions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                className="btn-base btn-ghost p-2"
                title={action.label}
                disabled={disabled || action.disabled}
              >
                <action.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Usage in AnimateModal:**

```tsx
<ChatInputArea
  value={prompt}
  onChange={setPrompt}
  onSubmit={handleSubmit}
  placeholder="Describe the animation... (optional)"
  disabled={isBusy}
  showFileUpload={modelSupportsReferenceImages}
  onFileUpload={handleReferenceUpload}
  attachedFiles={[
    ...referenceImages.map((file, idx) => ({
      id: `ref-${idx}`,
      name: file.name,
      preview: URL.createObjectURL(file),
    })),
    ...(lastFrame ? [{
      id: "last-frame",
      name: lastFrame.name,
      preview: URL.createObjectURL(lastFrame),
    }] : []),
  ]}
  onFileRemove={handleFileRemove}
  actions={[
    {
      icon: Sparkles,
      label: "AI Suggest",
      onClick: handleSuggest,
      disabled: isSuggesting,
    },
  ]}
/>
```

### 6. Updated API Route Handler

**File:** `server/routes/ai.ts`

**Endpoint:** `POST /api/ai/video`

**Changes:**
- Accept `duration` parameter in request body
- Pass `duration` to `generateSceneVideo()`
- Update validation schema

**Updated Schema:**

```typescript
const aiGenerateVideoSchema = z.object({
  projectId: z.string(),
  sceneId: z.string(),
  prompt: z.string(),
  model: z.string(),
  aspectRatio: z.enum(["16:9", "9:16"]),
  resolution: z.enum(["1080p", "720p"]).optional(),
  duration: z.number().min(4).max(8).optional(), // NEW
  referenceImages: z.array(z.object({
    data: z.string(),
    mimeType: z.string(),
  })).max(3).optional(),
  lastFrame: z.object({
    data: z.string(),
    mimeType: z.string(),
  }).optional(),
});
```

**Updated Handler:**

```typescript
router.post("/video", (req, res) => {
  void handle(req, res, "/api/ai/video", async (setMeta) => {
    const data: AiGenerateVideoPayload = aiGenerateVideoSchema.parse(req.body);
    
    setMeta({
      projectId: data.projectId,
      geminiModel: data.model,
      prompt: data.prompt,
    });
    
    requireProject(db, data.projectId);
    const scene = requireScene(db, data.projectId, data.sceneId);
    
    if (!scene.primaryImageAssetId) {
      throw Object.assign(
        new Error("Scene requires an image before generating video."),
        {
          statusCode: 400,
          errorCode: "SCENE_IMAGE_MISSING",
          retryable: false,
        }
      );
    }
    
    const asset = getAssetById(db, scene.primaryImageAssetId);
    if (!asset) {
      throw Object.assign(new Error("Image asset not found."), {
        statusCode: 404,
        errorCode: "IMAGE_ASSET_NOT_FOUND",
      });
    }
    
    const { base64, mimeType } = readAssetBase64(asset.filePath);
    
    // Convert reference images from base64 if provided
    const referenceImages = data.referenceImages?.map((img) => ({
      data: img.data,
      mimeType: img.mimeType,
    }));
    
    // Convert last frame from base64 if provided
    const lastFrame = data.lastFrame ? {
      data: data.lastFrame.data,
      mimeType: data.lastFrame.mimeType,
    } : undefined;
    
    const video = await generateSceneVideo(
      { data: base64, mimeType },
      data.prompt,
      data.model,
      data.aspectRatio,
      data.resolution,
      referenceImages,
      lastFrame,
      data.duration // NEW: Pass duration
    );
    
    const buffer = Buffer.from(video.data);
    const { asset: newAsset } = persistAssetBuffer({
      db,
      config,
      projectId: data.projectId,
      sceneId: data.sceneId,
      type: "video",
      mimeType: video.mimeType,
      buffer,
      metadata: {
        source: "ai-video",
        prompt: data.prompt,
        model: data.model,
        duration: data.duration,
        ...video.metadata,
      },
    });
    
    const updatedScene = requireScene(db, data.projectId, data.sceneId);
    const enriched = enrichSceneWithAssets(db, updatedScene);
    
    return {
      asset: { id: newAsset.id },
      url: enriched.videoUrl,
      scene: enriched,
    };
  });
});
```


### 7. Enhanced ExtendModal Component

**File:** `src/features/storyboard/components/ExtendModal.tsx`

**Problem:**
The current implementation incorrectly blocks video extension for videos created with non-3.1 models. According to Google's documentation, ANY Veo-generated video can be extended, but only Veo 3.1 and Veo 3.1 Fast models can be used to PERFORM the extension.

**Changes:**
- Remove blocking warning for Veo-created videos
- Add model selector with only Veo 3.1 and Veo 3.1 Fast options
- Update validation logic to check if video is Veo-generated (not which specific model)
- Default to Veo 3.1 Fast for extension operations

**New Props:**

```typescript
interface ExtendModalProps {
  scene: Scene;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    sceneId: string,
    prompt: string,
    extensionCount: number,
    model: string // NEW: Allow model selection for extension
  ) => void;
  isBusy: boolean;
  videoAssetMetadata?: Record<string, unknown> | null;
}
```

**New State:**

```typescript
const [selectedModel, setSelectedModel] = useState<string>("veo-3.1-fast-generate-preview");
```

**Updated Validation Logic:**

```typescript
// Check if video was generated with ANY Veo model (not just 3.1)
const videoModel =
  typeof videoAssetMetadata?.model === "string"
    ? videoAssetMetadata.model
    : null;

// Any Veo model can be extended
const isVeoGenerated = videoModel?.startsWith("veo-") ?? false;
const canExtend = isVeoGenerated && maxExtensions >= 1;
```

**New UI Section - Model Selector:**

```tsx
{/* Model selector for extension - only 3.1 models can perform extension */}
<div className="mb-4">
  <label className="text-sm font-medium mb-2 block">
    Extension Model
    <InfoTooltip content="Only Veo 3.1 models can extend videos. Any Veo-generated video can be extended." />
  </label>
  <select
    value={selectedModel}
    onChange={(e) => setSelectedModel(e.target.value)}
    className="w-full px-3 py-2 rounded-lg"
    disabled={!canExtend}
  >
    <option value="veo-3.1-fast-generate-preview">Veo 3.1 Fast (Recommended)</option>
    <option value="veo-3.1-generate-preview">Veo 3.1 (Best Quality)</option>
  </select>
</div>
```

**Updated Info Message:**

```tsx
{/* Info about extension capabilities */}
<div
  className="mb-4 p-3 rounded-lg"
  style={{
    backgroundColor: "var(--primary-soft-bg)",
    border: "1px solid var(--primary-soft-border)",
  }}
>
  <p
    className="text-xs mb-1"
    style={{ color: "var(--primary-soft-text)" }}
  >
    Current: {currentDuration}s | Each extension adds 7s | Max: 141s total
  </p>
  {videoModel && (
    <p
      className="text-xs"
      style={{ color: "var(--primary-soft-text)" }}
    >
      Original model: {MODEL_INFO[videoModel]?.name || videoModel}
    </p>
  )}
</div>
```

**Updated Submit Handler:**

```typescript
const handleSubmit = (e?: React.FormEvent) => {
  e?.preventDefault();
  if (!prompt.trim() || isBusy || !canExtend) return;
  onSubmit(scene.id, prompt.trim(), extensionCount, selectedModel); // Pass selected model
};
```

**Removed Warning:**

The blocking warning about model compatibility should be completely removed since any Veo-generated video can be extended.

### 8. Frontend Service Updates

**File:** `src/services/providers/server.ts`

**Function:** `generateVideo()`

**Changes:**
- Add `duration` parameter to request
- Add `referenceImages` and `lastFrame` to request
- Convert File objects to base64 before sending

**Updated Implementation:**

```typescript
async generateVideo(request: GenerateVideoRequest) {
  // Convert reference images to base64 if provided
  const referenceImages = request.referenceImages
    ? await Promise.all(
        request.referenceImages.map(async (file) => ({
          data: await fileToBase64(file),
          mimeType: file.type,
        }))
      )
    : undefined;
  
  // Convert last frame to base64 if provided
  const lastFrame = request.lastFrame
    ? {
        data: await fileToBase64(request.lastFrame),
        mimeType: request.lastFrame.type,
      }
    : undefined;
  
  const result = await jsonRequest(
    "/ai/video",
    "POST",
    {
      projectId: request.projectId,
      sceneId: request.sceneId,
      prompt: request.prompt,
      model: request.model,
      aspectRatio: request.aspectRatio,
      resolution: request.resolution,
      duration: request.duration, // NEW
      referenceImages, // NEW
      lastFrame, // NEW
    },
    { timeout: 300_000 } // 5 minute timeout for video generation
  );
  
  return result.scene;
}

// Helper function
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**Updated Type:**

```typescript
export interface GenerateVideoRequest {
  projectId: string;
  sceneId: string;
  prompt: string;
  model: string;
  aspectRatio: "16:9" | "9:16";
  resolution?: "1080p" | "720p";
  duration?: number; // NEW
  referenceImages?: File[]; // NEW
  lastFrame?: File; // NEW
}
```

### 8. Settings Store Updates

**File:** `src/types.ts`

**Interface:** `Settings`

**Changes:**
- Add `videoDuration` field for default duration preference

**Updated Interface:**

```typescript
export interface Settings {
  sceneCount: number;
  chatModel: ChatModel;
  imageModel: ImageModel;
  videoModel: VideoModel;
  workflow: Workflow;
  videoAutoplay: VideoAutoplayMode;
  videoResolution: "1080p" | "720p";
  videoDuration: 4 | 6 | 8; // NEW: Default video duration
}
```

**Default Value:**

```typescript
export const DEFAULT_SETTINGS: Settings = {
  sceneCount: 8,
  chatModel: "gemini-2.5-flash",
  imageModel: "imagen-4.0-generate-001",
  videoModel: "veo-3.1-generate-preview",
  workflow: "music-video",
  videoAutoplay: "on-generate",
  videoResolution: "1080p",
  videoDuration: 8, // NEW: Default to 8s for 1080p compatibility
};
```

## Data Models

### Model Capabilities Matrix

**Location:** `server/services/videoModelCapabilities.ts`

**Updated Structure:**

```typescript
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
          "1080p": [8], // 1080p ONLY supports 8s
          "720p": [4, 6, 8],
        },
      },
      "9:16": {
        maxResolution: "1080p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "1080p": [8], // 1080p ONLY supports 8s
          "720p": [4, 6, 8],
        },
      },
    },
  },
  "veo-3.1-fast-generate-preview": {
    // Same as veo-3.1-generate-preview
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
          "1080p": [8],
          "720p": [4, 6, 8],
        },
      },
      "9:16": {
        maxResolution: "1080p",
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "1080p": [8],
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
          "1080p": [8], // 1080p ONLY supports 8s
          "720p": [4, 6, 8],
        },
      },
      "9:16": {
        maxResolution: "720p", // 9:16 limited to 720p
        supportedDurations: [4, 6, 8],
        durationConstraints: {
          "720p": [4, 6, 8],
        },
      },
    },
  },
  "veo-3.0-fast-generate-001": {
    supportsResolution: true,
    supportedResolutions: ["720p"], // Only 720p
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
    supportsResolution: false, // No resolution parameter
    supportedResolutions: [],
    supportsReferenceImages: false,
    supportsLastFrame: false,
    supportsExtension: false,
    aspectRatioConstraints: {
      "16:9": {
        maxResolution: "720p",
        supportedDurations: [5, 6, 8], // Note: 5s instead of 4s
        durationConstraints: {
          "720p": [5, 6, 8],
        },
      },
      "9:16": {
        maxResolution: "720p",
        supportedDurations: [5, 6, 8],
        durationConstraints: {
          "720p": [5, 6, 8],
        },
      },
    },
  },
};
```

### Validation Error Response

**Structure:**

```typescript
interface ValidationErrorResponse {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
}
```

**Example:**

```json
{
  "valid": false,
  "errors": [
    {
      "field": "resolution",
      "message": "Model veo-3.0-generate-001 does not support 1080p for 9:16 aspect ratio",
      "suggestion": "Use 720p resolution or switch to 16:9 aspect ratio"
    },
    {
      "field": "duration",
      "message": "1080p resolution requires 8-second duration",
      "suggestion": "Change duration to 8 seconds or use 720p resolution"
    }
  ]
}
```

## Error Handling

### Client-Side Validation

**Location:** AnimateModal, ExtendModal

**Strategy:**
1. Validate on every settings change
2. Display inline warnings/errors
3. Disable submit button if invalid
4. Provide actionable suggestions

**Example Error Messages:**

- "1080p resolution requires 8-second duration. Duration has been auto-adjusted."
- "Reference images are only supported on Veo 3.1 models. Please select Veo 3.1 or Veo 3.1 Fast."
- "Reference images require 16:9 aspect ratio. Your scene is 9:16."
- "Veo 3.0 does not support 1080p for 9:16 videos. Maximum resolution: 720p."

### Server-Side Validation

**Location:** `server/services/videoModelCapabilities.ts`

**Strategy:**
1. Validate all parameters before API call
2. Throw `VideoParameterValidationError` with detailed message
3. Include model name, constraint violated, and suggestion
4. Log validation failures for debugging

**Example Error Responses:**

```typescript
throw new VideoParameterValidationError(
  `Resolution 1080p requires duration to be 8 seconds for model ${model}, but got ${duration}s. ` +
  `Please set duration to 8 seconds or use 720p resolution.`
);

throw new VideoParameterValidationError(
  `Model ${model} does not support reference images. This feature is only available in Veo 3.1 models. ` +
  `Please use veo-3.1-generate-preview or veo-3.1-fast-generate-preview.`
);

throw new VideoParameterValidationError(
  `Reference images only support 16:9 aspect ratio. Current aspect ratio: ${aspectRatio}. ` +
  `Please change scene aspect ratio to 16:9 or remove reference images.`
);
```

### API Error Handling

**Location:** `server/services/geminiClient.ts`

**Strategy:**
1. Catch API errors and extract meaningful messages
2. Include request ID for debugging
3. Determine if error is retryable
4. Log full error details server-side

**Example:**

```typescript
try {
  let operation = await client.models.generateVideos({...});
  // ... polling logic
} catch (error: any) {
  const apiError = error as any;
  const errorMessage = apiError.message || "Video generation failed";
  const requestId = randomUUID();
  
  console.error(`[Video Generation Error] ${errorMessage}`, {
    requestId,
    model,
    resolution: finalResolution,
    duration: finalDuration,
    aspectRatio,
    error: apiError,
  });
  
  throw Object.assign(
    new Error(
      `Video generation failed: ${errorMessage}. Request ID: ${requestId}`
    ),
    {
      statusCode: apiError.status || 500,
      errorCode: apiError.code || "VIDEO_GENERATION_FAILED",
      retryable: apiError.status >= 500,
      requestId,
    }
  );
}
```


## Testing Strategy

### Unit Tests

**Backend Tests:**

1. **Model Capabilities Validation** (`server/services/videoModelCapabilities.test.ts`)
   - Test `validateResolution()` for all models and aspect ratios
   - Test `validateReferenceImages()` for supported/unsupported models
   - Test `validateLastFrame()` for supported/unsupported models
   - Test `validateVideoExtension()` for duration limits
   - Test `getDefaultDuration()` returns correct values
   - Test `getDefaultResolution()` returns correct values
   - Test `validateParameterCombination()` catches all invalid combinations

2. **Video Generation Service** (`server/services/geminiClient.test.ts`)
   - Mock Gemini API client
   - Test `generateSceneVideo()` with various parameter combinations
   - Test `extendSceneVideo()` with valid/invalid durations
   - Verify correct parameters sent to API
   - Verify `personGeneration` parameter added when needed
   - Verify resolution parameter omitted for Veo 2.0

**Frontend Tests:**

1. **AnimateModal Component** (`src/features/storyboard/components/__tests__/AnimateModal.test.tsx`)
   - Test model selector updates available options
   - Test resolution selector disables invalid options
   - Test duration selector disables invalid options
   - Test validation errors display correctly
   - Test auto-adjustment of duration when 1080p selected
   - Test auto-adjustment of duration when reference images added
   - Test submit disabled when validation fails

2. **ChatInputArea Component** (`src/components/__tests__/ChatInputArea.test.tsx`)
   - Test file upload functionality
   - Test file removal
   - Test action buttons
   - Test keyboard shortcuts
   - Test disabled state

### Integration Tests

**API Tests** (`server/routes/ai.test.ts`):

1. Test `/api/ai/video` endpoint with valid parameters
2. Test `/api/ai/video` endpoint with invalid resolution/duration combination
3. Test `/api/ai/video` endpoint with reference images
4. Test `/api/ai/video` endpoint with last frame
5. Test `/api/ai/video/extend` endpoint with valid parameters
6. Test `/api/ai/video/extend` endpoint with duration exceeding limit

### Manual Testing Checklist

**Video Generation:**
- [ ] Generate video with Veo 3.1 at 1080p (should use 8s duration)
- [ ] Generate video with Veo 3.1 at 720p with 6s duration
- [ ] Generate video with Veo 3.0 at 1080p 16:9 (should work)
- [ ] Generate video with Veo 3.0 at 1080p 9:16 (should fail validation)
- [ ] Generate video with Veo 3.0 Fast at 720p (should work)
- [ ] Generate video with Veo 2.0 (should omit resolution parameter)
- [ ] Generate video with reference images on Veo 3.1 (should work)
- [ ] Generate video with reference images on Veo 3.0 (should fail validation)
- [ ] Generate video with last frame on Veo 3.1 (should work)
- [ ] Generate video with 9:16 aspect ratio and reference images (should fail validation)

**Video Extension:**
- [ ] Extend video with Veo 3.1 (should work)
- [ ] Extend video with Veo 3.0 (should fail validation)
- [ ] Extend video beyond 141s (should fail validation)
- [ ] Extend video multiple times (1-20 extensions)

**UI Validation:**
- [ ] Select 1080p → duration auto-adjusts to 8s
- [ ] Select Veo 3.0 with 9:16 scene → 1080p option disabled
- [ ] Add reference images → duration auto-adjusts to 8s
- [ ] Select Veo 3.0 → reference images option hidden
- [ ] Validation errors display with clear messages
- [ ] Submit button disabled when validation fails
- [ ] Tooltips display correct information

## Deployment Considerations

### Database Migrations

No database schema changes required.

### Environment Variables

No new environment variables required. Existing `DEFAULT_VIDEO_MODEL` continues to work.

### Backward Compatibility

**Breaking Changes:**
- None. All changes are additive or fix existing bugs.

**Deprecations:**
- None.

**Migration Path:**
- Existing video generation requests will continue to work
- New parameters (duration, referenceImages, lastFrame) are optional
- Default behavior improved to prevent errors

### Performance Impact

**Expected Improvements:**
- Fewer failed API requests due to validation
- Reduced retry attempts
- Better user experience with immediate feedback

**Potential Concerns:**
- Client-side validation adds minimal overhead
- File-to-base64 conversion for reference images may take 100-500ms
- No impact on server performance

### Monitoring

**Metrics to Track:**
- Video generation success rate by model
- Validation error frequency by error type
- Average time to generate video by model and resolution
- Extension success rate

**Logging:**
- Log all validation failures with details
- Log all API errors with request ID
- Log parameter combinations for successful generations

### Rollback Plan

If issues arise:
1. Revert backend changes to `geminiClient.ts` and `videoModelCapabilities.ts`
2. Revert frontend modal changes
3. Keep existing simple UI
4. Monitor error rates return to baseline

No data loss risk as all changes are to generation logic, not storage.

## Documentation Updates

### User-Facing Documentation

**Update:** `docs/API.md`

Add section on video generation parameters:
- Resolution options by model
- Duration requirements
- Reference images usage (Veo 3.1 only)
- Last frame interpolation (Veo 3.1 only)
- Extension limitations

**Update:** `docs/CONFIGURATION.md`

Add section on video settings:
- `videoResolution` setting
- `videoDuration` setting (new)
- Model selection guidance

### Developer Documentation

**Update:** `docs/ARCHITECTURE.md`

Add section on video generation validation:
- Model capabilities matrix
- Validation flow
- Error handling strategy

**Create:** `docs/VIDEO_GENERATION.md`

New document covering:
- Veo model comparison table
- Resolution/duration constraints by model
- Reference images guide
- Extension guide
- Troubleshooting common errors

### Code Comments

Add comprehensive JSDoc comments to:
- `videoModelCapabilities.ts` - all exported functions
- `geminiClient.ts` - `generateSceneVideo()` and `extendSceneVideo()`
- `AnimateModal.tsx` - validation logic
- `ChatInputArea.tsx` - component props and usage

## Future Enhancements

### Phase 2 Improvements

1. **Preset Configurations:**
   - Save favorite model/resolution/duration combinations
   - Quick-select presets in modal

2. **Batch Generation:**
   - Generate videos for multiple scenes at once
   - Queue management for long-running jobs

3. **Advanced Features:**
   - Negative prompts UI
   - Seed parameter for reproducibility
   - Style transfer from reference videos

4. **Analytics:**
   - Track which models users prefer
   - Identify common validation errors
   - Optimize default settings based on usage

5. **Cost Optimization:**
   - Display estimated cost per generation
   - Warn when using expensive models
   - Suggest cheaper alternatives

### Technical Debt

1. **Shared Constants:**
   - Export MODEL_CAPABILITIES to frontend
   - Avoid duplicating validation logic
   - Consider generating TypeScript types from capabilities matrix

2. **Component Refactoring:**
   - Extract SettingsPanel as separate component
   - Create ModelSelector as reusable component
   - Unify EditModal and AnimateModal structure

3. **Testing:**
   - Add E2E tests for full video generation flow
   - Add visual regression tests for modals
   - Mock Gemini API responses for deterministic tests

## References

- [Google Veo API Documentation](https://ai.google.dev/gemini-api/docs/video)
- [Veo 3.1 Announcement](https://blog.google/technology/ai/google-veo-3-1/)
- [Gemini API Video Parameters](https://ai.google.dev/gemini-api/docs/video#veo-api-parameters-and-specifications)
- [StoryBoard Architecture Docs](docs/ARCHITECTURE.md)
- [StoryBoard API Docs](docs/API.md)

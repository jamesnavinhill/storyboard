# Design Document

## Overview

This feature adds model information display to the Scene Manager Panel's Details tab. The implementation involves minimal changes to both backend and frontend:

1. **Backend**: Ensure asset metadata (including model information) is included when enriching scenes
2. **Frontend**: Display model information in the SceneManageDrawer component between the media preview and description field

The design prioritizes simplicity and minimal UI changes, displaying model data only when available without adding visual clutter.

## Architecture

### Data Flow

```,
Database (assets.metadata)
    ↓
enrichScenesWithAssets() - attaches asset objects to scenes
    ↓
API Response (scenes with imageAsset/videoAsset metadata)
    ↓
SceneManageDrawer component - extracts and displays model from metadata
```

### Key Components

1. **server/utils/sceneEnrichment.ts**: Already enriches scenes with asset URLs and status. Needs to include full asset objects (with metadata) in the enriched scene data.

2. **src/features/scene/components/SceneManageDrawer.tsx**: Displays scene details. Will be enhanced to show model information extracted from asset metadata.

## Components and Interfaces

### Backend Changes

#### Scene Enrichment Enhancement

The `enrichScenesWithAssets` function currently returns scenes with asset IDs, URLs, and status. We need to extend the return type to include asset metadata:

```typescript
// server/utils/sceneEnrichment.ts
export const enrichScenesWithAssets = (
  db: SqliteDatabase,
  scenes: Scene[]
): Array<
  Scene & {
    primaryImageAssetId: string | null;
    primaryVideoAssetId: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    imageStatus: "ready" | "missing" | "absent";
    videoStatus: "ready" | "missing" | "absent";
    imageAsset?: Asset | null;  // NEW: Include full asset object
    videoAsset?: Asset | null;  // NEW: Include full asset object
  }
> => {
  // ... existing logic ...
  
  return {
    ...scene,
    primaryImageAssetId,
    primaryVideoAssetId,
    imageUrl,
    videoUrl,
    imageStatus,
    videoStatus,
    imageAsset: imageAsset ?? null,  // NEW
    videoAsset: videoAsset ?? null,  // NEW
  };
};
```

### Frontend Changes

#### Type Extensions

Add asset objects to the Scene type used in the frontend:

```typescript
// src/types.ts or local to SceneManageDrawer
interface EnrichedScene extends Scene {
  imageAsset?: {
    metadata?: Record<string, unknown> | null;
  } | null;
  videoAsset?: {
    metadata?: Record<string, unknown> | null;
  } | null;
}
```

#### SceneManageDrawer Component

Add a new section between the media preview and description field to display model information:

```tsx
// src/features/scene/components/SceneManageDrawer.tsx

// Helper function to extract model name from asset metadata
const getModelFromAsset = (asset?: { metadata?: Record<string, unknown> | null } | null): string | null => {
  if (!asset?.metadata) return null;
  const model = asset.metadata.model;
  return typeof model === 'string' ? model : null;
};

// In the Details tab render, after the media preview and before description:
{activeTab === "details" ? (
  <ManagerTabContent>
    {/* ... existing scene title ... */}
    
    {/* ... existing media preview ... */}
    
    {/* NEW: Model information display */}
    {(() => {
      const imageModel = getModelFromAsset((scene as any).imageAsset);
      const videoModel = getModelFromAsset((scene as any).videoAsset);
      
      if (!imageModel && !videoModel) return null;
      
      return (
        <div className="text-xs text-muted px-1 py-1">
          {imageModel && <div>Image: {imageModel}</div>}
          {videoModel && <div>Video: {videoModel}</div>}
        </div>
      );
    })()}
    
    {/* ... existing description field ... */}
  </ManagerTabContent>
) : ...}
```

## Data Models

### Asset Metadata Structure

Assets already have a `metadata` field that stores JSON data. The model information is stored as:

```json
{
  "model": "imagen-4.0-generate-001"
}
```

or

```json
{
  "model": "veo-3.1-generate-preview"
}
```

### Enriched Scene Type

```typescript
interface EnrichedScene extends Scene {
  // Existing fields
  imageUrl?: string;
  videoUrl?: string;
  imageStatus: SceneAssetStatus;
  videoStatus: SceneAssetStatus;
  
  // New fields
  imageAsset?: Asset | null;
  videoAsset?: Asset | null;
}
```

## Error Handling

### Missing or Malformed Metadata

- If `asset.metadata` is `null` or `undefined`, no model information is displayed
- If `asset.metadata.model` is not a string, it is ignored
- The UI gracefully handles missing data without errors or warnings

### Asset Not Found

- If a scene has no primary image or video asset, no model information is displayed
- The component checks for asset existence before attempting to access metadata

## Testing Strategy

### Backend Tests

1. **Unit test for enrichScenesWithAssets**:
   - Verify that asset objects are included in enriched scenes
   - Verify that metadata is preserved in the asset objects
   - Test with scenes that have no assets
   - Test with assets that have no metadata

### Frontend Tests

1. **Component test for SceneManageDrawer**:
   - Render with scene containing image asset with model metadata
   - Render with scene containing video asset with model metadata
   - Render with scene containing both assets with model metadata
   - Render with scene containing assets without model metadata
   - Render with scene containing no assets
   - Verify model information is displayed in correct location
   - Verify styling is subtle and unobtrusive

### Integration Tests

1. **API test**:
   - Fetch project with scenes
   - Verify enriched scenes include asset metadata
   - Verify model information can be extracted from response

## Implementation Notes

### Minimal Changes

This design intentionally minimizes changes to existing code:

- Backend: Only adds two fields to the enrichment return type
- Frontend: Only adds a small conditional render block
- No new API endpoints required
- No database schema changes required
- No migration required

### Performance Considerations

- Asset objects are already fetched during enrichment, so no additional database queries
- Metadata is already parsed from JSON during asset retrieval
- The additional data in API responses is minimal (< 1KB per scene)

### Styling

The model information uses:

- `text-xs`: Small font size (12px)
- `text-muted`: Subtle color (lower contrast)
- `px-1 py-1`: Minimal padding
- No borders, backgrounds, or other visual elements
- Positioned between media and description for logical flow

### Future Enhancements

Potential future improvements (not in scope for this feature):

- Display additional metadata (resolution, duration, generation parameters)
- Make model names clickable to show full generation details
- Add tooltips with model descriptions
- Display model information in other views (storyboard grid, history)

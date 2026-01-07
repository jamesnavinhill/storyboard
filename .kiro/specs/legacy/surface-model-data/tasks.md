# Implementation Plan

- [x] 1. Enhance backend scene enrichment to include asset metadata

  - Modify `enrichScenesWithAssets` function in `server/utils/sceneEnrichment.ts` to include full asset objects (with metadata) in the returned scene data
  - Update the return type to include `imageAsset` and `videoAsset` fields
  - Ensure asset objects are properly attached to enriched scenes
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 2. Add model information display to SceneManageDrawer component *claimed to have been done but not showing in UI*








  - [ ] 2.1 Create helper function to extract model from asset metadata

    - Write `getModelFromAsset` function that safely extracts the model string from asset metadata
    - Handle cases where metadata is null, undefined, or malformed


    - _Requirements: 3.2, 3.3_
  
  - [ ] 2.2 Add model information UI to Details tab

    - Insert model display section between media preview and description field
    - Display image model when available
    - Display video model when available
    - Use subtle styling (text-xs, text-muted, minimal padding)
    - Only render when at least one model is available
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Add tests for model information display
  - [ ] 3.1 Write backend tests for scene enrichment
    - Test that asset objects are included in enriched scenes
    - Test that metadata is preserved in asset objects
    - Test with scenes that have no assets
    - Test with assets that have no metadata
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 3.2 Write frontend component tests
    - Test rendering with image asset containing model metadata
    - Test rendering with video asset containing model metadata
    - Test rendering with both assets containing model metadata
    - Test rendering with assets without model metadata
    - Test rendering with no assets
    - Verify model information appears in correct location
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.3_

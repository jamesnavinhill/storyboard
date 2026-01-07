# Implementation Plan

- [x] 1. Add Veo 3.1 model support





  - Add "veo-3.1-generate-001" to VideoModel type in `src/types.ts`
  - Add "veo-3.1-generate-001" to videoModelSchema in `server/validation.ts`
  - Add Veo 3.1 option to SettingsPanel UI in `src/features/settings/components/SettingsPanel.tsx`
  - Update video generation logic in `server/services/geminiClient.ts` to handle Veo 3.1 with 1080p support for all aspect ratios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Fix Veo 2.0 video generation

  - Modify `generateSceneVideo` function in `server/services/geminiClient.ts` to conditionally omit resolution parameter for Veo 2.0
  - Add model-specific configuration logic to handle resolution parameter based on model capabilities
  - Test Veo 2.0 video generation to ensure it works without errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Verify and fix Imagen 3 and Imagen 4 Fast integration
  - Verify model identifiers in `server/validation.ts` match actual Gemini API model IDs
  - Test image generation with Imagen 3 model
  - Test image generation with Imagen 4 Fast model
  - If failures occur, investigate API response errors and update model identifiers or configuration as needed
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Fix global settings panel model selection
- [x] 4.1 Locate where EnhancedSettingsSheet is rendered

  - Search for EnhancedSettingsSheet usage in app-shell or main app component
  - Identify the parent component that passes onSettingsChange callback
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.2 Debug and fix onSettingsChange callback

  - Add logging to verify onSettingsChange is being called when model options are clicked
  - Verify the callback updates the settings store (Zustand)
  - Compare implementation with working chat panel settings
  - Fix the callback to properly update settings state
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [-] 4.3 Verify settings updates trigger re-renders

  - Ensure settings changes in global panel update the UI
  - Test all model selection options (chat, image, video models)
  - Test workflow selection and scene count slider
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 5. Fix groups and tags visibility in manager panel



- [x] 5.1 Locate where GroupsTagsInlineManagers is rendered


  - Find the parent component that renders GroupsInlineManager and TagsInlineManager
  - Identify how groups and tags data is fetched and passed to the component
  - _Requirements: 5.1, 5.2, 5.3, 5.4_


- [x] 5.2 Fix data fetching and state updates

  - Ensure groups and tags are fetched when the manager panel mounts
  - Add refetch logic after create/delete operations
  - Verify Zustand store is properly updating with new groups/tags
  - Ensure component subscribes to correct store slices
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


- [x] 5.3 Test group and tag creation flow


  - Create a new group and verify it appears immediately
  - Create a new tag and verify it appears immediately
  - Delete a group/tag and verify it's removed from display
  - _Requirements: 5.1, 5.2, 5.5_

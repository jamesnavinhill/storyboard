# Implementation Plan

- [x] 1. Fix aspect ratio handling and add resolution settings

- [x] 1.1 Add videoResolution to Settings type in `src/types.ts`

  - Add `videoResolution: "1080p" | "720p"` to Settings interface
  - _Requirements: 2.1, 2.2_

- [x] 1.2 Update settings validation schema in `server/validation.ts`

  - Add videoResolution to upsertSettingsSchema
  - _Requirements: 2.2, 2.3_

- [x] 1.3 Add resolution selector to SettingsPanel UI

  - Add resolution section with 1080p/720p options in `src/features/settings/components/SettingsPanel.tsx`
  - Include helper text about model-specific constraints
  - _Requirements: 2.2, 2.3_

- [x] 1.4 Update video generation to use resolution setting

  - Modify video generation API call to pass resolution from settings
  - Add logging to track aspect ratio and resolution parameters
  - _Requirements: 1.1, 1.2, 1.3, 2.4_

- [x] 1.5 Add aspect ratio verification logging

  - Log requested vs received aspect ratio in `server/services/geminiClient.ts`
  - Add metadata to video generation response for debugging
  - _Requirements: 1.4, 1.5_
-

- [x] 2. Implement video extension backend

- [x] 2.1 Create video extension validation schema

  - Add aiExtendVideoSchema to `server/validation.ts` with extensionCount (1-20)
  - _Requirements: 3.3, 3.6_

- [x] 2.2 Implement extendSceneVideo service function

  - Create extendSceneVideo function in `server/services/geminiClient.ts`
  - Implement loop to extend video multiple times (up to 20)
  - Each extension adds 7 seconds at 720p
  - Return combined video (original + all extensions)
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 2.3 Create video extension API endpoint

  - Add POST /api/ai/video/extend route in `server/routes/ai.ts`
  - Validate input video is ≤141 seconds
  - Calculate max extensions based on current duration
  - Call extendSceneVideo service
  - Persist combined video asset with metadata
  - _Requirements: 3.1, 3.4, 3.5, 3.7_

- [x] 3. Add reference images and last frame support

- [x] 3.1 Update generateSceneVideo signature

  - Add optional referenceImages and lastFrame parameters to `server/services/geminiClient.ts`
  - _Requirements: 4.2, 5.2_

- [x] 3.2 Implement reference images validation and API call

  - Validate max 3 reference images
  - Enforce 16:9 aspect ratio and 8s duration for reference images
  - Set personGeneration to "allow_adult"
  - Add referenceImages to Gemini API config
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.3 Implement last frame interpolation

  - Validate lastFrame requires initial image
  - Enforce 8s duration for interpolation
  - Support both 16:9 and 9:16 aspect ratios
  - Set personGeneration to "allow_adult"
  - Add lastFrame to Gemini API config
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.4 Update video generation validation schema

  - Add optional referenceImages and lastFrame to aiGenerateVideoSchema
  - _Requirements: 4.2, 5.2_
- [x] 4. Create modal components using existing styles (no transparent backgrounds!!)

- [x] 4. Create modal components using existing styles (no transparent backgrounds!!)

- [x] 4.1 Create EditModal component

  - Create `src/features/storyboard/components/EditModal.tsx`
  - Display scene image prominently
  - Include prompt textarea
  - Add AI suggest button
  - Add generate button
  - Style as centered modal matching design system
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 4.2 Create AnimateModal component

  - Create `src/features/storyboard/components/AnimateModal.tsx`
  - Display scene image prominently
  - Include prompt textarea with default from scene description
  - Add reference images upload (max 3)
  - Add last frame upload
  - Add AI suggest button
  - Add generate button
  - Style as centered modal matching design system
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.2_

- [x] 4.3 Create ExtendModal component

  - Create `src/features/storyboard/components/ExtendModal.tsx`
  - Display scene video with controls
  - Show current duration and max extensions
  - Add extension count slider (1-20)
  - Display final duration calculation
  - Include prompt textarea
  - Add extend button
  - Style as centered modal matching design system
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 4.4 Add modal CSS styles

  - Use modal overlay, content, header, and body styles from global CSS
  - Ensure responsive design for mobile
  - _Requirements: 6.1_

- [x] 5. Update SceneCard and parent components

- [x] 5.1 Remove inline panel logic from SceneCard

  - Remove SceneEditPanel and SceneAnimatePanel imports and renders
  - Remove inline panel state management
  - Update menu items to call modal callbacks
  - Add extend button to menu- right below the existing "animate" option (only show if video exists)
  - _Requirements: 6.1, 6.5_

- [x] 5.2 Add modal state management to parent component

  - Add state for editModalScene, animateModalScene, extendModalScene
  - Implement handleToggleEdit, handleToggleAnimate, handleToggleExtend
  - Render modals at parent level
  - _Requirements: 6.1, 6.2_

- [x] 5.3 Implement modal submit handlers

  - Create handleEditSubmit to call edit image API
  - Create handleAnimateSubmit to call video generation API with optional reference images and last frame
  - Create handleExtendSubmit to call video extension API with extension count
  - Handle file uploads for reference images and last frame
  - _Requirements: 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [x] 6. Add API parameter validation

- [x] 6.1 Create model capabilities matrix

  - Define MODEL_CAPABILITIES constant with support flags for each model
  - Include resolution, reference images, last frame, and extension support
  - Include aspect ratio constraints per model
  - _Requirements: 8.1_

- [x] 6.2 Implement parameter validation functions


  - Create validateResolution function
  - Create validateReferenceImages function
  - Create validateVideoExtension function
  - Call validation functions before API calls
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6.3 Add comprehensive error messages



  - Provide clear error messages for each validation failure
  - Include current values and constraints in error messages
  - _Requirements: 8.5_

- [ ] 7. Testing and verification

- [ ] 7.1 Test aspect ratio handling

  - Generate videos with 16:9 and verify output
  - Generate videos with 9:16 and verify output
  - Check logs for aspect ratio parameters
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7.2 Test resolution settings

  - Change resolution to 720p and generate video
  - Change resolution to 1080p and generate video
  - Verify Veo 2.0 ignores resolution parameter
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 7.3 Test video extension

  - Extend video with 1 extension
  - Extend video with 5 extensions
  - Extend video with 20 extensions
  - Verify combined video duration
  - Try to extend beyond 141s limit
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 7.4 Test reference images

  - Upload 1 reference image and generate video
  - Upload 3 reference images and generate video
  - Try to upload 4 reference images (should fail)
  - Verify 16:9 constraint
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7.5 Test last frame interpolation

  - Upload last frame and generate video
  - Verify 8s duration
  - Test with both 16:9 and 9:16
  - Try last frame without initial image (should fail)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.6 Test modal UI

  - Open edit modal and verify image display
  - Open animate modal and verify file uploads
  - Open extend modal and verify video player
  - Test modal close on overlay click
  - Test modal close on X button
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

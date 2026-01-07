# Implementation Plan

- [x] 1. Fix backend video model capabilities and validation

- [x] 1.1 Update MODEL_CAPABILITIES matrix with correct duration constraints

  - Fix duration constraints to specify 1080p requires 8s only
  - Add durationConstraints nested object for each resolution
  - Verify all models have correct aspect ratio limits
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 1.2 Implement getDefaultDuration() helper function

  - Return 8 if resolution is 1080p
  - Return 8 if hasReferenceImages is true
  - Return 8 if hasLastFrame is true
  - Otherwise return 6 as default
  - _Requirements: 1.3, 8.1, 8.2_

- [x] 1.3 Implement getDefaultResolution() helper function

  - Check model capabilities for aspect ratio
  - Return maxResolution from aspectRatioConstraints
  - Handle Veo 2.0 special case (no resolution parameter)
  - _Requirements: 8.1, 8.3_

- [x] 1.4 Implement validateParameterCombination() function

  - Validate resolution + duration combination
  - Validate reference images + aspect ratio
  - Validate last frame + initial image
  - Return array of validation errors with suggestions

  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.5 Update validateResolution() to check duration constraints

  - Add duration parameter to function signature
  - Check if duration is valid for selected resolution
  - Throw error with specific constraint violation message
  - _Requirements: 1.3, 2.1_

- [x] 2. Fix generateSceneVideo() function

- [x] 2.1 Add duration parameter to function signature

  - Make duration optional with proper TypeScript typing
  - Update JSDoc comments
  - _Requirements: 1.1, 9.1_

- [x] 2.2 Update duration calculation logic
  - Use getDefaultDuration() instead of hardcoded values
  - Remove incorrect conditional logic for 1080p
  - Pass all relevant parameters to getDefaultDuration()
  - _Requirements: 1.3, 9.3_

- [x] 2.3 Add personGeneration parameter for reference images
  - Check if referenceImages array has items
  - Set personGeneration to "allow_adult" when present
  - Add to config object

  - _Requirements: 1.4, 9.4_

- [x] 2.4 Add personGeneration parameter for last frame
  - Check if lastFrame is provided
  - Set personGeneration to "allow_adult" when present

  - Add to config object
  - _Requirements: 1.4, 9.5_

- [x] 2.5 Improve logging for video generation
  - Log all parameters before API call
  - Include model, resolution, duration, reference images count, last frame presence
  - Log final calculated values, not just requested values
  - _Requirements: 10.3_

- [x] 3. Fix extendSceneVideo() function

- [x] 3.1 Remove encoding parameter from config

  - Delete any encoding-related code
  - Verify config only includes supported parameters
  - Add comment explaining why encoding is not included
  - _Requirements: 3.1, 3.3_

- [x] 3.2 Ensure 720p resolution for all extensions

  - Hardcode resolution to "720p" in config
  - Add comment citing Google documentation
  - _Requirements: 3.3_

- [x] 3.3 Improve error messages for extension failures

  - Include extension number in error messages
  - Add request ID to errors
  - Suggest compatible models if wrong model used
  - _Requirements: 3.2, 10.2_

- [ ] 3.4 Update extension API to accept model parameter

  - Add model parameter to extendSceneVideo() function
  - Update API route to accept model in request body
  - Validate that only Veo 3.1 models are used for extension
  - Pass model to Gemini API for extension operation
  - _Requirements: 3.1, 3.2_

- [x] 4. Update API route handlers

- [x] 4. Update API route handlers

- [x] 4.1 Update aiGenerateVideoSchema validation

  - Add duration field as optional number (4-8)
  - Add referenceImages as optional array (max 3)
  - Add lastFrame as optional object
  - _Requirements: 1.1, 9.1_

- [x] 4.2 Update /api/ai/video route handler

  - Parse duration from request body
  - Parse referenceImages from request body
  - Parse lastFrame from request body
  - Pass all parameters to generateSceneVideo()
  - _Requirements: 1.1, 9.1, 9.4, 9.5_

- [x] 4.3 Add validation error handling

  - Catch VideoParameterValidationError
  - Return 400 status with detailed error message
  - Include suggestions in response
  - _Requirements: 2.5, 10.1, 10.2_

- [x] 5. Create reusable ChatInputArea component

- [x] 5.1 Create new ChatInputArea component file

  - Define props interface with all required fields
  - Implement textarea with auto-resize
  - Add keyboard shortcut handling (Enter to submit)
  - _Requirements: 6.1, 6.3_

- [x] 5.2 Implement file upload UI in ChatInputArea

  - Add file input with hidden styling
  - Display attached files as thumbnails
  - Add remove button for each file
  - Support multiple files
  - _Requirements: 6.2, 6.5_

- [x] 5.3 Implement icon row in ChatInputArea

  - Create composer-bottom section
  - Add action buttons from props
  - Style consistently with chat panel
  - _Requirements: 6.1, 6.4_

- [x] 5.4 Add file validation to ChatInputArea

  - Check file types (image/*)
  - Check file sizes (max 10MB)
  - Display error messages for invalid files
  - _Requirements: 6.2_
-

- [x] 6. Enhance AnimateModal component

- [x] 6.1 Add model selector UI

  - Create dropdown with all Veo models
  - Display model names with descriptions
  - Add info tooltip explaining model differences
  - Wire up to state
  - _Requirements: 5.1, 5.2_

- [x] 6.2 Add resolution selector UI
  - Create button group for 720p/1080p
  - Disable options based on model capabilities
  - Show "(8s)" indicator for 1080p
  - Add tooltip with model-specific constraints
  - _Requirements: 4.1, 4.3, 7.1_

- [x] 6.3 Add duration selector UI
  - Create button group for 4s/6s/8s
  - Disable options based on model and resolution
  - Add tooltip explaining duration requirements
  - Wire up to state

  - _Requirements: 4.2, 4.3, 7.2_

- [x] 6.4 Implement client-side validation logic
  - Create validateConfiguration() function
  - Check resolution + duration compatibility
  - Check reference images + aspect ratio
  - Check model capabilities

  - Return array of error messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6.5 Add validation warnings display
  - Create error panel component
  - Display all validation errors

  - Style with red background and alert icon
  - Show actionable suggestions
  - _Requirements: 2.5, 7.4_

- [x] 6.6 Implement auto-adjustment logic
  - Auto-set duration to 8s when 1080p selected

  - Auto-set duration to 8s when reference images added
  - Auto-set duration to 8s when last frame added
  - Use useEffect hooks for reactive updates
  - _Requirements: 8.1, 8.4_

- [x] 6.7 Replace textarea with ChatInputArea component
  - Remove existing textarea code

  - Import and use ChatInputArea
  - Pass prompt value and onChange
  - Configure file upload for reference images
  - Add AI Suggest action to icon row
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.8 Update onSubmit to pass new parameters
  - Include selected model
  - Include selected resolution
  - Include selected duration
  - Include reference images files
  - Include last frame file
  - _Requirements: 1.1, 9.1, 9.4, 9.5_
- [x] 7. Update EditModal component

- [x] 7. Update EditModal component

- [x] 7.1 Replace textarea with ChatInputArea component

  - Remove existing textarea code
  - Import and use ChatInputArea
  - Add AI Suggest action to icon row
  - Maintain existing functionality
  - _Requirements: 6.1, 6.3_

-

- [x] 8. Update ExtendModal component

- [x] 8.1 Replace textarea with ChatInputArea component

  - Remove existing textarea code
  - Import and use ChatInputArea
  - Maintain existing functionality
  - _Requirements: 6.1, 6.3_

- [x] 8.2 Fix video extension model validation

  - Remove blocking warning for non-3.1 Veo videos (any Veo video can be extended)
  - Add model selector with only Veo 3.1 and Veo 3.1 Fast options
  - Check if video is Veo-generated (not which specific Veo model)
  - Default to Veo 3.1 for extension operations
  - Update onSubmit to pass selected extension model
  - Assure that the selected models in the animate.extend modals are being respected and overriding globals
  - surface the model used to geenrate a scene in the managerpanel details section, below the image, above the description, simple clean surfacing of model
  - _Requirements: 3.1, 3.2_

- [x] 9. Update frontend service layer

- [x] 9.1 Update GenerateVideoRequest interface

  - Add duration field as optional number
  - Add referenceImages field as optional File array
  - Add lastFrame field as optional File
  - _Requirements: 1.1, 9.1_

- [x] 9.2 Implement fileToBase64() helper function

  - Use FileReader API
  - Return promise with base64 string
  - Handle errors appropriately
  - _Requirements: 9.4, 9.5_

- [x] 9.3 Update generateVideo() in server.ts

  - Convert reference images to base64
  - Convert last frame to base64
  - Include duration in request body
  - Increase timeout to 5 minutes
  - _Requirements: 9.1, 9.4, 9.5_

- [x] 10. Update Settings types and defaults

- [x] 10.1 Add videoDuration to Settings interface

  - Add field with type 4 | 6 | 8
  - Update TypeScript types
  - _Requirements: 8.1_

- [x] 10.2 Update DEFAULT_SETTINGS

  - Set videoDuration to 8 (for 1080p compatibility)
  - Ensure videoResolution is "1080p"
  - Ensure videoModel is "veo-3.1-generate-preview"
  - _Requirements: 8.1, 8.2_

-

- [x] 11. Add model capabilities to frontend

- [x] 11.1 Create shared constants file for model capabilities

  - Export MODEL_CAPABILITIES from backend
  - Create frontend-compatible version
  - Add helper functions for capability checks
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 11.2 Create useModelCapabilities hook

  - Accept model and aspect ratio as parameters
  - Return available resolutions
  - Return available durations
  - Return feature support flags
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 12. Improve error messages and user feedback
-

- [x] 12.1 Create InfoTooltip component

  - Accept content prop
  - Display on hover
  - Style consistently
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 12.2 Add help link to Google documentation

  - Add help icon to modal header
  - Link to official Veo API docs
  - Open in new tab
  - _Requirements: 7.5_

- [x] 12.3 Improve API error messages

  - Parse Google API error responses
  - Extract meaningful error messages
  - Include request ID in all errors
  - Add retry suggestions for retryable errors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 13. Add comprehensive tests
- [ ] 13.1 Write unit tests for videoModelCapabilities
  - Test validateResolution() for all models
  - Test validateReferenceImages() for all models
  - Test validateLastFrame() for all models
  - Test validateVideoExtension() for all models
  - Test getDefaultDuration() for all scenarios
  - Test getDefaultResolution() for all scenarios
  - Test validateParameterCombination() for all scenarios
  - _Requirements: All validation requirements_

- [ ] 13.2 Write unit tests for AnimateModal
  - Test model selector updates options
  - Test resolution selector disables invalid options
  - Test duration selector disables invalid options
  - Test validation errors display
  - Test auto-adjustment logic
  - Test submit disabled when invalid
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.4_

- [ ] 13.3 Write unit tests for ChatInputArea
  - Test file upload
  - Test file removal
  - Test action buttons
  - Test keyboard shortcuts
  - Test disabled state
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13.4 Write integration tests for video API endpoints
  - Test /api/ai/video with valid parameters
  - Test /api/ai/video with invalid combinations
  - Test /api/ai/video with reference images
  - Test /api/ai/video with last frame
  - Test /api/ai/video/extend with valid parameters
  - Test /api/ai/video/extend with invalid duration
  - _Requirements: All API requirements_

- [ ] 14. Update documentation
- [ ] 14.1 Update docs/API.md
  - Add video generation parameters section
  - Document resolution options by model
  - Document duration requirements
  - Document reference images usage
  - Document extension limitations
  - _Requirements: All requirements_

- [ ] 14.2 Update docs/CONFIGURATION.md
  - Add videoDuration setting documentation
  - Add model selection guidance
  - Update video settings section
  - _Requirements: 8.1, 8.2_

- [ ] 14.3 Create docs/VIDEO_GENERATION.md
  - Add Veo model comparison table
  - Add resolution/duration constraints table
  - Add reference images guide
  - Add extension guide
  - Add troubleshooting section
  - _Requirements: All requirements_

- [ ] 14.4 Add JSDoc comments to code
  - Document videoModelCapabilities.ts functions
  - Document geminiClient.ts video functions
  - Document AnimateModal validation logic
  - Document ChatInputArea props
  - _Requirements: All requirements_

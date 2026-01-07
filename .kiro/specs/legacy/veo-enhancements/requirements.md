# Requirements Document

## Introduction

This specification enhances StoryBoard's video generation capabilities by fixing critical Veo 3.1 aspect ratio issues, adding video extension functionality, exposing resolution controls, and redesigning the edit/animate/extend user experience. The current implementation has aspect ratio bugs (16:9 becoming 9:16), lacks video extension support, doesn't expose resolution options to users, and uses inline panels that don't provide adequate context for advanced video operations. These enhancements will unlock Veo 3.1's full capabilities including reference images, last frame interpolation, and video extension while providing a more intuitive modal-based workflow.

## Glossary

- **System**: StoryBoard application (frontend and backend)
- **Veo 3.1**: Google's latest video generation model with advanced capabilities
- **Aspect Ratio**: Video dimensions ratio (16:9 for landscape, 9:16 for portrait)
- **Resolution**: Video quality setting (1080p or 720p)
- **Video Extension**: Extending an existing video clip with additional generated content
- **Reference Images**: Up to 3 images used as style/content references for video generation
- **Last Frame**: Final image for interpolation, creating transition between two images
- **Image-to-Video**: Animating a static image into video (current "animate" feature)
- **Edit Modal**: Modal dialog for regenerating scene content with AI assistance
- **Animate Modal**: Modal dialog for converting scene image to video
- **Extend Modal**: Modal dialog for extending existing scene video
- **Scene Card**: UI component displaying individual scene with thumbnail and actions
- **Chat Input**: Existing component with prompt input, file upload, and AI assistance

## Requirements

### Requirement 1: Fix Veo 3.1 Aspect Ratio Handling

**User Story:** As a video creator, I want my selected aspect ratio to be respected by Veo 3.1, so that my 16:9 videos don't become 9:16 and vice versa.

#### Acceptance Criteria

1. WHEN a user generates video with Veo 3.1 and aspect ratio "16:9", THE System SHALL pass aspectRatio parameter as "16:9" to the Gemini API
2. WHEN a user generates video with Veo 3.1 and aspect ratio "9:16", THE System SHALL pass aspectRatio parameter as "9:16" to the Gemini API
3. WHEN the System constructs Veo 3.1 API requests, THE System SHALL validate aspect ratio parameter format matches Google's API specification
4. WHEN video generation completes, THE System SHALL verify the returned video matches the requested aspect ratio within 5% tolerance
5. WHEN aspect ratio mismatch is detected, THE System SHALL log an error with request and response details for debugging

### Requirement 2: Add Resolution Selection to Settings

**User Story:** As a video creator, I want to choose between 1080p and 720p resolution, so that I can balance quality and generation speed based on my needs.

#### Acceptance Criteria 1

1. WHEN the System initializes default settings, THE System SHALL set video resolution to "1080p"
2. WHEN a user opens model settings, THE System SHALL display resolution options "1080p" and "720p" as selectable choices
3. WHEN a user selects a resolution option, THE System SHALL persist the selection to the settings store
4. WHEN generating video with Veo 3.1, THE System SHALL pass the selected resolution parameter to the Gemini API
5. WHEN generating video with Veo 2.0, THE System SHALL omit the resolution parameter regardless of user selection

### Requirement 3: Implement Video Extension Feature

**User Story:** As a video creator, I want to extend my existing video clips with additional AI-generated content up to 20 times, so that I can create longer sequences up to 148 seconds without starting from scratch.

#### Acceptance Criteria 2

1. WHEN a scene has an existing Veo-generated video asset up to 141 seconds long, THE System SHALL display an "Extend" action button on the scene card
2. WHEN a user clicks the extend button, THE System SHALL open an extend modal displaying the existing video
3. WHEN a user opens the extend modal, THE System SHALL provide an option to select extension count from 1 to 20 clips
4. WHEN a user submits an extension request with prompt and count, THE System SHALL send the existing video and prompt to Veo 3.1 with video extension parameters for each extension
5. WHEN video extension completes successfully, THE System SHALL create a new combined video asset (original + 7 seconds per extension) and associate it with the scene
6. WHEN using video extension, THE System SHALL enforce 720p resolution and 7-second extension per clip as per Veo 3.1 API constraints
7. WHEN the combined video would exceed 148 seconds, THE System SHALL display an error message and prevent submission

### Requirement 4: Support Reference Images for Video Generation

**User Story:** As a video creator, I want to provide reference images for style and content guidance, so that my generated videos match my creative vision.

#### Acceptance Criteria 3

1. WHEN a user opens the animate and extend modals, THE System SHALL provide an interface to upload up to 3 reference images
2. WHEN reference images are provided, THE System SHALL include them in the Veo 3.1 API request as referenceImages parameter
3. WHEN using reference images, THE System SHALL enforce 8-second duration and 16:9 aspect ratio as per Veo 3.1 API constraints
4. WHEN using reference images, THE System SHALL set personGeneration to "allow_adult" as per API requirements
5. WHEN reference images exceed 3, THE System SHALL display an error message and prevent submission

### Requirement 5: Support Last Frame Interpolation

**User Story:** As a video creator, I want to create smooth transitions between two images, so that I can generate videos that interpolate from start to end frames.

#### Acceptance Criteria 4

1. WHEN a user opens the animate and extend modals, THE System SHALL provide an option to upload a last frame image
2. WHEN both initial image and last frame are provided, THE System SHALL include both in the Veo 3.1 API request
3. WHEN using last frame interpolation, THE System SHALL enforce 8-second duration as per Veo 3.1 API constraints
4. WHEN using last frame interpolation, THE System SHALL support both 16:9 and 9:16 aspect ratios
5. WHEN last frame is provided without initial image, THE System SHALL display an error message explaining both images are required

### Requirement 6: Redesign Edit/Animate/Extend as Modal Dialogs

**User Story:** As a video creator, I want edit, animate, and extend actions to open in focused modal dialogs, so that I have better context and a cleaner interface for these operations.

#### Acceptance Criteria 6

1. WHEN a user clicks edit, animate, or extend on a scene card, THE System SHALL open a centered modal dialog
2. WHEN the modal opens, THE System SHALL display the relevant scene asset (image or video) prominently in the modal
3. WHEN the modal renders, THE System SHALL include a prompt input area with file upload capabilities
4. WHEN the modal renders, THE System SHALL provide AI assistance for prompt generation
5. WHEN a user closes the modal without submitting, THE System SHALL discard changes and return to the scene view

### Requirement 7: Reuse Chat Input Component for Modal Interactions

**User Story:** As a developer, I want to reuse the existing ChatInput component in modals, so that we maintain consistent UX and avoid duplicating file upload and AI assistance logic.

#### Acceptance Criteria 7

1. WHEN rendering edit, animate, or extend modals, THE System SHALL use the ChatInput component for prompt entry
2. WHEN ChatInput is used in modals, THE System SHALL support file uploads for reference images and last frames
3. WHEN ChatInput is used in modals, THE System SHALL provide context-specific AI assistance based on modal type
4. WHEN files are uploaded via ChatInput in modals, THE System SHALL validate file types and sizes before submission
5. WHEN ChatInput is used in modals, THE System SHALL maintain the same keyboard shortcuts and accessibility features as the chat panel

### Requirement 8: Validate API Parameters Against Google Documentation

**User Story:** As a developer, I want all Veo 3.1 API parameters to match Google's official documentation, so that we avoid API errors and leverage all available features correctly.

#### Acceptance Criteria 8

1. WHEN the System constructs any Veo 3.1 API request, THE System SHALL validate all parameters against documented constraints
2. WHEN using video extension, THE System SHALL include the video parameter with proper encoding and format
3. WHEN using reference images, THE System SHALL format the referenceImages parameter as an array of VideoGenerationReferenceImage objects
4. WHEN using last frame, THE System SHALL include the lastFrame parameter with the image parameter as required
5. WHEN parameter validation fails, THE System SHALL return a descriptive error message indicating which parameter is invalid and why

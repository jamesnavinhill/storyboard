# Requirements Document

## Introduction

This specification addresses critical issues with video generation functionality in StoryBoard, specifically focusing on Veo model compatibility, resolution/duration constraints, video extension capabilities, and UI improvements for the edit/animate/extend modals. The system currently experiences failures with most Veo 3.x models due to incorrect parameter handling and lacks proper UI for configuring generation settings.

## Glossary

- **Veo Models**: Google's video generation AI models (Veo 2.0, Veo 3.0, Veo 3.0 Fast, Veo 3.1, Veo 3.1 Fast)
- **Image2Video**: Converting a static image into an animated video
- **Video Extension**: Extending an existing video by adding additional seconds
- **Resolution**: Video output quality (720p or 1080p)
- **Duration**: Length of generated video in seconds
- **Reference Images**: Up to 3 images used to guide video content generation (Veo 3.1 only)
- **Last Frame**: Final frame image for interpolation between first and last frame (Veo 3.1 only)
- **Aspect Ratio**: Video dimensions ratio (16:9 or 9:16)
- **AnimateModal**: UI dialog for generating videos from images
- **EditModal**: UI dialog for editing scene images
- **ExtendModal**: UI dialog for extending existing videos
- **Chat Input Component**: Reusable input component with file upload and icon row
- **Model Capabilities Matrix**: Validation rules defining what each Veo model supports

## Requirements

### Requirement 1: Fix Veo 3.x Model Video Generation

**User Story:** As a user, I want to generate videos using all available Veo models (3.0, 3.0 Fast, 3.1, 3.1 Fast), so that I can choose the best model for my needs based on quality, speed, and features.

#### Acceptance Criteria

1. WHEN a user generates a video with Veo 3.1 or Veo 3.1 Fast, THE System SHALL correctly apply resolution and duration constraints based on Google's official documentation
2. WHEN a user generates a video with Veo 3.0 or Veo 3.0 Fast, THE System SHALL apply the correct resolution limits for each aspect ratio
3. WHEN a user generates a video with 1080p resolution, THE System SHALL automatically set duration to 8 seconds if required by the model
4. WHEN a user generates a video with reference images or last frame, THE System SHALL set duration to 8 seconds as required by Veo 3.1
5. WHEN the System detects incompatible parameters for a model, THE System SHALL provide clear error messages indicating the constraint violation

### Requirement 2: Implement Proper Resolution and Duration Validation

**User Story:** As a user, I want the system to validate my video generation settings before submission, so that I don't waste time on requests that will fail due to parameter constraints.

#### Acceptance Criteria

1. WHEN a user selects 1080p resolution with 6-second duration on Veo 3.1, THE System SHALL either auto-correct to 8 seconds or display a validation error
2. WHEN a user selects 1080p resolution with 9:16 aspect ratio on Veo 3.0, THE System SHALL prevent submission and display an error indicating maximum 720p for 9:16
3. WHEN a user selects reference images with 9:16 aspect ratio, THE System SHALL prevent submission and display an error indicating reference images require 16:9
4. WHEN a user attempts video extension on a video longer than 141 seconds, THE System SHALL prevent submission and display the maximum duration constraint
5. WHEN validation fails, THE System SHALL display specific guidance on how to fix the parameter conflict

### Requirement 3: Fix Video Extension Functionality

**User Story:** As a user, I want to extend any Veo-generated video using Veo 3.1 models, so that I can create longer video sequences without regenerating from scratch.

#### Acceptance Criteria

1. WHEN a user extends a video created with any Veo model using Veo 3.1 or Veo 3.1 Fast, THE System SHALL successfully process the extension request
2. WHEN a user opens the ExtendModal for a Veo-generated video, THE System SHALL display a model selector with only Veo 3.1 and Veo 3.1 Fast options
3. WHEN a user extends a video, THE System SHALL use 720p resolution as required by the extension API
4. WHEN a user extends a video, THE System SHALL correctly calculate the final duration (current + 7 seconds per extension)
5. WHEN a user attempts to extend beyond 148 seconds total, THE System SHALL prevent submission and display the maximum extension limit

### Requirement 4: Surface Resolution and Duration Settings in UI

**User Story:** As a user, I want to configure resolution and duration settings when generating or extending videos, so that I have control over the output quality and length.

#### Acceptance Criteria

1. WHEN a user opens the AnimateModal, THE System SHALL display resolution options (720p, 1080p) based on the selected model and aspect ratio
2. WHEN a user opens the AnimateModal, THE System SHALL display duration options (4s, 6s, 8s) based on the selected model
3. WHEN a user changes resolution or duration, THE System SHALL validate the combination and display warnings for invalid selections
4. WHEN a user opens the ExtendModal, THE System SHALL display the current video duration and calculated final duration
5. WHEN a user adjusts extension count, THE System SHALL update the final duration display in real-time

### Requirement 5: Add Model Selection to Video Generation UI

**User Story:** As a user, I want to select which Veo model to use when generating videos, so that I can choose between quality, speed, and feature availability.

#### Acceptance Criteria

1. WHEN a user opens the AnimateModal, THE System SHALL display a model selector with all available Veo models
2. WHEN a user selects a model, THE System SHALL update available resolution and duration options based on model capabilities
3. WHEN a user selects Veo 2.0, THE System SHALL hide the resolution selector and display a note that resolution is fixed
4. WHEN a user selects Veo 3.1 or 3.1 Fast, THE System SHALL enable reference images and last frame upload options
5. WHEN a user selects Veo 3.0 or 3.0 Fast, THE System SHALL disable reference images and last frame options

### Requirement 6: Reuse Chat Input Component in Modals

**User Story:** As a user, I want a consistent input experience across the chat panel and generation modals, so that I can use familiar controls for file uploads and prompt entry.

#### Acceptance Criteria

1. WHEN a user opens EditModal, AnimateModal, or ExtendModal, THE System SHALL display a chat-style input area with icon row
2. WHEN a user uploads files in a modal, THE System SHALL use the same file upload UI and validation as the chat panel
3. WHEN a user types in a modal input, THE System SHALL support the same keyboard shortcuts as the chat panel
4. WHEN a user clicks AI Suggest in a modal, THE System SHALL display the sparkles icon in the icon row
5. WHEN a user attaches files in a modal, THE System SHALL display file thumbnails in the same style as the chat panel

### Requirement 7: Display Official Google Guidance for Settings

**User Story:** As a user, I want to see official guidance and constraints for video generation settings, so that I understand why certain options are available or restricted.

#### Acceptance Criteria

1. WHEN a user hovers over resolution options, THE System SHALL display a tooltip with model-specific resolution constraints
2. WHEN a user hovers over duration options, THE System SHALL display a tooltip explaining duration requirements
3. WHEN a user selects reference images, THE System SHALL display a note that this feature requires Veo 3.1 and 16:9 aspect ratio
4. WHEN a user attempts an invalid configuration, THE System SHALL display an error message citing Google's official documentation
5. WHEN a user opens the AnimateModal, THE System SHALL display a help icon linking to Google's Veo API documentation

### Requirement 8: Set Intelligent Defaults for Video Generation

**User Story:** As a user, I want the system to pre-select optimal settings based on my scene and selected model, so that I can quickly generate videos without manual configuration.

#### Acceptance Criteria

1. WHEN a user opens the AnimateModal with Veo 3.1 selected, THE System SHALL default to 1080p resolution and 8-second duration
2. WHEN a user opens the AnimateModal with Veo 3.0 Fast selected, THE System SHALL default to 720p resolution and 6-second duration
3. WHEN a user's scene has 9:16 aspect ratio, THE System SHALL default to 720p resolution regardless of model
4. WHEN a user uploads reference images, THE System SHALL automatically adjust duration to 8 seconds if needed
5. WHEN a user opens the ExtendModal, THE System SHALL default to 1 extension with the current video's prompt

### Requirement 9: Fix Image2Video Parameter Handling

**User Story:** As a user, I want to generate videos from my scene images without encountering resolution/duration errors, so that I can successfully animate my storyboard scenes.

#### Acceptance Criteria

1. WHEN a user generates a video from an image with Veo 3.1, THE System SHALL send the correct resolution parameter to the API
2. WHEN a user generates a video from an image with Veo 2.0, THE System SHALL omit the resolution parameter as it is not supported
3. WHEN a user generates a video with 1080p resolution, THE System SHALL ensure duration is set to 8 seconds
4. WHEN a user generates a video with reference images, THE System SHALL include the personGeneration parameter set to "allow_adult"
5. WHEN a user generates a video with last frame, THE System SHALL include both image and lastFrame parameters with correct encoding

### Requirement 10: Improve Error Messages for Video Generation Failures

**User Story:** As a user, I want clear, actionable error messages when video generation fails, so that I can understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN video generation fails due to resolution/duration mismatch, THE System SHALL display the specific constraint that was violated
2. WHEN video generation fails due to unsupported model features, THE System SHALL suggest compatible models
3. WHEN video generation fails due to API errors, THE System SHALL display the error message from Google's API with request ID
4. WHEN video extension fails due to encoding parameter, THE System SHALL automatically retry without the encoding parameter
5. WHEN video generation returns no download link, THE System SHALL display a retry option and log the full response for debugging

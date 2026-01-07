# Requirements Document

## Introduction

This specification addresses critical issues with AI model integration and UI functionality in StoryBoard. The system currently has problems with model selection, API integration for newer models (Veo 3.1, Imagen 3, Imagen 4 Fast), settings panel navigation, and group/tag management visibility. These issues prevent users from accessing the latest AI capabilities and managing their storyboard organization effectively.

## Glossary

- **System**: StoryBoard application (frontend and backend)
- **Veo Model**: Google's video generation AI model family (Veo 2.0, Veo 3.0, Veo 3.1)
- **Imagen Model**: Google's image generation AI model family (Imagen 3, Imagen 4 Fast)
- **Flash Image Model**: Gemini 2.5 Flash Image model for rapid image generation
- **Model Selector**: UI component allowing users to choose AI models
- **Settings Panel**: UI component for configuring application and model settings
- **Manager Panel**: UI component displaying created groups and tags
- **Group**: User-defined collection for organizing scenes
- **Tag**: User-defined label for categorizing scenes

## Requirements

### Requirement 1: Veo 3.1 Model Integration

**User Story:** As a video creator, I want to use the latest Veo 3.1 model for video generation, so that I can leverage the newest AI capabilities for higher quality videos.

#### Acceptance Criteria

1. WHEN the System initializes model configurations, THE System SHALL include "veo-3.1-generate-001" as a valid video model option
2. WHEN a user views the video model selector, THE System SHALL display "Veo 3.1" as a selectable option
3. WHEN a user selects Veo 3.1 and generates a video, THE System SHALL invoke the Gemini API with model identifier "veo-3.1-generate-001"
4. WHEN generating video with Veo 3.1, THE System SHALL support 1080p resolution for both 16:9 and 9:16 aspect ratios
5. WHEN the video generation completes successfully, THE System SHALL persist the generated video asset to the database

### Requirement 2: Veo 2.0 Video Generation Fix

**User Story:** As a video creator, I want Veo 2.0 video generation to work correctly, so that I can generate videos without errors.

#### Acceptance Criteria

1. WHEN a user generates video with Veo 2.0, THE System SHALL omit the resolution parameter from the API request
2. WHEN Veo 2.0 video generation is invoked, THE System SHALL use model identifier "veo-2.0-generate-001"
3. WHEN Veo 2.0 video generation completes, THE System SHALL successfully download and persist the video asset
4. IF Veo 2.0 video generation fails, THEN THE System SHALL return a descriptive error message to the user
5. WHEN the user retries after a Veo 2.0 failure, THE System SHALL allow the retry without requiring page refresh

### Requirement 3: Imagen 3 and Imagen 4 Fast Integration

**User Story:** As a storyboard creator, I want to use Imagen 3 and Imagen 4 Fast models for image generation, so that I can choose between quality and speed based on my needs.

#### Acceptance Criteria

1. WHEN the System initializes model configurations, THE System SHALL include "imagen-3.0-generate-001" and "imagen-4.0-fast-generate-001" as valid image model options *already does
2. WHEN a user views the image model selector, THE System SHALL display "Imagen 3" and "Imagen 4 Fast" as selectable options *already does
3. WHEN a user selects Imagen 3 or Imagen 4 Fast and generates an image, THE System SHALL invoke the Gemini API with the correct model identifier
4. WHEN image generation with Imagen 3 or Imagen 4 Fast completes, THE System SHALL persist the generated image asset to the database
5. WHEN generating images with Imagen models, THE System SHALL support both 16:9 and 9:16 aspect ratios

### Requirement 4: Settings Panel Navigation Fix

**User Story:** As a user, I want to navigate between different settings tabs (App Settings, Model Settings), so that I can configure all application options.

#### Acceptance Criteria

1. WHEN a user opens the settings panel, THE System SHALL display all available settings tabs
2. WHEN a user clicks on a settings tab, THE System SHALL display the corresponding settings content
3. WHEN a user switches between settings tabs, THE System SHALL preserve unsaved changes in the previous tab
4. WHEN the settings panel renders, THE System SHALL highlight the currently active tab
5. IF a settings tab fails to load, THEN THE System SHALL display an error message without crashing the panel

### Requirement 5: Group and Tag Visibility in Manager Panel

**User Story:** As a storyboard organizer, I want to see my created groups and tags in the manager panel, so that I can manage and apply them to scenes.

#### Acceptance Criteria

1. WHEN a user creates a new group, THE System SHALL immediately display the group in the manager panel groups section
2. WHEN a user creates a new tag, THE System SHALL immediately display the tag in the manager panel tags section
3. WHEN the manager panel loads, THE System SHALL fetch and display all existing groups for the current project
4. WHEN the manager panel loads, THE System SHALL fetch and display all existing tags for the current project
5. WHEN a user deletes a group or tag, THE System SHALL remove it from the manager panel display within 500 milliseconds

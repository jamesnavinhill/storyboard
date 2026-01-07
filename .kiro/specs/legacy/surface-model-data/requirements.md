# Requirements Document

## Introduction

This feature enhances the scene manager panel (Details tab) to display the AI model information used to generate scene assets. Currently, when users view a scene's details, they can see the media (image/video) and description, but cannot see which AI models (Imagen, Veo) were used to generate those assets. This information is valuable for understanding generation quality, troubleshooting issues, and making informed decisions about regeneration.

## Glossary

- **Scene Manager Panel**: The right-side panel in the application that displays scene details, tags, and history
- **Details Tab**: The first tab in the Scene Manager Panel showing scene information
- **Asset**: A generated image or video file associated with a scene
- **Asset Metadata**: JSON data stored with each asset containing generation parameters
- **Model Information**: The AI model name used to generate an asset (e.g., "imagen-4.0-generate-001", "veo-3.1-generate-preview")
- **Primary Image Asset**: The currently selected image for a scene
- **Primary Video Asset**: The currently selected video for a scene

## Requirements

### Requirement 1

**User Story:** As a storyboard creator, I want to see which AI model generated my scene's image and video, so that I can understand the quality and capabilities used for generation.

#### Acceptance Criteria

1. WHEN a scene has a primary image asset with model metadata, THE Scene Manager Panel SHALL display the image model name below the media preview and above the description field.
2. WHEN a scene has a primary video asset with model metadata, THE Scene Manager Panel SHALL display the video model name below the media preview and above the description field.
3. WHEN a scene has both image and video assets with model metadata, THE Scene Manager Panel SHALL display both model names in a compact format.
4. WHEN a scene has no assets or assets without model metadata, THE Scene Manager Panel SHALL not display any model information.

### Requirement 2

**User Story:** As a storyboard creator, I want the model information to be displayed in a clean, unobtrusive way, so that it doesn't clutter the interface or distract from the main content.

#### Acceptance Criteria 2

1. THE Scene Manager Panel SHALL display model information without a section title or header.
2. THE Scene Manager Panel SHALL use a compact, single-line format for model information.
3. THE Scene Manager Panel SHALL use subtle styling (muted text color, small font size) for model information.
4. THE Scene Manager Panel SHALL position model information between the media preview and the description field.

### Requirement 3

**User Story:** As a developer, I want to ensure model information is correctly retrieved from asset metadata, so that users always see accurate generation details.

#### Acceptance Criteria 3

1. WHEN retrieving scene data, THE application SHALL include asset metadata in the response.
2. WHEN an asset has metadata with a "model" field, THE application SHALL extract and display that model name.
3. WHEN an asset's metadata is missing or malformed, THE application SHALL gracefully handle the error without breaking the UI.
4. THE application SHALL support displaying model information for both image and video asset types.

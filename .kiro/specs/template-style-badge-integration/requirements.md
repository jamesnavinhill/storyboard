# Requirements Document

## Introduction

This feature enhances the StoryBoard application's chat interface by displaying selected style templates as visual badges in the chat panel's bottom icon row. When users select a style template, it will be visually indicated through a badge and automatically applied to AI image generation requests, ensuring consistent visual styling across generated content.

## Glossary

- **ChatPanel**: The React component that renders the chat interface where users interact with AI to create storyboards
- **StyleTemplate**: A database entity containing style prompt information (name, description, stylePrompt, category) used to guide AI image generation
- **Badge**: A visual UI element displaying the selected template name in the chat panel's bottom icon row
- **ImageGenerationService**: The backend service that processes image generation requests and applies style prompts to AI models
- **TemplateSelector**: The UI component (StylePresetsMenu) that allows users to browse and select style templates

## Requirements

### Requirement 1

**User Story:** As a storyboard creator, I want to see which style template is currently selected, so that I can confirm my visual style choice before generating images

#### Acceptance Criteria

1. WHEN a user selects a style template from the StylePresetsMenu, THE ChatPanel SHALL display a badge in the bottom icon row showing the template name
2. THE badge SHALL use the shaded pink color scheme consistent with active button styling in the application
3. WHEN no template is selected, THE ChatPanel SHALL NOT display any template badge
4. WHEN a user clicks the X icon on the template badge, THE ChatPanel SHALL remove the badge and clear the template selection
5. THE badge SHALL be positioned in the bottom icon row between the settings button and the microphone icon. closer to the settings icon

### Requirement 2

**User Story:** As a storyboard creator, I want my selected style template to automatically apply to image generation, so that all generated images match my chosen visual style without manual prompt editing

#### Acceptance Criteria

1. WHEN a user generates an image with a template selected, THE ImageGenerationService SHALL include the template's stylePrompt in the AI generation request
2. THE ImageGenerationService SHALL append the stylePrompt to the scene description before sending to the AI model
3. WHEN multiple style templates are selected, THE ImageGenerationService SHALL combine all stylePrompts in the generation request
4. THE ImageGenerationService SHALL maintain the template selection state throughout the user session
5. WHEN a user clears the template selection, THE ImageGenerationService SHALL generate images without applying any style prompt modifiers

### Requirement 3

**User Story:** As a storyboard creator, I want the template selection to persist during my session, so that I can generate multiple images with the same style without reselecting the template

#### Acceptance Criteria

1. WHEN a user selects a template, THE ChatPanel SHALL store the selection in component state
2. THE template selection SHALL persist across multiple image generation requests within the same session
3. WHEN a user refreshes the page, THE ChatPanel SHALL clear the template selection (session-only persistence)
4. THE ChatPanel SHALL pass the selected template ID to image generation API calls
5. WHEN a user switches between chat modes, THE template selection SHALL remain active

### Requirement 4

**User Story:** As a storyboard creator, I want to easily remove the selected template, so that I can quickly switch between styled and unstyled image generation

#### Acceptance Criteria

1. THE template badge SHALL display an X icon button for removal
2. WHEN a user clicks the X icon on the badge, THE ChatPanel SHALL clear the template selection immediately
3. THE X icon button SHALL have hover state styling consistent with the application's design system
4. WHEN the template is removed, THE ChatPanel SHALL update the UI to hide the badge within 100 milliseconds
5. THE removal action SHALL NOT require confirmation from the user

# Requirements Document

## Introduction

This specification defines the complete enhancement of VibeBoard's Gemini API integration to build a professional-grade creative media generation system. The system will provide robust workflows with optimal model usage, comprehensive file handling, document management, and polished user experience. The enhancement focuses on complete implementation at each step with no partial features.

**Key References:**

- Original Specification: `#[[file:docs/gemini/API_GAPS_FINAL.md]]`
- Architecture Documentation: `#[[file:docs/ARCHITECTURE.md]]`
- Module Boundaries: `#[[file:docs/MODULE-BOUNDARIES.md]]`
- Configuration Guide: `#[[file:docs/CONFIGURATION.md]]`
- Gemini API Documentation: <https://ai.google.dev/gemini-api/docs>
- Gemini Files API: <https://ai.google.dev/gemini-api/docs/vision#upload-files>
- Veo Video Models: <https://ai.google.dev/gemini-api/docs/models/veo>
- Imagen Image Models: <https://ai.google.dev/gemini-api/docs/models/imagen>

## Glossary

- **System**: The VibeBoard application including frontend and backend components
- **User**: A person using VibeBoard to create media projects
- **Gemini API**: Google's generative AI API for text, image, and video generation
- **Workflow**: A system instruction template that guides AI behavior for specific content types
- **Style Template**: A visual style definition appended to generation prompts
- **Project Document**: A structured document containing project metadata, scenes, and prompts
- **Scene**: A single unit in a storyboard with description, image prompt, and animation prompt
- **Files API**: Gemini's file upload service for handling large files (>20MB)
- **SSE**: Server-Sent Events, a protocol for streaming data from server to client
- **Thinking Mode**: An AI mode that shows reasoning process before generating responses
- **Agent Mode**: A mode where AI generates complete storyboards with multiple scenes
- **Chat Mode**: A conversational mode for concept development and refinement
- **WYSIWYG**: What You See Is What You Get editor interface
- **Tiptap**: A modern rich text editor framework for React

## Requirements

### Requirement 1: Enhanced Storyboard Generation Flow

**User Story:** As a content creator, I want a guided workflow from concept to complete storyboard, so that I can efficiently develop professional video projects.

#### Acceptance Criteria

1. WHEN THE User initiates concept development, THE System SHALL provide a chat interface for developing the concept with AI guidance
2. WHEN THE User completes concept development, THE System SHALL display a button to transition to style preview mode
3. WHEN THE User enters style preview mode, THE System SHALL generate exactly 4 sample scenes representing different style directions
4. WHEN THE User selects a preferred style preview, THE System SHALL automatically apply the selected style and generate the full storyboard
5. WHEN THE System generates a storyboard, THE System SHALL create scenes with description, image prompt, auto-generated animation prompt, and metadata including duration, camera movement, lighting, and mood

### Requirement 2: Video Model Integration

**User Story:** As a content creator, I want access to the latest video generation models with optimal quality defaults, so that I can produce the highest quality video content.

#### Acceptance Criteria

1. THE System SHALL support Veo 3.1 model (`veo-3.1-generate-001`) as the default video generation model
2. THE System SHALL provide access to all available Veo models: `veo-3.1-generate-001`, `veo-3.0-generate-001`, `veo-3.0-fast-generate-001`, and `veo-2.0-generate-001`
3. WHEN THE User selects a video model, THE System SHALL validate resolution parameters conditionally based on the selected model capabilities
4. WHEN THE User generates video with Veo 2.0, THE System SHALL omit the resolution parameter from the API request
5. THE System SHALL document aspect ratio limitations for each video model in the user interface

### Requirement 3: Text Model Integration with Streaming

**User Story:** As a user, I want real-time streaming responses from text models, so that I can see AI output progressively and stop generation if needed.

#### Acceptance Criteria

1. THE System SHALL support all Gemini text models: `gemini-2.5-pro`, `gemini-2.5-flash`, and `gemini-2.5-flash-lite`
2. THE System SHALL use `gemini-2.5-pro` as the default model for chat mode
3. THE System SHALL use `gemini-2.5-flash` as the default model for storyboard generation
4. WHEN THE User initiates a chat request, THE System SHALL stream responses using Server-Sent Events (SSE)
5. WHEN THE System streams a response, THE System SHALL display a stop generation button
6. WHEN THE User clicks stop generation, THE System SHALL terminate the SSE connection and halt response streaming
7. WHEN THE SSE connection fails, THE System SHALL display a clear error message with the request ID

### Requirement 4: Image Model Integration

**User Story:** As a content creator, I want access to the latest image generation models with optimal quality defaults, so that I can create high-quality scene images.

#### Acceptance Criteria

1. THE System SHALL support all available Imagen models: `imagen-4.0-generate-001`, `imagen-4.0-generate-001-fast`, `imagen-3.0-generate-001`, and `gemini-2.5-flash-image`
2. THE System SHALL use `imagen-4.0-generate-001` as the default image generation model
3. THE System SHALL provide model selection in the settings interface with quality and speed indicators
4. WHEN THE User selects `gemini-2.5-flash-image`, THE System SHALL enable image editing capabilities
5. THE System SHALL validate image generation parameters based on the selected model capabilities

### Requirement 5: Thinking Mode Configuration

**User Story:** As a user, I want to enable thinking mode for complex tasks, so that I can improve output quality when needed.

#### Acceptance Criteria

1. THE System SHALL provide a thinking mode toggle in the settings interface
2. THE System SHALL disable thinking mode by default
3. WHEN THE User enables thinking mode, THE System SHALL apply it to all chat and agent mode requests
4. THE System SHALL provide an optional toggle to display the model's reasoning process
5. WHEN THE System displays thinking process, THE System SHALL show it in a visually distinct section before the main response

### Requirement 6: Workflow and System Instructions Management

**User Story:** As a content creator, I want to create and manage custom workflows with system instructions, so that I can tailor AI behavior for different content types.

#### Acceptance Criteria

1. THE System SHALL provide workflow categories: music-video, commercial, social, explainer, and custom
2. THE System SHALL allow users to create new workflows with custom system instructions
3. THE System SHALL allow users to edit existing workflow system instructions
4. THE System SHALL allow users to delete workflows
5. WHEN THE User creates a workflow, THE System SHALL require a name, description, category, and system instruction
6. THE System SHALL support workflow subtypes with instruction modifiers that append to base system instructions
7. THE System SHALL allow users to create, edit, and delete workflow subtypes
8. THE System SHALL provide 10-15 pre-configured professional workflows based on proven video production frameworks
9. THE System SHALL store workflow system instructions in the database with full version history
10. THE System SHALL allow users to preview and test system instructions before applying them

### Requirement 7: Style Template System

**User Story:** As a content creator, I want to create and manage reusable style templates, so that I can maintain consistent visual styles across projects.

#### Acceptance Criteria

1. THE System SHALL provide style templates separate from workflows
2. THE System SHALL allow users to create custom style templates with name, description, and style prompt
3. THE System SHALL allow users to edit and delete style templates
4. WHEN THE User applies a style template, THE System SHALL append the style prompt to all generation requests
5. THE System SHALL allow users to mark templates as "tested" after validation
6. THE System SHALL provide 10-15 pre-configured style templates
7. THE System SHALL store selected template in project settings
8. THE System SHALL track template changes in project document history
9. THE System SHALL allow users to override template per-generation

### Requirement 8: Project Document Management

**User Story:** As a content creator, I want a structured document containing all project details, so that I can organize and export my work.

#### Acceptance Criteria

1. THE System SHALL create a project document containing title, style, goals, outline, and scenes
2. WHEN THE System generates a storyboard, THE System SHALL add all scenes to the project document
3. THE System SHALL store scene metadata including order, title, description, image prompt, animation prompt, and generated asset references
4. THE System SHALL store chat history with timestamps and role indicators
5. THE System SHALL store workflow, system instruction, and model settings in document metadata
6. THE System SHALL automatically save a new document version on every save operation
7. THE System SHALL retain the last 10 document versions
8. WHEN THE System has more than 10 versions, THE System SHALL automatically prune the oldest versions
9. THE System SHALL provide version history access in the user interface
10. THE System SHALL allow users to restore previous document versions with one click

### Requirement 9: WYSIWYG Document Editor

**User Story:** As a content creator, I want to edit project documents with a rich text editor, so that I can format and organize content effectively.

#### Acceptance Criteria

1. THE System SHALL integrate Tiptap as the WYSIWYG editor
2. THE System SHALL provide view mode with read-only display and collapsible sections
3. THE System SHALL provide edit mode with full rich text editing capabilities
4. THE System SHALL support code blocks for displaying prompts
5. THE System SHALL provide real-time auto-save during editing
6. THE System SHALL export documents to Markdown format
7. THE System SHALL export documents to PDF format
8. THE System SHALL export documents to JSON format
9. WHEN THE User exports a document, THE System SHALL provide an option to include asset files or links only
10. THE System SHALL provide an "Add to document" button in chat interface for adding messages to the document

### Requirement 10: File Upload System with Files API

**User Story:** As a content creator, I want to upload reference files for generation, so that I can provide visual and audio context to the AI.

#### Acceptance Criteria

1. WHEN THE User uploads a file larger than 20MB, THE System SHALL route it through the Gemini Files API
2. WHEN THE User uploads a file smaller than 20MB, THE System SHALL encode it as base64 inline data
3. WHEN THE User uploads multiple large files, THE System SHALL route all through the Files API
4. WHEN THE User uploads video or audio files, THE System SHALL route them through the Files API
5. THE System SHALL display upload progress indicators during file upload
6. THE System SHALL display file thumbnails above the chat input after successful upload
7. THE System SHALL allow users to select file purpose: style-reference, character-reference, audio-reference, text-document, or general-reference
8. THE System SHALL support drag-and-drop file upload in agent mode
9. THE System SHALL allow users to delete and reorder uploaded files
10. THE System SHALL persist uploaded files with the project
11. THE System SHALL support a maximum of 10 files per generation request
12. WHEN THE file upload fails, THE System SHALL display a clear error message with suggested actions

### Requirement 11: File Storage and Retention

**User Story:** As a content creator, I want my uploaded files to persist with my projects, so that I can reference them throughout the project lifecycle.

#### Acceptance Criteria

1. THE System SHALL store uploaded files in the local filesystem using SQLite for metadata
2. THE System SHALL organize files in project directory structure under `data/assets/<projectId>/`
3. THE System SHALL persist files with the project indefinitely
4. THE System SHALL allow users to manually delete individual assets
5. WHEN THE User deletes a project, THE System SHALL remove all associated files
6. THE System SHALL NOT implement automatic cleanup or retention policies

### Requirement 12: Chat Panel UI Enhancements

**User Story:** As a user, I want an intuitive chat interface with clear mode selection, so that I can easily switch between different AI interaction modes.

#### Acceptance Criteria

1. THE System SHALL display left-aligned dropdown icons for workflow and chat type selection in the top row
2. THE System SHALL display an upload dropzone in agent mode for file uploads
3. THE System SHALL display file thumbnails with purpose labels above the chat input
4. THE System SHALL provide an agent dropdown with workflow categories and subtypes
5. THE System SHALL provide a chat dropdown with Simple Chat, Concept Development, and Style Exploration options
6. THE System SHALL display a "Manage Workflows" option in the agent dropdown that opens the settings sheet
7. THE System SHALL maintain existing bottom row icons in their current position
8. WHEN THE User selects a workflow with subtypes, THE System SHALL display subtypes in a nested dropdown structure

### Requirement 13: Gallery Section Document Tab

**User Story:** As a content creator, I want to view and edit project documents in the gallery section, so that I can manage all project content in one place.

#### Acceptance Criteria

1. THE System SHALL add a Document tab to the gallery section alongside Storyboard and Assets tabs
2. THE System SHALL move gallery icons from center-aligned to left-aligned
3. THE System SHALL display Edit, Export, and History buttons in the document tab toolbar
4. THE System SHALL display project title, style, goals, outline, and scenes in the document view
5. WHEN THE User clicks Edit, THE System SHALL switch to WYSIWYG edit mode
6. WHEN THE User clicks Export, THE System SHALL display export format options
7. WHEN THE User clicks History, THE System SHALL display version history with diff view

### Requirement 14: Settings Sheet Enhancements

**User Story:** As a user, I want comprehensive settings management, so that I can configure workflows, templates, models, and general preferences.

#### Acceptance Criteria

1. THE System SHALL provide a Workflows & System Instructions section with workflow list, thumbnails, and CRUD operations
2. THE System SHALL provide a Style Templates section with template library, thumbnails, and CRUD operations
3. THE System SHALL provide a Models section with model selection for text, image, and video with cost and quality indicators
4. THE System SHALL provide a General section with existing settings, API configuration, and rate limiting information
5. THE System SHALL provide access to settings via the settings icon in chat panel top row
6. THE System SHALL provide access to workflow management via "Manage Workflows" in agent dropdown
7. THE System SHALL provide access to template management via "Manage Templates" in template selector

### Requirement 15: Database Schema Extensions

**User Story:** As a developer, I want a well-structured database schema supporting all new features, so that data is properly organized and queryable.

#### Acceptance Criteria

1. THE System SHALL create a `project_documents` table with id, project_id, version, content (JSONB), created_at, and updated_at columns
2. THE System SHALL create a `workflows` table with id, name, description, thumbnail, category, system_instruction, art_style, examples, metadata (JSONB), and created_at columns
3. THE System SHALL create a `workflow_subtypes` table with id, workflow_id, name, description, instruction_modifier, and created_at columns
4. THE System SHALL create a `style_templates` table with id, name, description, thumbnail, category, style_prompt, tested, examples, metadata (JSONB), and created_at columns
5. THE System SHALL create an `uploaded_files` table with id, project_id, name, size, mime_type, purpose, uri, inline_data, thumbnail, and uploaded_at columns
6. THE System SHALL enforce foreign key constraints with CASCADE delete for related records
7. THE System SHALL create appropriate indexes for query performance

### Requirement 16: API Endpoints Implementation

**User Story:** As a developer, I want RESTful API endpoints for all new features, so that the frontend can interact with backend services.

#### Acceptance Criteria

1. THE System SHALL implement `POST /api/ai/chat/stream` endpoint for streaming chat with SSE
2. THE System SHALL implement `POST /api/ai/storyboard/enhanced` endpoint for enhanced storyboard generation
3. THE System SHALL implement `POST /api/ai/preview-styles` endpoint for generating 4 style preview scenes
4. THE System SHALL implement `POST /api/files/upload` endpoint for file upload with purpose
5. THE System SHALL implement `GET /api/files/:id` endpoint for retrieving file details
6. THE System SHALL implement `DELETE /api/files/:id` endpoint for deleting files
7. THE System SHALL implement CRUD endpoints for workflows: `GET /api/workflows`, `POST /api/workflows`, `PUT /api/workflows/:id`, `DELETE /api/workflows/:id`
8. THE System SHALL implement CRUD endpoints for workflow subtypes: `GET /api/workflows/:id/subtypes`, `POST /api/workflows/:id/subtypes`, `PUT /api/subtypes/:id`, `DELETE /api/subtypes/:id`
9. THE System SHALL implement CRUD endpoints for style templates: `GET /api/templates`, `POST /api/templates`, `PUT /api/templates/:id`, `DELETE /api/templates/:id`
10. THE System SHALL implement document endpoints: `GET /api/projects/:id/document`, `PUT /api/projects/:id/document`, `POST /api/projects/:id/document/export`
11. THE System SHALL modify `POST /api/ai/video` endpoint to support Veo 3.1 and conditional resolution parameters
12. THE System SHALL modify `POST /api/ai/image` and `POST /api/ai/chat` endpoints to support thinking mode

### Requirement 17: Frontend Component Architecture

**User Story:** As a developer, I want frontend components organized following feature-first architecture, so that code is maintainable and follows module boundaries.

#### Acceptance Criteria

1. THE System SHALL organize new components within existing feature modules following the project's feature-first structure
2. THE System SHALL create chat components in `src/features/chat/components/`: AgentDropdown, ChatModeDropdown, StreamingText, UploadDropzone, FileThumb, FilePurposeSelector
3. THE System SHALL create generation components in `src/features/generation/components/`: UploadProgress
4. THE System SHALL create storyboard components in `src/features/storyboard/components/`: DocumentViewer, DocumentEditor, TiptapEditor, DocumentExport
5. THE System SHALL create settings components in `src/features/settings/components/`: WorkflowManager, WorkflowEditor, SystemInstructionEditor, SubtypeManager, TemplateLibrary, TemplateEditor, TemplateCard
6. THE System SHALL enforce module boundaries with no cross-feature imports except through app-shell orchestration
7. THE System SHALL keep component files under 300 lines
8. THE System SHALL keep hook files under 200 lines

### Requirement 18: Configuration and Environment Variables

**User Story:** As a developer, I want configurable settings for new features, so that behavior can be adjusted for different environments.

#### Acceptance Criteria

1. THE System SHALL support `ENABLE_THINKING_MODE` environment variable with default value `false`
2. THE System SHALL support `ENABLE_CONTEXT_CACHING` environment variable with default value `true`
3. THE System SHALL support `FILES_API_ENABLED` environment variable with default value `true`
4. THE System SHALL support `MAX_FILE_SIZE_MB` environment variable with default value `100`
5. THE System SHALL support `DEFAULT_VIDEO_MODEL` environment variable with default value `veo-3.1-generate-001`
6. THE System SHALL support `ENABLE_STREAMING` environment variable with default value `true`
7. THE System SHALL document all new environment variables in the configuration guide

### Requirement 19: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and recovery options, so that I can understand and resolve issues quickly.

#### Acceptance Criteria

1. WHEN THE file upload fails due to size, THE System SHALL display "File too large" with maximum size limit
2. WHEN THE file upload fails due to format, THE System SHALL display "Unsupported format" with list of supported formats
3. WHEN THE file upload fails due to network, THE System SHALL display "Upload failed" with retry option
4. WHEN THE API quota is exceeded, THE System SHALL display "API quota exceeded" with suggested actions
5. WHEN THE SSE connection fails, THE System SHALL display "Connection error" with request ID and retry option
6. WHEN THE generation fails, THE System SHALL display the error message with request ID for debugging
7. THE System SHALL include request IDs in all error messages for support troubleshooting

### Requirement 20: Duration Tracking and Display

**User Story:** As a content creator, I want to see the total duration of my storyboard, so that I can plan video length appropriately.

#### Acceptance Criteria

1. WHEN THE System generates a scene, THE System SHALL include a duration field in seconds
2. THE System SHALL calculate total project duration as the sum of all scene durations
3. THE System SHALL display total duration in the project document
4. THE System SHALL allow users to edit scene durations in the document editor
5. THE System SHALL NOT track or display generation time

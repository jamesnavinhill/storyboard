# Design Document

## Overview

This design document outlines the technical architecture for enhancing VibeBoard's Gemini API integration. The enhancement transforms the application into a professional-grade creative media generation system with comprehensive workflows, optimal model usage, document management, and file handling capabilities.

**Design Principles:**

- Feature-first architecture with strict module boundaries
- Progressive enhancement with backward compatibility
- Server-side AI processing for security and control
- Real-time streaming for improved user experience
- Comprehensive error handling with request tracing
- Scalable data models supporting versioning and history

**Key References:**

- Requirements: `#[[file:.kiro/specs/gemini-api-enhancement/requirements.md]]`
- Architecture: `#[[file:docs/ARCHITECTURE.md]]`
- Module Boundaries: `#[[file:docs/MODULE-BOUNDARIES.md]]`
- Current AI Routes: `#[[file:server/routes/ai.ts]]`
- Gemini API Docs: <https://ai.google.dev/gemini-api/docs>
- Gemini Files API: <https://ai.google.dev/gemini-api/docs/vision#upload-files>
- Veo Models: <https://ai.google.dev/gemini-api/docs/models/veo>
- Imagen Models: <https://ai.google.dev/gemini-api/docs/models/imagen>
- SSE Specification: <https://html.spec.whatwg.org/multipage/server-sent-events.html>

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat Feature │  │ Storyboard   │  │ Settings     │      │
│  │              │  │ Feature      │  │ Feature      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │   App Shell     │                       │
│                   │  (Orchestration)│                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/SSE
┌────────────────────────────▼─────────────────────────────────┐
│                    Backend (Express)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI Routes    │  │ File Routes  │  │ Document     │      │
│  │ (SSE Stream) │  │ (Upload)     │  │ Routes       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │ Gemini Client   │                       │
│                   │ Service Layer   │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼─────────────────────────────────┐
│                    Gemini API                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Text Models  │  │ Image Models │  │ Video Models │      │
│  │ (Streaming)  │  │ (Imagen 4.0) │  │ (Veo 3.1)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                   ┌──────────────┐                          │
│                   │  Files API   │                          │
│                   └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘

```

### Data Flow Architecture

#### Storyboard Generation Flow

```
User Input → Chat Feature → POST /api/ai/storyboard/enhanced
                                    ↓
                            Gemini Client Service
                                    ↓
                            Gemini 2.5 Flash API
                                    ↓
                            Scene Descriptions + Metadata
                                    ↓
                            Project Document Store
                                    ↓
                            Frontend Update
```

#### File Upload Flow

```
User Drag/Drop → Upload Dropzone → Size Check
                                        ↓
                        ┌───────────────┴───────────────┐
                        │                               │
                    < 20MB                          > 20MB
                        │                               │
                        ▼                               ▼
                Base64 Encode                   Files API Upload
                        │                               │
                        └───────────────┬───────────────┘
                                        ▼
                            Store in uploaded_files table
                                        ▼
                            Display thumbnail in UI
                                        ▼
                            Include in generation request
```

#### Streaming Chat Flow

```
User Message → POST /api/ai/chat/stream → SSE Connection
                                                ↓
                                        Gemini Streaming API
                                                ↓
                                        Token-by-token response
                                                ↓
                                        SSE events to client
                                                ↓
                                        Progressive UI update
```

## Components and Interfaces

### Frontend Components

#### Chat Feature Components

**Location:** `src/features/chat/components/`

**AgentDropdown.tsx**

- Purpose: Workflow selection dropdown with categories and subtypes
- Props: `workflows`, `selectedWorkflow`, `onSelect`, `onManage`
- State: Dropdown open/closed, selected category
- Integration: Fetches workflows from `/api/workflows`

**ChatModeDropdown.tsx**

- Purpose: Chat mode selection (Simple, Concept Development, Style Exploration)
- Props: `selectedMode`, `onSelect`
- State: Dropdown open/closed
- Integration: Updates chat context in app-shell

**StreamingText.tsx**

- Purpose: Displays streaming text with progressive rendering
- Props: `content`, `isStreaming`, `onStop`
- State: Accumulated text buffer
- Integration: Consumes SSE events from `/api/ai/chat/stream`

**UploadDropzone.tsx**

- Purpose: Drag-and-drop file upload zone for agent mode
- Props: `onUpload`, `maxFiles`, `acceptedTypes`
- State: Drag state, upload progress
- Integration: Calls `/api/files/upload`

**FileThumb.tsx**

- Purpose: Displays uploaded file thumbnail with purpose label
- Props: `file`, `onDelete`, `onReorder`
- State: None (presentational)
- Integration: Displays data from uploaded_files

**FilePurposeSelector.tsx**

- Purpose: Modal for selecting file purpose
- Props: `file`, `onSelect`, `onCancel`
- State: Selected purpose
- Integration: Updates file record via `/api/files/:id`

#### Generation Feature Components

**Location:** `src/features/generation/components/`

**UploadProgress.tsx**

- Purpose: Progress bar for file uploads
- Props: `progress`, `fileName`, `onCancel`
- State: None (controlled)
- Integration: Receives progress from upload service

#### Storyboard Feature Components

**Location:** `src/features/storyboard/components/`

**DocumentViewer.tsx**

- Purpose: Read-only document view with collapsible sections
- Props: `document`, `onEdit`, `onExport`, `onHistory`
- State: Collapsed sections
- Integration: Fetches from `/api/projects/:id/document`

**DocumentEditor.tsx**

- Purpose: Container for Tiptap editor with toolbar
- Props: `document`, `onSave`, `onCancel`
- State: Editor instance, dirty flag
- Integration: Saves to `/api/projects/:id/document`

**TiptapEditor.tsx**

- Purpose: Tiptap editor integration with extensions
- Props: `content`, `onChange`, `editable`
- State: Editor state
- Integration: Tiptap library

**DocumentExport.tsx**

- Purpose: Export modal with format selection
- Props: `document`, `onExport`, `onCancel`
- State: Selected format, include assets option
- Integration: Calls `/api/projects/:id/document/export`

#### Settings Feature Components

**Location:** `src/features/settings/components/`

**WorkflowManager.tsx**

- Purpose: List view of workflows with CRUD actions
- Props: `workflows`, `onEdit`, `onCreate`, `onDelete`
- State: Selected workflow
- Integration: CRUD via `/api/workflows`

**WorkflowEditor.tsx**

- Purpose: Form for editing workflow details
- Props: `workflow`, `onSave`, `onCancel`
- State: Form values, validation errors
- Integration: Saves via `/api/workflows/:id`

**SystemInstructionEditor.tsx**

- Purpose: Text editor for system instructions with preview
- Props: `instruction`, `onChange`, `onPreview`
- State: Editor content
- Integration: Part of WorkflowEditor

**SubtypeManager.tsx**

- Purpose: List and edit workflow subtypes
- Props: `workflowId`, `subtypes`, `onEdit`, `onCreate`, `onDelete`
- State: Selected subtype
- Integration: CRUD via `/api/workflows/:id/subtypes`

**TemplateLibrary.tsx**

- Purpose: Grid view of style templates
- Props: `templates`, `onSelect`, `onCreate`, `onEdit`, `onDelete`
- State: Selected template, filter
- Integration: CRUD via `/api/templates`

**TemplateEditor.tsx**

- Purpose: Form for editing style template
- Props: `template`, `onSave`, `onCancel`, `onTest`
- State: Form values, test results
- Integration: Saves via `/api/templates/:id`

**TemplateCard.tsx**

- Purpose: Card display for single template
- Props: `template`, `onSelect`, `onEdit`, `onDelete`
- State: None (presentational)
- Integration: None (presentational)

### Backend Services

#### Gemini Client Service

**Location:** `server/services/geminiClient.ts`

**New Functions:**

```typescript
// Streaming chat with SSE
export async function* streamChatResponse(
  messages: ChatMessage[],
  systemInstruction?: string,
  thinkingMode?: boolean
): AsyncGenerator<string, void, unknown>

// Enhanced storyboard with metadata
export async function generateEnhancedStoryboard(
  concept: string,
  sceneCount: number,
  workflow: string,
  systemInstruction: string
): Promise<EnhancedScene[]>

// Style preview generation
export async function generateStylePreviews(
  concept: string,
  workflow: string
): Promise<StylePreview[]>

// Video generation with Veo 3.1
export async function generateVideoVeo31(
  imageUrl: string,
  prompt: string,
  aspectRatio: string,
  duration: number
): Promise<VideoResult>
```

#### File Upload Service

**Location:** `server/services/fileUploadService.ts`

```typescript
export interface UploadedFile {
  id: string;
  projectId: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: FilePurpose;
  uri?: string; // Files API URI
  inlineData?: string; // Base64 for small files
  thumbnail?: string;
}

export async function uploadFile(
  file: Express.Multer.File,
  projectId: string,
  purpose: FilePurpose
): Promise<UploadedFile>

export async function deleteFile(
  fileId: string,
  projectId: string
): Promise<void>

export async function getProjectFiles(
  projectId: string
): Promise<UploadedFile[]>
```

#### Document Service

**Location:** `server/services/documentService.ts`

```typescript
export interface ProjectDocument {
  id: string;
  projectId: string;
  version: number;
  content: DocumentContent;
  createdAt: Date;
  updatedAt: Date;
}

export async function getDocument(
  projectId: string
): Promise<ProjectDocument | null>

export async function saveDocument(
  projectId: string,
  content: DocumentContent
): Promise<ProjectDocument>

export async function getDocumentHistory(
  projectId: string,
  limit: number
): Promise<ProjectDocument[]>

export async function restoreDocumentVersion(
  projectId: string,
  version: number
): Promise<ProjectDocument>

export async function exportDocument(
  projectId: string,
  format: 'markdown' | 'pdf' | 'json',
  includeAssets: boolean
): Promise<Buffer>
```

### API Endpoints

#### New Endpoints

**POST /api/ai/chat/stream**

- Purpose: Streaming chat with SSE
- Request: `{ messages, systemInstruction?, thinkingMode? }`
- Response: SSE stream of text chunks
- Headers: `Content-Type: text/event-stream`
- Error Handling: Close stream with error event

**POST /api/ai/storyboard/enhanced**

- Purpose: Generate enhanced storyboard with metadata
- Request: `{ concept, sceneCount, workflow, systemInstruction }`
- Response: `{ scenes: EnhancedScene[] }`
- Validation: Zod schema
- Rate Limiting: 30 requests/minute

**POST /api/ai/preview-styles**

- Purpose: Generate 4 style preview scenes
- Request: `{ concept, workflow }`
- Response: `{ previews: StylePreview[] }`
- Validation: Zod schema
- Rate Limiting: 30 requests/minute

**POST /api/files/upload**

- Purpose: Upload file with purpose
- Request: Multipart form data with file and metadata
- Response: `{ file: UploadedFile }`
- Validation: File size, type, purpose
- Rate Limiting: 100 requests/minute

**GET /api/files/:id**

- Purpose: Get file details
- Response: `{ file: UploadedFile }`
- Authorization: Project ownership check

**DELETE /api/files/:id**

- Purpose: Delete file
- Response: `{ success: boolean }`
- Authorization: Project ownership check

**GET /api/workflows**

- Purpose: List all workflows
- Response: `{ workflows: Workflow[] }`
- Query Params: `category?`, `search?`

**POST /api/workflows**

- Purpose: Create workflow
- Request: `{ name, description, category, systemInstruction, ... }`
- Response: `{ workflow: Workflow }`
- Validation: Zod schema

**PUT /api/workflows/:id**

- Purpose: Update workflow
- Request: Partial workflow data
- Response: `{ workflow: Workflow }`
- Validation: Zod schema

**DELETE /api/workflows/:id**

- Purpose: Delete workflow
- Response: `{ success: boolean }`
- Cascade: Deletes associated subtypes

**GET /api/workflows/:id/subtypes**

- Purpose: List workflow subtypes
- Response: `{ subtypes: WorkflowSubtype[] }`

**POST /api/workflows/:id/subtypes**

- Purpose: Create subtype
- Request: `{ name, description, instructionModifier }`
- Response: `{ subtype: WorkflowSubtype }`

**PUT /api/subtypes/:id**

- Purpose: Update subtype
- Request: Partial subtype data
- Response: `{ subtype: WorkflowSubtype }`

**DELETE /api/subtypes/:id**

- Purpose: Delete subtype
- Response: `{ success: boolean }`

**GET /api/templates**

- Purpose: List style templates
- Response: `{ templates: StyleTemplate[] }`
- Query Params: `category?`, `search?`

**POST /api/templates**

- Purpose: Create template
- Request: `{ name, description, stylePrompt, ... }`
- Response: `{ template: StyleTemplate }`

**PUT /api/templates/:id**

- Purpose: Update template
- Request: Partial template data
- Response: `{ template: StyleTemplate }`

**DELETE /api/templates/:id**

- Purpose: Delete template
- Response: `{ success: boolean }`

**GET /api/projects/:id/document**

- Purpose: Get project document
- Response: `{ document: ProjectDocument }`
- Authorization: Project ownership check

**PUT /api/projects/:id/document**

- Purpose: Update project document
- Request: `{ content: DocumentContent }`
- Response: `{ document: ProjectDocument }`
- Versioning: Auto-increments version, prunes old versions

**POST /api/projects/:id/document/export**

- Purpose: Export document
- Request: `{ format: 'markdown' | 'pdf' | 'json', includeAssets: boolean }`
- Response: File download
- Content-Type: Based on format

#### Modified Endpoints

**POST /api/ai/video**

- Changes: Add Veo 3.1 support, conditional resolution parameter
- New Request Fields: `model: VideoModel`
- Validation: Conditional resolution based on model

**POST /api/ai/image**

- Changes: Add thinking mode support
- New Request Fields: `thinkingMode?: boolean`

**POST /api/ai/chat**

- Changes: Add thinking mode support
- New Request Fields: `thinkingMode?: boolean`

## Data Models

### Database Schema

#### project_documents Table

```sql
CREATE TABLE project_documents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL, -- JSON string
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, version)
);

CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_project_documents_version ON project_documents(project_id, version DESC);
```

#### workflows Table

```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT NOT NULL CHECK(category IN ('music-video', 'commercial', 'social', 'explainer', 'custom')),
  system_instruction TEXT NOT NULL,
  art_style TEXT,
  examples TEXT, -- JSON array string
  metadata TEXT, -- JSON object string
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_workflows_category ON workflows(category);
```

#### workflow_subtypes Table

```sql
CREATE TABLE workflow_subtypes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instruction_modifier TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_workflow_subtypes_workflow_id ON workflow_subtypes(workflow_id);
```

#### style_templates Table

```sql
CREATE TABLE style_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT, -- JSON array string
  style_prompt TEXT NOT NULL,
  tested INTEGER NOT NULL DEFAULT 0, -- Boolean as integer
  examples TEXT, -- JSON array string
  metadata TEXT, -- JSON object string
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_style_templates_tested ON style_templates(tested);
```

#### uploaded_files Table

```sql
CREATE TABLE uploaded_files (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('style-reference', 'character-reference', 'audio-reference', 'text-document', 'general-reference')),
  uri TEXT, -- Files API URI for large files
  inline_data TEXT, -- Base64 for small files
  thumbnail TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_uploaded_files_project_id ON uploaded_files(project_id);
```

### TypeScript Interfaces

#### Enhanced Scene

```typescript
export interface EnhancedScene {
  id: string;
  description: string;
  imagePrompt: string;
  animationPrompt: string;
  metadata: {
    duration: number; // seconds
    cameraMovement?: string;
    lighting?: string;
    mood?: string;
  };
}
```

#### Document Content

```typescript
export interface DocumentContent {
  title: string;
  style: string;
  goals: string[];
  outline: string;
  scenes: DocumentScene[];
  chatHistory?: DocumentChatMessage[];
  metadata: {
    workflow: string;
    systemInstruction: string;
    modelSettings: Record<string, any>;
    totalDuration: number;
  };
}

export interface DocumentScene {
  id: string;
  order: number;
  title: string;
  description: string;
  imagePrompt: string;
  animationPrompt: string;
  metadata: Record<string, any>;
  generatedAssets?: string[];
}

export interface DocumentChatMessage {
  timestamp: Date;
  role: 'user' | 'model';
  content: string;
  addedToDocument: boolean;
}
```

#### Workflow

```typescript
export interface Workflow {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: 'music-video' | 'commercial' | 'social' | 'explainer' | 'custom';
  subtypes: WorkflowSubtype[];
  systemInstruction: string;
  artStyle: string;
  examples?: string[];
  metadata: {
    targetDuration?: string;
    typicalSceneCount?: number;
    recommendedModels?: {
      text?: string;
      image?: string;
      video?: string;
    };
  };
}

export interface WorkflowSubtype {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  instructionModifier: string;
}
```

#### Style Template

```typescript
export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string[];
  stylePrompt: string;
  tested: boolean;
  examples?: string[];
  metadata: {
    bestFor?: string[];
    avoid?: string[];
    recommendedWith?: string[];
  };
}
```

#### File Purpose

```typescript
export type FilePurpose =
  | 'style-reference'
  | 'character-reference'
  | 'audio-reference'
  | 'text-document'
  | 'general-reference';

export interface UploadedFile {
  id: string;
  projectId: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: FilePurpose;
  uri?: string;
  inlineData?: string;
  thumbnail?: string;
  uploadedAt: Date;
}
```

## Error Handling

### Error Types

```typescript
export interface ApiError {
  error: string;
  requestId: string;
  retryable: boolean;
  errorCode?: string;
  docLink?: string;
}

export type ErrorCode =
  | 'PROJECT_NOT_FOUND'
  | 'SCENE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'UPLOAD_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'GEMINI_API_ERROR'
  | 'INVALID_MODEL'
  | 'INVALID_PARAMETERS'
  | 'DOCUMENT_NOT_FOUND'
  | 'VERSION_NOT_FOUND'
  | 'EXPORT_FAILED';
```

### Error Handling Strategy

**Client-Side:**

- Display error toasts with request ID
- Show retry button for retryable errors
- Link to documentation for specific error codes
- Log errors to console with full context

**Server-Side:**

- Generate unique request ID for each request
- Log errors with telemetry data
- Return structured error responses
- Include retry-after header for rate limits

### SSE Error Handling

```typescript
// Server sends error event
event: error
data: {"error": "Generation failed", "requestId": "...", "retryable": true}

// Client handles error event
eventSource.addEventListener('error', (event) => {
  const error = JSON.parse(event.data);
  showErrorToast(error);
  eventSource.close();
});
```

## Testing Strategy

### Unit Tests

**Backend:**

- Gemini client service functions
- File upload service logic
- Document service CRUD operations
- Validation schemas
- Error handling utilities

**Frontend:**

- Component rendering
- State management hooks
- Form validation
- Error display logic

### Integration Tests

**API Endpoints:**

- Workflow CRUD operations
- Template CRUD operations
- File upload and deletion
- Document versioning
- SSE streaming

**Feature Integration:**

- Storyboard generation flow
- File upload to generation
- Document editing and export
- Workflow application

### End-to-End Tests

**User Flows:**

- Complete storyboard creation from concept to export
- File upload and usage in generation
- Workflow customization and application
- Document editing and version restoration

## Performance Considerations

### Streaming Optimization

- Use SSE for text streaming (simpler than WebSocket)
- Buffer tokens in chunks of 5-10 for smoother display
- Implement backpressure handling
- Close connections on client disconnect

### File Upload Optimization

- Stream large files to disk
- Generate thumbnails asynchronously
- Use multipart upload for Files API
- Implement upload resumption for large files

### Database Optimization

- Index frequently queried columns
- Use prepared statements
- Batch insert operations
- Implement connection pooling

### Caching Strategy

- Cache workflow and template lists
- Cache document versions (last 10)
- Invalidate cache on updates
- Use ETags for conditional requests

## Security Considerations

### API Key Protection

- Store Gemini API key server-side only
- Never expose in client bundle
- Rotate keys periodically
- Monitor usage for anomalies

### File Upload Security

- Validate file types and sizes
- Sanitize file names
- Scan for malware (future enhancement)
- Limit upload rate per user

### Authorization

- Verify project ownership for all operations
- Implement rate limiting per IP
- Use CORS to restrict origins
- Validate all input with Zod schemas

### Data Privacy

- Hash prompts in telemetry logs
- Don't log sensitive user data
- Implement data retention policies
- Provide data export and deletion

## Migration Strategy

### Database Migrations

**Migration 001: Create new tables**

- Create project_documents table
- Create workflows table
- Create workflow_subtypes table
- Create style_templates table
- Create uploaded_files table

**Migration 002: Seed default data**

- Insert 10-15 default workflows
- Insert 10-15 default style templates
- Set up default system instructions

**Migration 003: Update existing tables**

- Add thinking_mode column to settings
- Add video_model column to settings
- Update video_model default to veo-3.1

### Backward Compatibility

- Maintain existing API endpoints
- Support legacy model names
- Provide migration path for old projects
- Deprecate old endpoints gradually

### Rollout Plan

**Phase 1: Core Infrastructure**

- Database schema and migrations
- New API endpoints
- Backend services

**Phase 2: UI Components**

- Chat panel updates
- Upload dropzone
- Settings enhancements

**Phase 3: Advanced Features**

- Document editor
- Workflow management
- Template system

**Phase 4: Polish**

- Error handling improvements
- Performance optimization
- Documentation updates

## Monitoring and Observability

### Telemetry

- Log all AI requests with request ID
- Track latency and error rates
- Monitor rate limit usage
- Alert on anomalies

### Metrics

- Generation success rate
- Average response time
- File upload success rate
- Document save frequency
- Workflow usage statistics

### Logging

```typescript
{
  requestId: string;
  endpoint: string;
  status: number;
  latencyMs: number;
  geminiModel: string;
  projectId: string;
  errorCode?: string;
  retryable?: boolean;
  timestamp: string;
}
```

## Documentation Requirements

### API Documentation

- OpenAPI/Swagger spec for all endpoints
- Request/response examples
- Error code reference
- Rate limit documentation

### User Documentation

- Workflow creation guide
- Template creation guide
- File upload best practices
- Troubleshooting guide

### Developer Documentation

- Architecture overview
- Component documentation
- Service layer documentation
- Testing guide

## Future Enhancements

### Potential Additions

- Audio model integration
- Token and cost tracking
- Batch operations
- Context caching
- A/B testing framework
- Community sharing
- Third-party integrations
- Advanced retry logic

### Scalability Considerations

- Horizontal scaling with load balancer
- Database replication
- CDN for static assets
- Queue system for long-running tasks
- Microservices architecture

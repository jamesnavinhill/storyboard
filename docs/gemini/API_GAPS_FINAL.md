# Gemini API Enhancement Specification

## Document Overview

This specification outlines the complete enhancement of VibeBoard's Gemini API integration. The goal is to build a professional-grade creative media generation system with robust workflows, optimal model usage, and polished UX.

**Approach**: Complete implementation at each step - no partial features or grace periods  
**Status**: Pre-Sprint Planning  
**Last Updated**: January 2025

---

## Table of Contents

1. [Sprint Goals](#sprint-goals)
2. [Generation System](#generation-system)
3. [Model Integration](#model-integration)
4. [Workflow & System Instructions](#workflow--system-instructions)
5. [Document Management](#document-management)
6. [File Upload System](#file-upload-system)
7. [UI/UX Enhancements](#uiux-enhancements)
8. [Technical Implementation](#technical-implementation)
9. [Out of Scope](#out-of-scope)

---

## Sprint Goals

### Primary Objective

Build a complete, professional-grade creative media generation system with optimal quality defaults and comprehensive model access.

### Key Principles

1. **Complete Implementation** - Each feature fully built before moving to next
2. **Professional Quality** - Research-backed system instructions based on proven video concepts
3. **Optimal Defaults** - Highest quality settings as defaults, all tiers available
4. **Clean UX** - Minimal UI surfacing only essential details
5. **Robust Workflows** - Tested system instructions with clear user guidance

---

## Generation System

### Enhanced Storyboard Flow

#### 1. Concept Development (Chat Mode)

- User works with AI to develop concept
- AI asks clarifying questions about style, tone, audience
- User explicitly triggers transition to storyboard mode with button

#### 2. Style Honing (Preview Mode)

**Implementation Details**:

- Generate 4 preview sample scenes showing what the full storyboard would look like
- Each preview is a complete scene representation (not abstract style samples)
- User selects preferred direction
- Selected style is automatically applied and added to the project document
- System immediately generates the full storyboard using the selected style

#### 3. Storyboard Generation (Agent Mode)

- Generate user-defined number of scenes (configurable, max 20)
- Each scene includes:
  - Scene description
  - Image generation prompt
  - Animation/video prompt (auto-generated based on concept and cohesive storyboard)
  - Metadata (duration, camera movement, lighting, mood)
- Animation prompts are shown in the animate panel and can be edited or enhanced by AI
- Results added to project document
- Compiled prompt visible in project document after generation

#### 4. Document Creation

- Structured document with all scenes and prompts
- Editable descriptions and metadata
- Consolidated view of entire project
- Export capabilities (Markdown, PDF, JSON)

### Storyboard Output Structure

```typescript
{
  scenes: Array<{
    id: string;
    description: string;
    imagePrompt: string;
    animationPrompt: string; // Auto-generated, editable in animate panel
    metadata: {
      duration: number; // Scene duration in seconds
      cameraMovement?: string;
      lighting?: string;
      mood?: string;
    };
  }>;
  projectDocument: {
    title: string;
    style: string;
    goals: string[];
    outline: string;
    scenes: SceneDetail[];
    totalDuration: number; // Sum of all scene durations
  };
}
```

**Duration Tracking**:

- Each scene has a duration field
- Project document displays total duration of all scenes
- Generation time is not tracked or displayed

---

## Model Integration

### Video Models

**New Default**: Veo 3.1 (`veo-3.1-generate-001`)

**All Available Models**:

- `veo-3.1-generate-001` - Latest, highest quality (DEFAULT)
- `veo-3.0-generate-001` - High quality, 1080p support
- `veo-3.0-fast-generate-001` - Optimized for speed
- `veo-2.0-generate-001` - Proven, reliable

**Implementation**:

- Add Veo 3.1 to model selection
- Set as default for new projects
- Update validation schemas
- Fix resolution parameter issues (conditional based on model)
- Document aspect ratio limitations

### Text Models

**All Available Models**:

- `gemini-2.5-pro` - Most capable (DEFAULT for chat)
- `gemini-2.5-flash` - Balanced speed/quality (DEFAULT for storyboard)
- `gemini-2.5-flash-lite` - Fastest

**Streaming Support**:

- Implement SSE endpoint for streaming
- Progressive text display in UI
- Stop generation button
- Connection error handling
- SSE is sufficient (no WebSocket needed)
- No fallback required for browsers without SSE support

### Image Models

**All Available Models**:

- `imagen-4.0-generate-001` - Highest quality (DEFAULT)
- `imagen-4.0-generate-001-fast` - Fast, good quality
- `imagen-3.0-generate-001` - Excellent quality
- `gemini-2.5-flash-image` - Fast, versatile, supports editing

### Thinking Mode

**Configuration**:

- Toggle in settings
- Off by default
- Available for all chat/agent modes
- Optional display of thinking process

**UI**:

```text
☐ Enable Thinking Mode
  Improves quality for complex tasks (increases cost)

☐ Show thinking process
  Display model's reasoning
```

---

## Workflow & System Instructions

### System Instructions Overview

**Unified Concept**:

- Workflows (for agent mode) and chat system instructions are the same concept
- Both are system instructions given to the AI model
- Users manage these through a single interface
- No separate prompt library or standalone prompt editing flow

### Workflow Structure

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: 'music-video' | 'commercial' | 'social' | 'explainer' | 'custom';
  subtypes: WorkflowSubtype[];
  systemInstruction: string; // The actual system prompt
  artStyle: string;
  examples?: string[];
  metadata: {
    targetDuration?: string;
    typicalSceneCount?: number;
    recommendedModels?: ModelRecommendations;
  };
}

interface WorkflowSubtype {
  id: string;
  name: string;
  description: string;
  instructionModifier: string; // Appended to base system instruction
}
```

### Workflow Categories & Subtypes

**Music Video**:

- Dark/Moody
- Bright/Energetic
- Abstract/Experimental
- Narrative/Story-driven

**Product Commercial**:

- Lifestyle
- Technical/Feature-focused
- Emotional/Brand-story
- Comparison/Before-After

**Viral Social**:

- Fast-paced/High-energy
- Authentic/Behind-the-scenes
- Tutorial/How-to
- Reaction/Commentary

**Explainer Video**:

- Animated/Illustrated
- Live-action/Presenter
- Whiteboard/Sketch
- Infographic/Data-driven

### User Management

**Full CRUD Operations**:

- Create new workflows with custom system instructions
- Edit existing workflows and their system instructions
- Delete workflows
- Create/edit/delete subtypes
- All managed through settings sheet

**System Instruction Editing**:

- Direct text editor for system instructions
- Preview mode to test instructions
- Version history for instructions
- Apply to agent mode or chat mode

### Professional System Instructions

**Requirements**:

- Research proven video production frameworks
- Structure instructions around professional concepts
- Include examples from successful campaigns
- Provide guidance on composition, camera movement, lighting, pacing

**Default Workflows**:

- Include 10-15 pre-configured workflows with professional system instructions
- Users can modify or create unlimited custom workflows
- All workflows user-editable

### Style Template System

**Overview**:

- Style templates are separate from workflows/system instructions
- Templates define visual style that gets appended to generation prompts
- Users can create, edit, and manage their own style templates

```typescript
interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string[];
  stylePrompt: string; // Appended to all generations
  tested: boolean; // Manually marked as tested by user
  examples?: string[];
  metadata: {
    bestFor?: string[];
    avoid?: string[];
    recommendedWith?: string[];
  };
}
```

**Template Management**:

- Browse library in settings sheet
- Create custom templates
- Test with preview generations
- Manually mark as "tested" after validation
- Templates append to all generation prompts until overridden
- Visible in project history

**Template Application**:

- Selected template stored in project settings
- Automatically appended to all prompts
- Can be overridden per-generation
- Changes tracked in project document

**Default Templates**:

- Include 10-15 pre-configured style templates
- Users can add unlimited custom templates
- All templates user-editable

---

## Document Management

### Project Document Schema

```typescript
interface ProjectDocument {
  id: string;
  projectId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  content: {
    title: string;
    style: string;
    goals: string[];
    outline: string;

    scenes: Array<{
      id: string;
      order: number;
      title: string;
      description: string;
      imagePrompt: string;
      animationPrompt: string;
      metadata: Record<string, any>;
      generatedAssets?: string[];
    }>;

    chatHistory?: Array<{
      timestamp: Date;
      role: 'user' | 'model';
      content: string;
      addedToDocument: boolean;
    }>;

    metadata: {
      workflow: string;
      systemInstruction: string;
      modelSettings: Record<string, any>;
    };
  };
}
```

### Document Versioning

**Implementation**:

- Automatically save new version on every document save
- Keep last 10 versions
- Older versions automatically pruned
- Version history accessible in UI
- Restore previous versions with one click

### WYSIWYG Editor

**Choice**: Tiptap (modern, extensible, React-friendly)

**Features**:

- Rich text editing
- Section management
- Code block support for prompts
- Export to Markdown, PDF, and JSON
- Real-time auto-save
- Version history

**Integration**:

- New tab in gallery section (Storyboard | Assets | Document)
- View mode: read-only with collapsible sections
- Edit mode: full WYSIWYG editing
- Chat integration: "Add to document" button

### Document Operations

1. **View Mode** - Read-only display, collapsible sections, quick navigation
2. **Edit Mode** - WYSIWYG editing, prompt editing, metadata editing, auto-save
3. **Export** - Markdown, PDF, JSON formats with user option to include asset files or links only
4. **History** - Version tracking, diff view, restore previous versions
5. **Chat Integration** - Add/append chat messages, smart section detection

---

## File Upload System

### Files API Integration

**Routing Logic**:

- Files > 20MB → Files API
- Files < 20MB → Inline (base64)
- Multiple large files → Files API
- Video/audio files → Files API

### Upload Flow

1. User drags file or clicks upload in dropzone
2. File size check determines routing
3. Progress indicator shows upload
4. Thumbnail appears above chat input
5. User selects file purpose
6. File ready for generation

### File Purpose Types

```typescript
type FilePurpose =
  | 'style-reference'
  | 'character-reference'
  | 'audio-reference'
  | 'text-document'
  | 'general-reference';
```

### File Management

```typescript
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: FilePurpose;
  uri?: string; // Files API URI
  inlineData?: string; // Base64 for small files
  thumbnail?: string;
  uploadedAt: Date;
}
```

**Features**:

- Drag-and-drop support in upload dropzone
- Progress indicators
- Thumbnail display above chat input
- Purpose selection UI
- Delete/reorder files
- Project-scoped persistence (files persist with project)

**File Limits**:

- Maximum 10 files per generation
- No hard limit enforced, but 10 recommended for performance

### File Storage

**Implementation**:

- Local filesystem storage using SQLite
- No cloud storage integration
- Files stored in project directory structure

### File Retention

**Policy**:

- Files persist with project indefinitely
- Users can manually delete individual assets
- Users can delete entire projects (removes all associated files)
- No automatic cleanup or retention policies

### Error Handling

**Common Errors**:

- File too large
- Unsupported format
- Upload failed
- API quota exceeded

**UX**:

- Clear error messages
- Suggested actions
- Retry options
- Format guidance
- Size limits displayed

---

## UI/UX Enhancements

### Chat Panel Updates

**Changes**:

1. **Upload Dropzone** - New dropzone area in agent mode for file uploads
2. **Top Row Icons** - Left-aligned icons for workflow/chat type selection with dropdown menus
3. **Bottom Row Icons** - Remain unchanged in their current position

**Layout**:

```text
┌─────────────────────────────────────┐
│ [Agent ▼] [Chat ▼]    [Settings] [?]│ ← Top row: left-aligned dropdowns + right-aligned icons
├─────────────────────────────────────┤
│                                     │
│  Output Area (mode-specific)        │
│                                     │
│  - Chat: Streaming text             │
│  - Agent: Upload dropzone + results │
│                                     │
├─────────────────────────────────────┤
│ [📎] [Uploaded files...]            │ ← File thumbnails
├─────────────────────────────────────┤
│ Chat input...                       │
├─────────────────────────────────────┤
│ [Bottom row icons - unchanged]      │ ← Existing bottom icons stay
└─────────────────────────────────────┘
```

**Agent Dropdown**:

- Music Video (with subtypes)
- Product Commercial (with subtypes)
- Viral Social (with subtypes)
- Explainer Video (with subtypes)
- [Manage Workflows...] → Opens settings sheet

**Chat Dropdown**:

- Simple Chat
- Concept Development
- Style Exploration

**Subtype UI**:

- Nested dropdown structure
- Subtypes appear when workflow is selected
- Visual hierarchy with indentation

### Upload Dropzone

**Agent Mode Only**:

```text
┌─────────────────────────────────────┐
│     Drop files here or click        │
│                                     │
│  [📁 Browse Files]                  │
│                                     │
│  Supported: Images, Video, Audio    │
└─────────────────────────────────────┘
```

**With Files**:

```text
┌─────────────────────────────────────┐
│ [🖼️ Style Ref] [👤 Character] [+]   │ ← Thumbnails with purpose
│                                     │
│ Generation results appear below...  │
└─────────────────────────────────────┘
```

### Gallery Section Updates

**Icon Alignment**:

- Center-aligned icons moved to left-aligned
- Consistent with chat panel changes

**New Document Tab**:

**Tabs**: Storyboard | Assets | Document

**Document Tab Layout**:

```text
┌─────────────────────────────────────┐
│ [Edit] [Export] [History]           │
├─────────────────────────────────────┤
│                                     │
│  # Project Title                    │
│                                     │
│  ## Style & Goals                   │
│  [Editable content...]              │
│                                     │
│  ## Scenes                          │
│  ### Scene 1: [Title]               │
│  Description: ...                   │
│  Image Prompt: ...                  │
│  Animation Prompt: ...              │
│                                     │
└─────────────────────────────────────┘
```

### Settings Sheet

**Enhanced Sections**:

1. **Workflows & System Instructions**
   - List of workflows with thumbnails
   - Edit/Create/Delete buttons
   - System instruction editor (direct text editing)
   - Subtype management
   - Full user control over all workflows
   - Preview/test mode for instructions

2. **Style Templates**
   - Style template library
   - Create custom templates
   - Preview thumbnails
   - Active template indicator
   - Test template button
   - Manual "tested" checkbox
   - Full CRUD operations

3. **Models**
   - Model selection for text/image/video
   - Cost/quality indicators
   - Thinking mode toggle

4. **General**
   - Existing settings
   - API configuration
   - Rate limiting info

**Access Points**:

- Settings icon in chat panel top row
- "Manage Workflows" in agent dropdown
- "Manage Templates" in template selector

---

## Technical Implementation

### Database Schema

```sql
-- Project documents
CREATE TABLE project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workflows (includes system instructions)
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT NOT NULL,
  system_instruction TEXT NOT NULL,
  art_style TEXT,
  examples TEXT[],
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workflow subtypes
CREATE TABLE workflow_subtypes (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instruction_modifier TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Style templates
CREATE TABLE style_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT[],
  style_prompt TEXT NOT NULL,
  tested BOOLEAN DEFAULT FALSE,
  examples TEXT[],
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded files
CREATE TABLE uploaded_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  uri TEXT,
  inline_data TEXT,
  thumbnail TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

**New Endpoints**:

```text
POST   /api/ai/chat/stream          - Streaming chat with SSE
POST   /api/ai/storyboard/enhanced  - Enhanced storyboard with metadata
POST   /api/ai/preview-styles       - Generate 4 style preview scenes
POST   /api/files/upload            - File upload with purpose
GET    /api/files/:id               - Get file details
DELETE /api/files/:id               - Delete file
GET    /api/workflows               - List workflows
POST   /api/workflows               - Create workflow
PUT    /api/workflows/:id           - Update workflow
DELETE /api/workflows/:id           - Delete workflow
GET    /api/workflows/:id/subtypes  - List subtypes
POST   /api/workflows/:id/subtypes  - Create subtype
PUT    /api/subtypes/:id            - Update subtype
DELETE /api/subtypes/:id            - Delete subtype
GET    /api/templates               - List style templates
POST   /api/templates               - Create template
PUT    /api/templates/:id           - Update template
DELETE /api/templates/:id           - Delete template
GET    /api/projects/:id/document   - Get project document
PUT    /api/projects/:id/document   - Update project document
POST   /api/projects/:id/document/export - Export document
```

**Modified Endpoints**:

```text
POST /api/ai/video  - Add veo-3.1, fix resolution parameter
POST /api/ai/image  - Add thinking mode
POST /api/ai/chat   - Add thinking mode
```

### Frontend Components

**Feature-First Architecture**:

New components will be organized within existing feature modules following the project's feature-first structure:

```text
src/features/
  ├── chat/
  │   └── components/
  │       ├── AgentDropdown.tsx
  │       ├── ChatModeDropdown.tsx
  │       ├── StreamingText.tsx
  │       ├── UploadDropzone.tsx
  │       ├── FileThumb.tsx
  │       └── FilePurposeSelector.tsx
  ├── generation/
  │   └── components/
  │       └── UploadProgress.tsx
  ├── storyboard/
  │   └── components/
  │       ├── DocumentViewer.tsx
  │       ├── DocumentEditor.tsx
  │       ├── TiptapEditor.tsx
  │       └── DocumentExport.tsx
  └── settings/
      └── components/
          ├── WorkflowManager.tsx
          ├── WorkflowEditor.tsx
          ├── SystemInstructionEditor.tsx
          ├── SubtypeManager.tsx
          ├── TemplateLibrary.tsx
          ├── TemplateEditor.tsx
          └── TemplateCard.tsx
```

**Note**: Features follow strict module boundaries - no cross-feature imports except through app-shell orchestration layer.

### Configuration

```bash
# New environment variables
ENABLE_THINKING_MODE=false
ENABLE_CONTEXT_CACHING=true
FILES_API_ENABLED=true
MAX_FILE_SIZE_MB=100
DEFAULT_VIDEO_MODEL=veo-3.1-generate-001
ENABLE_STREAMING=true
```

### Implementation Priorities

**Sprint 1 (Core Generation)**:

1. Veo 3.1 integration
2. Streaming chat (SSE)
3. Enhanced storyboard output with animation prompts
4. Style preview flow (4 sample scenes)
5. Thinking mode toggle

**Sprint 2 (UI/UX)**:

1. Chat panel updates (dropdowns, dropzone)
2. Upload zone with Files API
3. Gallery icon alignment
4. Settings sheet enhancements
5. Document tab with Tiptap

**Sprint 3 (Workflows, Templates & System Instructions)**:

1. Workflow CRUD operations
2. System instruction editor
3. Subtype management
4. Style template system with CRUD
5. Professional instruction research
6. 10-15 default workflows and templates

**Sprint 4 (Polish)**:

1. Document export (Markdown/PDF/JSON)
2. Error handling polish
3. Performance optimization
4. Final testing

---

## Out of Scope

**Deferred to Future Sprints**:

1. **Audio Models** - Music generation API integration
2. **Token & Cost Tracking** - Usage metadata and cost display
3. **Batching** - Bulk operations
4. **Enhanced Rate Limiting** - Current implementation sufficient
5. **Model Experimentation** - A/B testing framework
6. **Community & Sharing** - Social features
7. **Third-party Integrations** - ElevenLabs, Fal.ai
8. **Context Caching** - Performance optimization
9. **Advanced Retry Logic** - Current error handling sufficient

**Rationale**: Focus on core generation quality and UX. Advanced features can be added once foundation is solid.

---

## Current Implementation Reference

### Existing Endpoints

**Chat**: `POST /api/ai/chat` - Multi-turn chat with workflow context  
**Storyboard**: `POST /api/ai/storyboard` - Generate scene descriptions  
**Regenerate**: `POST /api/ai/storyboard/regenerate` - Revise scene description  
**Image**: `POST /api/ai/image` - Generate scene image  
**Image Edit**: `POST /api/ai/image/edit` - Edit existing image  
**Image Edit Prompt**: `POST /api/ai/image/edit/prompt` - Suggest edit prompt  
**Video Prompt**: `POST /api/ai/video/prompt` - Generate animation prompt  
**Video**: `POST /api/ai/video` - Generate video from image

### Existing Workflows

1. **Music Video** - Artistic, abstract, futuristic
2. **Product Commercial** - Clean, modern, minimalist
3. **Viral Social** - Vibrant, high-energy, trendy
4. **Explainer Video** - 2D animation, simple, informative

### Known Issues

1. **Veo 2.0 Resolution** - Doesn't support resolution parameter
2. **Video Aspect Ratio** - Not consistently respected by models
3. **Imagen Intermittent Errors** - Occasional timeouts/failures
4. **No Streaming** - Chat returns complete response only

---

## Next Steps

1. **Create Formal Spec** - Convert to requirements.md, design.md, tasks.md
2. **Begin Sprint 1** - Start with core generation enhancements
3. **Iterate** - Deploy complete features incrementally

---

End of Specification

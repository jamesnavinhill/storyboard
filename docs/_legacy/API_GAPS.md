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
4. [Workflow & Template System](#workflow--template-system)
5. [Document Management](#document-management)
6. [File Upload System](#file-upload-system)
7. [UI/UX Enhancements](#uiux-enhancements)
8. [Technical Implementation](#technical-implementation)
9. [Out of Scope](#out-of-scope)
10. [Open Questions](#open-questions)

---

## Sprint Goals

### Primary Objective

Build a complete, professional-grade creative media generation system with optimal quality defaults and comprehensive model access.

### Key Principles

1. **Complete Implementation** - Each feature fully built before moving to next
2. **Professional Quality** - Research-backed prompts based on proven video concepts
3. **Optimal Defaults** - Highest quality settings as defaults, all tiers available
4. **Clean UX** - Minimal UI surfacing only essential details (cost, tokens, quality)
5. **Robust Workflows** - Tested templates with clear user guidance

---

## Generation System

### Enhanced Storyboard Flow

**1. Concept Development (Chat Mode)**

- User works with AI to develop concept
- AI asks clarifying questions about style, tone, audience
- Seamless transition to storyboard mode when ready

**2. Style Honing (Preview Mode)**

- Generate 3-5 preview images in different styles
- User selects preferred direction
- Selected style becomes project template
- Template persists for all subsequent generations

**3. Storyboard Generation (Agent Mode)**

- Generate user-defined number of scenes (configurable, max 20)
- Each scene includes:
  - Scene description
  - Image generation prompt
  - Animation/video prompt (paired with image prompt)
  - Metadata (duration, camera movement, lighting, mood)
- All prompts include project template style
- Results added to project document

**4. Document Creation**

- Structured document with all scenes and prompts
- Editable descriptions and metadata
- Consolidated view of entire project
- Export capabilities (Markdown, PDF, JSON)

### Professional System Prompts

**Requirements**:

- Research proven video production frameworks
- Structure prompts around professional concepts
- Include examples from successful campaigns
- Provide guidance on composition, camera movement, lighting, pacing

**Implementation**:

- Create prompt library with professional templates
- Embed in workflow definitions
- Version control for iterations
- User feedback integration

### Storyboard Output Structure

```typescript
{
  scenes: Array<{
    id: string;
    description: string;
    imagePrompt: string;
    animationPrompt: string;
    metadata: {
      duration?: number;
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
  };
}
```

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

### Image Models

**All Available Models**:

- `imagen-4.0-generate-001` - Highest quality (DEFAULT)
- `imagen-4.0-generate-001-fast` - Fast, good quality
- `imagen-3.0-generate-001` - Excellent quality
- `gemini-2.5-flash-image` - Fast, versatile, supports editing

### Audio Models

**Music Generation API**:

- Integrate music generation endpoint
- Audio player UI components
- Audio asset management
- Audio reference uploads

### Thinking Mode

**Configuration**:

- Toggle in settings
- Off by default
- Available for all chat/agent modes
- Optional display of thinking process

**UI**:

```
☐ Enable Thinking Mode
  Improves quality for complex tasks (increases cost)

☐ Show thinking process
  Display model's reasoning
```

### Token & Cost Tracking

**Display**:

- Minimal, clean UI
- Show in expandable section after generation
- Per-request tracking
- Project totals
- Cost estimates

**UI Mockup**:

```
Generation Complete ✓
Tokens: 1,234 ($0.02)
[View Details ▼]

Expanded:
Input: 234 tokens
Output: 1,000 tokens
Total: 1,234 tokens
Cost: $0.02
Model: gemini-2.5-flash
```

---

## Workflow & Template System

### Enhanced Workflow Structure

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: 'music-video' | 'commercial' | 'social' | 'explainer' | 'custom';
  subtypes: WorkflowSubtype[];
  systemPrompt: string;
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
  promptModifier: string; // Appended to base prompt
}
```

### Workflow Subtypes

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

### Template System

```typescript
interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string[];
  stylePrompt: string; // Appended to all generations
  tested: boolean; // Marked as proven/tested
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
- Mark as "tested" after validation
- Templates append to all generation prompts until overridden
- Visible in project history

**Template Application**:

- Selected template stored in project settings
- Automatically appended to all prompts
- Can be overridden per-generation
- Changes tracked in project document

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
      template: string;
      modelSettings: Record<string, any>;
    };
  };
}
```

### WYSIWYG Editor

**Choice**: Tiptap (modern, extensible, React-friendly)

**Features**:

- Rich text editing
- Section management
- Code block support for prompts
- Export to Markdown/PDF/JSON
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
3. **Export** - Markdown, PDF, JSON formats with asset inclusion options
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

1. User drags file or clicks upload
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

- Drag-and-drop support
- Progress indicators
- Thumbnail display above chat input
- Purpose selection UI
- Delete/reorder files
- Persist across sessions (project-scoped)

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

### Chat Panel Redesign

**Current Issues**:

- Third redundant tab
- Hidden menu for mode selection
- No clear distinction between modes

**New Design**:

```
┌─────────────────────────────────────┐
│ [Agent ▼] [Chat ▼] [Settings] [?]  │ ← Top row icons
├─────────────────────────────────────┤
│                                     │
│  Output Area (mode-specific)        │
│                                     │
│  - Chat: Streaming text             │
│  - Agent: Upload zone + results     │
│                                     │
├─────────────────────────────────────┤
│ [📎] [Uploaded files...]            │ ← File thumbnails
├─────────────────────────────────────┤
│ Chat input...                       │
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

### Upload Zone

**Storyboard/Agent Mode**:

```
┌─────────────────────────────────────┐
│     Drop files here or click        │
│                                     │
│  [📁 Browse Files]                  │
│                                     │
│  Supported: Images, Video, Audio    │
└─────────────────────────────────────┘
```

**With Files**:

```
┌─────────────────────────────────────┐
│ [🖼️ Style Ref] [👤 Character] [+]   │ ← Thumbnails with purpose
│                                     │
│ Generation results appear below...  │
└─────────────────────────────────────┘
```

### Gallery Section - Document Tab

**New Tabs**: Storyboard | Assets | Document

**Document Tab**:

```
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

1. **Workflows**
   - List of workflows with thumbnails
   - Edit/Create/Delete buttons
   - System prompt editor
   - Subtype management

2. **Templates**
   - Style template library
   - Create custom templates
   - Preview thumbnails
   - Active template indicator
   - Test template button

3. **Models**
   - Model selection for text/image/video/audio
   - Cost/quality indicators
   - Thinking mode toggle
   - Token usage display

4. **General**
   - Existing settings
   - API configuration
   - Rate limiting info

**Access Points**:

- Settings icon in chat panel bottom row
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

```
POST   /api/ai/chat/stream          - Streaming chat
POST   /api/ai/storyboard/enhanced  - Enhanced storyboard with metadata
POST   /api/ai/preview-styles       - Generate style preview images
POST   /api/files/upload            - File upload with purpose
GET    /api/files/:id               - Get file details
DELETE /api/files/:id               - Delete file
GET    /api/templates               - List style templates
POST   /api/templates               - Create template
PUT    /api/templates/:id           - Update template
DELETE /api/templates/:id           - Delete template
GET    /api/projects/:id/document   - Get project document
PUT    /api/projects/:id/document   - Update project document
POST   /api/projects/:id/document/export - Export document
```

**Modified Endpoints**:

```
POST /api/ai/video  - Add veo-3.1, fix resolution parameter
POST /api/ai/image  - Add thinking mode, return token usage
POST /api/ai/chat   - Add thinking mode, return token usage
```

### Frontend Components

```
src/components/
  ├── upload/
  │   ├── UploadZone.tsx
  │   ├── FileThumb.tsx
  │   ├── FilePurposeSelector.tsx
  │   └── UploadProgress.tsx
  ├── document/
  │   ├── DocumentViewer.tsx
  │   ├── DocumentEditor.tsx
  │   ├── TiptapEditor.tsx
  │   └── DocumentExport.tsx
  ├── chat/
  │   ├── AgentDropdown.tsx
  │   ├── ChatModeDropdown.tsx
  │   ├── StreamingText.tsx
  │   └── TokenDisplay.tsx
  ├── templates/
  │   ├── TemplateLibrary.tsx
  │   ├── TemplateEditor.tsx
  │   └── TemplateCard.tsx
  └── workflows/
      ├── WorkflowManager.tsx
      ├── WorkflowEditor.tsx
      └── WorkflowCard.tsx
```

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
3. Token/cost tracking
4. Enhanced storyboard output
5. Style preview flow

**Sprint 2 (UI/UX)**:

1. Chat panel redesign
2. Upload zone with Files API
3. Mode-specific output areas
4. Settings sheet enhancements
5. Document tab with Tiptap

**Sprint 3 (Workflows & Templates)**:

1. Workflow subtypes
2. Template system
3. Template library
4. Professional prompt research
5. Template injection

**Sprint 4 (Polish & Audio)**:

1. Audio generation
2. Document export
3. Error handling polish
4. Performance optimization
5. Final testing

---

## Out of Scope

**Deferred to Future Sprints**:

1. **Batching** - Bulk operations
2. **Enhanced Rate Limiting** - Current implementation sufficient
3. **Model Experimentation** - A/B testing framework
4. **Community & Sharing** - Social features
5. **Third-party Integrations** - ElevenLabs, Fal.ai
6. **Context Caching** - Performance optimization (nice-to-have)
7. **Advanced Retry Logic** - Current error handling sufficient

**Rationale**: Focus on core generation quality and UX. Advanced features can be added once foundation is solid.

---

## Open Questions

### Generation System

1. **Style Preview Images**
   - Should previews be full scenes or abstract style samples? I ALREADY ANSWERED ALL OF THESE FUCKING QUESTIONS!! - preview of 4 sample scenes from what they would geenrate fully - so we can assure its what we want, quit being such a dick about this
   - Auto-apply selected style or allow editing first?  i already told you - YES!!!! it adds the image to the document/ and generates the storyboard

2. **Chat-to-Storyboard Transition**
   - Automatic detection when ready or explicit button? ALREADY ANSWERED!!! NOOOOOO - ur making this too diffcult again - goddamit - 
   - How to surface the compiled prompt to user? 

3. **Animation Prompts**
   - Auto-generated from image or user-editable from start? I FUCKING ANSWERED THIS CLEARLY !~!~!~ yes the original scene that the agent creates will have also an animation prompt based on the concept and its choesive storyboard - this will be added to and shown in the naimate panel - this can still be edited or enhanced by ai
   - Include timing/duration in initial version or later? JESSUC FUCKIGN CHRIST WHY DID I EVEEN ANSER ANY OF THESE FUCKING QUESTIONS!! if ur talking about project stas - yes i want to see the total time of the scnees - if ur talking aobut how long it took to generate no idont give a shit

### UI/UX

4. **File Management**
   - Maximum files per generation? (Suggested: 10) sure whateevr I SAID I DONT CARE TO HAVE A LIMIT!! 
   - File persistence: session-only or project-scoped? jessu fuckign christ again - CLEAR AS FUCKINF DAY _ PROJECT SCOPED LIKE ALL THE OTHER ASSETS

5. **Document Export**
   - Priority order: Markdown > PDF > JSON? shut the fuck up
   - Include asset files in export or links only? option? ur making this too difficult again

### Workflows & Templates

6. **Template Pre-population**
   - How many default templates to include? (Suggested: 10-15) sure again already answered
   - Template testing/validation process before marking "tested"? manual ddue get over urself my fcukin chirst ur unbearable sometimes

7. **Workflow Subtypes**
   - User-created subtypes in first version or admin-only? ability to add/edit the workflows and templates yes YES for the last fucking time
   - Subtype UI: nested dropdown, tabs, or separate selector? gave you a fucking oimage and explained it quit being a dick

### Technical

8. **File Storage**
   - Local filesystem sufficient or cloud storage needed? DDUE ARE YOU FUCKING KIDDING ME?? I SAID LOCAL STORAGE WERE USING SQLITE I NEEVR ASKED YOU TO ASSES OUR STORAGE
   - File retention policy? (Suggested: 30 days for unused files) SHUT THE FUCK UP THIS IS NOT NECESSARY - if user can manually deleet assets, projects, that is ENOUGH

9. **Document Versioning**
   - How many versions to keep? (Suggested: 10 most recent) dont fucking ask again- 10 is fine
   - Automatic versioning on every save or manual snapshots? auto - save last 10

10. **Streaming Implementation**
    - SSE sufficient or WebSocket needed? 
    - Fallback for browsers without SSE support?

---

## Next Steps

1. **Clarify Open Questions** - Review and answer remaining questions
2. **Create Formal Spec** - Convert to requirements.md, design.md, tasks.md
3. **Begin Sprint 1** - Start with core generation enhancements
4. **Iterate** - Deploy complete features incrementally

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
5. **No Token Tracking** - Usage metadata not extracted

---

*End of Specification*

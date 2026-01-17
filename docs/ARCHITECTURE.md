# Architecture Documentation

## Overview

This application follows a feature-first architecture where related functionality is co-located within feature modules. The codebase has been refactored from monolithic files (2000+ lines) into focused, maintainable modules following the Single Responsibility Principle.

## Module Boundaries and Import Rules

### Core Principles

1. **Features don't import from other features** - Each feature is self-contained
2. **Shared utilities don't import from features** - Dependency flow is unidirectional
3. **App-shell orchestrates features** - Only the app-shell layer composes multiple features
4. **No circular dependencies** - Verified with madge

### Dependency Flow

```
┌─────────────────────────────────────────────────────────┐
│                      App Shell                          │
│              (Orchestration Layer)                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Feature Modules                       │
│  (layout, library, scene, project, generation, etc.)    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Shared Modules & Services                  │
│     (components, hooks, utils, services, ui)            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Types & Config                        │
│              (types, config, constants)                 │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

### Feature Modules (`src/features/`)

Each feature module follows a consistent structure:

```
src/features/<feature-name>/
├── components/          # Feature-specific UI components
├── hooks/              # Feature-specific React hooks
├── state/              # Feature-specific state management (Zustand stores)
├── services/           # Feature-specific business logic
├── utils/              # Feature-specific utilities
├── types.ts            # Feature-specific types
├── index.ts            # Public API exports
└── README.md           # Feature documentation
```

#### Current Features

- **app-shell**: Main application orchestration and layout composition
- **layout**: Resizable panel system, collapse/expand, persistence
- **library**: Project and asset browsing, search, filtering
- **scene**: Scene management, history, CRUD operations
- **project**: Project state management and actions
- **generation**: AI generation services (chat, storyboard, media)
- **settings**: Application settings and preferences, workflow and template management
- **storyboard**: Storyboard display and interactions, document management
- **chat**: Chat interface, message handling, file uploads, streaming responses

### Shared Modules

#### Components (`src/components/`)

Reusable UI components that are used across multiple features:
- `ProjectManager.tsx` - Project list and management UI
- `AssetManager.tsx` - Asset browsing and management
- `LeftManagerDrawer/` - Unified drawer with tabs
- `toast/` - Toast notification system

#### Feature-Specific Components

**Chat Feature** (`src/features/chat/components/`)
- `AgentDropdown.tsx` - Workflow and subtype selection
- `ChatModeDropdown.tsx` - Chat mode selection (Simple, Concept, Style)
- `StreamingText.tsx` - SSE streaming text display
- `UploadDropzone.tsx` - Drag-and-drop file upload
- `FileThumb.tsx` - File thumbnail with controls
- `FilePurposeSelector.tsx` - File purpose selection modal

**Storyboard Feature** (`src/features/storyboard/components/`)
- `DocumentViewer.tsx` - Read-only document viewer
- `DocumentEditor.tsx` - Document editing with Tiptap
- `TiptapEditor.tsx` - Rich text editor integration
- `DocumentExport.tsx` - Export modal (Markdown, PDF, JSON)
- `DocumentHistory.tsx` - Version history and restore
- `DocumentTab.tsx` - Document tab for gallery section

**Settings Feature** (`src/features/settings/components/`)
- `WorkflowManager.tsx` - Workflow list and management
- `WorkflowEditor.tsx` - Workflow creation/editing form
- `SystemInstructionEditor.tsx` - System instruction text editor
- `SubtypeManager.tsx` - Subtype list and management
- `TemplateLibrary.tsx` - Style template grid
- `TemplateEditor.tsx` - Template creation/editing form
- `TemplateCard.tsx` - Template card component

#### Hooks (`src/hooks/`)

Shared React hooks:
- `useSearchState.ts` - Debounced search with localStorage persistence
- `useProjectState.ts` - Legacy shim for backward compatibility
- `useTheme.ts` - Theme management

#### Services (`src/services/`)

Core services and registries:
- `registry.ts` - Service provider and dependency injection
- Storage services, API clients, etc.

#### UI (`src/ui/`)

Low-level UI primitives:
- Icons, buttons, inputs, badges, etc.
- Reusable across all features

#### Utils (`src/utils/`)

Shared utility functions:
- `errorMapper.ts` - Error handling and mapping
- `sceneStateMachine.ts` - Scene lifecycle management
- `sseClient.ts` - Server-Sent Events client wrapper
- `fileUpload.ts` - File upload with progress tracking
- `documentExport.ts` - Document export utilities
- `errorHandling.ts` - Enhanced error handling with request IDs
- Storage utilities, formatters, etc.

### Configuration (`src/config/`)

Application-wide configuration:
- `layout.ts` - Layout constants and defaults
- `presetStyles.ts` - Style presets
- `storageKeys.ts` - localStorage key definitions

### Types (`src/types/`)

Shared TypeScript types and interfaces:
- `index.ts` - Core domain types
- `services.ts` - Service-related types

## Import Rules

### ✅ Allowed Imports

1. **Features can import from:**
   - Their own modules (internal imports)
   - Shared modules (`components/`, `hooks/`, `services/`, `ui/`, `utils/`)
   - Types and config (`types/`, `config/`)

2. **App-shell can import from:**
   - Any feature module (orchestration layer)
   - Shared modules
   - Types and config

3. **Shared modules can import from:**
   - Other shared modules (with care to avoid circular deps)
   - Types and config
   - **NOT from features**

### ❌ Prohibited Imports

1. **Features CANNOT import from other features**
   - ❌ `src/features/library/` importing from `src/features/scene/`
   - ✅ Extract shared logic to `src/hooks/` or `src/utils/`

2. **Shared modules CANNOT import from features**
   - ❌ `src/components/` importing from `src/features/library/`
   - ✅ Pass data as props or use dependency injection

3. **Circular dependencies are prohibited**
   - Verified with `npx madge --circular --extensions ts,tsx src/`

## State Management

### Zustand Stores

State is managed using Zustand with a modular slice pattern:

```typescript
// Store composition pattern
export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Core state
  projects: [],
  activeProjectId: null,
  
  // Compose slices
  ...createSceneSlice(set, get),
  ...createGroupSlice(set, get),
  ...createTagSlice(set, get),
  ...createChatSlice(set, get),
}));
```

#### Store Slices

Each domain has its own slice:
- `sceneStore.ts` - Scene operations (< 300 lines)
- `groupStore.ts` - Group operations (< 200 lines)
- `tagStore.ts` - Tag operations (< 200 lines)
- `chatStore.ts` - Chat operations (< 200 lines)
- `storeUtils.ts` - Shared store utilities (< 200 lines)

#### Feature Stores

**Settings Store** (`src/features/settings/state/`)
- `workflowStore.ts` - Workflow CRUD operations
- `templateStore.ts` - Style template CRUD operations
- `settingsStore.ts` - Composed settings state

**Storyboard Store** (`src/features/storyboard/state/`)
- `documentStore.ts` - Document CRUD, versioning, auto-save

**Generation Store** (`src/features/generation/state/`)
- `fileUploadStore.ts` - File upload progress and management

### Hook Composition

Complex state is composed from smaller, focused hooks:

```typescript
// Main orchestration hook
export const useAppShellState = () => {
  const projectState = useProjectState();
  const layout = useLayout();
  const sceneActions = useSceneActions();
  const sceneManager = useSceneManager();
  // ... compose all features
  
  return {
    project: projectState,
    layout,
    scene: { actions: sceneActions, manager: sceneManager },
    // ...
  };
};
```

## Component Patterns

### Feature Components

Feature components are self-contained and receive all dependencies via props:

```typescript
// Good: All dependencies passed as props
export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  projects,
  scenes,
  onSelectProject,
  onProjectAction,
}) => {
  // Feature-specific state
  const library = useLibraryState();
  
  return (/* ... */);
};
```

### Layout Components

Layout is separated into mobile and desktop variants:

- `MobileLayout.tsx` - Mobile-specific rendering
- `DesktopLayout.tsx` - Desktop-specific rendering
- `AppSidebar.tsx` - Sidebar component

### Composition Pattern

The app-shell composes features without implementing business logic:

```typescript
export const AppShell: React.FC = () => {
  // Single orchestration hook
  const appState = useAppShellState();
  
  // Simple theme management
  const { theme, toggleTheme } = useTheme();
  
  // Determine layout
  const isMobile = appState.layout.isMobileLayout;
  
  return (
    <div className="app-container">
      {isMobile ? (
        <MobileLayout appState={appState} theme={theme} />
      ) : (
        <DesktopLayout appState={appState} theme={theme} />
      )}
    </div>
  );
};
```

## File Size Guidelines

To maintain readability and testability:

- **Components**: < 300 lines (AppShell, LeftManagerDrawer)
- **Hooks**: < 200 lines each
- **Store files**: < 500 lines each
- **Utility files**: < 200 lines each

When a file exceeds these limits, consider:
1. Extracting sub-components
2. Splitting into multiple hooks
3. Creating store slices
4. Moving shared logic to utilities

## Testing Strategy

### Unit Tests

- Test hooks in isolation with mocked dependencies
- Test components with mocked props
- Test store slices independently

### Integration Tests

- Test feature orchestration in app-shell
- Test cross-feature interactions
- Test state synchronization

### Verification

Run circular dependency check:
```bash
npx madge --circular --extensions ts,tsx src/
npx madge --circular --extensions ts,tsx server/
```

## Migration Guide

### Moving Shared Logic

If you find yourself wanting to import from another feature:

1. **Identify the shared logic** - What needs to be reused?
2. **Extract to shared module** - Move to `hooks/`, `utils/`, or `components/`
3. **Update imports** - Both features import from shared location
4. **Verify no circular deps** - Run madge

Example:
```typescript
// Before: Feature importing from another feature
// src/components/ProjectManager.tsx
import { useLibrarySearchState } from "../features/library/hooks/useLibrarySearchState";

// After: Both import from shared location
// src/hooks/useSearchState.ts (new shared hook)
export function useSearchState<T>() { /* ... */ }

// src/features/library/hooks/useLibrarySearchState.ts (re-export for compatibility)
export { useSearchState as useLibrarySearchState } from "../../../hooks/useSearchState";

// src/components/ProjectManager.tsx
import { useSearchState } from "../hooks/useSearchState";
```

### Adding a New Feature

1. Create feature directory: `src/features/<feature-name>/`
2. Add standard subdirectories: `components/`, `hooks/`, `state/`
3. Create `index.ts` to export public API
4. Add `README.md` documenting the feature
5. Import only from shared modules and types
6. Integrate in app-shell if needed

### Refactoring Large Files

1. **Identify responsibilities** - What does this file do?
2. **Extract hooks** - Move state logic to custom hooks
3. **Extract components** - Move UI sections to components
4. **Extract utilities** - Move pure functions to utils
5. **Compose** - Use extracted pieces in main file
6. **Verify** - Run tests and check file sizes

## Best Practices

### Do's ✅

- Keep files focused and under size limits
- Use composition over inheritance
- Pass dependencies via props or hooks
- Extract shared logic to shared modules
- Document feature boundaries in README files
- Run circular dependency checks regularly

### Don'ts ❌

- Don't import features from other features
- Don't import features from shared modules
- Don't create circular dependencies
- Don't mix business logic with UI rendering
- Don't exceed file size guidelines
- Don't skip documentation

## Backend Architecture

### Services Layer (`server/services/`)

Business logic and external service integration:

**AI Services** (`geminiClient.ts`)
- `streamChatResponse()` - SSE streaming chat with token buffering
- `generateEnhancedStoryboard()` - Scene generation with auto-animation prompts
- `generateStylePreviews()` - Generate 4 style preview scenes
- `generateSceneImage()` - Image generation with multiple models
- `generateSceneVideo()` - Video generation (Veo 2.0, Veo 3.1)
- `editSceneImage()` - Image editing with Gemini 2.5 Flash

**File Services** (`fileUploadService.ts`)
- `uploadFile()` - Size-based routing (<20MB inline, ≥20MB Files API)
- `getFileById()` - Retrieve file metadata
- `deleteFile()` - Delete file and cleanup Files API resources
- Automatic thumbnail generation
- Video/audio always routed to Files API

**Document Services** (`documentService.ts`)
- `getDocument()` - Retrieve project document
- `saveDocument()` - Save with auto-versioning (keep last 10)
- `getDocumentHistory()` - List version history
- `restoreDocumentVersion()` - Restore previous version
- `exportDocument()` - Export as Markdown, PDF, or JSON

### Stores Layer (`server/stores/`)

Database access layer with SQLite:

**Core Stores**
- `projectStore.ts` - Project CRUD operations
- `assetStore.ts` - Asset management
- `sceneStore.ts` - Scene operations

**New Stores**
- `workflowStore.ts` - Workflow and subtype CRUD
- `templateStore.ts` - Style template CRUD
- `documentStore.ts` - Document versioning and history
- `uploadedFilesStore.ts` - File metadata persistence

### Routes Layer (`server/routes/`)

Express route handlers with validation:

**Core Routes**
- `projects.ts` - Project CRUD, document management, stats
- `assets.ts` - Asset upload and management
- `ai.ts` - AI generation gateway with SSE streaming

**New Routes**
- `workflows.ts` - Workflow and subtype CRUD endpoints
- `templates.ts` - Style template CRUD endpoints
- `files.ts` - File upload with multer integration

### Utilities (`server/utils/`)

**AI Telemetry** (`aiTelemetry.ts`)
- Request ID generation
- Structured logging with Pino
- Error context tracking
- Prompt hashing for privacy

**Rate Limiting** (`rateLimiter.ts`)
- Token bucket algorithm
- Per-IP rate limiting
- Configurable window and limits
- Rate limit headers

**Asset Persistence** (`assetPersistence.ts`)
- File system operations
- Directory management
- Asset cleanup

**Scene Enrichment** (`sceneEnrichment.ts`)
- Add asset URLs to scenes
- Enrich with metadata
- Format for API responses

### Database Schema

**Core Tables**
- `projects` - Project metadata
- `scenes` - Scene data with duration
- `assets` - Generated media files
- `scene_groups` - Scene grouping
- `scene_tags` - Scene tagging

**New Tables**
- `workflows` - AI agent workflows
- `workflow_subtypes` - Workflow variations
- `style_templates` - Visual style templates
- `project_documents` - Versioned project documents
- `uploaded_files` - User-uploaded reference files

### Migrations (`server/migrations/`)

Migration-based schema management:
- `001_initial_schema.sql` - Core tables
- `002_scene_groups.sql` - Scene grouping
- `003_scene_tags.sql` - Scene tagging
- `004_project_documents.sql` - Document versioning
- `005_workflows.sql` - Workflow system
- `006_workflow_subtypes.sql` - Workflow variations
- `007_style_templates.sql` - Style templates
- `008_uploaded_files.sql` - File uploads
- `009_seed_workflows.sql` - Default workflows
- `010_seed_style_templates.sql` - Default templates
- `011_add_scene_duration.sql` - Scene duration tracking

## Verification Commands

```bash
# Check for circular dependencies
npx madge --circular --extensions ts,tsx src/
npx madge --circular --extensions ts,tsx server/

# Type checking
npm run typecheck
npm run typecheck:server

# Run tests
npm test
npm run test:api

# Build verification
npm run build:all

# Database operations
npm run migrate        # Apply migrations
npm run seed          # Apply migrations + seed data
npm run check:db      # Verify database integrity
```

## Additional Resources

- [Configuration Guide](./CONFIGURATION.md)
- [Feature-First Structure ADR](./ADR-0001-feature-first-structure.md)
- [Project Plan](../plan.md)
- Feature READMEs in `src/features/*/README.md`

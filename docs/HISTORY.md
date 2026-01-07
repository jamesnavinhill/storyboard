# Project History

This document provides a consolidated narrative of the VibeBoard project's development journey, capturing key decisions, challenges, and solutions from each major phase.

---

## Phase 1: SQLite Persistence (Completed 2024)

### Goal

Replace in-browser localStorage with a lightweight, reliable SQLite-backed store accessible from the React app.

### Key Deliverables

- **Backend Infrastructure**: Express server (`server/app.ts`) with SQLite database (`server/db.ts`)
- **Database Schema**: Tables for projects, scenes, chat_messages, assets, and settings
- **REST API**: Endpoints for CRUD operations on all entities
- **Migration System**: SQL migrations in `server/migrations/` with automatic execution on startup
- **Asset Storage**: File-based storage under `data/assets/` with streaming uploads

### Technical Decisions

- **better-sqlite3** chosen for synchronous API and simplicity
- **Zod validation** for runtime type safety on all API boundaries
- **File-based assets** stored on disk with database references for URLs
- **Migration runner** executes on server startup for zero-config deployment

### Challenges & Solutions

- **Challenge**: Managing asset file paths and preventing directory traversal
  - **Solution**: Sanitized file paths with project-scoped directories
- **Challenge**: Ensuring database consistency across dev/prod environments
  - **Solution**: Timestamped migrations with idempotent SQL

### Outcome

✅ Production-ready persistence layer with zero data loss  
✅ Projects persist across browser sessions  
✅ Asset files stored reliably on disk  
✅ API smoke tests validate all endpoints

---

## Phase 2: Frontend Architectural Refactor (Completed 2024)

### Goal

Decouple UI from service orchestration, making state management and service selection modular following SOLID principles.

### Key Deliverables

- **Domain Hooks**: `useProjectState` and `useGenerationActions` for state orchestration
- **Service Registry**: Dependency injection via React context (`ServiceProvider`)
- **Provider Abstraction**: Interfaces for `ChatProvider`, `StoryboardGenerator`, `MediaGenerator`
- **Component Splitting**: Extracted `SceneEditPanel`, `SceneAnimatePanel`, `StylePresetPicker`
- **Type Safety**: Zod parsing for all API responses, discriminated unions for scene state

### Technical Decisions

- **Dependency Inversion**: Services injected via context, enabling easy provider swapping
- **Hook Composition**: Complex state composed from smaller, focused hooks
- **Scene UI State**: Explicit `SceneUIState` with `activity` and `activePanel` properties
- **Theme Management**: Dedicated `useTheme` hook with localStorage persistence

### Challenges & Solutions

- **Challenge**: Managing concurrent scene operations without race conditions
  - **Solution**: Per-scene activity state with explicit transitions
- **Challenge**: Prop drilling through deep component trees
  - **Solution**: Context-based service injection and hook composition
- **Challenge**: Type drift between frontend and backend
  - **Solution**: Zod schemas shared between client and server

### Outcome

✅ Clean separation of concerns with testable hooks  
✅ Easy to swap service providers (Gemini → server-backed)  
✅ Reduced component complexity (< 300 lines per file)  
✅ Type-safe API integration with runtime validation

---

## Phase 3: Scene & Asset Lifecycle Hardening (Completed 2024)

### Goal

Make scene state transitions predictable and guard against asset inconsistencies introduced by asynchronous flows.

### Key Deliverables

- **State Machine**: `sceneStateMachine.ts` for per-scene activity transitions
- **Multi-Panel Support**: Independent panel state allowing multiple edit/animate panels open
- **Asset Reconciliation**: Server-side checks for missing files with status enrichment
- **Error UX**: Contextual error banners with retry actions, no auto-closing panels
- **Maintenance CLI**: `npm run maintain` for pruning orphaned assets and exporting projects

### Technical Decisions

- **Per-Scene Concurrency**: One activity per scene, unlimited cross-scene parallelism
- **Panel Independence**: Removed global panel lock, panels managed per-scene
- **Asset Status**: `ready`, `missing`, `absent` states with automatic pruning
- **Structured Logging**: Server-side error logs with request context

### Challenges & Solutions

- **Challenge**: Users wanted multiple panels open simultaneously
  - **Solution**: Decoupled panel visibility from activity state
- **Challenge**: Missing asset files causing UI errors
  - **Solution**: Server enrichment with status checks, automatic reference pruning
- **Challenge**: Unclear error recovery paths
  - **Solution**: Contextual banners with "Retry" and "Open Panel" actions

### Outcome

✅ Predictable state transitions with no illegal states  
✅ Multiple edit/animate panels can stay open  
✅ Asset integrity checks prevent broken references  
✅ Clear error recovery with actionable UI guidance

---

## Phase 4: Project & Asset Management (Completed October 2025)

### Goal

Provide comprehensive project and asset management with intuitive UI for organizing and managing storyboard content.

### Key Deliverables

- **Project Management**: Full CRUD operations with search, import/export (ZIP archives)
- **Asset Management**: Asset library with thumbnails, search, filtering, and metadata
- **Drag-and-Drop**: Scene reordering with @dnd-kit, keyboard navigation, accessibility
- **Scene Grouping**: Manual grouping with visual badges, filtering, and stacking
- **Scene Tagging**: Multi-tag support with badges and filtering
- **Scene History**: 10-entry version history with one-click restore
- **Ghost Scene**: Manual and AI-assisted scene creation
- **LibraryPanel**: Unified sidebar with Projects and Assets tabs

### Technical Decisions

- **@dnd-kit**: Chosen for accessibility support and flexible API
- **Group Stacking**: Optional UX enhancement with localStorage preferences
- **ZIP Archives**: Project export includes JSON manifest + asset files
- **Single-Group Membership**: Scenes belong to one group, multiple tags
- **History Limit**: 10 entries per scene to prevent database bloat

### Challenges & Solutions

- **Challenge**: Drag-and-drop not working in grid layout
  - **Solution**: Switched to `rectSortingStrategy`, fixed transform application
- **Challenge**: Managing complex UI state across features
  - **Solution**: Zustand store slices with clear boundaries
- **Challenge**: Making features discoverable in UI
  - **Solution**: Integrated all features into unified LibraryPanel and scene cards

### Outcome

✅ Complete project lifecycle management  
✅ Intuitive drag-and-drop scene reordering  
✅ Powerful organization with groups and tags  
✅ Version history with easy restoration  
✅ Accessible UI with keyboard navigation and ARIA

---

## Phase 7: Server-Side API Gateway (Completed October 2025)

### Goal

Move all AI model calls behind the backend to protect API keys, enable rate limiting, and centralize error handling.

### Key Deliverables

- **AI Endpoints**: `/api/ai/*` routes for chat, storyboard, image, video generation
- **Server-Side Gemini**: `server/services/geminiClient.ts` with no client-side API keys
- **Rate Limiting**: In-memory token bucket with configurable limits
- **Telemetry**: Structured JSON logging with request IDs and error context
- **Provider Abstraction**: Server-backed providers implementing existing interfaces
- **Asset Persistence**: Server-side asset storage with immediate scene updates

### Technical Decisions

- **Zod Validation**: All `/api/ai/*` requests validated server-side
- **Request IDs**: `x-request-id` header for end-to-end request tracking
- **Telemetry Flag**: `ENABLE_AI_TELEMETRY` disabled by default for quiet local dev
- **Rate Limiting**: Configurable window and max requests per IP
- **Provider Toggle**: `VITE_USE_LEGACY_GEMINI` flag for offline demos

### Challenges & Solutions

- **Challenge**: Exposing API keys in client bundle
  - **Solution**: Removed Vite defines, keys only in server environment
- **Challenge**: Long-running video generation blocking requests
  - **Solution**: Server-side polling with progress tracking
- **Challenge**: Debugging AI failures across client/server boundary
  - **Solution**: Request IDs propagated to UI toasts with error metadata

### Outcome

✅ No API keys exposed to client  
✅ Rate limiting protects against abuse  
✅ Structured logging aids debugging  
✅ Request IDs enable end-to-end tracing  
✅ Provider abstraction maintained for easy swapping

---

## Completed Kiro Spec Work

### Infrastructure & Architecture

- **monolithic-file-refactor**: Split large files into focused modules (< 300 lines)
- **component-library-consolidation**: Unified component library with consistent patterns
- **fix-resizable-layout**: Fixed panel resizing with proper constraints

### UI & UX Improvements

- **fix-dnd-scene-reordering**: Fixed drag-and-drop with accessibility support
- **scene-manager-panel**: Implemented collapsible scene manager panel
- **icon-library-migration**: Migrated to lucide-react for consistent icons
- **uniform-header-spacing**: Standardized header spacing across panels
- **chat-panel-menu-full-height**: Fixed chat panel layout issues
- **ui-cleanup-redundant-elements**: Removed redundant UI elements

### Current Work

- **project-polish-audit**: Comprehensive polish phase addressing technical debt

---

## Key Architectural Decisions

### Feature-First Structure

**Decision**: Organize code by feature, not by technical layer  
**Rationale**: Improves maintainability, enables independent testing, prevents circular dependencies  
**Impact**: Clear module boundaries, easier onboarding, scalable architecture

### Dependency Inversion

**Decision**: Inject services via React context with interface-based providers  
**Rationale**: Enables easy provider swapping, improves testability, decouples UI from services  
**Impact**: Seamless transition from client-side to server-side AI calls

### Per-Scene State Machine

**Decision**: Enforce activity transitions per scene, allow unlimited cross-scene concurrency  
**Rationale**: Prevents illegal states while maintaining workflow flexibility  
**Impact**: Predictable behavior, no race conditions, clear error recovery

### Server-Side AI Gateway

**Decision**: Move all AI calls behind backend API  
**Rationale**: Protect API keys, enable rate limiting, centralize error handling  
**Impact**: Production-ready security, better debugging, consistent error handling

---

## Lessons Learned

### What Worked Well

1. **Incremental Phases**: Each phase delivered working functionality before moving forward
2. **Provider Abstraction**: Made Phase 7 transition seamless without frontend changes
3. **State Machine**: Eliminated race conditions and illegal state transitions
4. **Spec-Driven Development**: Kiro specs provided clear requirements and task tracking

### What Could Be Improved

1. **Testing Coverage**: Automated tests added late, should be concurrent with features
2. **Documentation Timing**: Some docs created after implementation, harder to maintain
3. **UI Integration**: Phase 4 had backend-first approach, causing integration delays

### Best Practices Established

1. **File Size Limits**: Components < 300 lines, hooks < 200 lines, stores < 500 lines
2. **Module Boundaries**: Features don't import from other features, verified with madge
3. **Type Safety**: Zod validation at all API boundaries, discriminated unions for state
4. **Error Handling**: Contextual errors with retry actions, structured server logging

---

## Current Status (October 2025)

### Completed Phases

- ✅ Phase 1: SQLite Persistence
- ✅ Phase 2: Frontend Refactor
- ✅ Phase 3: Scene Lifecycle Hardening
- ✅ Phase 4: Project & Asset Management
- ✅ Phase 7: Server-Side API Gateway

### In Progress

- 🔄 Phase 5: API & Prompt Enhancements
- 🔄 Project Polish Audit (addressing technical debt)

### Planned

- 📋 Phase 6: MediaBunny Integration (video editing)
- 📋 Future: Collaborative editing, real-time sync, advanced search

---

## References

For detailed technical information, see:

- [Architecture Documentation](./ARCHITECTURE.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Phase 4 Status Report](./PHASE4_STATUS.md)
- [Legacy Phase Logs](./docs/_legacy/)
- [Current Roadmap](../plan.md)

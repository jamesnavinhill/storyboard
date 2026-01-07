# Implementation Plan

This plan breaks the recommended improvements into focused phases. Each phase delivers a complete, working slice that can be validated independently before moving on. Follow the order to reduce risk and keep the UI functional throughout.

---

## Phase 1: Establish Local Persistence with SQLite **DONE**

**Goal:** Replace in-browser localStorage with a lightweight, reliable SQLite-backed store reachable from the React app.

1. **Set up backend service**
   - Add a minimal Node/Express (or Vite dev server middleware) API under `server/`.
   - Install dependencies: `better-sqlite3`, `express`, `zod` (for runtime validation), `dotenv`, and `ts-node`/`tsx` for TS support.
   - Load environment variables (API key, DB path) via `.env` and document defaults in `README.md`.

2. **Design database schema**
   - Tables: `projects`, `scenes`, `chat_messages`, `assets` (for generated files), `settings` (optional per-project overrides).
   - Define relationships:
     - `scenes.project_id` → `projects.id`.
     - `chat_messages.project_id` → `projects.id`.
     - `assets.scene_id` (nullable) for images/videos, with file path + metadata.
   - Write initial migration script (raw SQL) and a migration runner utility (simple `migrations/` folder with timestamped files read on startup).

3. **Implement data access layer**
   - Create a `db.ts` module that instantiates `better-sqlite3`, exposes helper functions for CRUD operations, and wraps complex transactions.
   - Add data mappers (TypeScript types + Zod schemas) so API input/output is strictly validated.

4. **Expose REST (or tRPC) endpoints**
   - Core routes:
     - `POST /projects` create; `GET /projects` list; `GET /projects/:id` detail (with scenes/chats option via query).
     - `POST /projects/:id/scenes`, `PATCH /projects/:id/scenes/:sceneId` for updates.
     - `POST /projects/:id/chats` (append messages) and `GET` for history.
     - `POST /assets` for uploading generated image/video metadata (store files under `data/assets/` with streaming writes from base64).
   - Apply per-route validation + error handling; respond with meaningful status codes.

5. **Integrate frontend**
   - Introduce a `projectService` fetching layer (see Phase 2) to call the new API.
   - Add project selector UI (simple list + create input) to load current project context.
   - Replace localStorage persistence with API calls: on load fetch active project, on generation push new scenes/chats/assets.
   - Keep image/video blobs local by saving to disk via the backend while returning URL references the UI can display.

6. **Testing & tooling**
   - Add scripts: `npm run dev:server`, `npm run migrate`, and `npm run seed` (optional sample project).
   - Write smoke tests for API routes (Vitest + Supertest) to lock behavior.
   - Document setup steps in `README.md` and include troubleshooting tips (e.g., DB path permissions).

Deliverable: Running dev environment where projects persist across browser sessions via SQLite, with UI fully functioning against the new API.

---

## Phase 2: Frontend Architectural Refactor for SOLID Compliance **DONE**

**Goal:** Decouple UI from service orchestration, making state management and service selection modular.

1. **Create domain hooks/services**
   - `useProjectState(projectId)` handles loading/saving scenes, chats, settings (calls backend via `projectService`).
   - `useGenerationActions()` wraps Gemini service functions, returning operations that accept project context and persist results via Phase 1 API.
   - `services/index.ts` re-exports interfaces; actual implementations live in `services/gemini` and `services/storage`.

2. **Refactor `App.tsx`**
   - Convert to a thin composition layer: project selector, theme provider, and two child panels (chat/storyboard) fed by hooks.
   - Move theme persistence into its own hook (`useTheme`) to eliminate unrelated side-effects from `App.tsx`.

3. **Introduce dependency inversion**
   - Define TypeScript interfaces (`ChatProvider`, `StoryboardGenerator`, `MediaGenerator`) in `types/services.ts`.
   - Provide concrete Gemini-backed implementations under `services/providers/gemini`.
   - Use React context to inject providers, enabling future swaps (e.g., offline mock provider) without touching components.

4. **Split large components**
   - Move file upload helpers and style preset logic from `ChatPanel.tsx` into smaller components/hooks (`useImageAttachment`, `StylePresetPicker`).
   - Extract edit/animate panels in `DesktopSceneCard.tsx` into separate components to reduce prop drilling.

5. **Strengthen typing & validation**
   - Replace optional flags on `Scene` interface with a discriminated union or dedicated `SceneUIState` managed by reducer.
   - Ensure all API responses are parsed via Zod before updating React state to catch mismatches early.

6. **Regression testing**
   - Add Vitest/RTL coverage for hooks & critical components.
   - Manual test plan: generate scenes, generate images, edit image, animate, export across multiple projects.

Deliverable: Cleaner frontend with clear separation of concerns, easier testing, and stable integration with the new persistence layer.

---

## Phase 3: Scene & Asset Lifecycle Hardening **DONE**

**Goal:** Make scene state transitions predictable and guard against asset inconsistencies introduced by asynchronous flows.

1. **Centralized state machine**
   - Create a `sceneStateMachine.ts` scoped strictly to activity transitions (`idle → generating → ready`, `ready → editing → ready`, etc.).
   - Maintain panel visibility in separate UI state (e.g., per-scene `openPanels` map) so users can keep any number of edit/animate panels open regardless of activity.
   - Update hooks from Phase 2 to use the machine when dispatching activity updates, preventing illegal states (e.g., generating image while editing) without affecting panel openness.

2. **Asset consistency checks**
   - When images/videos are generated, stream files to disk via backend and store checksums; respond to frontend with asset IDs + URLs.
   - On app load, reconcile scenes against stored assets, purging stale references or prompting re-generation if files are missing.

3. **Background cleanup utilities**
   - Add a CLI script to prune orphaned assets (files without DB references) and archive/export entire projects.
   - Schedule optional cleanup hooks within the app (e.g., manual “clean project” button triggering backend maintenance).

4. **Error handling UX**
   - Surface backend errors gracefully with toast/inline notifications; provide retry actions per scene or chat message.
   - Log structured errors server-side with timestamps and request context for debugging.

5. **Testing**
   - Write integration tests simulating concurrent operations (generate image → edit → animate) to validate state machine holds.
   - Add snapshot tests for API payloads to detect contract drift.

Deliverable: Robust scene lifecycle with reliable asset storage, ensuring users can generate/edit/animate without losing work or corrupting state.

---

## Phase 4: Project and Asset Management **COMPLETE** ✅

**Status:** 100% Complete (Updated October 24, 2025)  
**Documentation:** See `docs/PHASE4_STATUS.md` for detailed status report

### Completed Features

#### Project Management ✅
- ✅ Create, rename, delete projects through UI
- ✅ Project list view with search and sorting
- ✅ Project import/export (ZIP-based archives)
- ✅ Projects tab in sidebar with full CRUD operations
- ✅ Search and filtering functionality

#### Asset Management ✅
- ✅ Asset viewing in dedicated Assets tab
- ✅ Asset search and filtering by type
- ✅ Asset metadata display with thumbnails
- ✅ Navigation to scene history from assets
- ✅ Asset management operations accessible

#### Scene Management ✅
- ✅ Drag-and-drop scene reordering with @dnd-kit
- ✅ Keyboard navigation and accessibility support
- ✅ ARIA live regions for screen reader announcements
- ✅ Manual grouping and tagging with visual badges
- ✅ Group and tag filtering with active filter chips
- ✅ Scene history panel with restore functionality
- ✅ 10-entry history limit per scene
- ✅ Ghost scene card for manual/AI creation
- ✅ Ghost scene on empty and populated storyboards
- ✅ Manual scene creation with description input
- ✅ AI-assisted scene creation with context
- ✅ Scene stacking by group for organization
- ✅ Stacked group cards with expand/collapse
- ✅ Stacking preferences persist to localStorage

### Architecture Highlights

- **LibraryPanel:** Unified panel with Projects and Assets tabs integrated into AppSidebar
- **StoryboardPanel:** Full drag-and-drop with accessibility, group stacking, and filtering
- **SceneCard:** Displays group/tag badges, supports all scene operations
- **GhostSceneCard:** Provides manual and AI-assisted scene creation
- **SceneHistoryPanel:** Timeline view with one-click restore

### Known Limitations

- No pagination for large lists (deferred to Phase 5)
- No undo/redo system (deferred to Phase 5)
- No batch operations (deferred to Phase 5)
- Asset deduplication not implemented (checksum column exists)

### Testing Status

- ✅ Manual testing complete for all features
- ⚠️ Automated test coverage minimal (to be addressed in Phase 5)

## Phase 5: API & Prompt Enhancements **IN PROGRESS**

- veo2  says the ratio/parameters aren't supported
  - [ai:error] ApiError: {"error":{"code":400,"message":"`resolution` isn't supported by this model. Please remove it or refer to the Gemini API documentation for supported usage.","status":"INVALID_ARGUMENT"}}
    at throwErrorIfNotOK (D:\projects\storyboard\node_modules\@google\genai\src\_api_client.ts:760:24)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async (D:\projects\storyboard\node_modules\@google\genai\src\_api_client.ts:490:9)
    at async Models.Models.generateVideos (D:\projects\storyboard\node_modules\@google\genai\src\models.ts:577:12)
    at async generateSceneVideo (D:\projects\storyboard\server\services\geminiClient.ts:354:19)
    at async (D:\projects\storyboard\server\routes\ai.ts:492:21)
    at async withRequestContext (D:\projects\storyboard\server\utils\aiTelemetry.ts:98:20)
    at async handle (D:\projects\storyboard\server\routes\ai.ts:175:22) {
  status: 400,
  statusCode: 500,
  retryable: true,
  errorCode: undefined,
  requestId: '36f516fc-b976-4fca-b1a6-dfa37a8fe34b',
  promptHash: '2165fed6d5a240e8'
}
- video models are not respecting ratio or selected image ratio
  - original image should take precedence
  - if the ratio changed in settings we could add simple guard popup to ask alert/ask user to confirm or use original ratio
- imagen 4 fast and 3 not working fuly (need to resurface errors)
- larger api mapping and prompt enhancements using official Google documentation <docs\GEMINI_API.md>
  - up-to-date - full advantage and optimized model selections
  - comprehensive parameter support and validation
- Workflows and system instructions
  - Define reusable prompt templates and chaining logic
  - Support for few-shot examples and dynamic context
  - Manual editing/saving of prompt configurations, styles, and workflows
- Integration with external APIs and tools (e.g., ElevenLabs, Fal)

## Phase 6: MediaBunny Integration

- Integrate MediaBunny library for client-side video editing and processing
- Implement timeline editor with multi-track support
- Support clip trimming, transitions, and effects
- Enable export to MP4, WebM, and other formats
- Generate video thumbnails and audio waveforms

Link to Outline: <docs\mediabunny\outline.md>

### Phase 6.1 Success Criteria

- [ ] Users can create a timeline
- [ ] Users can drag scenes to timeline
- [ ] Basic playback works
- [ ] Timeline persists to database

### Phase 6.2 Success Criteria

- [ ] Users can trim clips
- [ ] Users can apply fade effects
- [ ] Users can adjust volume
- [ ] Changes preview in real-time

### Phase 6.3 Success Criteria

- [ ] Users can add transitions between clips
- [ ] At least 8 transition types available
- [ ] Transitions render smoothly
- [ ] No visual artifacts

### Phase 6.4 Success Criteria

- [ ] Users can export to MP4 and WebM
- [ ] Export completes without errors
- [ ] Thumbnails generate for all videos
- [ ] Waveforms display for audio

### Phase 6.5 Success Criteria

- [ ] Timeline is responsive and smooth
- [ ] Memory usage stays under 2GB
- [ ] Export time < 2x video duration
- [ ] No crashes during normal use

---

## Phase 7: Server-Side API Gateway **COMPLETE** ✅

**Status:** 100% Complete (October 24, 2025)

Moving all model calls behind the backend (no client-side API keys)

- Summary: Thanks to the provider abstraction (`ChatProvider`, `StoryboardGenerator`, `MediaGenerator`), this is a moderate change, not a major refactor. We’ll add server endpoints that encapsulate model calls and assets, then swap the frontend provider to call those endpoints.
- Proposed backend endpoints (new):
  - `POST /ai/chat` → body: `{ prompt, history, image?, chatModel, workflow }` → returns `{ text }`
  - `POST /ai/storyboard` → body: `{ concept, image?, styleNames[], sceneCount, workflow }` → returns `{ scenes: [{ description }], modelResponse }`
  - `POST /ai/image` → body: `{ sceneId?, description, aspectRatio, stylePrompts[], imageModel, workflow, projectId }` → server generates image and writes asset to disk/DB → returns `{ asset: { id }, url }`
  - `POST /ai/image/edit` → body: `{ sceneId, prompt, projectId }` → server fetches the current image asset binary, edits it, stores new image asset → returns `{ asset: { id }, url }`
  - `POST /ai/video` → body: `{ sceneId, prompt, projectId, model, aspectRatio }` → server fetches image asset, runs video generation and polling, stores video asset → returns `{ asset: { id }, url }`
- Server implementation details:
  - Use the existing `@google/genai` only on the server; read `GEMINI_API_KEY` from server env (no Vite define).
  - Reuse stores/utilities for asset writes: `server/stores/assetStore.ts` and `server/utils/assetHelpers.ts`.
  - Validate request/response using Zod (see patterns in `server/routes/projects.ts`).
  - Video polling remains on the server (similar to current frontend logic in `geminiService.generateSceneVideo`).
- Frontend changes:
  - Add a provider that calls the backend endpoints (e.g., `src/services/providers/server.ts`). Implement `ChatProvider`, `StoryboardGenerator`, and `MediaGenerator` by HTTP to `/ai/*` instead of calling `geminiService`.
  - Update `ServiceProvider` default registry to use the server-backed provider (or gate with an env flag) so `useGenerationActions` code stays unchanged.
  - For chat attachments, you can continue using `projectStorage.uploadAsset` (existing), or accept `image` directly on `/ai/chat/storyboard` and let the server save attachments (optional).
- Cleanup:
  - Remove `process.env.API_KEY` from Vite `define` in `vite.config.ts` so no keys ship to the browser. Keep keys in server `.env` only.
- Complexity assessment:
  - Backend: add ~5 endpoints with validation and asset plumbing, reusing existing stores; moderate effort.
  - Frontend: implement one alternate provider file and swap in the registry; low-to-moderate effort.
  - Current hooks/components are unaffected due to the dependency inversion layer.
- Migration strategy:
  - Introduce the server provider side-by-side with the current Gemini client provider; toggle via an env/config for a smooth cutover.
  - Validate flows one-by-one (chat → storyboard → image → edit → video).

## Phase 8: UX Improvements **DEFERRED**

**Note:** UX improvements have been partially addressed through Phase 4 and ongoing polish work. Remaining items deferred to future phases.

- autoplay of videos and out of sync between screen sizes
  - on desktop mobile and desktop aren't synched - videos will play on one when paused on the other
- icon stylings need simplified and unified / no box border - icon will color hover/active
- template style images / where to put them, size, format etc.
- scenecards
  - hover areas for menu/details need expanded touch targets
  - thinking if scenecards were dividin in 3 equal widths, details gets left, center stays clear, right gets menu
  - details will show on first populate after working with the chat
- edit/animate menu layout
  - one text input that covers the area the input + buttons covers now
  - generate becomes a send icon in typical send location and to the left it is a "magic wand" type icon for ai prompt
  - no text needed - surface the text in plain tooltips we use now
- sitewide radius plan - < 0.3. sharper, except images/scenes can be slightly rounder like .04 - .05 for a polished professional feel

## Phase 9: Future-ready Enhancements

**Goal:** Lay groundwork for upcoming features like semantic search while keeping the current system stable.

1. **Abstraction for search providers**
   - Define a `SearchIndex` interface with no-op implementation for now; wire backend to call it after saves.
   - Keep embeddings logic out of the critical path until a provider is chosen.

2. **Audit trail & versioning**
   - Extend DB schema with `history` tables or JSON columns to track changes to scenes and prompts.
   - Provide export/import utilities (zip of JSON + assets) for sharing or backup.

3. **CI/CD plumbing**
   - Add GitHub Actions workflow running lint/tests/migrations.
   - Optionally bundle the backend into a single dev command (`npm run dev` concurrently runs Vite + server).

Deliverable: Optional layer that prepares the project for semantic search, collaboration, and automated verification without adding immediate complexity.

## Completion Checklist

- [x] Backend server boots, migrates DB, and serves authenticated (if desired) REST endpoints.
- [x] Frontend switches from localStorage to API-driven persistence with project selection UI.
- [x] Architecture refactor completed; SOLID concerns addressed (hooks/services/context in place).
- [x] Scene state machine governs all media generation/edit flows; assets stored/retrieved reliably.
- [x] Tests cover API + critical UI flows; manual test script executed and documented.
- [x] Project & Asset management finalized with UI and API support.
- [x] Server-side API gateway with rate limiting, telemetry, and secure API key management.
- [ ] Models, APIs, and prompt enhancements (Phase 5 - In Progress)
- [ ] Prompting & Workflows (Phase 5 - In Progress)
- [ ] MediaBunny Integration (Phase 6 - Planned)
- [ ] Optional future-ready abstractions stubbed for semantic search.
- [x] README, CONFIGURATION, updated with setup, migration, and troubleshooting info.

### Completion Status

- **Phase 1** ✅ Complete (2024): Express server (`server/app.ts`) backed by SQLite (`server/db.ts` + migrations) persists projects, scenes, chat, settings, and assets under `data/` with REST endpoints consumed by the UI.
- **Phase 2** ✅ Complete (2024): React uses hook-driven state (`src/hooks/useProjectState.ts`), provider-based service injection (`src/services/registry.tsx`), and typed storage adapters (`src/services/projectService.ts`).
- **Phase 3** ✅ Complete (2024): Per-scene state machine (`src/utils/sceneStateMachine.ts`), asset reconciliation/metadata enrichment (`server/routes/projects.ts`), and maintenance tooling (`server/scripts/maintenance.ts`) protect against stale or missing files.
- **Phase 4** ✅ Complete (October 2025): Full project and asset management with LibraryPanel integration, drag-and-drop scene reordering, grouping/tagging with visual UI, scene history with restore, ghost scene creation, and group stacking. See `docs/PHASE4_STATUS.md` for details.
- **Phase 7** ✅ Complete (October 2025): Server-side API gateway for AI model calls with Zod validation, asset persistence, rate limiting, telemetry, and provider abstraction. No client-side API keys exposed.
- **Phase 5** 🔄 In Progress: API & prompt enhancements to address known issues and implement advanced features.

### Observations

**Major Milestones Achieved:**

- **Phase 4 completion** represents a major milestone with all core project and asset management features fully integrated and accessible. The application now provides a complete workflow for creating, organizing, and managing storyboard projects with professional-grade features like drag-and-drop reordering, grouping/tagging, and version history.

- **Phase 7 completion** establishes production-grade security and infrastructure. All AI model calls are now server-side with proper rate limiting, telemetry, and API key protection. The application is ready for deployment with no sensitive credentials exposed to the client.

### Remaining Gaps & Risks

#### Security

- ✅ API keys moved to server-side (Phase 7) - no longer exposed in client bundle
- ✅ Rate limiting implemented for AI endpoints (Phase 7)
- ✅ Request telemetry and monitoring in place (Phase 7)
- ⚠️ Asset uploads may accept `fileName` values verbatim; path traversal sanitization should be verified

#### Performance

- ⚠️ No pagination for large lists (100+ scenes/assets may impact performance)
- ⚠️ No virtual scrolling for long scene lists
- ⚠️ Asset deduplication not implemented (checksum column exists but unused)

#### Testing

- ⚠️ Automated test coverage minimal for Phase 4 features
- ⚠️ Integration tests needed for drag-and-drop workflows
- ⚠️ E2E tests needed for complete user journeys
- ⚠️ Server-side AI endpoint tests needed (Phase 7)

#### Documentation

- ⚠️ API documentation incomplete (needs comprehensive API reference)
- ⚠️ User guide needs update with Phase 4 and Phase 7 features
- ⚠️ Deployment documentation needs expansion

**Recommendation:** Address testing and documentation gaps in Phase 5 alongside API enhancements. Consider creating comprehensive API documentation and deployment guides.

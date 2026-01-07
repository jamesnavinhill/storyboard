# Design Document

## Overview

This design document outlines the approach for polishing the VibeBoard project to ensure code quality, complete feature integration, and preparation for the major API/model reconfiguration phase. The design focuses on addressing technical debt, completing unfinished integrations, and establishing a solid foundation for production-grade enhancements.

## Architecture

### Current State Assessment

The project has successfully completed Phases 1-3 and Phase 7:

- **Phase 1**: SQLite persistence with Express backend
- **Phase 2**: Frontend architectural refactor with SOLID principles
- **Phase 3**: Scene and asset lifecycle hardening
- **Phase 7**: Server-side API gateway with telemetry and rate limiting

**Phase 4** is 85% complete with strong backend but incomplete frontend integration.

### Module Organization

The codebase follows a feature-first architecture:

```,
src/
├── features/          # Feature modules (app-shell, chat, generation, layout, library, project, scene, settings, storyboard)
├── components/        # Shared components (toast, Loader)
├── hooks/             # Shared hooks
├── services/          # Core services and DI
├── ui/                # UI primitives
├── utils/             # Shared utilities
├── config/            # App configuration
└── types/             # Shared types
```

**Key Principle**: Features don't import from other features (except app-shell orchestration layer).

## Components and Interfaces

### 1. Type Safety Improvements

**Component**: TypeScript Configuration
**Location**: `tsconfig.json`

**Changes Required**:

```json
{
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    // ... existing options
  }
}
```

**Impact**: Will surface hidden type errors that need fixing.

**Component**: Scene Store Type Fix
**Location**: `src/features/project/state/sceneStore.ts`

**Issue**: The `reorderScenes` function accesses `_services` and `activeProjectId` properties that don't exist on the `SceneSlice` type.

**Solution**: Update the type signature to include these properties or refactor to pass them as parameters.

### 2. Documentation Consolidation

**Component**: Historical Reference Document
**Location**: `docs/HISTORY.md` (new)

**Purpose**: Consolidate all phase logs from `docs/_legacy/` into a single chronological reference.

**Structure**:

```markdown
# Project History

## Phase 1: SQLite Persistence (Completed)
[Summary from phase1-todo.md]

## Phase 2: Frontend Refactor (Completed)
[Summary from phase2-todo.md]

## Phase 3: Lifecycle Hardening (Completed)
[Summary from phase3-log.md]

## Phase 4: Project & Asset Management (85% Complete)
[Summary from phase4-audit.md]

## Phase 7: Server-Side API (Completed)
[Summary from phase7-todo.md]
```

**Component**: Updated Configuration Documentation
**Location**: `docs/CONFIGURATION.md`

**Additions**:

- Document AI telemetry configuration (`ENABLE_AI_TELEMETRY`)
- Document rate limiting configuration (`AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_MAX_REQUESTS`)
- Add troubleshooting section for common configuration issues
- Document the request ID flow for debugging

### 3. Accessibility Enhancements

**Component**: ARIA Attribute Audit
**Scope**: All interactive components

**Implementation Strategy**:

1. Identify all buttons without visible text (icon-only buttons)
2. Add `aria-label` attributes with descriptive text
3. Identify custom interactive components
4. Add appropriate ARIA roles (`button`, `dialog`, `menu`, etc.)
5. Ensure form inputs have labels or `aria-labelledby`
6. Add `aria-live="polite"` to toast notification container

**Example**:

```tsx
// Before
<button onClick={handleClick}>
  <IconTrash />
</button>

// After
<button onClick={handleClick} aria-label="Delete scene">
  <IconTrash />
</button>
```

### 4. Style System Refinement

**Component**: Border Radius System
**Location**: `src/styles/` or CSS variables

**Implementation**:

```css
:root {
  --radius-sharp: 0.25rem;    /* UI elements: buttons, inputs */
  --radius-soft: 0.4rem;      /* Images, scene cards */
  --radius-round: 9999px;     /* Pills, badges */
}
```

**Component**: Icon Styling Unification
**Scope**: All icon components

**Changes**:

- Remove box borders from icon containers
- Use color transitions for hover/active states
- Ensure consistent sizing (16px, 20px, 24px)

### 5. Phase 4 Integration Completion

**Component**: Project Manager Integration
**Location**: `src/features/library/` or `src/features/app-shell/`

**Design**:

- Add "Manage Projects" button to sidebar or header
- Open ProjectManager in a modal or drawer
- Wire up to existing `useProjectState` hook
- Ensure all CRUD operations work through UI

**Component**: Asset Manager Integration
**Location**: `src/features/library/`

**Design**:

- Add "Assets" tab to LeftManagerDrawer
- Display asset grid with thumbnails
- Enable search, filter, rename, delete operations
- Link to scene history when clicking an asset

**Component**: Drag-and-Drop Scene Reordering
**Location**: `src/features/storyboard/components/StoryboardPanel.tsx`

**Design**:

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

<DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
  <SortableContext items={sceneIds} strategy={verticalListSortingStrategy}>
    {scenes.map(scene => (
      <SortableSceneCard key={scene.id} scene={scene} />
    ))}
  </SortableContext>
</DndContext>
```

**Component**: Ghost Scene Card Integration
**Location**: `src/features/storyboard/components/StoryboardPanel.tsx`

**Design**:

- Render GhostSceneCard at the end of the scene list
- Support both manual and AI-assisted scene creation
- Show context-aware prompts based on existing scenes

**Component**: Scene History Panel
**Location**: `src/features/scene/components/SceneHistoryPanel.tsx` (new)

**Design**:

```tsx
interface SceneHistoryPanelProps {
  sceneId: string;
  entries: SceneHistoryEntry[];
  isLoading: boolean;
  onRestore: (entryId: string) => void;
  onClose: () => void;
}
```

- Display timeline of scene changes
- Show thumbnails for each version
- Enable one-click restore
- Integrate into SceneManageDrawer as a tab

### 6. API Configuration Audit

**Component**: API Gap Analysis Document
**Location**: `docs/gemini/API_GAPS.md` (new)

**Content**:

1. **Current Implementation**:
   - List all implemented endpoints
   - Document parameters and response formats
   - Note any custom extensions

2. **Known Issues**:
   - Veo2 resolution parameter not supported
   - Video models not respecting aspect ratio
   - Imagen 4 Fast and Imagen 3 errors

3. **Missing Features**:
   - Advanced prompt engineering features
   - Batch API support
   - Caching for repeated requests
   - Thinking mode for complex tasks
   - Structured output validation

4. **Recommendations**:
   - Prioritized list of improvements
   - Breaking vs. non-breaking changes
   - Timeline estimates

## Data Models

### Type Safety Enhancements

**SceneSlice Interface Update**:

```typescript
interface SceneSlice {
  // Existing properties
  scenes: Scene[];
  
  // Add missing properties
  _services?: {
    reorderScenes: (projectId: string, sceneIds: string[]) => Promise<void>;
  };
  activeProjectId: string | null;
  
  // Actions
  reorderScenes: (sceneIds: string[]) => Promise<void>;
  // ... other actions
}
```

### Documentation Models

**Phase Completion Status**:

```typescript
interface PhaseStatus {
  phase: number;
  name: string;
  status: 'complete' | 'in-progress' | 'not-started';
  completionPercentage: number;
  deliverables: string[];
  gaps: string[];
  nextSteps: string[];
}
```

## Error Handling

### Type Errors

**Strategy**: Enable strict mode incrementally

1. Fix existing type errors in `sceneStore.ts`
2. Enable `strict: true` in tsconfig
3. Fix newly surfaced errors one file at a time
4. Use `// @ts-expect-error` with explanatory comments only when necessary

### Build Errors

**Strategy**: Ensure clean builds before proceeding

1. Run `npm run typecheck` and `npm run typecheck:server`
2. Run `npm run build:all`
3. Fix any errors before moving to next phase

### Runtime Errors

**Strategy**: Comprehensive error boundaries

- Ensure all async operations have try-catch
- Log errors with request IDs for debugging
- Surface user-friendly error messages

## Testing Strategy

### Unit Tests

**Priority Components**:

1. Scene store actions (especially `reorderScenes`)
2. Project management hooks
3. Asset management utilities
4. Type guards and validators

### Integration Tests

**Priority Flows**:

1. Project CRUD operations through UI
2. Scene drag-and-drop reordering
3. Asset management operations
4. Scene history view and restore

### Smoke Tests

**Existing Coverage**:

- API health endpoint
- Project endpoints
- Scene endpoints
- Chat endpoints
- Asset endpoints

**Gaps**:

- AI endpoints (chat, storyboard, image, video)
- Export/import functionality
- Group and tag operations

### Manual QA Checklist

1. **Project Management**:
   - [ ] Create project
   - [ ] Rename project
   - [ ] Delete project
   - [ ] Export project
   - [ ] Import project

2. **Scene Management**:
   - [ ] Drag-and-drop reorder scenes
   - [ ] Create manual scene via ghost card
   - [ ] View scene history
   - [ ] Restore scene from history
   - [ ] Assign scene to group
   - [ ] Add/remove scene tags

3. **Asset Management**:
   - [ ] View asset library
   - [ ] Search assets
   - [ ] Rename asset
   - [ ] Delete asset
   - [ ] Download asset

4. **Accessibility**:
   - [ ] Tab through all interactive elements
   - [ ] Use screen reader to navigate
   - [ ] Verify ARIA labels are descriptive
   - [ ] Test keyboard shortcuts

## Implementation Phases

### Phase 1: Critical Fixes (1-2 days)

1. Fix TypeScript errors in `sceneStore.ts`
2. Enable strict mode in tsconfig
3. Fix newly surfaced type errors
4. Verify builds pass

### Phase 2: Documentation (1 day)

1. Create `docs/HISTORY.md`
2. Update `docs/CONFIGURATION.md`
3. Update `README.md`
4. Create `docs/gemini/API_GAPS.md`

### Phase 3: Accessibility (2-3 days)

1. Audit all components for ARIA attributes
2. Add labels to icon-only buttons
3. Add roles to custom components
4. Test with screen reader
5. Implement keyboard navigation improvements

### Phase 4: Phase 4 Integration (1 week)

1. Integrate ProjectManager component
2. Integrate AssetManager component
3. Implement drag-and-drop scene reordering
4. Integrate GhostSceneCard
5. Create and integrate SceneHistoryPanel
6. Integrate scene grouping/tagging UI

### Phase 5: Style Refinement (2-3 days)

1. Implement border radius system
2. Unify icon styling
3. Remove inline styles
4. Consolidate CSS classes

### Phase 6: Testing & Verification (2-3 days)

1. Add missing smoke tests
2. Run full QA checklist
3. Fix any discovered issues
4. Document test coverage

## Migration Strategy

### Backward Compatibility

All changes should be non-breaking:

- Type fixes should not change runtime behavior
- UI integrations should be additive
- Documentation updates don't affect code

### Rollout Plan

1. **Development**: Complete all phases in feature branch
2. **Testing**: Run full test suite and manual QA
3. **Staging**: Deploy to staging environment for validation
4. **Production**: Deploy with monitoring for errors

### Rollback Plan

- Keep feature flags for new UI integrations
- Maintain git tags for each phase completion
- Document rollback procedures in `docs/DEPLOYMENT.md`

## Performance Considerations

### Build Performance

- Strict mode may increase build time slightly
- Monitor bundle size after changes
- Use code splitting for new components

### Runtime Performance

- Drag-and-drop should be smooth (60fps)
- Asset library should handle 100+ assets
- Scene history should load quickly (<500ms)

### Database Performance

- Ensure indexes exist for common queries
- Monitor query performance with telemetry
- Consider pagination for large datasets

## Security Considerations

### API Key Protection

- Verify no keys in client bundle
- Ensure `.env.example` doesn't contain real keys
- Document key rotation procedures

### Input Validation

- All user inputs validated with Zod
- Sanitize file names for asset uploads
- Prevent path traversal attacks

### Rate Limiting

- Existing rate limiting for AI endpoints
- Consider rate limiting for other endpoints
- Document rate limit policies

## Accessibility Compliance

### WCAG 2.1 Level AA

**Target Compliance**:

- Perceivable: All images have alt text, color contrast meets standards
- Operable: All functionality available via keyboard
- Understandable: Clear labels and instructions
- Robust: Valid HTML and ARIA attributes

### Testing Tools

- axe DevTools for automated testing
- NVDA or JAWS for screen reader testing
- Keyboard-only navigation testing
- Color contrast analyzer

## Future Considerations

### Phase 5: API & Prompt Enhancements

**Preparation**:

- Document current API implementation thoroughly
- Identify all gaps and issues
- Create prioritized improvement list
- Research official Gemini API best practices

### Phase 6: MediaBunny Integration

**Preparation**:

- Ensure asset management is solid
- Verify video handling is robust
- Document video format requirements

### Production Deployment

**Preparation**:

- Complete all polish tasks
- Achieve 100% test coverage for critical paths
- Document deployment procedures
- Set up monitoring and alerting

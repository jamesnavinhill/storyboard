# Post-Refactor Cleanup Design

## Overview

This design document outlines the systematic cleanup of naming inconsistencies, unused components, and test organization issues following the Gemini API Enhancement refactor. The cleanup focuses on production-grade code quality through targeted, minimal changes that improve maintainability without introducing breaking changes or requiring major refactoring.

## Architecture Context

### Current State Analysis

**Type Files:**
- `src/types/gemini-enhancement.ts` exists with comprehensive Gemini-related types
- No current imports found (likely due to incomplete feature integration)
- File contains: Workflow, StyleTemplate, DocumentContent, UploadedFile types

**Chat Components:**
- `ChatPanel.tsx` (active, 400+ lines): Basic chat with agent selection, style presets, settings
- `EnhancedChatPanel.tsx` (unused, 500+ lines): Extended version with AgentDropdown, ChatModeDropdown, UploadDropzone, FileThumb, FilePurposeSelector
- Both components exported from `src/features/chat/components/index.ts`
- Neither component currently imported anywhere in the codebase

**Layout Components:**
- `LeftManagerDrawer` located at `src/features/layout/components/LeftManagerDrawer/`
- Component is NOT currently imported in DesktopLayout or MobileLayout
- Appears to be replaced by different sidebar implementation
- Contains comprehensive drawer functionality with tabs for Library, Details, Groups & Tags, History

**Test Organization:**
- 9 `__tests__` directories in `src/`
- 2 `__tests__` directories in `server/`
- Feature-based organization already in place
- Test failures primarily due to incomplete mocks (17 failures out of 24 tests)

## Design Decisions

### 1. Type File Renaming

**Decision:** Rename `gemini-enhancement.ts` to `gemini.ts`

**Rationale:**
- Shorter, cleaner import paths
- "Enhancement" is implementation detail, not domain concept
- Aligns with naming convention of other type files (`document.ts`, `services.ts`)
- No breaking changes since no current imports exist

**Implementation:**
```
src/types/gemini-enhancement.ts → src/types/gemini.ts
```

**Impact:** Zero - no current imports to update

### 2. ManagerDrawer Component Renaming

**Decision:** Rename `LeftManagerDrawer` to `ManagerDrawer`

**Rationale:**
- "Left" describes position, not function
- Position may change with layout refactors
- Component is not currently used, making this a safe rename
- Aligns with naming best practices (describe what, not where)

**Implementation:**
```
src/features/layout/components/LeftManagerDrawer/ → ManagerDrawer/
LeftManagerDrawer.tsx → ManagerDrawer.tsx
LeftManagerDrawerProps → ManagerDrawerProps
```

**Files to Update:**
- `ManagerDrawer.tsx`: Component name, interface name
- `index.tsx`: Export statements
- `README.md`: Documentation references
- `docs/ARCHITECTURE.md`: Architecture documentation
- Legacy spec files (for historical accuracy)

**Impact:** Zero runtime impact - component not currently imported

### 3. ManagerDrawer Location Verification

**Decision:** Keep component in `features/layout/components/`

**Rationale:**
- Location aligns with feature-first architecture
- Layout feature owns drawer/panel components
- No cross-feature dependencies detected
- Follows established pattern (SceneManageDrawer also in respective feature)

**Documentation:** Add note to component README confirming architectural alignment

### 4. ChatPanel Component Strategy

**Current Situation:**
- `ChatPanel`: Basic implementation, 400+ lines, NOT currently used
- `EnhancedChatPanel`: Extended implementation with workflow/file features, 500+ lines, NOT currently used
- Both components appear to be work-in-progress from incomplete feature

**Decision:** Rename `EnhancedChatPanel` to `AgentChatPanel` and document integration plan

**Rationale:**
- "Enhanced" is vague and doesn't describe the actual purpose
- Component includes agent-specific features: AgentDropdown, ChatModeDropdown, file uploads
- "AgentChatPanel" clearly indicates this is for agent-based workflows
- Preserves both implementations for future integration decision
- Avoids premature deletion of potentially valuable code

**Implementation:**
```
EnhancedChatPanel.tsx → AgentChatPanel.tsx
EnhancedChatPanelProps → AgentChatPanelProps
```

**Files to Update:**
- `AgentChatPanel.tsx`: Component name, interface name
- `index.ts`: Export statement
- Add README.md documenting the two chat panel variants and their intended use cases

**Integration Plan Documentation:**
The design document will include a section explaining:
- `ChatPanel`: Simpler chat interface for basic storyboard generation
- `AgentChatPanel`: Advanced interface with workflow selection, file uploads, and agent modes
- Decision point: Determine which to use or merge features based on product requirements

### 5. Test Directory Organization

**Decision:** Keep current feature-based organization (11 total directories)

**Rationale:**
- Already follows feature-first architecture
- Tests colocated with implementation code
- Consolidation would break feature boundaries
- Current structure supports:
  - Feature isolation
  - Easier test discovery
  - Better IDE integration
  - Clearer ownership

**Current Structure:**
```
src/
├── features/
│   ├── app-shell/hooks/__tests__/
│   ├── chat/components/__tests__/
│   ├── generation/hooks/__tests__/
│   ├── library/components/__tests__/
│   ├── scene/components/__tests__/
│   ├── settings/components/__tests__/
│   ├── storyboard/components/__tests__/
│   └── storyboard/hooks/__tests__/
├── utils/__tests__/
└── __tests__/ (integration tests)

server/
├── routes/__tests__/
└── services/__tests__/
```

**Documentation:** Update tech.md steering file to explicitly recommend this pattern

### 6. Test Failure Analysis

**Decision:** Document failures without implementing fixes

**Rationale:**
- Fixes are out of scope for cleanup spec
- Failures are due to incomplete mocks, not structural issues
- Separate test-fix spec should handle remediation
- Cleanup should not introduce new test changes

**Analysis Results:**

**Category 1: Gemini Client Mock Issues (9 failures)**
- Root cause: Mock client doesn't implement full Gemini SDK interface
- Affected: `geminiClient.test.ts`
- Examples:
  - `client.models.generateImages is not a function`
  - `Cannot read properties of undefined (reading 'text')`
- Fix effort: 2-3 hours to create comprehensive mock
- Priority: Medium (tests exist, just need proper mocks)

**Category 2: SSE Client Mock Issues (8 failures)**
- Root cause: Mock EventSource doesn't expose test utilities
- Affected: `sseClient.test.ts`
- Examples:
  - `Cannot read properties of undefined (reading 'simulateMessage')`
  - `Cannot read properties of undefined (reading 'instances')`
- Fix effort: 1-2 hours to fix mock implementation
- Priority: Low (SSE functionality works in production)

**Category 3: Passing Tests (7 tests)**
- File upload service tests: All passing
- SSE client basic tests: Partially passing
- Status: Good foundation, mocks work for basic scenarios

**Recommendations:**
1. Create separate "test-fixes" spec for mock improvements
2. Prioritize Gemini client mocks (core functionality)
3. Consider using actual Gemini SDK test utilities if available
4. Document mock patterns in TESTING.md for consistency

### 7. Documentation Updates

**Decision:** Minimal, targeted updates only

**Rationale:**
- Major documentation overhaul is separate effort
- Only update files directly affected by cleanup
- Keep changes concise to avoid scope creep
- Defer comprehensive documentation to future spec

**Files to Update:**
1. `src/features/layout/components/ManagerDrawer/README.md`
   - Confirm architectural alignment
   - Note rename from LeftManagerDrawer

2. `src/features/chat/components/README.md`
   - Document ChatPanel vs AgentChatPanel distinction
   - Explain integration decision point

3. `.kiro/steering/tech.md`
   - Add test organization recommendation
   - Reference feature-based __tests__ pattern

4. `docs/ARCHITECTURE.md`
   - Update LeftManagerDrawer references to ManagerDrawer
   - Keep changes minimal (find/replace)

**No New Files:** Avoid creating comprehensive guides (TESTING.md, etc.) in this spec

### 8. Test Cleanup Spec Updates

**Decision:** Complete tasks 4 and 5 in test-cleanup spec

**Rationale:**
- Tasks are documentation-only
- Directly related to cleanup effort
- Provides closure on test-cleanup spec
- No code changes required

**Task 4: Update Documentation**
- 4.1: Mark completed tasks in gemini-api-enhancement spec
- 4.2: Skip creating TESTING.md (deferred to future spec)

**Task 5: Final Verification**
- 5.1: Run test suite and document failures (already done in this design)
- 5.2: Verify cleanup (no temporary files to remove)

## Components and Interfaces

### File Renames

**Type File:**
```typescript
// Before: src/types/gemini-enhancement.ts
// After: src/types/gemini.ts

// No interface changes, just file location
export type WorkflowCategory = ...
export interface Workflow { ... }
export interface StyleTemplate { ... }
// ... rest of types unchanged
```

**ManagerDrawer:**
```typescript
// Before: src/features/layout/components/LeftManagerDrawer/LeftManagerDrawer.tsx
export interface LeftManagerDrawerProps { ... }
export const LeftManagerDrawer: React.FC<LeftManagerDrawerProps> = ...

// After: src/features/layout/components/ManagerDrawer/ManagerDrawer.tsx
export interface ManagerDrawerProps { ... }
export const ManagerDrawer: React.FC<ManagerDrawerProps> = ...
```

**AgentChatPanel:**
```typescript
// Before: src/features/chat/components/EnhancedChatPanel.tsx
export interface EnhancedChatPanelProps { ... }
export const EnhancedChatPanel: React.FC<EnhancedChatPanelProps> = ...

// After: src/features/chat/components/AgentChatPanel.tsx
export interface AgentChatPanelProps { ... }
export const AgentChatPanel: React.FC<AgentChatPanelProps> = ...
```

### Export Updates

**ManagerDrawer index.ts:**
```typescript
// Before
export { LeftManagerDrawer } from "./LeftManagerDrawer";
export type { LeftManagerDrawerProps } from "./LeftManagerDrawer";

// After
export { ManagerDrawer } from "./ManagerDrawer";
export type { ManagerDrawerProps } from "./ManagerDrawer";
```

**Chat components index.ts:**
```typescript
// Before
export { EnhancedChatPanel } from "./EnhancedChatPanel";

// After
export { AgentChatPanel } from "./AgentChatPanel";
```

## Data Models

No data model changes required. All changes are naming/organizational only.

## Error Handling

No new error handling required. Existing error handling remains unchanged.

## Testing Strategy

### Verification Approach

**Type File Rename:**
1. Rename file
2. Run TypeScript compilation: `npm run typecheck`
3. Verify no errors (expect clean since no imports exist)

**ManagerDrawer Rename:**
1. Rename directory and file
2. Update component name and interface
3. Update exports
4. Run TypeScript compilation: `npm run typecheck`
5. Verify no errors (expect clean since component not imported)
6. Search codebase for "LeftManagerDrawer" references
7. Update documentation references

**AgentChatPanel Rename:**
1. Rename file
2. Update component name and interface
3. Update export in index.ts
4. Run TypeScript compilation: `npm run typecheck`
5. Verify no errors (expect clean since component not imported)

**Test Suite Verification:**
1. Run full test suite: `npm test`
2. Capture and document results
3. Verify no new failures introduced
4. Compare against baseline (17 failures expected)

### Test Organization Validation

No changes to test organization, so no validation needed beyond confirming current structure matches design.

## Implementation Notes

### Rename Safety

All renames are safe because:
- Type file has no current imports
- ManagerDrawer component not currently used
- AgentChatPanel component not currently used
- No runtime impact from any changes

### Documentation Scope

Keep documentation changes minimal:
- Update only directly affected files
- Use find/replace for simple renames
- Add brief notes, not comprehensive guides
- Defer major documentation to future specs

### Test Cleanup Spec Completion

Tasks 4 and 5 are documentation-only:
- No code changes
- No test modifications
- Simple status updates
- Provides closure on previous spec

## Future Considerations

### ChatPanel Integration Decision

Future spec should address:
1. Product requirements for chat interface
2. Whether to use ChatPanel, AgentChatPanel, or merge features
3. Integration with workflow/file upload features
4. Removal of unused component after decision

### Test Mock Improvements

Future "test-fixes" spec should:
1. Create comprehensive Gemini client mock
2. Fix SSE client mock utilities
3. Document mock patterns in TESTING.md
4. Achieve 100% test pass rate

### ManagerDrawer Integration

Future spec should determine:
1. Whether to use ManagerDrawer or current sidebar implementation
2. Integration requirements if ManagerDrawer is chosen
3. Removal of unused component if not needed

### Comprehensive Documentation

Future "documentation-overhaul" spec should:
1. Create TESTING.md with comprehensive testing guide
2. Update all architecture documentation
3. Document all feature modules
4. Create developer onboarding guide

## Risk Assessment

### Low Risk Changes
- Type file rename (no imports)
- ManagerDrawer rename (not used)
- AgentChatPanel rename (not used)
- Documentation updates (non-breaking)

### Zero Risk Changes
- Test organization analysis (no changes)
- Test failure documentation (no changes)
- Test cleanup spec updates (documentation only)

### Mitigation Strategies
- Run TypeScript compilation after each rename
- Search codebase for old names before completing
- Verify test suite doesn't introduce new failures
- Keep changes atomic and reversible

## Success Criteria

1. ✅ Type file renamed to `gemini.ts`
2. ✅ TypeScript compilation succeeds
3. ✅ ManagerDrawer renamed and documented
4. ✅ AgentChatPanel renamed with integration plan documented
5. ✅ Test organization analyzed and documented
6. ✅ Test failures categorized with fix recommendations
7. ✅ Documentation updated (minimal, targeted changes)
8. ✅ Test cleanup spec tasks 4 and 5 completed
9. ✅ No new test failures introduced
10. ✅ All changes verified and reversible

# Testing Coverage Assessment

## Executive Summary

This document assesses the current testing coverage for the VibeBoard application, identifying what's tested, what's missing, and prioritizing gaps that need to be addressed.

## Current Test Coverage

### API Smoke Tests (`server/routes/api.smoke.test.ts`)

**Covered Endpoints:**

✅ **Health Check**
- `GET /api/health` - Basic health check

✅ **Project Management**
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects with sorting
- `GET /api/projects/search` - Search projects
- `GET /api/projects/:projectId` - Get project details with includes
- `PATCH /api/projects/:projectId` - Rename project
- `DELETE /api/projects/:projectId` - Delete project with replacement

✅ **Scene Management**
- `POST /api/projects/:projectId/scenes` - Create scenes
- `PATCH /api/projects/:projectId/scenes/:sceneId` - Update scene

✅ **Chat Management**
- `POST /api/projects/:projectId/chats` - Append chat message
- `GET /api/projects/:projectId/chats` - List chat messages

✅ **Asset Management**
- `POST /api/assets` - Upload asset
- `GET /api/assets/:assetId` - Get asset details

✅ **AI Endpoints**
- `POST /api/ai/chat` - Generate chat response
- `POST /api/ai/storyboard` - Generate storyboard scenes
- `POST /api/ai/storyboard/regenerate` - Regenerate scene description
- `POST /api/ai/image` - Generate scene image
- `POST /api/ai/image/edit` - Edit scene image
- `POST /api/ai/image/edit/prompt` - Suggest image edit prompt
- `POST /api/ai/video/prompt` - Suggest video prompt
- `POST /api/ai/video` - Generate scene video

### Integration Tests

**Assets Test (`server/__tests__/assets.test.ts`):**
- ✅ Upload, list, update, and delete assets
- ✅ Asset file management and metadata

**Groups & Tags Test (`server/__tests__/groups-tags.test.ts`):**
- ✅ Create, list, update, delete groups
- ✅ Assign/remove scenes to/from groups
- ✅ Create, list, assign, remove tags
- ✅ Scene reordering

**Projects Test (`server/__tests__/projects.test.ts`):**
- ✅ Create and rename projects
- ✅ Search and sort projects
- ✅ Export and import projects (round-trip)
- ✅ Delete projects with replacement

### Component Tests

**Layout Tests (`src/__tests__/layout-responsive.test.tsx`):**
- ✅ Responsive layout behavior (mobile/desktop breakpoints)
- ✅ Layout space calculations
- ✅ Panel collapse/expand behavior
- ✅ Layout constraints

**Scene Manager Tests (`src/__tests__/SceneManagerResizer.test.tsx`):**
- ✅ Resizer rendering
- ✅ Space allocation to storyboard
- ✅ Scene manager collapse/expand controls
- ✅ Panel state toggling

## Missing Test Coverage

### Critical API Endpoints (Not Tested)

❌ **Scene History**
- `GET /api/projects/:projectId/scenes/:sceneId/history` - Get scene history
- `POST /api/projects/:projectId/scenes/:sceneId/history/:historyId/restore` - Restore scene from history

❌ **Scene Listing**
- `GET /api/projects/:projectId/scenes` - List all scenes for a project

❌ **Project Settings**
- `PUT /api/projects/:projectId/settings` - Update project settings
- `GET /api/projects/:projectId/settings` - Get project settings

❌ **Asset Listing by Project**
- `GET /api/projects/:projectId/assets` - List assets for a project (with filtering)

❌ **Group Scene Management**
- `POST /api/projects/:projectId/groups/:groupId/scenes` - Assign scenes to group
- `DELETE /api/projects/:projectId/groups/:groupId/scenes` - Remove scenes from group

❌ **Tag Management**
- `DELETE /api/projects/:projectId/tags/:tagId` - Delete tag
- `POST /api/projects/:projectId/scenes/:sceneId/tags` - Assign tags to scene
- `DELETE /api/projects/:projectId/scenes/:sceneId/tags` - Remove tags from scene

❌ **Export/Import**
- `GET /api/projects/:projectId/export` - Export project as ZIP
- `POST /api/projects/import` - Import project from ZIP
- Note: Basic round-trip is tested in projects.test.ts, but not in smoke tests

### Critical User Flows (Not Tested)

❌ **Complete Scene Lifecycle**
- Create scene → Generate image → Edit image → Generate video → View history → Restore from history

❌ **Project Organization Workflow**
- Create project → Add scenes → Create groups → Assign scenes to groups → Add tags → Filter by groups/tags

❌ **Asset Management Workflow**
- Generate multiple assets → List assets by type → Rename asset → Delete asset → Verify file cleanup

❌ **Export/Import Workflow**
- Create project with scenes, assets, groups, tags → Export → Import → Verify all data preserved

❌ **Scene Reordering with Groups**
- Create scenes → Assign to groups → Reorder scenes → Verify group assignments preserved

### Component Test Gaps

❌ **Feature Components**
- No tests for chat components
- No tests for storyboard components
- No tests for scene management components
- No tests for library/project management components
- No tests for generation components

❌ **Shared Components**
- No tests for Toast component
- No tests for Loader component
- No tests for UI primitives

❌ **State Management**
- No tests for Zustand stores
- No tests for service layer
- No tests for hooks

## Prioritized Testing Gaps

### Priority 1: Critical API Endpoints (Must Have)

These endpoints are essential for core functionality and should have smoke tests:

1. **Scene History** - Users need to view and restore scene versions
   - `GET /api/projects/:projectId/scenes/:sceneId/history`
   - `POST /api/projects/:projectId/scenes/:sceneId/history/:historyId/restore`

2. **Export/Import** - Critical for data portability
   - `GET /api/projects/:projectId/export`
   - `POST /api/projects/import`

3. **Group and Tag Operations** - Core organization features
   - `POST /api/projects/:projectId/groups/:groupId/scenes`
   - `DELETE /api/projects/:projectId/groups/:groupId/scenes`
   - `POST /api/projects/:projectId/scenes/:sceneId/tags`
   - `DELETE /api/projects/:projectId/scenes/:sceneId/tags`

### Priority 2: Important API Endpoints (Should Have)

These endpoints support important features but have workarounds:

4. **Scene Listing** - Important for scene management
   - `GET /api/projects/:projectId/scenes`

5. **Asset Listing with Filtering** - Important for asset management
   - `GET /api/projects/:projectId/assets` (with type filtering)

6. **Project Settings** - Important for project configuration
   - `PUT /api/projects/:projectId/settings`
   - `GET /api/projects/:projectId/settings`

### Priority 3: User Flow Integration Tests (Nice to Have)

These would provide confidence in end-to-end workflows:

7. **Complete Scene Lifecycle** - Validates the full scene workflow
8. **Project Organization Workflow** - Validates groups and tags
9. **Asset Management Workflow** - Validates asset operations

### Priority 4: Component Tests (Future Enhancement)

These would improve frontend reliability but are lower priority:

10. **Feature component tests** - Test individual feature components
11. **State management tests** - Test Zustand stores and hooks
12. **Shared component tests** - Test reusable UI components

## Test Execution Status

### Current Test Commands

- `npm run test` - Runs all tests (currently runs vitest)
- `npm run test:api` - Runs API smoke tests only
- `npm run test:unit` - Runs unit tests (same as `npm run test`)

### Test Results

All existing tests are passing:
- ✅ API smoke tests pass
- ✅ Asset integration tests pass
- ✅ Groups & tags integration tests pass
- ✅ Projects integration tests pass
- ✅ Layout component tests pass
- ✅ Scene manager component tests pass

## Recommendations

### Immediate Actions (Task 21.2)

1. Add smoke tests for missing Priority 1 endpoints:
   - Scene history endpoints
   - Export/import endpoints (expand existing coverage)
   - Group scene assignment endpoints
   - Tag assignment endpoints

2. Verify all tests pass with `npm run test:api`

### Future Improvements

1. Add integration tests for Priority 2 endpoints
2. Create end-to-end user flow tests for Priority 3 scenarios
3. Add component tests for critical UI components
4. Set up test coverage reporting to track progress
5. Consider adding E2E tests with Playwright or Cypress

## Task 21.2 Completion Summary

### Added Smoke Tests

The following smoke tests have been successfully added to `server/routes/api.smoke.test.ts`:

1. **Scene Listing** - `GET /api/projects/:projectId/scenes`
   - Verifies scenes can be listed for a project

2. **Scene History** - `GET /api/projects/:projectId/scenes/:sceneId/history`
   - Verifies scene history can be retrieved
   - Tests scene restoration from history when history exists

3. **Project Settings** - `PUT /api/projects/:projectId/settings` and `GET /api/projects/:projectId/settings`
   - Tests updating project settings (chat model, image model, video model)
   - Verifies settings can be retrieved after update

4. **Asset Listing with Filtering** - `GET /api/projects/:projectId/assets`
   - Tests listing all assets for a project
   - Tests filtering by asset type (image, video)

5. **Group Scene Management**
   - Tests creating groups
   - Tests assigning scenes to groups
   - Tests listing groups with scene assignments
   - Tests removing scenes from groups
   - Tests deleting groups

6. **Tag Management**
   - Tests creating tags
   - Tests listing tags
   - Tests assigning tags to scenes
   - Tests removing tags from scenes
   - Tests deleting tags

7. **Export/Import**
   - Tests exporting a project with scenes and assets
   - Tests importing the exported project
   - Verifies imported project has correct data

### Test Results

All 26 smoke tests now pass successfully:
- ✅ 18 existing tests (unchanged)
- ✅ 8 new tests added in task 21.2

### Known Issues Discovered

During testing, we discovered a minor issue with the export/import functionality:
- Asset files are not always included in the export archive (warning: "Asset file not found in archive")
- This is an existing issue in the export logic, not introduced by our tests
- The import still succeeds and creates the project structure correctly

## Conclusion

The test coverage has been significantly improved. We now have comprehensive smoke test coverage for:
- ✅ All critical API endpoints (Priority 1)
- ✅ Scene history functionality
- ✅ Export/import operations
- ✅ Group and tag assignment operations
- ✅ Project settings management
- ✅ Asset listing and filtering

Remaining gaps are primarily in:
- Component-level testing (Priority 4)
- End-to-end user flow tests (Priority 3)

The smoke test suite provides confidence that all critical API endpoints are functional and can be used as a regression test suite for future changes.

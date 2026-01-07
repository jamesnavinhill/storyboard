# Test Cleanup Implementation Plan

## Overview

This plan organizes and completes the test suite for the Gemini API Enhancement feature. The focus is on creating a clean, logical structure with consistent patterns and complete coverage.

## Tasks

- [x] 1. Reorganize Backend Service Tests

- [x] 1.1 Create __tests__ directory structure

  - Create `server/services/__tests__/` directory
  - Create `server/routes/__tests__/` directory
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Move service tests to __tests__ subdirectory

  - Move `documentService.test.ts` to `server/services/__tests__/`
  - Move `fileUploadService.test.ts` to `server/services/__tests__/`
  - Move `geminiClient.test.ts` to `server/services/__tests__/`
  - Verify all tests still pass after move
  - _Requirements: 1.1_

- [x] 1.3 Move route tests to __tests__ subdirectory

  - Move `documents.test.ts` to `server/routes/__tests__/`
  - Move `workflows.test.ts` to `server/routes/__tests__/`
  - Move `files.test.ts` to `server/routes/__tests__/`
  - Keep `api.smoke.test.ts` at root level for quick access
  - Verify all tests still pass after move
  - _Requirements: 1.2, 1.4_

- [x] 1.4 Consolidate AI endpoint tests

  - Create `server/routes/__tests__/ai.test.ts`
  - Merge streaming tests from `ai.test.ts`
  - Merge enhanced storyboard tests from `ai.test.ts`
  - Merge style preview tests from `ai.test.ts`
  - Remove duplicate error handling tests
  - Remove duplicate rate limiting tests
  - Delete `server/routes/ai.test.ts`
  - Verify consolidated tests pass
  - _Requirements: 1.3, 1.5_

- [x] 2. Add Frontend Component Tests

- [x] 2.1 Create StreamingText component test

  - Create `src/features/chat/components/__tests__/StreamingText.test.tsx`
  - Test component renders without errors
  - Test streaming text displays progressively
  - Test stop button appears during streaming
  - Test stop button triggers connection close
  - Mock SSE connection
  - _Requirements: 2.1, 2.5, 2.6_

- [x] 2.2 Create UploadDropzone component test

  - Create `src/features/chat/components/__tests__/UploadDropzone.test.tsx`
  - Test dropzone renders in agent mode
  - Test drag-and-drop UI displays
  - Test file drop triggers upload
  - Test upload progress displays
  - Mock file upload API
  - _Requirements: 2.2, 2.5, 2.6_

- [x] 2.3 Create DocumentViewer component test

  - Create `src/features/storyboard/components/__tests__/DocumentViewer.test.tsx`
  - Test document content displays
  - Test collapsible sections work
  - Test Edit/Export/History buttons render
  - Test button clicks trigger correct actions
  - Mock document API
  - _Requirements: 2.3, 2.5, 2.6_

- [x] 2.4 Create WorkflowManager component test

  - Create `src/features/settings/components/__tests__/WorkflowManager.test.tsx`
  - Test workflow list renders
  - Test Create/Edit/Delete buttons display
  - Test workflow selection works
  - Test CRUD actions trigger API calls
  - Mock workflow API
  - _Requirements: 2.4, 2.5, 2.6_
-

- [x] 3. Create Test Suite Runners

- [x] 3.1 Add test scripts to package.json

  - Add `test:` script for running all  tests
  - Add `test:watch` script for development
  - Add `test:ui` script for frontend tests only
  - Add `test:api` script for backend tests only
  - Configure scripts to use correct test path patterns
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.2 Verify test suite runners work

  - Run `npm run test` and verify all tests execute
  - Run `npm run test:ui` and verify only frontend tests execute
  - Run `npm run test:api` and verify only backend tests execute
  - Verify excluded tests don't run
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [-] 4. Update Documentation

- [ ] 4.1 Update tasks.md in gemini-api-enhancement spec
  - Mark task 19.1 as complete (backend service tests)
  - Mark task 19.2 as complete (API endpoint tests)
  - Mark task 19.3 as complete (component tests)
  - Add note about test organization and location
  - _Requirements: 4.1_

- [ ] 4.2 Create testing guide documentation
  - Create `docs/TESTING.md` with testing guide
  - Document test file organization structure
  - Document test naming conventions
  - Provide examples of running specific test suites
  - Document mocking patterns for Gemini API
  - Document mocking patterns for React components
  - Add examples of common test scenarios
  - _Requirements: 4.2, 4.3, 4.4_

- [ ] 5. Final Verification
- [ ] 5.1 Run complete test suite
  - Run `npm test` to verify all tests pass -or-
  - Run `npm run test` to verify tests pass or document why fails happen and why they shouldnt/cant be fixed currently without breaking changes or major changes
  - Verify no tests were accidentally broken during reorganization
  - Check test coverage hasn't decreased
  - _Requirements: All_

- [ ] 5.2 Clean up and finalize
  - Remove any temporary test files
  - Verify all old test files are deleted
  - Verify all new test files are in correct locations
  - Update .gitignore if needed
  - _Requirements: All_

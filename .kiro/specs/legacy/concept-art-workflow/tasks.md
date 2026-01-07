# Implementation Plan

- [x] 1. Update type definitions and validation schemas

  - Update AspectRatio type in server/types.ts to include "1:1"
  - Update workflowCategorySchema in server/validation.ts to include "concept-art"
  - Update all aspect ratio Zod schemas in server/validation.ts to include "1:1" (createScenesSchema, updateSceneSchema, aiGenerateImageSchema, aiGenerateVideoSchema)
  - _Requirements: 1.3, 1.4, 3.1, 3.3, 3.5, 5.1, 5.2, 5.3, 5.4_

- [x] 2. Create database migration for concept art workflow seed data

  - Create new migration file server/migrations/012_seed_concept_art_workflow.sql
  - Write SQL INSERT statement for concept art workflow with appropriate system instructions, art style, examples, and metadata
  - Write SQL INSERT statement for album art subtype with instruction modifier
  - Ensure workflow ID and subtype ID follow existing naming conventions (workflow_concept_art, subtype_concept_album_art)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Update TypeScript type in workflow store

  - Update the Workflow interface category property type in server/stores/workflowStore.ts to include "concept-art"
  - Verify type consistency across the store implementation
  - _Requirements: 1.1, 1.4_
- [x] 4. Run and verify database migration

- [x] 4. Run and verify database migration

  - Execute the new migration using npm run migrate
  - Verify concept art workflow is created in the database
  - Verify album art subtype is created and linked to concept art workflow
  - Test querying workflows with category filter for "concept-art"
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
- [x] 5. Update frontend type definitions

- [x] 5. Update frontend type definitions

  - Update AspectRatio type in src/types.ts (or relevant feature type file) to include "1:1"
  - Update workflow category types to include "concept-art"
  - Ensure type consistency across frontend codebase
  - _Requirements: 3.1, 5.1, 5.2_

- [x] 6. Update frontend UI components for aspect ratio selection

  - Locate aspect ratio selector component (likely in src/features/scene or src/features/settings)
  - Add "1:1" option to aspect ratio dropdown/radio buttons
  - Update component to handle 1:1 selection and display
  - Ensure 1:1 option is visually represented correctly (e.g., "1:1 (Square)" label)
  - _Requirements: 3.2_

- [x] 7. Update frontend UI components for workflow selection

  - Locate workflow selector component (likely in src/features/settings or src/features/project)
  - Ensure concept art workflow appears in workflow selection interface
  - Verify workflow filtering and display works with new category
  - Test workflow selection updates project settings correctly
  - _Requirements: 1.1, 1.2_

- [x] 8. Update frontend state management

  - Review Zustand stores that handle aspect ratio or workflow data
  - Update any validation or filtering logic to include "1:1" and "concept-art"
  - Ensure state updates propagate correctly to UI components
  - _Requirements: 3.3, 1.4_
- [x] 9. Write backend validation tests

- [x] 9. Write backend validation tests

  - Create or extend server/validation.test.ts
  - Write tests for workflowCategorySchema accepting "concept-art"
  - Write tests for workflowCategorySchema rejecting invalid categories
  - Write tests for aspect ratio schemas accepting "1:1"
  - Write tests for aspect ratio schemas rejecting invalid ratios
  - Test createScenesSchema, updateSceneSchema, aiGenerateImageSchema, aiGenerateVideoSchema with 1:1
  - _Requirements: 3.5, 5.4_
-

- [x] 10. Write backend API integration tests



  - Extend server/routes/workflows.test.ts
  - Test POST /api/workflows with category="concept-art"
  - Test GET /api/workflows?category=concept-art returns correct results
  - Test POST /api/workflows/:id/subtypes for concept art workflow
  - Test validation errors for invalid categories
  - Extend scene-related tests to cover aspectRatio="1:1"
  - Test AI generation endpoints with 1:1 aspect ratio
  - _Requirements: 1.1, 1.3, 2.1, 3.3, 3.4_

- [x] 11. Write frontend component tests



  - Test aspect ratio selector component renders 1:1 option
  - Test aspect ratio selector handles 1:1 selection correctly
  - Test workflow selector displays concept art workflow
  - Test workflow selector handles concept art selection
  - Test state updates when 1:1 or concept-art is selected
  - _Requirements: 1.1, 3.2_
- [x] 12. Manual end-to-end testing


- [ ] 12. Manual end-to-end testing
  - Create new project and select concept art workflow
  - Create scene with 1:1 aspect ratio
  - Select album art subtype
  - Generate image with concept art workflow and 1:1 aspect ratio
  - Verify AI receives correct system instructions and aspect ratio
  - Verify generated image displays correctly
  - Test updating existing scene to 1:1 aspect ratio
  - Test filtering workflows by concept-art category
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

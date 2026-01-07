# Implementation Plan

- [x] 1. Add automatic chat mode switching based on workflow selection





  - Add useEffect hook in ChatPanel that watches selectedWorkflowId
  - When selectedWorkflowId changes to a non-null value, set chatMode to "agent"
  - When selectedWorkflowId changes to null, set chatMode to "simple"
  - _Requirements: 1.1, 1.4, 2.1_
-

- [x] 2. Conditionally render UploadDropzone in agent mode




  - Add conditional rendering logic to show UploadDropzone when chatMode === "agent"
  - Position UploadDropzone after chat mode dropdowns and before file thumbnails
  - Ensure UploadDropzone receives correct props (projectId, onFilesUploaded, onError)
  - _Requirements: 1.2, 3.1_

- [x] 3. Verify placeholder text updates with workflow selection





  - Test that existing getPlaceholder function works correctly with workflow selection
  - Ensure placeholder shows "Select a workflow to get started..." when no workflow selected
  - Ensure placeholder shows workflow-specific text when workflow is selected
  - _Requirements: 1.3, 3.2_
-

- [x] 4. Test workflow selection flow




  - Manually test selecting a workflow activates agent mode
  - Manually test upload zone appears when agent mode is active
  - Manually test deselecting workflow returns to simple mode
  - Manually test file uploads work in agent mode
  - Manually test mobile view preserves workflow selection
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.2, 3.1, 3.2, 3.3_

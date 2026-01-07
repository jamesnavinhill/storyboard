# Implementation Plan

- [x] 1. Fix DocumentExport modal structure


  - Remove the extra `<div className="modal-content fixed inset-0 flex items-center justify-center pointer-events-none">` wrapper
  - Apply the modal-content and modal-centered classes directly to the inner div
  - Add `hide-scrollbar` class to the modal-body div
  - Ensure backdrop click handler works correctly
  - _Requirements: 1.1, 1.5_



- [ ] 2. Fix DocumentHistory modal structure
  - Remove the extra `<div className="modal-content fixed inset-0 flex items-center justify-center pointer-events-none">` wrapper
  - Apply the modal-content and modal-centered classes directly to the inner div
  - Add `hide-scrollbar` class to the modal-body div that contains the scrollable history list
  - Ensure backdrop click handler works correctly



  - _Requirements: 1.2, 1.5_

- [ ] 3. Verify modal consistency
  - Open all five modals (Edit, Animate, Extend, DocumentExport, DocumentHistory) in the browser
  - Verify DocumentExport and DocumentHistory now match the visual style of Edit/Animate/Extend
  - Verify scrollbars are hidden on all scrollable modal content
  - Test backdrop click-to-close functionality on all modals
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

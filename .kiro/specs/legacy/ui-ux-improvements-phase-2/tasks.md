# Implementation Plan

- [x] 1. Create shared utilities and styling infrastructure

  - Create centralized z-index scale in `src/styles/z-index.css` with variables for base, card, dropdown, modal, toast, and tooltip layers
  - Add `.hide-scrollbar` utility class to `src/styles/utilities.css` with cross-browser support (Firefox scrollbar-width, Chrome/Safari -webkit-scrollbar)
  - Create `useResponsiveIcons` hook in `src/hooks/useResponsiveIcons.ts` that returns boolean based on viewport width breakpoint
  - Import z-index.css in main index.css file
  - _Requirements: 3.1, 9.1, 9.2, 9.3, 9.4, 11.1, 11.2_
- [x] 2. Fix storyboard layout responsiveness

- [x] 2. Fix storyboard layout responsiveness

  - Update `StoryboardPanel.tsx` grid CSS to use explicit minimum card widths (320px desktop, 280px tablet, 100% mobile)
  - Add responsive breakpoints with max-column constraints (1 column mobile <640px, 2 columns tablet 640-1023px, 2-4 columns desktop ≥1024px)
  - Add CSS media queries to prevent cards from becoming too small on desktop
  - Test grid behavior when resizing panels and verify drag-and-drop functionality remains intact
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1] 3. Implement video playback controls autohide

  - Update `SceneCard.tsx` to conditionally show/hide video controls based on hover state and overlay visibility
  - Create `shouldShowVideoControls` function that returns false when menuOpen, panelsOpen, or showDetails is true
  - Add `details-open` CSS class to scene-card when showDetails is true
  - Conditionally add `controls` attribute to video element based on shouldShowVideoControls result
  - Ensure top row controls (drag, details toggle, context menu) remain unaffected
  - Test video controls appear on hover and hide when context menu, details, edit, or animate panels are open
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Fix context menu z-index and positioning

  - Update context menu in `SceneCard.tsx` to use fixed positioning instead of absolute
  - Apply z-index variable (--z-dropdown) to context menu
  - Implement `calculateMenuPosition` function with viewport boundary detection for vertical and horizontal positioning
  - Add "Manage" menu item icon to match other menu items (use Settings or Edit icon)
  - Test context menu positioning near viewport edges and verify it stays visible during Edit/Animate panel transitions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
- [x] 5. Implement chat mode consistency

- [x] 5. Implement chat mode consistency

  - Create `CHAT_MODE_CONFIGS` object in `ChatPanel.tsx` with configurations for 'simple' and 'agent' modes
  - Update `ChatPanel.tsx` to conditionally render workflow selector, agent features based on selected mode
  - Ensure Simple Chat mode disables agent workflow execution and shows appropriate placeholder text
  - Add mode persistence to localStorage or user settings
  - Test mode switching and verify UI elements appear/disappear correctly
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
- [x] 6. Fix file upload purpose selection JSON error

- [x] 6. Fix file upload purpose selection JSON error

  - Update `FilePurposeSelector.tsx` to store simple string IDs in select values instead of serialized JSON
  - Create `FILE_PURPOSES` array with id, label, description, and icon for each purpose type
  - Update `handlePurposeChange` to find purpose by ID and pass ID to parent component
  - Remove any JSON.parse calls from purpose selection logic
  - Test all file purpose types (style-reference, character-reference, audio-reference, text-document, general-reference)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Fix modal background opacity





  - Add `.modal-backdrop` CSS class with fixed positioning, rgba background, and backdrop-filter blur
  - Apply z-index variable (--z-modal-backdrop) to backdrop and (--z-modal) to modal content
  - Update `DocumentExport.tsx` to use modal-backdrop class
  - Update `DocumentHistory.tsx` to use modal-backdrop class
  - Add fadeIn animation for smooth backdrop appearance
  - Test modal backdrops prevent content bleed-through and interaction with underlying elements
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Stabilize upload zone position in chat panel



  - Restructure `ChatPanel.tsx` layout with separate containers for attached-files-area, upload-zone-fixed, and message-input-area
  - Use flexbox with explicit order properties to keep upload zone in fixed position
  - Add CSS for attached-files-area that collapses when empty and scrolls when full
  - Ensure attached file thumbnails appear above upload zone without shifting it
  - Test file attachment and removal for la
yout stability

  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Implement error notification auto-dismiss






  - Update toast notification system to accept duration parameter in ToastOptions
  - Create `DEFAULT_DURATIONS` object with 2000ms for error variant
  - Modify `showToast` function to automatically call removeToast after specified duration
  - Test error toasts auto-dismiss after 2 seconds while allowing manual dismissal

  - Test error toasts auto-dismiss after 2 seconds while allowing manual dismissal
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Apply universal scrollbar styling
  - Add `.hide-scrollbar` class to `SettingsPanel.tsx` scrollable container
  - Add `.hide-scrollbar` class to `SceneManageDrawer.tsx` description textarea
  - Add `.hide-scrollbar` class to `AgentDropdown.tsx` workflow menu list
  - Add `.hide-scrollbar` class to `StylePresetPicker.tsx` template list
  - Add `.hide-scrollbar` class to `DocumentEditor.tsx` text input area
  - Add `.hide-scrollbar` class to `SceneEditPanel.tsx` scrollable sections
  - Add `.hide-scrollbar` class to `SceneAnimatePanel.tsx` scrollable sections
  - Add `.hide-scrollbar` class to `EnhancedSettingsSheet.tsx` main content area
  - Add `.hide-scrollbar` class to `WorkflowEditor.tsx` form scrollable area
  - Add `.hide-scrollbar` class to `TemplateEditor.tsx` form scrollable area
  - Add `.hide-scrollbar` class to `DocumentHistory.tsx` content scrollable area
  - Test scrollbar hiding works consistently across Chrome, Firefox, Safari, and Edge
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 11. Integrate style presets with template management


  - Update `StylePresetsMenu.tsx` to render as full-panel overlay covering entire chat panel (not dropdown)
  - Use absolute positioning with `inset-0` to cover chat panel completely
  - Match `SettingsPanel` styling exactly: header with title and close button, scrollable content area, footer section
  - Add `isStylePresetsOpen` state in `ChatPanel.tsx` to control overlay visibility
  - Update style presets button in chat panel bottom row to open overlay: `onClick={() => setIsStylePresetsOpen(true)}`
  - Fetch and display available templates in scrollable list with selection state
  - Add "Manage Templates" button in footer that calls `onManageTemplates` handler
  - Add `.hide-scrollbar` to template list scrollable area
  - Test style preset panel opens covering entire chat panel, template selection works, and manage button navigates correctly
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
- [x] 12. Make chat panel bottom row icon-only

- [x] 12. Make chat panel bottom row icon-only

  - Remove `useResponsiveIcons` hook usage from `ChatPanel.tsx` bottom row buttons
  - Remove all conditional text label rendering from bottom row buttons (Attach, Style Templates, Settings, Voice, Send)
  - Ensure all bottom row buttons show ONLY icons at all viewport sizes
  - Add `title` attribute to all bottom row buttons for tooltips (e.g., "Attach image", "Style templates", "Session settings", "Voice input coming soon", "Send (Ctrl/Cmd+Enter)")
  - Ensure buttons maintain minimum 44px touch target size with proper padding
  - Test all bottom row buttons display only icons with tooltips on hover at all viewport sizes
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 13. Fix group and tag creation feedback
  - Update `handleCreateGroup` in `GroupsTagsInlineManagers.tsx` with optimistic UI update
  - Add success toast notification when group is created
  - Update `handleCreateTag` with optimistic UI update and success toast

  - Add error handling with error toast for failed creation attempts
  - Implement server refresh after optimistic update to ensure consistency
  - Test group and tag creation shows immediate feedback and appears in selection dropdowns
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
- [ ] 14. Fix scene prompt regeneration

- [] 14. Fix scene prompt regeneration

  - Add 'regenerating-prompt' activity type to SceneUIState type definition
  - Implement `handleRerunPrompt` function in scene actions with loading state management
  - Create API endpoint POST `/api/scenes/:sceneId/regenerate` in `server/routes/ai.ts`
  - Implement Gemini service call to regenerate scene description with original parameters
  - Update scene with regenerated content and show success/error toast
  - Test "Rerun Prompt" context menu action successfully regenerates scenes
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 15. Fix document view button styling consistency





  - Update Edit, Export, and History buttons to use `btn-base` and `btn-ghost` classes
  - Ensure buttons use consistent flex layout with gap for icon and text alignment
  - Apply consistent hover states matching application design system
  - Verify icon sizing is consistent (w-4 h-4) across all three buttons
  - Test button styling matches other action buttons throughout the application
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 16. Fix document modal styling consistency



  - Update `DocumentExport.tsx` to use standard modal structure (modal-backdrop, modal-content, modal-header, modal-body, modal-footer)
  - Update `DocumentHistory.tsx` to use standard modal structure
  - Apply consistent form styling (form-label, form-input, form-checkbox, form-help-text) in DocumentExport
  - Apply consistent history item styling (history-item, history-item-header, history-version, history-timestamp) in DocumentHistory
  - Ensure modal buttons use `btn-base` with appropriate variants (btn-primary, btn-ghost)
  - Add modal CSS classes if not already present in global styles
  - Test both modals have consistent backdrop opacity, border radius, shadows, and spacing
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
-

- [x] 17. Simplify manager panel tab labels



  - Update manager panel tabs array to change "Groups & Tags" label to "Tags"
  - Verify tab functionality remains unchanged (still manages both groups and tags)
  - Ensure tab styling (manager-tab, manager-tab.active) is consistent
  - Test tab switching works correctly with updated label
  - Verify active tab indicator displays properly
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
- [x] 18. Fix manager panel section styling




- [ ] 18. Fix manager panel section styling

  - Update Details section to use consistent form styling (form-group, form-label, form-textarea, form-select)
  - Update Tags section to use consistent input-group layout for group/tag creation
  - Apply tag-list and tag-item styling for displaying groups and tags
  - Update History section to use history-list and history-entry styling
  - Add `.hide-scrollbar` to textarea in Details section
  - Ensure all sections use consistent padding, spacing, and visual separation
  - Add manager-section-header and manager-section-title styling for section headers
  - Test all three sections (Details, Tags, History) have consistent, polished appearance
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

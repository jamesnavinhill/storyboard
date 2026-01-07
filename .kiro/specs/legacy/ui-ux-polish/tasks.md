# Implementation Plan

- [x] 1. Sidebar Project and Asset Reorganization




  - Create ProjectCollapsible component with expand/collapse functionality
  - Modify LibraryPanel to show collapsible projects in sidebar variant
  - Update ProjectsTab to support collapsible mode with inline assets
  - Adjust spacing and dividers (theme toggle, divider, settings button at bottom)
  - Add "New Project" button under header
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 1.1 Create ProjectCollapsible component


  - Implement collapsible project item with expand/collapse icon
  - Add asset count badge display
  - Render asset list with thumbnails when expanded
  - Use localStorage to persist expand/collapse state per project
  - _Requirements: 1.2, 1.3_

- [x] 1.2 Modify LibraryPanel for sidebar collapsible mode


  - Remove tab switching for sidebar variant
  - Always show projects view in sidebar
  - Add "New Project" button at top of content area
  - Add flexible spacer (margin-top: auto) before bottom section
  - _Requirements: 1.1, 1.4_

- [x] 1.3 Update sidebar bottom section layout


  - Reorder to: [Spacer] → [Theme toggle] → [Divider] → [Settings button]
  - Remove extra divider between projects and settings
  - Increase padding/spacing for breathing room
  - _Requirements: 1.4, 1.5, 1.6_
-

- [x] 2. Chat Panel Layout and Upload Zone Improvements




  - Add auto-switch logic when chat mode is selected
  - Hide upload zone in chat view
  - Modify UploadDropzone for compact horizontal layout
  - Ensure "Manage Workflows" button opens global settings
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2.1 Add auto-switch to chat view on mode selection


  - Add useEffect in ChatPanel to watch chatMode state
  - Automatically switch to chat view when mode changes
  - Hide upload zone when in chat view
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Create compact UploadDropzone layout


  - Change from vertical to horizontal layout (icon + text side-by-side)
  - Remove visible subtext
  - Add tooltip with file type information
  - Reduce padding and overall height
  - _Requirements: 2.3, 2.4_

- [x] 2.3 Verify "Manage Workflows" button behavior


  - Confirm button exists in ChatModeDropdown
  - Ensure it opens global settings sheet (not session settings)
  - Verify workflow tab is active when opened
  - _Requirements: 2.5, 2.6_


- [x] 3. Main Panel Navigation and Modal Styling




  - Align navigation elements (left: nav icons, right: subtabs/filters)
  - Add layout toggle icon in top-right
  - Fix DocumentExport modal to use solid background
  - Fix DocumentHistory modal to use solid background
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3.1 Restructure StoryboardPanel navigation


  - Wrap navigation in flex container with space-between
  - Left section: Navigation icons (storyboard, gallery, documents)
  - Right section: Subtabs, filters, layout toggle
  - _Requirements: 3.1, 3.2_

- [x] 3.2 Create LayoutToggle component


  - Implement icon button for grid/list view toggle
  - Position in top-right navigation area
  - Wire up to existing view mode state
  - _Requirements: 3.3_

- [x] 3.3 Fix DocumentExport modal styling


  - Remove translucent background
  - Use solid background from theme variables (--modal-bg, --surface-bg)
  - Ensure proper contrast and readability
  - Test in both light and dark themes
  - _Requirements: 3.4, 3.6_

- [x] 3.4 Fix DocumentHistory modal styling


  - Remove translucent background
  - Use solid background from theme variables (--modal-bg, --surface-bg)
  - Ensure proper contrast and readability
  - Test in both light and dark themes
  - _Requirements: 3.5, 3.7_

- [x] 4. Manager Panel Simplification






  - Rename LeftManagerDrawer to ManagerDrawer
  - Integrate inline group and tag management
  - Update legacy styling to match design system
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 4.1 Rename LeftManagerDrawer to ManagerDrawer


  - Rename directory from LeftManagerDrawer to ManagerDrawer
  - Rename component file and interface
  - Update all imports across the codebase
  - Update documentation references
  - _Requirements: 4.1_

- [x] 4.2 Integrate inline group and tag management



  - Add GroupsInlineManager to Groups & Tags tab
  - Add TagsInlineManager to Groups & Tags tab
  - Remove modal triggers for group/tag management
  - Ensure inline managers work within panel context
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 4.3 Update ManagerDrawer styling


  - Replace legacy button classes with current design system
  - Update icon sizes and colors to match app
  - Modernize dropdown styling
  - Add hover states consistent with other panels
  - _Requirements: 4.5, 4.6, 4.7_

- [x] 5. Settings Panel Reorganization





  - Remove duplicate "General" settings from workflow panel
  - Reorganize template badges in grid layout
  - Add missing settings to models and app panels
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5.1 Remove duplicate settings from WorkflowManager


  - Remove "General" settings section from workflow panel
  - Keep only workflow-specific configuration
  - Move general settings to app settings panel
  - _Requirements: 5.1_

- [x] 5.2 Reorganize TemplateLibrary display


  - Implement grid layout for template badges
  - Add spacing between items
  - Improve visual hierarchy
  - Add search/filter if many templates exist
  - _Requirements: 5.2_

- [x] 5.3 Audit and add missing settings to SettingsPanel


  - Add missing model settings (temperature, topP, topK, maxTokens, stopSequences)
  - Add missing app settings (autoSave, defaultAspectRatio, exportFormat)
  - Organize into clear sections with headers
  - Ensure all configuration options are accessible
  - _Requirements: 5.3, 5.4, 5.5_
-

- [x] 6. Light Theme Storyboard Card Fixes




  - Replace hardcoded colors with CSS variables in all card components
  - Add/update CSS variables for light theme
  - Test all cards in both themes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 6.1 Update SceneCard to use theme variables


  - Replace hardcoded background colors with var(--card-bg)
  - Replace hardcoded borders with var(--card-border)
  - Replace hardcoded text colors with var(--text-primary)
  - Test in both light and dark themes
  - _Requirements: 6.1, 6.3, 6.5_

- [x] 6.2 Update SceneCardPreview to use theme variables


  - Replace hardcoded colors with CSS variables
  - Ensure image overlays use theme-aware colors
  - Test in both light and dark themes
  - _Requirements: 6.1, 6.3, 6.5_

- [x] 6.3 Update StackedGroupCard to use theme variables


  - Replace hardcoded background and border colors
  - Use theme variables throughout component
  - Test in both light and dark themes
  - _Requirements: 6.2, 6.4, 6.6_

- [x] 6.4 Add CSS variables for card theming


  - Add --card-bg, --card-border, --card-hover-bg to root
  - Define light theme overrides for these variables
  - Ensure proper contrast ratios in both themes
  - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [x] 6.5 Audit all card components for hardcoded colors


  - Search codebase for hardcoded color values in card components
  - Replace any remaining hardcoded colors with CSS variables
  - Verify all cards work in both themes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

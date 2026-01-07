# Button Styling Fix - Task List

## Overview
Fix inconsistent button styling in Manager Panel (Details, Tags, History tabs) and related dialogs. All buttons should have:
- Rounded corners (no sharp edges)
- Consistent height (36px)
- Proper padding and spacing
- Uniform styling with existing `.btn-base` classes

## Tasks

- [x] 1. Audit and fix Details tab buttons





  - Update "Export Image" button to use `.btn-base .btn-secondary` with proper height/padding
  - Update "Save" button to use `.btn-base .btn-primary` with proper height/padding
  - Ensure aspect ratio select dropdown matches button height (36px)
  - Remove any inline styles causing sharp corners
  - _Requirements: 8.1, 8.2, 8.6, 8.7_

- [ ] 2. Audit and fix Groups/Tags tab buttons and inputs



- [ ] 2. Audit and fix Groups/Tags tab buttons and inputs
  - Update "Create" buttons in Groups section to use `.btn-base .btn-primary`
  - Update "Create" buttons in Tags section to use `.btn-base .btn-primary`
  - Ensure name input fields have min-height: 36px and rounded corners
  - Ensure color selector dropdowns have min-height: 36px and rounded corners
  - Verify all form elements align visually with buttons

  - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7_

- [ ] 3. Audit and fix History tab buttons


  - Update "Restore" buttons to use `.btn-base .btn-secondary`
  - Update "Current" badge to use `.btn-base .btn-primary` (if it's a button)
  - Ensure grid/list view toggle buttons have consistent styling
  - _Requirements: 8.1, 8.2, 8.4, 8.7_


- [ ] 4. Fix GroupsInlineManager and TagsInlineManager components


  - Review and update button classes in GroupsInlineManager component
  - Review and update button classes in TagsInlineManager component
  - Ensure all Create/Delete/Edit buttons use standardized classes
  - Ensure form inputs match button height (36px)
  - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7_
- [ ] 5. Final verification



- [ ] 5. Final verification

  - Test all buttons in Details tab (no sharp corners, consistent height)
  - Test all buttons in Groups/Tags tab (no sharp corners, consistent height)
  - Test all buttons in History tab (no sharp corners, consistent height)
  - Verify form inputs align with buttons (same height)
  - Test hover and active states on all buttons
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

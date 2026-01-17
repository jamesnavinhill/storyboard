# Manual Testing Checklist

Remaining manual testing tasks from the polish audit spec. These are verification steps to be completed before the next major release.

## Accessibility Testing

- [ ] Test keyboard navigation for all interactive elements
- [ ] Test with NVDA or JAWS screen reader
- [ ] Verify all ARIA labels are descriptive and helpful
- [ ] Add skip-to-content link for screen reader users
- [ ] Ensure skip link is visually hidden but accessible
- [ ] Test that skip link works correctly

## Project Management Features

- [ ] Test project creation through LibraryPanel
- [ ] Test project rename functionality
- [ ] Test project delete with confirmation
- [ ] Test project export functionality
- [ ] Test project import functionality

## Asset Management Features

- [ ] Test asset viewing in LibraryPanel Assets tab
- [ ] Test asset search and filtering
- [ ] Test asset management operations (rename, delete, download)
- [ ] Test navigation to scene history from assets

## Scene Management Features

- [ ] Check if DndContext is implemented in StoryboardPanel
- [ ] Test scene reordering by dragging
- [ ] Verify optimistic updates work correctly
- [ ] Test group creation and assignment through UI
- [ ] Test tag creation and assignment through UI
- [ ] Verify badges display correctly in scene cards
- [ ] Test filtering by groups and tags

## Scene History Features

- [ ] Test scene history viewing through scene management interface
- [ ] Test scene restoration from history
- [ ] Verify history entries display correctly with thumbnails

## Full QA Checklist

- [ ] Test all project management operations (create, rename, delete, export, import)
- [ ] Test all scene management operations (reorder, create, history, groups, tags)
- [ ] Test all asset management operations (view, search, rename, delete, download)
- [ ] Test accessibility with keyboard navigation and screen reader
- [ ] Document any issues discovered
- [ ] Fix critical issues before completion

## Notes

These tasks were deferred from the polish phase to focus on core functionality. Complete these before the next production release.

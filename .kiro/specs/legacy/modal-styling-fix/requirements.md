# Requirements Document

## Introduction

This spec addresses styling inconsistencies in the DocumentExport and DocumentHistory modals. These modals currently have an extra background layer and lack scrollbar hiding, making them visually different from the Edit, Animate, and Extend modals.

## Glossary

- **Modal**: A dialog overlay that appears on top of the main application content
- **Backdrop**: The semi-transparent overlay behind a modal that dims the background
- **Modal Content**: The actual dialog box containing the modal's UI elements
- **Hide-scrollbar**: A CSS utility class that hides scrollbars while maintaining scroll functionality

## Requirements

### Requirement 1

**User Story:** As a user, I want all modals to have consistent visual styling so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. WHEN the DocumentExport modal is displayed, THE System SHALL render with a single backdrop layer matching the Edit modal pattern
2. WHEN the DocumentHistory modal is displayed, THE System SHALL render with a single backdrop layer matching the Edit modal pattern
3. WHEN the DocumentExport modal content scrolls, THE System SHALL hide the scrollbar using the hide-scrollbar CSS class
4. WHEN the DocumentHistory modal content scrolls, THE System SHALL hide the scrollbar using the hide-scrollbar CSS class
5. WHEN comparing all modals (Edit, Animate, Extend, DocumentExport, DocumentHistory), THE System SHALL display consistent backdrop styling and modal positioning

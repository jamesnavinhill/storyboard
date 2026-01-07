# Requirements Document

## Introduction

This specification defines the refactoring of the chat interface navigation system to simplify the user experience by consolidating three modes (Generate, Text, Gurus) into two clear modes (Agent, Chat) with improved organization and clearer separation of concerns.

## Glossary

- **Chat Interface**: The main conversational UI component where users interact with AI
- **Agent Mode**: A workflow-driven mode where users select predefined workflows and upload files for structured AI assistance
- **Chat Mode**: A freeform conversational mode for brainstorming and general discussion
- **Workflow Dropdown**: A collapsible menu containing organized workflow categories and options
- **Upload Zone**: A drag-and-drop file upload area for attaching files to the conversation
- **Navigation Header**: The top row of the chat interface containing mode selection and controls
- **ChatPanel Component**: The React component that renders the chat interface

## Requirements

### Requirement 1: Two-Mode Navigation System

**User Story:** As a user, I want a clear distinction between structured workflow-based interactions and freeform chat, so that I can quickly choose the appropriate mode for my task.

#### Acceptance Criteria

1. THE Chat Interface SHALL display exactly two top-level navigation modes labeled "Agent" and "Chat"
2. WHEN the user clicks on "Agent", THE Chat Interface SHALL display the Agent mode icon with a dropdown menu
3. WHEN the user clicks on "Chat", THE Chat Interface SHALL display the Chat mode icon with a dropdown menu
4. THE Chat Interface SHALL remove the "Gurus" tab from the navigation
5. THE Chat Interface SHALL display mode labels as text alongside icons (e.g., "Agent", "Chat")

### Requirement 2: Agent Mode Workflow Organization

**User Story:** As a user working in Agent mode, I want workflows organized into collapsible categories, so that I can easily find and select the appropriate workflow without visual clutter.

#### Acceptance Criteria

1. WHEN the user opens the Agent dropdown, THE Chat Interface SHALL display workflow categories as collapsible sections
2. THE Chat Interface SHALL group workflows by category: "Music Video", "Product Commercial", "Viral Social", "Explainer Video", and "Custom"
3. WHEN the user clicks a category header, THE Chat Interface SHALL expand or collapse that category to show or hide workflows
4. THE Chat Interface SHALL display workflow subtypes as nested items within their parent workflow
5. THE Chat Interface SHALL maintain the current workflow selection state when the dropdown is closed and reopened

### Requirement 3: Upload Zone Placement

**User Story:** As a user in Agent mode, I want to upload files directly within the agent panel, so that I can provide context files for workflow-based tasks.

#### Acceptance Criteria

1. WHEN Agent mode is active, THE Chat Interface SHALL display the upload zone within the chat input area
2. WHEN Chat mode is active, THE Chat Interface SHALL hide the upload zone
3. THE Chat Interface SHALL display uploaded file thumbnails in the Agent mode input area
4. THE Chat Interface SHALL allow users to delete uploaded files via thumbnail controls
5. THE Chat Interface SHALL allow users to set file purpose via thumbnail controls

### Requirement 4: Component Consolidation

**User Story:** As a developer, I want a single, well-organized ChatPanel component, so that the codebase is maintainable and free of redundant implementations.

#### Acceptance Criteria

1. THE Chat Interface SHALL use a single ChatPanel component for both Agent and Chat modes
2. THE ChatPanel component SHALL accept a mode prop to determine which features to display
3. THE Chat Interface SHALL remove the EnhancedChatPanel component if it is redundant
4. THE Chat Interface SHALL remove any unused chat panel component files
5. THE ChatPanel component SHALL conditionally render features based on the active mode

### Requirement 5: Navigation Header Layout

**User Story:** As a user, I want a clean, organized navigation header, so that I can quickly access mode selection and settings without confusion.

#### Acceptance Criteria

1. THE Chat Interface SHALL display a single top row header containing all navigation controls
2. THE Chat Interface SHALL position mode selection dropdowns (Agent/Chat) on the left side of the header
3. THE Chat Interface SHALL position settings and utility icons on the right side of the header
4. THE Chat Interface SHALL remove the secondary row of agent type buttons (Generate, Text, Gurus)
5. THE Chat Interface SHALL maintain responsive behavior for mobile and desktop layouts

### Requirement 6: Dropdown Menu Behavior

**User Story:** As a user, I want dropdown menus that are easy to navigate and clearly show my current selection, so that I can efficiently switch between workflows and modes.

#### Acceptance Criteria

1. WHEN the user clicks outside an open dropdown, THE Chat Interface SHALL close the dropdown
2. WHEN the user selects an item from a dropdown, THE Chat Interface SHALL close the dropdown and update the selection
3. THE Chat Interface SHALL highlight the currently selected workflow or mode in the dropdown
4. THE Chat Interface SHALL display the current selection in the dropdown trigger button
5. THE Chat Interface SHALL use consistent styling for all dropdown menus

### Requirement 7: File Naming and Organization

**User Story:** As a developer, I want clear, logical file names for chat components, so that the codebase is easy to navigate and understand.

#### Acceptance Criteria

1. THE Chat Interface SHALL use descriptive, concise file names without excessive prefixes
2. IF multiple ChatPanel components exist, THE Chat Interface SHALL rename them to reflect their specific purpose
3. IF only one ChatPanel component is needed, THE Chat Interface SHALL remove duplicate implementations
4. THE Chat Interface SHALL maintain consistent naming conventions across all chat-related components
5. THE Chat Interface SHALL update all import statements to reflect any file name changes

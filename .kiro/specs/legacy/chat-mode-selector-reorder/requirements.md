# Requirements Document

## Introduction

This feature reorganizes the chat panel's top row controls to improve user experience by presenting chat mode selection before workflow selection. Currently, the workflow selector (AgentDropdown) appears first, followed by the chat mode selector (ChatModeDropdown). The new arrangement will place the chat mode selector first, with Agent Mode as the primary option, followed by the workflow selector.

## Glossary

- **Chat Panel**: The main interface component for user interaction with the AI system, located in `src/features/chat/components/ChatPanel.tsx`
- **Chat Mode Selector**: A dropdown component (ChatModeDropdown) that allows users to choose between different chat interaction modes (Simple Chat, Concept Development, Style Exploration, Agent Mode)
- **Workflow Selector**: A dropdown component (AgentDropdown) that allows users to select specific workflows and subtypes for agent-based generation
- **Agent Mode**: A chat mode that enables workflow-based generation with file upload capabilities
- **Top Row Controls**: The horizontal control bar at the top of the chat panel containing mode and workflow selectors

## Requirements

### Requirement 1

**User Story:** As a user, I want to see the chat mode selector first in the top row, so that I can understand the primary interaction mode before selecting specific workflows

#### Acceptance Criteria

1. WHEN the Chat Panel renders, THE Chat Mode Selector SHALL appear as the first control in the top row
2. WHEN the Chat Panel renders, THE Workflow Selector SHALL appear as the second control in the top row, immediately after the Chat Mode Selector
3. THE Chat Mode Selector SHALL display "Agent Mode" as the first option in its dropdown menu
4. THE visual spacing and alignment between the two selectors SHALL remain consistent with the current design

### Requirement 2

**User Story:** As a user, I want the workflow selector functionality to remain unchanged, so that my existing workflow selection behavior continues to work as expected

#### Acceptance Criteria

1. THE Workflow Selector SHALL maintain all current functionality including workflow selection, subtype selection, and workflow management
2. WHEN a user selects a workflow, THE system SHALL apply the workflow system instructions to the chat context as currently implemented
3. THE Workflow Selector SHALL continue to display the selected workflow and subtype in its button label
4. THE placeholder text in the message input SHALL continue to update based on the selected workflow and subtype

### Requirement 3

**User Story:** As a user, I want the chat mode and workflow selection to work together seamlessly, so that selecting a workflow automatically switches to Agent Mode

#### Acceptance Criteria

1. WHEN a user selects a workflow from the Workflow Selector, THE Chat Mode Selector SHALL automatically switch to "Agent Mode"
2. WHEN a user clears the workflow selection, THE Chat Mode Selector SHALL automatically switch to "Simple Chat"
3. THE automatic mode switching behavior SHALL remain consistent with the current implementation
4. THE mobile view auto-switching behavior SHALL continue to function when chat mode changes

# Requirements Document

## Introduction

This document specifies the requirements for fixing the workflow selection behavior in the chat panel. Currently, when a user selects a workflow from the dropdown, the chat interface does not automatically switch to agent mode with the upload zone visible, breaking the expected user flow for workflow-based storyboard generation.

## Glossary

- **Chat Panel**: The left panel component containing the chat interface, workflow selector, and message composer
- **Workflow Dropdown**: The AgentDropdown component that allows users to select a workflow or subtype
- **Chat Mode**: The operational mode of the chat (simple, agent, or advanced)
- **Upload Zone**: The UploadDropzone component for uploading files in agent mode
- **Agent Mode**: A chat mode that includes file upload capabilities and workflow-specific instructions

## Requirements

### Requirement 1

**User Story:** As a user, I want the chat interface to automatically switch to agent mode when I select a workflow, so that I can immediately start uploading files and working with the workflow.

#### Acceptance Criteria

1. WHEN a user selects a workflow from the workflow dropdown, THE Chat Panel SHALL switch the chat mode to "agent"
2. WHEN the chat mode switches to "agent", THE Chat Panel SHALL display the upload dropzone component
3. WHEN a workflow is selected, THE Chat Panel SHALL update the placeholder text to reflect the selected workflow
4. WHEN a user deselects a workflow (returns to no selection), THE Chat Panel SHALL switch back to "simple" chat mode
5. WHEN the chat mode is "agent", THE Chat Panel SHALL maintain the upload zone visibility until the mode changes

### Requirement 2

**User Story:** As a user, I want the workflow selection to persist during my session, so that I don't have to reselect my workflow after each interaction.

#### Acceptance Criteria

1. WHEN a user selects a workflow, THE Chat Panel SHALL maintain the workflow selection state across message submissions
2. WHEN a user switches between mobile views, THE Chat Panel SHALL preserve the selected workflow
3. WHEN a user sends a message in agent mode, THE Chat Panel SHALL keep the agent mode active after the message is sent

### Requirement 3

**User Story:** As a user, I want visual feedback that agent mode is active, so that I understand the current state of the chat interface.

#### Acceptance Criteria

1. WHEN agent mode is active, THE Chat Panel SHALL display the upload dropzone in a visually distinct area
2. WHEN agent mode is active, THE Chat Panel SHALL show the workflow name in the dropdown button
3. WHEN files are uploaded in agent mode, THE Chat Panel SHALL display file thumbnails above the message composer

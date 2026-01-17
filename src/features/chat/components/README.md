# Chat Feature Components

This directory contains all UI components for the chat feature, including the enhanced components for the Gemini API enhancement project.

## Components

### Core Components

#### ChatPanel

The main chat panel component with support for:

- Workflow selection via AgentDropdown
- Chat mode selection via ChatModeDropdown
- File uploads via UploadDropzone
- File management with FileThumb components
- File purpose selection via FilePurposeSelector

### New Enhanced Components

#### AgentDropdown

Dropdown component for selecting workflows and subtypes.

**Features:**

- Fetches workflows from `/api/workflows`
- Groups workflows by category (music-video, commercial, social, explainer, custom)
- Displays nested subtypes for each workflow
- "Manage Workflows" option to open settings
- Automatic workflow and subtype fetching

**Props:**

- `selectedWorkflowId`: Currently selected workflow ID
- `selectedSubtypeId`: Currently selected subtype ID
- `onWorkflowSelect`: Callback when workflow/subtype is selected
- `onManageWorkflows`: Callback to open workflow management

#### ChatModeDropdown

Dropdown component for selecting chat mode.

**Features:**

- Three modes: Simple Chat, Concept Development, Style Exploration
- Icon-based display with descriptions
- Responsive design (icon only on mobile, label on desktop)

**Props:**

- `selectedMode`: Current chat mode
- `onModeSelect`: Callback when mode changes

**Types:**

- `ChatMode`: "simple" | "concept" | "style"

#### StreamingText

Component for displaying streaming text responses from the AI.

**Features:**

- Real-time SSE (Server-Sent Events) streaming
- Progressive text display
- Stop generation button
- Error handling with request ID display
- Connection management and cleanup

**Props:**

- `prompt`: User prompt
- `history`: Chat history
- `image`: Optional image attachment
- `chatModel`: Model to use
- `workflow`: Workflow context
- `thinkingMode`: Enable thinking mode
- `onComplete`: Callback when streaming completes
- `onError`: Callback on error
- `entryPoint`: Optional entry point identifier

#### UploadDropzone

Drag-and-drop file upload component.

**Features:**

- Drag-and-drop support
- Multiple file uploads (configurable max)
- Progress indicators for each file
- File validation (size, type)
- Supports images, videos, audio, text, PDF
- Max file size: 100MB
- Routes to `/api/files/upload`

**Props:**

- `projectId`: Project ID for file association
- `maxFiles`: Maximum number of files (default: 10)
- `onFilesUploaded`: Callback with uploaded files
- `onError`: Callback on upload error

#### FileThumb

Thumbnail component for displaying uploaded files.

**Features:**

- Thumbnail display (image preview or icon)
- File purpose label with color coding
- Delete button
- Reorder handle (optional)
- File size display

**Props:**

- `file`: Uploaded file object
- `onDelete`: Callback to delete file
- `onPurposeClick`: Callback to change file purpose
- `isDraggable`: Enable drag handle

#### FilePurposeSelector

Modal component for selecting file purpose.

**Features:**

- Five purpose options:
  - Style Reference
  - Character Reference
  - Audio Reference
  - Text Document
  - General Reference
- Icon-based display with descriptions
- Updates via `/api/files/:id` PUT request
- Error handling

**Props:**

- `fileId`: File ID to update
- `fileName`: File name for display
- `currentPurpose`: Current file purpose
- `onSelect`: Callback when purpose is selected
- `onCancel`: Callback to close modal

**Types:**

- `FilePurpose`: "style-reference" | "character-reference" | "audio-reference" | "text-document" | "general-reference"

## Usage Example

```tsx
import { ChatPanel } from "@/features/chat/components";

<ChatPanel
  projectId={project.id}
  chatHistory={chatHistory}
  isLoading={isLoading}
  loadingText="Generating..."
  onSendMessage={handleSendMessage}
  aspectRatio={aspectRatio}
  setAspectRatio={setAspectRatio}
  presetStyles={presetStyles}
  selectedStyles={selectedStyles}
  setSelectedStyles={setSelectedStyles}
  agent={agent}
  onAgentChange={setAgent}
  effectiveSettings={settings}
  onSessionSettingsChange={handleSettingsChange}
  mobileView={mobileView}
  setMobileView={setMobileView}
/>
```

## API Integration

### Workflows

- `GET /api/workflows` - List all workflows
- `GET /api/workflows/:id/subtypes` - List workflow subtypes

### Files

- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Get file details
- `PUT /api/files/:id` - Update file (purpose)
- `DELETE /api/files/:id` - Delete file

### Chat

- `POST /api/ai/chat/stream` - Streaming chat with SSE

## Module Boundaries

All components follow the feature-first architecture:

- ✅ Import from shared modules (`@/components`, `@/hooks`, `@/ui`)
- ✅ Import from types (`@/types`)
- ❌ Do NOT import from other features

## File Size Guidelines

- Components: < 300 lines
- All components in this directory comply with size guidelines

## Testing

Component tests should be placed in `__tests__/` subdirectory:

- `AgentDropdown.test.tsx`
- `ChatModeDropdown.test.tsx`
- `StreamingText.test.tsx`
- `UploadDropzone.test.tsx`
- `FileThumb.test.tsx`
- `FilePurposeSelector.test.tsx`

## Related Documentation

- [Requirements](.kiro/specs/gemini-api-enhancement/requirements.md)
- [Design](.kiro/specs/gemini-api-enhancement/design.md)
- [Tasks](.kiro/specs/gemini-api-enhancement/tasks.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Module Boundaries](docs/MODULE-BOUNDARIES.md)

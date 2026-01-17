# Component Documentation

## Overview

This document provides detailed information about the new components added for workflows, templates, documents, and file uploads.

## Chat Feature Components

### AgentDropdown

**Location:** `src/features/chat/components/AgentDropdown.tsx`

**Purpose:** Workflow and subtype selection for AI agent behavior

**Props:**
```typescript
interface AgentDropdownProps {
  selectedWorkflowId: string | null;
  selectedSubtypeId: string | null;
  onWorkflowChange: (workflowId: string | null) => void;
  onSubtypeChange: (subtypeId: string | null) => void;
}
```

**Features:**
- Displays workflows grouped by category
- Shows subtypes for selected workflow
- "Manage Workflows" option opens settings
- Fetches workflows from `/api/workflows`

**Usage:**
```tsx
<AgentDropdown
  selectedWorkflowId={workflowId}
  selectedSubtypeId={subtypeId}
  onWorkflowChange={setWorkflowId}
  onSubtypeChange={setSubtypeId}
/>
```

**State Management:**
- Uses `workflowStore` for workflow data
- Local state for dropdown open/close
- Caches workflow list

---

### ChatModeDropdown

**Location:** `src/features/chat/components/ChatModeDropdown.tsx`

**Purpose:** Chat mode selection (Simple, Concept Development, Style Exploration)

**Props:**
```typescript
interface ChatModeDropdownProps {
  selectedMode: 'simple' | 'concept' | 'style';
  onModeChange: (mode: 'simple' | 'concept' | 'style') => void;
}
```

**Features:**
- Three chat modes with descriptions
- Visual icons for each mode
- Updates chat context on selection

**Usage:**
```tsx
<ChatModeDropdown
  selectedMode={chatMode}
  onModeChange={setChatMode}
/>
```

---

### StreamingText

**Location:** `src/features/chat/components/StreamingText.tsx`

**Purpose:** Display progressively streaming text from SSE endpoint

**Props:**
```typescript
interface StreamingTextProps {
  endpoint: string;
  payload: object;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}
```

**Features:**
- Consumes SSE events from `/api/ai/chat/stream`
- Token buffering for smooth display
- Stop generation button
- Error handling with request ID display
- Automatic reconnection on disconnect

**Usage:**
```tsx
<StreamingText
  endpoint="/api/ai/chat/stream"
  payload={{ messages, projectId }}
  onComplete={handleComplete}
  onError={handleError}
/>
```

**State Management:**
- Local state for streaming text
- Connection state tracking
- Error state management

---

### UploadDropzone

**Location:** `src/features/chat/components/UploadDropzone.tsx`

**Purpose:** Drag-and-drop file upload interface

**Props:**
```typescript
interface UploadDropzoneProps {
  projectId: string;
  onUploadComplete: (file: UploadedFile) => void;
  onUploadError: (error: Error) => void;
  maxFiles?: number;
}
```

**Features:**
- Drag-and-drop support
- Click to upload
- Multiple file uploads (max 10)
- Upload progress indicators
- File validation (size, type)
- Automatic thumbnail generation

**Usage:**
```tsx
<UploadDropzone
  projectId={projectId}
  onUploadComplete={handleUpload}
  onUploadError={handleError}
  maxFiles={10}
/>
```

**State Management:**
- Uses `fileUploadStore` for upload state
- Progress tracking per file
- Upload queue management

---

### FileThumb

**Location:** `src/features/chat/components/FileThumb.tsx`

**Purpose:** File thumbnail with controls

**Props:**
```typescript
interface FileThumbProps {
  file: UploadedFile;
  onDelete: (fileId: string) => void;
  onChangePurpose: (fileId: string, purpose: FilePurpose) => void;
  onReorder?: (fileId: string, newIndex: number) => void;
}
```

**Features:**
- Thumbnail preview (image, video, audio, document)
- Purpose label display
- Delete button
- Drag handle for reordering
- Click to change purpose

**Usage:**
```tsx
<FileThumb
  file={uploadedFile}
  onDelete={handleDelete}
  onChangePurpose={handlePurposeChange}
  onReorder={handleReorder}
/>
```

---

### FilePurposeSelector

**Location:** `src/features/chat/components/FilePurposeSelector.tsx`

**Purpose:** Modal for selecting file purpose

**Props:**
```typescript
interface FilePurposeSelectorProps {
  file: UploadedFile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (fileId: string, purpose: FilePurpose) => void;
}
```

**Features:**
- Modal dialog
- Purpose options with descriptions
- Save and cancel buttons
- Updates file metadata via API

**Purpose Options:**
- `style-reference` - Visual style reference
- `character-reference` - Character appearance
- `audio-reference` - Audio/music reference
- `text-document` - Text document for context
- `general-reference` - General reference material

**Usage:**
```tsx
<FilePurposeSelector
  file={selectedFile}
  isOpen={isModalOpen}
  onClose={closeModal}
  onSave={handleSave}
/>
```

---

## Storyboard Feature Components

### DocumentViewer

**Location:** `src/features/storyboard/components/DocumentViewer.tsx`

**Purpose:** Read-only document viewer with collapsible sections

**Props:**
```typescript
interface DocumentViewerProps {
  projectId: string;
  onEdit: () => void;
  onExport: () => void;
  onHistory: () => void;
}
```

**Features:**
- Displays project title, style, goals, outline, scenes
- Collapsible sections
- Toolbar with Edit, Export, History buttons
- Fetches from `/api/projects/:id/document`

**Usage:**
```tsx
<DocumentViewer
  projectId={projectId}
  onEdit={openEditor}
  onExport={openExportModal}
  onHistory={openHistoryPanel}
/>
```

**State Management:**
- Uses `documentStore` for document data
- Loading and error states
- Auto-refresh on updates

---

### DocumentEditor

**Location:** `src/features/storyboard/components/DocumentEditor.tsx`

**Purpose:** Document editing with Tiptap rich text editor

**Props:**
```typescript
interface DocumentEditorProps {
  projectId: string;
  onClose: () => void;
  onSave: () => void;
}
```

**Features:**
- Integrates TiptapEditor component
- Toolbar with formatting controls
- Real-time auto-save (every 30 seconds)
- Manual save button
- Saves to `/api/projects/:id/document`

**Usage:**
```tsx
<DocumentEditor
  projectId={projectId}
  onClose={closeEditor}
  onSave={handleSave}
/>
```

**State Management:**
- Uses `documentStore` for document state
- Auto-save timer management
- Dirty state tracking

---

### TiptapEditor

**Location:** `src/features/storyboard/components/TiptapEditor.tsx`

**Purpose:** Tiptap rich text editor integration

**Props:**
```typescript
interface TiptapEditorProps {
  content: object;
  onChange: (content: object) => void;
}
```

**Features:**
- Rich text formatting (bold, italic, headings)
- Code blocks for prompts
- Section support
- Keyboard shortcuts
- Undo/redo

**Extensions:**
- StarterKit (basic formatting)
- CodeBlock (prompt code blocks)
- Placeholder
- CharacterCount

**Usage:**
```tsx
<TiptapEditor
  content={documentContent}
  onChange={handleContentChange}
/>
```

---

### DocumentExport

**Location:** `src/features/storyboard/components/DocumentExport.tsx`

**Purpose:** Export modal for document export

**Props:**
```typescript
interface DocumentExportProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- Format selection (Markdown, PDF, JSON)
- "Include assets" checkbox
- Export button
- Calls `/api/projects/:id/document/export`
- Handles file download

**Usage:**
```tsx
<DocumentExport
  projectId={projectId}
  isOpen={isExportModalOpen}
  onClose={closeExportModal}
/>
```

---

### DocumentHistory

**Location:** `src/features/storyboard/components/DocumentHistory.tsx`

**Purpose:** Version history panel with restore capability

**Props:**
```typescript
interface DocumentHistoryProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (version: number) => void;
}
```

**Features:**
- Lists all document versions
- Shows timestamps and version numbers
- Restore button for each version
- Diff view between versions
- Calls `/api/projects/:id/document/history`

**Usage:**
```tsx
<DocumentHistory
  projectId={projectId}
  isOpen={isHistoryOpen}
  onClose={closeHistory}
  onRestore={handleRestore}
/>
```

---

### DocumentTab

**Location:** `src/features/storyboard/components/DocumentTab.tsx`

**Purpose:** Document tab for gallery section

**Props:**
```typescript
interface DocumentTabProps {
  projectId: string;
}
```

**Features:**
- Integrates DocumentViewer
- Tab content for gallery section
- Handles edit/export/history actions

**Usage:**
```tsx
<DocumentTab projectId={projectId} />
```

---

## Settings Feature Components

### WorkflowManager

**Location:** `src/features/settings/components/WorkflowManager.tsx`

**Purpose:** Workflow list and management interface

**Props:**
```typescript
interface WorkflowManagerProps {
  onEdit: (workflowId: string) => void;
  onCreate: () => void;
}
```

**Features:**
- Displays workflows with thumbnails and categories
- Create, Edit, Delete buttons
- Category filter
- Search functionality
- Fetches from `/api/workflows`

**Usage:**
```tsx
<WorkflowManager
  onEdit={openWorkflowEditor}
  onCreate={createNewWorkflow}
/>
```

**State Management:**
- Uses `workflowStore` for workflow data
- Filter and search state
- Selection state

---

### WorkflowEditor

**Location:** `src/features/settings/components/WorkflowEditor.tsx`

**Purpose:** Workflow creation and editing form

**Props:**
```typescript
interface WorkflowEditorProps {
  workflowId?: string;
  onSave: () => void;
  onCancel: () => void;
}
```

**Features:**
- Form fields: name, description, category, thumbnail, art style
- Integrates SystemInstructionEditor
- Example input/output pairs
- Metadata editor
- Saves via `/api/workflows` (POST/PUT)

**Usage:**
```tsx
<WorkflowEditor
  workflowId={editingWorkflowId}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

**Validation:**
- Required fields: name, description, category, systemInstruction
- Category enum validation
- URL validation for thumbnail

---

### SystemInstructionEditor

**Location:** `src/features/settings/components/SystemInstructionEditor.tsx`

**Purpose:** Large text editor for system instructions

**Props:**
```typescript
interface SystemInstructionEditorProps {
  value: string;
  onChange: (value: string) => void;
}
```

**Features:**
- Large text area (10+ rows)
- Character count display
- Preview/test button
- Syntax highlighting (optional)

**Usage:**
```tsx
<SystemInstructionEditor
  value={systemInstruction}
  onChange={setSystemInstruction}
/>
```

---

### SubtypeManager

**Location:** `src/features/settings/components/SubtypeManager.tsx`

**Purpose:** Subtype list and management for a workflow

**Props:**
```typescript
interface SubtypeManagerProps {
  workflowId: string;
  onEdit: (subtypeId: string) => void;
  onCreate: () => void;
}
```

**Features:**
- Lists subtypes for selected workflow
- Create, Edit, Delete buttons
- Fetches from `/api/workflows/:id/subtypes`

**Usage:**
```tsx
<SubtypeManager
  workflowId={selectedWorkflowId}
  onEdit={openSubtypeEditor}
  onCreate={createNewSubtype}
/>
```

---

### TemplateLibrary

**Location:** `src/features/settings/components/TemplateLibrary.tsx`

**Purpose:** Style template grid with filtering

**Props:**
```typescript
interface TemplateLibraryProps {
  onSelect: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onCreate: () => void;
}
```

**Features:**
- Grid layout with template cards
- Category filter (multiple selection)
- Search functionality
- Active template indicator
- Tested badge display
- Fetches from `/api/templates`

**Usage:**
```tsx
<TemplateLibrary
  onSelect={selectTemplate}
  onEdit={openTemplateEditor}
  onCreate={createNewTemplate}
/>
```

**State Management:**
- Uses `templateStore` for template data
- Filter and search state
- Active template tracking

---

### TemplateEditor

**Location:** `src/features/settings/components/TemplateEditor.tsx`

**Purpose:** Template creation and editing form

**Props:**
```typescript
interface TemplateEditorProps {
  templateId?: string;
  onSave: () => void;
  onCancel: () => void;
}
```

**Features:**
- Form fields: name, description, thumbnail, category, stylePrompt
- "Tested" checkbox
- Example input/output pairs
- Metadata editor
- Test template button
- Saves via `/api/templates` (POST/PUT)

**Usage:**
```tsx
<TemplateEditor
  templateId={editingTemplateId}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

**Validation:**
- Required fields: name, description, category, stylePrompt
- Category array validation
- URL validation for thumbnail

---

### TemplateCard

**Location:** `src/features/settings/components/TemplateCard.tsx`

**Purpose:** Template card component for grid display

**Props:**
```typescript
interface TemplateCardProps {
  template: StyleTemplate;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Features:**
- Thumbnail display
- Template name and description
- Category tags
- Tested badge
- Active indicator
- Select, Edit, Delete actions

**Usage:**
```tsx
<TemplateCard
  template={template}
  isActive={isActiveTemplate}
  onSelect={handleSelect}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

## Utility Components

### SSE Client

**Location:** `src/utils/sseClient.ts`

**Purpose:** EventSource wrapper for Server-Sent Events

**API:**
```typescript
interface SSEClientOptions {
  endpoint: string;
  payload: object;
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

function createSSEClient(options: SSEClientOptions): {
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
}
```

**Features:**
- EventSource connection management
- Token buffering for smooth display
- Automatic reconnection logic
- Error handling
- Connection lifecycle management

**Usage:**
```typescript
const client = createSSEClient({
  endpoint: '/api/ai/chat/stream',
  payload: { messages, projectId },
  onToken: (token) => appendToken(token),
  onComplete: (text) => saveMessage(text),
  onError: (error) => showError(error),
});

client.connect();
// Later...
client.disconnect();
```

---

### File Upload Utility

**Location:** `src/utils/fileUpload.ts`

**Purpose:** Multipart file upload with progress tracking

**API:**
```typescript
interface UploadOptions {
  file: File;
  projectId: string;
  purpose: FilePurpose;
  onProgress: (progress: number) => void;
  onComplete: (file: UploadedFile) => void;
  onError: (error: Error) => void;
}

function uploadFile(options: UploadOptions): {
  cancel: () => void;
}
```

**Features:**
- Multipart form data upload
- Progress tracking (0-100%)
- Upload cancellation
- Client-side thumbnail generation
- Error handling

**Usage:**
```typescript
const upload = uploadFile({
  file: selectedFile,
  projectId: projectId,
  purpose: 'style-reference',
  onProgress: (progress) => setProgress(progress),
  onComplete: (file) => addFile(file),
  onError: (error) => showError(error),
});

// Cancel if needed
upload.cancel();
```

---

### Document Export Utility

**Location:** `src/utils/documentExport.ts`

**Purpose:** Document export request helper

**API:**
```typescript
interface ExportOptions {
  projectId: string;
  format: 'markdown' | 'pdf' | 'json';
  includeAssets: boolean;
}

async function exportDocument(options: ExportOptions): Promise<void>
```

**Features:**
- Handles export API request
- File download management
- Format-specific handling
- Error handling

**Usage:**
```typescript
await exportDocument({
  projectId: projectId,
  format: 'markdown',
  includeAssets: true,
});
```

---

## State Management

### Workflow Store

**Location:** `src/features/settings/state/workflowStore.ts`

**State:**
```typescript
interface WorkflowState {
  workflows: Workflow[];
  subtypes: Record<string, WorkflowSubtype[]>;
  loading: boolean;
  error: string | null;
}
```

**Actions:**
- `fetchWorkflows()` - Load all workflows
- `createWorkflow(data)` - Create new workflow
- `updateWorkflow(id, data)` - Update workflow
- `deleteWorkflow(id)` - Delete workflow
- `fetchSubtypes(workflowId)` - Load subtypes
- `createSubtype(workflowId, data)` - Create subtype
- `updateSubtype(id, data)` - Update subtype
- `deleteSubtype(id)` - Delete subtype

---

### Template Store

**Location:** `src/features/settings/state/templateStore.ts`

**State:**
```typescript
interface TemplateState {
  templates: StyleTemplate[];
  activeTemplateId: string | null;
  loading: boolean;
  error: string | null;
}
```

**Actions:**
- `fetchTemplates()` - Load all templates
- `createTemplate(data)` - Create new template
- `updateTemplate(id, data)` - Update template
- `deleteTemplate(id)` - Delete template
- `setActiveTemplate(id)` - Set active template
- `getActiveTemplate()` - Get active template

---

### Document Store

**Location:** `src/features/storyboard/state/documentStore.ts`

**State:**
```typescript
interface DocumentState {
  documents: Record<string, ProjectDocument>;
  history: Record<string, DocumentVersion[]>;
  loading: boolean;
  error: string | null;
  autoSaveEnabled: boolean;
}
```

**Actions:**
- `fetchDocument(projectId)` - Load document
- `saveDocument(projectId, content)` - Save with versioning
- `fetchHistory(projectId)` - Load version history
- `restoreVersion(projectId, version)` - Restore version
- `exportDocument(projectId, format, includeAssets)` - Export
- `enableAutoSave()` - Enable auto-save
- `disableAutoSave()` - Disable auto-save

---

### File Upload Store

**Location:** `src/features/generation/state/fileUploadStore.ts`

**State:**
```typescript
interface FileUploadState {
  files: Record<string, UploadedFile>;
  uploadProgress: Record<string, number>;
  loading: boolean;
  error: string | null;
}
```

**Actions:**
- `uploadFile(file, projectId, purpose)` - Upload file
- `updateProgress(fileId, progress)` - Update progress
- `deleteFile(fileId)` - Delete file
- `changePurpose(fileId, purpose)` - Change file purpose
- `reorderFiles(projectId, fileIds)` - Reorder files
- `getProjectFiles(projectId)` - Get files for project

---

## Integration Guidelines

### Adding Components to Existing UI

**Chat Panel Integration:**
1. Import components from `src/features/chat/components/`
2. Add to ChatPanel.tsx layout
3. Wire up state management
4. Test with existing chat functionality

**Settings Panel Integration:**
1. Import components from `src/features/settings/components/`
2. Add new sections to SettingsPanel.tsx
3. Use existing section styles
4. Wire up state management

**Storyboard Panel Integration:**
1. Import components from `src/features/storyboard/components/`
2. Add Document tab to gallery section
3. Wire up document actions
4. Test with existing storyboard features

### State Management Integration

**Using Stores:**
```typescript
// In component
import { useWorkflowStore } from '../state/workflowStore';

function MyComponent() {
  const { workflows, fetchWorkflows } = useWorkflowStore();
  
  useEffect(() => {
    fetchWorkflows();
  }, []);
  
  return (/* ... */);
}
```

**Composing Stores:**
```typescript
// In settingsStore.ts
import { workflowStore } from './workflowStore';
import { templateStore } from './templateStore';

export const useSettingsStore = create((set, get) => ({
  ...workflowStore(set, get),
  ...templateStore(set, get),
  // Additional settings state
}));
```

### API Integration

**Making API Calls:**
```typescript
// Using fetch
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(workflowData),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error);
}

const { workflow } = await response.json();
```

**Error Handling:**
```typescript
try {
  await createWorkflow(data);
} catch (error) {
  const requestId = error.requestId;
  const retryable = error.retryable;
  
  if (retryable) {
    // Show retry option
  } else {
    // Show error message
  }
}
```

---

## Testing

### Component Testing

**Example Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowManager } from './WorkflowManager';

describe('WorkflowManager', () => {
  it('renders workflow list', async () => {
    render(<WorkflowManager onEdit={jest.fn()} onCreate={jest.fn()} />);
    
    await screen.findByText('Music Video Director');
    expect(screen.getByText('Music Video Director')).toBeInTheDocument();
  });
  
  it('calls onCreate when create button clicked', () => {
    const onCreate = jest.fn();
    render(<WorkflowManager onEdit={jest.fn()} onCreate={onCreate} />);
    
    fireEvent.click(screen.getByText('Create Workflow'));
    expect(onCreate).toHaveBeenCalled();
  });
});
```

### Store Testing

**Example Test:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useWorkflowStore } from './workflowStore';

describe('workflowStore', () => {
  it('fetches workflows', async () => {
    const { result } = renderHook(() => useWorkflowStore());
    
    await act(async () => {
      await result.current.fetchWorkflows();
    });
    
    expect(result.current.workflows.length).toBeGreaterThan(0);
  });
});
```

---

## Resources

- [API Documentation](./API.md) - API endpoints and schemas
- [Architecture Documentation](./ARCHITECTURE.md) - System architecture
- [User Guides](./user/) - End-user documentation
- [Configuration Guide](./CONFIGURATION.md) - Setup and configuration

---

## Contributing

When adding new components:

1. Follow existing component patterns
2. Use TypeScript with proper types
3. Add JSDoc comments
4. Write tests for core functionality
5. Update this documentation
6. Follow module boundary rules
7. Use existing design system

Happy coding! 🚀

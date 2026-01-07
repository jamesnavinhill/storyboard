# Storyboard State Management

This directory contains Zustand store slices for managing project documents.

## Store Structure

The storyboard store contains the document slice:

### DocumentSlice (`documentStore.ts`)

Manages project document CRUD operations, versioning, and auto-save:

- **State**: current document, versions, loading/saving state, dirty flag, auto-save timer
- **Operations**:
  - `fetchDocument()` - Fetch document for a project
  - `saveDocument()` - Save document content
  - `updateDocumentContent()` - Update document content locally (marks dirty)
  - `markDocumentDirty()` / `markDocumentClean()` - Manage dirty state
  - `fetchDocumentHistory()` - Fetch document version history
  - `restoreDocumentVersion()` - Restore a previous version
  - `startAutoSave()` - Start auto-save timer (default 30s)
  - `stopAutoSave()` - Stop auto-save timer
  - `triggerAutoSave()` - Manually trigger auto-save
  - `exportDocument()` - Export document to Markdown/PDF/JSON
  - `clearDocument()` - Clear document state

## Usage

```typescript
import { useStoryboardStore } from './state';

function DocumentEditor() {
  const {
    currentDocument,
    documentDirty,
    updateDocumentContent,
    saveDocument,
    startAutoSave,
    stopAutoSave
  } = useStoryboardStore();
  
  useEffect(() => {
    startAutoSave(projectId);
    return () => stopAutoSave();
  }, [projectId]);
  
  // Use the store...
}
```

## Auto-Save

The document slice implements automatic saving:
- Default interval: 30 seconds
- Only saves when document is dirty
- Prevents concurrent saves
- Silent failures (doesn't throw on auto-save errors)
- Timer is cleared on unmount

## Versioning

Documents are automatically versioned on save:
- Last 10 versions are retained
- Older versions are pruned automatically
- Version history can be fetched and restored

## Requirements

Implements requirements:
- 8.1, 8.2, 8.6 (Document CRUD)
- 9.5 (Auto-save)
- 8.9, 8.10 (Version history)

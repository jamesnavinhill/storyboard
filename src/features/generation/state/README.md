# Generation State Management

This directory contains Zustand store slices for managing file uploads.

## Store Structure

The generation store contains the file upload slice:

### FileUploadSlice (`fileUploadStore.ts`)

Manages file upload operations, progress tracking, and file management:

- **State**: uploaded files list, upload progress map, loading state
- **Operations**:
  - `uploadFile()` - Upload file with progress tracking
  - `fetchProjectFiles()` - Fetch all files for a project
  - `deleteFile()` - Delete an uploaded file
  - `updateFilePurpose()` - Update file purpose
  - `reorderFiles()` - Reorder files by ID array
  - `setUploadProgress()` - Set upload progress for a file
  - `clearUploadProgress()` - Clear progress for a file
  - `clearAllUploadProgress()` - Clear all progress
  - `clearFiles()` - Clear all files state

## Usage

```typescript
import { useGenerationStore } from './state';

function FileUploader() {
  const {
    uploadedFiles,
    uploadProgress,
    uploadFile,
    deleteFile
  } = useGenerationStore();
  
  const handleUpload = async (file: File) => {
    await uploadFile(projectId, file, 'style-reference', (progress) => {
      console.log(`Upload progress: ${progress}%`);
    });
  };
  
  // Use the store...
}
```

## Upload Progress Tracking

The file upload slice tracks upload progress in real-time:
- Uses XMLHttpRequest for progress events
- Progress is tracked per file with unique IDs
- Status: 'uploading' | 'complete' | 'error'
- Progress cleared automatically 2 seconds after completion
- Supports progress callbacks for UI updates

## File Management

Files can be managed after upload:
- Update file purpose (style-reference, character-reference, etc.)
- Delete files (removes from server and state)
- Reorder files for display
- Fetch all files for a project

## Requirements

Implements requirements:
- 10.5 (Upload progress)
- 10.9 (File management)
- 10.10 (File deletion)

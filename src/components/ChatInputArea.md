# ChatInputArea Component

A reusable chat input component extracted from ChatPanel for use in modals (AnimateModal, EditModal, ExtendModal).

## Features

- **Auto-resizing textarea**: Automatically adjusts height based on content
- **Keyboard shortcuts**: Enter to submit, Shift+Enter for new line
- **File upload**: Optional file upload with preview thumbnails
- **File validation**: Validates file types and sizes
- **Action buttons**: Customizable icon buttons in the bottom row
- **Consistent styling**: Uses the same composer styles as ChatPanel

## Usage

### Basic Usage

```tsx
import { ChatInputArea } from "@/components/ChatInputArea";

function MyModal() {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    console.log("Submitted:", prompt);
    setPrompt("");
  };

  return (
    <ChatInputArea
      value={prompt}
      onChange={setPrompt}
      onSubmit={handleSubmit}
      placeholder="Enter your prompt..."
    />
  );
}
```

### With File Upload

```tsx
import { ChatInputArea } from "@/components/ChatInputArea";
import { Sparkles } from "lucide-react";

function AnimateModal() {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);

  const handleFileUpload = (newFiles: File[]) => {
    const attachedFiles = newFiles.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));
    setFiles([...files, ...attachedFiles]);
  };

  const handleFileRemove = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  const handleSuggest = () => {
    // AI suggestion logic
  };

  return (
    <ChatInputArea
      value={prompt}
      onChange={setPrompt}
      onSubmit={handleSubmit}
      placeholder="Describe the animation..."
      showFileUpload={true}
      onFileUpload={handleFileUpload}
      attachedFiles={files}
      onFileRemove={handleFileRemove}
      actions={[
        {
          icon: Sparkles,
          label: "AI Suggest",
          onClick: handleSuggest,
        },
      ]}
    />
  );
}
```

## Props

| Prop                | Type                       | Default               | Description                      |
| ------------------- | -------------------------- | --------------------- | -------------------------------- |
| `value`             | `string`                   | Required              | Current input value              |
| `onChange`          | `(value: string) => void`  | Required              | Callback when input changes      |
| `onSubmit`          | `() => void`               | Required              | Callback when form is submitted  |
| `placeholder`       | `string`                   | `"Type a message..."` | Placeholder text                 |
| `disabled`          | `boolean`                  | `false`               | Whether input is disabled        |
| `showFileUpload`    | `boolean`                  | `false`               | Show file upload button          |
| `onFileUpload`      | `(files: File[]) => void`  | `undefined`           | Callback when files are uploaded |
| `attachedFiles`     | `AttachedFile[]`           | `[]`                  | List of attached files           |
| `onFileRemove`      | `(fileId: string) => void` | `undefined`           | Callback when file is removed    |
| `actions`           | `ChatInputAction[]`        | `[]`                  | Action buttons to display        |
| `maxHeight`         | `string`                   | `"200px"`             | Maximum height for textarea      |
| `acceptedFileTypes` | `string`                   | `"image/*"`           | Accepted file types              |
| `maxFileSize`       | `number`                   | `10485760` (10MB)     | Maximum file size in bytes       |

## Types

```typescript
interface AttachedFile {
  id: string;
  name: string;
  preview?: string;
  size?: number;
}

interface ChatInputAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
```

## File Validation

The component automatically validates uploaded files:

- **File type**: Checks against `acceptedFileTypes` prop
- **File size**: Checks against `maxFileSize` prop
- **Error handling**: Logs validation errors to console

For production use, you may want to display validation errors to users via toast notifications or inline error messages.

## Styling

The component uses the existing composer styles from `src/styles/utilities.css`:

- `.composer` - Main container with brand glow effect
- `.composer-top` - Textarea container
- `.composer-input` - Textarea styling
- `.composer-divider` - Horizontal divider
- `.composer-bottom` - Action buttons row

## Keyboard Shortcuts

- **Enter**: Submit (if input is not empty)
- **Shift+Enter**: Insert new line

## Accessibility

- All buttons have `aria-label` attributes
- Textarea has `aria-label="Message input"`
- File remove buttons include file name in label
- Disabled state properly communicated to screen readers

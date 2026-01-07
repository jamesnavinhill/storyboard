import React, { useRef, useEffect } from "react";
import { X } from "lucide-react";

/**
 * Represents an attached file with preview information
 */
export interface AttachedFile {
  id: string;
  name: string;
  preview?: string;
  size?: number;
}

/**
 * Represents an action button in the icon row
 */
export interface ChatInputAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Props for the ChatInputArea component
 */
export interface ChatInputAreaProps {
  /** Current input value */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Callback when form is submitted */
  onSubmit: () => void;
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show file upload button */
  showFileUpload?: boolean;
  /** Callback when files are uploaded */
  onFileUpload?: (files: File[]) => void;
  /** List of attached files */
  attachedFiles?: AttachedFile[];
  /** Callback when a file is removed */
  onFileRemove?: (fileId: string) => void;
  /** Action buttons to display in the icon row */
  actions?: ChatInputAction[];
  /** Maximum height for the textarea */
  maxHeight?: string;
  /** Accepted file types for upload */
  acceptedFileTypes?: string;
  /** Maximum file size in bytes */
  maxFileSize?: number;
}

/**
 * Reusable chat input component with file upload and action buttons.
 * Extracted from ChatPanel to be reused in modals (AnimateModal, EditModal, ExtendModal).
 *
 * Features:
 * - Auto-resizing textarea
 * - Keyboard shortcuts (Enter to submit, Shift+Enter for new line)
 * - File upload with preview thumbnails
 * - Customizable action buttons
 * - File validation
 */
export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  showFileUpload = false,
  onFileUpload,
  attachedFiles = [],
  onFileRemove,
  actions = [],
  maxHeight = "200px",
  acceptedFileTypes = "image/*",
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  /**
   * Handle keyboard shortcuts
   * - Enter: Submit (unless Shift is held)
   * - Shift+Enter: New line
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  /**
   * Handle file selection from input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileUpload) {
      // Validate files before uploading
      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach((file) => {
        // Check file type
        if (
          acceptedFileTypes !== "*" &&
          !file.type.match(acceptedFileTypes.replace("*", ".*"))
        ) {
          errors.push(
            `${file.name}: Invalid file type. Expected ${acceptedFileTypes}`
          );
          return;
        }

        // Check file size
        if (file.size > maxFileSize) {
          const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
          errors.push(
            `${file.name}: File too large. Maximum size is ${maxSizeMB}MB`
          );
          return;
        }

        validFiles.push(file);
      });

      // Show errors if any
      if (errors.length > 0) {
        console.error("File validation errors:", errors);
        // In a real implementation, you might want to show these errors to the user
        // via a toast notification or inline error message
      }

      // Upload valid files
      if (validFiles.length > 0) {
        onFileUpload(validFiles);
      }
    }

    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  /**
   * Trigger file input click
   */
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="chat-input-area">
      {/* Input composer */}
      <div className="composer">
        <div className="composer-top">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="composer-input hide-scrollbar"
            rows={4}
            disabled={disabled}
            style={{ maxHeight }}
            aria-label="Message input"
          />
        </div>

        <div className="composer-divider" />

        <div className="composer-bottom">
          <div className="flex flex-col gap-2 w-full">
            {/* Attached files preview - Moved inside composer-bottom */}
            {attachedFiles.length > 0 && (
              <div className="attached-files-preview">
                <div className="flex gap-2 flex-wrap">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="relative">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-sm border border-muted"
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center rounded-sm border border-muted bg-muted">
                          <span className="text-xs text-muted-foreground truncate px-1">
                            {file.name}
                          </span>
                        </div>
                      )}
                      {onFileRemove && (
                        <button
                          type="button"
                          onClick={() => onFileRemove(file.id)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                          style={{ width: "20px", height: "20px" }}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* File upload button */}
                {showFileUpload && (
                  <>
                    <button
                      type="button"
                      onClick={handleFileUploadClick}
                      className="btn-base btn-ghost p-2"
                      title="Attach file"
                      disabled={disabled}
                      aria-label="Attach file"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={acceptedFileTypes}
                      multiple
                      className="hidden"
                      aria-hidden="true"
                    />
                  </>
                )}

                {/* Custom action buttons */}
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={action.onClick}
                    className="btn-base btn-ghost p-2"
                    title={action.label}
                    disabled={disabled || action.disabled}
                    aria-label={action.label}
                  >
                    <action.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

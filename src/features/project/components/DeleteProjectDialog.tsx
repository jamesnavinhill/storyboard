import React from "react";
import { AlertTriangle, X } from "lucide-react";

export interface DeleteProjectDialogProps {
  isOpen: boolean;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteProjectDialog component
 * Displays a warning dialog before permanently deleting a project
 * Uses modal pattern to block other interactions until resolved
 */
export const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  isOpen,
  projectName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  // Prevent clicks on backdrop from closing (require explicit action)
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Prevent clicks inside dialog from closing
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="bg-card border border-muted rounded-lg shadow-2xl max-w-md w-full mx-4"
        onClick={handleDialogClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-muted px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <h2
              id="delete-dialog-title"
              className="text-base font-semibold tracking-wide"
            >
              Delete Project
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="btn-base btn-ghost p-1.5"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{projectName}</span>?
          </p>
          <div className="bg-danger/10 border border-danger/20 rounded-md p-3">
            <p className="text-sm text-danger font-medium">
              This will permanently delete the project and all its scenes,
              images, and videos. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-muted px-4 py-3">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-base btn-ghost px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-base btn-danger px-4 py-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

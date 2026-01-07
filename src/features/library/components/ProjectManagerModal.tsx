import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import type { ProjectSummary } from "../../../types/services";
import { useAutosave } from "../../../hooks/useAutosave";

export interface ProjectManagerModalProps {
  mode: "create" | "edit";
  projectId?: string;
  initialData?: {
    name?: string;
    description?: string;
    imageUrl?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectMetadata) => Promise<void>;
}

export interface ProjectMetadata {
  name?: string;
  description?: string;
  image?: File;
}

/**
 * ProjectManagerModal component
 * Modal for creating and editing project metadata
 * Supports optional name, description, and image upload with preview
 * Matches styling of existing modals (EditModal, AnimateModal)
 * Implements autosave with debouncing for edit mode
 */
export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  mode,
  initialData,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [hasEdits, setHasEdits] = useState(false);

  // Track if this is the initial mount to prevent autosave on modal open
  const isInitialMount = useRef(true);

  // Autosave hook - only enabled in edit mode and after user makes edits
  const { isSaving, forceSave } = useAutosave({
    data: { name, description, image: imageFile },
    onSave: async (data) => {
      await onSave({
        name: data.name.trim() || undefined,
        description: data.description.trim() || undefined,
        image: data.image || undefined,
      });
    },
    delay: 2000, // 2 second delay for user inactivity
    enabled: mode === "edit" && hasEdits && !isInitialMount.current,
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setDescription(initialData?.description || "");
      setImageFile(null);
      setImagePreview(initialData?.imageUrl || null);
      setHasEdits(false);
      isInitialMount.current = true;
    }
  }, [isOpen, initialData]);

  // Mark as not initial mount after first render
  useEffect(() => {
    if (isOpen && isInitialMount.current) {
      // Use a small timeout to ensure we don't trigger on the initial data load
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Save pending changes when modal closes
  useEffect(() => {
    return () => {
      if (hasEdits && mode === "edit" && !isInitialMount.current) {
        forceSave();
      }
    };
  }, [hasEdits, mode, forceSave]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("Invalid file type. Please upload an image.");
      return;
    }

    setImageFile(file);
    setHasEdits(true);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setHasEdits(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasEdits(true);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
    setHasEdits(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const metadata: ProjectMetadata = {
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      image: imageFile || undefined,
    };

    await onSave(metadata);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  };

  const title = mode === "create" ? "New Project" : "Manage Project";

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content modal-centered">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="icon-btn"
            aria-label="Close"
          >
            <X className="icon-md" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name field */}
            <div className="mb-4">
              <label
                htmlFor="project-name"
                className="text-sm font-medium mb-2 block"
              >
                Project Name (optional)
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter project name..."
                disabled={isSaving}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--background)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>

            {/* Description field */}
            <div className="mb-4">
              <label
                htmlFor="project-description"
                className="text-sm font-medium mb-2 block"
              >
                Description (optional)
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Enter project description..."
                disabled={isSaving}
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                style={{
                  backgroundColor: "var(--background)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>

            {/* Image upload field */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Project Image (optional)
              </label>

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Project preview"
                    className="w-full rounded-lg"
                    style={{ maxHeight: "200px", objectFit: "contain" }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSaving}
                    className="absolute top-2 right-2 btn-base btn-danger p-2"
                    aria-label="Remove image"
                  >
                    <X className="icon-sm" />
                  </button>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted" />
                    <p className="text-sm text-muted">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isSaving}
                    className="hidden"
                    aria-label="Upload project image"
                  />
                </label>
              )}
            </div>

            {/* Saving indicator */}
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn-base btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-base btn-primary flex-1"
            >
              {isSaving ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { X, Palette, User, Music, FileText, File, Check } from "lucide-react";

export type FilePurpose =
  | "style-reference"
  | "character-reference"
  | "audio-reference"
  | "text-document"
  | "general-reference";

interface FilePurposeOption {
  id: FilePurpose;
  label: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
}

const FILE_PURPOSES: FilePurposeOption[] = [
  {
    id: "style-reference",
    label: "Style Reference",
    description: "Visual style, color palette, or aesthetic inspiration",
    icon: Palette,
    color: "text-purple-500",
  },
  {
    id: "character-reference",
    label: "Character Reference",
    description: "Character design, appearance, or personality",
    icon: User,
    color: "text-blue-500",
  },
  {
    id: "audio-reference",
    label: "Audio Reference",
    description: "Music, sound effects, or audio inspiration",
    icon: Music,
    color: "text-green-500",
  },
  {
    id: "text-document",
    label: "Text Document",
    description: "Script, notes, or written content",
    icon: FileText,
    color: "text-yellow-500",
  },
  {
    id: "general-reference",
    label: "General Reference",
    description: "Other reference material",
    icon: File,
    color: "text-gray-500",
  },
];

interface FilePurposeSelectorProps {
  fileId: string;
  fileName: string;
  currentPurpose: FilePurpose;
  onSelect: (fileId: string, purpose: FilePurpose) => void;
  onCancel: () => void;
}

export const FilePurposeSelector: React.FC<FilePurposeSelectorProps> = ({
  fileId,
  fileName,
  currentPurpose,
  onSelect,
  onCancel,
}) => {
  const [selectedPurpose, setSelectedPurpose] =
    useState<FilePurpose>(currentPurpose);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (selectedPurpose === currentPurpose) {
      onCancel();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purpose: selectedPurpose }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update file purpose");
      }

      onSelect(fileId, selectedPurpose);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update file purpose";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-muted rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold">Select File Purpose</h2>
            <p className="text-sm text-muted truncate mt-0.5" title={fileName}>
              {fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="btn-base btn-ghost p-1 ml-2 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Purpose options */}
        <div className="p-4 space-y-2">
          {FILE_PURPOSES.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedPurpose === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPurpose(option.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50 hover:bg-muted/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${option.color}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 pb-2">
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-muted">
          <button
            type="button"
            onClick={onCancel}
            className="btn-base btn-ghost px-4 py-2 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-base btn-primary px-4 py-2 text-sm"
            disabled={isSubmitting || selectedPurpose === currentPurpose}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

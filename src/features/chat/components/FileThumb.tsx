import React from "react";
import {
  X,
  GripVertical,
  Image,
  Video,
  Music,
  FileText,
  File,
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: string;
  uri?: string;
  inlineData?: string;
  thumbnail?: string;
}

interface FileThumbProps {
  file: UploadedFile;
  onDelete: (fileId: string) => void;
  onPurposeClick?: (fileId: string) => void;
  isDraggable?: boolean;
}

const PURPOSE_LABELS: Record<string, string> = {
  "style-reference": "Style",
  "character-reference": "Character",
  "audio-reference": "Audio",
  "text-document": "Document",
  "general-reference": "Reference",
};

const PURPOSE_COLORS: Record<string, string> = {
  "style-reference": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "character-reference": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "audio-reference": "bg-green-500/10 text-green-500 border-green-500/20",
  "text-document": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "general-reference": "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.startsWith("text/") || mimeType === "application/pdf")
    return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileThumb: React.FC<FileThumbProps> = ({
  file,
  onDelete,
  onPurposeClick,
  isDraggable = false,
}) => {
  const FileIcon = getFileIcon(file.mimeType);
  const purposeLabel = PURPOSE_LABELS[file.purpose] || file.purpose;
  const purposeColor =
    PURPOSE_COLORS[file.purpose] || PURPOSE_COLORS["general-reference"];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file.id);
  };

  const handlePurposeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPurposeClick) {
      onPurposeClick(file.id);
    }
  };

  return (
    <div className="relative group">
      <div className="card rounded-lg overflow-hidden border border-muted hover:border-primary/50 transition-colors">
        {/* Thumbnail or Icon */}
        <div className="relative bg-muted/20 aspect-video flex items-center justify-center">
          {file.thumbnail ? (
            <img
              src={file.thumbnail}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : file.mimeType.startsWith("image/") && file.inlineData ? (
            <img
              src={`data:${file.mimeType};base64,${file.inlineData}`}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileIcon className="w-8 h-8 text-muted" />
          )}

          {/* Drag handle */}
          {isDraggable && (
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
              <div className="bg-black/50 rounded p-0.5">
                <GripVertical className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* Delete button */}
          <button
            type="button"
            onClick={handleDelete}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-1"
            aria-label="Delete file"
            title="Delete file"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* File info */}
        <div className="p-2 space-y-1">
          <p className="text-xs font-medium truncate" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              {formatFileSize(file.size)}
            </span>
            <button
              type="button"
              onClick={handlePurposeClick}
              className={`text-xs px-2 py-0.5 rounded border ${purposeColor} hover:opacity-80 transition-opacity`}
              title="Change purpose"
            >
              {purposeLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { X, Download, FileText, FileJson } from "lucide-react";
import type { ExportFormat } from "../../../types/document";
import { useToast } from "../../../components/toast/useToast";

interface DocumentExportProps {
  projectId: string;
  onClose: () => void;
}

export const DocumentExport: React.FC<DocumentExportProps> = ({
  projectId,
  onClose,
}) => {
  const { show: showToast } = useToast();
  const [selectedFormat, setSelectedFormat] =
    useState<ExportFormat>("markdown");
  const [includeAssets, setIncludeAssets] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await fetch(
        `/api/projects/${projectId}/document/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            format: selectedFormat,
            includeAssets,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export document");
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `document.${selectedFormat}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast({
        variant: "success",
        description: "Document exported successfully",
      });

      onClose();
    } catch (error) {
      showToast({
        variant: "error",
        description:
          error instanceof Error ? error.message : "Failed to export document",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* Modal content */}
      <div
        className="modal-content modal-centered"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Export Document</h2>
          <button
            type="button"
            className="btn-base btn-ghost p-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body hide-scrollbar space-y-4">
          {/* Format Selection */}
          <div>
            <label className="form-label">Export Format</label>
            <div className="space-y-2">
              <FormatOption
                format="markdown"
                label="Markdown"
                description="Plain text with formatting"
                icon={<FileText className="w-5 h-5" />}
                selected={selectedFormat === "markdown"}
                onSelect={() => setSelectedFormat("markdown")}
              />
              <FormatOption
                format="pdf"
                label="PDF"
                description="Portable document format"
                icon={<FileText className="w-5 h-5" />}
                selected={selectedFormat === "pdf"}
                onSelect={() => setSelectedFormat("pdf")}
              />
              <FormatOption
                format="json"
                label="JSON"
                description="Structured data format"
                icon={<FileJson className="w-5 h-5" />}
                selected={selectedFormat === "json"}
                onSelect={() => setSelectedFormat("json")}
              />
            </div>
          </div>

          {/* Include Assets Option */}
          <div className="flex items-start gap-3 p-3 border border-muted rounded-lg">
            <input
              type="checkbox"
              id="include-assets"
              checked={includeAssets}
              onChange={(e) => setIncludeAssets(e.target.checked)}
              className="form-checkbox mt-1"
            />
            <label htmlFor="include-assets" className="flex-1 cursor-pointer">
              <div className="font-medium text-sm">Include Assets</div>
              <div className="form-help-text">
                Include generated images and videos in the export. If unchecked,
                only links will be included.
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-base btn-ghost"
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-base btn-soft-primary flex items-center gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FormatOptionProps {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}

const FormatOption: React.FC<FormatOptionProps> = ({
  format,
  label,
  description,
  icon,
  selected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      className={`w-full flex items-start gap-3 p-3 border rounded-lg transition-colors text-left ${
        selected
          ? "border-primary bg-primary/10"
          : "border-muted hover:border-primary/50"
      }`}
      onClick={onSelect}
    >
      <div className={selected ? "text-primary" : "text-muted"}>{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted mt-1">{description}</div>
      </div>
      <div className="mt-1">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            selected ? "border-primary" : "border-muted"
          }`}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-primary"></div>}
        </div>
      </div>
    </button>
  );
};

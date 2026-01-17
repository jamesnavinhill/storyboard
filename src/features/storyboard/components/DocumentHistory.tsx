import React, { useState, useEffect } from "react";
import { X, RotateCcw, Clock } from "lucide-react";
import type { ProjectDocument } from "../../../types/document";
import { useToast } from "../../../components/toast/useToast";

interface DocumentHistoryProps {
  projectId: string;
  onClose: () => void;
  onRestore: (document: ProjectDocument) => void;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  projectId,
  onClose,
  onRestore,
}) => {
  const { show: showToast } = useToast();
  const [history, setHistory] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/projects/${projectId}/document/history`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch document history");
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [projectId]);

  const handleRestore = async (version: number) => {
    try {
      setRestoring(version);

      const response = await fetch(
        `/api/projects/${projectId}/document/restore/${version}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to restore document version");
      }

      const data = await response.json();
      onRestore(data.document);

      showToast({
        variant: "success",
        description: `Restored to version ${version}`,
      });

      onClose();
    } catch (error) {
      showToast({
        variant: "error",
        description:
          error instanceof Error ? error.message : "Failed to restore document",
      });
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* Modal content */}
      <div
        className="modal-content"
        style={{ maxWidth: "48rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h2 className="modal-title">Document History</h2>
          </div>
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
        <div className="modal-body hide-scrollbar">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted">Loading history...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive">{error}</div>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted">No version history available</div>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="space-y-3">
              {history.map((doc, index) => (
                <VersionCard
                  key={doc.id}
                  document={doc}
                  isCurrent={index === 0}
                  onRestore={handleRestore}
                  restoring={restoring === doc.version}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-base btn-soft-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface VersionCardProps {
  document: ProjectDocument;
  isCurrent: boolean;
  onRestore: (version: number) => void;
  restoring: boolean;
  formatDate: (date: string) => string;
}

const VersionCard: React.FC<VersionCardProps> = ({
  document,
  isCurrent,
  onRestore,
  restoring,
  formatDate,
}) => {
  const [showDiff, setShowDiff] = useState(false);

  return (
    <div
      className={`history-item ${
        isCurrent ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="history-item-header">
            <span className="history-version">Version {document.version}</span>
            {isCurrent && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-primary text-primary bg-primary/10">
                Current
              </span>
            )}
          </div>
          <div className="history-timestamp mb-2">
            {formatDate(document.updatedAt)}
          </div>
          <div className="text-sm">
            <div className="text-muted">Title:</div>
            <div className="font-medium">{document.content.title}</div>
          </div>
          {document.content.scenes && document.content.scenes.length > 0 && (
            <div className="text-sm mt-2">
              <span className="text-muted">
                {document.content.scenes.length} scene
                {document.content.scenes.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {!isCurrent && (
          <button
            type="button"
            className="text-xs px-2 py-0.5 rounded-full border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1"
            onClick={() => onRestore(document.version)}
            disabled={restoring}
          >
            <RotateCcw className="w-3 h-3" />
            {restoring ? "Restoring..." : "Restore"}
          </button>
        )}
      </div>

      {/* Diff view toggle (placeholder for future enhancement) */}
      {!isCurrent && (
        <button
          type="button"
          className="text-xs text-primary hover:underline mt-2"
          onClick={() => setShowDiff(!showDiff)}
        >
          {showDiff ? "Hide" : "Show"} changes
        </button>
      )}

      {showDiff && (
        <div className="mt-3 p-3 bg-muted/20 rounded text-xs">
          <div className="text-muted">
            Diff view coming soon. This will show changes between versions.
          </div>
        </div>
      )}
    </div>
  );
};

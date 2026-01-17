import React, { useState } from "react";
import { DocumentViewer } from "./DocumentViewer";
import { DocumentEditor } from "./DocumentEditor";
import { DocumentExport } from "./DocumentExport";
import { DocumentHistory } from "./DocumentHistory";
import type { ProjectDocument } from "../../../types/document";

interface DocumentTabProps {
  projectId: string;
  onEdit?: () => void;
  onExport?: () => void;
  onHistory?: () => void;
}

type ViewMode = "view" | "edit";

export const DocumentTab: React.FC<DocumentTabProps> = ({
  projectId,
  onEdit: externalOnEdit,
  onExport: externalOnExport,
  onHistory: externalOnHistory,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("view");
  const [showExport, setShowExport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentDocument, setCurrentDocument] =
    useState<ProjectDocument | null>(null);

  const handleEdit = () => {
    setViewMode("edit");
    externalOnEdit?.();
  };

  const handleCancelEdit = () => {
    setViewMode("view");
  };

  const handleSave = (document: ProjectDocument) => {
    setCurrentDocument(document);
    setViewMode("view");
  };

  const handleExport = () => {
    setShowExport(true);
    externalOnExport?.();
  };

  const handleHistory = () => {
    setShowHistory(true);
    externalOnHistory?.();
  };

  const handleRestore = (document: ProjectDocument) => {
    setCurrentDocument(document);
    setShowHistory(false);
  };

  return (
    <>
      {/* Hidden trigger buttons for parent component to click */}
      <button
        id="document-edit-trigger"
        type="button"
        onClick={handleEdit}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <button
        id="document-export-trigger"
        type="button"
        onClick={handleExport}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <button
        id="document-history-trigger"
        type="button"
        onClick={handleHistory}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {viewMode === "view" ? (
        <DocumentViewer
          projectId={projectId}
          onEdit={handleEdit}
          onExport={handleExport}
          onHistory={handleHistory}
        />
      ) : (
        <DocumentEditor
          projectId={projectId}
          initialDocument={currentDocument}
          onCancel={handleCancelEdit}
          onSave={handleSave}
        />
      )}

      {showExport && (
        <DocumentExport
          projectId={projectId}
          onClose={() => setShowExport(false)}
        />
      )}

      {showHistory && (
        <DocumentHistory
          projectId={projectId}
          onClose={() => setShowHistory(false)}
          onRestore={handleRestore}
        />
      )}
    </>
  );
};

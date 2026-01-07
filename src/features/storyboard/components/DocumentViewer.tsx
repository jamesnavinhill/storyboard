import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Download,
  History,
} from "lucide-react";
import { useStoryboardStore } from "../state";
import type { ProjectDocument } from "../../../types/gemini-enhancement";

interface DocumentViewerProps {
  projectId: string;
  onEdit: () => void;
  onExport: () => void;
  onHistory: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  projectId,
  onEdit,
  onExport,
  onHistory,
}) => {
  const document = useStoryboardStore((state) => state.currentDocument);
  const isLoading = useStoryboardStore((state) => state.isDocumentLoading);
  const fetchDocument = useStoryboardStore((state) => state.fetchDocument);

  const [error, setError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setError(null);
        await fetchDocument(projectId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      }
    };
    void loadDocument();
  }, [projectId, fetchDocument]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const isSectionCollapsed = (sectionId: string) =>
    collapsedSections.has(sectionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-muted">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-muted mb-4">
          No document found for this project
        </div>
        <button type="button" className="btn-base btn-primary" onClick={onEdit}>
          Create Document
        </button>
      </div>
    );
  }

  const { content } = document;

  return (
    <div className="h-full flex flex-col">
      {/* Document Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
            {document.version > 1 && (
              <div className="text-sm text-muted">
                Version {document.version}
              </div>
            )}
          </div>

          {/* Style */}
          <Section
            title="Style"
            id="style"
            collapsed={isSectionCollapsed("style")}
            onToggle={() => toggleSection("style")}
          >
            <p className="text-foreground">{content.style}</p>
          </Section>

          {/* Goals */}
          {content.goals && content.goals.length > 0 && (
            <Section
              title="Goals"
              id="goals"
              collapsed={isSectionCollapsed("goals")}
              onToggle={() => toggleSection("goals")}
            >
              <ul className="list-disc list-inside space-y-1">
                {content.goals.map((goal, index) => (
                  <li key={index} className="text-foreground">
                    {goal}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Outline */}
          {content.outline && (
            <Section
              title="Outline"
              id="outline"
              collapsed={isSectionCollapsed("outline")}
              onToggle={() => toggleSection("outline")}
            >
              <div className="whitespace-pre-wrap text-foreground">
                {content.outline}
              </div>
            </Section>
          )}

          {/* Scenes */}
          {content.scenes && content.scenes.length > 0 && (
            <Section
              title={`Scenes (${content.scenes.length})`}
              id="scenes"
              collapsed={isSectionCollapsed("scenes")}
              onToggle={() => toggleSection("scenes")}
            >
              <div className="space-y-4">
                {content.scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    className="border border-muted rounded-lg p-4"
                  >
                    <h4 className="font-semibold mb-2">
                      Scene {scene.order}: {scene.title}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted">Description:</span>
                        <p className="text-foreground mt-1">
                          {scene.description}
                        </p>
                      </div>
                      {scene.imagePrompt && (
                        <div>
                          <span className="text-muted">Image Prompt:</span>
                          <p className="text-foreground mt-1 font-mono text-xs bg-muted/20 p-2 rounded">
                            {scene.imagePrompt}
                          </p>
                        </div>
                      )}
                      {scene.animationPrompt && (
                        <div>
                          <span className="text-muted">Animation Prompt:</span>
                          <p className="text-foreground mt-1 font-mono text-xs bg-muted/20 p-2 rounded">
                            {scene.animationPrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Metadata */}
          {content.metadata && (
            <Section
              title="Metadata"
              id="metadata"
              collapsed={isSectionCollapsed("metadata")}
              onToggle={() => toggleSection("metadata")}
            >
              <div className="space-y-2 text-sm">
                {content.metadata.workflow && (
                  <div>
                    <span className="text-muted">Workflow:</span>
                    <span className="text-foreground ml-2">
                      {content.metadata.workflow}
                    </span>
                  </div>
                )}
                {content.metadata.totalDuration > 0 && (
                  <div>
                    <span className="text-muted">Total Duration:</span>
                    <span className="text-foreground ml-2">
                      {content.metadata.totalDuration}s
                    </span>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  id: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title,
  id,
  collapsed,
  onToggle,
  children,
}) => {
  return (
    <div className="border border-muted rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={`section-${id}`}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {collapsed ? (
          <ChevronRight className="w-5 h-5 text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted" />
        )}
      </button>
      {!collapsed && (
        <div id={`section-${id}`} className="p-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
};

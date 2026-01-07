import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Save,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";
import type { DocumentContent, ProjectDocument } from "../../../types/document";
import { useToast } from "../../../components/toast/useToast";

interface DocumentEditorProps {
  projectId: string;
  initialDocument?: ProjectDocument | null;
  onCancel: () => void;
  onSave: (document: ProjectDocument) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  projectId,
  initialDocument,
  onCancel,
  onSave,
}) => {
  const { show: showToast } = useToast();
  const [content, setContent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize content from document
  useEffect(() => {
    if (initialDocument) {
      // Convert document content to HTML for Tiptap
      const html = documentContentToHtml(initialDocument.content);
      setContent(html);
    } else {
      // Default empty document
      setContent("<h1>Untitled Project</h1><p></p>");
    }
  }, [initialDocument]);

  // Auto-save functionality
  const saveDocument = useCallback(async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);

      // Convert HTML back to DocumentContent structure
      const documentContent = htmlToDocumentContent(content);

      const response = await fetch(`/api/projects/${projectId}/document`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: documentContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to save document");
      }

      const data = await response.json();
      setHasChanges(false);
      onSave(data.document);

      showToast({
        variant: "success",
        description: "Document saved successfully",
      });
    } catch (error) {
      showToast({
        variant: "error",
        description:
          error instanceof Error ? error.message : "Failed to save document",
      });
    } finally {
      setSaving(false);
    }
  }, [content, hasChanges, projectId, onSave, showToast]);

  // Handle content changes with auto-save debounce
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setHasChanges(true);

      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new auto-save timer (2 seconds after last change)
      autoSaveTimerRef.current = setTimeout(() => {
        saveDocument();
      }, 2000);
    },
    [saveDocument]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    await saveDocument();
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to cancel?"
      );
      if (!confirmed) return;
    }
    onCancel();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-muted">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-base btn-soft-primary flex items-center gap-2"
            onClick={handleManualSave}
            disabled={saving || !hasChanges}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="btn-base btn-outline flex items-center gap-2"
            onClick={handleCancel}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted">
          {saving && <span>Saving...</span>}
          {!saving && hasChanges && <span>Unsaved changes</span>}
          {!saving && !hasChanges && <span>All changes saved</span>}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            editable={true}
            placeholder="Start writing your project document..."
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Convert DocumentContent to HTML for Tiptap editor
 */
function documentContentToHtml(content: DocumentContent): string {
  let html = "";

  // Title
  html += `<h1>${escapeHtml(content.title)}</h1>`;

  // Style
  if (content.style) {
    html += `<h2>Style</h2><p>${escapeHtml(content.style)}</p>`;
  }

  // Goals
  if (content.goals && content.goals.length > 0) {
    html += `<h2>Goals</h2><ul>`;
    content.goals.forEach((goal) => {
      html += `<li>${escapeHtml(goal)}</li>`;
    });
    html += `</ul>`;
  }

  // Outline
  if (content.outline) {
    html += `<h2>Outline</h2><p>${escapeHtml(content.outline).replace(
      /\n/g,
      "<br>"
    )}</p>`;
  }

  // Scenes
  if (content.scenes && content.scenes.length > 0) {
    html += `<h2>Scenes</h2>`;
    content.scenes.forEach((scene) => {
      html += `<h3>Scene ${scene.order}: ${escapeHtml(scene.title)}</h3>`;
      html += `<p><strong>Description:</strong> ${escapeHtml(
        scene.description
      )}</p>`;
      if (scene.imagePrompt) {
        html += `<p><strong>Image Prompt:</strong></p><pre><code>${escapeHtml(
          scene.imagePrompt
        )}</code></pre>`;
      }
      if (scene.animationPrompt) {
        html += `<p><strong>Animation Prompt:</strong></p><pre><code>${escapeHtml(
          scene.animationPrompt
        )}</code></pre>`;
      }
    });
  }

  return html;
}

/**
 * Convert HTML from Tiptap editor back to DocumentContent structure
 * This is a simplified parser - in production you might want a more robust solution
 */
function htmlToDocumentContent(html: string): DocumentContent {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Extract title (first h1)
  const titleElement = doc.querySelector("h1");
  const title = titleElement?.textContent?.trim() || "Untitled";

  // Extract style (content after "Style" h2)
  const styleH2 = Array.from(doc.querySelectorAll("h2")).find(
    (h2) => h2.textContent?.trim() === "Style"
  );
  let style = "";
  if (styleH2) {
    let next = styleH2.nextElementSibling;
    while (next && next.tagName !== "H2") {
      style += next.textContent?.trim() + " ";
      next = next.nextElementSibling;
    }
  }

  // Extract goals (ul after "Goals" h2)
  const goalsH2 = Array.from(doc.querySelectorAll("h2")).find(
    (h2) => h2.textContent?.trim() === "Goals"
  );
  const goals: string[] = [];
  if (goalsH2) {
    const ul = goalsH2.nextElementSibling;
    if (ul && ul.tagName === "UL") {
      ul.querySelectorAll("li").forEach((li) => {
        const text = li.textContent?.trim();
        if (text) goals.push(text);
      });
    }
  }

  // Extract outline (content after "Outline" h2)
  const outlineH2 = Array.from(doc.querySelectorAll("h2")).find(
    (h2) => h2.textContent?.trim() === "Outline"
  );
  let outline = "";
  if (outlineH2) {
    let next = outlineH2.nextElementSibling;
    while (next && next.tagName !== "H2") {
      outline += next.textContent?.trim() + "\n";
      next = next.nextElementSibling;
    }
  }

  // Extract scenes (h3 elements after "Scenes" h2)
  const scenesH2 = Array.from(doc.querySelectorAll("h2")).find(
    (h2) => h2.textContent?.trim() === "Scenes"
  );
  const scenes: any[] = [];
  if (scenesH2) {
    let sceneIndex = 1;
    let next = scenesH2.nextElementSibling;
    while (next) {
      if (next.tagName === "H2") break;
      if (next.tagName === "H3") {
        const sceneTitle = next.textContent?.trim() || `Scene ${sceneIndex}`;
        const scene: any = {
          id: `scene-${sceneIndex}`,
          order: sceneIndex,
          title: sceneTitle.replace(/^Scene \d+:\s*/, ""),
          description: "",
          imagePrompt: "",
          animationPrompt: "",
          metadata: {},
        };

        // Extract scene content
        let sceneNext = next.nextElementSibling;
        while (
          sceneNext &&
          sceneNext.tagName !== "H3" &&
          sceneNext.tagName !== "H2"
        ) {
          const text = sceneNext.textContent?.trim() || "";
          if (text.startsWith("Description:")) {
            scene.description = text.replace("Description:", "").trim();
          } else if (text.startsWith("Image Prompt:")) {
            const codeBlock = sceneNext.nextElementSibling;
            if (codeBlock && codeBlock.tagName === "PRE") {
              scene.imagePrompt = codeBlock.textContent?.trim() || "";
            }
          } else if (text.startsWith("Animation Prompt:")) {
            const codeBlock = sceneNext.nextElementSibling;
            if (codeBlock && codeBlock.tagName === "PRE") {
              scene.animationPrompt = codeBlock.textContent?.trim() || "";
            }
          }
          sceneNext = sceneNext.nextElementSibling;
        }

        scenes.push(scene);
        sceneIndex++;
        next = sceneNext;
        continue;
      }
      next = next.nextElementSibling;
    }
  }

  return {
    title,
    style: style.trim(),
    goals,
    outline: outline.trim(),
    scenes,
    metadata: {
      workflow: "",
      systemInstruction: "",
      modelSettings: {},
      totalDuration: scenes.reduce(
        (sum, scene) => sum + (scene.metadata?.duration || 0),
        0
      ),
    },
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

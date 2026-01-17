import { useCallback, useMemo, useState } from "react";

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string[];
  stylePrompt: string;
  tested: boolean;
  examples?: string[];
  metadata?: {
    bestFor?: string[];
    avoid?: string[];
    recommendedWith?: string[];
  };
}

export interface UseStyleTemplateIntegrationOptions {
  projectId?: string | null;
}

export const useStyleTemplateIntegration = (
  options: UseStyleTemplateIntegrationOptions = {}
) => {
  const { projectId } = options;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/templates", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load style templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Failed to load style templates:", error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates]);

  const selectTemplate = useCallback((templateId: string | null) => {
    setSelectedTemplateId(templateId);
  }, []);

  const applyTemplateToPrompt = useCallback(
    (basePrompt: string, templateOverride?: StyleTemplate): string => {
      const template = templateOverride || selectedTemplate;
      if (!template) return basePrompt;

      return `${basePrompt}\n\nStyle: ${template.stylePrompt}`;
    },
    [selectedTemplate]
  );

  const applyTemplateToPrompts = useCallback(
    (basePrompts: string[], templateOverride?: StyleTemplate): string[] => {
      const template = templateOverride || selectedTemplate;
      if (!template) return basePrompts;

      return [...basePrompts, template.stylePrompt];
    },
    [selectedTemplate]
  );

  const getTemplateMetadata = useCallback(() => {
    if (!selectedTemplate) return null;

    return {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      stylePrompt: selectedTemplate.stylePrompt,
      appliedAt: new Date().toISOString(),
    };
  }, [selectedTemplate]);

  return {
    templates,
    selectedTemplate,
    selectedTemplateId,
    isLoading,
    loadTemplates,
    selectTemplate,
    applyTemplateToPrompt,
    applyTemplateToPrompts,
    getTemplateMetadata,
    hasTemplate: !!selectedTemplate,
  };
};

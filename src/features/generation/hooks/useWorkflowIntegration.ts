import { useCallback, useMemo } from "react";
import type { Settings } from "../../../types";

export interface WorkflowSubtype {
  id: string;
  name: string;
  description: string;
  instructionModifier: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  systemInstruction: string;
  subtypes?: WorkflowSubtype[];
}

export interface UseWorkflowIntegrationOptions {
  workflow: Settings["workflow"];
  selectedSubtype?: string;
}

// Default system instructions for built-in workflows
const DEFAULT_WORKFLOWS: Record<string, string> = {
  "music-video": `You are an expert music video director and creative consultant. Your role is to help create compelling visual narratives that complement music. Focus on:
- Visual storytelling that enhances the emotional impact of the music
- Dynamic camera movements and transitions
- Lighting and color palettes that match the mood
- Creative concepts that are both artistic and achievable
- Scene pacing that aligns with the music's rhythm and structure`,

  commercial: `You are an expert commercial director and advertising creative. Your role is to help create persuasive and engaging product commercials. Focus on:
- Clear product benefits and value propositions
- Emotional connections with the target audience
- Professional, polished visual presentation
- Strong calls-to-action
- Brand consistency and messaging`,

  social: `You are an expert social media content creator and viral video strategist. Your role is to help create engaging short-form content. Focus on:
- Attention-grabbing opening hooks
- Fast-paced, dynamic editing
- Trending formats and styles
- Platform-specific optimization
- Shareability and engagement potential`,

  explainer: `You are an expert explainer video producer and educational content creator. Your role is to help create clear, informative videos. Focus on:
- Breaking down complex concepts into simple steps
- Clear visual demonstrations and examples
- Logical flow and structure
- Engaging but professional tone
- Retention of key information`,
};

export const useWorkflowIntegration = (
  options: UseWorkflowIntegrationOptions
) => {
  const { workflow, selectedSubtype } = options;

  const getSystemInstruction = useCallback(
    (workflowKey: string, subtypeModifier?: string): string => {
      const baseInstruction = DEFAULT_WORKFLOWS[workflowKey] || "";

      if (subtypeModifier) {
        return `${baseInstruction}\n\n${subtypeModifier}`;
      }

      return baseInstruction;
    },
    []
  );

  const currentSystemInstruction = useMemo(() => {
    return getSystemInstruction(workflow, selectedSubtype);
  }, [workflow, selectedSubtype, getSystemInstruction]);

  const applyWorkflowToRequest = useCallback(
    <T extends { workflow?: string }>(
      request: T
    ): T & { systemInstruction: string } => {
      return {
        ...request,
        systemInstruction: currentSystemInstruction,
      };
    },
    [currentSystemInstruction]
  );

  return {
    currentSystemInstruction,
    getSystemInstruction,
    applyWorkflowToRequest,
  };
};

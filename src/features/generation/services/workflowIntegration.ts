/**
 * Workflow System Instructions Integration
 *
 * This service integrates workflow system instructions with AI generation:
 * - Applies workflow system instructions to chat
 * - Applies workflow system instructions to storyboard generation
 * - Appends subtype instruction modifiers
 * - Fetches workflows from backend API
 */

export interface Workflow {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category:
    | "music-video"
    | "commercial"
    | "social"
    | "explainer"
    | "custom"
    | "concept-art";
  systemInstruction: string;
  artStyle: string;
  examples?: string[];
  metadata: {
    targetDuration?: string;
    typicalSceneCount?: number;
    recommendedModels?: {
      text?: string;
      image?: string;
      video?: string;
    };
  };
}

export interface WorkflowSubtype {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  instructionModifier: string;
}

/**
 * Fetch all workflows from backend
 */
export const fetchWorkflows = async (): Promise<Workflow[]> => {
  const response = await fetch("/api/workflows");

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(new Error(error.error || "Failed to fetch workflows"), {
      statusCode: response.status,
      requestId: error.requestId,
      errorCode: error.errorCode,
      retryable: error.retryable ?? true,
    });
  }

  const data = await response.json();
  return data.workflows || [];
};

/**
 * Fetch workflow by ID
 */
export const fetchWorkflowById = async (
  workflowId: string
): Promise<Workflow | null> => {
  const response = await fetch(`/api/workflows/${workflowId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(new Error(error.error || "Failed to fetch workflow"), {
      statusCode: response.status,
      requestId: error.requestId,
      errorCode: error.errorCode,
      retryable: error.retryable ?? true,
    });
  }

  const data = await response.json();
  return data.workflow || null;
};

/**
 * Fetch subtypes for a workflow
 */
export const fetchWorkflowSubtypes = async (
  workflowId: string
): Promise<WorkflowSubtype[]> => {
  const response = await fetch(`/api/workflows/${workflowId}/subtypes`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to fetch workflow subtypes"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  const data = await response.json();
  return data.subtypes || [];
};

/**
 * Build complete system instruction from workflow and subtype
 */
export const buildSystemInstruction = (
  workflow: Workflow | null,
  subtype: WorkflowSubtype | null
): string => {
  if (!workflow) {
    return "";
  }

  let instruction = workflow.systemInstruction;

  // Append subtype modifier if present
  if (subtype && subtype.instructionModifier) {
    instruction += `\n\n${subtype.instructionModifier}`;
  }

  return instruction;
};

/**
 * Apply workflow to chat request
 */
export const applyChatWorkflow = async (
  prompt: string,
  history: Array<{ role: string; text: string }>,
  workflowId: string | null,
  subtypeId: string | null,
  chatModel: string,
  thinkingMode?: boolean
): Promise<string> => {
  let systemInstruction = "";

  if (workflowId) {
    const workflow = await fetchWorkflowById(workflowId);
    let subtype: WorkflowSubtype | null = null;

    if (subtypeId && workflow) {
      const subtypes = await fetchWorkflowSubtypes(workflowId);
      subtype = subtypes.find((s) => s.id === subtypeId) || null;
    }

    systemInstruction = buildSystemInstruction(workflow, subtype);
  }

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      history,
      chatModel,
      workflow: workflowId || undefined,
      systemInstruction: systemInstruction || undefined,
      thinkingMode,
      entryPoint: "agent:chat",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to generate chat response"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  const data = await response.json();
  return data.text || "";
};

/**
 * Apply workflow to storyboard generation
 */
export const applyStoryboardWorkflow = async (
  concept: string,
  sceneCount: number,
  workflowId: string | null,
  subtypeId: string | null
): Promise<any> => {
  let systemInstruction = "";

  if (workflowId) {
    const workflow = await fetchWorkflowById(workflowId);
    let subtype: WorkflowSubtype | null = null;

    if (subtypeId && workflow) {
      const subtypes = await fetchWorkflowSubtypes(workflowId);
      subtype = subtypes.find((s) => s.id === subtypeId) || null;
    }

    systemInstruction = buildSystemInstruction(workflow, subtype);
  }

  const response = await fetch("/api/ai/storyboard/enhanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept,
      sceneCount,
      workflow: workflowId || undefined,
      systemInstruction: systemInstruction || undefined,
      entryPoint: "agent:generate-enhanced",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to generate storyboard"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  return response.json();
};

/**
 * Get workflow recommendations based on concept
 */
export const getWorkflowRecommendations = async (
  concept: string
): Promise<Workflow[]> => {
  const workflows = await fetchWorkflows();

  // Simple keyword-based recommendations
  const conceptLower = concept.toLowerCase();

  const scored = workflows.map((workflow) => {
    let score = 0;

    // Check category keywords
    if (
      workflow.category === "music-video" &&
      (conceptLower.includes("music") || conceptLower.includes("song"))
    ) {
      score += 3;
    }
    if (
      workflow.category === "commercial" &&
      (conceptLower.includes("product") || conceptLower.includes("brand"))
    ) {
      score += 3;
    }
    if (
      workflow.category === "social" &&
      (conceptLower.includes("social") || conceptLower.includes("viral"))
    ) {
      score += 3;
    }
    if (
      workflow.category === "explainer" &&
      (conceptLower.includes("explain") || conceptLower.includes("tutorial"))
    ) {
      score += 3;
    }

    // Check description keywords
    if (
      workflow.description &&
      conceptLower.includes(workflow.description.toLowerCase())
    ) {
      score += 2;
    }

    return { workflow, score };
  });

  // Sort by score and return top 3
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.workflow);
};

/**
 * Cache for workflows to avoid repeated API calls
 */
let workflowCache: { workflows: Workflow[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedWorkflows = async (): Promise<Workflow[]> => {
  const now = Date.now();

  if (workflowCache && now - workflowCache.timestamp < CACHE_TTL) {
    return workflowCache.workflows;
  }

  const workflows = await fetchWorkflows();
  workflowCache = { workflows, timestamp: now };

  return workflows;
};

/**
 * Clear workflow cache (call after creating/updating/deleting workflows)
 */
export const clearWorkflowCache = (): void => {
  workflowCache = null;
};

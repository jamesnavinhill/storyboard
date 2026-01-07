# Generation Integration Services

This directory contains integration services that orchestrate the complete AI generation flow, connecting backend APIs with frontend features.

## Overview

The integration services implement the following flows:

1. **Storyboard Generation Flow** - Concept → Style Preview → Full Storyboard → Document
2. **File Upload Integration** - File Upload → Generation Context → AI Request
3. **Workflow Integration** - Workflow Selection → System Instructions → AI Request
4. **Style Template Integration** - Template Selection → Style Prompt → AI Request
5. **Document-Chat Integration** - Chat Messages → Document → Export

## Services

### 1. Storyboard Orchestration (`storyboardOrchestration.ts`)

Orchestrates the complete storyboard generation flow from concept to document.

**Key Functions:**

```typescript
// Generate 4 style preview scenes
const previews = await generateStylePreviews(concept, workflow);

// Generate full storyboard with selected style
const scenes = await generateEnhancedStoryboard(
  concept,
  sceneCount,
  workflow,
  systemInstruction,
  selectedStyleId
);

// Persist scenes and update document
const flow = createStoryboardGenerationFlow();
const persistedScenes = await flow.persistAndDocument(
  services,
  projectId,
  scenes,
  aspectRatio,
  concept,
  selectedStyle,
  workflow
);
```

**Usage Example:**

```typescript
import { createStoryboardGenerationFlow } from './storyboardOrchestration';

const flow = createStoryboardGenerationFlow();

// Step 1: Generate style previews
const previews = await flow.generatePreviews(concept, workflow);

// Step 2: User selects a style
const selectedStyleId = previews[0].id;

// Step 3: Generate full storyboard
const scenes = await flow.generateWithStyle(
  concept,
  sceneCount,
  workflow,
  selectedStyleId,
  systemInstruction
);

// Step 4: Persist and update document
const persistedScenes = await flow.persistAndDocument(
  services,
  projectId,
  scenes,
  aspectRatio,
  concept,
  selectedStyle,
  workflow
);
```

### 2. File Generation Integration (`fileGenerationIntegration.ts`)

Integrates uploaded files with AI generation requests.

**Key Functions:**

```typescript
// Build file context from uploaded files
const context = buildFileContext(uploadedFiles);

// Format file context for AI prompt
const promptAddition = formatFileContextForPrompt(context);

// Generate storyboard with files
const result = await generateStoryboardWithFiles(
  concept,
  sceneCount,
  workflow,
  uploadedFiles,
  systemInstruction
);

// Generate chat with files
const response = await generateChatWithFiles(
  prompt,
  history,
  uploadedFiles,
  chatModel,
  workflow,
  thinkingMode
);

// Validate file count (max 10)
const validation = validateFileCount(uploadedFiles);
```

**Usage Example:**

```typescript
import {
  buildFileContext,
  generateStoryboardWithFiles,
  validateFileCount,
} from './fileGenerationIntegration';

// Validate file count
const validation = validateFileCount(uploadedFiles);
if (!validation.valid) {
  showError(validation.error);
  return;
}

// Generate with files
const result = await generateStoryboardWithFiles(
  concept,
  sceneCount,
  workflow,
  uploadedFiles,
  systemInstruction
);
```

### 3. Workflow Integration (`workflowIntegration.ts`)

Integrates workflow system instructions with AI generation.

**Key Functions:**

```typescript
// Fetch all workflows
const workflows = await fetchWorkflows();

// Fetch workflow by ID
const workflow = await fetchWorkflowById(workflowId);

// Fetch workflow subtypes
const subtypes = await fetchWorkflowSubtypes(workflowId);

// Build complete system instruction
const instruction = buildSystemInstruction(workflow, subtype);

// Apply workflow to chat
const response = await applyChatWorkflow(
  prompt,
  history,
  workflowId,
  subtypeId,
  chatModel,
  thinkingMode
);

// Apply workflow to storyboard
const result = await applyStoryboardWorkflow(
  concept,
  sceneCount,
  workflowId,
  subtypeId
);

// Get workflow recommendations
const recommendations = await getWorkflowRecommendations(concept);

// Use cached workflows
const workflows = await getCachedWorkflows();
```

**Usage Example:**

```typescript
import {
  fetchWorkflows,
  buildSystemInstruction,
  applyChatWorkflow,
} from './workflowIntegration';

// Fetch workflows for dropdown
const workflows = await fetchWorkflows();

// User selects workflow and subtype
const selectedWorkflow = workflows[0];
const selectedSubtype = selectedWorkflow.subtypes[0];

// Build system instruction
const instruction = buildSystemInstruction(selectedWorkflow, selectedSubtype);

// Apply to chat
const response = await applyChatWorkflow(
  prompt,
  history,
  selectedWorkflow.id,
  selectedSubtype.id,
  chatModel,
  thinkingMode
);
```

### 4. Style Template Integration (`styleTemplateIntegration.ts`)

Integrates style templates with AI generation.

**Key Functions:**

```typescript
// Fetch all style templates
const templates = await fetchStyleTemplates();

// Fetch template by ID
const template = await fetchStyleTemplateById(templateId);

// Apply template to prompt
const enhancedPrompt = applyStyleTemplate(basePrompt, template);

// Generate image with template
const result = await generateImageWithTemplate(
  projectId,
  sceneId,
  description,
  aspectRatio,
  templateId,
  imageModel,
  workflow,
  thinkingMode
);

// Generate storyboard with template
const result = await generateStoryboardWithTemplate(
  concept,
  sceneCount,
  workflow,
  templateId,
  systemInstruction
);

// Track template usage
await trackTemplateUsage(projectId, templateId, templateName);

// Get template recommendations
const recommendations = await getTemplateRecommendations(workflowCategory);

// Use cached templates
const templates = await getCachedStyleTemplates();

// Project-level template management
const activeTemplateId = await getProjectActiveTemplate(projectId);
await setProjectActiveTemplate(projectId, templateId);
```

**Usage Example:**

```typescript
import {
  fetchStyleTemplates,
  generateImageWithTemplate,
  trackTemplateUsage,
} from './styleTemplateIntegration';

// Fetch templates for selection
const templates = await fetchStyleTemplates();

// User selects template
const selectedTemplate = templates[0];

// Generate image with template
const result = await generateImageWithTemplate(
  projectId,
  sceneId,
  description,
  aspectRatio,
  selectedTemplate.id,
  imageModel,
  workflow,
  thinkingMode
);

// Track usage
await trackTemplateUsage(projectId, selectedTemplate.id, selectedTemplate.name);
```

### 5. Document-Chat Integration (`documentChatIntegration.ts`)

Integrates chat messages with project documents.

**Key Functions:**

```typescript
// Fetch project document
const document = await fetchProjectDocument(projectId);

// Add single message to document
await addChatMessageToDocument(projectId, message);

// Add multiple messages to document
await addChatMessagesToDocument(projectId, messages);

// Check if message is in document
const isInDoc = await isMessageInDocument(projectId, messageText, messageRole);

// Get document chat history
const history = await getDocumentChatHistory(projectId);

// Clear document chat history
await clearDocumentChatHistory(projectId);

// Export chat history as markdown
const markdown = exportChatHistoryAsMarkdown(chatHistory);

// Smart section detection
const section = detectMessageSection(messageText);

// Add message to specific section
await addMessageToDocumentSection(projectId, message, section);

// Batch operations
const batchOps = createChatDocumentBatchOperations();
await batchOps.addMessages(projectId, messages);
await batchOps.removeMessages(projectId, [0, 2, 5]);
await batchOps.updateMessage(projectId, 3, newContent);
```

**Usage Example:**

```typescript
import {
  addChatMessageToDocument,
  getDocumentChatHistory,
  exportChatHistoryAsMarkdown,
} from './documentChatIntegration';

// Add chat message to document
await addChatMessageToDocument(projectId, {
  role: 'user',
  text: 'This is my concept...',
});

// Get chat history from document
const history = await getDocumentChatHistory(projectId);

// Export as markdown
const markdown = exportChatHistoryAsMarkdown(history);
downloadFile('chat-history.md', markdown);
```

## Complete Integration Example

Here's a complete example showing how all services work together:

```typescript
import {
  createStoryboardGenerationFlow,
  buildFileContext,
  validateFileCount,
  fetchWorkflows,
  buildSystemInstruction,
  fetchStyleTemplates,
  addChatMessageToDocument,
} from './index';

async function generateCompleteStoryboard(
  projectId: string,
  concept: string,
  uploadedFiles: UploadedFile[],
  workflowId: string,
  subtypeId: string,
  templateId: string
) {
  // 1. Validate files
  const fileValidation = validateFileCount(uploadedFiles);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error);
  }

  // 2. Fetch workflow and build system instruction
  const workflow = await fetchWorkflowById(workflowId);
  const subtypes = await fetchWorkflowSubtypes(workflowId);
  const subtype = subtypes.find((s) => s.id === subtypeId);
  const systemInstruction = buildSystemInstruction(workflow, subtype);

  // 3. Fetch style template
  const template = await fetchStyleTemplateById(templateId);

  // 4. Build file context
  const fileContext = buildFileContext(uploadedFiles);
  const filePromptAddition = formatFileContextForPrompt(fileContext);

  // 5. Enhance concept with file context and style
  const enhancedConcept = `${concept}${filePromptAddition}\n\nStyle: ${template.stylePrompt}`;

  // 6. Generate style previews
  const flow = createStoryboardGenerationFlow();
  const previews = await flow.generatePreviews(enhancedConcept, workflowId);

  // 7. User selects style (assume first one)
  const selectedStyleId = previews[0].id;

  // 8. Generate full storyboard
  const scenes = await flow.generateWithStyle(
    enhancedConcept,
    8,
    workflowId,
    selectedStyleId,
    systemInstruction
  );

  // 9. Persist and update document
  const persistedScenes = await flow.persistAndDocument(
    services,
    projectId,
    scenes,
    '16:9',
    concept,
    template.name,
    workflowId
  );

  // 10. Add to chat history
  await addChatMessageToDocument(projectId, {
    role: 'user',
    text: concept,
  });

  await addChatMessageToDocument(projectId, {
    role: 'model',
    text: `Generated ${scenes.length} scenes using ${workflow.name} workflow and ${template.name} style.`,
  });

  // 11. Track template usage
  await trackTemplateUsage(projectId, templateId, template.name);

  return persistedScenes;
}
```

## Error Handling

All services throw errors with the following structure:

```typescript
interface ApiError extends Error {
  statusCode: number;
  requestId?: string;
  errorCode?: string;
  retryable: boolean;
}
```

**Example Error Handling:**

```typescript
try {
  const result = await generateStoryboardWithFiles(
    concept,
    sceneCount,
    workflow,
    files,
    systemInstruction
  );
} catch (error) {
  const apiError = error as ApiError;
  
  console.error('Generation failed:', {
    message: apiError.message,
    statusCode: apiError.statusCode,
    requestId: apiError.requestId,
    errorCode: apiError.errorCode,
    retryable: apiError.retryable,
  });

  if (apiError.retryable) {
    // Show retry button
    showRetryButton();
  } else {
    // Show error message with request ID
    showError(`${apiError.message} (Request ID: ${apiError.requestId})`);
  }
}
```

## Caching

Workflows and style templates are cached for 5 minutes to reduce API calls:

```typescript
// Workflows cache
const workflows = await getCachedWorkflows(); // Uses cache if available
clearWorkflowCache(); // Clear after CRUD operations

// Templates cache
const templates = await getCachedStyleTemplates(); // Uses cache if available
clearTemplateCache(); // Clear after CRUD operations
```

## Best Practices

1. **Always validate file count** before generation (max 10 files)
2. **Use cached workflows and templates** to reduce API calls
3. **Handle errors gracefully** with proper error messages and retry options
4. **Track template usage** in project documents for history
5. **Add chat messages to document** for complete project documentation
6. **Clear caches** after creating/updating/deleting workflows or templates
7. **Use batch operations** for multiple document updates
8. **Provide request IDs** in error messages for debugging

## Testing

To test these services:

```typescript
// Mock fetch for testing
global.fetch = jest.fn();

// Test storyboard generation
const mockResponse = {
  scenes: [
    {
      description: 'Test scene',
      imagePrompt: 'Test prompt',
      animationPrompt: 'Test animation',
      metadata: { duration: 5 },
    },
  ],
};

(fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => mockResponse,
});

const scenes = await generateEnhancedStoryboard(
  'Test concept',
  1,
  'music-video'
);

expect(scenes).toEqual(mockResponse.scenes);
```

## Future Enhancements

- [ ] Add streaming support for storyboard generation
- [ ] Implement progress callbacks for long-running operations
- [ ] Add support for custom system instructions per generation
- [ ] Implement template versioning and history
- [ ] Add workflow analytics and usage tracking
- [ ] Support for batch file uploads
- [ ] Implement document diff and merge capabilities
- [ ] Add support for collaborative document editing

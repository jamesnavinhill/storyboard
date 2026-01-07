# Settings State Management

This directory contains Zustand store slices for managing workflows and style templates.

## Store Structure

The settings store is composed of two slices:

### WorkflowSlice (`workflowStore.ts`)

Manages workflow CRUD operations and subtype management:

- **State**: workflows list, loading state, cache
- **Operations**: 
  - `fetchWorkflows()` - Fetch all workflows with 5-minute cache
  - `createWorkflow()` - Create new workflow
  - `updateWorkflow()` - Update existing workflow
  - `deleteWorkflow()` - Delete workflow (cascades to subtypes)
  - `fetchSubtypes()` - Fetch subtypes for a workflow
  - `createSubtype()` - Create new subtype
  - `updateSubtype()` - Update existing subtype
  - `deleteSubtype()` - Delete subtype

### TemplateSlice (`templateStore.ts`)

Manages style template CRUD operations and active template tracking:

- **State**: templates list, loading state, cache, active template per project
- **Operations**:
  - `fetchTemplates()` - Fetch all templates with 5-minute cache
  - `createTemplate()` - Create new template
  - `updateTemplate()` - Update existing template
  - `deleteTemplate()` - Delete template
  - `setActiveTemplate()` - Set active template for a project
  - `getActiveTemplate()` - Get active template for a project
  - `clearActiveTemplate()` - Clear active template for a project

## Usage

```typescript
import { useSettingsStore } from './state';

function MyComponent() {
  const { workflows, fetchWorkflows, createWorkflow } = useSettingsStore();
  const { templates, fetchTemplates, setActiveTemplate } = useSettingsStore();
  
  // Use the store...
}
```

## Caching

Both slices implement 5-minute caching to reduce API calls:
- Cache is automatically used if data is fresh
- Use `force: true` parameter to bypass cache
- Cache is cleared on mutations (create/update/delete)

## Requirements

Implements requirements:
- 6.2, 6.3, 6.4, 6.7 (Workflow management)
- 7.2, 7.3, 7.7 (Template management)

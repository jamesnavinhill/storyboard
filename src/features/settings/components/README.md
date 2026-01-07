# Settings Components

This directory contains all settings-related UI components for the VibeBoard application, including workflow management, style templates, and model configuration.

## Components

### Core Settings

- **SettingsPanel** - Original settings panel with model selection and workflow options
- **EnhancedSettingsSheet** - Enhanced settings sheet with tabbed interface integrating all new features

### Workflow Management

- **WorkflowManager** - List and manage workflows with CRUD operations
- **WorkflowEditor** - Modal form for creating/editing workflows
- **SystemInstructionEditor** - Text editor for system instructions with character count and preview
- **SubtypeManager** - Manage workflow subtypes with instruction modifiers

### Style Templates

- **TemplateLibrary** - Grid view of style templates with filtering
- **TemplateEditor** - Modal form for creating/editing style templates
- **TemplateCard** - Card component displaying template information

## Usage

### Basic Integration

```tsx
import { EnhancedSettingsSheet } from '@/features/settings/components';

<EnhancedSettingsSheet
  isOpen={isSettingsOpen}
  activeTab="workflow"
  settings={settings}
  theme={theme}
  aspectRatio={aspectRatio}
  onClose={() => setIsSettingsOpen(false)}
  onTabChange={setActiveTab}
  onSettingsChange={handleSettingsChange}
  onToggleTheme={toggleTheme}
  onAspectRatioChange={setAspectRatio}
/>
```

### Workflow Management

```tsx
import { WorkflowManager, WorkflowEditor } from '@/features/settings/components';

// List workflows
<WorkflowManager
  onCreate={() => setIsCreating(true)}
  onEdit={(workflow) => setEditingWorkflow(workflow)}
  onDelete={(id) => handleDelete(id)}
/>

// Edit workflow
<WorkflowEditor
  workflow={editingWorkflow}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

### Template Management

```tsx
import { TemplateLibrary, TemplateEditor } from '@/features/settings/components';

// Browse templates
<TemplateLibrary
  activeTemplateId={activeId}
  onSelect={handleSelect}
  onCreate={() => setIsCreating(true)}
  onEdit={(template) => setEditingTemplate(template)}
  onDelete={(id) => handleDelete(id)}
/>

// Edit template
<TemplateEditor
  template={editingTemplate}
  onSave={handleSave}
  onCancel={handleCancel}
  onTest={handleTest}
/>
```

## API Integration

All components integrate with the following API endpoints:

- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `GET /api/workflows/:id/subtypes` - List subtypes
- `POST /api/workflows/:id/subtypes` - Create subtype
- `PUT /api/subtypes/:id` - Update subtype
- `DELETE /api/subtypes/:id` - Delete subtype
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

## Styling

All components use the existing design system with:
- Consistent button styles (`btn-soft-primary`, `btn-outline`, etc.)
- Standard spacing and typography
- Responsive grid layouts
- Accessible form controls
- Proper ARIA labels

## Features

### Workflow Management
- Create, edit, and delete workflows
- Categorize workflows (music-video, commercial, social, explainer, custom)
- Define system instructions for AI behavior
- Manage workflow subtypes with instruction modifiers
- Search and filter workflows by category

### Style Templates
- Create, edit, and delete style templates
- Organize templates by categories
- Mark templates as "tested"
- Preview template thumbnails
- Search and filter templates
- Select active template for project

### Settings
- Model selection for text, image, and video generation
- Thinking mode toggle for complex tasks
- Scene count and aspect ratio configuration
- Video autoplay preferences
- Theme toggle

## Module Boundaries

These components follow the feature-first architecture:
- No imports from other features (except app-shell)
- Use shared UI components from `src/ui/`
- Use shared hooks from `src/hooks/`
- Export types for external use

## Accessibility

All components include:
- Proper ARIA labels for icon-only buttons
- Keyboard navigation support
- Screen reader friendly markup
- Focus management in modals
- Semantic HTML structure

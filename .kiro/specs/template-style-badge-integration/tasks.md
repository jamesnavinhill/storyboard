# Implementation Plan

- [x] 1. Create TemplateBadge component

  - Create new component file at `src/features/chat/components/TemplateBadge.tsx`
  - Implement component with templateName and onRemove props
  - Apply pink color scheme styling (bg-pink-500/20, border-pink-500/40, text-pink-300)
  - Add X button with hover state for removal
  - Include accessibility attributes (role="status", aria-label)
  - Add text truncation for long template names
  - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.3_

- [x] 2. Update ChatPanel component state and logic

- [x] 2.1 Add template state management

  - Add `selectedTemplateId` state (string | null)
  - Add `selectedTemplate` state (StyleTemplate | null)
  - Implement `fetchTemplateById` function to fetch template details from `/api/templates/:id`
  - Add useEffect to fetch template when selectedTemplateId changes
  - _Requirements: 1.1, 3.1, 3.2_

- [x] 2.2 Implement template selection and removal handlers

  - Modify `handleTemplateSelect` to toggle template selection (select/deselect)
  - Implement `handleTemplateRemove` to clear template state
  - Update StylePresetsMenu integration to use new handler
  - _Requirements: 1.4, 4.2, 4.4, 4.5_

- [x] 2.3 Integrate TemplateBadge into ChatPanel UI

  - Import TemplateBadge component
  - Add conditional rendering in composer-bottom section
  - Position badge between paintbrush button and settings button
  - Pass selectedTemplate.name and handleTemplateRemove as props
  - Ensure responsive layout on mobile view
  - _Requirements: 1.1, 1.3, 1.5_
-

- [x] 3. Update backend image generation endpoint

- [x] 3.1 Modify validation schema

  - Update `aiGenerateImageSchema` in `server/validation.ts`
  - Add optional `templateId` field (z.string().optional())
  - _Requirements: 2.1, 3.4_

- [x] 3.2 Update image generation route handler

  - Modify `/api/ai/image` endpoint in `server/routes/ai.ts`
  - Import `getStyleTemplateById` from templateStore
  - Fetch template when templateId is provided in request
  - Extract stylePrompt from template
  - Combine template stylePrompt with existing stylePrompts array
  - Pass combined stylePrompts to generateSceneImage
  - Add templateId to telemetry metadata
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Update frontend image generation API calls

  - Locate image generation API call in the codebase (likely in scene generation feature)
  - Add templateId parameter to the API request payload
  - Pass selectedTemplateId from ChatPanel context to generation function
  - Ensure templateId is included when template is selected
  - _Requirements: 2.1, 2.4, 3.4_

- [x] 5. Handle edge cases and error scenarios

  - Add error handling in fetchTemplateById (log and set null on failure)
  - Handle null template in backend gracefully (proceed without stylePrompt)
  - Ensure template selection persists across chat modes
  - Verify template clears on component unmount (session-only persistence)
  - _Requirements: 2.5, 3.3, 3.5_

- [x] 6. Add CSS styling



  - Create or update CSS file with template-badge styles
  - Define .template-badge class with pink color scheme
  - Define .template-badge-remove class with hover effects
  - Ensure styles are responsive and accessible
  - _Requirements: 1.2, 4.3_
- [x] 7. Write component tests

- [x] 7. Write component tests
  - Write unit tests for TemplateBadge component
  - Test rendering with template name
  - Test onRemove callback invocation
  - Test styling classes applied correctly
  - Write tests for ChatPanel template state management
  - Test template fetch on selection
  - Test template removal
  - Test toggle behavior (select/deselect)
  - _Requirements: All_

- [x] 8. Write integration tests



  - Test image generation without template (baseline)
  - Test image generation with template includes stylePrompt
  - Test multiple stylePrompts combined with template
  - Test invalid templateId handled gracefully
  - Mock API responses for template fetch and image generation
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

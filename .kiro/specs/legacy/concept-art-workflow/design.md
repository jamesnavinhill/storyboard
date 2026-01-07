# Design Document

## Overview

This design extends the StoryBoard application to support concept art workflows, beginning with album art generation. The implementation adds "concept-art" as a new workflow category alongside existing categories (music-video, commercial, social, explainer, custom), and introduces "album-art" as the first subtype. Additionally, the design extends the aspect ratio system to support 1:1 (square) format, which is essential for album covers and other square-format concept art.

The design follows the existing workflow architecture pattern, leveraging the current workflows and workflow_subtypes tables, validation schemas, API routes, and database stores. The changes are minimal and focused, ensuring consistency with the established codebase patterns.

## Architecture

### System Components

The feature touches the following layers of the application:

1. **Database Layer**: Schema updates to support new workflow category and aspect ratio
2. **Validation Layer**: Zod schema updates for type safety
3. **Type System**: TypeScript type definitions for compile-time safety
4. **Data Access Layer**: No changes needed (existing stores support the new category)
5. **API Layer**: No changes needed (existing routes support the new category)
6. **Migration Layer**: New migration for seeding concept art workflow data

### Data Flow

```
User selects Concept Art workflow
    ↓
Frontend validates with updated Zod schema (includes "concept-art")
    ↓
API receives request (existing routes handle new category)
    ↓
Database stores workflow with category="concept-art"
    ↓
AI generation uses concept-art system instructions
    ↓
User selects 1:1 aspect ratio for scene
    ↓
Image generation service receives square format specification
```

## Components and Interfaces

### 1. Type System Updates

**File**: `server/types.ts`

Update the `AspectRatio` type to include 1:1:

```typescript
export type AspectRatio = "16:9" | "9:16" | "1:1";
```

This change propagates through all interfaces that use `AspectRatio`, including:
- `Scene` interface (already uses the type)
- Any validation or API schemas

### 2. Validation Schema Updates

**File**: `server/validation.ts`

Update multiple Zod schemas to include the new values:

#### Workflow Category Schema
```typescript
export const workflowCategorySchema = z.enum([
  "music-video",
  "commercial",
  "social",
  "explainer",
  "custom",
  "concept-art", // NEW
] as const);
```

#### Aspect Ratio Schemas
Update all aspect ratio validations to include "1:1":

```typescript
// In createScenesSchema
aspectRatio: z.enum(["16:9", "9:16", "1:1"] as const),

// In updateSceneSchema
aspectRatio: z.enum(["16:9", "9:16", "1:1"] as const).optional(),

// In aiGenerateImageSchema
aspectRatio: z.enum(["16:9", "9:16", "1:1"] as const),

// In aiGenerateVideoSchema
aspectRatio: z.enum(["16:9", "9:16", "1:1"] as const),
```

**Note**: The `workflowSchema` (used for settings and AI requests) is separate from `workflowCategorySchema`. It uses hardcoded workflow identifiers rather than categories. This schema may need updates depending on how the frontend passes workflow information to AI endpoints. This should be investigated during implementation.

### 3. Database Schema Updates

**File**: `server/migrations/005_workflows.sql` (reference only - not modified)

The existing workflows table already supports any category value through its CHECK constraint. The constraint needs to be updated to include "concept-art":

```sql
category TEXT NOT NULL CHECK (category IN ('music-video', 'commercial', 'social', 'explainer', 'custom', 'concept-art'))
```

However, SQLite does not support ALTER TABLE to modify CHECK constraints. The migration strategy is:

**Option A** (Recommended): Create a new migration that recreates the table with the updated constraint
**Option B**: Accept that the CHECK constraint is not enforced for "concept-art" (SQLite will still store the value)

For this implementation, we'll use **Option B** since the validation layer (Zod schemas) provides the primary enforcement, and the database will accept the value even without updating the CHECK constraint.

### 4. Seed Data Migration

**File**: `server/migrations/012_seed_concept_art_workflow.sql` (new file)

Create a new migration to seed the concept art workflow and album art subtype:

```sql
PRAGMA foreign_keys = ON;

-- Concept Art Workflow
INSERT INTO workflows (id, name, description, category, system_instruction, art_style, examples, metadata)
VALUES (
  'workflow_concept_art',
  'Concept Art',
  'Create compelling concept art for albums, games, films, and other creative projects with AI-optimized prompts for visual impact and composition.',
  'concept-art',
  'You are an expert concept artist specializing in creating striking visual concepts for creative projects. Create scenes that:
- Focus on strong composition and visual hierarchy
- Consider how text, titles, or typography might be integrated
- Use bold, eye-catching color palettes that work across different contexts
- Create memorable, iconic imagery that captures essence and mood
- Balance detail with clarity - images should read well at various sizes
- Consider the target medium and viewing context (digital, print, small thumbnails)
- Use lighting and atmosphere to create mood and emotional impact
- Incorporate symbolism and visual metaphors relevant to the concept
- Create designs that stand out and are immediately recognizable
- Think about how the image will be used and what it needs to communicate',
  'Bold, iconic, compositionally strong, visually striking',
  '["Album covers by Storm Thorgerson", "Movie poster concept art", "Game cover art"]',
  '{"typicalSceneCount": 5, "recommendedModels": {"text": "gemini-2.5-flash", "image": "imagen-4.0-generate-001"}, "recommendedAspectRatio": "1:1"}'
);

-- Album Art Subtype
INSERT INTO workflow_subtypes (id, workflow_id, name, description, instruction_modifier)
VALUES (
  'subtype_concept_album_art',
  'workflow_concept_art',
  'Album Art',
  'Specialized for album cover design with focus on music genre, artist identity, and typography space',
  'Focus specifically on album cover design. Consider:
- Music genre conventions and how to honor or subvert them
- Artist or band identity and visual branding
- Space for album title and artist name (typically top or bottom third)
- How the design works as both a large format (vinyl) and small thumbnail (streaming)
- Color psychology and emotional resonance with the music
- Creating a design that represents the album''s themes and mood
- Balance between artistic expression and commercial appeal
- Typography integration - leave clear areas for text placement
- Consider the album as part of an artist''s visual catalog
- Create something fans will want to display and share'
);
```

### 5. Store Layer

**Files**: `server/stores/workflowStore.ts`, `server/stores/templateStore.ts`

**No changes required**. The existing store implementations are category-agnostic and will handle "concept-art" without modification. The TypeScript types will be updated automatically when the `Workflow` interface is regenerated from the updated category type.

### 6. Route Layer

**Files**: `server/routes/workflows.ts`, `server/routes/templates.ts`

**No changes required**. The existing API routes are category-agnostic and will handle "concept-art" through the updated validation schemas.

### 7. Frontend Integration Points

While this spec focuses on backend changes, the frontend will need updates in:

**Type Definitions** (`src/types.ts` or feature-specific types):
- Update `AspectRatio` type to include "1:1"
- Update workflow category types to include "concept-art"

**UI Components**:
- Aspect ratio selector: Add 1:1 option to dropdown/radio buttons
- Workflow selector: Display concept art workflow option
- Scene settings: Support 1:1 aspect ratio selection

**State Management**:
- Update any Zustand stores that validate or filter by aspect ratio
- Update workflow-related state to handle concept-art category

## Data Models

### Updated Type Definitions

```typescript
// server/types.ts
export type AspectRatio = "16:9" | "9:16" | "1:1";

// server/stores/workflowStore.ts (type inference from validation)
export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: "music-video" | "commercial" | "social" | "explainer" | "custom" | "concept-art";
  systemInstruction: string;
  artStyle: string | null;
  examples: string[] | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
```

### Database Schema (Reference)

The existing schema supports the new data without structural changes:

```sql
-- workflows table (existing)
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT NOT NULL, -- Will store "concept-art"
  system_instruction TEXT NOT NULL,
  art_style TEXT,
  examples TEXT, -- JSON array
  metadata TEXT, -- JSON object
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- workflow_subtypes table (existing)
CREATE TABLE workflow_subtypes (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instruction_modifier TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- scenes table (existing)
CREATE TABLE scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  description TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL, -- Will store "1:1"
  order_index INTEGER NOT NULL,
  primary_image_asset_id TEXT,
  primary_video_asset_id TEXT,
  duration INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

## Error Handling

### Validation Errors

**Scenario**: API receives invalid workflow category or aspect ratio

**Handling**:
- Zod validation catches invalid values before database operations
- Returns 400 Bad Request with detailed error message
- Error response format (existing pattern):
  ```json
  {
    "error": "Invalid request payload",
    "details": {
      "fieldErrors": {
        "category": ["Invalid enum value. Expected 'music-video' | 'commercial' | 'social' | 'explainer' | 'custom' | 'concept-art', received 'invalid'"]
      }
    },
    "retryable": false
  }
  ```

### Database Constraint Violations

**Scenario**: Database CHECK constraint rejects "concept-art" (if constraint is not updated)

**Handling**:
- Unlikely to occur since Zod validation happens first
- If it occurs, returns 500 Internal Server Error
- Error is logged server-side for investigation
- Frontend shows generic error message with retry option

### AI Generation with 1:1 Aspect Ratio

**Scenario**: AI image/video generation service doesn't support 1:1 aspect ratio

**Handling**:
- Validate aspect ratio support per model in AI service layer
- Return clear error message if model doesn't support 1:1
- Suggest alternative aspect ratios or models
- Log unsupported combinations for future reference

## Testing Strategy

### Unit Tests

**Validation Schema Tests** (`server/validation.test.ts` - new or extended):
- Test `workflowCategorySchema` accepts "concept-art"
- Test `workflowCategorySchema` rejects invalid categories
- Test aspect ratio schemas accept "1:1"
- Test aspect ratio schemas reject invalid ratios
- Test all schemas that use aspect ratio (createScenes, updateScene, aiGenerateImage, aiGenerateVideo)

**Store Tests** (`server/stores/workflowStore.test.ts` - extended):
- Test creating workflow with category="concept-art"
- Test listing workflows filtered by category="concept-art"
- Test creating workflow subtype for concept art workflow
- Test workflow with 1:1 aspect ratio in metadata

### Integration Tests

**API Endpoint Tests** (`server/routes/workflows.test.ts` - extended):
- Test POST /api/workflows with concept-art category
- Test GET /api/workflows?category=concept-art
- Test POST /api/workflows/:id/subtypes for concept art workflow
- Test validation errors for invalid categories

**Scene API Tests** (`server/routes/projects.test.ts` or `scenes.test.ts` - extended):
- Test creating scene with aspectRatio="1:1"
- Test updating scene to aspectRatio="1:1"
- Test validation errors for invalid aspect ratios

**AI Generation Tests** (`server/routes/ai.test.ts` - extended):
- Test image generation with aspectRatio="1:1"
- Test video generation with aspectRatio="1:1" (if supported)
- Test that concept-art workflow instructions are applied correctly

### Database Migration Tests

**Migration Test** (`server/migrations/runMigrations.test.ts` - extended):
- Test migration 012 runs successfully
- Test concept art workflow is seeded with correct data
- Test album art subtype is seeded and linked to concept art workflow
- Test querying seeded data returns expected results

### Manual Testing Checklist

1. **Workflow Creation**:
   - Create new concept art workflow via API
   - Verify it appears in workflow list
   - Filter workflows by concept-art category

2. **Subtype Management**:
   - Create album art subtype for concept art workflow
   - Verify subtype appears in workflow subtypes list
   - Update and delete subtypes

3. **Scene Creation with 1:1**:
   - Create scene with 1:1 aspect ratio
   - Verify scene is stored correctly
   - Update scene aspect ratio to 1:1

4. **AI Generation**:
   - Generate image with concept art workflow and 1:1 aspect ratio
   - Verify AI receives correct system instructions
   - Verify generated image has correct aspect ratio

5. **Frontend Integration**:
   - Select concept art workflow in UI
   - Select 1:1 aspect ratio in scene settings
   - Generate album art with appropriate prompts

## Implementation Notes

### Migration Strategy

1. Create migration 012 for seeding concept art workflow
2. Run migration on development database
3. Test workflow and subtype creation
4. Verify data integrity and relationships

### Backward Compatibility

- Existing workflows and scenes are unaffected
- New aspect ratio is additive (doesn't break existing 16:9 or 9:16 scenes)
- API remains backward compatible (existing clients can continue using old categories/ratios)

### Future Extensibility

This design supports easy addition of:
- More concept art subtypes (game art, movie posters, book covers, etc.)
- Additional aspect ratios (4:3, 2:1, etc.)
- More workflow categories following the same pattern

### Performance Considerations

- No performance impact on existing queries
- Category filtering uses existing index on workflows.category
- Aspect ratio is stored as text (no additional indexing needed)

### Security Considerations

- Validation layer prevents injection of invalid categories or aspect ratios
- No new security vulnerabilities introduced
- Existing authentication and authorization apply to new workflow category

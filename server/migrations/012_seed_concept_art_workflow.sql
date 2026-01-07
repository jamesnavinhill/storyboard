PRAGMA foreign_keys = ON;

-- Seed data migration for concept art workflow
-- Adds support for concept art generation with album art as the initial subtype

-- ============================================================================
-- CONCEPT ART WORKFLOW
-- ============================================================================

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

-- ============================================================================
-- CONCEPT ART SUBTYPES
-- ============================================================================

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

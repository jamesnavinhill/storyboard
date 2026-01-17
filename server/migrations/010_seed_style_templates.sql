PRAGMA foreign_keys = ON;

-- Seed data migration for default style templates
-- Provides 15 pre-configured professional style templates with tested prompts

-- ============================================================================
-- CINEMATIC STYLES
-- ============================================================================

-- Cinematic Film Noir
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_cinematic_noir',
  'Cinematic Film Noir',
  'Classic film noir aesthetic with high contrast black and white, dramatic shadows, and moody atmosphere',
  '["cinematic", "dramatic", "black-and-white"]',
  'Cinematic film noir style. High contrast black and white photography. Deep shadows and dramatic lighting. Venetian blind shadows. Rain-slicked streets. Moody atmosphere. 1940s aesthetic. Chiaroscuro lighting. Film grain texture. Low-key lighting with strong shadows.',
  1,
  '["Blade Runner noir scenes", "The Third Man cinematography", "Sin City visual style"]',
  '{"bestFor": ["dramatic narratives", "mystery content", "atmospheric scenes"], "avoid": ["bright cheerful content", "colorful products"], "recommendedWith": ["Music Video: Narrative", "Commercial: Emotional Brand Story"]}'
);

-- Cinematic Golden Hour
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_cinematic_golden',
  'Cinematic Golden Hour',
  'Warm, glowing cinematography with golden hour lighting and dreamy atmosphere',
  '["cinematic", "warm", "natural"]',
  'Cinematic golden hour style. Warm golden sunlight. Soft glowing highlights. Lens flares. Dreamy atmosphere. Rich warm color palette with oranges and golds. Shallow depth of field. Anamorphic lens aesthetic. Hazy atmospheric glow. Backlit subjects with rim lighting.',
  1,
  '["Terrence Malick films", "Emmanuel Lubezki cinematography", "Golden hour commercials"]',
  '{"bestFor": ["lifestyle content", "emotional narratives", "outdoor scenes"], "avoid": ["indoor technical demos", "high-energy content"], "recommendedWith": ["Commercial: Lifestyle Brand", "Music Video: Narrative"]}'
);

-- Cinematic Sci-Fi
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_cinematic_scifi',
  'Cinematic Sci-Fi',
  'Futuristic science fiction aesthetic with cool tones, neon accents, and technological atmosphere',
  '["cinematic", "futuristic", "tech"]',
  'Cinematic science fiction style. Cool blue and cyan color palette. Neon accent lighting in pink and blue. Sleek futuristic environments. Holographic UI elements. Lens flares and light streaks. High-tech atmosphere. Clean modern compositions. Volumetric lighting and fog. Cyberpunk influences.',
  1,
  '["Blade Runner 2049", "Tron Legacy", "Ghost in the Shell"]',
  '{"bestFor": ["tech products", "futuristic concepts", "innovative brands"], "avoid": ["traditional content", "rustic themes"], "recommendedWith": ["Commercial: Product Feature", "Explainer: Animated Concept"]}'
);

-- ============================================================================
-- VIBRANT & COLORFUL STYLES
-- ============================================================================

-- Vibrant Pop Art
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_vibrant_pop',
  'Vibrant Pop Art',
  'Bold, saturated colors with pop art influences and high-energy visual impact',
  '["vibrant", "colorful", "bold"]',
  'Vibrant pop art style. Bold saturated colors. High contrast. Graphic design elements. Comic book influences. Halftone patterns. Strong outlines. Primary color palette with bright accents. Flat graphic shapes. Dynamic compositions. Roy Lichtenstein and Andy Warhol inspired.',
  1,
  '["Pop art music videos", "Colorful brand campaigns", "Graphic design aesthetics"]',
  '{"bestFor": ["energetic content", "youth-focused brands", "social media"], "avoid": ["serious corporate content", "subtle messaging"], "recommendedWith": ["Social: Fast-Paced Trending", "Music Video: Performance"]}'
);

-- Vibrant Neon Dreams
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_vibrant_neon',
  'Vibrant Neon Dreams',
  'Electric neon colors with glowing effects and nighttime urban energy',
  '["vibrant", "neon", "urban"]',
  'Vibrant neon dreams style. Electric neon colors - hot pink, cyan, purple, lime green. Glowing neon signs and lights. Dark backgrounds with bright neon accents. Urban nighttime atmosphere. Light reflections on wet surfaces. Bokeh effects. Cyberpunk color palette. High saturation. Glowing edges and halos.',
  1,
  '["Neon-lit music videos", "Urban nightlife content", "Tech product launches"]',
  '{"bestFor": ["nightlife content", "urban scenes", "tech products"], "avoid": ["daytime outdoor scenes", "natural settings"], "recommendedWith": ["Music Video: Performance", "Social: Fast-Paced Trending"]}'
);

-- Vibrant Pastel Candy
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_vibrant_pastel',
  'Vibrant Pastel Candy',
  'Soft pastel colors with whimsical, dreamy aesthetic and playful energy',
  '["vibrant", "pastel", "playful"]',
  'Vibrant pastel candy style. Soft pastel colors - baby pink, mint green, lavender, peach. Dreamy whimsical atmosphere. Cotton candy aesthetics. Soft lighting with gentle highlights. Playful compositions. Kawaii influences. Smooth gradients. Ethereal glow. Cheerful and optimistic mood.',
  1,
  '["Pastel aesthetic content", "Beauty and lifestyle brands", "Whimsical narratives"]',
  '{"bestFor": ["beauty products", "lifestyle content", "playful brands"], "avoid": ["serious corporate content", "dark themes"], "recommendedWith": ["Commercial: Lifestyle Brand", "Social: Tutorial/How-To"]}'
);

-- ============================================================================
-- MINIMALIST & CLEAN STYLES
-- ============================================================================

-- Minimalist Modern
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_minimal_modern',
  'Minimalist Modern',
  'Clean, minimal aesthetic with simple compositions and sophisticated restraint',
  '["minimalist", "clean", "modern"]',
  'Minimalist modern style. Clean simple compositions. Lots of negative space. Neutral color palette - white, black, gray with single accent color. Geometric shapes. Simple elegant typography. Soft even lighting. Uncluttered environments. Scandinavian design influences. Sophisticated restraint. Focus on essential elements only.',
  1,
  '["Apple product photography", "Minimalist brand campaigns", "Architectural content"]',
  '{"bestFor": ["premium products", "tech brands", "architectural content"], "avoid": ["busy energetic content", "complex narratives"], "recommendedWith": ["Commercial: Product Feature", "Explainer: Animated Concept"]}'
);

-- Minimalist Monochrome
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_minimal_mono',
  'Minimalist Monochrome',
  'Sophisticated black and white with clean lines and timeless elegance',
  '["minimalist", "monochrome", "elegant"]',
  'Minimalist monochrome style. Black and white only. Clean lines and geometric shapes. High contrast but balanced. Elegant simplicity. Timeless aesthetic. Architectural photography influences. Negative space as design element. Subtle gradients. Focus on form and composition. Modern sophistication.',
  1,
  '["Fashion photography", "Architectural content", "Luxury brand campaigns"]',
  '{"bestFor": ["luxury products", "fashion content", "timeless brands"], "avoid": ["playful content", "products requiring color"], "recommendedWith": ["Commercial: Luxury/Premium", "Music Video: Conceptual"]}'
);

-- ============================================================================
-- NATURAL & ORGANIC STYLES
-- ============================================================================

-- Natural Earthy
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_natural_earthy',
  'Natural Earthy',
  'Warm earth tones with organic textures and natural lighting',
  '["natural", "organic", "warm"]',
  'Natural earthy style. Warm earth tone palette - terracotta, ochre, sage green, warm browns. Natural textures - wood, stone, linen. Soft natural lighting. Organic shapes and materials. Botanical elements. Handcrafted aesthetic. Matte finishes. Cozy warm atmosphere. Sustainable and eco-friendly mood.',
  1,
  '["Sustainable brand content", "Organic product campaigns", "Wellness content"]',
  '{"bestFor": ["eco-friendly brands", "wellness products", "organic content"], "avoid": ["high-tech products", "urban content"], "recommendedWith": ["Commercial: Lifestyle Brand", "Explainer: Live-Action Presenter"]}'
);

-- Natural Botanical
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_natural_botanical',
  'Natural Botanical',
  'Fresh green tones with lush plant life and natural beauty',
  '["natural", "botanical", "fresh"]',
  'Natural botanical style. Lush green tones and plant life. Fresh vibrant greens. Natural daylight. Botanical garden atmosphere. Leaves and foliage as key elements. Dew drops and water elements. Organic growth patterns. Fresh clean aesthetic. Nature-inspired compositions. Biophilic design principles.',
  1,
  '["Beauty product campaigns", "Wellness content", "Natural brand stories"]',
  '{"bestFor": ["beauty products", "wellness brands", "natural products"], "avoid": ["industrial content", "urban themes"], "recommendedWith": ["Commercial: Lifestyle Brand", "Social: Tutorial/How-To"]}'
);

-- ============================================================================
-- RETRO & VINTAGE STYLES
-- ============================================================================

-- Retro 80s Synthwave
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_retro_synthwave',
  'Retro 80s Synthwave',
  'Nostalgic 1980s aesthetic with neon grids, sunset gradients, and retro-futuristic vibes',
  '["retro", "80s", "neon"]',
  'Retro 80s synthwave style. Neon pink and cyan color palette. Purple sunset gradients. Grid patterns and geometric shapes. Chrome and metallic textures. Retro-futuristic aesthetic. VHS scan lines and glitch effects. Outrun and vaporwave influences. Nostalgic 1980s technology. Glowing neon outlines.',
  1,
  '["Synthwave music videos", "Retro tech content", "Nostalgic brand campaigns"]',
  '{"bestFor": ["music content", "retro brands", "nostalgic themes"], "avoid": ["modern minimalist content", "natural themes"], "recommendedWith": ["Music Video: Performance", "Social: Fast-Paced Trending"]}'
);

-- Retro Vintage Film
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_retro_film',
  'Retro Vintage Film',
  'Classic film photography aesthetic with grain, faded colors, and nostalgic warmth',
  '["retro", "vintage", "film"]',
  'Retro vintage film style. Film grain texture. Slightly faded colors with warm cast. Vignetting around edges. Soft focus. Nostalgic atmosphere. 35mm film aesthetic. Kodak Portra color palette. Light leaks and imperfections. Analog photography feel. Timeless vintage mood.',
  1,
  '["Nostalgic narratives", "Heritage brand content", "Vintage-inspired campaigns"]',
  '{"bestFor": ["nostalgic content", "heritage brands", "emotional stories"], "avoid": ["high-tech products", "modern minimalist content"], "recommendedWith": ["Music Video: Narrative", "Commercial: Emotional Brand Story"]}'
);

-- ============================================================================
-- DRAMATIC & MOODY STYLES
-- ============================================================================

-- Dramatic Chiaroscuro
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_dramatic_chiaroscuro',
  'Dramatic Chiaroscuro',
  'High contrast lighting with deep shadows and dramatic illumination',
  '["dramatic", "moody", "high-contrast"]',
  'Dramatic chiaroscuro style. Strong contrast between light and shadow. Deep blacks and bright highlights. Rembrandt lighting techniques. Dramatic side lighting. Mysterious atmosphere. Renaissance painting influences. Sculptural lighting on subjects. Minimal fill light. Theatrical mood.',
  1,
  '["Dramatic portraits", "Luxury product photography", "Atmospheric narratives"]',
  '{"bestFor": ["dramatic content", "luxury products", "artistic narratives"], "avoid": ["bright cheerful content", "technical demos"], "recommendedWith": ["Music Video: Narrative", "Commercial: Luxury/Premium"]}'
);

-- Dramatic Stormy
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_dramatic_stormy',
  'Dramatic Stormy',
  'Moody atmospheric style with dark clouds, dramatic weather, and intense emotion',
  '["dramatic", "moody", "atmospheric"]',
  'Dramatic stormy style. Dark moody skies with storm clouds. Desaturated color palette with occasional color pops. Dramatic weather elements. Wind and movement. Intense atmospheric conditions. Overcast lighting. Emotional intensity. Cinematic scope. Epic scale. Nature''s power and drama.',
  1,
  '["Epic narratives", "Outdoor adventure content", "Dramatic brand stories"]',
  '{"bestFor": ["epic content", "outdoor brands", "dramatic narratives"], "avoid": ["cheerful content", "indoor scenes"], "recommendedWith": ["Music Video: Narrative", "Commercial: Outdoor/Adventure"]}'
);

-- ============================================================================
-- ABSTRACT & ARTISTIC STYLES
-- ============================================================================

-- Abstract Geometric
INSERT INTO style_templates (id, name, description, category, style_prompt, tested, examples, metadata)
VALUES (
  'style_abstract_geometric',
  'Abstract Geometric',
  'Bold geometric shapes and patterns with modern artistic expression',
  '["abstract", "geometric", "modern"]',
  'Abstract geometric style. Bold geometric shapes and patterns. Strong lines and angles. Bauhaus influences. Constructivist design. Limited color palette with high impact. Overlapping shapes. Negative space as design element. Modern art aesthetic. Mathematical precision. Dynamic compositions.',
  1,
  '["Tech brand content", "Modern art projects", "Abstract concepts"]',
  '{"bestFor": ["tech brands", "abstract concepts", "modern content"], "avoid": ["realistic narratives", "natural themes"], "recommendedWith": ["Explainer: Animated Concept", "Music Video: Conceptual"]}'
);

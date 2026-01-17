# Style Templates Guide

## Overview

Style Templates define reusable visual styles that can be applied to all AI-generated images and videos. They ensure visual consistency across your project and help you quickly achieve specific aesthetic goals.

## What are Style Templates?

A Style Template is a collection of visual style instructions that get appended to every generation prompt. Think of it as a "visual filter" that transforms generic prompts into styled, cohesive imagery.

**Example:**
- **Without template:** "A person walking down a street"
- **With Film Noir template:** "A person walking down a street, black and white, high contrast, venetian blind shadows, 1940s aesthetic, film noir lighting"

## Creating a Style Template

### Step 1: Access Template Management

1. Open the **Settings** panel (gear icon)
2. Navigate to the **Style Templates** section
3. Click **Create New Template**

### Step 2: Basic Information

**Name** (required)
- Short, memorable name (e.g., "Film Noir", "Cyberpunk Neon")
- Will appear in the template selector

**Description** (required)
- Brief explanation of the visual style
- Helps users understand when to use it

**Thumbnail** (optional)
- URL to a representative image
- Provides visual preview of the style

**Category** (required, can select multiple)
- `cinematic`: Film-like, high production value
- `dark`: Low-key lighting, shadows, moody
- `bright`: High-key lighting, vibrant, cheerful
- `abstract`: Experimental, artistic, non-literal
- `realistic`: Photorealistic, natural
- `stylized`: Artistic interpretation, exaggerated
- `vintage`: Retro, aged, nostalgic
- `modern`: Contemporary, clean, minimalist
- `colorful`: Vibrant, saturated colors
- `monochrome`: Black and white, limited color

### Step 3: Style Prompt

The **Style Prompt** is the core of your template. This text gets appended to every generation prompt.

**Best Practices:**

1. **Be Specific About Visual Elements**
   ```
   High contrast black and white, venetian blind shadows, 1940s aesthetic,
   film noir lighting, dramatic shadows, low-key lighting
   ```

2. **Include Technical Details**
   ```
   Shot on 35mm film, shallow depth of field, anamorphic lens flares,
   film grain texture, cinematic color grading
   ```

3. **Define Color Palette**
   ```
   Neon pink and cyan color palette, dark backgrounds, glowing lights,
   high saturation, purple and blue tones
   ```

4. **Specify Mood and Atmosphere**
   ```
   Moody, atmospheric, mysterious, noir aesthetic, dramatic lighting,
   high contrast, deep shadows
   ```

5. **Add Composition Guidelines**
   ```
   Symmetrical composition, rule of thirds, leading lines, negative space,
   balanced framing
   ```

**Example Style Prompt:**

```
Cinematic film noir aesthetic, black and white, high contrast lighting,
venetian blind shadows, 1940s period details, dramatic low-key lighting,
deep shadows, chiaroscuro effect, shot on 35mm film, film grain texture,
moody atmosphere, mysterious mood, classic Hollywood cinematography
```

### Step 4: Testing

**Tested Checkbox**
- Mark as "tested" after verifying the style works well
- Tested templates appear with a badge in the library
- Only mark as tested after generating multiple images/videos

**How to Test:**
1. Create a test project
2. Apply the template
3. Generate 3-5 different scenes
4. Verify:
   - Style is consistent across generations
   - Visual elements match your intention
   - Results are high quality
   - Style works with different subjects

### Step 5: Examples (Optional)

Add example prompts and expected results:

**Example 1:**
- **Input:** "A person walking down a street"
- **Expected:** "Black and white image with high contrast, venetian blind shadows creating dramatic patterns, 1940s aesthetic"

**Example 2:**
- **Input:** "Interior of a cafe"
- **Expected:** "Moody cafe interior with film noir lighting, deep shadows, single light source, mysterious atmosphere"

### Step 6: Metadata (Optional)

Add additional information:

```json
{
  "bestFor": ["music videos", "dramatic scenes", "night scenes"],
  "avoid": ["bright daylight", "colorful subjects"],
  "inspiration": "Classic film noir, Blade Runner, Sin City",
  "keywords": ["noir", "dramatic", "shadows", "contrast"]
}
```

### Step 7: Save

Click **Save Template** to create the template. It will now appear in the template library.

## Using Style Templates

### Applying a Template

**Method 1: Project-Wide**
1. Open your project
2. Go to Settings → Style Templates
3. Click on a template to set it as active
4. All subsequent generations will use this style

**Method 2: Per-Generation**
1. When generating an image or video
2. Select a template from the dropdown
3. That generation will use the selected style
4. Project default remains unchanged

### Template Behavior

The style prompt is appended to your generation prompts:

**Your Prompt:**
```
A person walking down a rainy street at night
```

**With Film Noir Template:**
```
A person walking down a rainy street at night, black and white,
high contrast, venetian blind shadows, 1940s aesthetic, film noir
lighting, dramatic shadows, low-key lighting
```

### Combining with Workflows

For best results, combine workflows and templates:
- **Workflow**: Defines creative direction and expertise
- **Template**: Defines visual style and aesthetics

**Example:**
- Workflow: "Music Video Director"
- Template: "Cyberpunk Neon"
- Result: Music video expertise with cyberpunk visual style

## Template Library

### Browsing Templates

**Filter by Category:**
- Click category tags to filter
- Multiple categories can be selected
- Clear filters to see all templates

**Search:**
- Search by name or description
- Use keywords from metadata
- Find templates quickly

**Sort:**
- By name (A-Z)
- By creation date (newest first)
- By tested status (tested first)

### Template Cards

Each template card shows:
- **Thumbnail**: Visual preview
- **Name**: Template name
- **Description**: Brief explanation
- **Categories**: Visual tags
- **Tested Badge**: If verified
- **Actions**: Select, Edit, Delete

## Best Practices

### Creating Effective Templates

**Do:**
- ✅ Be specific and detailed
- ✅ Test with multiple subjects
- ✅ Include technical details (film type, lens, lighting)
- ✅ Define color palette clearly
- ✅ Specify mood and atmosphere
- ✅ Keep style prompts under 200 words
- ✅ Use consistent terminology

**Don't:**
- ❌ Be vague or generic
- ❌ Contradict yourself
- ❌ Include subject-specific details
- ❌ Make prompts too long
- ❌ Use conflicting style elements
- ❌ Forget to test thoroughly

### Template Organization

1. **Create broad style categories first**
   - Film Noir
   - Cyberpunk
   - Vintage Film
   - Modern Minimalist

2. **Add variations as needed**
   - Film Noir - High Contrast
   - Film Noir - Soft Shadows
   - Film Noir - Color Tinted

3. **Mark tested templates**
   - Only mark after thorough testing
   - Update based on results
   - Document what works well

4. **Organize by project type**
   - Music video styles
   - Commercial styles
   - Social media styles
   - Explainer video styles

### Testing Templates

**Test Checklist:**
- [ ] Generate 5+ different scenes
- [ ] Test with various subjects (people, objects, landscapes)
- [ ] Test with different lighting conditions
- [ ] Verify consistency across generations
- [ ] Check if style matches intention
- [ ] Ensure high quality results
- [ ] Test with both images and videos
- [ ] Verify style works with workflows

**Document Results:**
- What works well
- What doesn't work
- Best use cases
- Subjects to avoid
- Recommended workflows

## Troubleshooting

### Style Not Applied

**Problem:** Generated images don't show the style

**Solutions:**
- Verify template is selected/active
- Check if style prompt is too subtle
- Make style instructions more directive
- Use stronger, more specific language
- Add technical details (film type, lighting setup)

### Inconsistent Results

**Problem:** Each generation looks different

**Solutions:**
- Be more specific in style prompt
- Add technical constraints (film type, lens, color palette)
- Use consistent terminology
- Avoid conflicting style elements
- Test with simpler subjects first

### Style Too Strong

**Problem:** Style overwhelms the subject

**Solutions:**
- Reduce the number of style descriptors
- Use more subtle language
- Remove conflicting elements
- Balance style with subject importance
- Test with different prompt structures

### Style Conflicts with Prompt

**Problem:** Style and prompt don't work together

**Solutions:**
- Document incompatible subjects in metadata
- Create variations for different use cases
- Make style more flexible
- Provide guidance on best use cases
- Test with diverse prompts

## Advanced Tips

### Layering Styles

You can create complex styles by layering elements:

**Base Layer:** Technical specs
```
Shot on 35mm film, shallow depth of field, film grain texture
```

**Color Layer:** Color palette
```
Warm color palette, golden hour lighting, orange and teal tones
```

**Mood Layer:** Atmosphere
```
Nostalgic, dreamy, soft focus, romantic mood
```

**Combined:**
```
Shot on 35mm film, shallow depth of field, film grain texture,
warm color palette, golden hour lighting, orange and teal tones,
nostalgic, dreamy, soft focus, romantic mood
```

### Era-Specific Styles

Reference specific time periods:

**1940s Film Noir:**
```
1940s aesthetic, black and white, high contrast, venetian blind shadows,
film noir lighting, classic Hollywood cinematography
```

**1980s Synthwave:**
```
1980s aesthetic, neon colors, grid patterns, sunset gradients,
synthwave style, retro-futuristic, VHS quality
```

**1990s Music Video:**
```
1990s music video aesthetic, oversaturated colors, fish-eye lens,
quick cuts, practical effects, analog video quality
```

### Technical Specifications

Include camera and lens details:

```
Shot on ARRI Alexa, anamorphic lens, 2.39:1 aspect ratio,
shallow depth of field, bokeh, lens flares, cinematic color grading,
film grain overlay
```

### Lighting Setups

Specify lighting techniques:

```
Three-point lighting setup, key light from left, fill light from right,
rim light from behind, soft diffused lighting, studio setup,
professional photography lighting
```

### Post-Processing

Include editing and grading:

```
Cinematic color grading, teal and orange color palette, lifted blacks,
crushed highlights, film grain overlay, vignette effect, subtle bloom
```

## Example Templates

### Example 1: Cyberpunk Neon

**Name:** Cyberpunk Neon

**Description:** Futuristic cyberpunk aesthetic with neon lights and dark urban environments

**Categories:** dark, stylized, modern, colorful

**Style Prompt:**
```
Cyberpunk aesthetic, neon pink and cyan lighting, dark urban environment,
rain-slicked streets, holographic displays, futuristic technology,
high contrast, moody atmosphere, blade runner inspired, neon signs,
reflective surfaces, night scene, cinematic sci-fi, dystopian mood
```

**Best For:** Music videos, sci-fi projects, urban scenes, night scenes

### Example 2: Vintage Film

**Name:** Vintage 8mm Film

**Description:** Nostalgic home movie aesthetic with warm tones and film artifacts

**Categories:** vintage, warm, stylized

**Style Prompt:**
```
Vintage 8mm film aesthetic, warm color temperature, faded colors,
film grain texture, light leaks, vignette effect, slightly overexposed,
nostalgic mood, 1970s home movie quality, soft focus, analog film artifacts,
warm golden tones, retro family video style
```

**Best For:** Nostalgic content, family scenes, retro projects, emotional storytelling

### Example 3: Modern Minimalist

**Name:** Modern Minimalist

**Description:** Clean, contemporary aesthetic with simple compositions and neutral colors

**Categories:** modern, bright, realistic

**Style Prompt:**
```
Modern minimalist aesthetic, clean composition, negative space,
neutral color palette, soft natural lighting, simple backgrounds,
contemporary design, uncluttered, geometric shapes, balanced framing,
professional photography, high-key lighting, white and gray tones
```

**Best For:** Product videos, corporate content, explainer videos, modern brands

### Example 4: Cinematic Drama

**Name:** Cinematic Drama

**Description:** High-end film production aesthetic with dramatic lighting and composition

**Categories:** cinematic, dark, realistic

**Style Prompt:**
```
Cinematic film aesthetic, shot on 35mm film, anamorphic lens,
2.39:1 aspect ratio, dramatic lighting, chiaroscuro effect,
film grain texture, color graded, moody atmosphere, shallow depth of field,
bokeh, professional cinematography, theatrical lighting, deep shadows,
rich colors, high production value
```

**Best For:** Music videos, dramatic scenes, high-end productions, narrative content

## Resources

- [Workflow Management Guide](./WORKFLOWS.md) - AI agent customization
- [File Upload Guide](./FILE-UPLOADS.md) - Reference images
- [API Documentation](../API.md) - Technical details
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues

## Inspiration

### Style References

- **Film Noir**: Classic Hollywood (1940s-1950s)
- **Cyberpunk**: Blade Runner, Ghost in the Shell, Akira
- **Vintage**: Home movies, Polaroid, Kodachrome
- **Modern**: Apple commercials, contemporary design
- **Synthwave**: 1980s aesthetics, Stranger Things, Drive

### Learning Resources

- Study cinematography from films you admire
- Analyze music videos in your target style
- Research photography techniques and lighting
- Explore color grading tutorials
- Join creative communities for feedback

## Feedback

Style Templates are essential for visual consistency. As you create and use them:
- Document successful templates
- Share with your team
- Iterate based on results
- Provide feedback for improvement

Happy styling! 🎨

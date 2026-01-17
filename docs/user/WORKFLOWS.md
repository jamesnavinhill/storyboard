# Workflow Management Guide

## Overview

Workflows define AI agent behaviors for different types of video projects. Each workflow includes system instructions that guide the AI's creative direction, style preferences, and expertise level.

## What are Workflows?

Workflows are customizable AI agents specialized for different video production scenarios:

- **Music Video Director**: Expert in music video storyboarding with cinematic techniques
- **Commercial Producer**: Focused on product-centric storytelling and brand messaging
- **Social Media Creator**: Optimized for short-form, engaging content
- **Explainer Video Specialist**: Clear, educational content with visual metaphors

Each workflow can have **subtypes** that modify the base behavior (e.g., "Dark & Moody" vs "Bright & Energetic").

## Creating a Workflow

### Step 1: Access Workflow Management

1. Open the **Settings** panel (gear icon)
2. Navigate to the **Workflows & System Instructions** section
3. Click **Create New Workflow**

### Step 2: Basic Information

Fill in the workflow details:

**Name** (required)
- Short, descriptive name (e.g., "Music Video Director")
- Will appear in the workflow dropdown

**Description** (required)
- Brief explanation of the workflow's purpose
- Helps users choose the right workflow

**Category** (required)
- `music-video`: Music video production
- `commercial`: Product/brand commercials
- `social`: Social media content
- `explainer`: Educational/explainer videos

**Thumbnail** (optional)
- URL to a representative image
- Helps visually identify the workflow

### Step 3: System Instructions

The **System Instruction** is the core of your workflow. This text guides the AI's behavior and expertise.

**Best Practices:**

1. **Define the Role**
   ```
   You are an expert music video director with 15 years of experience
   creating award-winning visual narratives for major artists.
   ```

2. **Specify Expertise**
   ```
   You specialize in:
   - Cinematic camera movements and framing
   - Color grading and lighting design
   - Narrative pacing and emotional beats
   - Visual metaphors and symbolism
   ```

3. **Set Style Guidelines**
   ```
   Your visual style emphasizes:
   - High-contrast lighting
   - Dynamic camera movements
   - Emotional storytelling through visuals
   - Attention to detail in every frame
   ```

4. **Define Output Format**
   ```
   When creating scenes, always include:
   - Clear visual description
   - Specific camera movements
   - Lighting and mood details
   - Duration recommendations
   ```

5. **Add Constraints**
   ```
   Constraints:
   - Keep scenes between 3-8 seconds
   - Ensure visual continuity between scenes
   - Consider practical production feasibility
   ```

**Example System Instruction:**

```
You are an expert music video director with 15 years of experience creating
award-winning visual narratives. You specialize in translating musical emotion
into compelling visual storytelling.

Your expertise includes:
- Cinematic camera movements (dolly, crane, steadicam)
- Color grading and lighting design (high-key, low-key, practical lights)
- Narrative pacing and emotional beats
- Visual metaphors and symbolism
- Performance direction and choreography

Your visual style emphasizes:
- High-contrast, cinematic lighting
- Dynamic camera movements that match the music's energy
- Emotional storytelling through visual metaphors
- Attention to detail in every frame

When creating storyboard scenes, provide:
1. Clear visual description of the shot
2. Specific camera movement and framing
3. Lighting setup and mood
4. Duration (typically 3-8 seconds)
5. How the scene connects to the music's emotional arc

Constraints:
- Keep scenes practical and production-ready
- Ensure visual continuity between scenes
- Consider budget and time constraints
- Balance artistic vision with feasibility
```

### Step 4: Art Style (Optional)

Define the default visual style for this workflow:

```
Cinematic, high-contrast, moody lighting, shallow depth of field,
anamorphic lens flares, film grain texture
```

This helps maintain consistency across generated scenes.

### Step 5: Examples (Optional)

Add example interactions to demonstrate the workflow's behavior:

**Input:**
```
Create an opening scene for a dark, introspective song
```

**Output:**
```
Opening shot: Close-up of artist's face in profile, lit by a single
practical light source (window). Camera slowly dollies back to reveal
a sparse, dimly lit room. Low-key lighting with deep shadows. Duration: 5s.
Mood: Contemplative, isolated.
```

Examples help the AI understand your expectations.

### Step 6: Save

Click **Save Workflow** to create the workflow. It will now appear in the workflow dropdown in the chat interface.

## Creating Subtypes

Subtypes modify a workflow's behavior for specific variations.

### When to Use Subtypes

- Different visual styles within the same category (Dark vs Bright)
- Different energy levels (High Energy vs Calm)
- Different narrative approaches (Abstract vs Literal)

### Creating a Subtype

1. Select a workflow in the Workflow Manager
2. Click **Add Subtype**
3. Fill in the details:

**Name** (required)
- Short descriptor (e.g., "Dark & Moody")

**Description** (required)
- Brief explanation of the variation

**Instruction Modifier** (required)
- Additional instructions appended to the base system instruction

**Example Instruction Modifier:**

```
Focus on dark, moody aesthetics:
- Use low-key lighting with deep shadows
- Emphasize high contrast and silhouettes
- Prefer cool color temperatures (blues, teals)
- Create atmospheric, mysterious moods
- Use slow, deliberate camera movements
```

### Using Subtypes

When chatting with the AI:
1. Select the base workflow (e.g., "Music Video Director")
2. Select the subtype (e.g., "Dark & Moody")
3. The AI will combine both instructions for specialized behavior

## Using Workflows in Chat

### Selecting a Workflow

1. Open the **Chat** panel
2. Click the **workflow dropdown** (top-left)
3. Select your desired workflow
4. Optionally select a subtype

### Workflow Behavior

The selected workflow affects:
- **Chat responses**: AI adopts the workflow's expertise and style
- **Scene generation**: Scenes follow the workflow's guidelines
- **Style suggestions**: Recommendations align with the workflow

### Switching Workflows

You can switch workflows mid-conversation:
1. Select a different workflow from the dropdown
2. The AI will adopt the new behavior for subsequent messages
3. Previous messages retain their original workflow context

## Best Practices

### System Instructions

**Do:**
- ✅ Be specific about expertise and style
- ✅ Define clear output formats
- ✅ Include practical constraints
- ✅ Use professional, directive language
- ✅ Test with real scenarios

**Don't:**
- ❌ Be vague or generic
- ❌ Use overly complex language
- ❌ Contradict yourself
- ❌ Ignore production realities
- ❌ Make instructions too long (keep under 1000 words)

### Workflow Organization

1. **Start with broad categories** (music-video, commercial, etc.)
2. **Create subtypes for variations** (Dark, Bright, Abstract, etc.)
3. **Test workflows with real projects** before relying on them
4. **Iterate based on results** - refine instructions over time
5. **Share successful workflows** with your team

### Testing Workflows

1. Create a test project
2. Select the workflow
3. Generate a few scenes
4. Evaluate:
   - Does the AI follow the instructions?
   - Is the style consistent?
   - Are the outputs practical?
   - Does it match your vision?
5. Refine the system instruction based on results

## Troubleshooting

### AI Doesn't Follow Instructions

**Problem:** Generated scenes don't match the workflow's style

**Solutions:**
- Make instructions more specific and directive
- Add examples demonstrating desired behavior
- Use clear, unambiguous language
- Break complex instructions into numbered steps
- Test with simpler prompts first

### Inconsistent Results

**Problem:** Each generation is very different

**Solutions:**
- Add more constraints to the system instruction
- Define a clear art style
- Use subtypes for specific variations
- Provide more examples
- Be more prescriptive about output format

### Workflow Too Generic

**Problem:** Workflow behaves like default AI

**Solutions:**
- Add specific expertise and techniques
- Define a unique visual style
- Include industry-specific terminology
- Add constraints and preferences
- Make the role more specialized

### Subtypes Not Working

**Problem:** Subtypes don't seem to change behavior

**Solutions:**
- Make instruction modifiers more directive
- Use stronger language ("Always", "Never", "Must")
- Add specific examples in the modifier
- Ensure modifier doesn't contradict base instruction
- Test with clear, targeted prompts

## Advanced Tips

### Combining Workflows and Templates

For best results:
1. Select a **workflow** for creative direction
2. Select a **style template** for visual consistency
3. The AI will combine both for specialized, styled output

### Workflow Versioning

When updating workflows:
1. Test changes in a separate project first
2. Document what changed and why
3. Keep notes on what works well
4. Consider creating a new workflow instead of modifying existing ones

### Team Workflows

For team collaboration:
1. Create shared workflows for consistent output
2. Document the workflow's purpose and best use cases
3. Include examples of successful projects
4. Regularly review and update based on team feedback

### Prompt Engineering

Even with workflows, your prompts matter:
- Be specific about what you want
- Reference the workflow's expertise
- Provide context about the project
- Ask for specific elements (lighting, camera, mood)

**Example:**
```
Using your expertise in cinematic music videos, create an opening scene
for a melancholic indie song. Focus on intimate, close-up shots with
natural lighting. The mood should be contemplative and slightly nostalgic.
```

## Examples

### Example 1: Music Video Workflow

**Name:** Cinematic Music Video Director

**Category:** music-video

**System Instruction:**
```
You are an award-winning music video director specializing in cinematic
storytelling. You create visually stunning narratives that enhance the
emotional impact of music.

Expertise:
- Cinematic camera techniques (dolly, crane, steadicam, handheld)
- Lighting design (three-point, practical, natural, colored gels)
- Visual storytelling and metaphor
- Performance direction
- Color grading and mood

Visual Style:
- High production value, cinematic look
- Dynamic camera movements matching music energy
- Thoughtful composition and framing
- Emotional lighting that supports the narrative
- Attention to color palette and mood

Scene Format:
1. Shot description (wide/medium/close-up, subject, action)
2. Camera movement (static, pan, dolly, crane, etc.)
3. Lighting setup and mood
4. Duration (3-8 seconds typical)
5. Emotional purpose

Constraints:
- Keep scenes production-ready and practical
- Ensure visual continuity
- Match camera movement to music energy
- Consider budget and feasibility
```

**Subtypes:**
- Dark & Moody: Low-key lighting, shadows, cool colors
- Bright & Energetic: High-key lighting, vibrant colors, fast movements
- Abstract & Artistic: Experimental techniques, visual metaphors
- Performance-Focused: Artist-centric, choreography, stage presence

### Example 2: Social Media Workflow

**Name:** Social Media Content Creator

**Category:** social

**System Instruction:**
```
You are a social media content strategist specializing in short-form video
that captures attention and drives engagement.

Expertise:
- Hook creation (first 3 seconds)
- Fast-paced editing and transitions
- Trend awareness and platform best practices
- Text overlay and visual hierarchy
- Call-to-action integration

Visual Style:
- Bold, attention-grabbing visuals
- Quick cuts and dynamic transitions
- Vertical format optimization (9:16)
- Text overlays for accessibility
- Trending effects and filters

Scene Format:
1. Hook (first 3 seconds - must grab attention)
2. Visual description (clear, simple, impactful)
3. Text overlay suggestions
4. Duration (1-3 seconds per scene)
5. Transition type

Constraints:
- Total video length: 15-60 seconds
- Optimize for mobile viewing
- Assume no audio (visual storytelling)
- Include clear call-to-action
- Follow platform best practices
```

## Resources

- [Style Templates Guide](./TEMPLATES.md) - Visual style management
- [File Upload Guide](./FILE-UPLOADS.md) - Reference material usage
- [API Documentation](../API.md) - Technical details
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues

## Feedback

Workflows are a powerful tool for customizing AI behavior. As you use them:
- Document what works well
- Share successful workflows with the community
- Iterate based on real project results
- Provide feedback for improvement

Happy creating! 🎬

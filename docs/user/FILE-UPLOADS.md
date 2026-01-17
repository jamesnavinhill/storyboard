# File Upload Guide

## Overview

VibeBoard's file upload system allows you to provide reference materials to the AI for more accurate and personalized generation. Upload images, videos, audio, and documents to guide the AI's creative direction.

## What Can You Upload?

### Supported File Types

**Images**
- JPEG/JPG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- GIF (`.gif`)

**Videos**
- MP4 (`.mp4`)
- WebM (`.webm`)

**Audio**
- MP3 (`.mp3`)
- WAV (`.wav`)
- M4A (`.m4a`)

**Documents**
- PDF (`.pdf`)
- Text (`.txt`)
- Markdown (`.md`)

### File Size Limits

- **Maximum file size**: 100MB (configurable by administrator)
- **Recommended size**: Under 20MB for faster uploads
- **Maximum files per project**: 10 files

### File Routing

The system automatically routes files based on size:

- **Files < 20MB**: Stored as base64 inline data (faster access)
- **Files ≥ 20MB**: Uploaded to Google Files API (better for large files)
- **Video/Audio files**: Always routed to Files API (regardless of size)

## File Purposes

When uploading a file, you must specify its purpose. This helps the AI understand how to use the reference material.

### Purpose Types

**Style Reference** (`style-reference`)
- Visual style examples
- Color palette references
- Lighting and mood examples
- Composition references

**Use Cases:**
- "Make it look like this image"
- "Use this color palette"
- "Match this lighting style"
- "Similar composition to this"

**Character Reference** (`character-reference`)
- Character appearance
- Costume and styling
- Facial features
- Body type and posture

**Use Cases:**
- "This is what the main character looks like"
- "Use this person's style"
- "Match this costume design"
- "Similar character to this"

**Audio Reference** (`audio-reference`)
- Music tracks
- Sound effects
- Voiceovers
- Audio mood references

**Use Cases:**
- "Match the energy of this song"
- "Create visuals for this music"
- "Sync to this audio"
- "Match this audio's mood"

**Text Document** (`text-document`)
- Scripts
- Lyrics
- Story outlines
- Creative briefs

**Use Cases:**
- "Follow this script"
- "Use these lyrics"
- "Based on this story"
- "Reference this brief"

**General Reference** (`general-reference`)
- Any other reference material
- Mixed-purpose files
- Inspiration boards
- Mood boards

**Use Cases:**
- "General inspiration"
- "Reference for ideas"
- "Mood board"
- "Creative direction"

## Uploading Files

### Method 1: Drag and Drop (Agent Mode)

1. Open the **Chat** panel
2. Select an **Agent workflow** (not Simple Chat)
3. The upload dropzone appears above the chat input
4. **Drag and drop** files into the dropzone
5. Files are automatically uploaded

### Method 2: Click to Upload

1. Open the **Chat** panel
2. Select an **Agent workflow**
3. Click the **upload dropzone**
4. Select files from your computer
5. Files are automatically uploaded

### Method 3: API Upload

For programmatic uploads, use the API:

```bash
curl -X POST http://localhost:4000/api/files/upload \
  -F "file=@reference.jpg" \
  -F "projectId=your-project-id" \
  -F "purpose=style-reference"
```

See [API Documentation](../API.md#file-uploads) for details.

## Managing Uploaded Files

### Viewing Files

Uploaded files appear as **thumbnails** above the chat input:

- **Image files**: Show image preview
- **Video files**: Show video thumbnail
- **Audio files**: Show audio icon
- **Documents**: Show document icon

### File Information

Hover over a thumbnail to see:
- File name
- File size
- Upload date
- Purpose label

### Changing File Purpose

1. Click on a file thumbnail
2. Select **Change Purpose**
3. Choose a new purpose from the dropdown
4. Click **Save**

The AI will use the file according to its new purpose.

### Reordering Files

Files are sent to the AI in order:

1. **Drag** a file thumbnail
2. **Drop** it in the desired position
3. Order is saved automatically

**Why order matters:**
- First files have more influence
- Order affects context priority
- Organize by importance

### Deleting Files

1. Click on a file thumbnail
2. Click the **delete icon** (trash can)
3. Confirm deletion
4. File is removed from the project

**Note:** Deletion is permanent and cannot be undone.

## Using Files with AI

### How Files Affect Generation

When you generate content with uploaded files:

1. **Files are sent to the AI** along with your prompt
2. **AI analyzes the files** based on their purpose
3. **Generation incorporates** the reference material
4. **Results match** the style, characters, or mood from files

### Best Practices

**Style References:**
- Upload 1-3 style reference images
- Choose images with clear visual style
- Ensure good image quality
- Use consistent style across references

**Character References:**
- Upload clear, well-lit photos
- Show multiple angles if possible
- Include full-body and close-up shots
- Ensure high resolution

**Audio References:**
- Upload the actual music track
- Ensure good audio quality
- Trim to relevant sections if long
- Match the project's audio

**Text Documents:**
- Keep documents concise and relevant
- Use clear formatting
- Highlight key information
- Remove unnecessary content

### Prompt Tips with Files

**Reference the files in your prompts:**

❌ **Bad:**
```
Create a scene
```

✅ **Good:**
```
Create a scene matching the style of the uploaded reference image,
with similar lighting and color palette
```

**Be specific about what to use:**

❌ **Bad:**
```
Use the reference
```

✅ **Good:**
```
Use the character from the reference image, wearing similar clothing,
in a different environment
```

**Combine multiple references:**

✅ **Good:**
```
Create a scene with the character from reference 1, in the style of
reference 2, with the mood of the uploaded music track
```

## File Upload Workflow

### Typical Workflow

1. **Create a project**
2. **Upload reference materials**
   - Style references
   - Character references
   - Audio track
3. **Set file purposes** appropriately
4. **Order files** by importance
5. **Start chatting** with the AI
6. **Reference files** in your prompts
7. **Generate scenes** with file context
8. **Refine** by adding or removing files

### Example: Music Video Project

**Step 1: Upload Files**
- Music track (audio-reference)
- Artist photo (character-reference)
- Style inspiration image (style-reference)

**Step 2: Set Purposes**
- Music track → audio-reference
- Artist photo → character-reference
- Style image → style-reference

**Step 3: Order Files**
1. Music track (most important)
2. Artist photo
3. Style image

**Step 4: Generate**
```
Create an opening scene featuring the artist from the reference photo,
with the visual style of the uploaded image, matching the energy of
the music track
```

## Troubleshooting

### Upload Fails

**Problem:** File won't upload

**Solutions:**
- Check file size (max 100MB)
- Verify file type is supported
- Ensure stable internet connection
- Try a smaller file
- Check browser console for errors

### File Not Used in Generation

**Problem:** AI doesn't seem to use the uploaded file

**Solutions:**
- Verify file purpose is set correctly
- Reference the file explicitly in your prompt
- Check file quality (resolution, clarity)
- Ensure file is relevant to the prompt
- Try uploading a clearer reference

### Slow Upload

**Problem:** Upload takes a long time

**Solutions:**
- Large files (>20MB) take longer
- Video/audio files are routed to Files API (slower)
- Compress files before uploading
- Use wired internet connection
- Upload during off-peak hours

### Wrong File Purpose

**Problem:** File has wrong purpose label

**Solutions:**
- Click on the file thumbnail
- Select "Change Purpose"
- Choose the correct purpose
- Save changes

### Too Many Files

**Problem:** Can't upload more files (limit reached)

**Solutions:**
- Delete unused files
- Keep only essential references
- Combine multiple references into one image
- Use most impactful files only

## Advanced Tips

### Optimizing File Size

**Images:**
- Resize to reasonable dimensions (1920x1080 or smaller)
- Use JPEG for photos (smaller than PNG)
- Use PNG for graphics with transparency
- Compress images before uploading

**Videos:**
- Trim to relevant sections only
- Use H.264 codec for MP4
- Reduce resolution if not needed
- Compress with tools like HandBrake

**Audio:**
- Trim to relevant sections
- Use MP3 format (smaller than WAV)
- Reduce bitrate if quality allows
- Mono audio is smaller than stereo

### Multiple Reference Images

When using multiple style references:

1. **Ensure consistency** - Similar styles work better
2. **Order by importance** - Most important first
3. **Limit to 3-5 images** - Too many can confuse the AI
4. **Use clear examples** - High quality, clear style

### Combining References

**Character + Style:**
```
Create a scene with the character from reference 1, in the visual style
of reference 2, with dramatic lighting
```

**Audio + Style:**
```
Create a scene matching the energy of the music track, with the visual
style of the uploaded image
```

**Multiple Characters:**
```
Create a scene with character 1 from reference A and character 2 from
reference B, interacting in a cafe setting
```

### Reference Image Best Practices

**For Style References:**
- High resolution (1920x1080 or higher)
- Clear visual style
- Good lighting and composition
- Representative of desired aesthetic

**For Character References:**
- Clear, well-lit photos
- Neutral background preferred
- Multiple angles helpful
- High resolution for details

**For Mood References:**
- Strong emotional content
- Clear atmosphere
- Consistent mood across images
- Evocative and inspiring

## File Management

### Organizing Files

**By Project Phase:**
- Pre-production: Reference gathering
- Production: Active references
- Post-production: Archive unused files

**By Purpose:**
- Group style references together
- Keep character references separate
- Organize by scene if needed

**By Priority:**
- Order files by importance
- Keep essential files at the top
- Remove unused files regularly

### File Lifecycle

1. **Upload** - Add reference materials
2. **Use** - Generate content with files
3. **Refine** - Adjust purposes and order
4. **Archive** - Remove when no longer needed
5. **Delete** - Clean up unused files

### Storage Considerations

- Files are stored per project
- Deleting a project deletes all its files
- Files persist indefinitely until deleted
- Large files count toward storage limits
- Regular cleanup recommended

## Security and Privacy

### File Privacy

- Files are stored server-side
- Only accessible within your project
- Not shared with other users
- Deleted files are permanently removed

### File Processing

- Files are sent to Google AI services
- Used only for generation purposes
- Not stored by Google long-term
- Follow Google's AI usage policies

### Best Practices

- Don't upload sensitive personal information
- Don't upload copyrighted material without permission
- Don't upload inappropriate content
- Review files before uploading
- Delete files when no longer needed

## Resources

- [Workflow Management Guide](./WORKFLOWS.md) - AI agent customization
- [Style Templates Guide](./TEMPLATES.md) - Visual style management
- [API Documentation](../API.md) - Technical details
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues

## Feedback

File uploads enhance AI generation significantly. As you use them:
- Experiment with different reference types
- Document what works well
- Share successful approaches
- Provide feedback for improvement

Happy uploading! 📁

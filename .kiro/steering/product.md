# Product Overview

StoryBoard is an AI-powered video storyboard generator that helps creators plan and visualize music videos, product commercials, social media clips, and more through AI-generated scenes, images, and video clips.

## Core Features

- **Project Management**: Create and organize multiple storyboard projects with metadata (title, artist, song, duration)
- **Scene Creation**: Build storyboards with AI-generated scenes including prompts, images, and video clips
- **Asset Management**: Upload, organize, and manage media assets (images, videos, audio) with automatic file handling
- **AI Generation**: Leverage Google Gemini models for:
  - Chat-based storyboard ideation and refinement
  - Image generation (Imagen 3)
  - Video generation (Veo 2)
  - Automated scene prompt generation
- **Organization**: Group scenes, apply tags, track scene history, and manage project structure
- **Export**: Bundle projects with all assets for sharing or archival

## User Workflow

1. Create a new project with details
2. Use AI chat to brainstorm storyboard concepts
3. Generate scenes with AI-powered prompts
4. Generate images and videos for each scene
5. Organize scenes with groups, tags, and drag-and-drop reordering
6. Export the complete storyboard with all assets

## Technical Approach

- Full-stack TypeScript application with React frontend and Express backend
- SQLite database for persistence with migration-based schema management
- Server-side AI gateway pattern (no client-side API keys)
- Feature-first architecture with strict module boundaries
- Responsive design supporting both desktop and mobile layouts

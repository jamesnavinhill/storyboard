# API Documentation

## Overview

VibeBoard provides a RESTful API for managing storyboard projects, AI generation, workflows, templates, documents, and file uploads. All endpoints return JSON responses and use standard HTTP status codes.

## Base URL

Development: `http://localhost:4000/api`

## Authentication

Currently, the API does not require authentication. API keys for AI services are managed server-side.

## Common Response Headers

All responses include:
- `x-request-id`: Unique identifier for the request (useful for debugging)
- `x-rate-limit-limit`: Maximum requests allowed in the time window
- `x-rate-limit-remaining`: Remaining requests in the current window
- `x-rate-limit-reset`: Unix timestamp when the rate limit resets

Rate-limited responses (429) also include:
- `Retry-After`: Seconds to wait before retrying

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "errorCode": "MACHINE_READABLE_CODE",
  "requestId": "uuid-v4",
  "retryable": true,
  "details": {} // Optional validation details
}
```

### Common Error Codes

| Code                   | Status | Description                       | Retryable |
| ---------------------- | ------ | --------------------------------- | --------- |
| `VALIDATION_FAILED`    | 400    | Request payload validation failed | No        |
| `PROJECT_NOT_FOUND`    | 404    | Project does not exist            | No        |
| `SCENE_NOT_FOUND`      | 404    | Scene does not exist              | No        |
| `FILE_NOT_FOUND`       | 404    | File does not exist               | No        |
| `FILE_MISSING`         | 400    | No file provided in upload        | No        |
| `UPLOAD_FAILED`        | 500    | File upload failed                | Yes       |
| `RATE_LIMIT_EXCEEDED`  | 429    | Too many requests                 | Yes       |
| `AI_GENERATION_FAILED` | 500    | AI service error                  | Yes       |
| `INTERNAL_ERROR`       | 500    | Unexpected server error           | Yes       |

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request payload
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error (retryable)

## Rate Limiting

Default limits:
- **Window**: 60 seconds
- **Max Requests**: 100 per window

Configure via environment variables:
- `AI_RATE_LIMIT_WINDOW_MS`: Window duration in milliseconds
- `AI_RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

---

## Endpoints

### Projects

#### List Projects

```http
GET /api/projects
```

Returns all projects.

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "My Music Video",
      "artist": "Artist Name",
      "song": "Song Title",
      "duration": 180,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Project

```http
POST /api/projects
```

**Request Body:**
```json
{
  "title": "My Music Video",
  "artist": "Artist Name",
  "song": "Song Title",
  "duration": 180
}
```

**Response:** `201 Created`
```json
{
  "project": {
    "id": "uuid",
    "title": "My Music Video",
    "artist": "Artist Name",
    "song": "Song Title",
    "duration": 180,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Get Project

```http
GET /api/projects/:projectId
```

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "title": "My Music Video",
    "artist": "Artist Name",
    "song": "Song Title",
    "duration": 180,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Update Project

```http
PUT /api/projects/:projectId
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "artist": "Updated Artist"
}
```

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "title": "Updated Title",
    "artist": "Updated Artist",
    "song": "Song Title",
    "duration": 180,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

#### Delete Project

```http
DELETE /api/projects/:projectId
```

**Response:**
```json
{
  "success": true
}
```

#### Get Project Statistics

```http
GET /api/projects/:projectId/stats
```

Returns project statistics including total duration.

**Response:**
```json
{
  "projectId": "uuid",
  "sceneCount": 10,
  "totalDuration": 180,
  "totalDurationFormatted": "3:00"
}
```

---

### Scenes

#### List Scenes

```http
GET /api/projects/:projectId/scenes
```

**Response:**
```json
{
  "scenes": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "description": "Opening scene",
      "imagePrompt": "Cinematic shot of...",
      "animationPrompt": "Camera slowly pans...",
      "duration": 5,
      "order": 0,
      "groupId": null,
      "tags": ["intro"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Scene

```http
POST /api/projects/:projectId/scenes
```

**Request Body:**
```json
{
  "description": "Opening scene",
  "imagePrompt": "Cinematic shot of...",
  "animationPrompt": "Camera slowly pans...",
  "duration": 5,
  "order": 0,
  "groupId": null,
  "tags": ["intro"]
}
```

**Response:** `201 Created`

#### Update Scene

```http
PUT /api/projects/:projectId/scenes/:sceneId
```

**Request Body:** Same as Create Scene

**Response:**
```json
{
  "scene": { /* updated scene */ }
}
```

#### Delete Scene

```http
DELETE /api/projects/:projectId/scenes/:sceneId
```

**Response:**
```json
{
  "success": true
}
```

---

### Workflows

Workflows define AI agent behaviors with system instructions and subtypes.

#### List Workflows

```http
GET /api/workflows?category=music-video&search=dark
```

**Query Parameters:**
- `category` (optional): Filter by category (music-video, commercial, social, explainer)
- `search` (optional): Search by name or description

**Response:**
```json
{
  "workflows": [
    {
      "id": "uuid",
      "name": "Music Video Director",
      "description": "Expert in music video storyboarding",
      "thumbnail": "https://...",
      "category": "music-video",
      "systemInstruction": "You are an expert music video director...",
      "artStyle": "Cinematic, high-contrast",
      "examples": [
        {
          "input": "Create a dark moody scene",
          "output": "Low-key lighting, shadows..."
        }
      ],
      "metadata": {},
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Workflow

```http
POST /api/workflows
```

**Request Body:**
```json
{
  "name": "Music Video Director",
  "description": "Expert in music video storyboarding",
  "thumbnail": "https://...",
  "category": "music-video",
  "systemInstruction": "You are an expert music video director...",
  "artStyle": "Cinematic, high-contrast",
  "examples": [],
  "metadata": {}
}
```

**Response:** `201 Created`

#### Get Workflow

```http
GET /api/workflows/:id
```

**Response:**
```json
{
  "workflow": { /* workflow object */ }
}
```

#### Update Workflow

```http
PUT /api/workflows/:id
```

**Request Body:** Same as Create Workflow (all fields optional)

**Response:**
```json
{
  "workflow": { /* updated workflow */ }
}
```

#### Delete Workflow

```http
DELETE /api/workflows/:id
```

Cascade deletes all subtypes.

**Response:**
```json
{
  "success": true
}
```

---

### Workflow Subtypes

Subtypes modify workflow behavior with instruction modifiers.

#### List Subtypes

```http
GET /api/workflows/:id/subtypes
```

**Response:**
```json
{
  "subtypes": [
    {
      "id": "uuid",
      "workflowId": "uuid",
      "name": "Dark & Moody",
      "description": "Low-key lighting, shadows",
      "instructionModifier": "Focus on dark, moody aesthetics...",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Subtype

```http
POST /api/workflows/:id/subtypes
```

**Request Body:**
```json
{
  "name": "Dark & Moody",
  "description": "Low-key lighting, shadows",
  "instructionModifier": "Focus on dark, moody aesthetics..."
}
```

**Response:** `201 Created`

#### Update Subtype

```http
PUT /api/subtypes/:id
```

**Request Body:** Same as Create Subtype (all fields optional)

**Response:**
```json
{
  "subtype": { /* updated subtype */ }
}
```

#### Delete Subtype

```http
DELETE /api/subtypes/:id
```

**Response:**
```json
{
  "success": true
}
```

---

### Style Templates

Style templates define reusable visual styles for generation.

#### List Templates

```http
GET /api/templates?category=cinematic&search=noir
```

**Query Parameters:**
- `category` (optional): Filter by category (can be array)
- `search` (optional): Search by name or description

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Film Noir",
      "description": "Classic noir aesthetic",
      "thumbnail": "https://...",
      "category": ["cinematic", "dark"],
      "stylePrompt": "Black and white, high contrast, venetian blinds...",
      "tested": true,
      "examples": [],
      "metadata": {},
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Template

```http
POST /api/templates
```

**Request Body:**
```json
{
  "name": "Film Noir",
  "description": "Classic noir aesthetic",
  "thumbnail": "https://...",
  "category": ["cinematic", "dark"],
  "stylePrompt": "Black and white, high contrast...",
  "tested": false,
  "examples": [],
  "metadata": {}
}
```

**Response:** `201 Created`

#### Get Template

```http
GET /api/templates/:id
```

**Response:**
```json
{
  "template": { /* template object */ }
}
```

#### Update Template

```http
PUT /api/templates/:id
```

**Request Body:** Same as Create Template (all fields optional)

**Response:**
```json
{
  "template": { /* updated template */ }
}
```

#### Delete Template

```http
DELETE /api/templates/:id
```

**Response:**
```json
{
  "success": true
}
```

---

### Documents

Project documents support versioning, history, and export.

#### Get Document

```http
GET /api/projects/:projectId/document
```

**Response:**
```json
{
  "document": {
    "id": "uuid",
    "projectId": "uuid",
    "version": 5,
    "content": {
      "title": "My Project",
      "style": "Cinematic",
      "goals": "Create an engaging music video",
      "outline": "Act 1: Introduction...",
      "scenes": []
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

#### Update Document

```http
PUT /api/projects/:projectId/document
```

Automatically creates a new version. Keeps last 10 versions.

**Request Body:**
```json
{
  "content": {
    "title": "Updated Title",
    "style": "Cinematic",
    "goals": "Updated goals",
    "outline": "Updated outline",
    "scenes": []
  }
}
```

**Response:**
```json
{
  "document": { /* updated document with new version */ }
}
```

#### Get Document History

```http
GET /api/projects/:projectId/document/history
```

**Response:**
```json
{
  "history": [
    {
      "version": 5,
      "createdAt": "2025-01-01T12:00:00.000Z",
      "contentPreview": "Updated Title..."
    },
    {
      "version": 4,
      "createdAt": "2025-01-01T11:00:00.000Z",
      "contentPreview": "Previous Title..."
    }
  ]
}
```

#### Restore Document Version

```http
POST /api/projects/:projectId/document/restore/:version
```

Creates a new version with the content from the specified version.

**Response:**
```json
{
  "document": { /* restored document with new version */ }
}
```

#### Export Document

```http
POST /api/projects/:projectId/document/export
```

**Request Body:**
```json
{
  "format": "markdown",
  "includeAssets": false
}
```

**Formats:**
- `markdown`: Markdown file
- `pdf`: PDF document
- `json`: JSON file

**Response:** Binary file download with appropriate Content-Type and Content-Disposition headers

---

### File Uploads

File upload system with size-based routing and Files API integration.

#### Upload File

```http
POST /api/files/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload (max size configurable, default 100MB)
- `projectId`: Project UUID
- `purpose`: File purpose (see below)

**File Purposes:**
- `style-reference`: Visual style reference
- `character-reference`: Character appearance reference
- `audio-reference`: Audio/music reference
- `text-document`: Text document for context
- `general-reference`: General reference material

**Response:** `201 Created`
```json
{
  "file": {
    "id": "uuid",
    "projectId": "uuid",
    "name": "reference.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "purpose": "style-reference",
    "uri": "https://...",
    "inlineData": null,
    "thumbnail": "data:image/jpeg;base64,...",
    "uploadedAt": "2025-01-01T00:00:00.000Z"
  },
  "requestId": "uuid"
}
```

**Routing Logic:**
- Files < 20MB: Stored as base64 in `inlineData`
- Files ≥ 20MB: Uploaded to Files API, `uri` provided
- Video/audio files: Always routed to Files API

#### Get File

```http
GET /api/files/:id
```

**Response:**
```json
{
  "file": { /* file object */ },
  "requestId": "uuid"
}
```

#### Delete File

```http
DELETE /api/files/:id
```

Cleans up Files API resources if applicable.

**Response:**
```json
{
  "success": true,
  "requestId": "uuid"
}
```

---

### AI Generation

#### Streaming Chat

```http
POST /api/ai/chat/stream
Content-Type: application/json
```

Server-Sent Events (SSE) endpoint for streaming chat responses.

**Request Body:**
```json
{
  "projectId": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "Create a dark opening scene"
    }
  ],
  "chatModel": "gemini-2.0-flash-exp",
  "thinkingMode": false,
  "workflowId": "uuid",
  "subtypeId": "uuid"
}
```

**Response:** SSE stream
```
event: token
data: {"token": "Here"}

event: token
data: {"token": " is"}

event: token
data: {"token": " the"}

event: done
data: {"fullText": "Here is the response"}
```

**Events:**
- `token`: Partial response token
- `done`: Stream complete with full text
- `error`: Error occurred

**Stop Generation:** Close the connection

#### Enhanced Storyboard Generation

```http
POST /api/ai/storyboard/enhanced
```

Generates scenes with auto-generated animation prompts and metadata.

**Request Body:**
```json
{
  "projectId": "uuid",
  "concept": "Dark music video with urban setting",
  "sceneCount": 8,
  "workflowId": "uuid",
  "subtypeId": "uuid",
  "styleTemplateId": "uuid"
}
```

**Response:**
```json
{
  "scenes": [
    {
      "description": "Opening shot of city at night",
      "imagePrompt": "Cinematic wide shot...",
      "animationPrompt": "Camera slowly pans right...",
      "duration": 5,
      "metadata": {
        "cameraMovement": "pan-right",
        "lighting": "low-key",
        "mood": "mysterious"
      }
    }
  ],
  "requestId": "uuid"
}
```

#### Style Preview Generation

```http
POST /api/ai/preview-styles
```

Generates exactly 4 sample scenes representing different style directions.

**Request Body:**
```json
{
  "projectId": "uuid",
  "concept": "Music video concept",
  "workflowId": "uuid"
}
```

**Response:**
```json
{
  "previews": [
    {
      "styleName": "Cinematic Noir",
      "description": "Dark, moody aesthetic",
      "imagePrompt": "Black and white, high contrast...",
      "metadata": {}
    }
  ],
  "requestId": "uuid"
}
```

#### Generate Image

```http
POST /api/ai/image
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "sceneId": "uuid",
  "prompt": "Cinematic shot of city at night",
  "imageModel": "imagen-4.0-generate-001",
  "aspectRatio": "16:9",
  "thinkingMode": false
}
```

**Models:**
- `imagen-4.0-generate-001` (default)
- `imagen-4.0-generate-001-fast`
- `gemini-2.5-flash-image` (supports editing)

**Response:**
```json
{
  "asset": {
    "id": "uuid",
    "projectId": "uuid",
    "sceneId": "uuid",
    "type": "image",
    "url": "/data/assets/...",
    "prompt": "Cinematic shot...",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "requestId": "uuid"
}
```

#### Generate Video

```http
POST /api/ai/video
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "sceneId": "uuid",
  "prompt": "Camera pans across city skyline",
  "model": "veo-3.1-generate-001",
  "aspectRatio": "16:9",
  "duration": 5,
  "resolution": "1080p"
}
```

**Models:**
- `veo-3.1-generate-001` (default, supports resolution parameter)
- `veo-2.0-generate-001` (no resolution parameter)

**Resolutions (Veo 3.1 only):**
- `720p`
- `1080p`

**Response:**
```json
{
  "asset": {
    "id": "uuid",
    "projectId": "uuid",
    "sceneId": "uuid",
    "type": "video",
    "url": "/data/assets/...",
    "prompt": "Camera pans...",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "requestId": "uuid"
}
```

---

## Configuration

### Environment Variables

```bash
# AI Service
GOOGLE_API_KEY=your-api-key

# Rate Limiting
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE_MB=100
FILES_API_ENABLED=true

# Features
ENABLE_THINKING_MODE=false
ENABLE_CONTEXT_CACHING=true
ENABLE_STREAMING=true

# Models
DEFAULT_VIDEO_MODEL=veo-3.1-generate-001
```

See [CONFIGURATION.md](./CONFIGURATION.md) for full details.

---

## Best Practices

### Error Handling

1. Always check `retryable` field in error responses
2. Use `requestId` for debugging and support
3. Respect `Retry-After` header on 429 responses
4. Implement exponential backoff for retryable errors

### Rate Limiting

1. Monitor `x-rate-limit-remaining` header
2. Implement client-side rate limiting
3. Cache responses when possible
4. Use batch operations where available

### File Uploads

1. Check file size before upload (max 100MB default)
2. Use appropriate `purpose` for better AI context
3. Generate thumbnails client-side for preview
4. Clean up unused files periodically

### Streaming Chat

1. Handle connection errors gracefully
2. Implement reconnection logic
3. Buffer tokens for smooth display
4. Provide stop generation UI

### Document Management

1. Auto-save frequently (every 30 seconds)
2. Show version history for transparency
3. Warn before restoring old versions
4. Export regularly for backup

---

## Troubleshooting

### Common Issues

**429 Too Many Requests**
- Wait for `Retry-After` seconds
- Implement exponential backoff
- Consider caching responses

**500 Internal Server Error**
- Check `requestId` in logs
- Retry if `retryable: true`
- Contact support if persistent

**File Upload Fails**
- Check file size (max 100MB)
- Verify MIME type is supported
- Ensure project exists

**Streaming Disconnects**
- Implement reconnection logic
- Check network stability
- Monitor server logs

### Support

Include the following in support requests:
- `requestId` from error response
- Request payload (sanitized)
- Timestamp of request
- Expected vs actual behavior

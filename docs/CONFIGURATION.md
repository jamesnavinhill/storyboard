# Configuration Reference

This reference reflects the systems delivered through Phase 3 (SQLite persistence, refactored frontend, hardened scene lifecycle). Update this document only when new functionality lands to keep configuration guidance grounded in shipped code.

## Environment Variables

The app reads configuration from `.env.local` (or the process environment) using [`dotenv`](https://www.npmjs.com/package/dotenv). Copy `.env.example` when bootstrapping a new environment.

> [!IMPORTANT]
> Environment variables are validated at server startup using Zod schemas. Invalid configuration will cause the server to fail fast with helpful error messages.

| Name                         | Required | Default                | Purpose                                                                                                                                                                         |
| ---------------------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`             | ➖        | —                      | Consumed by the server-side Gemini client (`server/services/geminiClient.ts`). Needed for `/api/ai/*`; without it the routes return 503 so flip the legacy client flag instead. |
| `PORT`                       | ➖        | `4000`                 | Express server listen port (`server/index.ts`). Change when running behind a proxy or to avoid local conflicts.                                                                 |
| `DB_PATH`                    | ➖        | `data/storyboard.db`   | Absolute or relative path to the SQLite database file. Helpful for test runs or alternate storage locations.                                                                    |
| `DATA_DIR`                   | ➖        | `data/`                | Root for persistent assets. The server stores files under `<DATA_DIR>/assets/<projectId>/` and ensures the tree exists on boot.                                                 |
| `ENABLE_AI_TELEMETRY`        | ➖        | `false`                | When set to `true`, emits JSON logs for `/api/ai/*` requests containing requestId, status, latency, model, and error context. Disabled by default for quieter local runs.       |
| `AI_RATE_LIMIT_WINDOW_MS`    | ➖        | `60000`                | Sliding window in milliseconds for in-memory AI rate limiting. Adjust upward for higher burst tolerance.                                                                        |
| `AI_RATE_LIMIT_MAX_REQUESTS` | ➖        | `30`                   | Maximum AI requests allowed per window (per IP). Tune alongside `AI_RATE_LIMIT_WINDOW_MS` to shape burst traffic.                                                               |
| `CORS_ORIGIN`                | ➖        | —                      | Supply a specific origin to lock down API access; defaults to permissive CORS for local development and tooling.                                                                |
| `VITE_API_URL`               | ➖        | `/api`                 | Frontend-only base URL for API requests. Override when the UI and API are served from different hosts or prefixes.                                                              |
| `VITE_USE_LEGACY_GEMINI`     | ➖        | `false`                | When `true`, the UI skips the server AI gateway and talks to the legacy browser Gemini provider. Use for offline demos or when no Gemini key is configured server-side.         |
| `MAX_FILE_SIZE_MB`           | ➖        | `100`                  | Maximum file size in megabytes for uploads. Files larger than 20MB are routed through Gemini Files API.                                                                         |
| `FILES_API_ENABLED`          | ➖        | `true`                 | Enable Gemini Files API for large file uploads. When disabled, all files use inline base64 encoding.                                                                            |
| `ENABLE_THINKING_MODE`       | ➖        | `false`                | Enable thinking mode for AI requests. Shows reasoning process before responses. Improves quality for complex tasks but increases cost and latency.                              |
| `ENABLE_CONTEXT_CACHING`     | ➖        | `true`                 | Enable context caching for improved performance. Caches conversation context to reduce redundant processing.                                                                    |
| `DEFAULT_VIDEO_MODEL`        | ➖        | `veo-3.1-generate-001` | Default video generation model. Options: `veo-3.1-generate-001`, `veo-3.0-generate-001`, `veo-3.0-fast-generate-001`, `veo-2.0-generate-001`.                                   |
| `ENABLE_STREAMING`           | ➖        | `true`                 | Enable Server-Sent Events (SSE) streaming for chat responses. Provides real-time progressive text display with stop generation capability.                                      |

> ℹ️  Vite automatically exposes variables prefixed with `VITE_`. Other keys stay server-side.

## File & Directory Layout

- `data/` — default persistence root created automatically if absent.
  - `storyboard.db` — SQLite database (via `better-sqlite3`).
  - `assets/` — project-scoped directories generated on upload (e.g. `assets/<projectId>/<fileName>`).
- `server/migrations/` — SQL migrations executed by `npm run migrate` and on server boot.
- `server/scripts/` — operational scripts for migrations, seeding, and DB verification.
- `docs/` — architecture and configuration references (this file, theme notes, model notes).

Ensure the OS user running the dev server has read/write access to `data/`.

## NPM Scripts

| Script               | Description                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Launches the Vite frontend dev server on port 3000.                                                 |
| `npm run dev:server` | Starts the Express API (`server/index.ts`) with automatic TypeScript transpilation via `tsx watch`. |
| `npm run dev:all`    | Runs both frontend and server concurrently.                                                         |
| `npm run build:all`  | Builds both frontend and server for production.                                                     |
| `npm run build:server` | Compiles TypeScript server to `dist-server/`.                                                     |
| `npm run db:reset`   | Deletes the database file and re-seeds with sample data.                                            |
| `npm run migrate`    | Executes pending SQL migrations using the shared `better-sqlite3` connection.                       |
| `npm run seed`       | Populates the database with a sample project, scenes, and chat to verify persistence wiring.        |
| `npm run check:db`   | Runs migrations, validates that required tables exist, and checks asset directory write access.     |
| `npm run test:api`   | Executes Supertest-powered smoke tests covering health, project, scene, chat, and asset endpoints.  |

## Required Secrets Checklist

- Gemini API key stored as `GEMINI_API_KEY` in `.env.local`.
- (Optional) Additional third-party keys can be added to the same file. Prefix keys with `VITE_` if they must be exposed to the browser.

## Manual Verification Steps

After configuring environment variables:

1. `npm install`
2. `npm run check:db` — ensures migrations apply and the assets directory is writable.
3. `npm run dev:server` (keep running) and `npm run dev` in another terminal.
4. Visit <http://localhost:3000>, generate scenes, and confirm assets populate under `data/assets/`.

If deploying to another host, repeat these steps with your deployment environment variables to confirm parity.

## Runtime Services Snapshot

- Express API (`server/app.ts`) exposes `/api/projects`, `/api/scenes`, `/api/chats`, and `/api/assets`, enforcing input via Zod schemas.
- Static asset serving mounts `<DATA_DIR>/assets` at `/api/assets/files`, so generated files are reachable once persisted.
- The SQLite connection (`server/db.ts`) is shared across routes, migration runner, and maintenance scripts.
- Frontend requests flow through `src/services/projectService.ts`, which respects `VITE_API_URL` and attaches credentials for same-origin cookies.

## AI Telemetry & Rate Limiting

### Telemetry Configuration

**Environment Variable:** `ENABLE_AI_TELEMETRY` (default: `false`)

When enabled, the server emits structured JSON logs for all `/api/ai/*` requests. This is disabled by default to keep local development quiet, but should be enabled in staging and production environments for debugging and monitoring.

**Log Format:**

```json
{
  "requestId": "uuid-v4",
  "endpoint": "/api/ai/chat",
  "status": 200,
  "latencyMs": 1234,
  "geminiModel": "gemini-2.0-flash-exp",
  "projectId": "project-uuid",
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

**Error Log Format:**

```json
{
  "requestId": "uuid-v4",
  "endpoint": "/api/ai/image",
  "status": 500,
  "latencyMs": 5678,
  "geminiModel": "imagen-3.0-generate-001",
  "projectId": "project-uuid",
  "retryable": true,
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "promptHash": "sha256-hash",
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

**Implementation Details:**

- Logs are written to stdout using the `pino` logger
- Request IDs are generated server-side and returned via `x-request-id` header
- Prompt hashes are SHA-256 hashes of the prompt text (for privacy)
- Logs include timing information for performance monitoring

### Rate Limiting Configuration

**Environment Variables:**

- `AI_RATE_LIMIT_WINDOW_MS` (default: `60000` - 1 minute)
- `AI_RATE_LIMIT_MAX_REQUESTS` (default: `30`)

The server enforces in-memory rate limiting on all `/api/ai/*` endpoints using a token bucket algorithm. Rate limits are applied per IP address.

**Default Limits:**

- 30 requests per minute per IP address
- Sliding window (not fixed intervals)

**Rate Limit Response:**
When rate limit is exceeded, the server returns:

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45,
  "requestId": "uuid-v4"
}
```

**HTTP Headers:**

- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when window resets
- `Retry-After`: Seconds to wait before retrying (on 429 responses)

**Tuning Recommendations:**

- **Development**: Keep defaults or disable rate limiting entirely
- **Staging**: Use production-like limits for testing
- **Production**: Adjust based on your Gemini API quota and expected traffic

### Request ID Flow for Debugging

Request IDs enable end-to-end tracing of AI requests from the UI through the server to the Gemini API.

**Flow:**

1. **Server generates** a UUID v4 request ID when receiving an AI request
2. **Server logs** the request ID with telemetry data (if enabled)
3. **Server returns** the request ID via `x-request-id` response header
4. **Client captures** the request ID from the response
5. **Client displays** the request ID in error toasts and UI messages
6. **Support uses** the request ID to search server logs

**Example Error Toast:**

```
Failed to generate image
Request ID: 550e8400-e29b-41d4-a716-446655440000
[Retry] [View Docs]
```

**Searching Logs:**

```bash
# Find all logs for a specific request
grep "550e8400-e29b-41d4-a716-446655440000" server.log

# Find all failed requests
grep '"status":500' server.log | grep '/api/ai/'

# Find all rate limit errors
grep '"errorCode":"RATE_LIMIT_EXCEEDED"' server.log
```

## AI Model Configuration

### Video Models

**Environment Variable:** `DEFAULT_VIDEO_MODEL` (default: `veo-3.1-generate-001`)

VibeBoard supports all available Veo video generation models:

| Model                       | Quality | Speed    | Resolution Support | Notes                                 |
| --------------------------- | ------- | -------- | ------------------ | ------------------------------------- |
| `veo-3.1-generate-001`      | Highest | Moderate | Up to 1080p        | Latest model, best quality (default)  |
| `veo-3.0-generate-001`      | High    | Moderate | Up to 1080p        | Proven quality, reliable              |
| `veo-3.0-fast-generate-001` | Good    | Fast     | Up to 720p         | Optimized for speed                   |
| `veo-2.0-generate-001`      | Good    | Moderate | Fixed              | Legacy model, no resolution parameter |

**Usage Example:**

```bash
# Use Veo 3.1 (default)
DEFAULT_VIDEO_MODEL=veo-3.1-generate-001

# Use faster model for development
DEFAULT_VIDEO_MODEL=veo-3.0-fast-generate-001
```

**Important Notes:**

- Veo 2.0 does not support the resolution parameter - it will be automatically omitted
- Aspect ratio limitations vary by model - check Gemini API documentation
- Higher quality models have longer generation times and higher costs

### Text Models

VibeBoard uses different text models for different purposes:

| Model                   | Use Case       | Quality | Speed    | Cost   |
| ----------------------- | -------------- | ------- | -------- | ------ |
| `gemini-2.5-pro`        | Chat mode      | Highest | Moderate | Higher |
| `gemini-2.5-flash`      | Storyboard gen | High    | Fast     | Lower  |
| `gemini-2.5-flash-lite` | Simple tasks   | Good    | Fastest  | Lowest |

**Streaming Support:**

**Environment Variable:** `ENABLE_STREAMING` (default: `true`)

When enabled, chat responses stream progressively using Server-Sent Events (SSE):

- Real-time text display as the model generates
- Stop generation button to halt mid-response
- Improved perceived performance
- Better user experience for long responses

**Usage Example:**

```bash
# Enable streaming (default)
ENABLE_STREAMING=true

# Disable streaming (return complete responses)
ENABLE_STREAMING=false
```

### Image Models

VibeBoard supports all available Imagen models with Imagen 4.0 as default:

| Model                          | Quality | Speed    | Features                       |
| ------------------------------ | ------- | -------- | ------------------------------ |
| `imagen-4.0-generate-001`      | Highest | Moderate | Latest, best quality (default) |
| `imagen-4.0-generate-001-fast` | High    | Fast     | Optimized for speed            |
| `imagen-3.0-generate-001`      | High    | Moderate | Proven, reliable               |
| `gemini-2.5-flash-image`       | Good    | Fastest  | Supports editing               |

### Thinking Mode

**Environment Variable:** `ENABLE_THINKING_MODE` (default: `false`)

Thinking mode shows the model's reasoning process before generating responses. This improves output quality for complex tasks but increases cost and latency.

**When to Enable:**

- Complex storyboard concepts requiring deep reasoning
- Multi-step problem solving
- Tasks requiring careful consideration
- Production environments where quality is critical

**When to Disable:**

- Simple chat interactions
- Development and testing
- Cost-sensitive environments
- Speed-critical applications

**Usage Example:**

```bash
# Enable thinking mode for production
ENABLE_THINKING_MODE=true

# Disable for development (default)
ENABLE_THINKING_MODE=false
```

**Trade-offs:**

- ✅ Improved quality for complex tasks
- ✅ Transparency into model reasoning
- ❌ Increased latency (2-3x longer)
- ❌ Higher API costs
- ❌ More verbose responses

### Context Caching

**Environment Variable:** `ENABLE_CONTEXT_CACHING` (default: `true`)

Context caching stores conversation context to reduce redundant processing and improve performance.

**Benefits:**

- Faster response times for multi-turn conversations
- Reduced API costs for repeated context
- Better performance for long conversations
- Improved user experience

**Usage Example:**

```bash
# Enable caching (default)
ENABLE_CONTEXT_CACHING=true

# Disable caching
ENABLE_CONTEXT_CACHING=false
```

**When to Disable:**

- Testing scenarios requiring fresh context
- Debugging context-related issues
- Privacy-sensitive applications
- Environments with limited memory

### File Upload Configuration

**Environment Variables:**

- `MAX_FILE_SIZE_MB` (default: `100`)
- `FILES_API_ENABLED` (default: `true`)

**File Routing Logic:**

Files are automatically routed based on size and type:

```
File Upload
    ↓
Size Check
    ↓
┌───────────────┴───────────────┐
│                               │
< 20MB                      > 20MB
│                               │
↓                               ↓
Base64 Inline              Files API
```

**Additional Routing:**

- Video files → Always use Files API
- Audio files → Always use Files API
- Multiple large files → Use Files API

**Usage Example:**

```bash
# Default configuration
MAX_FILE_SIZE_MB=100
FILES_API_ENABLED=true

# Increase limit for large video files
MAX_FILE_SIZE_MB=500

# Disable Files API (use inline only)
FILES_API_ENABLED=false
```

**Important Notes:**

- Files larger than `MAX_FILE_SIZE_MB` will be rejected
- Disabling Files API limits uploads to ~20MB (base64 encoding overhead)
- Files API is required for video and audio files
- Inline base64 is more efficient for small files

## Troubleshooting

### Common Configuration Issues

#### Issue: "503 Service Unavailable" on AI endpoints

**Symptoms:**

- All `/api/ai/*` requests return 503
- Error message: "Gemini API key not configured"

**Solution:**

1. Verify `GEMINI_API_KEY` is set in `.env.local`
2. Restart the server (`npm run dev:server`)
3. Check server logs for "Gemini API key not configured" warning

**Alternative:**
If you don't have a Gemini API key, enable legacy client mode:

```bash
VITE_USE_LEGACY_GEMINI=true
```

#### Issue: Rate limit errors in development

**Symptoms:**

- Frequent 429 responses during testing
- Error: "Rate limit exceeded"

**Solution:**
Increase rate limits for development:

```bash
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX_REQUESTS=100
```

Or disable rate limiting entirely (not recommended for production):

```bash
AI_RATE_LIMIT_MAX_REQUESTS=999999
```

#### Issue: Missing request IDs in error messages

**Symptoms:**

- Error toasts don't show request IDs
- Can't correlate UI errors with server logs

**Solution:**

1. Verify server is returning `x-request-id` header
2. Check browser network tab for the header
3. Ensure client error handling captures the header
4. Update to latest version (request IDs added in Phase 7)

#### Issue: No telemetry logs appearing

**Symptoms:**

- `ENABLE_AI_TELEMETRY=true` but no logs
- Can't find AI request logs in output

**Solution:**

1. Verify environment variable is set correctly
2. Restart the server after changing the variable
3. Check that requests are actually hitting `/api/ai/*` endpoints
4. Look for JSON-formatted logs in stdout (not stderr)

#### Issue: Database migration failures

**Symptoms:**

- Server fails to start
- Error: "Migration failed" or "Table already exists"

**Solution:**

1. Check database file permissions: `ls -la data/storyboard.db`
2. Verify migrations directory exists: `ls server/migrations/`
3. Try manual migration: `npm run migrate`
4. If corrupted, backup and recreate: `mv data/storyboard.db data/storyboard.db.bak && npm run migrate`

#### Issue: Asset files not accessible

**Symptoms:**

- Images/videos don't load in UI
- 404 errors for `/api/assets/files/*`

**Solution:**

1. Verify `DATA_DIR` environment variable is set correctly
2. Check asset directory exists: `ls -la data/assets/`
3. Verify file permissions: `ls -la data/assets/<projectId>/`
4. Run asset integrity check: `npm run maintain prune`

#### Issue: Streaming not working

**Symptoms:**

- Chat responses appear all at once instead of progressively
- No stop generation button visible
- SSE connection errors in browser console

**Solution:**

1. Verify `ENABLE_STREAMING=true` in `.env.local`
2. Check browser supports Server-Sent Events (all modern browsers do)
3. Verify no proxy or firewall blocking SSE connections
4. Check server logs for SSE-related errors
5. Test with curl: `curl -N http://localhost:4000/api/ai/chat/stream`

#### Issue: Thinking mode not applying

**Symptoms:**

- No reasoning process shown in responses
- Response quality unchanged after enabling thinking mode
- No performance impact observed

**Solution:**

1. Verify `ENABLE_THINKING_MODE=true` in `.env.local`
2. Restart the server after changing the variable
3. Check that requests include `thinkingMode: true` parameter
4. Verify Gemini API supports thinking mode for selected model
5. Check server logs for thinking mode activation

#### Issue: Wrong video model being used

**Symptoms:**

- Video generation using unexpected model
- Resolution parameter errors with Veo 2.0
- Quality not matching expectations

**Solution:**

1. Verify `DEFAULT_VIDEO_MODEL` is set correctly in `.env.local`
2. Check model name spelling (e.g., `veo-3.1-generate-001`)
3. Restart server after changing the variable
4. Verify model is available in your Gemini API tier
5. Check server logs for model selection

#### Issue: File upload size limit errors

**Symptoms:**

- "File too large" errors for files under 100MB
- Upload fails immediately without progress
- 413 Payload Too Large errors

**Solution:**

1. Verify `MAX_FILE_SIZE_MB` is set appropriately in `.env.local`
2. Check if reverse proxy (nginx, Apache) has lower limits
3. Verify `FILES_API_ENABLED=true` for large files
4. Check Gemini Files API quota and limits
5. Try smaller file or compress before uploading

#### Issue: Context caching not working

**Symptoms:**

- Slow responses in multi-turn conversations
- High API costs for repeated context
- No performance improvement over time

**Solution:**

1. Verify `ENABLE_CONTEXT_CACHING=true` in `.env.local`
2. Check Gemini API supports caching for selected model
3. Verify conversation has sufficient context to cache
4. Check server logs for caching-related messages
5. Monitor API usage to confirm caching is active

### Performance Issues

#### Issue: Slow AI response times

**Symptoms:**

- Long wait times for image/video generation
- Timeout errors

**Diagnostics:**

1. Enable telemetry to measure latency: `ENABLE_AI_TELEMETRY=true`
2. Check `latencyMs` in logs to identify slow endpoints
3. Verify network connectivity to Gemini API
4. Check Gemini API status page

**Solutions:**

- Use faster models (e.g., `gemini-2.0-flash-exp` instead of `gemini-1.5-pro`)
- Reduce image resolution or video length
- Check for rate limiting from Gemini API

#### Issue: High memory usage

**Symptoms:**

- Server memory usage grows over time
- Out of memory errors

**Diagnostics:**

1. Monitor memory with: `node --max-old-space-size=4096 server/index.ts`
2. Check for memory leaks in long-running processes
3. Profile with Node.js inspector

**Solutions:**

- Restart server periodically in production
- Implement connection pooling for database
- Clear old assets: `npm run maintain prune`

### Security Issues

#### Issue: API key exposed in client bundle

**Symptoms:**

- `GEMINI_API_KEY` visible in browser DevTools
- Security warning in build output

**Solution:**

1. Verify `GEMINI_API_KEY` is NOT prefixed with `VITE_`
2. Check `vite.config.ts` doesn't define the key
3. Rebuild: `npm run build:all`
4. Verify key is not in `dist/` files: `grep -r "GEMINI_API_KEY" dist/`

#### Issue: CORS errors in production

**Symptoms:**

- API requests blocked by CORS policy
- Error: "No 'Access-Control-Allow-Origin' header"

**Solution:**
Set `CORS_ORIGIN` to your frontend domain:

```bash
CORS_ORIGIN=https://yourdomain.com
```

For multiple origins, modify `server/app.ts` CORS configuration.

## Tailwind CSS Configuration

### Production Setup (Current)

Tailwind CSS is installed as a proper npm dependency with PostCSS integration. This provides:

- Optimized bundle sizes (only includes used styles)
- Better performance (pre-compiled CSS)
- No browser console warnings
- Integration with build pipeline

**Configuration Files:**

- `tailwind.config.js` - Tailwind configuration with content paths
- `postcss.config.js` - PostCSS plugins (tailwindcss, autoprefixer)
- `index.css` - Contains `@tailwind` directives

**How It Works:**

Vite automatically processes PostCSS during build. The pipeline:

1. Processes Tailwind directives in `index.css`
2. Scans all files matching content paths for class usage
3. Purges unused styles in production builds
4. Minifies the output CSS
5. Includes optimized CSS in the bundle

**Customization:**

Edit `tailwind.config.js` to customize the design system:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
      spacing: {
        // Custom spacing scale
      },
    },
  },
  plugins: [],
}
```

## Known Constraints (Phase 3)

- Asset uploads honour the provided `fileName`; stick to simple filenames until sanitisation is introduced.
- Gemini SDK calls now execute on the server (`/api/ai/*`), so the browser never sees `GEMINI_API_KEY`.
- Tailwind CSS is now installed as npm package with PostCSS integration for production builds.

## Future Configuration Hooks

Upcoming initiatives (API/prompt redesign, richer project management, server-side model calls) will introduce additional settings. Capture those only after the corresponding code lands to keep this reference authoritative.

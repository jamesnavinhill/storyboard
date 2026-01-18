# Deploying a Live Demo to Vercel

This document outlines the implementation status and deployment instructions for the Storyboard application on Vercel.

## Implementation Status

### ✅ Completed Features

| Feature | Status | Files |
|---------|--------|-------|
| Vercel configuration | ✅ Done | `vercel.json` |
| Storage abstraction layer | ✅ Done | `server/services/storageService.ts` |
| Local storage service | ✅ Done | `server/services/localStorage.ts` |
| Vercel Blob storage service | ✅ Done | `server/services/vercelBlobStorage.ts` |
| File upload refactoring | ✅ Done | `server/services/fileUploadService.ts` |
| Environment detection | ✅ Done | `server/utils/environment.ts` |
| User API key UI | ✅ Done | `src/features/settings/components/ApiKeySettings.tsx` |
| API key store | ✅ Done | `src/stores/apiKeyStore.ts` |
| Frontend API key header | ✅ Done | `src/services/providers/server.ts` |
| Backend API key extraction | ✅ Done | `server/routes/ai.ts`, `server/utils/requestContext.ts` |
| Database abstraction layer | ✅ Done | `server/database.ts` |
| PostgreSQL driver | ✅ Done | `pg`, `@types/pg` packages |
| Turso/libSQL client | ✅ Done | `@libsql/client` package |
| PostgreSQL migrations | ✅ Done | `server/migrations/postgres/001_complete_schema.sql` |

### 🔴 Remaining Work

| Feature | Status | Notes |
|---------|--------|-------|
| Async store refactoring | 🔴 Pending | Stores use sync SQLite API; need async conversion |
| Manual Vercel setup | 🔴 Pending | Create project, provision services |
| Run migrations | 🔴 Pending | Execute SQL on production database |
| End-to-end testing | 🔴 Pending | Test all features on Vercel |

## Database Options

### Option 1: Turso (Recommended for SQLite Compatibility)

Turso provides serverless SQLite that's fully compatible with the existing SQL queries.

**Pros:**
- No SQL query changes needed (SQLite syntax)
- Generous free tier (500 databases)
- Fast and globally distributed

**Setup:**
1. Create account at https://turso.tech
2. Install CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
3. Create database: `turso db create storyboard-demo`
4. Get credentials: `turso db show storyboard-demo --url` and `turso db tokens create storyboard-demo`
5. Add to Vercel environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`

### Option 2: Vercel Postgres

Native Vercel integration with PostgreSQL.

**Pros:**
- Integrated with Vercel dashboard
- Auto-provisioned SSL

**Cons:**
- Requires SQL query adjustments (some syntax differences)
- More complex migration

**Setup:**
1. Enable Vercel Postgres from project dashboard
2. Add `DATABASE_URL` environment variable (auto-provisioned)
3. Run PostgreSQL migrations: `server/migrations/postgres/001_complete_schema.sql`

## Deployment Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Link Project

```bash
vercel link
```

### 3. Provision Storage

From Vercel dashboard:
1. Go to your project → Storage tab
2. Create Vercel Blob store
3. Create Vercel Postgres OR configure Turso

### 4. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
# Required
GEMINI_API_KEY=<your-fallback-key>

# For Vercel Blob
BLOB_READ_WRITE_TOKEN=<auto-provisioned>

# For Turso (Option 1)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=<your-token>

# For Vercel Postgres (Option 2)
DATABASE_URL=<auto-provisioned>
```

### 5. Run Database Migrations

For Turso:
```bash
turso db shell storyboard-demo < server/migrations/postgres/001_complete_schema.sql
```

For Vercel Postgres:
Connect using a PostgreSQL client and run `server/migrations/postgres/001_complete_schema.sql`

### 6. Deploy

```bash
vercel --prod
```

Or push to your Git repository for automatic deployment.

## Architecture

### Local Development

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Express   │───▶│   SQLite    │
│   (Vite)    │    │   Server    │    │   (local)   │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Local Files │
                   │ (data/assets)│
                   └─────────────┘
```

### Vercel Production

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│  Serverless │───▶│   Turso/    │
│   (Static)  │    │  Functions  │    │   Postgres  │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Vercel Blob │
                   └─────────────┘
```

## User API Keys

Demo users can provide their own Gemini API key:

1. Open Settings panel in the app
2. Enter Gemini API key in the "API Key Settings" section
3. Key is stored in memory only (not persisted)
4. Key is sent as `Authorization: Bearer <key>` header
5. Backend prioritizes user key over server fallback

## Testing Checklist

- [ ] Create new project (DB write)
- [ ] Upload image (Blob write)
- [ ] View uploaded image (Blob read)
- [ ] Generate content with user API key
- [ ] Refresh page, verify data persists
- [ ] Test local development still works

## Troubleshooting

### "Database not initialized" error
Ensure environment variables are set correctly and migrations have run.

### "Unable to upload file" error
Check `BLOB_READ_WRITE_TOKEN` is set and Vercel Blob is provisioned.

### AI features not working
- Check `GEMINI_API_KEY` is set as fallback
- Verify user has entered their key in settings
- Check API key format is correct

### Local development broken
The codebase uses environment detection. Ensure:
- No `VERCEL_ENV` set locally
- No `TURSO_DATABASE_URL` set locally (unless testing Turso)
- Local SQLite file exists at `data/storyboard.db`

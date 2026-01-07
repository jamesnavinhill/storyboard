# StoryBoard AI Music Video Storyboarder

The StoryBoard AI Music Video Storyboarder is a production-ready application with complete project management, asset management, and AI-powered storyboard generation capabilities. Five major phases are complete, with comprehensive backend infrastructure and polished frontend integration.

## Current Status

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies: `npm install`
2. Copy `.env.example` → `.env.local`, set `GEMINI_API_KEY`, and review overrides in [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md).
3. Prepare the database:
   - `npm run migrate` to apply SQL migrations, or
   - `npm run seed` to apply migrations and load a sample project.
4. Start services in separate terminals:
   - `npm run dev:server` (Express API on port 4000)
   - `npm run dev` (Vite frontend on port 3000, proxying `/api` → 4000)
5. Visit <http://localhost:3000>; projects and generated assets are stored under `data/`.

## Build & Typecheck

- Frontend build (Vite): `npm run build` or `npm run build:web`
- Server build (`dist-server/`): `npm run build:server`
- Build both: `npm run build:all`
- Frontend typecheck: `npm run typecheck`
- Server typecheck: `npm run typecheck:server`

Run the compiled server with `npm run start:server` once `dist-server` is generated.

Note: `dist-server/` is a generated build artifact and is ignored by version control. Do not commit files from this folder.

## Bundle analysis & CI guard

- Analyze bundles locally: `npm run analyze` (generates `dist/stats.html` treemap with gzip/brotli sizes; only included when ANALYZE is set in the script).
- CI size guard:
  - `npm run ci:build` — production build used by CI
  - `npm run ci:check-bundle` — checks gzip sizes and fails if limits are exceeded
  - Current limits (tweak in `scripts/check-bundle-sizes.mjs`): entry ≤ 200 kB gzip; each non‑vendor app chunk ≤ 300 kB gzip.

## Operational Scripts

- `npm run check:db` — verifies migrations and asset directory permissions.
- `npm run maintain prune` — removes orphaned asset references/files and prunes empty directories.
- `npm run maintain export <projectId> [outputDir]` — exports a project bundle (JSON + assets).
- `npm run test:api` — Vitest + Supertest smoke tests covering health/projects/scenes/chat/assets.

## Deployment notes

- Build the frontend: `npm run build`
- Run the server: `npm run start:server` — serves API and `dist/`; assets under `dist/assets/` are long‑cached (`Cache-Control: public, max-age=31536000, immutable`), `index.html` is `no-cache`, and non‑API routes fall back to `index.html` (SPA routing)
- Environment: set `PORT`, `CORS_ORIGIN`, and `GEMINI_API_KEY` (see [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md))
- CDN/reverse proxy (optional): you can host `dist/` on a CDN and proxy `/api` to the Node server; ensure SPA 404 fallback to `/index.html` and respect the cache headers above.

## Architecture

This application follows a feature-first architecture with clear module boundaries. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for detailed documentation.

### Key Directories

- `server/` — Express app, migrations, stores, and maintenance scripts.
- `src/` — React UI, hooks, providers, and Gemini integrations (client-side).
  - `src/features/` — Feature-first modules (app-shell, layout, library, scene, project, generation) with colocated components/hooks/state. See [`src/features/README.md`](src/features/README.md).
  - `src/components/` — Shared UI components used across features.
  - `src/hooks/` — Shared React hooks.
  - `src/services/` — Core services and dependency injection.
  - `src/ui/` — Reusable UI primitives and icon pack.
  - `src/utils/` — Shared utility functions.
  - `src/config/` — Application-wide configuration.
  - `src/types/` — Shared TypeScript types.
- `data/` — SQLite database (`storyboard.db`) and generated asset hierarchy.

### Module Boundaries

**Critical Rule**: Features don't import from other features. This ensures:

- Clear separation of concerns
- Independent testability
- No circular dependencies (verified with madge)

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for import rules and best practices.

See [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) for configuration details, [`plan.md`](plan.md) for the living roadmap, and [`docs/PHASE4_STATUS.md`](docs/PHASE4_STATUS.md) for Phase 4 completion details. Historical phase logs are archived in `docs/_legacy/`

**Key Principles**:

- Respect existing design system (no new colors/styles)
- Integrate within existing UI/UX (no new top-level navigation)
- Maintain module boundaries (features don't import features)
- Test for regressions (all existing features must work)

See `.kiro/steering/current-mission.md` for detailed integration roadmap and `.kiro/specs/legacy/gemini-api-enhancement/tasks.md` for complete task breakdown.

## Troubleshooting

### Common Issues

**Database not found or migration errors**

```bash
# Reset the database completely
npm run db:reset
```

**Port already in use**

- Default ports: 3000 (frontend), 4000 (backend)
- Change backend port: set `PORT` in `.env.local`
- Vite will auto-increment if 3000 is taken

**Environment validation errors**

- Check your `.env.local` against `.env.example`
- Ensure `GEMINI_API_KEY` is set correctly
- Server will show specific validation errors at startup

**TypeScript errors in IDE**

```bash
# Restart TypeScript server or run:
npm run typecheck
```

**Pre-commit hook failures**

- Fix TypeScript errors in staged files
- Run `npm run typecheck` to see all issues

**Assets not loading**

- Ensure `data/` directory exists and is writable
- Check `/api/health` endpoint for disk space status
- Run `npm run maintain prune` to clean orphaned files

### Getting Help

- Check existing [documentation](docs/)
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for development setup
- Open an issue with reproduction steps

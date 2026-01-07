# Project Structure

## Root Layout

```
├── server/              # Express backend
├── src/                 # React frontend
├── data/                # SQLite DB + generated assets (gitignored)
├── dist/                # Frontend build output (gitignored)
├── dist-server/         # Server build output (gitignored)
├── docs/                # Architecture and phase documentation
├── test/                # Test setup files
└── node_modules/        # Dependencies (gitignored)
```

## Backend Structure (`server/`)

```
server/
├── routes/              # Express route handlers + tests
│   ├── projects.ts      # Project CRUD endpoints
│   ├── assets.ts        # Asset upload/management
│   ├── ai.ts            # AI generation gateway
│   ├── export.ts        # Project export
│   ├── workflows.ts     # Workflow CRUD endpoints
│   ├── templates.ts     # Style template CRUD endpoints
│   ├── api.smoke.test.ts # API smoke tests (all endpoints)
│   └── workflows.test.ts # Workflow/template endpoint tests
├── services/            # Business logic layer
├── stores/              # Database access layer
├── migrations/          # SQL schema migrations
├── scripts/             # Maintenance and utility scripts
├── utils/               # Shared server utilities
├── app.ts               # Express app factory
├── config.ts            # Environment configuration
├── db.ts                # Database initialization
├── index.ts             # Server entry point
├── types.ts             # Server-side types
└── validation.ts        # Zod schemas
```

## Frontend Structure (`src/`)

### Feature-First Architecture

```
src/
├── features/            # Feature modules (self-contained)
│   ├── app-shell/       # Main app orchestration
│   ├── layout/          # Resizable panels, responsive layout
│   ├── library/         # Project/asset browsing
│   ├── scene/           # Scene management
│   ├── project/         # Project state
│   ├── generation/      # AI generation services
│   ├── chat/            # Chat interface
│   ├── settings/        # App settings
│   └── storyboard/      # Storyboard display
├── components/          # Shared UI components
├── hooks/               # Shared React hooks
├── services/            # Core services (registry, API clients)
├── ui/                  # Low-level UI primitives
├── utils/               # Shared utilities
├── config/              # App-wide configuration
├── types/               # Shared TypeScript types
├── styles/              # Global styles
├── App.tsx              # App entry (re-exports AppShell)
└── index.tsx            # React root
```

### Feature Module Structure

Each feature follows a consistent pattern:

```
features/<feature-name>/
├── components/          # Feature-specific UI
│   └── __tests__/       # Component tests
├── hooks/               # Feature-specific hooks
│   └── __tests__/       # Hook tests
├── state/               # Zustand stores (if needed)
│   └── __tests__/       # Store tests
├── services/            # Feature business logic
├── utils/               # Feature utilities
├── types.ts             # Feature types
├── index.ts             # Public API exports
└── README.md            # Feature documentation
```

## Module Boundary Rules

**Critical**: Features MUST NOT import from other features (except app-shell).

### Import Matrix

| From ↓ / To →      | Features | Shared | Types/Config | Other Features |
| ------------------ | -------- | ------ | ------------ | -------------- |
| **Features**       | Own only | ✅      | ✅            | ❌              |
| **App-Shell**      | ✅        | ✅      | ✅            | ✅              |
| **Shared Modules** | ❌        | ✅      | ✅            | ❌              |

### Dependency Flow

```
App Shell (orchestration)
    ↓
Feature Modules (isolated)
    ↓
Shared Modules (components, hooks, utils, services, ui)
    ↓
Types & Config
```

### When You Need Cross-Feature Logic

1. **Extract to shared module**: Move to `src/hooks/`, `src/utils/`, or `src/components/`
2. **Pass via props**: App-shell provides dependencies to features
3. **Use dependency injection**: Services registered in `src/services/registry.ts`

## File Size Guidelines

Keep files focused and maintainable:

- **Components**: < 300 lines
- **Hooks**: < 200 lines
- **Stores**: < 500 lines (use slices if larger)
- **Utils**: < 200 lines

## Data Directory (`data/`)

```
data/
├── storyboard.db        # SQLite database
├── storyboard.db-shm    # SQLite shared memory
├── storyboard.db-wal    # SQLite write-ahead log
└── assets/              # Generated media files
    └── <projectId>/
        ├── images/
        ├── videos/
        └── audio/
```

## Documentation (`docs/`)

- `ARCHITECTURE.md` - Detailed architecture guide
- `MODULE-BOUNDARIES.md` - Import rules quick reference
- `CONFIGURATION.md` - Environment and config details
- `DEPLOYMENT.md` - Deployment instructions
- `HISTORY.md` - Project evolution
- `_legacy/` - Archived phase documentation

## Verification

Check for circular dependencies:
```bash
npx madge --circular --extensions ts,tsx src/
npx madge --circular --extensions ts,tsx server/
```

Visualize dependency graph:
```bash
npx madge --image graph.png --extensions ts,tsx src/features/
```

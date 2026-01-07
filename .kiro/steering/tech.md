# Technology Stack

## Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6 with hot module replacement
- **State Management**: Zustand (modular slice pattern)
- **UI Components**: Custom component library with Lucide React icons
- **Drag & Drop**: @dnd-kit for scene reordering
- **Styling**: CSS with custom design system

## Backend

- **Runtime**: Node.js with Express 4
- **Database**: better-sqlite3 with migration-based schema
- **Validation**: Zod for request/response validation
- **File Handling**: Multer for multipart uploads
- **Logging**: Pino for structured logging
- **AI Integration**: @google/genai SDK (Gemini models)

## Development Tools

- **TypeScript**: v5.8 with strict mode enabled
- **Testing**: Vitest with jsdom, @testing-library/react, supertest for API tests
- **Dependency Analysis**: madge for circular dependency detection
- **Process Management**: tsx for TypeScript execution and watch mode

## Testing Guidelines

### Test Organization

- **Backend API tests**: Place in `server/routes/*.test.ts` alongside route files
- **Frontend component tests**: Place in `src/features/*/components/__tests__/`
- **Frontend hook tests**: Place in `src/features/*/hooks/__tests__/`
- **Frontend store tests**: Place in `src/features/*/state/__tests__/`
- **Test setup**: Global setup in `test/setup.ts` (jsdom polyfills)

### Testing Approach

- **Backend**: Use supertest with mocked Gemini client for API endpoint testing
- **Frontend**: Use @testing-library/react for component behavior testing
- **Mocking**: Mock external dependencies (Gemini API) to keep tests fast and deterministic
- **Focus**: Test core functionality only - avoid over-testing edge cases
- **Speed**: All tests should complete in <10 seconds total

### When to Write Tests

- **Required**: New API endpoints (CRUD operations, validation, error handling)
- **Required**: Complex UI interactions (drag-and-drop, multi-step flows)
- **Optional**: Simple components with minimal logic
- **Skip**: Pure presentational components, trivial utilities

### Test File Naming

- Backend: `<feature>.test.ts` (e.g., `workflows.test.ts`)
- Frontend: `<ComponentName>.test.tsx` or `<hookName>.test.tsx`

## Common Commands

### Development
```bash
npm run dev              # Start Vite dev server (port 3000)
npm run dev:server       # Start Express server with watch (port 4000)
```

### Building
```bash
npm run build            # Build frontend only
npm run build:web        # Build frontend (alias)
npm run build:all        # Build both frontend and server
```

### Type Checking
```bash
npm run typecheck        # Check frontend types
npm run typecheck:server # Check server types
```

### Testing
```bash
npm test                 # Run all tests
npm run test:api         # Run API smoke tests
npm run test:unit        # Run unit tests
```

### Database
```bash
npm run migrate          # Apply database migrations
npm run seed             # Apply migrations + load sample data
npm run check:db         # Verify database and asset integrity
```

### Maintenance
```bash
npm run maintain prune                    # Remove orphaned assets
npm run maintain export <projectId> [dir] # Export project bundle
```

### Verification
```bash
npx madge --circular --extensions ts,tsx src/     # Check frontend circular deps
npx madge --circular --extensions ts,tsx server/  # Check server circular deps
```

## Configuration

- Environment variables in `.env.local` (see `.env.example`)
- Vite config: `vite.config.ts` (dev server, proxy, path aliases)
- TypeScript configs: `tsconfig.json` (frontend), `tsconfig.server.json` (backend)
- API proxy: `/api` routes proxied from port 3000 → 4000 in development

## Key Dependencies

- **React ecosystem**: react, react-dom
- **State**: zustand
- **HTTP**: express, cors
- **Database**: better-sqlite3
- **AI**: @google/genai
- **Validation**: zod
- **File handling**: multer, archiver, jszip
- **Icons**: lucide-react
- **Testing**: vitest, @testing-library/react, supertest

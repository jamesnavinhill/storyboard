# Features Directory

This directory contains feature modules organized following a feature-first architecture. Each feature is self-contained with its own components, hooks, state management, and utilities.

## Module Boundaries

**Critical Rule**: Features MUST NOT import from other features. This ensures:
- Clear separation of concerns
- Independent testability
- Easier refactoring and maintenance
- No circular dependencies

## Feature Structure

Each feature follows this standard structure:

```
<feature-name>/
├── components/          # Feature-specific UI components
│   ├── ComponentA.tsx
│   ├── ComponentB.tsx
│   └── __tests__/      # Component tests
├── hooks/              # Feature-specific React hooks
│   ├── useFeatureHook.ts
│   └── index.ts        # Hook exports
├── state/              # Zustand stores and slices
│   ├── featureStore.ts
│   └── __tests__/      # Store tests
├── services/           # Business logic and API calls
│   └── featureService.ts
├── utils/              # Feature-specific utilities
│   └── featureUtils.ts
├── types.ts            # Feature-specific types
├── index.ts            # Public API exports
└── README.md           # Feature documentation
```

## Import Rules

### ✅ Features CAN import from:
- Their own modules (internal imports)
- `src/components/` - Shared UI components
- `src/hooks/` - Shared React hooks
- `src/services/` - Shared services
- `src/ui/` - UI primitives
- `src/utils/` - Shared utilities
- `src/types/` - Shared types
- `src/config/` - Configuration

### ❌ Features CANNOT import from:
- Other features (`src/features/other-feature/`)
- Exception: `app-shell` can import from all features (orchestration layer)

### Moving Shared Logic

If you need functionality from another feature:
1. Extract the shared logic to `src/hooks/`, `src/utils/`, or `src/components/`
2. Both features import from the shared location
3. Update the original feature to re-export for backward compatibility

Example:
```typescript
// src/hooks/useSearchState.ts (new shared hook)
export function useSearchState() { /* ... */ }

// src/features/library/hooks/useLibrarySearchState.ts (compatibility)
export { useSearchState as useLibrarySearchState } from "../../../hooks/useSearchState";
```

## Current Features

### app-shell
**Purpose**: Application orchestration and layout composition  
**Key Exports**: `AppShell`, `useAppShellState`  
**Special Role**: Only feature that can import from other features

### layout
**Purpose**: Resizable panel system, collapse/expand, persistence  
**Key Exports**: `useLayout`, `ResizablePanel`, `CollapsiblePanel`  
**Size**: Hooks < 200 lines each

### library
**Purpose**: Project and asset browsing, search, filtering  
**Key Exports**: `LibraryPanel`, `useLibraryState`  
**Components**: `ProjectsTab`, `AssetsTab`, `LibraryToolbar`

### scene
**Purpose**: Scene management, history, CRUD operations  
**Key Exports**: `useSceneActions`, `useSceneManager`, `useSceneHistory`  
**State**: Scene lifecycle and operations

### project
**Purpose**: Project state management and actions  
**Key Exports**: `useProjectState`, `useProjectActions`, `useProjectStore`  
**State**: Zustand store with domain slices

### generation
**Purpose**: AI generation services (chat, storyboard, media)  
**Key Exports**: `useChatResponse`, `useStoryboardGeneration`, `useMediaTasks`  
**Services**: Integration with Gemini APIs

### settings
**Purpose**: Application settings and preferences  
**Status**: Placeholder for future settings features

### storyboard
**Purpose**: Storyboard display and interactions  
**Status**: Placeholder for storyboard-specific features

### chat
**Purpose**: Chat interface and message handling  
**Status**: Placeholder for chat-specific features

## Adding a New Feature

1. **Create directory structure**:
   ```bash
   mkdir -p src/features/<feature-name>/{components,hooks,state,services,utils}
   ```

2. **Create index.ts** to export public API:
   ```typescript
   // src/features/<feature-name>/index.ts
   export { MyComponent } from "./components/MyComponent";
   export { useMyHook } from "./hooks/useMyHook";
   export type { MyType } from "./types";
   ```

3. **Create README.md** documenting:
   - Feature purpose
   - Key exports
   - Usage examples
   - Dependencies

4. **Follow import rules**:
   - Only import from shared modules
   - Never import from other features
   - Document any external dependencies

5. **Integrate in app-shell** (if needed):
   ```typescript
   // src/features/app-shell/hooks/useAppShellState.ts
   import { useMyFeature } from "../../my-feature/hooks";
   
   export const useAppShellState = () => {
     const myFeature = useMyFeature();
     // ...
   };
   ```

## File Size Guidelines

- **Components**: < 300 lines
- **Hooks**: < 200 lines
- **Store files**: < 500 lines
- **Utility files**: < 200 lines

When files exceed these limits:
1. Extract sub-components
2. Split into multiple hooks
3. Create store slices
4. Move shared logic to utilities

## Testing

Each feature should have:
- Unit tests for hooks (`hooks/__tests__/`)
- Unit tests for stores (`state/__tests__/`)
- Component tests (`components/__tests__/`)

Run tests:
```bash
npm test
```

## Verification

Check for circular dependencies:
```bash
npx madge --circular --extensions ts,tsx src/features/
```

Check for cross-feature imports:
```bash
# Should only find app-shell importing from features
grep -r "from.*features/" src/features/ --include="*.ts" --include="*.tsx"
```

## Best Practices

1. **Keep features focused** - Each feature should have a single, clear purpose
2. **Minimize coupling** - Features should be independently testable
3. **Document public APIs** - Export only what's needed externally
4. **Use composition** - Build complex features from simple hooks
5. **Follow conventions** - Maintain consistent structure across features
6. **Write tests** - Ensure features work in isolation

## Resources

- [Architecture Documentation](../../docs/ARCHITECTURE.md)
- [Feature-First Structure ADR](../../docs/ADR-0001-feature-first-structure.md)
- Individual feature READMEs in each feature directory

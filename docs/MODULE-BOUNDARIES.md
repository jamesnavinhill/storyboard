# Module Boundaries Quick Reference

## The Golden Rule

**Features MUST NOT import from other features.**

Exception: `app-shell` orchestrates all features and can import from them.

## Import Matrix

| From ↓ / To →      | Features              | Shared (components, hooks, utils) | Types/Config | Other Features |
| ------------------ | --------------------- | --------------------------------- | ------------ | -------------- |
| **Features**       | ✅ Own feature only    | ✅ Yes                             | ✅ Yes        | ❌ **NO**       |
| **App-Shell**      | ✅ Yes (orchestration) | ✅ Yes                             | ✅ Yes        | ✅ Yes          |
| **Shared Modules** | ❌ **NO**              | ✅ Yes                             | ✅ Yes        | ❌ **NO**       |

## Quick Checks

### ✅ Good Examples

```typescript
// Feature importing from shared hooks
import { useSearchState } from "../../../hooks/useSearchState";

// Feature importing from shared components
import { ProjectManager } from "../../../components/ProjectManager";

// Feature importing from types
import type { Scene, Settings } from "../../../types";

// App-shell importing from features
import { useLayout } from "../../layout";
import { useSceneActions } from "../../scene/hooks";
```

### ❌ Bad Examples

```typescript
// ❌ Feature importing from another feature
import { useSceneActions } from "../../scene/hooks";  // From library feature

// ❌ Shared component importing from feature
import { useLibraryState } from "../features/library/hooks";  // From components/

// ❌ Circular dependency
// fileA.ts imports fileB.ts
// fileB.ts imports fileA.ts
```

## What to Do When You Need Cross-Feature Logic

### Scenario: Feature A needs functionality from Feature B

**Wrong Approach** ❌:

```typescript
// src/features/library/components/LibraryPanel.tsx
import { useSceneActions } from "../../scene/hooks";  // ❌ Cross-feature import
```

**Right Approach** ✅:

1. **Extract to shared module**:

```typescript
// src/hooks/useSharedLogic.ts
export function useSharedLogic() {
  // Extracted logic here
}
```

2. **Both features import from shared**:

```typescript
// src/features/library/components/LibraryPanel.tsx
import { useSharedLogic } from "../../../hooks/useSharedLogic";  // ✅

// src/features/scene/hooks/useSceneActions.ts
import { useSharedLogic } from "../../../hooks/useSharedLogic";  // ✅
```

3. **Or pass via props from app-shell**:

```typescript
// src/features/app-shell/hooks/useAppShellState.ts
const sceneActions = useSceneActions();
const library = useLibraryState();

// Pass sceneActions to library as props
return {
  library: { ...library, sceneActions },
};
```

## Verification Commands

### Check for circular dependencies

```bash
npx madge --circular --extensions ts,tsx src/
```

### Find cross-feature imports (excluding app-shell)

```bash
# On Unix/Mac:
grep -r "from.*features/" src/features/ --include="*.ts" --include="*.tsx" | grep -v "app-shell"

# On Windows PowerShell:
Get-ChildItem -Path src/features -Recurse -Include *.ts,*.tsx | Select-String "from.*features/" | Where-Object { $_.Path -notmatch "app-shell" }
```

### Visualize dependency graph

```bash
npx madge --image graph.png --extensions ts,tsx src/features/
```

## Common Patterns

### Pattern 1: Shared Hook

When multiple features need the same stateful logic:

```typescript
// src/hooks/useSharedHook.ts
export function useSharedHook() {
  const [state, setState] = useState();
  // ... logic
  return { state, setState };
}

// Features import it
import { useSharedHook } from "../../../hooks/useSharedHook";
```

### Pattern 2: Dependency Injection

When a feature needs services or actions:

```typescript
// Pass dependencies via props
interface LibraryPanelProps {
  onSceneAction: (sceneId: string) => void;
  // ... other props
}

// App-shell provides the dependencies
<LibraryPanel onSceneAction={sceneActions.updateScene} />
```

### Pattern 3: Event Bus

For loosely coupled communication:

```typescript
// src/utils/eventBus.ts
export const eventBus = {
  emit: (event: string, data: any) => {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  on: (event: string, handler: (e: CustomEvent) => void) => {
    window.addEventListener(event, handler as EventListener);
  },
};

// Feature A emits
eventBus.emit("scene:updated", { sceneId });

// Feature B listens
useEffect(() => {
  const handler = (e: CustomEvent) => {
    // Handle event
  };
  eventBus.on("scene:updated", handler);
  return () => window.removeEventListener("scene:updated", handler);
}, []);
```

### Pattern 4: Shared Context

For app-wide state:

```typescript
// src/contexts/AppContext.tsx
export const AppContext = createContext<AppState>(null);

// App-shell provides
<AppContext.Provider value={appState}>
  {children}
</AppContext.Provider>

// Features consume
const appState = useContext(AppContext);
```

## File Size Limits

Keep files focused and maintainable:

| File Type  | Max Lines | Action if Exceeded        |
| ---------- | --------- | ------------------------- |
| Components | 300       | Extract sub-components    |
| Hooks      | 200       | Split into multiple hooks |
| Stores     | 500       | Create store slices       |
| Utils      | 200       | Split by responsibility   |

## Troubleshooting

### "I need to use a hook from another feature"

1. Is it truly feature-specific? If yes, pass it via props from app-shell
2. Is it reusable? Extract to `src/hooks/`
3. Can it be a utility? Extract to `src/utils/`

### "I'm getting circular dependency errors"

1. Run `npx madge --circular --extensions ts,tsx src/`
2. Identify the cycle in the output
3. Break the cycle by:
   - Extracting shared logic to a separate file
   - Using dependency injection
   - Restructuring imports

### "My file is too large"

1. Identify distinct responsibilities
2. Extract each responsibility to its own file
3. Compose them in the main file
4. Verify file sizes are under limits

## Resources

- [Full Architecture Documentation](./ARCHITECTURE.md)
- [Features Directory README](../src/features/README.md)
- [Feature-First Structure ADR](./ADR-0001-feature-first-structure.md)

## Quick Decision Tree

```
Need functionality from another feature?
│
├─ Is it in app-shell?
│  └─ ✅ Import it (app-shell can import features)
│
├─ Is it truly feature-specific?
│  └─ ✅ Pass via props from app-shell
│
├─ Is it reusable logic?
│  └─ ✅ Extract to src/hooks/ or src/utils/
│
└─ Is it UI component?
   └─ ✅ Extract to src/components/
```

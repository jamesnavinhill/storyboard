# Strict TypeScript Mode Errors

## Summary

After enabling `strict: true` and `forceConsistentCasingInFileNames: true` in `tsconfig.json`:

- **Initial errors**: 2647 errors across 86 files
- **After installing `@types/react` and `@types/react-dom`**: **36 errors across 9 files**
- **Error reduction**: 98.6% (2611 errors resolved)

## Remaining Issues (36 errors)

### 1. Type Incompatibility Issues (Most Common)

#### Function Signature Mismatches
Multiple components have function prop type mismatches where:
- Functions expect `Promise<T>` but receive `void` or vice versa
- Functions expect `string | null` but receive `string` only
- Functions expect `React.Dispatch<SetStateAction<T>>` but receive simpler setters

**Examples**:
- `onSelectProject`: expects `(projectId: string | null) => void` but receives `(projectId: string) => Promise<void>`
- `onImportProject`: expects `() => void` but receives `(file: File) => Promise<void>`
- `setAspectRatio`: expects `React.Dispatch<SetStateAction<...>>` but receives `(ratio: ...) => void`

**Files affected**:
- `src/features/app-shell/AppShell.tsx` (11 errors)
- `src/features/app-shell/components/DesktopLayout.tsx` (8 errors)
- `src/features/app-shell/components/MobileLayout.tsx` (6 errors)
- `src/features/app-shell/components/AppSidebar.tsx` (2 errors)

### 2. Data Model Mismatches

#### ProjectSummary Type Incompatibility
`ProjectSummary` type has `description: string | null | undefined` but components expect `description?: string | undefined`.

**Files affected**:
- `src/features/app-shell/AppShell.tsx`
- `src/features/app-shell/hooks/useAppShellState.ts`

#### SceneRecord Return Type
`restoreSceneFromHistory` returns `Promise<SceneRecord | null>` but expected to return `Promise<void>`.

**Files affected**:
- `src/features/app-shell/hooks/useAppShellState.ts`

### 3. Ref Type Issues

`React.RefObject<HTMLDivElement | null>` is not assignable to `React.RefObject<HTMLDivElement>`.

**Files affected**:
- `src/features/layout/hooks/useLayout.ts` (4 errors)

### 4. Store Type Issues

#### SceneSlice Store Type Mismatch
The `createSceneSlice` function has incompatible types with the parent store, particularly around the `enqueueToast` function signature.

**Files affected**:
- `src/features/project/state/projectStore.ts`

### 5. Component Prop Issues

#### Missing Component Props
`SceneCard.tsx` passes a `text` prop that doesn't exist on the component's type definition.

**Files affected**:
- `src/features/storyboard/components/SceneCard.tsx`

### 6. Action Return Type Issues

`createProject` action returns `Promise<void>` but expected to return `Promise<ProjectSummary>`.

**Files affected**:
- `src/features/project/hooks/useProjectActions.ts`

## Error Distribution by File

| File                                                  | Errors |
| ----------------------------------------------------- | ------ |
| `src/features/app-shell/AppShell.tsx`                 | 11     |
| `src/features/app-shell/components/DesktopLayout.tsx` | 8      |
| `src/features/app-shell/components/MobileLayout.tsx`  | 6      |
| `src/features/layout/hooks/useLayout.ts`              | 4      |
| `src/features/app-shell/hooks/useAppShellState.ts`    | 2      |
| `src/features/app-shell/components/AppSidebar.tsx`    | 2      |
| `src/features/project/hooks/useProjectActions.ts`     | 1      |
| `src/features/project/state/projectStore.ts`          | 1      |
| `src/features/storyboard/components/SceneCard.tsx`    | 1      |

## Recommended Fix Strategy

These errors should be addressed in **Task 3: Fix All TypeScript Errors** as they require careful refactoring of:
1. Function signatures to match expected types
2. Data models to have consistent null handling
3. Component prop interfaces
4. Store type definitions

## Status

✅ **Task 2 Complete**: Strict mode enabled and type definitions installed
⏭️ **Next**: Task 3 will address the remaining 36 type errors

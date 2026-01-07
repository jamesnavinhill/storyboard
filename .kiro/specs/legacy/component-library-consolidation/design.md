# Design Document

## Overview

This design consolidates the component library structure to eliminate redundancy between `src/ui` and `src/components/ui`, migrates components from the flat `src/components` directory to the feature-first `src/features` architecture, standardizes file naming conventions, and establishes clear organizational patterns. The consolidation will move the Select component to its proper location, migrate feature-specific components to their appropriate feature modules, update all import paths, and rename files that don't follow standard conventions.

## Architecture

### Component Organization Pattern

The component library will follow a three-tier architecture aligned with the existing feature-first structure documented in `src/features/README.md`:

1. **UI Primitives Layer** (`src/ui/`)
   - Generic, reusable UI components with no business logic
   - No dependencies on application state or feature-specific types
   - Can be used across any feature
   - Examples: Badge, Select, ToggleButton, ListCard, icons

2. **Shared Components Layer** (`src/components/`)
   - Truly shared components used across multiple features
   - May have some business logic but are feature-agnostic
   - Examples: Loader, toast system
   - This directory should be MINIMAL - most components belong in features

3. **Feature Components Layer** (`src/features/[feature-name]/components/`)
   - Feature-specific components with business logic
   - Organized by feature domain (storyboard, library, scene, chat, settings, layout)
   - May depend on feature state, hooks, and services
   - May use UI primitives from `src/ui/` and shared components from `src/components/`
   - Examples: SceneCard (storyboard), ProjectManager (library), ChatPanel (chat)

### Feature Boundaries

Following the existing architecture rules from `src/features/README.md`:

**Features CAN import from:**
- Their own modules (internal imports)
- `src/components/` - Shared UI components
- `src/hooks/` - Shared React hooks
- `src/services/` - Shared services
- `src/ui/` - UI primitives
- `src/utils/` - Shared utilities
- `src/types/` - Shared types
- `src/config/` - Configuration

**Features CANNOT import from:**
- Other features (`src/features/other-feature/`)
- Exception: `app-shell` can import from all features (orchestration layer)

### Directory Structure

```
src/
├── ui/                                    # UI Primitives
│   ├── Badge.tsx
│   ├── Select.tsx                         # MOVED from components/ui/
│   ├── ToggleButton.tsx
│   ├── ListCard.tsx
│   └── icons.tsx
│
├── components/                            # Truly Shared Components ONLY
│   ├── Loader.tsx                         # Used across all features
│   └── toast/                             # Toast notification system
│       ├── ToastProvider.tsx
│       └── useToast.ts
│
├── features/
│   ├── storyboard/
│   │   ├── components/
│   │   │   ├── SceneCard.tsx              # MOVED & RENAMED from components/DesktopSceneCard.tsx
│   │   │   ├── GhostSceneCard.tsx         # MOVED from components/
│   │   │   ├── SceneCardPreview.tsx       # MOVED from components/
│   │   │   ├── StackedGroupCard.tsx       # MOVED from components/
│   │   │   ├── StoryboardPanel.tsx        # MOVED from components/
│   │   │   ├── SceneEditPanel.tsx         # MOVED from components/
│   │   │   ├── SceneAnimatePanel.tsx      # MOVED from components/
│   │   │   ├── StylePresetPicker.tsx      # MOVED from components/
│   │   │   └── __tests__/
│   │   │       ├── SceneCard.test.tsx     # MOVED & RENAMED from components/__tests__/DesktopSceneCard.test.tsx
│   │   │       └── StoryboardPanel.drag.test.tsx  # MOVED from components/__tests__/
│   │   ├── hooks/
│   │   ├── state/
│   │   └── README.md
│   │
│   ├── scene/
│   │   ├── components/
│   │   │   ├── SceneManageDrawer.tsx      # MOVED from components/
│   │   │   ├── SceneHistoryPanel.tsx      # MOVED from components/
│   │   │   ├── SceneGroupManager.tsx      # MOVED from components/
│   │   │   ├── SceneTagManager.tsx        # MOVED from components/
│   │   │   ├── GroupBadge.tsx             # MOVED from components/
│   │   │   ├── TagBadge.tsx               # MOVED from components/
│   │   │   └── __tests__/
│   │   │       ├── SceneGroupManager.test.tsx  # MOVED from components/__tests__/
│   │   │       └── SceneManageDrawer.collapse.test.tsx  # MOVED from components/__tests__/
│   │   ├── hooks/
│   │   ├── state/
│   │   └── README.md
│   │
│   ├── library/
│   │   ├── components/
│   │   │   ├── ProjectManager.tsx         # MOVED from components/
│   │   │   ├── AssetManager.tsx           # MOVED from components/
│   │   │   ├── AssetCard.tsx              # MOVED from components/
│   │   │   ├── LibraryControls.tsx        # MOVED from components/
│   │   │   ├── LibraryPanel.tsx           # Already exists
│   │   │   ├── ProjectsTab.tsx            # Already exists
│   │   │   ├── AssetsTab.tsx              # Already exists
│   │   │   ├── LibraryToolbar.tsx         # Already exists
│   │   │   ├── ProjectDetails.tsx         # Already exists
│   │   │   ├── DetailsEditor.tsx          # Already exists
│   │   │   ├── GroupsInlineManager.tsx    # Already exists
│   │   │   ├── TagsInlineManager.tsx      # Already exists
│   │   │   └── __tests__/
│   │   │       ├── AssetManager.test.tsx  # MOVED from components/__tests__/
│   │   │       ├── ProjectManager.test.tsx  # MOVED from components/__tests__/
│   │   │       └── GroupsTagsManagers.test.tsx  # Already exists
│   │   ├── hooks/
│   │   │   ├── index.ts                   # Already exists
│   │   │   ├── useLibraryState.ts         # Already exists
│   │   │   └── useLibrarySearchState.ts   # Already exists
│   │   ├── state/
│   │   ├── index.ts                       # Already exists
│   │   └── README.md                      # Already exists
│   │
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx              # MOVED from components/
│   │   │   └── __tests__/
│   │   ├── hooks/
│   │   ├── state/
│   │   └── README.md                      # Already exists
│   │
│   ├── settings/
│   │   ├── components/
│   │   │   ├── SettingsPanel.tsx          # MOVED from components/
│   │   │   └── __tests__/
│   │   ├── hooks/
│   │   ├── state/
│   │   └── README.md                      # Already exists
│   │
│   ├── layout/
│   │   ├── components/
│   │   │   ├── LeftManagerDrawer/         # MOVED from components/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── LeftManagerDrawer.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useDrawerTabs.ts
│   │   │   │   └── tabs/
│   │   │   │       ├── DetailsTab.tsx
│   │   │   │       ├── GroupsTagsTab.tsx
│   │   │   │       ├── HistoryTab.tsx
│   │   │   │       └── LibraryTab.tsx
│   │   │   └── __tests__/
│   │   ├── hooks/                         # Already has content
│   │   ├── utils/                         # Already has content
│   │   ├── types.ts                       # Already exists
│   │   └── index.ts                       # Already exists
│   │
│   └── app-shell/                         # Already has content
│       ├── components/
│       ├── hooks/
│       └── AppShell.tsx
```

## Components and Interfaces

### Component Migration Map

Components will be migrated from `src/components` to their appropriate feature modules:

| Current Location                   | New Location                                           | Feature Domain | Notes                         |
| ---------------------------------- | ------------------------------------------------------ | -------------- | ----------------------------- |
| `components/ui/Select.tsx`         | `ui/Select.tsx`                                        | UI Primitive   | Move to primitives            |
| `components/DesktopSceneCard.tsx`  | `features/storyboard/components/SceneCard.tsx`         | Storyboard     | Rename                        |
| `components/GhostSceneCard.tsx`    | `features/storyboard/components/GhostSceneCard.tsx`    | Storyboard     |                               |
| `components/SceneCardPreview.tsx`  | `features/storyboard/components/SceneCardPreview.tsx`  | Storyboard     |                               |
| `components/StackedGroupCard.tsx`  | `features/storyboard/components/StackedGroupCard.tsx`  | Storyboard     |                               |
| `components/StoryboardPanel.tsx`   | `features/storyboard/components/StoryboardPanel.tsx`   | Storyboard     |                               |
| `components/SceneEditPanel.tsx`    | `features/storyboard/components/SceneEditPanel.tsx`    | Storyboard     |                               |
| `components/SceneAnimatePanel.tsx` | `features/storyboard/components/SceneAnimatePanel.tsx` | Storyboard     |                               |
| `components/StylePresetPicker.tsx` | `features/storyboard/components/StylePresetPicker.tsx` | Storyboard     |                               |
| `components/SceneManageDrawer.tsx` | `features/scene/components/SceneManageDrawer.tsx`      | Scene          |                               |
| `components/SceneHistoryPanel.tsx` | `features/scene/components/SceneHistoryPanel.tsx`      | Scene          |                               |
| `components/SceneGroupManager.tsx` | `features/scene/components/SceneGroupManager.tsx`      | Scene          |                               |
| `components/SceneTagManager.tsx`   | `features/scene/components/SceneTagManager.tsx`        | Scene          |                               |
| `components/GroupBadge.tsx`        | `features/scene/components/GroupBadge.tsx`             | Scene          |                               |
| `components/TagBadge.tsx`          | `features/scene/components/TagBadge.tsx`               | Scene          |                               |
| `components/ProjectManager.tsx`    | `features/library/components/ProjectManager.tsx`       | Library        |                               |
| `components/AssetManager.tsx`      | `features/library/components/AssetManager.tsx`         | Library        |                               |
| `components/AssetCard.tsx`         | `features/library/components/AssetCard.tsx`            | Library        |                               |
| `components/LibraryControls.tsx`   | `features/library/components/LibraryControls.tsx`      | Library        |                               |
| `components/ChatPanel.tsx`         | `features/chat/components/ChatPanel.tsx`               | Chat           |                               |
| `components/SettingsPanel.tsx`     | `features/settings/components/SettingsPanel.tsx`       | Settings       |                               |
| `components/LeftManagerDrawer/`    | `features/layout/components/LeftManagerDrawer/`        | Layout         |                               |
| `components/Loader.tsx`            | `components/Loader.tsx`                                | Shared         | STAYS                         |
| `components/toast/`                | `components/toast/`                                    | Shared         | STAYS                         |
| `components/SceneCard.tsx`         | DELETE                                                 | Duplicate      | Duplicate of DesktopSceneCard |

### File Renaming Strategy

| Current Name                          | New Name                       | Reason                              |
| ------------------------------------- | ------------------------------ | ----------------------------------- |
| `DesktopSceneCard.tsx`                | `SceneCard.tsx`                | Remove unnecessary "Desktop" prefix |
| `__tests__/DesktopSceneCard.test.tsx` | `__tests__/SceneCard.test.tsx` | Match renamed component             |

**Files to Keep As-Is:**
- `GhostSceneCard.tsx` - Distinguishes from SceneCard (placeholder variant)
- `StackedGroupCard.tsx` - Distinguishes from SceneCard (grouped variant)
- `SceneCardPreview.tsx` - Distinguishes from SceneCard (preview-only variant)
- `LeftManagerDrawer/` - "Left" indicates position

### Component Migration Phases

#### Phase 1: Move Select to UI Primitives

**Actions:**
1. Move `src/components/ui/Select.tsx` → `src/ui/Select.tsx`
2. Update import in `SceneManageDrawer.tsx`: `./ui/Select` → `@/ui/Select`
3. Delete empty `src/components/ui/` directory

**Verification:**
- TypeScript compilation succeeds
- SceneManageDrawer renders correctly
- Select dropdowns work (aspect ratio, group, tag selects)

#### Phase 2: Migrate Storyboard Components

**Actions:**
1. Move and rename `DesktopSceneCard.tsx` → `features/storyboard/components/SceneCard.tsx`
2. Update component export name and displayName
3. Move `GhostSceneCard.tsx`, `SceneCardPreview.tsx`, `StackedGroupCard.tsx`
4. Move `StoryboardPanel.tsx`, `SceneEditPanel.tsx`, `SceneAnimatePanel.tsx`, `StylePresetPicker.tsx`
5. Move test files to `features/storyboard/components/__tests__/`
6. Update all imports in moved files
7. Update imports in files that use these components
8. Delete duplicate `components/SceneCard.tsx` if it exists

**Affected Imports:**
- `StoryboardPanel.tsx` imports SceneCard, GhostSceneCard, StackedGroupCard, SceneCardPreview
- `SceneCard.tsx` imports SceneEditPanel, SceneAnimatePanel
- Various files import from `@/components/...` → `@/features/storyboard/components/...`

#### Phase 3: Migrate Scene Management Components

**Actions:**
1. Move `SceneManageDrawer.tsx`, `SceneHistoryPanel.tsx`
2. Move `SceneGroupManager.tsx`, `SceneTagManager.tsx`
3. Move `GroupBadge.tsx`, `TagBadge.tsx`
4. Move test files to `features/scene/components/__tests__/`
5. Update all imports

**Affected Imports:**
- `SceneManageDrawer.tsx` imports GroupBadge, TagBadge, Select (from @/ui)
- `SceneCard.tsx` imports GroupBadge, TagBadge
- Various files import scene management components

#### Phase 4: Migrate Library Components

**Actions:**
1. Move `ProjectManager.tsx`, `AssetManager.tsx`, `AssetCard.tsx`, `LibraryControls.tsx`
2. Move test files to `features/library/components/__tests__/`
3. Update all imports
4. Verify no conflicts with existing library components

**Note:** Library feature already has components. Ensure no naming conflicts.

#### Phase 5: Migrate Chat, Settings, Layout Components

**Actions:**
1. Move `ChatPanel.tsx` → `features/chat/components/`
2. Move `SettingsPanel.tsx` → `features/settings/components/`
3. Move `LeftManagerDrawer/` → `features/layout/components/`
4. Update all imports

#### Phase 6: Clean Up

**Actions:**
1. Verify `src/components/` only contains Loader.tsx and toast/
2. Delete empty `src/components/__tests__/` directory
3. Run full TypeScript compilation
4. Run all tests
5. Manual verification of key features

### Import Pattern Standardization

#### UI Primitives

```typescript
// Correct pattern
import { Badge } from "@/ui/Badge";
import { Select } from "@/ui/Select";
import { ToggleButtonGroup } from "@/ui/ToggleButton";
import { ListCard } from "@/ui/ListCard";
import { SunIcon, MoonIcon } from "@/ui/icons";
```

#### Shared Components

```typescript
// Correct pattern
import { Loader } from "@/components/Loader";
import { useToast } from "@/components/toast/useToast";
```

#### Feature Components

```typescript
// Correct pattern - importing from same feature
import { SceneCard } from "./SceneCard";
import { GhostSceneCard } from "./GhostSceneCard";

// Correct pattern - importing from another file in same feature
import { SceneCard } from "@/features/storyboard/components/SceneCard";

// WRONG - features cannot import from other features
// import { ChatPanel } from "@/features/chat/components/ChatPanel";
```

#### Icons

```typescript
// Lucide icons (external library)
import { Search, Grid3x3, List, X, Image } from "lucide-react";

// Custom icons (application-specific)
import { SunIcon, MoonIcon, ChevronDoubleLeftIcon } from "@/ui/icons";
```

## Data Models

No data model changes are required. All component props, interfaces, and types remain unchanged.

## Error Handling

### Migration Safety

1. **Import Resolution Errors**
   - TypeScript will catch import errors at compile time
   - Use `getDiagnostics` tool after each phase
   - Fix all errors before proceeding to next phase

2. **Runtime Errors**
   - Component functionality must remain identical
   - Test key user flows after each phase
   - Verify no console errors in browser

3. **Test Failures**
   - Run tests after each phase
   - Update test imports to match new locations
   - All tests must pass before proceeding

### Rollback Strategy

If a phase fails:
1. Revert file moves for that phase
2. Restore original imports
3. Verify application works
4. Investigate and fix issues
5. Retry the phase

## Testing Strategy

### Verification After Each Phase

```bash
# TypeScript compilation
npm run typecheck

# Run all tests
npm run test

# Manual testing checklist per phase
```

### Phase-Specific Manual Tests

**Phase 1 (Select):**
- Open scene manager drawer
- Test aspect ratio select
- Test group select
- Test tag select

**Phase 2 (Storyboard):**
- View storyboard panel
- Drag and drop scenes
- Edit scene description
- Generate/regenerate images
- Animate scenes
- Export images

**Phase 3 (Scene Management):**
- Open scene manager drawer
- View scene history
- Assign groups and tags
- Manage groups and tags

**Phase 4 (Library):**
- View projects tab
- View assets tab
- Search and filter
- Import project
- Rename/delete projects

**Phase 5 (Chat, Settings, Layout):**
- Open/close chat panel
- Open settings panel
- Open/close left manager drawer
- Test drawer tabs

### Final Verification

```bash
npm run typecheck
npm run test
```

**Manual End-to-End Test:**
1. Create new project
2. Generate storyboard from chat
3. Edit scenes
4. Assign groups and tags
5. View scene history
6. Export images
7. Switch between projects
8. Test all panels and drawers

## Implementation Notes

### Preserving Functionality

- All component exports must remain unchanged (except renamed components)
- All component props and interfaces must remain unchanged
- All styling and behavior must remain identical
- No business logic changes

### Import Path Aliases

The project uses `@/*` as an alias for `src/*` (configured in `tsconfig.json`):

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This allows clean imports:
- `@/ui/Badge` → `src/ui/Badge.tsx`
- `@/features/storyboard/components/SceneCard` → `src/features/storyboard/components/SceneCard.tsx`
- `@/components/Loader` → `src/components/Loader.tsx`

### Complex Component Structures

Components with subdirectories (like `LeftManagerDrawer/`) maintain their structure when moved. The entire directory moves as a unit.

### Duplicate SceneCard

There appears to be both `DesktopSceneCard.tsx` and `SceneCard.tsx` in `src/components`. Investigation needed to determine if one is a duplicate or if they serve different purposes. If duplicate, delete the older/unused one.

## Migration Checklist

### Phase 1: Select Component
- [ ] Move `components/ui/Select.tsx` to `ui/Select.tsx`
- [ ] Update import in `SceneManageDrawer.tsx`
- [ ] Delete empty `components/ui/` directory
- [ ] Run TypeScript check
- [ ] Test scene manager drawer selects

### Phase 2: Storyboard Components
- [ ] Move and rename `DesktopSceneCard.tsx` to `features/storyboard/components/SceneCard.tsx`
- [ ] Update component export name and displayName
- [ ] Move `GhostSceneCard.tsx`, `SceneCardPreview.tsx`, `StackedGroupCard.tsx`
- [ ] Move `StoryboardPanel.tsx`, `SceneEditPanel.tsx`, `SceneAnimatePanel.tsx`, `StylePresetPicker.tsx`
- [ ] Move test files
- [ ] Update all imports
- [ ] Delete duplicate `SceneCard.tsx` if exists
- [ ] Run TypeScript check
- [ ] Run tests
- [ ] Manual storyboard testing

### Phase 3: Scene Management Components
- [ ] Move `SceneManageDrawer.tsx`, `SceneHistoryPanel.tsx`
- [ ] Move `SceneGroupManager.tsx`, `SceneTagManager.tsx`
- [ ] Move `GroupBadge.tsx`, `TagBadge.tsx`
- [ ] Move test files
- [ ] Update all imports
- [ ] Run TypeScript check
- [ ] Run tests
- [ ] Manual scene management testing

### Phase 4: Library Components
- [ ] Move `ProjectManager.tsx`, `AssetManager.tsx`, `AssetCard.tsx`, `LibraryControls.tsx`
- [ ] Move test files
- [ ] Update all imports
- [ ] Run TypeScript check
- [ ] Run tests
- [ ] Manual library testing

### Phase 5: Chat, Settings, Layout Components
- [ ] Move `ChatPanel.tsx` to `features/chat/components/`
- [ ] Move `SettingsPanel.tsx` to `features/settings/components/`
- [ ] Move `LeftManagerDrawer/` to `features/layout/components/`
- [ ] Update all imports
- [ ] Run TypeScript check
- [ ] Run tests
- [ ] Manual testing

### Phase 6: Final Cleanup
- [ ] Verify `components/` only has Loader and toast
- [ ] Delete empty `components/__tests__/`
- [ ] Run full TypeScript compilation
- [ ] Run all tests
- [ ] Manual end-to-end verification
- [ ] Check for any remaining import issues

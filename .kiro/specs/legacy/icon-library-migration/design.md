# Design Document

## Overview

This design outlines the migration from 25 custom SVG icon components to the lucide-react icon library. The migration will be executed through automated find-and-replace operations across the codebase, followed by cleanup of obsolete icon files. The design ensures zero visual changes to the user interface while significantly reducing maintenance overhead.

## Architecture

### Current Architecture
```
src/components/icons/
├── PhotoIcon.tsx (custom SVG wrapper)
├── GridIcon.tsx (custom SVG wrapper)
├── ... (23 more icon files)

Component Files:
import { PhotoIcon } from "./icons/PhotoIcon"
<PhotoIcon className="w-6 h-6" />
```

### Target Architecture
```
package.json:
  "lucide-react": "^0.index"

Component Files:
import { Image } from "lucide-react"
<Image className="w-6 h-6" />
```

### Migration Strategy

The migration follows a three-phase approach:
1. **Dependency Installation**: Add lucide-react to package.json
2. **Import Replacement**: Update all icon imports and usages across the codebase
3. **Cleanup**: Remove obsolete custom icon component files

## Components and Interfaces

### Icon Mapping Table

The following table maps custom icons to their lucide-react equivalents:

| Custom Icon             | lucide-react Icon | Notes                                |
| ----------------------- | ----------------- | ------------------------------------ |
| ArchiveBoxArrowDownIcon | ArchiveRestore    | Closest match for archive with arrow |
| BookOpenIcon            | BookOpen          | Direct match                         |
| ChatBubbleIcon          | MessageCircle     | Standard chat bubble representation  |
| CogIcon                 | Settings          | Direct match for settings/cog        |
| DocumentIcon            | File              | Direct match                         |
| DocumentPlusIcon        | FilePlus          | Direct match                         |
| DownloadIcon            | Download          | Direct match                         |
| DragHandleIcon          | GripVertical      | Standard drag handle                 |
| FilmIcon                | Film              | Direct match                         |
| FolderIcon              | Folder            | Direct match                         |
| GridIcon                | Grid3x3           | Direct match for grid layout         |
| HourglassIcon           | Hourglass         | Direct match                         |
| ListIcon                | List              | Direct match                         |
| MagnifyingGlassIcon     | Search            | Direct match                         |
| MicrophoneIcon          | Mic               | Direct match                         |
| PaperclipIcon           | Paperclip         | Direct match                         |
| PencilIcon              | Pencil            | Direct match                         |
| PhotoIcon               | Image             | Direct match for photo/image         |
| PlusIcon                | Plus              | Direct match                         |
| RefreshIcon             | RefreshCw         | Direct match for refresh/reload      |
| SendIcon                | Send              | Direct match                         |
| SparklesIcon            | Sparkles          | Direct match                         |
| TrashIcon               | Trash2            | Modern trash icon variant            |
| UploadIcon              | Upload            | Direct match                         |
| XIcon                   | X                 | Direct match for close/dismiss       |

### Icon Variant Handling

Current custom icons use two variants:
- **Outline icons**: `fill="none"` with `stroke="currentColor"` (majority)
- **Solid icons**: `fill="currentColor"` with `stroke="none"` (SparklesIcon, SendIcon)

lucide-react provides only outline-style icons by default. For solid variants:
- Use lucide-react icons with `fill="currentColor"` className override
- Visual consistency maintained through CSS styling

### Props Compatibility

Both implementations support the same props interface:
```typescript
React.SVGProps<SVGSVGElement>
```

This includes:
- `className` for Tailwind/CSS classes
- `style` for inline styles
- `onClick`, `onMouseEnter`, etc. for event handlers
- All standard SVG attributes

No code changes required for prop usage.

## Data Models

### Package Dependency

```json
{
  "dependencies": {
    "lucide-react": "^0.index"
  }
}
```

Version will use latest stable release at time of implementation.

### Import Pattern Transformation

**Before:**
```typescript
import { PhotoIcon } from "../../components/icons/PhotoIcon";
import { GridIcon } from "./icons/GridIcon";
```

**After:**
```typescript
import { Image, Grid3x3 } from "lucide-react";
```

### Usage Pattern Transformation

**Before:**
```typescript
<PhotoIcon className="w-6 h-6 text-gray-500" />
<GridIcon className="h-5 w-5" />
```

**After:**
```typescript
<Image className="w-6 h-6 text-gray-500" />
<Grid3x3 className="h-5 w-5" />
```

No changes to className or other props required.

## Error Handling

### Build-Time Validation

After migration, TypeScript compilation will catch:
- Missing icon imports
- Incorrect icon names
- Type mismatches

### Runtime Validation

lucide-react icons are tree-shakeable and will fail at build time if:
- Icon name is misspelled
- Icon doesn't exist in library

No runtime errors expected as all icons are validated at compile time.

### Rollback Strategy

If issues arise:
1. Git revert the migration commit
2. Custom icon files remain in git history
3. No data loss or permanent changes

## Testing Strategy

### Visual Regression Testing

**Manual verification checklist:**
1. Open application in browser
2. Navigate through all major UI sections:
   - App shell toolbar
   - Scene management drawer
   - Project manager
   - Chat panel
   - Settings panel
   - Library controls
3. Verify all icons render correctly
4. Verify icon sizing matches previous implementation
5. Verify icon colors match previous implementation

### Build Verification

```bash
npm run build
```

Must complete without errors or warnings.

### Type Checking

```bash
npm run type-check
# or
tsc --noEmit
```

Must complete without TypeScript errors.

### Component-Level Testing

Focus on components with heavy icon usage:
- `AppShell.tsx` (10+ icons)
- `SceneManageDrawer.tsx` (5+ icons)
- `ProjectManager.tsx` (6+ icons)

Verify each component:
1. Imports resolve correctly
2. Icons render in UI
3. No console errors

### Edge Cases

Test scenarios:
1. **Conditional icon rendering**: Icons that appear based on state
2. **Dynamic icon props**: Icons with computed className or style
3. **Icon event handlers**: Icons with onClick, onMouseEnter, etc.
4. **Icon in different contexts**: Buttons, links, standalone elements

## Implementation Notes

### File Deletion Safety

Before deleting custom icon files:
1. Verify no remaining imports via grep search
2. Check for any dynamic imports or string-based references
3. Confirm all TypeScript errors resolved

### Import Path Variations

The codebase uses multiple import path styles:
- Relative: `"./icons/PhotoIcon"`
- Parent relative: `"../icons/PhotoIcon"`
- Deep relative: `"../../components/icons/PhotoIcon"`

All variations must be handled in find-and-replace operations.

### Solid Icon Handling

For SparklesIcon and SendIcon (currently solid):
- lucide-react Sparkles and Send are outline by default
- Add `fill="currentColor" strokeWidth={0}` to achieve solid appearance
- Alternative: Keep as outline for consistency with lucide-react design system

Recommendation: Use outline variants for consistency unless solid is critical to UX.

## Migration Checklist

- [ ] Install lucide-react dependency
- [ ] Update all icon imports across codebase
- [ ] Update all icon component usages
- [ ] Remove custom icon component files
- [ ] Run TypeScript type checking
- [ ] Run build process
- [ ] Perform visual regression testing
- [ ] Verify no console errors in browser
- [ ] Commit changes with descriptive message

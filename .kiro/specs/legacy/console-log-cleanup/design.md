# Design Document

## Overview

This design outlines a systematic approach to cleaning up console logging throughout the StoryBoard application. The solution involves removing temporary debug logs, fixing React warnings, implementing a conditional logging utility, and establishing logging standards for future development.

## Architecture

### Logging Utility

We'll create a centralized logging utility that provides environment-aware logging:

```typescript
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}
```

The logger will:
- Check `import.meta.env.DEV` to determine if running in development mode
- Suppress debug/info logs in production
- Always allow warn/error logs
- Provide consistent formatting for log messages

### Component Refactoring Strategy

For components with console.log statements:
1. **SceneManageDrawer.tsx**: Remove debug logs for scene/asset/model data (lines 475-479)
2. **GroupsTagsInlineManagers.tsx**: Remove "Computing visible" logs (lines 48-51, 373-376)
3. **EnhancedSettingsSheet.tsx**: Already clean, no console logs found

For React warnings:
1. **ProjectCollapsible**: Refactor nested button structure to use div with onClick for outer container

## Components and Interfaces

### Logger Utility

**Location**: `src/utils/logger.ts`

**Interface**:
```typescript
export const logger: Logger = {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}
```

**Implementation Details**:
- Use `import.meta.env.DEV` for environment detection (Vite standard)
- Prefix messages with log level and timestamp in development
- No-op for debug/info in production
- Always pass through warn/error

### Component Changes

#### SceneManageDrawer.tsx

**Current Issue**: Lines 475-479 contain debug console.log statements:
```typescript
console.log("Scene:", scene);
console.log("Image Asset:", imageAsset);
console.log("Video Asset:", videoAsset);
console.log("Image Model:", imageModel);
console.log("Video Model:", videoModel);
```

**Solution**: Remove these lines entirely. The information is already visible in the UI and React DevTools.

#### GroupsTagsInlineManagers.tsx

**Current Issue**: Lines 48-51 and 373-376 contain debug console.log statements:
```typescript
console.log("[GroupsInlineManager] Computing visibleGroups. Total groups:", groups.length);
console.log("[TagsInlineManager] Computing visibleTags. Total tags:", tags.length);
```

**Solution**: Remove these lines. The useMemo hooks are working correctly and don't need logging.

#### ProjectCollapsible (to be located)

**Current Issue**: React warning about nested buttons:
```
In HTML, <button> cannot be a descendant of <button>.
```

**Solution**: 
1. Locate the ProjectCollapsible component
2. Change outer button to a div with appropriate ARIA attributes
3. Keep inner button for specific actions
4. Ensure keyboard accessibility is maintained

## Data Models

No new data models required. The logger utility uses standard JavaScript types.

## Error Handling

### Logger Error Handling

The logger utility should:
- Catch and suppress errors in the logging itself (don't let logging break the app)
- Use try-catch around console calls
- Provide fallback to console.error if logger fails

### Component Error Handling

Existing error handling should be preserved:
- Keep all console.error statements
- Keep all console.warn statements for critical warnings
- Maintain error boundaries and error states

## Testing Strategy

### Manual Testing

1. **Development Mode**:
   - Verify console is clean (no debug logs)
   - Verify errors still appear when they occur
   - Check React DevTools for warnings

2. **Production Build**:
   - Run `npm run build`
   - Serve production build
   - Verify no console logs appear
   - Verify errors still appear when they occur

3. **Component Testing**:
   - Test SceneManageDrawer with various scenes
   - Test GroupsTagsInlineManagers with groups/tags
   - Test ProjectCollapsible interactions
   - Verify no nested button warnings

### Automated Testing

1. **Logger Unit Tests**:
   - Test debug/info suppression in production
   - Test warn/error always work
   - Test message formatting

2. **Component Tests**:
   - Existing component tests should continue to pass
   - No new tests required for log removal
   - Update tests if component structure changes (ProjectCollapsible)

## Implementation Notes

### Priority Order

1. **High Priority** (immediate cleanup):
   - Remove debug console.log statements
   - Fix nested button warning

2. **Medium Priority** (nice to have):
   - Implement logger utility
   - Document logging standards

3. **Low Priority** (future improvement):
   - Configure Tailwind as PostCSS plugin
   - Reduce third-party library verbosity

### Backward Compatibility

- No breaking changes to component APIs
- No changes to data flow or state management
- Only internal implementation changes

### Performance Considerations

- Removing console.log statements improves performance (especially in loops)
- Logger utility adds minimal overhead (simple environment check)
- Production builds will have no logging overhead for debug/info

## Documentation

### Logging Standards

Create a brief guide in the codebase:

**When to use each log level**:
- `logger.debug()`: Detailed debugging information (development only)
- `logger.info()`: General informational messages (development only)
- `logger.warn()`: Warning messages that don't prevent functionality
- `logger.error()`: Error messages that indicate problems

**Examples**:
```typescript
// Good: Error logging
logger.error('Failed to load project:', error);

// Good: Development debugging
logger.debug('Scene data:', scene);

// Bad: Logging in render loops
scenes.forEach(scene => logger.debug(scene)); // Too verbose

// Bad: Logging expected behavior
logger.info('Button clicked'); // Not useful
```

### Migration Guide

For developers:
1. Replace `console.log()` with `logger.debug()`
2. Replace `console.info()` with `logger.info()`
3. Keep `console.warn()` and `console.error()` or use logger equivalents
4. Remove temporary debug logs entirely

## Third-Party Configuration

### Tailwind CSS

**Current Issue**: Using CDN in development
```
cdn.tailwindcss.com should not be used in production
```

**Solution** (documentation only, not implemented in this spec):
1. Install Tailwind as PostCSS plugin: `npm install -D tailwindcss postcss autoprefixer`
2. Create `tailwind.config.js`
3. Add to `postcss.config.js`
4. Import in main CSS file

This is noted for future improvement but not part of this cleanup spec.

## Rollback Plan

If issues arise:
1. Git revert the changes
2. All changes are isolated to specific files
3. No database or API changes
4. No configuration changes required

## Success Criteria

1. Console is clean in development (no debug logs)
2. Console is clean in production (no logs except errors)
3. No React warnings about nested buttons
4. All existing functionality works unchanged
5. Error logging still works for debugging

# Logging Standards

## Overview

StoryBoard uses a centralized logging utility (`src/utils/logger.ts`) that provides environment-aware logging. This ensures clean production builds while maintaining useful debugging capabilities during development.

## Logger API

Import the logger utility:

```typescript
import { logger } from '@/utils/logger';
```

### Available Methods

- **`logger.debug(...args)`** - Detailed debugging information (development only)
- **`logger.info(...args)`** - General informational messages (development only)
- **`logger.warn(...args)`** - Warning messages (always logged)
- **`logger.error(...args)`** - Error messages (always logged)

### Environment Behavior

| Log Level | Development | Production   |
| --------- | ----------- | ------------ |
| `debug`   | ✅ Logged    | ❌ Suppressed |
| `info`    | ✅ Logged    | ❌ Suppressed |
| `warn`    | ✅ Logged    | ✅ Logged     |
| `error`   | ✅ Logged    | ✅ Logged     |

## When to Use Each Log Level

### `logger.debug()` - Development Debugging

Use for detailed debugging information that helps during development but would be noise in production.

**Good examples:**
```typescript
// Component state changes
logger.debug('Scene state updated:', { sceneId, changes });

// Data transformations
logger.debug('Computing visible groups:', { totalGroups: groups.length, filters });

// API request/response details
logger.debug('API response:', response.data);

// Hook lifecycle events
logger.debug('[useSceneManager] Initializing with project:', projectId);
```

**Bad examples:**
```typescript
// Don't log in tight loops or render cycles
scenes.forEach(scene => logger.debug(scene)); // Too verbose

// Don't log obvious behavior
logger.debug('Button clicked'); // Not useful

// Don't log sensitive data
logger.debug('User credentials:', { password }); // Security risk
```

### `logger.info()` - General Information

Use for general informational messages about application flow.

**Good examples:**
```typescript
// Feature initialization
logger.info('Project loaded successfully:', projectId);

// Important state transitions
logger.info('Switching to edit mode');

// Configuration changes
logger.info('Settings updated:', { theme: 'dark' });
```

**Bad examples:**
```typescript
// Don't log every user interaction
logger.info('Mouse moved'); // Too noisy

// Don't duplicate what's visible in the UI
logger.info('Scene title changed to:', title); // User can see this
```

### `logger.warn()` - Warnings

Use for unexpected situations that don't prevent functionality but should be investigated.

**Good examples:**
```typescript
// Deprecated API usage
logger.warn('Using deprecated API endpoint, please migrate to /v2/projects');

// Missing optional data
logger.warn('Scene missing thumbnail, using placeholder');

// Performance concerns
logger.warn('Large dataset detected, consider pagination:', { count: items.length });

// Recoverable errors
logger.warn('Failed to load cached data, fetching fresh:', error);
```

**Bad examples:**
```typescript
// Don't warn about expected behavior
logger.warn('User cancelled operation'); // This is normal

// Don't use for critical errors
logger.warn('Database connection failed'); // Use error instead
```

### `logger.error()` - Errors

Use for errors that indicate problems requiring attention.

**Good examples:**
```typescript
// API failures
logger.error('Failed to load project:', error);

// Data validation errors
logger.error('Invalid scene data:', { sceneId, validationErrors });

// Unexpected exceptions
logger.error('Unhandled error in scene manager:', error);

// Critical failures
logger.error('Database connection lost:', error);
```

**Bad examples:**
```typescript
// Don't log expected validation failures
logger.error('Form validation failed'); // Use warn or don't log

// Don't log user errors
logger.error('User entered invalid email'); // This is expected
```

## Migration Guide

### Replacing `console.log`

Replace direct console calls with the appropriate logger method:

```typescript
// Before
console.log('Scene data:', scene);
console.log('Computing visible groups');

// After
logger.debug('Scene data:', scene);
logger.debug('Computing visible groups');
```

### Replacing `console.info`

```typescript
// Before
console.info('Project loaded');

// After
logger.info('Project loaded');
```

### Replacing `console.warn`

```typescript
// Before
console.warn('Missing thumbnail');

// After
logger.warn('Missing thumbnail');
```

### Replacing `console.error`

```typescript
// Before
console.error('Failed to load:', error);

// After
logger.error('Failed to load:', error);
```

### Removing Temporary Debug Logs

If the log was only for temporary debugging, remove it entirely:

```typescript
// Before
console.log('TODO: check this value', someValue);

// After
// (removed entirely)
```

## Best Practices

### 1. Use Descriptive Messages

```typescript
// Bad
logger.debug(scene);

// Good
logger.debug('Scene loaded:', { id: scene.id, title: scene.title });
```

### 2. Include Context

```typescript
// Bad
logger.error('Failed');

// Good
logger.error('Failed to save scene:', { sceneId, error });
```

### 3. Avoid Logging in Loops

```typescript
// Bad
scenes.forEach(scene => {
  logger.debug('Processing scene:', scene);
});

// Good
logger.debug('Processing scenes:', { count: scenes.length });
```

### 4. Don't Log Sensitive Data

```typescript
// Bad
logger.debug('User data:', { email, password, apiKey });

// Good
logger.debug('User data:', { email, hasPassword: !!password });
```

### 5. Use Structured Data

```typescript
// Bad
logger.debug('Scene ' + sceneId + ' updated with ' + changes.length + ' changes');

// Good
logger.debug('Scene updated:', { sceneId, changeCount: changes.length });
```

### 6. Prefix Feature Logs

For feature-specific logging, use a consistent prefix:

```typescript
logger.debug('[SceneManager] Initializing');
logger.debug('[AssetUpload] Processing file:', filename);
logger.debug('[AIGeneration] Request sent:', { prompt });
```

## Common Patterns

### Component Lifecycle

```typescript
useEffect(() => {
  logger.debug('[MyComponent] Mounted with props:', { projectId });
  
  return () => {
    logger.debug('[MyComponent] Unmounting');
  };
}, []);
```

### API Calls

```typescript
try {
  logger.debug('Fetching project:', projectId);
  const project = await api.getProject(projectId);
  logger.debug('Project loaded:', { id: project.id, sceneCount: project.scenes.length });
  return project;
} catch (error) {
  logger.error('Failed to fetch project:', { projectId, error });
  throw error;
}
```

### State Updates

```typescript
const updateScene = (sceneId: string, updates: Partial<Scene>) => {
  logger.debug('Updating scene:', { sceneId, updates });
  
  try {
    const updatedScene = { ...scenes[sceneId], ...updates };
    setScenes(prev => ({ ...prev, [sceneId]: updatedScene }));
    logger.debug('Scene updated successfully:', { sceneId });
  } catch (error) {
    logger.error('Failed to update scene:', { sceneId, error });
  }
};
```

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React error boundary caught error:', {
      error,
      componentStack: errorInfo.componentStack
    });
  }
}
```

## Testing Considerations

The logger utility is designed to be safe and non-intrusive:

- Logging failures won't break your application
- All console calls are wrapped in try-catch
- Production builds automatically suppress debug/info logs
- No configuration required

## FAQ

### Should I remove all console.log statements?

Yes, replace them with `logger.debug()` or remove them if they were temporary debugging statements.

### Can I still use console.log for quick debugging?

During active development, yes. But remove them before committing code. Use `logger.debug()` for logs you want to keep.

### What about third-party library logs?

You can't control third-party logging. Document known noisy libraries and their configuration options if available.

### Does logging impact performance?

Minimal impact. Debug/info logs are completely suppressed in production. The logger adds a simple environment check overhead.

### How do I see debug logs in production?

You don't. Debug logs are intentionally suppressed in production. Use error tracking services for production monitoring.

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - Overall application architecture
- [Configuration](./CONFIGURATION.md) - Environment configuration
- Logger implementation: `src/utils/logger.ts`
- Logger tests: `src/utils/__tests__/logger.test.ts`

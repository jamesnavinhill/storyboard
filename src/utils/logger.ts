/**
 * Logger Utility
 *
 * Provides environment-aware logging that suppresses debug/info logs in production
 * while always allowing warn/error logs. Includes error handling to prevent logging
 * failures from breaking the application.
 *
 * @example
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * // Development only - detailed debugging
 * logger.debug('Scene data:', scene);
 *
 * // Development only - general information
 * logger.info('Project loaded successfully');
 *
 * // Always logged - warnings
 * logger.warn('Missing thumbnail, using placeholder');
 *
 * // Always logged - errors
 * logger.error('Failed to load project:', error);
 * ```
 *
 * @see docs/LOGGING.md for complete logging standards and best practices
 *
 * Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

/**
 * Checks if the application is running in development mode
 */
function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Safely calls a console method with error handling
 */
function safeConsoleCall(
  method: "debug" | "info" | "warn" | "error",
  args: any[]
): void {
  try {
    console[method](...args);
  } catch (error) {
    // Fallback to console.error if the original method fails
    // This prevents logging failures from breaking the application
    try {
      console.error("Logger error:", error);
    } catch {
      // If even console.error fails, silently fail
      // We don't want logging to break the app
    }
  }
}

/**
 * Logger instance with environment-aware logging
 *
 * Log Levels:
 * - debug() - Development only, for detailed debugging information
 * - info() - Development only, for general informational messages
 * - warn() - Always logged, for warnings that don't prevent functionality
 * - error() - Always logged, for errors requiring attention
 *
 * Best Practices:
 * - Use descriptive messages with structured data objects
 * - Prefix feature-specific logs (e.g., '[SceneManager] ...')
 * - Avoid logging in tight loops or render cycles
 * - Never log sensitive data (passwords, API keys, tokens)
 * - Include context (IDs, counts, relevant state) with errors
 *
 * Migration from console:
 * - console.log() → logger.debug() or remove if temporary
 * - console.info() → logger.info()
 * - console.warn() → logger.warn()
 * - console.error() → logger.error()
 *
 * @see docs/LOGGING.md for complete documentation
 */
export const logger: Logger = {
  debug: (...args: any[]): void => {
    if (isDevelopment()) {
      safeConsoleCall("debug", args);
    }
  },

  info: (...args: any[]): void => {
    if (isDevelopment()) {
      safeConsoleCall("info", args);
    }
  },

  warn: (...args: any[]): void => {
    safeConsoleCall("warn", args);
  },

  error: (...args: any[]): void => {
    safeConsoleCall("error", args);
  },
};

/**
 * Environment Detection Utilities
 *
 * Provides centralized helpers for detecting the runtime environment.
 * Used to conditionally load storage backends, database drivers, etc.
 */

/**
 * Check if the application is running on Vercel
 */
export const isVercel = (): boolean => {
    return (
        process.env.VERCEL_ENV !== undefined || process.env.VERCEL === "1"
    );
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
    return process.env.NODE_ENV === "development" || !isVercel();
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
    return process.env.NODE_ENV === "production" || isVercel();
};

/**
 * Get the current environment name
 */
export const getEnvironmentName = (): "vercel" | "local" => {
    return isVercel() ? "vercel" : "local";
};

/**
 * Get the Vercel environment type (preview, production, development)
 */
export const getVercelEnv = (): "production" | "preview" | "development" | null => {
    const env = process.env.VERCEL_ENV;
    if (env === "production" || env === "preview" || env === "development") {
        return env;
    }
    return null;
};

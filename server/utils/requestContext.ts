/**
 * Request Context for User API Keys
 *
 * This module provides a way to store and retrieve user-provided API keys
 * for the current request context. This is used for the demo deployment
 * where users can provide their own API keys.
 *
 * The context uses Node.js AsyncLocalStorage to maintain request-scoped state.
 */

import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
    /** User-provided Gemini API key (from Authorization header) */
    userApiKey?: string;
    /** Request ID for tracing */
    requestId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function within a request context
 */
export const runWithContext = <T>(
    context: RequestContext,
    fn: () => T | Promise<T>
): T | Promise<T> => {
    return asyncLocalStorage.run(context, fn);
};

/**
 * Get the current request context
 */
export const getContext = (): RequestContext | undefined => {
    return asyncLocalStorage.getStore();
};

/**
 * Get the user API key from the current request context
 */
export const getUserApiKey = (): string | undefined => {
    return getContext()?.userApiKey;
};

/**
 * Get the request ID from the current request context
 */
export const getRequestId = (): string | undefined => {
    return getContext()?.requestId;
};

/**
 * Set the user API key in the current request context
 * Note: This creates a new context if one doesn't exist
 */
export const setUserApiKey = (key: string | undefined): void => {
    const store = asyncLocalStorage.getStore();
    if (store) {
        store.userApiKey = key;
    }
};

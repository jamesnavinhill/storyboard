/**
 * API Key Store
 *
 * Manages user-provided API keys in-memory for the session.
 * Keys are NEVER persisted to localStorage for security.
 *
 * Usage:
 *   import { useApiKeyStore } from './stores/apiKeyStore';
 *
 *   // In a component:
 *   const { geminiKey, setGeminiKey, clearGeminiKey } = useApiKeyStore();
 */

import { create } from "zustand";

interface ApiKeyState {
    /** User-provided Gemini API key */
    geminiKey: string | null;

    /** Set the Gemini API key */
    setGeminiKey: (key: string) => void;

    /** Clear the Gemini API key */
    clearGeminiKey: () => void;

    /** Check if a Gemini key is set */
    hasGeminiKey: () => boolean;

    /** Get the key for use in API calls (returns null if not set) */
    getGeminiKey: () => string | null;
}

export const useApiKeyStore = create<ApiKeyState>()((set, get) => ({
    geminiKey: null,

    setGeminiKey: (key: string) => {
        // Validate key format (basic check)
        const trimmedKey = key.trim();
        if (!trimmedKey) {
            console.warn("Attempted to set empty API key");
            return;
        }
        set({ geminiKey: trimmedKey });
    },

    clearGeminiKey: () => {
        set({ geminiKey: null });
    },

    hasGeminiKey: () => {
        return !!get().geminiKey;
    },

    getGeminiKey: () => {
        return get().geminiKey;
    },
}));

// Export a function to get the key outside of React components
export const getGeminiApiKey = (): string | null => {
    return useApiKeyStore.getState().geminiKey;
};

// Export a function to set the key outside of React components
export const setGeminiApiKey = (key: string): void => {
    useApiKeyStore.getState().setGeminiKey(key);
};

// Export a function to clear the key outside of React components
export const clearGeminiApiKey = (): void => {
    useApiKeyStore.getState().clearGeminiKey();
};

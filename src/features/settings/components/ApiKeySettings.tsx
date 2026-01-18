/**
 * API Key Settings Component
 *
 * Provides a UI for users to enter their own Gemini API key
 * for the demo deployment. The key is stored in memory only
 * and never persisted to localStorage.
 */

import React, { useState, useEffect } from "react";
import { Key, Check, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useApiKeyStore } from "@/stores/apiKeyStore";

interface ApiKeySettingsProps {
    variant?: "compact" | "full";
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
    variant = "full",
}) => {
    const { geminiKey, setGeminiKey, clearGeminiKey, hasGeminiKey } =
        useApiKeyStore();
    const [inputValue, setInputValue] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
        "idle"
    );

    // Sync input with stored key on mount
    useEffect(() => {
        if (geminiKey) {
            setInputValue(geminiKey);
        }
    }, [geminiKey]);

    const handleSave = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) {
            setStatus("error");
            return;
        }

        setStatus("saving");
        setGeminiKey(trimmed);

        // Show saved status briefly
        setTimeout(() => {
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 2000);
        }, 300);
    };

    const handleClear = () => {
        clearGeminiKey();
        setInputValue("");
        setStatus("idle");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        }
    };

    const isKeySet = hasGeminiKey();
    const maskedKey = geminiKey
        ? `${geminiKey.slice(0, 4)}${"•".repeat(Math.min(20, geminiKey.length - 8))}${geminiKey.slice(-4)}`
        : "";

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-neutral-400" />
                    <span className="text-xs text-neutral-400">API Key:</span>
                </div>
                {isKeySet ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400 font-mono">
                            {showKey ? geminiKey : maskedKey}
                        </span>
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="text-neutral-400 hover:text-neutral-300"
                            aria-label={showKey ? "Hide key" : "Show key"}
                        >
                            {showKey ? (
                                <EyeOff className="h-3 w-3" />
                            ) : (
                                <Eye className="h-3 w-3" />
                            )}
                        </button>
                        <button
                            onClick={handleClear}
                            className="text-neutral-400 hover:text-red-400"
                            aria-label="Clear API key"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-neutral-500">Not set (using server key)</span>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-medium text-neutral-200">
                    Gemini API Key
                </h3>
            </div>

            <p className="text-xs text-neutral-400">
                Enter your own Gemini API key to use AI features. Your key is stored
                only in memory and will be cleared when you close the browser.
            </p>

            <div className="space-y-3">
                <div className="relative">
                    <input
                        type={showKey ? "text" : "password"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your Gemini API key..."
                        className="w-full px-3 py-2 pr-10 text-sm bg-neutral-800 border border-neutral-700 rounded-lg 
                       text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 
                       focus:ring-blue-500/50 focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 
                       hover:text-neutral-300 transition-colors"
                        aria-label={showKey ? "Hide key" : "Show key"}
                    >
                        {showKey ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!inputValue.trim() || status === "saving"}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 
                       hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 
                       text-white rounded-lg transition-colors"
                    >
                        {status === "saved" ? (
                            <>
                                <Check className="h-4 w-4" />
                                Saved
                            </>
                        ) : (
                            "Save Key"
                        )}
                    </button>

                    {isKeySet && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-700 
                         hover:bg-neutral-600 text-neutral-300 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </button>
                    )}
                </div>

                {status === "error" && (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="h-4 w-4" />
                        Please enter a valid API key
                    </div>
                )}

                {isKeySet && status !== "error" && (
                    <div className="flex items-center gap-2 text-green-400 text-xs">
                        <Check className="h-4 w-4" />
                        Your API key is set and will be used for AI requests
                    </div>
                )}
            </div>

            <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                <h4 className="text-xs font-medium text-neutral-300 mb-1">
                    How to get an API key
                </h4>
                <ol className="text-xs text-neutral-400 space-y-1 list-decimal list-inside">
                    <li>
                        Go to{" "}
                        <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                        >
                            Google AI Studio
                        </a>
                    </li>
                    <li>Sign in with your Google account</li>
                    <li>Click "Create API key" and copy the key</li>
                </ol>
            </div>
        </div>
    );
};

export default ApiKeySettings;

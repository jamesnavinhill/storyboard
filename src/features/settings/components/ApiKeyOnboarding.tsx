
import React, { useState, useEffect } from "react";
import { Key, ExternalLink, ShieldCheck, X } from "lucide-react";
import { useApiKeyStore } from "@/stores/apiKeyStore";

export const ApiKeyOnboarding: React.FC = () => {
    const { hasGeminiKey, setGeminiKey } = useApiKeyStore();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check if key is already set
        if (!hasGeminiKey()) {
            // Small delay to allow app to load
            const timer = setTimeout(() => setIsOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [hasGeminiKey]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        setIsSubmitting(true);

        // Simulate a brief validation/save delay for UX
        setTimeout(() => {
            setGeminiKey(inputValue.trim());
            setIsSubmitting(false);
            setIsOpen(false);
        }, 600);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 pb-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                        <Key className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Enter your API Key
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        To run this demo, you need to provide your own Google Gemini API key.
                        Your key is handled securely and stored only in your browser's memory for this session.
                    </p>
                </div>

                {/* Access Info */}
                <div className="px-6 py-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-200/80">
                            <span className="font-medium text-blue-100 block mb-0.5">Secure & Private</span>
                            We do not store your key on our servers. It is used directly from your client to communicate with the AI models.
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
                    <div>
                        <label htmlFor="apiKey" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                            Gemini API Key
                        </label>
                        <input
                            id="apiKey"
                            type="password"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/5"
                        >
                            Get a Key
                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                        </a>
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isSubmitting}
                            className="flex-[2] flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                        >
                            {isSubmitting ? "Verifying..." : "Start Creating"}
                        </button>
                    </div>
                </form>

                {/* Footer / Skip (optional) */}
                <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex justify-center">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                        Continue without key (Limited functionality)
                    </button>
                </div>
            </div>
        </div>
    );
};

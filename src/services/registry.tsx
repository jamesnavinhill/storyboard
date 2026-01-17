import React, { useMemo } from "react";
import type { ServiceRegistry } from "../types/services";
import {
  serverChatProvider,
  serverMediaGenerator,
  serverStoryboardGenerator,
} from "./providers/server";
import {
  geminiChatProvider,
  geminiMediaGenerator,
  geminiStoryboardGenerator,
} from "./providers/gemini";
import { projectStorage } from "./storage";

const useLegacyGemini =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env !== "undefined" &&
  String(import.meta.env.VITE_USE_LEGACY_GEMINI).toLowerCase() === "true";

const defaultRegistry: ServiceRegistry = {
  chatProvider: useLegacyGemini ? geminiChatProvider : serverChatProvider,
  storyboardGenerator: useLegacyGemini
    ? geminiStoryboardGenerator
    : serverStoryboardGenerator,
  mediaGenerator: useLegacyGemini ? geminiMediaGenerator : serverMediaGenerator,
  projectStorage,
};

const ServiceContext = React.createContext<ServiceRegistry>(defaultRegistry);

export interface ServiceProviderProps {
  registry?: ServiceRegistry;
  children: React.ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  registry,
  children,
}) => {
  const value = useMemo(() => registry ?? defaultRegistry, [registry]);
  return (
    <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>
  );
};

export const useServices = (): ServiceRegistry => {
  const context = React.useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
};

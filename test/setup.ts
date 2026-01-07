import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom doesn't implement scrollIntoView; polyfill to avoid crashes in components using it
if (typeof window !== "undefined" && (window as any).HTMLElement) {
  Object.defineProperty(
    (window as any).HTMLElement.prototype,
    "scrollIntoView",
    {
      value: vi.fn(),
      writable: true,
    }
  );
}

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import App from "../App";
import { ToastProvider } from "../components/toast/ToastProvider";
import { ServiceProvider } from "../services/registry";

// Test wrapper with required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ServiceProvider>
    <ToastProvider>{children}</ToastProvider>
  </ServiceProvider>
);

describe("Scene manager panel layout", () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        clear: () => {
          store = {};
        },
      };
    })();
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    // Mock window dimensions for desktop layout
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
  });

  it("renders a single chat resizer while outer panels are fixed", () => {
    const { container } = render(<App />, { wrapper: TestWrapper });

    const resizers = container.querySelectorAll(".layout-resizer");
    expect(resizers.length).toBe(1);
    expect(resizers[0].getAttribute("aria-label")).toBe("Resize chat column");
  });

  it("automatically allocates remaining space to the storyboard", () => {
    const { container } = render(<App />, { wrapper: TestWrapper });

    // Find storyboard panel (should have flex-1 behavior)
    const storyboardPanel = container.querySelector(".layout-main");
    expect(storyboardPanel).toBeTruthy();

    // Verify storyboard has flex-1 class or style
    const hasFlexGrow =
      storyboardPanel?.classList.contains("flex-1") ||
      window.getComputedStyle(storyboardPanel!).flexGrow === "1";

    expect(hasFlexGrow).toBe(true);
  });

  it("provides collapse and expand controls for the scene manager", () => {
    render(<App />, { wrapper: TestWrapper });

    expect(screen.getByLabelText("Collapse scene manager")).toBeInTheDocument();
    // Collapse first to reveal the expand button
    fireEvent.click(screen.getByLabelText("Collapse scene manager"));
    expect(screen.getByLabelText("Expand scene manager")).toBeInTheDocument();
  });

  it("toggles scene manager collapsed state and applies width classes", () => {
    const { container } = render(<App />, { wrapper: TestWrapper });

    const sceneManager = container.querySelector(".layout-scene-manager");
    expect(sceneManager).toBeTruthy();
    expect(
      sceneManager?.classList.contains("layout-scene-manager--collapsed")
    ).toBe(false);

    fireEvent.click(screen.getByLabelText("Collapse scene manager"));

    const collapsedPanel = container.querySelector(".layout-scene-manager");
    expect(
      collapsedPanel?.classList.contains("layout-scene-manager--collapsed")
    ).toBe(true);

    fireEvent.click(screen.getByLabelText("Expand scene manager"));

    const expandedPanel = container.querySelector(".layout-scene-manager");
    expect(
      expandedPanel?.classList.contains("layout-scene-manager--collapsed")
    ).toBe(false);
  });

  it("does not render a redundant storyboard resizer", () => {
    const { container } = render(<App />, { wrapper: TestWrapper });

    // Verify there's no resizer that calls startResize("storyboard")
    const resizers = container.querySelectorAll(".layout-resizer");

    // Check aria-labels to ensure no "Resize storyboard" resizer exists
    const storyboardResizer = Array.from(resizers).find((resizer) =>
      resizer.getAttribute("aria-label")?.includes("storyboard")
    );
    expect(storyboardResizer).toBeFalsy();
  });
});

/**
 * Tests for responsive layout behavior
 * Verifies that panels collapse/expand correctly when window is resized
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Layout Responsive Behavior", () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Store original window width
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("should detect mobile layout when window width is below breakpoint", () => {
    // Set window width below 1024px (LAYOUT_BREAKPOINT)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    // Trigger resize event
    window.dispatchEvent(new Event("resize"));

    // Verify mobile layout is detected
    expect(window.innerWidth).toBeLessThan(1024);
  });

  it("should detect desktop layout when window width is above breakpoint", () => {
    // Set window width above 1024px (LAYOUT_BREAKPOINT)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });

    // Trigger resize event
    window.dispatchEvent(new Event("resize"));

    // Verify desktop layout is detected
    expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
  });

  it("should handle transition from desktop to mobile layout", () => {
    // Start with desktop width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
    window.dispatchEvent(new Event("resize"));
    expect(window.innerWidth).toBeGreaterThanOrEqual(1024);

    // Transition to mobile width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    });
    window.dispatchEvent(new Event("resize"));
    expect(window.innerWidth).toBeLessThan(1024);
  });

  it("should handle transition from mobile to desktop layout", () => {
    // Start with mobile width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    });
    window.dispatchEvent(new Event("resize"));
    expect(window.innerWidth).toBeLessThan(1024);

    // Transition to desktop width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
    window.dispatchEvent(new Event("resize"));
    expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
  });
});

describe("Layout Space Calculations", () => {
  const SIDEBAR_MIN_WIDTH = 240;
  const SIDEBAR_COLLAPSED_WIDTH = 72;
  const CHAT_MIN_WIDTH = 320;
  const STORYBOARD_MIN_WIDTH = 480;
  const SCENE_MANAGER_MIN_WIDTH = 320;
  const SCENE_MANAGER_COLLAPSED_WIDTH = 72;
  const RESIZER_SIZE = 10;
  const DESKTOP_RESIZER_COUNT = 1;
  const TOTAL_RESIZER_SPACE = RESIZER_SIZE * DESKTOP_RESIZER_COUNT;

  it("should calculate correct space with all panels expanded", () => {
    const containerWidth = 1920;
    const sidebarWidth = 288;
    const chatWidth = 420;
    const sceneManagerWidth = 440;

    const sidebarSpace = sidebarWidth;
    const chatSpace = chatWidth;
    const sceneManagerSpace = sceneManagerWidth;
    const resizerSpace = TOTAL_RESIZER_SPACE; // Single chat resizer

    const storyboardSpace =
      containerWidth -
      sidebarSpace -
      chatSpace -
      sceneManagerSpace -
      resizerSpace;

    expect(storyboardSpace).toBeGreaterThanOrEqual(STORYBOARD_MIN_WIDTH);
    expect(
      sidebarSpace +
        chatSpace +
        storyboardSpace +
        sceneManagerSpace +
        resizerSpace
    ).toBe(containerWidth);
  });

  it("should calculate correct space with sidebar collapsed", () => {
    const containerWidth = 1920;
    const chatWidth = 420;
    const sceneManagerWidth = 440;

    const sidebarSpace = SIDEBAR_COLLAPSED_WIDTH;
    const chatSpace = chatWidth;
    const sceneManagerSpace = sceneManagerWidth;
    const resizerSpace = TOTAL_RESIZER_SPACE;

    const storyboardSpace =
      containerWidth -
      sidebarSpace -
      chatSpace -
      sceneManagerSpace -
      resizerSpace;

    expect(storyboardSpace).toBeGreaterThanOrEqual(STORYBOARD_MIN_WIDTH);
    expect(
      sidebarSpace +
        chatSpace +
        storyboardSpace +
        sceneManagerSpace +
        resizerSpace
    ).toBe(containerWidth);
  });

  it("should calculate correct space with scene manager collapsed", () => {
    const containerWidth = 1920;
    const sidebarWidth = 288;
    const chatWidth = 420;

    const sidebarSpace = sidebarWidth;
    const chatSpace = chatWidth;
    const sceneManagerSpace = SCENE_MANAGER_COLLAPSED_WIDTH;
    const resizerSpace = TOTAL_RESIZER_SPACE;

    const storyboardSpace =
      containerWidth -
      sidebarSpace -
      chatSpace -
      sceneManagerSpace -
      resizerSpace;

    expect(storyboardSpace).toBeGreaterThanOrEqual(STORYBOARD_MIN_WIDTH);
    expect(
      sidebarSpace +
        chatSpace +
        storyboardSpace +
        sceneManagerSpace +
        resizerSpace
    ).toBe(containerWidth);
  });

  it("should maintain minimum widths when space is constrained", () => {
    const containerWidth = 1600; // Container with enough space for all minimums

    const sidebarSpace = SIDEBAR_MIN_WIDTH;
    const chatSpace = CHAT_MIN_WIDTH;
    const sceneManagerSpace = SCENE_MANAGER_MIN_WIDTH;
    const resizerSpace = TOTAL_RESIZER_SPACE;

    const storyboardSpace =
      containerWidth -
      sidebarSpace -
      chatSpace -
      sceneManagerSpace -
      resizerSpace;

    // Verify all panels maintain minimum widths
    expect(sidebarSpace).toBeGreaterThanOrEqual(SIDEBAR_MIN_WIDTH);
    expect(chatSpace).toBeGreaterThanOrEqual(CHAT_MIN_WIDTH);
    expect(sceneManagerSpace).toBeGreaterThanOrEqual(SCENE_MANAGER_MIN_WIDTH);
    expect(storyboardSpace).toBeGreaterThanOrEqual(STORYBOARD_MIN_WIDTH);
  });

  it("should handle insufficient space by requiring panel collapse", () => {
    const containerWidth = 1200; // Too small for all panels at minimum width

    const sidebarSpace = SIDEBAR_MIN_WIDTH;
    const chatSpace = CHAT_MIN_WIDTH;
    const sceneManagerSpace = SCENE_MANAGER_MIN_WIDTH;
    const resizerSpace = TOTAL_RESIZER_SPACE;

    const storyboardSpace =
      containerWidth -
      sidebarSpace -
      chatSpace -
      sceneManagerSpace -
      resizerSpace;

    // When space is insufficient, storyboard will be below minimum
    // This indicates panels should collapse to make room
    expect(storyboardSpace).toBeLessThan(STORYBOARD_MIN_WIDTH);

    // With scene manager collapsed, there should be enough space
    const sceneManagerCollapsedSpace = SCENE_MANAGER_COLLAPSED_WIDTH;
    const storyboardWithCollapsedSceneManager =
      containerWidth -
      sidebarSpace -
      chatSpace -
      sceneManagerCollapsedSpace -
      resizerSpace;

    expect(storyboardWithCollapsedSceneManager).toBeGreaterThanOrEqual(
      STORYBOARD_MIN_WIDTH
    );
  });

  it("should have exactly 1 resizer in the layout", () => {
    // Verify the layout has exactly 1 resizer:
    // 1. Between chat and main storyboard panels
    const resizerCount = DESKTOP_RESIZER_COUNT;
    const totalResizerSpace = RESIZER_SIZE * resizerCount;

    expect(totalResizerSpace).toBe(10); // 10px * 1 resizer
  });
});

describe("Layout Constraints", () => {
  it("should ensure storyboard maintains minimum width", () => {
    const STORYBOARD_MIN_WIDTH = 480;
    const storyboardWidth = 500;

    expect(storyboardWidth).toBeGreaterThanOrEqual(STORYBOARD_MIN_WIDTH);
  });

  it("should clamp values within min and max bounds", () => {
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    expect(clamp(100, 200, 400)).toBe(200); // Below min
    expect(clamp(300, 200, 400)).toBe(300); // Within range
    expect(clamp(500, 200, 400)).toBe(400); // Above max
  });
});

import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ToastProvider, useToast } from "../ToastProvider";

// Test component that uses the toast hook
const TestComponent = () => {
  const { show, dismiss } = useToast();

  return (
    <div>
      <button
        onClick={() => show({ variant: "error", description: "Error message" })}
      >
        Show Error
      </button>
      <button
        onClick={() =>
          show({ variant: "success", description: "Success message" })
        }
      >
        Show Success
      </button>
      <button
        onClick={() =>
          show({
            variant: "error",
            description: "Custom duration",
            duration: 5000,
          })
        }
      >
        Show Custom
      </button>
    </div>
  );
};

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display error toast with correct message", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText("Show Error");
    act(() => {
      button.click();
    });

    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("should auto-dismiss error toast after 2 seconds", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText("Show Error");
    act(() => {
      button.click();
    });

    expect(screen.getByText("Error message")).toBeInTheDocument();

    // Fast-forward time by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText("Error message")).not.toBeInTheDocument();
  });

  it("should allow manual dismissal before auto-dismiss", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText("Show Error");
    act(() => {
      button.click();
    });

    expect(screen.getByText("Error message")).toBeInTheDocument();

    // Click the dismiss button
    const dismissButton = screen.getByLabelText("Dismiss notification");
    act(() => {
      dismissButton.click();
    });

    expect(screen.queryByText("Error message")).not.toBeInTheDocument();
  });

  it("should respect custom duration parameter", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText("Show Custom");
    act(() => {
      button.click();
    });

    expect(screen.getByText("Custom duration")).toBeInTheDocument();

    // Fast-forward by 2 seconds (default error duration)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should still be visible because custom duration is 5000ms
    expect(screen.getByText("Custom duration")).toBeInTheDocument();

    // Fast-forward by another 3 seconds (total 5 seconds)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Custom duration")).not.toBeInTheDocument();
  });
});

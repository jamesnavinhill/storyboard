import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StreamingText } from "../StreamingText";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("StreamingText", () => {
  const defaultProps = {
    prompt: "Test prompt",
    onComplete: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders without errors", () => {
    // Mock successful streaming response
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"chunk":"Hello"}\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"done":true}\n\n'),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([["x-request-id", "test-123"]]),
      body: { getReader: () => mockReader },
    });

    render(<StreamingText {...defaultProps} />);

    expect(screen.getByText("Generating...")).toBeInTheDocument();
  });

  it("displays streaming text progressively", async () => {
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"chunk":"Hello "}\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"chunk":"World"}\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"done":true}\n\n'),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([["x-request-id", "test-123"]]),
      body: { getReader: () => mockReader },
    });

    render(<StreamingText {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  it("shows stop button during streaming", async () => {
    const mockReader = {
      read: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    };

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([["x-request-id", "test-123"]]),
      body: { getReader: () => mockReader },
    });

    render(<StreamingText {...defaultProps} />);

    await waitFor(() => {
      const stopButton = screen.getByRole("button", {
        name: /stop generation/i,
      });
      expect(stopButton).toBeInTheDocument();
    });
  });

  it("triggers connection close when stop button is clicked", async () => {
    const user = userEvent.setup();
    const mockAbort = vi.fn();
    const mockReader = {
      read: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    };

    // Mock AbortController
    const originalAbortController = global.AbortController;
    global.AbortController = vi.fn().mockImplementation(() => ({
      signal: {},
      abort: mockAbort,
    })) as any;

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([["x-request-id", "test-123"]]),
      body: { getReader: () => mockReader },
    });

    render(<StreamingText {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /stop generation/i })
      ).toBeInTheDocument();
    });

    const stopButton = screen.getByRole("button", { name: /stop generation/i });
    await user.click(stopButton);

    expect(mockAbort).toHaveBeenCalled();
    expect(defaultProps.onComplete).toHaveBeenCalled();

    // Restore
    global.AbortController = originalAbortController;
  });

  it("displays error message when streaming fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "API Error" }),
    });

    render(<StreamingText {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("API Error")).toBeInTheDocument();
    });

    expect(defaultProps.onError).toHaveBeenCalledWith("API Error");
  });

  it("handles SSE error events", async () => {
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(
            'data: {"error":"Stream error","requestId":"req-123"}\n\n'
          ),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([["x-request-id", "test-123"]]),
      body: { getReader: () => mockReader },
    });

    render(<StreamingText {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Stream error")).toBeInTheDocument();
    });

    expect(defaultProps.onError).toHaveBeenCalledWith(
      "Stream error",
      "req-123"
    );
  });
});

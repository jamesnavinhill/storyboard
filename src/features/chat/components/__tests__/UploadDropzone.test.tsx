import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadDropzone } from "../UploadDropzone";

describe("UploadDropzone", () => {
  const defaultProps = {
    projectId: "test-project-123",
    onFilesUploaded: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dropzone UI", () => {
    render(<UploadDropzone {...defaultProps} />);

    expect(
      screen.getByText(/drop files here or click to browse/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/images, videos, audio, text, pdf/i)
    ).toBeInTheDocument();
  });

  it("displays drag-and-drop UI when dragging", async () => {
    render(<UploadDropzone {...defaultProps} />);

    const dropzone = screen
      .getByText(/drop files here or click to browse/i)
      .closest("div");
    expect(dropzone).toBeInTheDocument();

    if (dropzone) {
      // Simulate drag enter with files
      fireEvent.dragEnter(dropzone, {
        dataTransfer: {
          items: [{ kind: "file", type: "image/jpeg" }],
          files: [new File(["test"], "test.jpg", { type: "image/jpeg" })],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/drop files here/i)).toBeInTheDocument();
      });
    }
  });

  it("handles file drop and triggers upload", async () => {
    const mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: { addEventListener: vi.fn() },
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (event === "load") {
          setTimeout(() => {
            Object.defineProperty(mockXHR, "status", { value: 200 });
            Object.defineProperty(mockXHR, "responseText", {
              value: JSON.stringify({
                file: {
                  id: "file-123",
                  name: "test.jpg",
                  size: 1024,
                  mimeType: "image/jpeg",
                  purpose: "general-reference",
                },
              }),
            });
            handler();
          }, 0);
        }
      }),
    };

    const originalXHR = global.XMLHttpRequest;
    global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

    render(<UploadDropzone {...defaultProps} />);

    const dropzone = screen
      .getByText(/drop files here or click to browse/i)
      .closest("div");
    expect(dropzone).toBeInTheDocument();

    if (dropzone) {
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          items: [{ kind: "file", type: "image/jpeg" }],
        },
      });

      await waitFor(() => {
        expect(mockXHR.open).toHaveBeenCalledWith("POST", "/api/files/upload");
        expect(mockXHR.send).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(defaultProps.onFilesUploaded).toHaveBeenCalledWith([
          expect.objectContaining({
            id: "file-123",
            name: "test.jpg",
            mimeType: "image/jpeg",
          }),
        ]);
      });
    }

    global.XMLHttpRequest = originalXHR;
  });

  it("displays upload progress during file upload", async () => {
    let progressHandler: Function | null = null;

    const mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: {
        addEventListener: vi.fn((event: string, handler: Function) => {
          if (event === "progress") {
            progressHandler = handler;
          }
        }),
      },
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (event === "load") {
          setTimeout(() => {
            Object.defineProperty(mockXHR, "status", { value: 200 });
            Object.defineProperty(mockXHR, "responseText", {
              value: JSON.stringify({
                file: {
                  id: "file-123",
                  name: "test.jpg",
                  size: 1024,
                  mimeType: "image/jpeg",
                  purpose: "general-reference",
                },
              }),
            });
            handler();
          }, 100);
        }
      }),
    };

    const originalXHR = global.XMLHttpRequest;
    global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

    render(<UploadDropzone {...defaultProps} />);

    const dropzone = screen
      .getByText(/drop files here or click to browse/i)
      .closest("div");

    if (dropzone) {
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          items: [{ kind: "file", type: "image/jpeg" }],
        },
      });

      await waitFor(() => {
        expect(progressHandler).not.toBeNull();
      });

      // Simulate progress event
      if (progressHandler) {
        progressHandler({ lengthComputable: true, loaded: 512, total: 1024 });
      }

      await waitFor(() => {
        expect(screen.getByText("50%")).toBeInTheDocument();
      });
    }

    global.XMLHttpRequest = originalXHR;
  });

  it("validates file size and shows error for oversized files", async () => {
    render(<UploadDropzone {...defaultProps} />);

    const dropzone = screen
      .getByText(/drop files here or click to browse/i)
      .closest("div");

    if (dropzone) {
      // Create a file larger than 100MB
      const largeFile = new File(["x".repeat(101 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [largeFile],
          items: [{ kind: "file", type: "image/jpeg" }],
        },
      });

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.stringContaining("too large")
        );
      });
    }
  });

  it("validates file type and shows error for unsupported formats", async () => {
    render(<UploadDropzone {...defaultProps} />);

    const dropzone = screen
      .getByText(/drop files here or click to browse/i)
      .closest("div");

    if (dropzone) {
      const unsupportedFile = new File(["test"], "test.exe", {
        type: "application/x-msdownload",
      });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [unsupportedFile],
          items: [{ kind: "file", type: "application/x-msdownload" }],
        },
      });

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.stringContaining("unsupported format")
        );
      });
    }
  });
});

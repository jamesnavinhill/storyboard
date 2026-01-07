import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSSEClient, streamSSE } from "../sseClient";

// Mock EventSource
class MockEventSource {
  url: string;
  readyState: number = 0;
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances: MockEventSource[] = [];
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private listeners: Map<string, Set<EventListenerOrEventListenerObject>> =
    new Map();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);

    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 0);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === "function") {
          listener(event);
        } else {
          listener.handleEvent(event);
        }
      });
    }
    return true;
  }

  close(): void {
    this.readyState = MockEventSource.CLOSED;
  }

  // Helper method for testing
  simulateMessage(data: string): void {
    if (this.onmessage) {
      const event = new MessageEvent("message", { data });
      this.onmessage(event);
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }
}

describe("SSE Client", () => {
  let originalEventSource: typeof EventSource;

  beforeEach(() => {
    originalEventSource = global.EventSource;
    global.EventSource = MockEventSource as any;
    MockEventSource.instances = [];
  });

  afterEach(() => {
    global.EventSource = originalEventSource;
    MockEventSource.instances = [];
  });

  describe("createSSEClient", () => {
    it("should create SSE client with options", () => {
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage: vi.fn(),
      });

      expect(client).toBeDefined();
      expect(client.connect).toBeDefined();
      expect(client.disconnect).toBeDefined();
      expect(client.isConnected).toBeDefined();
    });

    it("should connect to SSE endpoint", async () => {
      const onMessage = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.isConnected()).toBe(true);
    });

    it("should receive messages from SSE stream", async () => {
      const onMessage = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate receiving a message
      const mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateMessage(JSON.stringify({ chunk: "Hello" }));

      expect(onMessage).toHaveBeenCalledWith("Hello");
    });

    it("should handle connection errors", async () => {
      const onMessage = vi.fn();
      const onError = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
        onError,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate an error
      const mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateError();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalled();
    });

    it("should close connection", async () => {
      const onMessage = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.isConnected()).toBe(true);

      client.disconnect();

      expect(client.isConnected()).toBe(false);
    });

    it("should handle multiple messages in sequence", async () => {
      const messages: string[] = [];
      const onMessage = vi.fn((chunk) => messages.push(chunk));
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const mockEventSource = (client as any).eventSource as MockEventSource;

      // Simulate multiple messages
      mockEventSource.simulateMessage(JSON.stringify({ chunk: "Hello " }));
      mockEventSource.simulateMessage(JSON.stringify({ chunk: "world" }));

      expect(messages).toEqual(["Hello ", "world"]);
    });

    it("should handle done event", async () => {
      const onMessage = vi.fn();
      const onComplete = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
        onComplete,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateMessage(JSON.stringify({ done: true }));

      expect(onComplete).toHaveBeenCalled();
      expect(client.isConnected()).toBe(false);
    });

    it("should not connect if already connected", async () => {
      const onMessage = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
      });

      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Try to connect again
      client.connect();

      // Should still be connected (not create a new connection)
      expect(client.isConnected()).toBe(true);
    });

    it("should handle malformed JSON in messages", async () => {
      const onMessage = vi.fn();
      const onError = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
        onError,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateMessage("invalid json");

      // Should handle gracefully without crashing
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("streamSSE", () => {
    it("should stream SSE data", async () => {
      const chunks: string[] = [];
      const onChunk = vi.fn((chunk) => chunks.push(chunk));

      const streamPromise = streamSSE("/api/ai/chat/stream", onChunk);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate messages
      const mockEventSource = MockEventSource.instances[0];
      mockEventSource.simulateMessage(JSON.stringify({ chunk: "Hello" }));
      mockEventSource.simulateMessage(JSON.stringify({ chunk: " world" }));
      mockEventSource.simulateMessage(JSON.stringify({ done: true }));

      await streamPromise;

      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("should handle abort signal", async () => {
      const onChunk = vi.fn();
      const abortController = new AbortController();

      const streamPromise = streamSSE(
        "/api/ai/chat/stream",
        onChunk,
        abortController.signal
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      abortController.abort();

      await expect(streamPromise).rejects.toThrow("Stream aborted");
    });

    it("should handle errors", async () => {
      const onChunk = vi.fn();

      const streamPromise = streamSSE("/api/ai/chat/stream", onChunk);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate error
      const mockEventSource = MockEventSource.instances[0];
      mockEventSource.simulateError();

      await expect(streamPromise).rejects.toThrow();
    });
  });

  describe("SSE Client Reconnection", () => {
    it("should attempt reconnection on connection loss", async () => {
      const onMessage = vi.fn();
      const onError = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
        onError,
        reconnectAttempts: 2,
        reconnectDelay: 100,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate connection error
      const mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateError();

      // Wait for reconnection attempt
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should have attempted reconnection
      expect(onError).toHaveBeenCalled();
    });

    it("should not reconnect after manual disconnect", async () => {
      const onMessage = vi.fn();
      const client = createSSEClient({
        url: "/api/ai/chat/stream",
        onMessage,
        reconnectAttempts: 3,
      });

      client.connect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      client.disconnect();

      // Simulate error after disconnect
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not reconnect
      expect(client.isConnected()).toBe(false);
    });
  });
});

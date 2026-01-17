/**
 * SSE Client Utility
 *
 * Provides a wrapper around EventSource for streaming AI responses.
 * Handles connection lifecycle, event parsing, and reconnection logic.
 *
 * Requirements: 3.4, 3.6, 3.7
 */

export interface SSEClientOptions {
  url: string;
  onMessage: (chunk: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface SSEClient {
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

/**
 * Creates an SSE client for streaming responses
 */
export function createSSEClient(options: SSEClientOptions): SSEClient {
  const {
    url,
    onMessage,
    onError,
    onComplete,
    reconnectAttempts = 3,
    reconnectDelay = 1000,
  } = options;

  let eventSource: EventSource | null = null;
  let reconnectCount = 0;
  let isManualDisconnect = false;

  const connect = () => {
    if (eventSource) {
      return; // Already connected
    }

    isManualDisconnect = false;
    eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.done) {
          onComplete?.();
          disconnect();
        } else if (data.chunk) {
          onMessage(data.chunk);
        }
      } catch (error) {
        console.error("[SSE] Failed to parse message:", error);
        onError?.(
          error instanceof Error
            ? error
            : new Error("Failed to parse SSE message")
        );
      }
    };

    eventSource.addEventListener("error", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const error = new Error(data.error || "SSE connection error");
        Object.assign(error, {
          requestId: data.requestId,
          retryable: data.retryable,
          errorCode: data.errorCode,
        });
        onError?.(error);
      } catch {
        // Not a JSON error event, handle as connection error
        handleConnectionError();
      }
    });

    eventSource.onerror = () => {
      handleConnectionError();
    };
  };

  const handleConnectionError = () => {
    if (isManualDisconnect) {
      return; // Don't reconnect if manually disconnected
    }

    const shouldReconnect = reconnectCount < reconnectAttempts;

    if (shouldReconnect) {
      reconnectCount++;
      console.log(
        `[SSE] Connection lost. Reconnecting (${reconnectCount}/${reconnectAttempts})...`
      );

      // Clean up current connection
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      // Attempt reconnection after delay
      setTimeout(() => {
        if (!isManualDisconnect) {
          connect();
        }
      }, reconnectDelay * reconnectCount);
    } else {
      const error = new Error(
        "SSE connection failed after maximum reconnection attempts"
      );
      onError?.(error);
      disconnect();
    }
  };

  const disconnect = () => {
    isManualDisconnect = true;

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    reconnectCount = 0;
  };

  const isConnected = () => {
    return eventSource !== null && eventSource.readyState === EventSource.OPEN;
  };

  return {
    connect,
    disconnect,
    isConnected,
  };
}

/**
 * Simplified SSE streaming function for one-time use
 */
export async function streamSSE(
  url: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = createSSEClient({
      url,
      onMessage: onChunk,
      onError: reject,
      onComplete: resolve,
      reconnectAttempts: 1, // No reconnection for simple streaming
    });

    // Handle abort signal
    if (signal) {
      signal.addEventListener("abort", () => {
        client.disconnect();
        reject(new Error("Stream aborted"));
      });
    }

    client.connect();
  });
}

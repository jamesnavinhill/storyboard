import React, { useEffect, useState, useRef } from "react";
import { StopCircle, AlertCircle } from "lucide-react";
import { Loader } from "@/components/Loader";

interface StreamingTextProps {
  prompt: string;
  history?: Array<{ role: "user" | "model"; text: string }>;
  image?: { data: string; mimeType: string };
  chatModel?: string;
  workflow?: string;
  thinkingMode?: boolean;
  onComplete: (text: string) => void;
  onError: (error: string, requestId?: string) => void;
  entryPoint?: string;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  prompt,
  history = [],
  image,
  chatModel,
  workflow,
  thinkingMode,
  onComplete,
  onError,
  entryPoint,
}) => {
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [error, setError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const startStreaming = async () => {
      setIsStreaming(true);
      setError(null);
      setStreamedText("");

      try {
        // Create abort controller for fetch
        abortControllerRef.current = new AbortController();

        // Prepare request body
        const body = {
          prompt,
          history,
          image,
          chatModel,
          workflow,
          thinkingMode,
          entryPoint,
        };

        // Start SSE connection
        const response = await fetch("/api/ai/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to start streaming");
        }

        // Get request ID from headers
        const requestId = response.headers.get("x-request-id") || undefined;

        // Create EventSource from response body
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        let buffer = "";
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  // Error event
                  setError({
                    message: parsed.error,
                    requestId: parsed.requestId || requestId,
                  });
                  setIsStreaming(false);
                  onError(parsed.error, parsed.requestId || requestId);
                  return;
                }

                if (parsed.done) {
                  // Stream complete
                  setIsStreaming(false);
                  onComplete(accumulatedText);
                  return;
                }

                if (parsed.chunk) {
                  // Text chunk
                  accumulatedText += parsed.chunk;
                  setStreamedText(accumulatedText);
                }
              } catch (parseError) {
                console.error("Failed to parse SSE data:", parseError);
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User stopped generation
          setIsStreaming(false);
          onComplete(streamedText);
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Streaming failed";
        setError({ message: errorMessage });
        setIsStreaming(false);
        onError(errorMessage);
      }
    };

    void startStreaming();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [prompt, history, image, chatModel, workflow, thinkingMode, entryPoint]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsStreaming(false);
    onComplete(streamedText);
  };

  if (error) {
    return (
      <div className="flex justify-start">
        <div className="card p-3 rounded-lg border border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-500">{error.message}</p>
              {error.requestId && (
                <p className="text-xs text-muted mt-1">
                  Request ID: {error.requestId}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="card p-3 rounded-lg max-w-xs lg:max-w-sm xl:max-w-md">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm whitespace-pre-wrap">{streamedText}</p>
            {isStreaming && (
              <div className="flex items-center gap-2 mt-2">
                <Loader />
                <span className="text-xs text-muted">Generating...</span>
              </div>
            )}
          </div>
          {isStreaming && (
            <button
              type="button"
              onClick={handleStop}
              className="btn-base btn-ghost p-1 flex-shrink-0"
              title="Stop generation"
              aria-label="Stop generation"
            >
              <StopCircle className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

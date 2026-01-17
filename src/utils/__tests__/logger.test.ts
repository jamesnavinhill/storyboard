import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../logger";

describe("Logger Utility", () => {
  let originalConsole: Console;
  let mockConsole: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let originalEnv: any;

  beforeEach(() => {
    // Save original console and environment
    originalConsole = global.console;
    originalEnv = import.meta.env.DEV;

    // Create mock console methods
    mockConsole = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Replace console with mocks
    global.console = {
      ...originalConsole,
      ...mockConsole,
    } as Console;
  });

  afterEach(() => {
    // Restore original console and environment
    global.console = originalConsole;
    import.meta.env.DEV = originalEnv;
  });

  describe("Development Mode", () => {
    beforeEach(() => {
      import.meta.env.DEV = true;
    });

    it("should log debug messages in development", () => {
      logger.debug("test debug message", { data: "value" });

      expect(mockConsole.debug).toHaveBeenCalledWith("test debug message", {
        data: "value",
      });
    });

    it("should log info messages in development", () => {
      logger.info("test info message", 123);

      expect(mockConsole.info).toHaveBeenCalledWith("test info message", 123);
    });

    it("should log warn messages in development", () => {
      logger.warn("test warning");

      expect(mockConsole.warn).toHaveBeenCalledWith("test warning");
    });

    it("should log error messages in development", () => {
      logger.error("test error", new Error("failure"));

      expect(mockConsole.error).toHaveBeenCalledWith(
        "test error",
        expect.any(Error)
      );
    });
  });

  describe("Production Mode", () => {
    beforeEach(() => {
      import.meta.env.DEV = false;
    });

    it("should suppress debug messages in production", () => {
      logger.debug("test debug message");

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it("should suppress info messages in production", () => {
      logger.info("test info message");

      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it("should always log warn messages in production", () => {
      logger.warn("test warning");

      expect(mockConsole.warn).toHaveBeenCalledWith("test warning");
    });

    it("should always log error messages in production", () => {
      logger.error("test error");

      expect(mockConsole.error).toHaveBeenCalledWith("test error");
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      import.meta.env.DEV = true;
    });

    it("should handle console.debug failures gracefully", () => {
      mockConsole.debug.mockImplementation(() => {
        throw new Error("Console method failed");
      });

      // Should not throw
      expect(() => logger.debug("test")).not.toThrow();

      // Should fallback to console.error
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Logger error:",
        expect.any(Error)
      );
    });

    it("should handle console.info failures gracefully", () => {
      mockConsole.info.mockImplementation(() => {
        throw new Error("Console method failed");
      });

      // Should not throw
      expect(() => logger.info("test")).not.toThrow();

      // Should fallback to console.error
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Logger error:",
        expect.any(Error)
      );
    });

    it("should handle console.warn failures gracefully", () => {
      mockConsole.warn.mockImplementation(() => {
        throw new Error("Console method failed");
      });

      // Should not throw
      expect(() => logger.warn("test")).not.toThrow();

      // Should fallback to console.error
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Logger error:",
        expect.any(Error)
      );
    });

    it("should handle console.error failures gracefully", () => {
      let callCount = 0;
      mockConsole.error.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Console method failed");
        }
      });

      // Should not throw even if console.error fails
      expect(() => logger.error("test")).not.toThrow();
    });

    it("should silently fail if both console method and fallback fail", () => {
      mockConsole.debug.mockImplementation(() => {
        throw new Error("Console method failed");
      });
      mockConsole.error.mockImplementation(() => {
        throw new Error("Fallback also failed");
      });

      // Should not throw
      expect(() => logger.debug("test")).not.toThrow();
    });
  });

  describe("Multiple Arguments", () => {
    beforeEach(() => {
      import.meta.env.DEV = true;
    });

    it("should handle multiple arguments for debug", () => {
      logger.debug("message", 1, 2, 3, { key: "value" });

      expect(mockConsole.debug).toHaveBeenCalledWith("message", 1, 2, 3, {
        key: "value",
      });
    });

    it("should handle multiple arguments for info", () => {
      logger.info("info", ["array"], { obj: true });

      expect(mockConsole.info).toHaveBeenCalledWith("info", ["array"], {
        obj: true,
      });
    });

    it("should handle multiple arguments for warn", () => {
      logger.warn("warning", "details", 123);

      expect(mockConsole.warn).toHaveBeenCalledWith("warning", "details", 123);
    });

    it("should handle multiple arguments for error", () => {
      const error = new Error("test");
      logger.error("error occurred", error, { context: "data" });

      expect(mockConsole.error).toHaveBeenCalledWith("error occurred", error, {
        context: "data",
      });
    });
  });
});

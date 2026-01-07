import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettingsStore } from "../settingsStore";

describe("Settings Store - Settings Management", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Reset store state
    useSettingsStore.setState({
      workflows: [],
      templates: [],
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe("Global settings persistence", () => {
    it("should persist workflow changes to localStorage", async () => {
      const { result } = renderHook(() => useSettingsStore());

      const testWorkflow = {
        id: "test-workflow",
        name: "Test Workflow",
        systemInstruction: "Test instruction",
        sceneCount: 10,
      };

      act(() => {
        result.current.setWorkflows([testWorkflow]);
      });

      expect(result.current.workflows).toHaveLength(1);
      expect(result.current.workflows[0].id).toBe("test-workflow");
    });

    it("should persist template changes to localStorage", async () => {
      const { result } = renderHook(() => useSettingsStore());

      const testTemplate = {
        id: "test-template",
        name: "Test Template",
        description: "Test description",
        stylePrompt: "Test style",
      };

      act(() => {
        result.current.setTemplates([testTemplate]);
      });

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].id).toBe("test-template");
    });

    it("should update workflow by id", () => {
      const { result } = renderHook(() => useSettingsStore());

      const workflow1 = {
        id: "workflow-1",
        name: "Workflow 1",
        systemInstruction: "Instruction 1",
        sceneCount: 5,
      };

      const workflow2 = {
        id: "workflow-2",
        name: "Workflow 2",
        systemInstruction: "Instruction 2",
        sceneCount: 8,
      };

      act(() => {
        result.current.setWorkflows([workflow1, workflow2]);
      });

      act(() => {
        result.current.updateWorkflow("workflow-1", {
          name: "Updated Workflow 1",
          sceneCount: 12,
        });
      });

      expect(result.current.workflows[0].name).toBe("Updated Workflow 1");
      expect(result.current.workflows[0].sceneCount).toBe(12);
      expect(result.current.workflows[1].name).toBe("Workflow 2");
    });

    it("should update template by id", () => {
      const { result } = renderHook(() => useSettingsStore());

      const template1 = {
        id: "template-1",
        name: "Template 1",
        description: "Description 1",
        stylePrompt: "Style 1",
      };

      const template2 = {
        id: "template-2",
        name: "Template 2",
        description: "Description 2",
        stylePrompt: "Style 2",
      };

      act(() => {
        result.current.setTemplates([template1, template2]);
      });

      act(() => {
        result.current.updateTemplate("template-1", {
          name: "Updated Template 1",
          stylePrompt: "Updated Style 1",
        });
      });

      expect(result.current.templates[0].name).toBe("Updated Template 1");
      expect(result.current.templates[0].stylePrompt).toBe("Updated Style 1");
      expect(result.current.templates[1].name).toBe("Template 2");
    });
  });

  describe("Settings priority resolution", () => {
    it("should maintain separate workflow and template state", () => {
      const { result } = renderHook(() => useSettingsStore());

      const workflow = {
        id: "workflow-1",
        name: "Workflow 1",
        systemInstruction: "Instruction",
        sceneCount: 5,
      };

      const template = {
        id: "template-1",
        name: "Template 1",
        description: "Description",
        stylePrompt: "Style",
      };

      act(() => {
        result.current.setWorkflows([workflow]);
        result.current.setTemplates([template]);
      });

      expect(result.current.workflows).toHaveLength(1);
      expect(result.current.templates).toHaveLength(1);
      expect(result.current.workflows[0].id).toBe("workflow-1");
      expect(result.current.templates[0].id).toBe("template-1");
    });

    it("should allow clearing workflows", () => {
      const { result } = renderHook(() => useSettingsStore());

      const workflow = {
        id: "workflow-1",
        name: "Workflow 1",
        systemInstruction: "Instruction",
        sceneCount: 5,
      };

      act(() => {
        result.current.setWorkflows([workflow]);
      });

      expect(result.current.workflows).toHaveLength(1);

      act(() => {
        result.current.setWorkflows([]);
      });

      expect(result.current.workflows).toHaveLength(0);
    });

    it("should allow clearing templates", () => {
      const { result } = renderHook(() => useSettingsStore());

      const template = {
        id: "template-1",
        name: "Template 1",
        description: "Description",
        stylePrompt: "Style",
      };

      act(() => {
        result.current.setTemplates([template]);
      });

      expect(result.current.templates).toHaveLength(1);

      act(() => {
        result.current.setTemplates([]);
      });

      expect(result.current.templates).toHaveLength(0);
    });
  });
});

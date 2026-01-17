import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroupsInlineManager } from "../GroupsInlineManager";
import { TagsInlineManager } from "../TagsInlineManager";

const scenes = [
  { id: "s1", description: "A scene" },
  { id: "s2", description: "Another" },
] as any;

const groups = [
  { id: "g1", name: "Group A", sceneIds: ["s1"] },
  { id: "g2", name: "Group B", sceneIds: [] },
] as any;

const tags = [
  { id: "t1", name: "Tag X", sceneIds: ["s2"] },
  { id: "t2", name: "Tag Y", sceneIds: [] },
] as any;

describe("GroupsInlineManager / TagsInlineManager", () => {
  it("creates a group and toggles a scene assignment", () => {
    const onCreateGroup = vi.fn();
    const onAssignScenes = vi.fn();
    const onRemoveScenes = vi.fn();

    render(
      <GroupsInlineManager
        groups={groups}
        scenes={scenes}
        search=""
        onCreateGroup={onCreateGroup}
        onUpdateGroup={vi.fn()}
        onDeleteGroup={vi.fn()}
        onAssignScenes={onAssignScenes}
        onRemoveScenes={onRemoveScenes}
      />
    );

    fireEvent.change(screen.getByLabelText("New group name"), {
      target: { value: "New Group" },
    });
    fireEvent.click(screen.getByText("Create"));
    expect(onCreateGroup).toHaveBeenCalled();

    // Toggle s1 off (was checked)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onRemoveScenes).toHaveBeenCalled();
  });

  it("creates a tag and toggles a scene assignment", () => {
    const onCreateTag = vi.fn();
    const onAssignTag = vi.fn();
    const onRemoveTag = vi.fn();

    render(
      <TagsInlineManager
        tags={tags}
        scenes={scenes}
        search=""
        onCreateTag={onCreateTag}
        onDeleteTag={vi.fn()}
        onAssignTag={onAssignTag}
        onRemoveTag={onRemoveTag}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("New tag name"), {
      target: { value: "New Tag" },
    });
    fireEvent.click(screen.getByText("Create"));
    expect(onCreateTag).toHaveBeenCalled();

    // Toggle s2 off (was checked)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onAssignTag).toHaveBeenCalled();
  });
});

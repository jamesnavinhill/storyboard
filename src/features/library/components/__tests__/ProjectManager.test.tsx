import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectManager } from "../ProjectManager";

const projects = [
  {
    id: "p1",
    name: "Alpha",
    description: "First",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Beta",
    description: "Second",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("ProjectManager", () => {
  it("renders projects and filters by search", () => {
    render(
      <ProjectManager
        projects={projects}
        activeProjectId={null}
        viewMode="drawer"
        onSelectProject={vi.fn()}
      />
    );
    expect(
      screen.getByPlaceholderText("Search projects...")
    ).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search projects..."), {
      target: { value: "Alp" },
    });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("triggers rename and delete actions", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    window.confirm = vi.fn(() => true);

    render(
      <ProjectManager
        projects={projects}
        activeProjectId={null}
        viewMode="drawer"
        onSelectProject={vi.fn()}
        onRenameProject={onRename}
        onDeleteProject={onDelete}
      />
    );

    // Click first card to reveal actions, then click rename button (labelled via aria-label)
    const alpha = screen.getByText("Alpha");
    fireEvent.click(alpha);
    const renameButtons = screen.getAllByLabelText("Rename");
    fireEvent.click(renameButtons[0]);

    const input = screen.getByDisplayValue("Alpha") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alpha Prime" } });
    // blur to save
    fireEvent.blur(input);
    expect(onRename).toHaveBeenCalled();

    const deleteButtons = screen.getAllByLabelText("Delete");
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalled();
  });
});

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssetManager } from "../AssetManager";

describe("AssetManager", () => {
  it("renders empty state when no project selected", () => {
    render(<AssetManager projectId={null} scenes={[]} />);
    expect(screen.getByText("No project selected")).toBeInTheDocument();
  });
});

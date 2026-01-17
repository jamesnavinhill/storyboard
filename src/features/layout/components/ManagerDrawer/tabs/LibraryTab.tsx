import React from "react";
import { Folder, Image } from "lucide-react";
import type { Scene } from "@/types";
import type { ProjectSummary } from "@/types/services";
import type { LibrarySubTab } from "../hooks/useDrawerTabs";

export interface LibraryTabProps {
  librarySubTab: LibrarySubTab;
  search: string;
  projects: (ProjectSummary & { sceneCount?: number })[];
  activeProjectId: string | null;
  scenes: Scene[];
  onSelectProject: (projectId: string) => void;
  onSelectScene?: (sceneId: string | null) => void;
  onSwitchToDetails: () => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  librarySubTab,
  search,
  projects,
  activeProjectId,
  scenes,
  onSelectProject,
  onSelectScene,
  onSwitchToDetails,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {librarySubTab === "projects" ? (
        <div className="flex flex-col">
          {projects
            .filter((p) =>
              (search || "").trim()
                ? p.name.toLowerCase().includes(search.toLowerCase())
                : true
            )
            .map((p) => (
              <button
                key={p.id}
                className={`flex items-center gap-2 text-left px-2 py-1 rounded-md hover:bg-white/5 border ${
                  p.id === activeProjectId
                    ? "border-soft-primary"
                    : "border-transparent"
                }`}
                onClick={() => {
                  onSelectProject(p.id);
                  onSelectScene?.(null);
                  onSwitchToDetails();
                }}
              >
                <Folder className="h-4 w-4" />
                <span className="truncate text-sm">{p.name}</span>
                {typeof p.sceneCount === "number" && (
                  <span className="ml-auto text-xs text-muted">
                    {p.sceneCount} scenes
                  </span>
                )}
              </button>
            ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {scenes
            .filter((s) =>
              (search || "").trim()
                ? (s.description || "")
                    .toLowerCase()
                    .includes(search.toLowerCase())
                : true
            )
            .map((s, i) => (
              <button
                key={s.id}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 text-left"
                onClick={() => {
                  onSelectScene?.(s.id);
                  onSwitchToDetails();
                }}
              >
                <div className="h-8 w-12 overflow-hidden rounded-sm bg-white/5 flex items-center justify-center">
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={s.description}
                      className="h-full w-full object-cover"
                    />
                  ) : s.videoUrl ? (
                    <video
                      src={s.videoUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <Image className="h-4 w-4 text-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    {s.description?.trim() || `Scene ${i + 1}`}
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

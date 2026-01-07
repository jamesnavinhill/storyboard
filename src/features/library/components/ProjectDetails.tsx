import React, { useMemo } from "react";
import type { Scene } from "../../../types";
import type { ProjectSummary } from "../../../types/services";

export const ProjectDetails: React.FC<{
  project: ProjectSummary;
  scenes: Scene[];
}> = ({ project, scenes }) => {
  const media = useMemo(() => {
    const withMedia = scenes.find((s) => s.imageUrl || s.videoUrl);
    return withMedia ?? null;
  }, [scenes]);

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        {media?.videoUrl ? (
          <video
            src={media.videoUrl}
            className="h-full w-full object-cover"
            muted
            loop
            controls
          />
        ) : media?.imageUrl ? (
          <img
            src={media.imageUrl}
            alt={project.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-muted">
            No preview
          </div>
        )}
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-muted">
          Title
        </label>
        <input
          value={project.name}
          readOnly
          className="input-base mt-1 w-full p-2 text-sm rounded-md bg-white/5"
          aria-label="Project title"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-muted">
          Description
        </label>
        <textarea
          value={(project.description ?? "").trim()}
          readOnly
          className="input-base mt-1 w-full min-h-[90px] p-2 text-sm rounded-md bg-white/5"
          placeholder="No description"
          aria-label="Project description"
        />
      </div>
    </div>
  );
};

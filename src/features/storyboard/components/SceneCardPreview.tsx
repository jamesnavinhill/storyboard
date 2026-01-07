import React from "react";
import type { Scene } from "@/types";
import { Image } from "lucide-react";

interface SceneCardPreviewProps {
  scene: Scene;
}

const SceneCardPreviewComponent: React.FC<SceneCardPreviewProps> = ({
  scene,
}) => {
  return (
    <div
      className={`scene-card relative ${
        scene.aspectRatio === "9:16" ? "aspect-portrait" : "aspect-video"
      } w-full max-w-[640px] rounded-lg overflow-hidden shadow-2xl`}
      style={{
        width: "400px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
      }}
    >
      {scene.videoUrl ? (
        <video
          src={scene.videoUrl}
          className="w-full h-full object-contain pointer-events-none"
          muted
        />
      ) : scene.imageUrl ? (
        <img
          src={scene.imageUrl}
          alt={scene.description}
          className="w-full h-full object-contain"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: "var(--card-bg)" }}
        >
          <Image
            className="w-12 h-12"
            style={{ color: "var(--muted-foreground)" }}
          />
        </div>
      )}

      {/* Scene number badge */}
      <div
        className="absolute top-2 left-2 text-xs px-2 py-1 rounded"
        style={{
          backgroundColor: "var(--popover)",
          color: "var(--text-primary)",
        }}
      >
        Scene {scene.id.substring(0, 4)}
      </div>
    </div>
  );
};

export const SceneCardPreview = React.memo(SceneCardPreviewComponent);
SceneCardPreview.displayName = "SceneCardPreview";

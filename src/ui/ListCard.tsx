import React from "react";

export interface ListCardProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const ListCard: React.FC<ListCardProps> = ({
  active,
  onClick,
  className,
  children,
}) => {
  const classes =
    `group flex flex-col gap-2 rounded-lg p-4 transition-colors border ${
      active
        ? "border-soft-primary bg-primary-soft"
        : "border-muted hover:bg-white/5"
    } ${className ?? ""}`.trim();

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${classes} text-left`}
      >
        {children}
      </button>
    );
  }
  return <div className={classes}>{children}</div>;
};

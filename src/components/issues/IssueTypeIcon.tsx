import React from "react";
import { IssueType } from "@/lib/types";
import { Bookmark, CheckSquare, Bug, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueTypeIconProps {
  type?: IssueType | string | null;
  className?: string;
  showLabel?: boolean;
  size?: number;
}

export function getIssueTypeConfig(type?: IssueType | string | null) {
  switch (type) {
    case IssueType.STORY:
    case "STORY":
      return {
        label: "Story",
        icon: Bookmark,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconClass: "text-emerald-600",
        dotClass: "bg-emerald-500",
      };
    case IssueType.BUG:
    case "BUG":
      return {
        label: "Bug",
        icon: Bug,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        iconClass: "text-rose-600",
        dotClass: "bg-rose-500",
      };
    case IssueType.EPIC:
    case "EPIC":
      return {
        label: "Epic",
        icon: Zap,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        iconClass: "text-purple-600",
        dotClass: "bg-purple-500",
      };
    case IssueType.TASK:
    case "TASK":
    default:
      return {
        label: "Task",
        icon: CheckSquare,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        iconClass: "text-blue-600",
        dotClass: "bg-blue-500",
      };
  }
}

export function IssueTypeIcon({
  type = IssueType.TASK,
  className,
  showLabel = false,
  size,
}: IssueTypeIconProps) {
  const config = getIssueTypeConfig(type);
  const Icon = config.icon;
  const iconPixelSize = size ? Math.max(10, size - 2) : 12;

  if (showLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border shadow-2xs",
          config.badgeClass,
          className
        )}
      >
        <Icon style={{ width: iconPixelSize, height: iconPixelSize }} className={cn("shrink-0", config.iconClass)} />
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <span
      title={config.label}
      style={size ? { width: size + 4, height: size + 4 } : undefined}
      className={cn(
        "inline-flex items-center justify-center h-4.5 w-4.5 rounded border shadow-2xs shrink-0",
        config.badgeClass,
        className
      )}
    >
      <Icon style={{ width: iconPixelSize, height: iconPixelSize }} className={cn("shrink-0", config.iconClass)} />
    </span>
  );
}

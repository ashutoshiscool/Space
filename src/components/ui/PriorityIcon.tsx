import React from "react";
import { IssuePriority } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityIconProps {
  priority: IssuePriority;
  className?: string;
  size?: number;
}

export function PriorityIcon({
  priority,
  className,
  size = 14,
}: PriorityIconProps) {
  switch (priority) {
    case IssuePriority.URGENT:
      return (
        <span
          title="Urgent"
          className={cn("inline-flex items-center justify-center text-[#ef4444] shrink-0", className)}
          style={{ width: size, height: size }}
        >
          <AlertCircle style={{ width: size, height: size }} strokeWidth={2.2} />
        </span>
      );

    case IssuePriority.HIGH:
      return (
        <span
          title="High"
          className={cn("inline-flex items-center justify-center text-[#f97316] shrink-0", className)}
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="11" width="3" height="4" rx="0.5" />
            <rect x="6.5" y="7" width="3" height="8" rx="0.5" />
            <rect x="11" y="3" width="3" height="12" rx="0.5" />
          </svg>
        </span>
      );

    case IssuePriority.MEDIUM:
      return (
        <span
          title="Medium"
          className={cn("inline-flex items-center justify-center text-[#eab308] shrink-0", className)}
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="11" width="3" height="4" rx="0.5" />
            <rect x="6.5" y="7" width="3" height="8" rx="0.5" />
            <rect x="11" y="3" width="3" height="12" rx="0.5" opacity="0.25" />
          </svg>
        </span>
      );

    case IssuePriority.LOW:
      return (
        <span
          title="Low"
          className={cn("inline-flex items-center justify-center text-[#3b82f6] shrink-0", className)}
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="11" width="3" height="4" rx="0.5" />
            <rect x="6.5" y="7" width="3" height="8" rx="0.5" opacity="0.25" />
            <rect x="11" y="3" width="3" height="12" rx="0.5" opacity="0.25" />
          </svg>
        </span>
      );

    case IssuePriority.NONE:
    default:
      return (
        <span
          title="No priority"
          className={cn("inline-flex items-center justify-center text-[#9ca3af] shrink-0", className)}
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="12" cy="8" r="1.5" />
          </svg>
        </span>
      );
  }
}

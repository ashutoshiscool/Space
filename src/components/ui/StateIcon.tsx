import React from "react";
import { StateGroup } from "@prisma/client";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateIconProps {
  group?: StateGroup;
  color?: string;
  className?: string;
  size?: number;
}

export function StateIcon({
  group = StateGroup.UNSTARTED,
  color,
  className,
  size = 14,
}: StateIconProps) {
  switch (group) {
    case StateGroup.BACKLOG:
      return (
        <span className={cn("inline-flex items-center justify-center shrink-0", className)} style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke={color || "#a1a1aa"}
            strokeWidth="1.8"
            strokeDasharray="2.5 2"
          >
            <circle cx="8" cy="8" r="6" />
          </svg>
        </span>
      );

    case StateGroup.UNSTARTED:
      return (
        <span className={cn("inline-flex items-center justify-center shrink-0", className)} style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke={color || "#94a3b8"}
            strokeWidth="1.8"
          >
            <circle cx="8" cy="8" r="6" />
          </svg>
        </span>
      );

    case StateGroup.STARTED:
      return (
        <span className={cn("inline-flex items-center justify-center shrink-0", className)} style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="8" cy="8" r="6" stroke={color || "#eab308"} strokeWidth="1.8" />
            <path
              d="M8 2 A6 6 0 0 1 8 14 Z"
              fill={color || "#eab308"}
            />
          </svg>
        </span>
      );

    case StateGroup.COMPLETED:
      return (
        <span className={cn("inline-flex items-center justify-center shrink-0 text-[#22c55e]", className)} style={{ width: size, height: size }}>
          <CheckCircle2 style={{ width: size, height: size }} />
        </span>
      );

    case StateGroup.CANCELED:
      return (
        <span className={cn("inline-flex items-center justify-center shrink-0 text-[#ef4444]", className)} style={{ width: size, height: size }}>
          <XCircle style={{ width: size, height: size }} />
        </span>
      );

    default:
      return null;
  }
}

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const iconSize = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base";

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-[#3e63dd] text-white shrink-0 shadow-xs",
          iconSize
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          {/* Geometric wing icon */}
          <path d="M3 11l19-9-9 19-2-8-8-2z" fill="currentColor" fillOpacity="0.25" />
          <path d="M11 13l10-11" />
        </svg>
      </div>

      {showText && (
        <span className={cn("font-bold tracking-tight text-[#111827] font-sans", textSize)}>
          Space
        </span>
      )}
    </div>
  );
}

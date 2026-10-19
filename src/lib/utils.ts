import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IssuePriority, StateGroup } from "@prisma/client";
import { ZodError } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatZodError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message || "Validation error";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Validation error";
}

export function getPriorityMeta(priority: IssuePriority) {
  switch (priority) {
    case IssuePriority.URGENT:
      return {
        label: "Urgent",
        short: "P1",
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        dot: "bg-red-500",
      };
    case IssuePriority.HIGH:
      return {
        label: "High",
        short: "P2",
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        dot: "bg-orange-500",
      };
    case IssuePriority.MEDIUM:
      return {
        label: "Medium",
        short: "P3",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        dot: "bg-amber-500",
      };
    case IssuePriority.LOW:
      return {
        label: "Low",
        short: "P4",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        dot: "bg-blue-500",
      };
    case IssuePriority.NONE:
    default:
      return {
        label: "None",
        short: "--",
        color: "text-zinc-400",
        bg: "bg-zinc-500/10",
        border: "border-zinc-500/20",
        dot: "bg-zinc-500",
      };
  }
}

export function getStateGroupMeta(group: StateGroup) {
  switch (group) {
    case StateGroup.BACKLOG:
      return { label: "Backlog", color: "text-[#6b7280]", bg: "bg-[#f3f4f6]" };
    case StateGroup.UNSTARTED:
      return { label: "Unstarted", color: "text-sky-600", bg: "bg-sky-50" };
    case StateGroup.STARTED:
      return { label: "Started", color: "text-amber-600", bg: "bg-amber-50" };
    case StateGroup.COMPLETED:
      return { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50" };
    case StateGroup.CANCELED:
      return { label: "Canceled", color: "text-rose-600", bg: "bg-rose-50" };
    default:
      return { label: "Unknown", color: "text-[#6b7280]", bg: "bg-[#f3f4f6]" };
  }
}

export function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) {
    const futureDiffMs = Math.abs(diffMs);
    const diffMins = Math.floor(futureDiffMs / 60000);
    if (diffMins < 60) return `in ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays}d`;
  }
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}


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
      return { label: "Backlog", color: "text-zinc-400", bg: "bg-zinc-800" };
    case StateGroup.UNSTARTED:
      return { label: "Unstarted", color: "text-sky-400", bg: "bg-sky-950/40" };
    case StateGroup.STARTED:
      return { label: "Started", color: "text-amber-400", bg: "bg-amber-950/40" };
    case StateGroup.COMPLETED:
      return { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-950/40" };
    case StateGroup.CANCELED:
      return { label: "Canceled", color: "text-rose-400", bg: "bg-rose-950/40" };
    default:
      return { label: "Unknown", color: "text-zinc-400", bg: "bg-zinc-800" };
  }
}

export function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

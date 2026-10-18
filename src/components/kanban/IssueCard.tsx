"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IssueWithDetails } from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { getPriorityMeta, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, GitBranch, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: IssueWithDetails;
  projectIdentifier: string;
  isOverlay?: boolean;
}

export function IssueCard({ issue, projectIdentifier, isOverlay }: IssueCardProps) {
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: {
      type: "Issue",
      issue,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityMeta = getPriorityMeta(issue.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setActiveIssueId(issue.id)}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border border-zinc-800/80 bg-[#121215] p-3 text-left shadow-sm transition-all hover:border-zinc-700 hover:shadow-md cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 border-indigo-500/50 shadow-indigo-500/10",
        isOverlay && "rotate-2 shadow-2xl border-indigo-500 bg-[#18181d] scale-105 cursor-grabbing z-50"
      )}
    >
      {/* Top row: Issue Key, Priority, and Estimate */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-medium text-zinc-400 group-hover:text-indigo-400 transition-colors">
            {projectIdentifier}-{issue.sequenceId}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
              priorityMeta.bg,
              priorityMeta.color,
              priorityMeta.border,
              "border"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", priorityMeta.dot)} />
            {priorityMeta.label}
          </span>
        </div>

        {issue.estimate !== null && issue.estimate !== undefined && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800/80 text-[10px] font-mono font-semibold text-zinc-300">
            {issue.estimate}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium leading-snug text-zinc-100 line-clamp-2">
        {issue.title}
      </h4>

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.labels.map(({ label }) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${label.color}15`,
                color: label.color,
                border: `1px solid ${label.color}30`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Due date, Sub-issues, Comments count & Assignees */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          {issue.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                new Date(issue.dueDate) < new Date() && "text-rose-400 font-medium"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(issue.dueDate)}
            </span>
          )}

          {issue._count && issue._count.subIssues > 0 && (
            <span className="flex items-center gap-1 hover:text-zinc-300">
              <GitBranch className="h-3 w-3" />
              {issue._count.subIssues}
            </span>
          )}

          {issue._count && issue._count.comments > 0 && (
            <span className="flex items-center gap-1 hover:text-zinc-300">
              <MessageSquare className="h-3 w-3" />
              {issue._count.comments}
            </span>
          )}
        </div>

        {/* Assignee Avatars */}
        {issue.assignees && issue.assignees.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden">
            {issue.assignees.map(({ user }) => (
              <Avatar key={user.id} className="h-5 w-5 border border-[#121215]">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="text-[9px]">
                  {user.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

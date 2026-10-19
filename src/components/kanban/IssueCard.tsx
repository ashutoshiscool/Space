"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IssueWithDetails, User } from "@/lib/types";
import { State } from "@prisma/client";
import { useSpaceStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { IssueTypeIcon } from "@/components/issues/IssueTypeIcon";
import { QuickAssignPopover } from "@/components/issues/QuickAssignPopover";
import { QuickStatePopover } from "@/components/issues/QuickStatePopover";
import { MessageSquare, GitBranch, Calendar, Clock, Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: IssueWithDetails;
  projectIdentifier: string;
  isOverlay?: boolean;
  projectMembers?: { user: Pick<User, "id" | "name" | "email" | "avatarUrl"> }[];
  states?: State[];
}

export function IssueCard({
  issue,
  projectIdentifier,
  isOverlay,
  projectMembers,
  states,
}: IssueCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setActiveIssueId(issue.id)}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border border-[#e5e7eb] bg-white p-3 text-left shadow-xs transition-all hover:border-[#cbd5e1] hover:shadow-sm cursor-grab active:cursor-grabbing select-none font-sans",
        isDragging && "opacity-30 border-[#3e63dd]/40",
        isOverlay && "rotate-1 shadow-2xl border-[#3e63dd] bg-white scale-[1.02] cursor-grabbing z-50"
      )}
    >
      {/* Top row: Issue Key, Priority glyph, Type glyph, Estimate */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {states && states.length > 0 ? (
            <QuickStatePopover issueId={issue.id} currentState={issue.state} states={states} size={13} />
          ) : null}
          <IssueTypeIcon type={issue.type} size={13} />
          <PriorityIcon priority={issue.priority} size={13} />
          <span className="font-mono text-[11px] font-medium text-[#6b7280] group-hover:text-[#111827] transition-colors">
            {projectIdentifier}-{issue.sequenceId}
          </span>
        </div>

        {issue.estimate !== null && issue.estimate !== undefined && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded bg-[#f3f4f6] px-1 font-mono text-[10px] font-medium text-[#4b5563] border border-[#e5e7eb]">
            {issue.estimate} pts
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-xs font-medium leading-relaxed text-[#111827] line-clamp-2">
        {issue.title}
      </h4>

      {/* Labels & Components */}
      {((issue.labels && issue.labels.length > 0) || issue.component) && (
        <div className="flex flex-wrap items-center gap-1">
          {issue.component && (
            <span className="inline-flex items-center gap-1 rounded bg-[#eff6ff] px-1.5 py-0.2 text-[9px] font-semibold text-[#3e63dd] border border-[#dbeafe] truncate max-w-[120px]">
              <Box className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{issue.component.name}</span>
            </span>
          )}
          {issue.labels?.map(({ label }) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.2 text-[10px] font-medium leading-normal"
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

      {/* Footer: Due date, Sub-issues, Comments count, Time Tracking & Assignees */}
      <div className="flex items-center justify-between pt-1 border-t border-[#f1f3f5] text-[11px] text-[#6b7280]">
        <div className="flex items-center gap-2">
          {issue.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 font-mono text-[10px]",
                new Date(issue.dueDate) < new Date() && issue.state?.group !== "COMPLETED"
                  ? "text-rose-600 font-semibold"
                  : "text-[#6b7280]"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(issue.dueDate)}
            </span>
          )}

          {issue.subIssues && issue.subIssues.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#6b7280]" title={`${issue.subIssues.length} sub-issues`}>
              <GitBranch className="h-3 w-3" />
              <span>{issue.subIssues.length}</span>
            </span>
          )}

          {issue.comments && issue.comments.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#6b7280]" title={`${issue.comments.length} comments`}>
              <MessageSquare className="h-3 w-3" />
              <span>{issue.comments.length}</span>
            </span>
          )}

          {Boolean(issue.timeSpent && issue.timeSpent > 0) && (
            <span
              className="flex items-center gap-1 font-mono text-[10px] text-[#374151] bg-[#f3f4f6] px-1.5 py-0.2 rounded border border-[#e5e7eb]"
              title={`Time spent: ${issue.timeSpent}m / estimate: ${issue.timeEstimate || 0}m`}
            >
              <Clock className="h-2.5 w-2.5 text-[#3e63dd]" />
              <span>
                {Math.floor(issue.timeSpent! / 60) > 0 ? `${Math.floor(issue.timeSpent! / 60)}h ` : ""}
                {issue.timeSpent! % 60 > 0 ? `${issue.timeSpent! % 60}m` : ""}
              </span>
            </span>
          )}
        </div>

        {/* Interactive Assignee Small Circle */}
        <QuickAssignPopover
          issueId={issue.id}
          assignees={issue.assignees}
          projectMembers={projectMembers}
          size="sm"
        />
      </div>
    </div>
  );
}

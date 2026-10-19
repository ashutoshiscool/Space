"use client";

import React, { useState } from "react";
import { State, IssuePriority, User, IssueWithDetails } from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { formatDate, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MessageSquare, GitBranch, Archive, Check } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface IssueListViewProps {
  issues: IssueWithDetails[];
  states: State[];
  members: { user: Pick<User, "id" | "name" | "email" | "avatarUrl"> }[];
  projectIdentifier: string;
}

export function IssueListView({
  issues,
  states,
  members,
  projectIdentifier,
}: IssueListViewProps) {
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const toggleSelectAll = () => {
    if (selectedIds.length === issues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(issues.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Mutation for updating a single issue property inline
  const updateIssueMutation = useMutation({
    mutationFn: async ({
      issueId,
      data,
    }: {
      issueId: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update issue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  // Batch update mutation
  const batchUpdateMutation = useMutation({
    mutationFn: async ({ data }: { data: Record<string, unknown> }) => {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/issues/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        )
      );
    },
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  return (
    <div className="relative flex flex-col w-full rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="grid grid-cols-[36px_100px_1fr_120px_130px_130px_90px_60px] items-center border-b border-[#e5e7eb] bg-[#f8f9fa] px-3 py-2 text-[11px] font-semibold text-[#6b7280] select-none uppercase tracking-wider">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={issues.length > 0 && selectedIds.length === issues.length}
            onChange={toggleSelectAll}
            className="h-3.5 w-3.5 rounded border-[#d1d5db] bg-white text-[#3e63dd] focus:ring-0 cursor-pointer"
          />
        </div>
        <div>Identifier</div>
        <div>Title</div>
        <div>Priority</div>
        <div>State</div>
        <div>Assignee</div>
        <div>Due Date</div>
        <div className="text-right">Pts</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#f1f3f5] overflow-y-auto max-h-[calc(100vh-280px)]">
        {issues.map((issue) => {
          const isSelected = selectedIds.includes(issue.id);

          return (
            <div
              key={issue.id}
              onClick={() => setActiveIssueId(issue.id)}
              className={cn(
                "grid grid-cols-[36px_100px_1fr_120px_130px_130px_90px_60px] items-center px-3 py-2.5 text-xs transition-colors hover:bg-[#f8f9fa] cursor-pointer group text-[#111827]",
                isSelected && "bg-[#eff6ff]"
              )}
            >
              {/* Checkbox */}
              <div
                className="flex items-center justify-center"
                onClick={(e) => toggleSelectOne(issue.id, e)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="h-3.5 w-3.5 rounded border-[#d1d5db] bg-white text-[#3e63dd] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Identifier */}
              <div className="font-mono text-[#6b7280] group-hover:text-[#111827] font-medium text-xs">
                {projectIdentifier}-{issue.sequenceId}
              </div>

              {/* Title & comments/sub-issues badges */}
              <div className="flex items-center gap-2 pr-4 overflow-hidden">
                <span className="truncate font-medium text-[#111827]">
                  {issue.title}
                </span>

                {issue.labels && issue.labels.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    {issue.labels.map(({ label }) => (
                      <span
                        key={label.id}
                        className="rounded px-1.5 py-0.2 text-[9px] font-medium"
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

                {issue._count && issue._count.subIssues > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-[#9ca3af] shrink-0">
                    <GitBranch className="h-3 w-3" />
                    {issue._count.subIssues}
                  </span>
                )}

                {issue._count && issue._count.comments > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-[#9ca3af] shrink-0">
                    <MessageSquare className="h-3 w-3" />
                    {issue._count.comments}
                  </span>
                )}
              </div>

              {/* Inline Priority Dropdown */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-[#f3f4f6] transition-colors cursor-pointer outline-none">
                    <PriorityIcon priority={issue.priority} size={14} />
                    <span className="text-[#374151] capitalize text-xs">
                      {issue.priority.toLowerCase()}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {(Object.values(IssuePriority) as IssuePriority[]).map((prio) => (
                      <DropdownMenuItem
                        key={prio}
                        onClick={() =>
                          updateIssueMutation.mutate({
                            issueId: issue.id,
                            data: { priority: prio },
                          })
                        }
                        className="flex items-center gap-2"
                      >
                        <PriorityIcon priority={prio} size={14} />
                        <span className="capitalize">{prio.toLowerCase()}</span>
                        {issue.priority === prio && (
                          <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Inline State Dropdown */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-[#f3f4f6] transition-colors cursor-pointer outline-none">
                    <StateIcon group={issue.state.group} color={issue.state.color} size={13} />
                    <span className="truncate text-[#374151] text-xs font-medium">{issue.state.name}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {states.map((st) => (
                      <DropdownMenuItem
                        key={st.id}
                        onClick={() =>
                          updateIssueMutation.mutate({
                            issueId: issue.id,
                            data: { stateId: st.id },
                          })
                        }
                        className="flex items-center gap-2"
                      >
                        <StateIcon group={st.group} color={st.color} size={13} />
                        <span>{st.name}</span>
                        {issue.stateId === st.id && (
                          <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Inline Assignee */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-[#f3f4f6] transition-colors cursor-pointer outline-none">
                    {issue.assignees && issue.assignees.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-4 w-4">
                          {issue.assignees[0].user.avatarUrl && (
                            <AvatarImage
                              src={issue.assignees[0].user.avatarUrl}
                              alt={issue.assignees[0].user.name}
                            />
                          )}
                          <AvatarFallback className="text-[9px] bg-[#f3f4f6] text-[#374151]">
                            {issue.assignees[0].user.name.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-[#374151]">
                          {issue.assignees[0].user.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#9ca3af]">Unassigned</span>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() =>
                        updateIssueMutation.mutate({
                          issueId: issue.id,
                          data: { assigneeIds: [] },
                        })
                      }
                    >
                      Unassigned
                    </DropdownMenuItem>
                    {members.map(({ user }) => {
                      const isAssigned = issue.assignees.some(
                        (a) => a.user.id === user.id
                      );
                      return (
                        <DropdownMenuItem
                          key={user.id}
                          onClick={() =>
                            updateIssueMutation.mutate({
                              issueId: issue.id,
                              data: {
                                assigneeIds: isAssigned
                                  ? issue.assignees
                                      .filter((a) => a.user.id !== user.id)
                                      .map((a) => a.user.id)
                                  : [...issue.assignees.map((a) => a.user.id), user.id],
                              },
                            })
                          }
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-4 w-4">
                            {user.avatarUrl && (
                              <AvatarImage src={user.avatarUrl} alt={user.name} />
                            )}
                            <AvatarFallback className="text-[9px] bg-[#f3f4f6] text-[#374151]">
                              {user.name.substring(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                          {isAssigned && (
                            <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Due Date */}
              <div className="truncate" onClick={(e) => e.stopPropagation()}>
                <DatePicker
                  size="sm"
                  value={issue.dueDate}
                  onChange={(d) =>
                    updateIssueMutation.mutate({
                      issueId: issue.id,
                      data: { dueDate: d },
                    })
                  }
                />
              </div>

              {/* Estimate Points */}
              <div className="text-right font-mono text-[#6b7280] text-xs">
                {issue.estimate ?? "-"}
              </div>
            </div>
          );
        })}

        {issues.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-[#6b7280] text-xs">
            <span>No issues found matching your filters</span>
          </div>
        )}
      </div>

      {/* Floating Multi-Select Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 shadow-2xl z-40 animate-in fade-in-0 slide-in-from-bottom-2 text-[#111827]">
          <span className="text-xs font-semibold text-[#111827]">
            {selectedIds.length} {selectedIds.length === 1 ? "issue" : "issues"} selected
          </span>

          <div className="h-4 w-px bg-[#e5e7eb]" />

          {/* Batch State change */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="h-7 text-xs bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb]">
                Change State
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {states.map((st) => (
                <DropdownMenuItem
                  key={st.id}
                  onClick={() =>
                    batchUpdateMutation.mutate({ data: { stateId: st.id } })
                  }
                  className="flex items-center gap-2"
                >
                  <StateIcon group={st.group} color={st.color} size={13} />
                  <span>{st.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Batch Priority change */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="h-7 text-xs bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb]">
                Change Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(Object.values(IssuePriority) as IssuePriority[]).map((prio) => (
                <DropdownMenuItem
                  key={prio}
                  onClick={() =>
                    batchUpdateMutation.mutate({ data: { priority: prio } })
                  }
                  className="flex items-center gap-2"
                >
                  <PriorityIcon priority={prio} size={14} />
                  <span className="capitalize">{prio.toLowerCase()}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Deselect All */}
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-[#6b7280] hover:text-[#111827] underline cursor-pointer ml-1"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}

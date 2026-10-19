"use client";

import React, { useState } from "react";
import {
  IssueWithDetails,
  ProjectWithDetails,
  State,
  IssuePriority,
  User,
} from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { formatDate, cn } from "@/lib/utils";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, Check } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SpreadsheetViewProps {
  issues: IssueWithDetails[];
  states: State[];
  project: ProjectWithDetails;
}

export function SpreadsheetView({
  issues,
  states,
  project,
}: SpreadsheetViewProps) {
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const queryClient = useQueryClient();

  const [newRowTitle, setNewRowTitle] = useState("");
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Mutation to update an issue property directly inline
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

  // Mutation to create a new row
  const createIssueMutation = useMutation({
    mutationFn: async (title: string) => {
      const defaultState = states[0];
      const res = await fetch(`/api/projects/${project.id}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          stateId: defaultState.id,
          priority: IssuePriority.NONE,
        }),
      });
      if (!res.ok) throw new Error("Failed to create issue");
      return res.json();
    },
    onSuccess: () => {
      setNewRowTitle("");
      setIsAddingRow(false);
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-xs text-[#111827]">
      {/* Spreadsheet Header Row */}
      <div className="grid grid-cols-[40px_100px_1fr_130px_130px_140px_100px_90px_60px] items-center border-b border-[#e5e7eb] bg-[#f8f9fa] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] select-none">
        <div className="text-center font-mono text-[#9ca3af]">#</div>
        <div>Identifier</div>
        <div>Title</div>
        <div>State</div>
        <div>Priority</div>
        <div>Assignee</div>
        <div>Cycle</div>
        <div>Due Date</div>
        <div className="text-right">Pts</div>
      </div>

      {/* Spreadsheet Rows */}
      <div className="flex-1 divide-y divide-[#f1f3f5] overflow-y-auto">
        {issues.map((issue, idx) => (
          <div
            key={issue.id}
            className="grid grid-cols-[40px_100px_1fr_130px_130px_140px_100px_90px_60px] items-center px-3 py-1.5 text-xs transition-colors hover:bg-[#f8f9fa] group text-[#111827]"
          >
            {/* Row Number */}
            <div className="text-center font-mono text-[11px] text-[#9ca3af]">
              {idx + 1}
            </div>

            {/* Key */}
            <div
              onClick={() => setActiveIssueId(issue.id)}
              className="font-mono text-xs font-medium text-[#6b7280] hover:text-[#111827] cursor-pointer"
            >
              {project.identifier}-{issue.sequenceId}
            </div>

            {/* Title (Click opens detail, or inline click) */}
            <div className="pr-3 truncate">
              <input
                type="text"
                defaultValue={issue.title}
                onBlur={(e) => {
                  if (e.target.value !== issue.title && e.target.value.trim()) {
                    updateIssueMutation.mutate({
                      issueId: issue.id,
                      data: { title: e.target.value.trim() },
                    });
                  }
                }}
                className="w-full bg-transparent text-xs text-[#111827] focus:bg-[#f8f9fa] focus:outline-none rounded px-1.5 py-0.5 border border-transparent focus:border-[#e5e7eb] transition-colors truncate"
              />
            </div>

            {/* State Dropdown */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#374151] hover:bg-[#f3f4f6] transition-colors cursor-pointer outline-none w-full truncate">
                  <StateIcon group={issue.state.group} color={issue.state.color} size={12} />
                  <span className="truncate font-medium">{issue.state.name}</span>
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

            {/* Priority Dropdown */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#374151] hover:bg-[#f3f4f6] transition-colors cursor-pointer outline-none w-full">
                  <PriorityIcon priority={issue.priority} size={13} />
                  <span className="capitalize">{issue.priority.toLowerCase()}</span>
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
                      <PriorityIcon priority={prio} size={13} />
                      <span className="capitalize">{prio.toLowerCase()}</span>
                      {issue.priority === prio && (
                        <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Assignee Dropdown */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#374151] hover:bg-[#f3f4f6] transition-colors cursor-pointer outline-none w-full truncate">
                  {issue.assignees && issue.assignees.length > 0 ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <Avatar className="h-4 w-4">
                        {issue.assignees[0].user.avatarUrl && (
                          <AvatarImage src={issue.assignees[0].user.avatarUrl} />
                        )}
                        <AvatarFallback className="text-[9px] bg-[#f3f4f6] text-[#374151]">
                          {issue.assignees[0].user.name.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{issue.assignees[0].user.name}</span>
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
                  {project.members.map(({ user }) => {
                    const isAssigned = issue.assignees.some((a) => a.user.id === user.id);
                    return (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() =>
                          updateIssueMutation.mutate({
                            issueId: issue.id,
                            data: {
                              assigneeIds: isAssigned
                                ? issue.assignees.filter((a) => a.user.id !== user.id).map((a) => a.user.id)
                                : [...issue.assignees.map((a) => a.user.id), user.id],
                            },
                          })
                        }
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-4 w-4">
                          {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                          <AvatarFallback className="text-[9px] bg-[#f3f4f6] text-[#374151]">
                            {user.name.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                        {isAssigned && <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Cycle Dropdown */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-[#6b7280] hover:bg-[#f3f4f6] transition-colors cursor-pointer outline-none w-full truncate">
                  <span className="truncate">{issue.cycle?.name || "-"}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() =>
                      updateIssueMutation.mutate({
                        issueId: issue.id,
                        data: { cycleId: null },
                      })
                    }
                  >
                    No Cycle
                  </DropdownMenuItem>
                  {project.cycles.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() =>
                        updateIssueMutation.mutate({
                          issueId: issue.id,
                          data: { cycleId: c.id },
                        })
                      }
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
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
            <div className="text-right font-mono text-xs text-[#6b7280]">
              {issue.estimate ?? "-"}
            </div>
          </div>
        ))}

        {/* Quick Add Row */}
        {isAddingRow ? (
          <div className="flex items-center px-4 py-2 bg-[#f8f9fa] gap-2 border-t border-[#e5e7eb]">
            <input
              autoFocus
              type="text"
              placeholder="Type issue title and hit Enter..."
              value={newRowTitle}
              onChange={(e) => setNewRowTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newRowTitle.trim()) {
                  createIssueMutation.mutate(newRowTitle.trim());
                } else if (e.key === "Escape") {
                  setIsAddingRow(false);
                }
              }}
              className="flex-1 bg-transparent text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
            />
            <button
              onClick={() => {
                if (newRowTitle.trim()) createIssueMutation.mutate(newRowTitle.trim());
              }}
              className="px-2.5 py-1 text-xs font-medium text-white bg-[#3e63dd] hover:bg-[#3451b2] rounded cursor-pointer shadow-xs"
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingRow(false)}
              className="px-2 py-1 text-xs text-[#6b7280] hover:text-[#111827] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingRow(true)}
            className="flex items-center gap-2 w-full px-4 py-2 text-xs text-[#6b7280] hover:text-[#111827] hover:bg-[#f8f9fa] transition-colors cursor-pointer select-none"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add new row</span>
          </button>
        )}
      </div>
    </div>
  );
}

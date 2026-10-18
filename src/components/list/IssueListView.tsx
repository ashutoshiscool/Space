"use client";

import React, { useState } from "react";
import { State, IssuePriority, User } from "@prisma/client";
import { IssueWithDetails } from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { getPriorityMeta, formatDate, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MessageSquare, GitBranch, Archive, Check } from "lucide-react";
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
      data: Record<string, any>;
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
    mutationFn: async ({ data }: { data: Record<string, any> }) => {
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
    <div className="relative flex flex-col w-full rounded-xl border border-zinc-800/80 bg-[#101014] overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="grid grid-cols-[36px_110px_1fr_130px_140px_140px_100px_60px] items-center border-b border-zinc-800 bg-[#141418] px-3 py-2 text-xs font-semibold text-zinc-400 select-none">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={issues.length > 0 && selectedIds.length === issues.length}
            onChange={toggleSelectAll}
            className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer"
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
      <div className="divide-y divide-zinc-800/60 overflow-y-auto max-h-[calc(100vh-280px)]">
        {issues.map((issue) => {
          const isSelected = selectedIds.includes(issue.id);
          const priorityMeta = getPriorityMeta(issue.priority);

          return (
            <div
              key={issue.id}
              onClick={() => setActiveIssueId(issue.id)}
              className={cn(
                "grid grid-cols-[36px_110px_1fr_130px_140px_140px_100px_60px] items-center px-3 py-2.5 text-xs transition-colors hover:bg-zinc-800/40 cursor-pointer group",
                isSelected && "bg-indigo-950/20"
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
                  className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Identifier */}
              <div className="font-mono text-zinc-400 group-hover:text-indigo-400 font-medium">
                {projectIdentifier}-{issue.sequenceId}
              </div>

              {/* Title & comments/sub-issues badges */}
              <div className="flex items-center gap-2 pr-4 overflow-hidden">
                <span className="truncate font-medium text-zinc-100">
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
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500 shrink-0">
                    <GitBranch className="h-3 w-3" />
                    {issue._count.subIssues}
                  </span>
                )}

                {issue._count && issue._count.comments > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500 shrink-0">
                    <MessageSquare className="h-3 w-3" />
                    {issue._count.comments}
                  </span>
                )}
              </div>

              {/* Inline Priority Dropdown */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-zinc-800 transition-colors cursor-pointer outline-none">
                    <span className={cn("h-2 w-2 rounded-full", priorityMeta.dot)} />
                    <span className={priorityMeta.color}>{priorityMeta.label}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {Object.values(IssuePriority).map((prio) => {
                      const meta = getPriorityMeta(prio);
                      return (
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
                          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                          <span>{meta.label}</span>
                          {issue.priority === prio && (
                            <Check className="ml-auto h-3 w-3 text-indigo-400" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Inline State Dropdown */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-zinc-800 transition-colors cursor-pointer outline-none">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: issue.state.color }}
                    />
                    <span className="truncate text-zinc-200">{issue.state.name}</span>
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
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: st.color }}
                        />
                        <span>{st.name}</span>
                        {issue.stateId === st.id && (
                          <Check className="ml-auto h-3 w-3 text-indigo-400" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Inline Assignee */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-zinc-800 transition-colors cursor-pointer outline-none">
                    {issue.assignees && issue.assignees.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-4 w-4">
                          {issue.assignees[0].user.avatarUrl && (
                            <AvatarImage
                              src={issue.assignees[0].user.avatarUrl}
                              alt={issue.assignees[0].user.name}
                            />
                          )}
                          <AvatarFallback className="text-[9px]">
                            {issue.assignees[0].user.name.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-zinc-300">
                          {issue.assignees[0].user.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Unassigned</span>
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
                            <AvatarFallback className="text-[9px]">
                              {user.name.substring(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                          {isAssigned && (
                            <Check className="ml-auto h-3 w-3 text-indigo-400" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Due Date */}
              <div className="text-zinc-400 truncate">
                {issue.dueDate ? formatDate(issue.dueDate) : "-"}
              </div>

              {/* Estimate Points */}
              <div className="text-right font-mono text-zinc-400">
                {issue.estimate ?? "-"}
              </div>
            </div>
          );
        })}

        {issues.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500 text-sm">
            <span>No issues found matching your filters</span>
          </div>
        )}
      </div>

      {/* Floating Multi-Select Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-zinc-700 bg-[#16161a]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md z-40 animate-in fade-in-0 slide-in-from-bottom-2">
          <span className="text-xs font-semibold text-zinc-200">
            {selectedIds.length} {selectedIds.length === 1 ? "issue" : "issues"} selected
          </span>

          <div className="h-4 w-px bg-zinc-700" />

          {/* Batch State change */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                Set State
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {states.map((st) => (
                <DropdownMenuItem
                  key={st.id}
                  onClick={() => batchUpdateMutation.mutate({ data: { stateId: st.id } })}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: st.color }}
                  />
                  <span>{st.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Batch Priority change */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                Set Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {Object.values(IssuePriority).map((prio) => {
                const meta = getPriorityMeta(prio);
                return (
                  <DropdownMenuItem
                    key={prio}
                    onClick={() =>
                      batchUpdateMutation.mutate({ data: { priority: prio } })
                    }
                    className="flex items-center gap-2"
                  >
                    <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                    <span>{meta.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Batch Archive */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => batchUpdateMutation.mutate({ data: { isArchived: true } })}
            className="flex items-center gap-1"
          >
            <Archive className="h-3 w-3" />
            Archive
          </Button>

          {/* Deselect */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds([])}
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}

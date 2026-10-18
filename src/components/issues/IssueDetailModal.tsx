"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSpaceStore } from "@/lib/store";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";
import { IssuePriority, RelationType } from "@prisma/client";
import { getPriorityMeta, formatDate, cn } from "@/lib/utils";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  X,
  MessageSquare,
  Activity,
  GitBranch,
  Link as LinkIcon,
  Archive,
  Calendar,
  Send,
  Plus,
  Check,
} from "lucide-react";

export function IssueDetailModal() {
  const activeIssueId = useSpaceStore((s) => s.activeIssueId);
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState("");
  const [newSubIssueTitle, setNewSubIssueTitle] = useState("");
  const [isAddingSubIssue, setIsAddingSubIssue] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");

  // Fetch full issue details
  const { data, isLoading } = useQuery<{ issue: IssueWithDetails & { project: ProjectWithDetails } }>({
    queryKey: ["issue", activeIssueId],
    queryFn: async () => {
      if (!activeIssueId) return null;
      const res = await fetch(`/api/issues/${activeIssueId}`);
      if (!res.ok) throw new Error("Failed to load issue");
      return res.json();
    },
    enabled: !!activeIssueId,
  });

  const issue = data?.issue;

  // Mutation to update issue fields
  const updateIssueMutation = useMutation({
    mutationFn: async (updatedData: Record<string, any>) => {
      if (!activeIssueId) return;
      const res = await fetch(`/api/issues/${activeIssueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error("Failed to update issue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", activeIssueId] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  // Mutation to post a new comment
  const postCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeIssueId) return;
      const res = await fetch(`/api/issues/${activeIssueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["issue", activeIssueId] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  // Mutation to create sub-issue
  const createSubIssueMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!issue) return;
      const res = await fetch(`/api/projects/${issue.projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          stateId: issue.stateId,
          priority: IssuePriority.NONE,
          parentId: issue.id,
          cycleId: issue.cycleId,
          moduleId: issue.moduleId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create sub-issue");
      return res.json();
    },
    onSuccess: () => {
      setNewSubIssueTitle("");
      setIsAddingSubIssue(false);
      queryClient.invalidateQueries({ queryKey: ["issue", activeIssueId] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  if (!activeIssueId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in-0 duration-150">
      <div
        className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e0e11] shadow-2xl text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-3 bg-[#121216]">
          <div className="flex items-center gap-3 text-sm">
            {issue?.project && (
              <span className="font-mono font-semibold text-zinc-400">
                {issue.project.identifier}-{issue.sequenceId}
              </span>
            )}
            {issue?.parent && (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                sub-issue of{" "}
                <button
                  onClick={() => setActiveIssueId(issue.parent!.id)}
                  className="font-mono text-indigo-400 hover:underline cursor-pointer"
                >
                  {issue.project.identifier}-{issue.parent.sequenceId}
                </button>
              </span>
            )}
          </div>

          <button
            onClick={() => setActiveIssueId(null)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading || !issue ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Loading issue details...
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Content Pane */}
            <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
              {/* Issue Title Input */}
              <div>
                <input
                  type="text"
                  defaultValue={issue.title}
                  onBlur={(e) => {
                    if (e.target.value !== issue.title && e.target.value.trim()) {
                      updateIssueMutation.mutate({ title: e.target.value.trim() });
                    }
                  }}
                  className="w-full bg-transparent text-xl font-bold tracking-tight text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1"
                  placeholder="Issue title"
                />
              </div>

              {/* Description Section with TipTap */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Description
                </label>
                <TipTapEditor
                  content={issue.description || ""}
                  onChange={(html) => {
                    updateIssueMutation.mutate({ description: html });
                  }}
                  placeholder="Add a detailed description, checklist, or slash commands (/)..."
                />
              </div>

              {/* Sub-Issues Section */}
              <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <GitBranch className="h-4 w-4 text-zinc-400" />
                    <span>Sub-Issues</span>
                    <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                      {issue.subIssues?.length || 0}
                    </span>
                  </div>
                  {!isAddingSubIssue && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingSubIssue(true)}
                      className="h-7 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add sub-issue
                    </Button>
                  )}
                </div>

                {/* Sub-issues list */}
                {issue.subIssues && issue.subIssues.length > 0 && (
                  <div className="space-y-1.5">
                    {issue.subIssues.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => setActiveIssueId(sub.id)}
                        className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-3 py-2 text-xs hover:border-zinc-700 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-400">
                            {issue.project.identifier}-{sub.sequenceId}
                          </span>
                          <span className="text-zinc-200 font-medium">{sub.title}</span>
                        </div>
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${sub.state.color}20`,
                            color: sub.state.color,
                          }}
                        >
                          {sub.state.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isAddingSubIssue && (
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      autoFocus
                      placeholder="Sub-issue title..."
                      value={newSubIssueTitle}
                      onChange={(e) => setNewSubIssueTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSubIssueTitle.trim()) {
                          createSubIssueMutation.mutate(newSubIssueTitle.trim());
                        } else if (e.key === "Escape") {
                          setIsAddingSubIssue(false);
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newSubIssueTitle.trim()) {
                          createSubIssueMutation.mutate(newSubIssueTitle.trim());
                        }
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingSubIssue(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Activity & Comments Tabs */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4 border-b border-zinc-800 pb-2 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={cn(
                      "flex items-center gap-1.5 pb-1 transition-colors cursor-pointer",
                      activeTab === "comments"
                        ? "border-b-2 border-indigo-500 text-indigo-400"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Comments ({issue.comments?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={cn(
                      "flex items-center gap-1.5 pb-1 transition-colors cursor-pointer",
                      activeTab === "activity"
                        ? "border-b-2 border-indigo-500 text-indigo-400"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Activity Audit Trail</span>
                  </button>
                </div>

                {activeTab === "comments" ? (
                  <div className="space-y-4">
                    {/* Comments list */}
                    {issue.comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3"
                      >
                        <Avatar className="h-7 w-7 mt-0.5">
                          {comment.user.avatarUrl && (
                            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                          )}
                          <AvatarFallback>{comment.user.name.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-200">
                              {comment.user.name}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* New comment input */}
                    <div className="flex items-end gap-2 pt-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Leave a comment... (Enter to send)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && newComment.trim()) {
                            e.preventDefault();
                            postCommentMutation.mutate(newComment.trim());
                          }
                        }}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        disabled={!newComment.trim()}
                        onClick={() => postCommentMutation.mutate(newComment.trim())}
                        className="h-9 px-3"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {issue.activities?.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center gap-2 text-xs text-zinc-400 py-1"
                      >
                        <span className="font-semibold text-zinc-300">{act.user.name}</span>
                        <span>{act.action.toLowerCase().replace("_", " ")}:</span>
                        {act.oldValue && (
                          <span className="line-through text-zinc-500">{act.oldValue}</span>
                        )}
                        <span className="text-zinc-200 font-medium">{act.newValue}</span>
                        <span className="ml-auto text-[10px] text-zinc-500">
                          {formatDate(act.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Properties Sidebar */}
            <div className="w-80 border-l border-zinc-800/80 bg-[#121215] p-5 space-y-5 text-xs">
              {/* State Picker */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">
                  State
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-zinc-200 hover:bg-zinc-800 transition-colors">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: issue.state.color }}
                      />
                      <span>{issue.state.name}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    {issue.project.states.map((st) => (
                      <DropdownMenuItem
                        key={st.id}
                        onClick={() => updateIssueMutation.mutate({ stateId: st.id })}
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

              {/* Priority Picker */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">
                  Priority
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-zinc-200 hover:bg-zinc-800 transition-colors">
                    {(() => {
                      const pMeta = getPriorityMeta(issue.priority);
                      return (
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", pMeta.dot)} />
                          <span className={pMeta.color}>{pMeta.label}</span>
                        </div>
                      );
                    })()}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    {Object.values(IssuePriority).map((prio) => {
                      const meta = getPriorityMeta(prio);
                      return (
                        <DropdownMenuItem
                          key={prio}
                          onClick={() => updateIssueMutation.mutate({ priority: prio })}
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

              {/* Assignees */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">
                  Assignees
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex min-h-[32px] w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-200 hover:bg-zinc-800 transition-colors">
                    {issue.assignees && issue.assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {issue.assignees.map(({ user }) => (
                          <span
                            key={user.id}
                            className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[11px]"
                          >
                            <Avatar className="h-3.5 w-3.5">
                              {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                              <AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-500">Assign members...</span>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    {issue.project.members.map(({ user }) => {
                      const isAssigned = issue.assignees.some(
                        (a) => a.user.id === user.id
                      );
                      return (
                        <DropdownMenuItem
                          key={user.id}
                          onClick={() => {
                            const newIds = isAssigned
                              ? issue.assignees
                                  .filter((a) => a.user.id !== user.id)
                                  .map((a) => a.user.id)
                              : [...issue.assignees.map((a) => a.user.id), user.id];
                            updateIssueMutation.mutate({ assigneeIds: newIds });
                          }}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-5 w-5">
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                            <AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
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

              {/* Estimate Points (Fibonacci) */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">
                  Estimate Points
                </label>
                <div className="flex flex-wrap gap-1">
                  {[null, 1, 2, 3, 5, 8, 13].map((pts) => (
                    <button
                      key={pts === null ? "none" : pts}
                      onClick={() => updateIssueMutation.mutate({ estimate: pts })}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded font-mono text-xs transition-colors cursor-pointer border",
                        issue.estimate === pts
                          ? "border-indigo-500 bg-indigo-600/30 text-indigo-300 font-bold"
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      {pts === null ? "-" : pts}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycle (Sprint) */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">
                  Cycle (Sprint)
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-zinc-200 hover:bg-zinc-800 transition-colors">
                    <span className="truncate">
                      {issue.cycle ? issue.cycle.name : "No Cycle"}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    <DropdownMenuItem
                      onClick={() => updateIssueMutation.mutate({ cycleId: null })}
                    >
                      No Cycle
                    </DropdownMenuItem>
                    {issue.project.cycles.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => updateIssueMutation.mutate({ cycleId: c.id })}
                        className="flex items-center gap-2"
                      >
                        <span>{c.name}</span>
                        {issue.cycleId === c.id && (
                          <Check className="ml-auto h-3 w-3 text-indigo-400" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Module (Epic) */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">
                  Module (Initiative)
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-zinc-200 hover:bg-zinc-800 transition-colors">
                    <span className="truncate">
                      {issue.module ? issue.module.name : "No Module"}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    <DropdownMenuItem
                      onClick={() => updateIssueMutation.mutate({ moduleId: null })}
                    >
                      No Module
                    </DropdownMenuItem>
                    {issue.project.modules.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => updateIssueMutation.mutate({ moduleId: m.id })}
                        className="flex items-center gap-2"
                      >
                        <span>{m.name}</span>
                        {issue.moduleId === m.id && (
                          <Check className="ml-auto h-3 w-3 text-indigo-400" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">
                  Due Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={
                      issue.dueDate
                        ? new Date(issue.dueDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      updateIssueMutation.mutate({
                        dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                    className="h-8 w-full rounded border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Archive Issue */}
              <div className="pt-4 border-t border-zinc-800/80">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to archive this issue?")) {
                      updateIssueMutation.mutate({ isArchived: true });
                      setActiveIssueId(null);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Archive Issue</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSpaceStore } from "@/lib/store";
import { IssueWithDetails, ProjectWithDetails, Component } from "@/lib/types";
import { IssuePriority, IssueType, RelationType } from "@prisma/client";
import { formatDate, cn } from "@/lib/utils";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { IssueTypeIcon } from "@/components/issues/IssueTypeIcon";
import { WorklogModal } from "@/components/issues/WorklogModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
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
  Archive,
  Send,
  Plus,
  Check,
  Link2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Clock,
  Box,
  UserCheck,
  Timer,
} from "lucide-react";

export function IssueDetailModal() {
  const activeIssueId = useSpaceStore((s) => s.activeIssueId);
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState("");
  const [newSubIssueTitle, setNewSubIssueTitle] = useState("");
  const [isAddingSubIssue, setIsAddingSubIssue] = useState(false);
  const [isWorklogModalOpen, setIsWorklogModalOpen] = useState(false);
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [estimateInput, setEstimateInput] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "activity" | "worklogs">("comments");

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    if (!activeIssueId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveIssueId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIssueId, setActiveIssueId]);

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
    mutationFn: async (updatedData: Record<string, unknown>) => {
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

  // Fetch current user
  const { data: userData } = useQuery<{ user?: { id: string; name: string } }>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return { user: undefined };
      return res.json();
    },
    staleTime: 60000,
  });
  const currentUserId = userData?.user?.id;

  // Fetch components for project
  const { data: componentsData } = useQuery<{ components: Component[] }>({
    queryKey: ["components", issue?.projectId],
    queryFn: async () => {
      if (!issue?.projectId) return { components: [] };
      const res = await fetch(`/api/projects/${issue.projectId}/components`);
      if (!res.ok) return { components: [] };
      return res.json();
    },
    enabled: !!issue?.projectId,
    staleTime: 30000,
  });
  const components = componentsData?.components || issue?.project?.components || [];

  // Check if current user is watching
  const isWatching = Boolean(issue?.watchers?.some((w) => w.user.id === currentUserId));

  // Toggle watch mutation
  const toggleWatchMutation = useMutation({
    mutationFn: async () => {
      if (!activeIssueId) return;
      const res = await fetch(`/api/issues/${activeIssueId}/watchers`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle watcher");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", activeIssueId] });
    },
  });

  // Clone issue mutation
  const cloneIssueMutation = useMutation({
    mutationFn: async () => {
      if (!activeIssueId) return;
      const res = await fetch(`/api/issues/${activeIssueId}/clone`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to clone issue");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      if (data?.issue?.id) {
        setActiveIssueId(data.issue.id);
      }
    },
  });

  const formatTimeMinutes = (mins?: number | null) => {
    if (!mins || mins <= 0) return "0m";
    const days = Math.floor(mins / 480);
    const remAfterDays = mins % 480;
    const hours = Math.floor(remAfterDays / 60);
    const m = remAfterDays % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (m > 0 || parts.length === 0) parts.push(`${m}m`);
    return parts.join(" ");
  };

  const parseTimeToMinutes = (text: string) => {
    let total = 0;
    const dayMatch = text.match(/(\d+)\s*d/i);
    const hourMatch = text.match(/(\d+)\s*h/i);
    const minMatch = text.match(/(\d+)\s*m/i);
    if (dayMatch) total += parseInt(dayMatch[1], 10) * 8 * 60;
    if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) total += parseInt(minMatch[1], 10);
    if (!dayMatch && !hourMatch && !minMatch && text.trim()) {
      const num = parseFloat(text.trim());
      if (!isNaN(num)) total += Math.round(num * 60);
    }
    return total;
  };

  // State & queries for issue relations
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [relationType, setRelationType] = useState<RelationType>(RelationType.RELATED);
  const [targetIssueId, setTargetIssueId] = useState("");

  const { data: projectIssuesData } = useQuery<{ issues: IssueWithDetails[] }>({
    queryKey: ["issues", issue?.projectId],
    queryFn: async () => {
      if (!issue?.projectId) return { issues: [] };
      const res = await fetch(`/api/projects/${issue.projectId}/issues`);
      if (!res.ok) return { issues: [] };
      return res.json();
    },
    enabled: !!issue?.projectId && isAddingRelation,
  });

  const availableIssues = (projectIssuesData?.issues || []).filter(
    (i) => i.id !== activeIssueId
  );

  const addRelationMutation = useMutation({
    mutationFn: async () => {
      if (!activeIssueId || !targetIssueId) return;
      const res = await fetch(`/api/issues/${activeIssueId}/relations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: targetIssueId, type: relationType }),
      });
      if (!res.ok) throw new Error("Failed to add relation");
      return res.json();
    },
    onSuccess: () => {
      setIsAddingRelation(false);
      setTargetIssueId("");
      queryClient.invalidateQueries({ queryKey: ["issue", activeIssueId] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  const deleteRelationMutation = useMutation({
    mutationFn: async (relationId: string) => {
      if (!activeIssueId) return;
      const res = await fetch(
        `/api/issues/${activeIssueId}/relations?relationId=${relationId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete relation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", activeIssueId] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  if (!activeIssueId) return null;

  return (
    <div
      onClick={() => setActiveIssueId(null)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in-0 duration-150"
    >
      <div
        className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-2xl text-[#111827]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-2.5 bg-[#f8f9fa]">
          <div className="flex items-center gap-2.5 text-xs">
            {issue && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-[#eef0f2] transition-colors border border-[#e5e7eb] bg-white text-xs font-medium cursor-pointer shadow-xs outline-none">
                  <IssueTypeIcon type={issue.type} size={14} />
                  <span className="capitalize text-[#111827]">{issue.type.toLowerCase()}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-[#e5e7eb] text-[#111827] shadow-xl">
                  {Object.values(IssueType).map((t) => (
                    <DropdownMenuItem
                      key={t}
                      onClick={() => updateIssueMutation.mutate({ type: t })}
                      className="flex items-center gap-2 cursor-pointer text-xs"
                    >
                      <IssueTypeIcon type={t} size={14} />
                      <span className="capitalize">{t.toLowerCase()}</span>
                      {issue.type === t && (
                        <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {issue?.project && (
              <span className="font-mono font-medium text-[#6b7280]">
                {issue.project.identifier}-{issue.sequenceId}
              </span>
            )}

            {issue?.parent && (
              <span className="flex items-center gap-1 text-xs text-[#6b7280]">
                sub-issue of{" "}
                <button
                  onClick={() => setActiveIssueId(issue.parent!.id)}
                  className="font-mono text-[#3e63dd] hover:underline cursor-pointer"
                >
                  {issue.project.identifier}-{issue.parent.sequenceId}
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Watch / Unwatch button */}
            <button
              onClick={() => toggleWatchMutation.mutate()}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer shadow-xs",
                isWatching
                  ? "bg-[#eff6ff] text-[#3e63dd] border-[#bfdbfe]"
                  : "bg-white text-[#4b5563] border-[#e5e7eb] hover:bg-[#f3f4f6] hover:text-[#111827]"
              )}
              title={isWatching ? "You are watching this issue. Click to unwatch." : "Watch this issue to receive email and notification alerts"}
            >
              {isWatching ? <Eye className="h-3.5 w-3.5 text-[#3e63dd]" /> : <EyeOff className="h-3.5 w-3.5 text-[#6b7280]" />}
              <span>{isWatching ? "Watching" : "Watch"}</span>
              <span className="rounded-full bg-black/5 px-1.5 py-0.2 text-[10px] font-mono">
                {issue?.watchers?.length || 0}
              </span>
            </button>

            {/* Clone Issue button */}
            <button
              onClick={() => cloneIssueMutation.mutate()}
              disabled={cloneIssueMutation.isPending}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer shadow-xs"
              title="Duplicate this issue"
            >
              <Copy className="h-3.5 w-3.5 text-[#6b7280]" />
              <span>{cloneIssueMutation.isPending ? "Cloning..." : "Clone"}</span>
            </button>

            <button
              onClick={() => setActiveIssueId(null)}
              aria-label="Close modal"
              data-testid="close-issue-modal"
              className="rounded p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading || !issue ? (
          <div className="flex flex-1 items-center justify-center text-xs text-[#6b7280]">
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
                  className="w-full bg-transparent text-lg font-semibold tracking-tight text-[#111827] focus:outline-none focus:bg-[#f8f9fa] rounded px-2 py-1 transition-colors"
                  placeholder="Issue title"
                />
              </div>

              {/* Description Section with TipTap */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
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
              <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#374151]">
                    <GitBranch className="h-4 w-4 text-[#6b7280]" />
                    <span>Sub-Issues</span>
                    <span className="rounded-full bg-white px-1.5 py-0.2 text-[10px] text-[#6b7280] font-mono border border-[#e5e7eb]">
                      {issue.subIssues?.length || 0}
                    </span>
                  </div>
                  {!isAddingSubIssue && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingSubIssue(true)}
                      className="h-7 text-xs text-[#3e63dd] hover:text-[#3451b2]"
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
                        className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs hover:border-[#cbd5e1] shadow-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#6b7280] text-[11px]">
                            {issue.project.identifier}-{sub.sequenceId}
                          </span>
                          <span className="text-[#111827] font-medium">{sub.title}</span>
                        </div>
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${sub.state.color}15`,
                            color: sub.state.color,
                            border: `1px solid ${sub.state.color}30`,
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
                      className="h-8 text-xs bg-white border-[#e5e7eb] text-[#111827]"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newSubIssueTitle.trim()) {
                          createSubIssueMutation.mutate(newSubIssueTitle.trim());
                        }
                      }}
                      className="bg-[#3e63dd] hover:bg-[#3451b2] text-white"
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

              {/* Relations & Dependencies Section */}
              <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#374151]">
                    <Link2 className="h-4 w-4 text-[#6b7280]" />
                    <span>Relations & Dependencies</span>
                    <span className="rounded-full bg-white px-1.5 py-0.2 text-[10px] text-[#6b7280] font-mono border border-[#e5e7eb]">
                      {(issue.relations?.length || 0) + (issue.relatedBy?.length || 0)}
                    </span>
                  </div>
                  {!isAddingRelation && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingRelation(true)}
                      className="h-7 text-xs text-[#3e63dd] hover:text-[#3451b2]"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add relation
                    </Button>
                  )}
                </div>

                {/* Relations list */}
                {((issue.relations && issue.relations.length > 0) ||
                  (issue.relatedBy && issue.relatedBy.length > 0)) && (
                  <div className="space-y-1.5">
                    {/* Outbound Relations */}
                    {issue.relations?.map((rel) => {
                      const typeLabel =
                        rel.type === RelationType.BLOCKS
                          ? "Blocks"
                          : rel.type === RelationType.BLOCKED_BY
                          ? "Blocked by"
                          : rel.type === RelationType.DUPLICATE
                          ? "Duplicate of"
                          : "Relates to";

                      const typeColor =
                        rel.type === RelationType.BLOCKS
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : rel.type === RelationType.BLOCKED_BY
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : rel.type === RelationType.DUPLICATE
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]";

                      return (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs group hover:border-[#cbd5e1] shadow-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[10px] font-semibold border uppercase tracking-wider shrink-0",
                                typeColor
                              )}
                            >
                              {typeLabel}
                            </span>
                            <span
                              onClick={() => setActiveIssueId(rel.target.id)}
                              className="font-mono text-[#6b7280] text-[11px] hover:underline cursor-pointer shrink-0"
                            >
                              {issue.project.identifier}-{rel.target.sequenceId}
                            </span>
                            <span
                              onClick={() => setActiveIssueId(rel.target.id)}
                              className="text-[#111827] font-medium truncate cursor-pointer hover:underline"
                            >
                              {rel.target.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: `${rel.target.state.color}15`,
                                color: rel.target.state.color,
                              }}
                            >
                              {rel.target.state.name}
                            </span>

                            <button
                              onClick={() => deleteRelationMutation.mutate(rel.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#9ca3af] hover:text-rose-600 transition-all cursor-pointer"
                              title="Remove relation"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inbound Relations (Related by) */}
                    {issue.relatedBy?.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs group hover:border-[#cbd5e1] shadow-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="rounded px-1.5 py-0.2 text-[10px] font-semibold border uppercase tracking-wider shrink-0 bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]">
                            Linked from
                          </span>
                          <span
                            onClick={() => setActiveIssueId(rel.source.id)}
                            className="font-mono text-[#6b7280] text-[11px] hover:underline cursor-pointer shrink-0"
                          >
                            {issue.project.identifier}-{rel.source.sequenceId}
                          </span>
                          <span
                            onClick={() => setActiveIssueId(rel.source.id)}
                            className="text-[#111827] font-medium truncate cursor-pointer hover:underline"
                          >
                            {rel.source.title}
                          </span>
                        </div>

                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0"
                          style={{
                            backgroundColor: `${rel.source.state.color}15`,
                            color: rel.source.state.color,
                          }}
                        >
                          {rel.source.state.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline relation adder */}
                {isAddingRelation && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <select
                      value={relationType}
                      onChange={(e) => setRelationType(e.target.value as RelationType)}
                      className="rounded border border-[#e5e7eb] bg-white px-2 py-1.5 text-xs text-[#111827] shadow-xs focus:outline-none"
                    >
                      <option value={RelationType.RELATED}>Relates to</option>
                      <option value={RelationType.BLOCKS}>Blocks</option>
                      <option value={RelationType.BLOCKED_BY}>Blocked by</option>
                      <option value={RelationType.DUPLICATE}>Duplicate of</option>
                    </select>

                    <select
                      value={targetIssueId}
                      onChange={(e) => setTargetIssueId(e.target.value)}
                      className="flex-1 rounded border border-[#e5e7eb] bg-white px-2 py-1.5 text-xs text-[#111827] shadow-xs focus:outline-none truncate"
                    >
                      <option value="">Select target issue...</option>
                      {availableIssues.map((item) => (
                        <option key={item.id} value={item.id}>
                          {issue.project.identifier}-{item.sequenceId}: {item.title}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        disabled={!targetIssueId || addRelationMutation.isPending}
                        onClick={() => addRelationMutation.mutate()}
                        className="h-8 text-xs bg-[#3e63dd] hover:bg-[#3451b2] text-white font-medium"
                      >
                        Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingRelation(false);
                          setTargetIssueId("");
                        }}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>


              {/* Activity, Comments, and Worklogs Tabs */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4 border-b border-[#e5e7eb] pb-2 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={cn(
                      "flex items-center gap-1.5 pb-1 transition-colors cursor-pointer",
                      activeTab === "comments"
                        ? "border-b-2 border-[#3e63dd] text-[#3e63dd]"
                        : "text-[#6b7280] hover:text-[#111827]"
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
                        ? "border-b-2 border-[#3e63dd] text-[#3e63dd]"
                        : "text-[#6b7280] hover:text-[#111827]"
                    )}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Activity Audit Trail</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("worklogs")}
                    className={cn(
                      "flex items-center gap-1.5 pb-1 transition-colors cursor-pointer",
                      activeTab === "worklogs"
                        ? "border-b-2 border-[#3e63dd] text-[#3e63dd]"
                        : "text-[#6b7280] hover:text-[#111827]"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Worklogs ({issue.worklogs?.length || 0})</span>
                  </button>
                </div>

                {activeTab === "worklogs" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2 text-xs text-[#4b5563]">
                        <Clock className="h-4 w-4 text-[#3e63dd]" />
                        <span className="font-semibold text-[#111827]">Logged Time:</span>
                        <span className="font-mono font-bold text-[#3e63dd]">
                          {formatTimeMinutes(issue.timeSpent)}
                        </span>
                        {Boolean(issue.timeEstimate) && (
                          <span className="text-[#6b7280]">
                            of {formatTimeMinutes(issue.timeEstimate)} estimated
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsWorklogModalOpen(true)}
                        className="h-7 text-xs bg-[#3e63dd] hover:bg-[#3451b2] text-white flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Log Work</span>
                      </Button>
                    </div>

                    {(!issue.worklogs || issue.worklogs.length === 0) ? (
                      <div className="rounded-lg border border-dashed border-[#e5e7eb] p-6 text-center text-xs text-[#6b7280]">
                        No work logged yet. Click &quot;Log Work&quot; to record time spent on this issue.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {issue.worklogs.map((wl) => (
                          <div
                            key={wl.id}
                            className="flex items-start justify-between rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-xs text-xs"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-6 w-6 mt-0.5">
                                {wl.user.avatarUrl && <AvatarImage src={wl.user.avatarUrl} />}
                                <AvatarFallback className="text-[10px] bg-[#f3f4f6] text-[#374151]">
                                  {wl.user.name.substring(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#111827]">{wl.user.name}</span>
                                  <span className="text-[#6b7280] text-[11px]">logged</span>
                                  <span className="rounded bg-[#eff6ff] px-1.5 py-0.2 font-mono font-semibold text-[#3e63dd] border border-[#dbeafe]">
                                    {formatTimeMinutes(wl.timeSpent)}
                                  </span>
                                </div>
                                {wl.description && (
                                  <p className="mt-1 text-xs text-[#4b5563] leading-relaxed">
                                    {wl.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-[#6b7280] shrink-0 font-mono">
                              {formatDate(wl.loggedAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : activeTab === "comments" ? (
                  <div className="space-y-4">
                    {/* Comments list */}
                    {issue.comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3 shadow-xs"
                      >
                        <Avatar className="h-6 w-6 mt-0.5 ring-1 ring-[#e5e7eb]">
                          {comment.user.avatarUrl && (
                            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                          )}
                          <AvatarFallback className="text-[10px] bg-[#e5e7eb] text-[#374151]">
                            {comment.user.name.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#111827]">
                              {comment.user.name}
                            </span>
                            <span className="text-[10px] text-[#6b7280]">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-[#374151] leading-relaxed">
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
                        className="text-xs bg-white border-[#e5e7eb] text-[#111827]"
                      />
                      <Button
                        size="sm"
                        disabled={!newComment.trim()}
                        onClick={() => postCommentMutation.mutate(newComment.trim())}
                        className="h-9 px-3 bg-[#3e63dd] hover:bg-[#3451b2] text-white"
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
                        className="flex items-center gap-2 text-xs text-[#6b7280] py-1"
                      >
                        <span className="font-semibold text-[#111827]">{act.user.name}</span>
                        <span>{act.action.toLowerCase().replace("_", " ")}:</span>
                        {act.oldValue && (
                          <span className="line-through text-[#9ca3af]">{act.oldValue}</span>
                        )}
                        <span className="text-[#111827] font-medium">{act.newValue}</span>
                        <span className="ml-auto text-[10px] text-[#6b7280]">
                          {formatDate(act.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Properties Sidebar */}
            <div className="w-80 border-l border-[#e5e7eb] bg-[#f8f9fa] p-5 space-y-5 text-xs">
              {/* State Picker */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6b7280] text-[10px]">
                  State
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-2.5 text-[#111827] hover:bg-[#f3f4f6] shadow-xs transition-colors">
                    <div className="flex items-center gap-2">
                      <StateIcon group={issue.state.group} color={issue.state.color} size={14} />
                      <span className="font-medium">{issue.state.name}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    {issue.project.states.map((st) => (
                      <DropdownMenuItem
                        key={st.id}
                        onClick={() => updateIssueMutation.mutate({ stateId: st.id })}
                        className="flex items-center gap-2"
                      >
                        <StateIcon group={st.group} color={st.color} size={14} />
                        <span>{st.name}</span>
                        {issue.stateId === st.id && (
                          <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Priority Picker */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6b7280] text-[10px]">
                  Priority
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-2.5 text-[#111827] hover:bg-[#f3f4f6] shadow-xs transition-colors">
                    <div className="flex items-center gap-2">
                      <PriorityIcon priority={issue.priority} size={14} />
                      <span className="capitalize font-medium">{issue.priority.toLowerCase()}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    {Object.values(IssuePriority).map((prio) => (
                      <DropdownMenuItem
                        key={prio}
                        onClick={() => updateIssueMutation.mutate({ priority: prio })}
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

              {/* Assignees */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold uppercase tracking-wider text-[#6b7280] text-[10px]">
                    Assignees
                  </label>
                  {userData?.user && (
                    <button
                      type="button"
                      onClick={() => {
                        const myId = userData.user!.id;
                        const isAssigned = issue.assignees.some((a) => a.user.id === myId);
                        const newIds = isAssigned
                          ? issue.assignees.filter((a) => a.user.id !== myId).map((a) => a.user.id)
                          : [...issue.assignees.map((a) => a.user.id), myId];
                        updateIssueMutation.mutate({ assigneeIds: newIds });
                      }}
                      className="text-[10px] font-medium text-[#3e63dd] hover:underline cursor-pointer"
                    >
                      {issue.assignees.some((a) => a.user.id === userData.user?.id) ? "Unassign me" : "Assign to me"}
                    </button>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex min-h-[32px] w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1 text-[#111827] hover:bg-[#f3f4f6] shadow-xs transition-colors">
                    {issue.assignees && issue.assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {issue.assignees.map(({ user }) => (
                          <span
                            key={user.id}
                            className="flex items-center gap-1.5 rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[11px] border border-[#e5e7eb] text-[#111827]"
                          >
                            <Avatar className="h-3.5 w-3.5">
                              {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                              <AvatarFallback className="text-[9px] bg-[#e5e7eb] text-[#374151]">
                                {user.name.substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#9ca3af]">Assign members...</span>
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
                            <AvatarFallback className="text-[10px] bg-[#e5e7eb] text-[#374151]">
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

              {/* Component */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6b7280] text-[10px]">
                  Component
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-2.5 text-[#111827] hover:bg-[#f3f4f6] shadow-xs transition-colors">
                    <div className="flex items-center gap-2 truncate">
                      <Box className="h-3.5 w-3.5 text-[#3e63dd] shrink-0" />
                      <span className="truncate font-medium">
                        {issue.component ? issue.component.name : "No Component"}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    <DropdownMenuItem
                      onClick={() => updateIssueMutation.mutate({ componentId: null })}
                    >
                      No Component
                    </DropdownMenuItem>
                    {components.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => updateIssueMutation.mutate({ componentId: c.id })}
                        className="flex items-center gap-2"
                      >
                        <Box className="h-3.5 w-3.5 text-[#3e63dd]" />
                        <span>{c.name}</span>
                        {issue.componentId === c.id && (
                          <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Time Tracking Card */}
              <div className="space-y-2 rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-[#111827] text-xs">
                    <Clock className="h-3.5 w-3.5 text-[#3e63dd]" />
                    <span>Time Tracking</span>
                  </div>
                  <button
                    onClick={() => setIsWorklogModalOpen(true)}
                    className="text-[11px] font-semibold text-[#3e63dd] hover:underline cursor-pointer"
                  >
                    + Log Work
                  </button>
                </div>

                {Boolean(issue.timeEstimate) && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-[#f3f4f6] overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          (issue.timeSpent || 0) > (issue.timeEstimate || 0)
                            ? "bg-rose-500"
                            : "bg-emerald-500"
                        )}
                        style={{
                          width: `${Math.min(100, Math.round(((issue.timeSpent || 0) / (issue.timeEstimate || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-[#6b7280]">Original Estimate</span>
                    {isEditingEstimate ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="e.g. 2d 4h"
                          value={estimateInput}
                          onChange={(e) => setEstimateInput(e.target.value)}
                          onBlur={() => {
                            if (estimateInput.trim()) {
                              const mins = parseTimeToMinutes(estimateInput);
                              updateIssueMutation.mutate({ timeEstimate: mins });
                            }
                            setIsEditingEstimate(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (estimateInput.trim()) {
                                const mins = parseTimeToMinutes(estimateInput);
                                updateIssueMutation.mutate({ timeEstimate: mins });
                              }
                              setIsEditingEstimate(false);
                            }
                          }}
                          autoFocus
                          className="h-6 w-full rounded border border-[#3e63dd] px-1.5 font-mono text-xs text-[#111827] focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEstimateInput(issue.timeEstimate ? formatTimeMinutes(issue.timeEstimate) : "");
                          setIsEditingEstimate(true);
                        }}
                        className="font-mono font-medium text-[#111827] hover:text-[#3e63dd] cursor-pointer"
                        title="Click to edit estimate"
                      >
                        {issue.timeEstimate ? formatTimeMinutes(issue.timeEstimate) : "Set estimate"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[#6b7280]">Logged Spent</span>
                    <div className="font-mono font-bold text-[#3e63dd]">
                      {formatTimeMinutes(issue.timeSpent)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimate Points (Fibonacci) */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6b7280] text-[10px]">
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
                          ? "border-[#3e63dd] bg-[#3e63dd]/10 text-[#3e63dd] font-bold"
                          : "border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f3f4f6] shadow-xs"
                      )}
                    >
                      {pts === null ? "-" : pts}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycle (Sprint) */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6b7280] text-[10px]">
                  Cycle (Sprint)
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-2.5 text-[#111827] hover:bg-[#f3f4f6] shadow-xs transition-colors">
                    <span className="truncate font-medium">
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
                          <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Module (Epic) */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6b7280] text-[10px]">
                  Module (Initiative)
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-2.5 text-[#111827] hover:bg-[#f3f4f6] shadow-xs transition-colors">
                    <span className="truncate font-medium">
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
                          <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6b7280] text-[10px]">
                  Due Date
                </label>
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={issue.dueDate}
                    onChange={(newDate) =>
                      updateIssueMutation.mutate({
                        dueDate: newDate,
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Archive Issue */}
              <div className="pt-4 border-t border-[#e5e7eb]">
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

        {/* Worklog Modal */}
        {issue && (
          <WorklogModal
            issue={issue}
            isOpen={isWorklogModalOpen}
            onClose={() => {
              setIsWorklogModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["issue", activeIssueId] });
              queryClient.invalidateQueries({ queryKey: ["issues"] });
            }}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSpaceStore } from "@/lib/store";
import { ProjectWithDetails } from "@/lib/types";
import { IssuePriority } from "@prisma/client";
import { getPriorityMeta, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Check } from "lucide-react";

interface IssueCreateModalProps {
  project: ProjectWithDetails;
}

export function IssueCreateModal({ project }: IssueCreateModalProps) {
  const isCreateIssueOpen = useSpaceStore((s) => s.isCreateIssueOpen);
  const closeCreateIssue = useSpaceStore((s) => s.closeCreateIssue);
  const createIssueDefaults = useSpaceStore((s) => s.createIssueDefaults);
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const queryClient = useQueryClient();

  // Find default state (prefer Todo/UNSTARTED, or first state)
  const defaultState =
    project.states.find((s) => s.name.toLowerCase() === "todo") ||
    project.states[0];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stateId, setStateId] = useState(
    createIssueDefaults.stateId || defaultState?.id || ""
  );
  const [priority, setPriority] = useState<IssuePriority>(IssuePriority.NONE);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [cycleId, setCycleId] = useState<string | null>(
    createIssueDefaults.cycleId || null
  );
  const [moduleId, setModuleId] = useState<string | null>(
    createIssueDefaults.moduleId || null
  );
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  // Mutation to create issue
  const createIssueMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          stateId: stateId || defaultState?.id,
          priority,
          estimate,
          cycleId,
          moduleId,
          assigneeIds,
        }),
      });
      if (!res.ok) throw new Error("Failed to create issue");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      closeCreateIssue();
      setTitle("");
      setDescription("");
      if (data?.issue?.id) {
        setActiveIssueId(data.issue.id);
      }
    },
  });

  if (!isCreateIssueOpen) return null;

  const currentState = project.states.find((s) => s.id === stateId) || defaultState;
  const priorityMeta = getPriorityMeta(priority);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150"
      onClick={closeCreateIssue}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl p-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span>New Issue in</span>
            <span className="font-mono text-indigo-400">{project.name} ({project.identifier})</span>
          </div>
          <button
            onClick={closeCreateIssue}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title Input */}
        <div className="pt-4">
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && title.trim()) {
                createIssueMutation.mutate();
              }
            }}
            placeholder="Issue title"
            className="w-full bg-transparent text-lg font-semibold tracking-tight text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        {/* Description textarea */}
        <div className="pt-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description... (Markdown supported)"
            rows={4}
            className="w-full resize-none rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
          />
        </div>

        {/* Property Pickers Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-4 text-xs">
          {/* State Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 hover:bg-zinc-800 transition-colors cursor-pointer">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: currentState?.color }}
              />
              <span className="text-zinc-200">{currentState?.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {project.states.map((st) => (
                <DropdownMenuItem
                  key={st.id}
                  onClick={() => setStateId(st.id)}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: st.color }}
                  />
                  <span>{st.name}</span>
                  {stateId === st.id && (
                    <Check className="ml-auto h-3 w-3 text-indigo-400" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 hover:bg-zinc-800 transition-colors cursor-pointer">
              <span className={cn("h-2 w-2 rounded-full", priorityMeta.dot)} />
              <span className={priorityMeta.color}>{priorityMeta.label}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.values(IssuePriority).map((prio) => {
                const meta = getPriorityMeta(prio);
                return (
                  <DropdownMenuItem
                    key={prio}
                    onClick={() => setPriority(prio)}
                    className="flex items-center gap-2"
                  >
                    <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                    <span>{meta.label}</span>
                    {priority === prio && (
                      <Check className="ml-auto h-3 w-3 text-indigo-400" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assignees Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-300">
              {assigneeIds.length > 0 ? (
                <span>{assigneeIds.length} assigned</span>
              ) : (
                <span className="text-zinc-500">Assignee</span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {project.members.map(({ user }) => {
                const isSelected = assigneeIds.includes(user.id);
                return (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() =>
                      setAssigneeIds((prev) =>
                        isSelected
                          ? prev.filter((id) => id !== user.id)
                          : [...prev, user.id]
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-4 w-4">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                      <AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    {isSelected && (
                      <Check className="ml-auto h-3 w-3 text-indigo-400" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Estimate Points */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-300">
              <span>{estimate !== null ? `${estimate} pts` : "Estimate"}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[null, 1, 2, 3, 5, 8, 13].map((pts) => (
                <DropdownMenuItem key={pts === null ? "none" : pts} onClick={() => setEstimate(pts)}>
                  {pts === null ? "No estimate" : `${pts} points`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cycle Picker */}
          {project.cycles && project.cycles.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-300">
                <span className="truncate max-w-[120px]">
                  {project.cycles.find((c) => c.id === cycleId)?.name || "Cycle"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCycleId(null)}>No Cycle</DropdownMenuItem>
                {project.cycles.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => setCycleId(c.id)}>
                    {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Module Picker */}
          {project.modules && project.modules.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-300">
                <span className="truncate max-w-[120px]">
                  {project.modules.find((m) => m.id === moduleId)?.name || "Module"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setModuleId(null)}>No Module</DropdownMenuItem>
                {project.modules.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => setModuleId(m.id)}>
                    {m.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800/80 mt-4">
          <span className="text-[11px] text-zinc-500">
            Press <kbd className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[10px]">Cmd+Enter</kbd> to save
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeCreateIssue}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!title.trim() || createIssueMutation.isPending}
              onClick={() => createIssueMutation.mutate()}
            >
              {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

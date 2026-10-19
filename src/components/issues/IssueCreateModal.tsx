"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSpaceStore } from "@/lib/store";
import { ProjectWithDetails } from "@/lib/types";
import { IssuePriority } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DatePicker } from "@/components/ui/DatePicker";
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
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    createIssueDefaults.assigneeId ? [createIssueDefaults.assigneeId] : []
  );
  const [dueDate, setDueDate] = useState<string | null>(
    createIssueDefaults.dueDate || null
  );

  React.useEffect(() => {
    if (isCreateIssueOpen) {
      if (createIssueDefaults.stateId) setStateId(createIssueDefaults.stateId);
      if (createIssueDefaults.cycleId) setCycleId(createIssueDefaults.cycleId);
      if (createIssueDefaults.moduleId) setModuleId(createIssueDefaults.moduleId);
      if (createIssueDefaults.assigneeId) {
        setAssigneeIds([createIssueDefaults.assigneeId]);
      }
      if (createIssueDefaults.dueDate) {
        setDueDate(createIssueDefaults.dueDate);
      }
    }
  }, [isCreateIssueOpen, createIssueDefaults]);

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
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150"
      onClick={closeCreateIssue}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-2xl p-6 text-[#111827]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
            <span>New Issue</span>
            <span className="text-[#d1d5db]">/</span>
            <span className="font-mono text-[#111827]">{project.name} ({project.identifier})</span>
          </div>
          <button
            onClick={closeCreateIssue}
            className="rounded p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
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
            className="w-full bg-transparent text-base font-medium tracking-tight text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
          />
        </div>

        {/* Description textarea */}
        <div className="pt-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description... (Markdown supported)"
            rows={4}
            className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Property Pickers Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-4 text-xs">
          {/* State Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer outline-none shadow-xs">
              <StateIcon group={currentState?.group} color={currentState?.color} size={13} />
              <span className="text-[#374151] font-medium">{currentState?.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {project.states.map((st) => (
                <DropdownMenuItem
                  key={st.id}
                  onClick={() => setStateId(st.id)}
                  className="flex items-center gap-2"
                >
                  <StateIcon group={st.group} color={st.color} size={13} />
                  <span>{st.name}</span>
                  {stateId === st.id && (
                    <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer outline-none shadow-xs">
              <PriorityIcon priority={priority} size={14} />
              <span className="text-[#374151] font-medium capitalize">{priority.toLowerCase()}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.values(IssuePriority).map((prio) => (
                <DropdownMenuItem
                  key={prio}
                  onClick={() => setPriority(prio)}
                  className="flex items-center gap-2"
                >
                  <PriorityIcon priority={prio} size={14} />
                  <span className="capitalize">{prio.toLowerCase()}</span>
                  {priority === prio && (
                    <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assignees Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer text-[#374151] outline-none shadow-xs">
              {assigneeIds.length > 0 ? (
                <span className="font-medium text-[#111827]">{assigneeIds.length} assigned</span>
              ) : (
                <span className="text-[#6b7280]">Assignee</span>
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
                      <AvatarFallback className="text-[9px] bg-[#f3f4f6] text-[#374151]">
                        {user.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    {isSelected && (
                      <Check className="ml-auto h-3.5 w-3.5 text-[#3e63dd]" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Estimate Points */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer text-[#374151] outline-none shadow-xs">
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
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer text-[#374151] outline-none shadow-xs">
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
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer text-[#374151] outline-none shadow-xs">
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

          {/* Due Date Picker */}
          <DatePicker
            value={dueDate}
            onChange={setDueDate}
            placeholder="Due date"
            size="sm"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-[#e5e7eb] mt-5">
          <span className="text-[11px] text-[#6b7280]">
            Press <kbd className="rounded bg-[#f3f4f6] border border-[#e5e7eb] px-1.5 py-0.5 font-mono text-[10px] text-[#4b5563]">⌘+Enter</kbd> to save
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeCreateIssue}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!title.trim() || createIssueMutation.isPending}
              onClick={() => createIssueMutation.mutate()}
              className="bg-[#3e63dd] hover:bg-[#3451b2] text-white font-medium"
            >
              {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

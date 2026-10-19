"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CycleWithMetrics,
  IssueWithDetails,
  ProjectWithDetails,
} from "@/lib/types";
import { StateGroup, IssuePriority, IssueType } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSpaceStore } from "@/lib/store";
import { IssueTypeIcon } from "@/components/issues/IssueTypeIcon";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, cn } from "@/lib/utils";
import {
  Plus,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  Play,
  Clock,
  Sparkles,
} from "lucide-react";

interface BacklogViewProps {
  project: ProjectWithDetails;
  initialIssues: IssueWithDetails[];
  cycles: CycleWithMetrics[];
}

export function BacklogView({
  project,
  initialIssues,
  cycles,
}: BacklogViewProps) {
  const [issues, setIssues] = useState<IssueWithDetails[]>(initialIssues);
  const [activeIssue, setActiveIssue] = useState<IssueWithDetails | null>(null);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintStart, setNewSprintStart] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [newSprintEnd, setNewSprintEnd] = useState(() =>
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [collapsedContainers, setCollapsedContainers] = useState<Record<string, boolean>>({});

  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);
  const queryClient = useQueryClient();

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Group issues into sprints and backlog pool
  const activeCycle = cycles.find((c) => !c.isCompleted);
  const futureCycles = cycles.filter(
    (c) => !c.isCompleted && c.id !== activeCycle?.id
  );

  const issuesByContainer = useMemo(() => {
    const map: Record<string, IssueWithDetails[]> = {
      backlog: [],
    };
    cycles.forEach((c) => {
      map[c.id] = [];
    });

    issues.forEach((issue) => {
      if (!issue.cycleId || !map[issue.cycleId]) {
        map.backlog.push(issue);
      } else {
        map[issue.cycleId].push(issue);
      }
    });

    return map;
  }, [issues, cycles]);

  // Mutation to move issue to cycle
  const moveIssueMutation = useMutation({
    mutationFn: async ({
      issueId,
      cycleId,
    }: {
      issueId: string;
      cycleId: string | null;
    }) => {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId }),
      });
      if (!res.ok) throw new Error("Failed to update issue cycle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", project.id] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });

  // Mutation to create new sprint
  const createSprintMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSprintName.trim(),
          startDate: new Date(newSprintStart).toISOString(),
          endDate: new Date(newSprintEnd).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create sprint");
      return res.json();
    },
    onSuccess: () => {
      setIsCreateSprintOpen(false);
      setNewSprintName("");
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      window.location.reload();
    },
  });

  const toggleCollapse = (id: string) => {
    setCollapsedContainers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragStart = (e: DragStartEvent) => {
    const found = issues.find((i) => i.id === e.active.id);
    if (found) setActiveIssue(found);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveIssue(null);
    if (!over) return;

    const issueId = active.id as string;
    const overId = over.id as string;

    // Target container can be "backlog" or a cycle.id or another issue in that container
    let targetCycleId: string | null = null;
    if (overId === "container-backlog") {
      targetCycleId = null;
    } else if (overId.startsWith("container-cycle-")) {
      targetCycleId = overId.replace("container-cycle-", "");
    } else {
      // Dropped onto another issue: find its cycleId
      const targetIssue = issues.find((i) => i.id === overId);
      if (targetIssue) {
        targetCycleId = targetIssue.cycleId || null;
      }
    }

    // Optimistic UI update
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, cycleId: targetCycleId } : i))
    );

    moveIssueMutation.mutate({ issueId, cycleId: targetCycleId });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-[#ffffff] p-6 space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">
            Backlog & Sprint Planning
          </h1>
          <p className="mt-1 text-xs text-[#6b7280]">
            Organize work items, size backlog story points, and plan upcoming release cycles for {project.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateSprintOpen(true)}
            className="flex items-center gap-1.5 text-xs border-[#e5e7eb] shadow-2xs hover:bg-[#f3f4f6]"
          >
            <Plus className="h-3.5 w-3.5 text-[#6b7280]" />
            <span>Create Sprint</span>
          </Button>

          <Button
            size="sm"
            onClick={() => openCreateIssue()}
            className="flex items-center gap-1.5 text-xs bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Issue</span>
          </Button>
        </div>
      </div>

      {/* Modal: Create Sprint */}
      {isCreateSprintOpen && (
        <div
          onClick={() => setIsCreateSprintOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-2xl space-y-4 text-xs font-sans text-[#111827]"
          >
            <h3 className="text-sm font-semibold text-[#111827]">Create Sprint</h3>
            <div>
              <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                Sprint Name
              </label>
              <Input
                placeholder="e.g. Sprint 16 (API Optimization)"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                className="text-xs"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={newSprintStart}
                  onChange={(e) => setNewSprintStart(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={newSprintEnd}
                  onChange={(e) => setNewSprintEnd(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateSprintOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newSprintName.trim() || createSprintMutation.isPending}
                onClick={() => createSprintMutation.mutate()}
                className="bg-[#3e63dd] text-white"
              >
                {createSprintMutation.isPending ? "Creating..." : "Create Sprint"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DndContext for drag-and-drop between sprints */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {/* 1. Active Sprint Container */}
          {activeCycle && (
            <SprintContainer
              cycle={activeCycle}
              issues={issuesByContainer[activeCycle.id] || []}
              projectIdentifier={project.identifier}
              status="active"
              isCollapsed={!!collapsedContainers[activeCycle.id]}
              onToggleCollapse={() => toggleCollapse(activeCycle.id)}
              onIssueClick={(id) => setActiveIssueId(id)}
              onAddIssue={() => openCreateIssue({ cycleId: activeCycle.id })}
            />
          )}

          {/* 2. Future Sprints */}
          {futureCycles.map((cycle) => (
            <SprintContainer
              key={cycle.id}
              cycle={cycle}
              issues={issuesByContainer[cycle.id] || []}
              projectIdentifier={project.identifier}
              status="future"
              isCollapsed={!!collapsedContainers[cycle.id]}
              onToggleCollapse={() => toggleCollapse(cycle.id)}
              onIssueClick={(id) => setActiveIssueId(id)}
              onAddIssue={() => openCreateIssue({ cycleId: cycle.id })}
            />
          ))}

          {/* 3. Backlog Pool */}
          <BacklogPoolContainer
            issues={issuesByContainer.backlog || []}
            projectIdentifier={project.identifier}
            isCollapsed={!!collapsedContainers.backlog}
            onToggleCollapse={() => toggleCollapse("backlog")}
            onIssueClick={(id) => setActiveIssueId(id)}
            onAddIssue={() => openCreateIssue({ cycleId: undefined })}
          />
        </div>

        {/* Drag Overlay for active card preview */}
        <DragOverlay>
          {activeIssue ? (
            <div className="flex items-center gap-3 rounded-lg border border-[#3e63dd] bg-white p-3 shadow-2xl scale-[1.02] opacity-95">
              <IssueTypeIcon type={activeIssue.type} />
              <span className="font-mono text-xs font-semibold text-[#111827]">
                {project.identifier}-{activeIssue.sequenceId}
              </span>
              <span className="text-xs text-[#374151] truncate max-w-md font-medium">
                {activeIssue.title}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Subcomponent: Sprint Container
interface SprintContainerProps {
  cycle: CycleWithMetrics;
  issues: IssueWithDetails[];
  projectIdentifier: string;
  status: "active" | "future";
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onIssueClick: (id: string) => void;
  onAddIssue: () => void;
}

function SprintContainer({
  cycle,
  issues,
  projectIdentifier,
  status,
  isCollapsed,
  onToggleCollapse,
  onIssueClick,
  onAddIssue,
}: SprintContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-cycle-${cycle.id}`,
  });

  const totalPoints = issues.reduce((acc, i) => acc + (i.estimate || 0), 0);
  const todoPoints = issues
    .filter((i) => i.state.group === StateGroup.UNSTARTED || i.state.group === StateGroup.BACKLOG)
    .reduce((acc, i) => acc + (i.estimate || 0), 0);
  const inProgressPoints = issues
    .filter((i) => i.state.group === StateGroup.STARTED)
    .reduce((acc, i) => acc + (i.estimate || 0), 0);
  const donePoints = issues
    .filter((i) => i.state.group === StateGroup.COMPLETED)
    .reduce((acc, i) => acc + (i.estimate || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border transition-all overflow-hidden bg-white shadow-2xs",
        status === "active" ? "border-emerald-200" : "border-[#e5e7eb]",
        isOver && "ring-2 ring-[#3e63dd] border-[#3e63dd]"
      )}
    >
      {/* Container Header */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b transition-colors cursor-pointer select-none",
          status === "active" ? "bg-emerald-50/40 border-emerald-100" : "bg-[#f8f9fa] border-[#e5e7eb]"
        )}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2.5">
          <button className="text-[#6b7280] hover:text-[#111827]">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {status === "active" ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Sprint
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Future Sprint
            </span>
          )}

          <h3 className="text-sm font-bold text-[#111827]">{cycle.name}</h3>

          <div className="flex items-center gap-1 text-[11px] text-[#6b7280]">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
            </span>
          </div>
        </div>

        {/* Capacity Badges & Actions */}
        <div className="flex items-center gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <span
              title="To Do Story Points"
              className="flex h-5 items-center justify-center rounded bg-[#f3f4f6] px-1.5 font-mono text-[11px] font-medium text-[#4b5563] border border-[#e5e7eb]"
            >
              {todoPoints}
            </span>
            <span
              title="In Progress Story Points"
              className="flex h-5 items-center justify-center rounded bg-blue-50 px-1.5 font-mono text-[11px] font-medium text-[#3e63dd] border border-blue-200"
            >
              {inProgressPoints}
            </span>
            <span
              title="Completed Story Points"
              className="flex h-5 items-center justify-center rounded bg-emerald-50 px-1.5 font-mono text-[11px] font-medium text-emerald-700 border border-emerald-200"
            >
              {donePoints}
            </span>
            <span className="text-[11px] font-medium text-[#6b7280] ml-1">
              ({issues.length} {issues.length === 1 ? "issue" : "issues"})
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onAddIssue}
            className="h-7 text-xs text-[#3e63dd] hover:bg-[#eff6ff]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add issue</span>
          </Button>
        </div>
      </div>

      {/* Droppable Body */}
      {!isCollapsed && (
        <div className="p-2 space-y-1 bg-white min-h-[50px]">
          <SortableContext
            items={issues.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {issues.length > 0 ? (
              issues.map((issue) => (
                <BacklogIssueRow
                  key={issue.id}
                  issue={issue}
                  projectIdentifier={projectIdentifier}
                  onClick={() => onIssueClick(issue.id)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center p-6 text-xs text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-lg">
                Drag issues here to plan this sprint
              </div>
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Backlog Pool Container
interface BacklogPoolContainerProps {
  issues: IssueWithDetails[];
  projectIdentifier: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onIssueClick: (id: string) => void;
  onAddIssue: () => void;
}

function BacklogPoolContainer({
  issues,
  projectIdentifier,
  isCollapsed,
  onToggleCollapse,
  onIssueClick,
  onAddIssue,
}: BacklogPoolContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "container-backlog",
  });

  const totalPoints = issues.reduce((acc, i) => acc + (i.estimate || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-[#e5e7eb] transition-all overflow-hidden bg-white shadow-2xs",
        isOver && "ring-2 ring-[#3e63dd] border-[#3e63dd]"
      )}
    >
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#f8f9fa] border-b border-[#e5e7eb] cursor-pointer select-none"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2.5">
          <button className="text-[#6b7280] hover:text-[#111827]">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <span className="flex h-5 items-center justify-center rounded bg-[#f3f4f6] px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4b5563] border border-[#e5e7eb]">
            Backlog Pool
          </span>
          <span className="text-xs text-[#6b7280]">
            {issues.length} {issues.length === 1 ? "issue" : "issues"} • {totalPoints} story points
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddIssue}
            className="h-7 text-xs text-[#3e63dd] hover:bg-[#eff6ff]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Issue</span>
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2 space-y-1 bg-white min-h-[60px]">
          <SortableContext
            items={issues.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {issues.length > 0 ? (
              issues.map((issue) => (
                <BacklogIssueRow
                  key={issue.id}
                  issue={issue}
                  projectIdentifier={projectIdentifier}
                  onClick={() => onIssueClick(issue.id)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center p-6 text-xs text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-lg">
                No backlog issues remaining. Good job!
              </div>
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Individual Issue Row in Backlog
interface BacklogIssueRowProps {
  issue: IssueWithDetails;
  projectIdentifier: string;
  onClick: () => void;
}

function BacklogIssueRow({
  issue,
  projectIdentifier,
  onClick,
}: BacklogIssueRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs shadow-2xs hover:border-[#cbd5e1] hover:bg-gray-50/60 transition-colors cursor-pointer select-none font-sans",
        isDragging && "opacity-30 border-[#3e63dd]"
      )}
    >
      {/* Left: Drag Handle, Type, Key, Title */}
      <div className="flex items-center gap-2.5 truncate">
        <span
          {...attributes}
          {...listeners}
          className="text-[#9ca3af] hover:text-[#111827] cursor-grab active:cursor-grabbing p-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        <IssueTypeIcon type={issue.type} />

        <span className="font-mono text-[11px] font-semibold text-[#6b7280] group-hover:text-[#111827] shrink-0">
          {projectIdentifier}-{issue.sequenceId}
        </span>

        <span className="truncate font-medium text-[#111827]">
          {issue.title}
        </span>

        {/* Component Tag */}
        {issue.component && (
          <span className="shrink-0 rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] font-medium text-[#4b5563] border border-[#e5e7eb]">
            {issue.component.name}
          </span>
        )}
      </div>

      {/* Right: State, Priority, Estimate, Assignee */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="px-2 py-0.5 rounded text-[10px] font-medium border"
          style={{
            backgroundColor: `${issue.state.color}15`,
            borderColor: `${issue.state.color}40`,
            color: issue.state.color,
          }}
        >
          {issue.state.name}
        </span>

        <PriorityIcon priority={issue.priority} size={14} />

        {issue.estimate !== null && issue.estimate !== undefined && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded bg-[#f3f4f6] px-1.5 font-mono text-[11px] font-bold text-[#374151] border border-[#e5e7eb]">
            {issue.estimate}
          </span>
        )}

        {/* Assignees Avatars */}
        <div className="flex -space-x-1">
          {issue.assignees && issue.assignees.length > 0 ? (
            issue.assignees.slice(0, 2).map(({ user }) => (
              <Avatar key={user.id} className="h-5 w-5 ring-1 ring-white">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                <AvatarFallback className="text-[9px] bg-[#e5e7eb] text-[#374151]">
                  {user.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <span className="h-5 w-5 rounded-full border border-dashed border-[#cbd5e1] flex items-center justify-center text-[10px] text-[#9ca3af]">
              -
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

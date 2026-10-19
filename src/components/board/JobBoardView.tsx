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
  DragOverEvent,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { State } from "@prisma/client";
import { IssueWithDetails, ProjectWithDetails, User } from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { IssueCard } from "@/components/kanban/IssueCard";
import { StateIcon } from "@/components/ui/StateIcon";
import { QuickAssignPopover } from "@/components/issues/QuickAssignPopover";
import { QuickStatePopover } from "@/components/issues/QuickStatePopover";
import {
  Users,
  Columns,
  ListFilter,
  Plus,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobBoardViewProps {
  issues: IssueWithDetails[];
  states: State[];
  project: ProjectWithDetails;
}

interface MemberColumnProps {
  id: string; // "unassigned" or user ID
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  memberId?: string;
  role?: string;
  issues: IssueWithDetails[];
  projectIdentifier: string;
  projectMembers: { user: Pick<User, "id" | "name" | "email" | "avatarUrl"> }[];
  states: State[];
  onAddTask: (memberId?: string) => void;
}

function MemberColumn({
  id,
  title,
  subtitle,
  avatarUrl,
  memberId,
  role,
  issues,
  projectIdentifier,
  projectMembers,
  states,
  onAddTask,
}: MemberColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "MemberColumn",
      memberId: id,
    },
  });

  const totalEstimate = useMemo(() => {
    return issues.reduce((acc, curr) => acc + (curr.estimate || 0), 0);
  }, [issues]);

  const completedCount = useMemo(() => {
    return issues.filter((i) => i.state?.group === "COMPLETED").length;
  }, [issues]);

  const progressPct = issues.length > 0 ? Math.round((completedCount / issues.length) * 100) : 0;

  return (
    <div className="flex h-full w-84 shrink-0 flex-col rounded-xl bg-[#f8f9fa] border border-[#e5e7eb] p-3 shadow-xs font-sans">
      {/* Member Column Header */}
      <div className="pb-3 border-b border-[#e5e7eb] mb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Circle */}
            {id === "unassigned" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-[#d1d5db] bg-white text-[#9ca3af] shadow-xs">
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
            ) : avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={title}
                className="h-8 w-8 shrink-0 rounded-full border border-[#e5e7eb] object-cover shadow-xs"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-[#3e63dd] shadow-xs">
                {title.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-xs font-semibold text-[#111827]">
                  {title}
                </h3>
                {role && (
                  <span className="shrink-0 rounded bg-[#eef0f2] px-1.5 py-0.2 text-[9px] font-semibold text-[#4b5563] uppercase">
                    {role}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="truncate text-[10px] text-[#6b7280]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => onAddTask(memberId)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#4b5563] hover:border-[#cbd5e1] hover:text-[#111827] hover:bg-gray-50 transition-colors shadow-xs cursor-pointer shrink-0"
            title={`Assign new task to ${title}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stats Row & Progress Bar */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#6b7280]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono font-medium text-[#111827]">
              <span>{issues.length}</span>
              <span className="text-[10px] font-normal text-[#6b7280]">tasks</span>
            </span>
            {totalEstimate > 0 && (
              <span className="flex items-center gap-1 rounded bg-white border border-[#e5e7eb] px-1.5 py-0.5 text-[10px] font-mono text-[#4b5563] shadow-xs">
                <span>{totalEstimate}</span>
                <span className="text-[#9ca3af]">pts</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#4b5563]">
            <span>{completedCount}/{issues.length} done</span>
            <span className="font-mono text-[#3e63dd]">({progressPct}%)</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
          <div
            className="h-full rounded-full bg-[#3e63dd] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-lg p-0.5 transition-colors min-h-[320px]",
          isOver ? "bg-[#eff6ff] ring-2 ring-[#3e63dd]/40" : ""
        )}
      >
        <SortableContext
          items={issues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              projectIdentifier={projectIdentifier}
              projectMembers={projectMembers}
              states={states}
            />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[#e5e7eb] p-6 text-center text-xs text-[#9ca3af] bg-white/50">
            <span>No tasks assigned</span>
            <button
              onClick={() => onAddTask(memberId)}
              className="mt-2 text-[11px] font-medium text-[#3e63dd] hover:underline cursor-pointer"
            >
              + Assign task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function JobBoardView({ issues: initialIssues, states, project }: JobBoardViewProps) {
  const queryClient = useQueryClient();
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);
  const [boardStyle, setBoardStyle] = useState<"columns" | "swimlanes">("columns");
  const [issues, setIssues] = useState<IssueWithDetails[]>(initialIssues);
  const [prevInitialIssues, setPrevInitialIssues] = useState<IssueWithDetails[]>(initialIssues);
  const [activeIssue, setActiveIssue] = useState<IssueWithDetails | null>(null);
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Record<string, boolean>>({});

  // Sync state if initial issues change
  if (initialIssues !== prevInitialIssues) {
    setPrevInitialIssues(initialIssues);
    setIssues(initialIssues);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation to persist reassignment
  const reassignIssueMutation = useMutation({
    mutationFn: async ({
      issueId,
      assigneeIds,
    }: {
      issueId: string;
      assigneeIds: string[];
    }) => {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeIds }),
      });
      if (!res.ok) throw new Error("Failed to reassign issue");
      return res.json();
    },
    onError: (err) => {
      console.error("Reassign rollback:", err);
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  // Project members list
  const projectMembers = project.members || [];

  // Group issues by assignee
  const unassignedIssues = useMemo(() => {
    return issues.filter((i) => !i.assignees || i.assignees.length === 0);
  }, [issues]);

  const memberIssueMap = useMemo(() => {
    const map = new Map<string, IssueWithDetails[]>();
    for (const m of projectMembers) {
      map.set(m.user.id, []);
    }
    for (const issue of issues) {
      if (issue.assignees && issue.assignees.length > 0) {
        for (const a of issue.assignees) {
          const list = map.get(a.user.id);
          if (list) {
            list.push(issue);
          }
        }
      }
    }
    return map;
  }, [issues, projectMembers]);

  // Overall Board Statistics
  const totalTasks = issues.length;
  const totalUnassigned = unassignedIssues.length;
  const totalPoints = useMemo(() => {
    return issues.reduce((acc, curr) => acc + (curr.estimate || 0), 0);
  }, [issues]);
  const completedTasks = useMemo(() => {
    return issues.filter((i) => i.state?.group === "COMPLETED").length;
  }, [issues]);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleDragStart = (event: DragStartEvent) => {
    const found = issues.find((i) => i.id === event.active.id);
    if (found) setActiveIssue(found);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    // Check if dragging over a member column
    const isOverUnassigned = overId === "unassigned";
    const isOverMemberCol = projectMembers.some((m) => m.user.id === overId);

    if (isOverUnassigned) {
      setIssues((prev) =>
        prev.map((i) => (i.id === activeId ? { ...i, assignees: [] } : i))
      );
    } else if (isOverMemberCol) {
      const targetMember = projectMembers.find((m) => m.user.id === overId);
      if (targetMember) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === activeId
              ? {
                  ...i,
                  assignees: [
                    {
                      id: "optimistic",
                      issueId: activeId,
                      userId: targetMember.user.id,
                      user: targetMember.user,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  ],
                }
              : i
          )
        );
      }
    } else {
      // Over another issue: mimic that issue's assignee
      const overIssue = issues.find((i) => i.id === overId);
      if (overIssue) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === activeId ? { ...i, assignees: overIssue.assignees } : i
          )
        );
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let targetAssigneeIds: string[] = [];

    if (overId === "unassigned") {
      targetAssigneeIds = [];
    } else if (projectMembers.some((m) => m.user.id === overId)) {
      targetAssigneeIds = [overId];
    } else {
      const overIssue = issues.find((i) => i.id === overId);
      if (overIssue) {
        targetAssigneeIds = (overIssue.assignees || []).map((a) => a.user.id);
      }
    }

    // Persist via mutation
    const original = initialIssues.find((i) => i.id === activeId);
    const originalIds = (original?.assignees || []).map((a) => a.user.id);
    const hasChanged =
      originalIds.length !== targetAssigneeIds.length ||
      !targetAssigneeIds.every((id) => originalIds.includes(id));

    if (hasChanged) {
      reassignIssueMutation.mutate({
        issueId: activeId,
        assigneeIds: targetAssigneeIds,
      });
    }
  };

  const toggleSwimlane = (key: string) => {
    setCollapsedSwimlanes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#ffffff] font-sans">
      {/* Workload Analytics & Board Style Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] bg-[#ffffff] px-5 py-2.5 shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#3e63dd] border border-blue-100 shadow-xs">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">
                Job Board / Assignee Management
              </h2>
              <p className="text-[11px] text-[#6b7280]">
                Grouped by team member • Drag and drop cards to reassign
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-[#e5e7eb]">
            <div className="flex items-center gap-1.5 text-xs text-[#4b5563]">
              <span className="font-semibold text-[#111827]">{totalTasks}</span>
              <span className="text-[#6b7280]">Total</span>
            </div>

            {totalUnassigned > 0 ? (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                <span>{totalUnassigned} Unassigned</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>All Assigned</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-[#4b5563]">
              <TrendingUp className="h-3.5 w-3.5 text-[#3e63dd]" />
              <span className="font-semibold text-[#111827]">{totalPoints}</span>
              <span className="text-[#6b7280]">Estimate pts</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#4b5563]">
              <span className="font-semibold text-[#111827]">{completionRate}%</span>
              <span className="text-[#6b7280]">Completed</span>
            </div>
          </div>
        </div>

        {/* View Switcher: Columns vs Swimlanes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-[#f3f4f6] p-0.5 border border-[#e5e7eb] text-xs">
            <button
              onClick={() => setBoardStyle("columns")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                boardStyle === "columns"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Member Columns</span>
            </button>

            <button
              onClick={() => setBoardStyle("swimlanes")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                boardStyle === "swimlanes"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Assignee Swimlanes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-x-auto p-4 bg-[#ffffff]">
        {boardStyle === "columns" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full gap-4 pb-4">
              {/* 1. Unassigned Column */}
              <MemberColumn
                id="unassigned"
                title="Unassigned"
                subtitle="Needs owner"
                issues={unassignedIssues}
                projectIdentifier={project.identifier}
                projectMembers={projectMembers}
                states={states}
                onAddTask={() => openCreateIssue()}
              />

              {/* 2. Columns per Project Member */}
              {projectMembers.map((m) => {
                const memberIssues = memberIssueMap.get(m.user.id) || [];
                return (
                  <MemberColumn
                    key={m.user.id}
                    id={m.user.id}
                    memberId={m.user.id}
                    title={m.user.name}
                    subtitle={m.user.email}
                    avatarUrl={m.user.avatarUrl}
                    role={m.role}
                    issues={memberIssues}
                    projectIdentifier={project.identifier}
                    projectMembers={projectMembers}
                    states={states}
                    onAddTask={(assigneeId) => openCreateIssue({ assigneeId })}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeIssue ? (
                <IssueCard
                  issue={activeIssue}
                  projectIdentifier={project.identifier}
                  projectMembers={projectMembers}
                  states={states}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          /* Assignee Swimlanes View: Grouped by Assignee with State Columns */
          <div className="flex flex-col gap-5 overflow-y-auto pb-8">
            {/* Unassigned Swimlane */}
            {unassignedIssues.length > 0 && (
              <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-xs overflow-hidden">
                <button
                  onClick={() => toggleSwimlane("unassigned")}
                  className="flex w-full items-center justify-between bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e5e7eb] hover:bg-[#f1f3f5] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {collapsedSwimlanes["unassigned"] ? (
                      <ChevronRight className="h-4 w-4 text-[#6b7280]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#6b7280]" />
                    )}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[#d1d5db] bg-white text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-[#111827]">
                      Unassigned Tasks
                    </span>
                    <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.2 text-[10px] font-bold text-amber-700">
                      {unassignedIssues.length}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#6b7280]">
                    Click to toggle
                  </span>
                </button>

                {!collapsedSwimlanes["unassigned"] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-white">
                    {unassignedIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        projectIdentifier={project.identifier}
                        projectMembers={projectMembers}
                        states={states}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Member Swimlanes */}
            {projectMembers.map((m) => {
              const memberIssues = memberIssueMap.get(m.user.id) || [];
              const isCollapsed = collapsedSwimlanes[m.user.id];
              const totalEst = memberIssues.reduce((a, c) => a + (c.estimate || 0), 0);

              return (
                <div
                  key={m.user.id}
                  className="rounded-xl border border-[#e5e7eb] bg-white shadow-xs overflow-hidden"
                >
                  <div className="flex items-center justify-between bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e5e7eb]">
                    <button
                      onClick={() => toggleSwimlane(m.user.id)}
                      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer text-left"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-[#6b7280]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6b7280]" />
                      )}

                      {m.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.user.avatarUrl}
                          alt={m.user.name}
                          className="h-6 w-6 rounded-full border border-[#e5e7eb] object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[10px] font-bold text-[#3e63dd]">
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span className="text-xs font-semibold text-[#111827]">
                        {m.user.name}
                      </span>
                      <span className="rounded-full bg-white border border-[#e5e7eb] px-2 py-0.2 text-[10px] font-mono text-[#6b7280] shadow-xs">
                        {memberIssues.length} tasks
                      </span>
                      {totalEst > 0 && (
                        <span className="rounded bg-white border border-[#e5e7eb] px-1.5 py-0.2 text-[10px] font-mono text-[#4b5563]">
                          {totalEst} pts
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => openCreateIssue({ assigneeId: m.user.id })}
                      className="flex items-center gap-1 rounded border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-medium text-[#4b5563] hover:text-[#111827] hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add task for {m.user.name.split(" ")[0]}</span>
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="p-3 bg-[#fafbfc]">
                      {memberIssues.length === 0 ? (
                        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[#e5e7eb] bg-white text-xs text-[#9ca3af]">
                          No tasks assigned to {m.user.name}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {memberIssues.map((issue) => (
                            <IssueCard
                              key={issue.id}
                              issue={issue}
                              projectIdentifier={project.identifier}
                              projectMembers={projectMembers}
                              states={states}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

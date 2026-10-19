"use client";

import React, { useState } from "react";
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
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { State } from "@prisma/client";
import { IssueWithDetails, User } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { IssueCard } from "./IssueCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface KanbanBoardProps {
  states: State[];
  initialIssues: IssueWithDetails[];
  projectIdentifier: string;
  projectMembers?: { user: Pick<User, "id" | "name" | "email" | "avatarUrl"> }[];
}

export function KanbanBoard({
  states,
  initialIssues,
  projectIdentifier,
  projectMembers,
}: KanbanBoardProps) {
  const [prevInitialIssues, setPrevInitialIssues] = useState<IssueWithDetails[]>(initialIssues);
  const [issues, setIssues] = useState<IssueWithDetails[]>(initialIssues);
  const [activeIssue, setActiveIssue] = useState<IssueWithDetails | null>(null);
  const queryClient = useQueryClient();

  // Sync state during render when initialIssues reference changes
  if (initialIssues !== prevInitialIssues) {
    setPrevInitialIssues(initialIssues);
    setIssues(initialIssues);
  }

  // Configure sensors with 5px distance constraint for fluid distinction between click & drag
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

  // Mutation to persist stateId update
  const updateIssueStateMutation = useMutation({
    mutationFn: async ({
      issueId,
      stateId,
    }: {
      issueId: string;
      stateId: string;
    }) => {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateId }),
      });
      if (!res.ok) throw new Error("Failed to update issue state");
      return res.json();
    },
    onError: (err) => {
      console.error("Optimistic rollback:", err);
      // Rollback to server state
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["states"] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = issues.find((i) => i.id === active.id);
    if (found) {
      setActiveIssue(found);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Check if dragging over a column directly or over another issue
    const isOverAColumn = states.some((s) => s.id === overId);
    const activeIssueItem = issues.find((i) => i.id === activeId);

    if (!activeIssueItem) return;

    if (isOverAColumn) {
      const targetStateId = overId;
      if (activeIssueItem.stateId !== targetStateId) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === activeId ? { ...i, stateId: targetStateId } : i
          )
        );
      }
    } else {
      // Over another issue
      const overIssueItem = issues.find((i) => i.id === overId);
      if (overIssueItem && activeIssueItem.stateId !== overIssueItem.stateId) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === activeId ? { ...i, stateId: overIssueItem.stateId } : i
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

    const activeIssueItem = issues.find((i) => i.id === activeId);
    if (!activeIssueItem) return;

    let targetStateId = activeIssueItem.stateId;

    if (states.some((s) => s.id === overId)) {
      targetStateId = overId;
    } else {
      const overIssueItem = issues.find((i) => i.id === overId);
      if (overIssueItem) {
        targetStateId = overIssueItem.stateId;
      }
    }

    // Trigger background mutation if state changed
    const originalIssue = initialIssues.find((i) => i.id === activeId);
    if (originalIssue && originalIssue.stateId !== targetStateId) {
      updateIssueStateMutation.mutate({
        issueId: activeId,
        stateId: targetStateId,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full gap-4 overflow-x-auto pb-4 pt-1">
        {states.map((state) => {
          const columnIssues = issues.filter((i) => i.stateId === state.id);
          return (
            <KanbanColumn
              key={state.id}
              state={state}
              issues={columnIssues}
              projectIdentifier={projectIdentifier}
              projectMembers={projectMembers}
              states={states}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeIssue ? (
          <IssueCard
            issue={activeIssue}
            projectIdentifier={projectIdentifier}
            projectMembers={projectMembers}
            states={states}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

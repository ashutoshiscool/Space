"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { State, IssuePriority } from "@prisma/client";
import { IssueWithDetails } from "@/lib/types";
import { IssueCard } from "./IssueCard";
import { Plus } from "lucide-react";
import { useSpaceStore } from "@/lib/store";

interface KanbanColumnProps {
  state: State;
  issues: IssueWithDetails[];
  projectIdentifier: string;
}

export function KanbanColumn({
  state,
  issues,
  projectIdentifier,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: state.id,
    data: {
      type: "Column",
      state,
    },
  });

  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);

  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-[#0c0c0e]/80 border border-zinc-800/60 p-2.5 backdrop-blur-xs">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full ring-2 ring-zinc-800"
            style={{ backgroundColor: state.color }}
          />
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            {state.name}
          </h3>
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-800 px-1 text-[10px] font-medium text-zinc-400">
            {issues.length}
          </span>
        </div>

        <button
          onClick={() => openCreateIssue({ stateId: state.id })}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
          title={`Add issue to ${state.name}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Issues Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1 transition-colors min-h-[300px] ${
          isOver ? "bg-zinc-800/30 ring-1 ring-indigo-500/50" : ""
        }`}
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
            />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800/60 p-6 text-center text-xs text-zinc-500">
            <span>No issues</span>
          </div>
        )}
      </div>
    </div>
  );
}

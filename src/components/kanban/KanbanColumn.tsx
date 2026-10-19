"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IssueWithDetails, User, State } from "@/lib/types";
import { IssueCard } from "./IssueCard";
import { StateIcon } from "@/components/ui/StateIcon";
import { Plus } from "lucide-react";
import { useSpaceStore } from "@/lib/store";

interface KanbanColumnProps {
  state: State;
  issues: IssueWithDetails[];
  projectIdentifier: string;
  projectMembers?: { user: Pick<User, "id" | "name" | "email" | "avatarUrl"> }[];
  states?: State[];
}

export function KanbanColumn({
  state,
  issues,
  projectIdentifier,
  projectMembers,
  states,
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
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-[#f8f9fa] border border-[#e5e7eb] p-2.5 shadow-xs font-sans">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2.5 px-1 border-b border-[#e5e7eb] mb-2">
        <div className="flex items-center gap-2">
          <StateIcon group={state.group} color={state.color} size={14} />
          <h3 className="text-xs font-semibold text-[#111827] uppercase tracking-wider">
            {state.name}
          </h3>
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white border border-[#e5e7eb] px-1.5 text-[10px] font-mono text-[#6b7280] shadow-xs">
            {issues.length}
          </span>
        </div>

        <button
          onClick={() => openCreateIssue({ stateId: state.id })}
          className="rounded p-1 text-[#6b7280] hover:bg-[#eef0f2] hover:text-[#111827] transition-colors cursor-pointer"
          title={`Add issue to ${state.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Issues Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-0.5 transition-colors min-h-[300px] ${
          isOver ? "bg-[#eff6ff] ring-1 ring-[#3e63dd]/40" : ""
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
              projectMembers={projectMembers}
              states={states}
            />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[#e5e7eb] p-6 text-center text-xs text-[#9ca3af]">
            <span>No issues</span>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSpaceStore } from "@/lib/store";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";
import { State } from "@prisma/client";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { IssueListView } from "@/components/list/IssueListView";
import { RoadmapView } from "@/components/roadmap/RoadmapView";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IssuesPageClientProps {
  initialIssues: IssueWithDetails[];
  states: State[];
  project: ProjectWithDetails;
}

export function IssuesPageClient({
  initialIssues,
  states,
  project,
}: IssuesPageClientProps) {
  const viewMode = useSpaceStore((s) => s.viewMode);
  const filters = useSpaceStore((s) => s.filters);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);

  // Fetch live issues query
  const { data: issuesData } = useQuery<{ issues: IssueWithDetails[] }>({
    queryKey: ["issues", project.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/issues`);
      if (!res.ok) throw new Error("Failed to load issues");
      return res.json();
    },
    initialData: { issues: initialIssues },
    staleTime: 5000,
  });

  const allIssues = issuesData?.issues || initialIssues;

  // Apply in-memory filters for instantaneous sub-10ms response
  const filteredIssues = useMemo(() => {
    return allIssues.filter((issue) => {
      // 1. Search filter (title, sequenceId)
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesKey = `${project.identifier}-${issue.sequenceId}`
          .toLowerCase()
          .includes(query);
        if (!matchesTitle && !matchesKey) return false;
      }

      // 2. Priority filter
      if (
        filters.priorities.length > 0 &&
        !filters.priorities.includes(issue.priority)
      ) {
        return false;
      }

      // 3. State filter
      if (
        filters.stateIds.length > 0 &&
        !filters.stateIds.includes(issue.stateId)
      ) {
        return false;
      }

      // 4. Assignee filter
      if (filters.assigneeIds.length > 0) {
        const hasAssignee = issue.assignees?.some((a) =>
          filters.assigneeIds.includes(a.user.id)
        );
        if (!hasAssignee) return false;
      }

      // 5. Cycle filter
      if (filters.cycleId && issue.cycleId !== filters.cycleId) {
        return false;
      }

      // 6. Module filter
      if (filters.moduleId && issue.moduleId !== filters.moduleId) {
        return false;
      }

      return true;
    });
  }, [allIssues, filters, project.identifier]);

  if (allIssues.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-indigo-400 mb-4 shadow-sm">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-100">No issues yet</h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-sm leading-relaxed">
          Get started by creating your first issue in {project.name}. Hit{" "}
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[10px]">C</kbd> anywhere or click below.
        </p>
        <Button
          onClick={() => openCreateIssue()}
          className="mt-5 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Create first issue</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {viewMode === "kanban" && (
        <KanbanBoard
          states={states}
          initialIssues={filteredIssues}
          projectIdentifier={project.identifier}
        />
      )}

      {viewMode === "list" && (
        <IssueListView
          issues={filteredIssues}
          states={states}
          members={project.members}
          projectIdentifier={project.identifier}
        />
      )}

      {viewMode === "roadmap" && (
        <RoadmapView
          issues={filteredIssues}
          modules={project.modules}
          project={project}
        />
      )}
    </div>
  );
}

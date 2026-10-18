"use client";

import React, { useEffect } from "react";
import { Command } from "cmdk";
import { useSpaceStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";
import {
  Search,
  PlusCircle,
  FolderKanban,
  RotateCcw,
  Layers,
  FileText,
  Settings,
  SunMoon,
} from "lucide-react";
import { getPriorityMeta, cn } from "@/lib/utils";

interface CommandPaletteProps {
  currentProject?: ProjectWithDetails;
  workspaceSlug?: string;
}

export function CommandPalette({ currentProject, workspaceSlug }: CommandPaletteProps) {
  const isCommandOpen = useSpaceStore((s) => s.isCommandOpen);
  const setCommandOpen = useSpaceStore((s) => s.setCommandOpen);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const router = useRouter();

  // Search issues within current project
  const { data: issuesData } = useQuery<{ issues: IssueWithDetails[] }>({
    queryKey: ["issues", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return { issues: [] };
      const res = await fetch(`/api/projects/${currentProject.id}/issues`);
      if (!res.ok) return { issues: [] };
      return res.json();
    },
    enabled: !!currentProject?.id && isCommandOpen,
  });

  const issues = issuesData?.issues || [];

  if (!isCommandOpen) return null;

  const navigateTo = (path: string) => {
    setCommandOpen(false);
    router.push(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-xs pt-[15vh] p-4 animate-in fade-in-0 duration-150"
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full">
          {/* Input Header */}
          <div className="flex items-center border-b border-zinc-800 px-4">
            <Search className="mr-2.5 h-4 w-4 shrink-0 text-zinc-400" />
            <Command.Input
              autoFocus
              placeholder="Type a command or search issues..."
              className="flex h-12 w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <kbd className="hidden rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 text-xs">
            <Command.Empty className="py-6 text-center text-zinc-500">
              No matching results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Actions" className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <Command.Item
                onSelect={() => {
                  setCommandOpen(false);
                  openCreateIssue();
                }}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-200 aria-selected:bg-indigo-600 aria-selected:text-white cursor-pointer transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New Issue</span>
                <kbd className="ml-auto rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono">
                  C
                </kbd>
              </Command.Item>
            </Command.Group>

            {/* Views Navigation */}
            {workspaceSlug && currentProject && (
              <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <Command.Item
                  onSelect={() =>
                    navigateTo(`/${workspaceSlug}/${currentProject.identifier}/issues`)
                  }
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-200 aria-selected:bg-indigo-600 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>Issues (Kanban & List)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    navigateTo(`/${workspaceSlug}/${currentProject.identifier}/cycles`)
                  }
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-200 aria-selected:bg-indigo-600 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Cycles (Sprints & Burndown)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    navigateTo(`/${workspaceSlug}/${currentProject.identifier}/modules`)
                  }
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-200 aria-selected:bg-indigo-600 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <Layers className="h-4 w-4" />
                  <span>Modules (Epics & Initiatives)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    navigateTo(`/${workspaceSlug}/${currentProject.identifier}/roadmap`)
                  }
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-200 aria-selected:bg-indigo-600 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>Roadmap (Gantt & Milestones)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    navigateTo(`/${workspaceSlug}/${currentProject.identifier}/pages`)
                  }
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-200 aria-selected:bg-indigo-600 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Collaborative Docs (Pages)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    navigateTo(`/${workspaceSlug}/settings`)
                  }
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-200 aria-selected:bg-indigo-600 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Workspace Settings & Members</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Issue Items Search */}
            {issues.length > 0 && currentProject && (
              <Command.Group heading="Issues" className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {issues.slice(0, 15).map((issue) => {
                  const meta = getPriorityMeta(issue.priority);
                  return (
                    <Command.Item
                      key={issue.id}
                      value={`${currentProject.identifier}-${issue.sequenceId} ${issue.title}`}
                      onSelect={() => {
                        setCommandOpen(false);
                        setActiveIssueId(issue.id);
                      }}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-zinc-200 aria-selected:bg-indigo-600 aria-selected:text-white cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] font-semibold text-zinc-400">
                          {currentProject.identifier}-{issue.sequenceId}
                        </span>
                        <span className="truncate">{issue.title}</span>
                      </div>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0"
                        style={{
                          backgroundColor: `${issue.state.color}20`,
                          color: issue.state.color,
                        }}
                      >
                        {issue.state.name}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

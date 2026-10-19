"use client";

import React from "react";
import { Command } from "cmdk";
import { useSpaceStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";
import {
  Search,
  Plus,
  Layers,
  RefreshCw,
  FolderKanban,
  FileText,
  Settings,
  LayoutGrid,
  BarChart2,
  StickyNote,
} from "lucide-react";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";

interface CommandPaletteProps {
  currentProject?: ProjectWithDetails;
  workspaceSlug?: string;
}

export function CommandPalette({ currentProject, workspaceSlug }: CommandPaletteProps) {
  const isCommandOpen = useSpaceStore((s) => s.isCommandOpen);
  const setCommandOpen = useSpaceStore((s) => s.setCommandOpen);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const toggleStickies = useSpaceStore((s) => s.toggleStickies);
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-xs pt-[15vh] p-4 animate-in fade-in-0 duration-150 font-sans"
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-2xl text-[#111827]"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full">
          {/* Input Header */}
          <div className="flex items-center border-b border-[#e5e7eb] px-4">
            <Search className="mr-2.5 h-4 w-4 shrink-0 text-[#6b7280]" />
            <Command.Input
              autoFocus
              placeholder="Type a command or search issues..."
              className="flex h-11 w-full bg-transparent text-xs text-[#111827] outline-none placeholder:text-[#9ca3af]"
            />
            <kbd className="hidden rounded bg-[#f3f4f6] border border-[#e5e7eb] px-1.5 py-0.5 text-[10px] font-mono text-[#6b7280] sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 text-xs">
            <Command.Empty className="py-6 text-center text-[#9ca3af] text-xs">
              No matching results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Actions" className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
              <Command.Item
                onSelect={() => {
                  setCommandOpen(false);
                  openCreateIssue();
                }}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-[#6b7280]" />
                <span>Create New Issue</span>
                <kbd className="ml-auto rounded bg-[#f3f4f6] border border-[#e5e7eb] px-1 py-0.2 text-[9px] font-mono text-[#6b7280]">
                  C
                </kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setCommandOpen(false);
                  toggleStickies();
                }}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
              >
                <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                <span>Open Stickies Scratchpad</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation Shortcuts */}
            {workspaceSlug && currentProject && (
              <Command.Group heading="Navigation" className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mt-2">
                <Command.Item
                  onSelect={() => navigateTo(`/${workspaceSlug}/${currentProject.identifier}/issues`)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
                >
                  <Layers className="h-3.5 w-3.5 text-[#6b7280]" />
                  <span>Issues (Kanban & List)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/${workspaceSlug}/${currentProject.identifier}/cycles`)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#6b7280]" />
                  <span>Go to Cycles</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/${workspaceSlug}/${currentProject.identifier}/modules`)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
                >
                  <FolderKanban className="h-3.5 w-3.5 text-[#6b7280]" />
                  <span>Go to Modules</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/${workspaceSlug}/${currentProject.identifier}/views`)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-[#6b7280]" />
                  <span>Go to Views</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/${workspaceSlug}/${currentProject.identifier}/pages`)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-[#6b7280]" />
                  <span>Go to Pages</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/${workspaceSlug}/${currentProject.identifier}/analytics`)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
                >
                  <BarChart2 className="h-3.5 w-3.5 text-[#6b7280]" />
                  <span>Go to Analytics</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/${workspaceSlug}/settings`)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-[#6b7280]" />
                  <span>Workspace Settings</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Issues List */}
            {issues.length > 0 && (
              <Command.Group heading="Project Issues" className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mt-2">
                {issues.map((issue) => (
                  <Command.Item
                    key={issue.id}
                    value={`${currentProject?.identifier}-${issue.sequenceId} ${issue.title}`}
                    onSelect={() => {
                      setCommandOpen(false);
                      setActiveIssueId(issue.id);
                    }}
                    className="flex items-center justify-between rounded-md px-2.5 py-2 text-[#374151] aria-selected:bg-[#f3f4f6] aria-selected:text-[#111827] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <PriorityIcon priority={issue.priority} size={13} />
                      <span className="font-mono text-[10px] text-[#6b7280]">
                        {currentProject?.identifier}-{issue.sequenceId}
                      </span>
                      <span className="truncate">{issue.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {issue.state && (
                        <span className="flex items-center gap-1 rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] text-[#4b5563] border border-[#e5e7eb]">
                          <StateIcon group={issue.state.group} color={issue.state.color} size={10} />
                          <span>{issue.state.name}</span>
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
} from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { IssuePriority } from "@prisma/client";
import { getPriorityMeta, cn } from "@/lib/utils";
import { NotificationPopover } from "./NotificationPopover";
import {
  Kanban,
  List,
  Compass,
  Search,
  Filter,
  X,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface WorkspaceHeaderProps {
  workspace: WorkspaceWithDetails;
  project: ProjectWithDetails;
}

export function WorkspaceHeader({
  workspace,
  project,
}: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const viewMode = useSpaceStore((s) => s.viewMode);
  const setViewMode = useSpaceStore((s) => s.setViewMode);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);

  const filters = useSpaceStore((s) => s.filters);
  const setSearch = useSpaceStore((s) => s.setSearch);
  const togglePriorityFilter = useSpaceStore((s) => s.togglePriorityFilter);
  const toggleStateFilter = useSpaceStore((s) => s.toggleStateFilter);
  const toggleAssigneeFilter = useSpaceStore((s) => s.toggleAssigneeFilter);
  const clearFilters = useSpaceStore((s) => s.clearFilters);

  const isIssuesView = pathname.endsWith("/issues");

  const hasActiveFilters =
    filters.search ||
    filters.priorities.length > 0 ||
    filters.stateIds.length > 0 ||
    filters.assigneeIds.length > 0;

  return (
    <header className="flex flex-col border-b border-zinc-800/80 bg-[#0c0c0e]/95 backdrop-blur-md px-6 py-3 space-y-3 z-30 shrink-0">
      {/* Top bar: Breadcrumbs and Right actions */}
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <span className="text-zinc-200">{workspace.name}</span>
          <span className="text-zinc-600">/</span>
          <span className="flex items-center gap-1.5 text-zinc-200">
            <span>{project.icon || "🚀"}</span>
            <span>{project.name}</span>
            <span className="font-mono text-zinc-500 text-[10px]">({project.identifier})</span>
          </span>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-3">
          <NotificationPopover />

          <Button
            size="sm"
            onClick={() => openCreateIssue()}
            className="flex items-center gap-1.5 h-8 text-xs font-semibold shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Issue</span>
          </Button>
        </div>
      </div>

      {/* Secondary Bar: View Switcher (Kanban vs List vs Roadmap) & Filters */}
      {isIssuesView && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-zinc-900/90 p-1 border border-zinc-800/80 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer",
                viewMode === "kanban"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer",
                viewMode === "list"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>

            <button
              onClick={() => setViewMode("roadmap")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer",
                viewMode === "roadmap"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Roadmap</span>
            </button>
          </div>

          {/* Filter Bar Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter issues..."
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 rounded-lg border border-zinc-800 bg-zinc-900/80 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 w-44 focus:w-56 transition-all"
              />
            </div>

            {/* Priority Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer outline-none">
                <SlidersHorizontal className="h-3 w-3 text-zinc-500" />
                <span>Priority</span>
                {filters.priorities.length > 0 && (
                  <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                    {filters.priorities.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.values(IssuePriority).map((prio) => {
                  const meta = getPriorityMeta(prio);
                  return (
                    <DropdownMenuCheckboxItem
                      key={prio}
                      checked={filters.priorities.includes(prio)}
                      onCheckedChange={() => togglePriorityFilter(prio)}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                      <span>{meta.label}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* State Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer outline-none">
                <Filter className="h-3 w-3 text-zinc-500" />
                <span>State</span>
                {filters.stateIds.length > 0 && (
                  <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                    {filters.stateIds.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {project.states.map((st) => (
                  <DropdownMenuCheckboxItem
                    key={st.id}
                    checked={filters.stateIds.includes(st.id)}
                    onCheckedChange={() => toggleStateFilter(st.id)}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: st.color }}
                    />
                    <span>{st.name}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Assignee Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer outline-none">
                <span>Assignee</span>
                {filters.assigneeIds.length > 0 && (
                  <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                    {filters.assigneeIds.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {project.members.map(({ user }) => (
                  <DropdownMenuCheckboxItem
                    key={user.id}
                    checked={filters.assigneeIds.includes(user.id)}
                    onCheckedChange={() => toggleAssigneeFilter(user.id)}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span>{user.name}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer pl-1"
              >
                <X className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

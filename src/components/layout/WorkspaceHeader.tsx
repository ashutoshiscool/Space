"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  IssuePriority,
} from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NotificationPopover } from "./NotificationPopover";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import {
  Plus,
  Search,
  Kanban,
  List,
  Calendar,
  Table,
  Milestone,
  Download,
  Filter,
  X,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
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

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/issues`);
      if (!res.ok) return;
      const data = await res.json();
      const issues = data.issues || [];
      const headers = ["Identifier", "Title", "State", "Priority", "Assignees", "Estimate", "Due Date", "Created At"];
      const rows = issues.map((i: { sequenceId: number; title: string; state?: { name: string }; priority: string; assignees?: { user?: { name: string } }[]; estimate?: number | null; dueDate?: string | null; createdAt: string }) => [
        `"${project.identifier}-${i.sequenceId}"`,
        `"${(i.title || "").replace(/"/g, '""')}"`,
        `"${i.state?.name || ""}"`,
        `"${i.priority}"`,
        `"${(i.assignees || []).map((a) => a.user?.name).filter(Boolean).join(", ")}"`,
        i.estimate || "",
        i.dueDate ? new Date(i.dueDate).toISOString().split("T")[0] : "",
        new Date(i.createdAt).toISOString().split("T")[0],
      ]);
      const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${project.identifier}-issues.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // ignore
    }
  };

  return (
    <header className="flex flex-col border-b border-[#e5e7eb] bg-white px-5 py-2.5 space-y-2.5 z-30 shrink-0 font-sans">
      {/* Top bar: Breadcrumbs and Right actions */}
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#6b7280] font-medium">
          <span className="text-[#111827] font-semibold">{workspace.name}</span>
          <span className="text-[#d1d5db]">/</span>
          <span className="flex items-center gap-1.5 text-[#111827] font-semibold">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-white border border-[#e5e7eb] text-[9px] font-bold text-[#111827] font-mono shrink-0 shadow-xs">
              {project.identifier.slice(0, 2)}
            </span>
            <span>{project.name}</span>
            <span className="font-mono text-[#6b7280] text-[10px] font-normal">({project.identifier})</span>
          </span>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-2.5">
          <NotificationPopover />

          <Button
            size="sm"
            onClick={() => openCreateIssue()}
            className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-[#3e63dd] hover:bg-[#3451b2] text-white rounded-md shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Issue</span>
          </Button>
        </div>
      </div>

      {/* Secondary Bar: View Switcher (Kanban vs List vs Roadmap) & Filters */}
      {isIssuesView && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-[#f3f4f6] p-0.5 border border-[#e5e7eb] text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                viewMode === "kanban"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                viewMode === "list"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>

            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                viewMode === "calendar"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setViewMode("spreadsheet")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                viewMode === "spreadsheet"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Spreadsheet</span>
            </button>

            <button
              onClick={() => setViewMode("roadmap")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                viewMode === "roadmap"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              <Milestone className="h-3.5 w-3.5" />
              <span>Roadmap</span>
            </button>

            <button
              onClick={() => setViewMode("jobboard")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                viewMode === "jobboard"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              <Users className="h-3.5 w-3.5 text-[#3e63dd]" />
              <span>Job Board</span>
            </button>
          </div>

          {/* Filter Bar Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6b7280]" />
              <input
                type="text"
                placeholder="Filter issues..."
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 rounded-md border border-[#e5e7eb] bg-white pl-8 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3e63dd] w-44 focus:w-56 transition-all shadow-xs"
              />
            </div>

            {/* Priority Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs text-[#4b5563] hover:bg-gray-50 hover:text-[#111827] shadow-xs transition-colors cursor-pointer outline-none">
                <Filter className="h-3 w-3 text-[#6b7280]" />
                <span>Priority</span>
                {filters.priorities.length > 0 && (
                  <span className="rounded-full bg-[#3e63dd] px-1.5 text-[10px] font-bold text-white">
                    {filters.priorities.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-[#e5e7eb] text-[#111827] shadow-xl">
                {Object.values(IssuePriority).map((prio) => {
                  const p = prio as IssuePriority;
                  return (
                    <DropdownMenuCheckboxItem
                      key={p}
                      checked={filters.priorities.includes(p)}
                      onCheckedChange={() => togglePriorityFilter(p)}
                      className="flex items-center gap-2 text-xs hover:bg-[#f3f4f6] cursor-pointer"
                    >
                      <PriorityIcon priority={p} size={14} />
                      <span className="capitalize">{p.toLowerCase()}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* State Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs text-[#4b5563] hover:bg-gray-50 hover:text-[#111827] shadow-xs transition-colors cursor-pointer outline-none">
                <span>State</span>
                {filters.stateIds.length > 0 && (
                  <span className="rounded-full bg-[#3e63dd] px-1.5 text-[10px] font-bold text-white">
                    {filters.stateIds.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-[#e5e7eb] text-[#111827] shadow-xl">
                {project.states.map((st) => (
                  <DropdownMenuCheckboxItem
                    key={st.id}
                    checked={filters.stateIds.includes(st.id)}
                    onCheckedChange={() => toggleStateFilter(st.id)}
                    className="flex items-center gap-2 text-xs hover:bg-[#f3f4f6] cursor-pointer"
                  >
                    <StateIcon group={st.group} color={st.color} size={14} />
                    <span>{st.name}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Assignee Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs text-[#4b5563] hover:bg-gray-50 hover:text-[#111827] shadow-xs transition-colors cursor-pointer outline-none">
                <span>Assignee</span>
                {filters.assigneeIds.length > 0 && (
                  <span className="rounded-full bg-[#3e63dd] px-1.5 text-[10px] font-bold text-white">
                    {filters.assigneeIds.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-[#e5e7eb] text-[#111827] shadow-xl">
                {(workspace.members || []).map((m) => (
                  <DropdownMenuCheckboxItem
                    key={m.user.id}
                    checked={filters.assigneeIds.includes(m.user.id)}
                    onCheckedChange={() => toggleAssigneeFilter(m.user.id)}
                    className="flex items-center gap-2 text-xs hover:bg-[#f3f4f6] cursor-pointer"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827] text-[9px] font-semibold border border-[#e5e7eb]">
                      {m.user.name.substring(0, 1)}
                    </span>
                    <span>{m.user.name}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}

            {/* Export CSV Button (Matching E2E Assertion) */}
            <button
              onClick={handleExportCSV}
              className="flex h-8 items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white hover:bg-gray-50 px-2.5 text-xs text-[#4b5563] hover:text-[#111827] shadow-xs transition-colors cursor-pointer"
              title="Export issues to CSV"
            >
              <Download className="h-3.5 w-3.5 text-[#6b7280]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

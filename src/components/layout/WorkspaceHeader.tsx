"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SpaceViewsFlyout, SPACE_VIEWS } from "./SpaceViewsFlyout";
import { useQuery } from "@tanstack/react-query";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  IssuePriority,
  Component,
} from "@/lib/types";
import { IssueType } from "@prisma/client";
import { useSpaceStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NotificationPopover } from "./NotificationPopover";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { IssueTypeIcon } from "@/components/issues/IssueTypeIcon";
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
  Box,
  Flame,
  Zap,
  Globe,
  TrendingUp,
  ListTodo,
  RefreshCw,
  Share2,
  Star,
  Maximize2,
  Minimize2,
  Check,
  FileText,
  Inbox,
  Archive,
  MoreHorizontal,
  Code2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface WorkspaceHeaderProps {
  workspace: WorkspaceWithDetails;
  project: ProjectWithDetails;
}

export function WorkspaceHeader({
  workspace,
  project,
}: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const viewMode = useSpaceStore((s) => s.viewMode);
  const setViewMode = useSpaceStore((s) => s.setViewMode);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);

  const [isStarred, setIsStarred] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleToggleFullscreen = () => {
    if (typeof document !== "undefined") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const projectBaseUrl = `/${workspace.slug}/${project.identifier}`;

  const [pinnedTabIds, setPinnedTabIds] = useState<string[]>([]);
  const [viewsFlyoutOpen, setViewsFlyoutOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`space_pinned_tabs_${project.id}`);
      if (saved) {
        setPinnedTabIds(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [project.id]);

  const handleTogglePin = (viewId: string) => {
    setPinnedTabIds((prev) => {
      const updated = prev.includes(viewId)
        ? prev.filter((id) => id !== viewId)
        : [...prev, viewId];
      try {
        localStorage.setItem(`space_pinned_tabs_${project.id}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const prefix = project.identifier || project.name;
  const horizontalTabs = [
    {
      id: "summary",
      label: `${prefix} Summary`,
      href: `${projectBaseUrl}/summary`,
      icon: Globe,
      isActive: pathname.endsWith("/summary"),
    },
    {
      id: "stats",
      label: `${prefix} Stats`,
      href: `${projectBaseUrl}/analytics`,
      icon: TrendingUp,
      isActive: pathname.endsWith("/analytics"),
    },
    {
      id: "tasks",
      label: `${prefix} Preview Task List`,
      href: `${projectBaseUrl}/issues`,
      icon: List,
      isActive: pathname.endsWith("/issues") && viewMode === "list",
      onClick: () => {
        setViewMode("list");
        router.push(`${projectBaseUrl}/issues`);
      },
    },
    {
      id: "board",
      label: `${prefix} Work Board`,
      href: `${projectBaseUrl}/issues`,
      icon: Kanban,
      isActive: pathname.endsWith("/issues") && viewMode === "kanban",
      onClick: () => {
        setViewMode("kanban");
        router.push(`${projectBaseUrl}/issues`);
      },
    },
    {
      id: "calendar",
      label: `${prefix} Calander`,
      href: `${projectBaseUrl}/issues`,
      icon: Calendar,
      isActive: pathname.endsWith("/issues") && viewMode === "calendar",
      onClick: () => {
        setViewMode("calendar");
        router.push(`${projectBaseUrl}/issues`);
      },
    },
    {
      id: "repository",
      label: `${prefix} Repository`,
      href: `${projectBaseUrl}/repository`,
      icon: Code2,
      isActive: pathname.endsWith("/repository"),
    },
  ];

  const pinnedTabs = pinnedTabIds
    .map((id) => {
      const v = SPACE_VIEWS.find((item) => item.id === id);
      if (!v) return null;
      const href = v.href(workspace.slug, project.identifier);
      return {
        id: `pinned-${v.id}`,
        label: `${prefix} ${v.navLabel}`,
        href,
        icon: v.icon,
        isActive: pathname.startsWith(href),
        isPinned: true,
        viewId: v.id,
      };
    })
    .filter(Boolean);

  const allTabs = [...horizontalTabs, ...(pinnedTabs as any[])];

  const filters = useSpaceStore((s) => s.filters);
  const setSearch = useSpaceStore((s) => s.setSearch);
  const togglePriorityFilter = useSpaceStore((s) => s.togglePriorityFilter);
  const toggleStateFilter = useSpaceStore((s) => s.toggleStateFilter);
  const toggleAssigneeFilter = useSpaceStore((s) => s.toggleAssigneeFilter);
  const toggleTypeFilter = useSpaceStore((s) => s.toggleTypeFilter);
  const toggleComponentFilter = useSpaceStore((s) => s.toggleComponentFilter);
  const setOnlyMyIssues = useSpaceStore((s) => s.setOnlyMyIssues);
  const setOnlyUnassigned = useSpaceStore((s) => s.setOnlyUnassigned);
  const clearFilters = useSpaceStore((s) => s.clearFilters);

  const isIssuesView = pathname.endsWith("/issues");

  // Fetch project components
  const { data: componentsData } = useQuery<{ components: Component[] }>({
    queryKey: ["components", project.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/components`);
      if (!res.ok) return { components: [] };
      return res.json();
    },
    staleTime: 30000,
  });

  const components = componentsData?.components || project.components || [];

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.priorities.length > 0 ||
    filters.stateIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.types.length > 0 ||
    filters.componentIds.length > 0 ||
    filters.onlyMyIssues ||
    filters.onlyUnassigned;

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
    <header className="flex flex-col border-b border-[#e5e7eb] bg-white px-5 py-2.5 space-y-2 z-30 shrink-0 font-sans">
      {/* Top row: Spaces Breadcrumb & Project Identity */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="text-[11px] font-medium text-[#6b7280]">
            Spaces
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#18181b] text-white text-[11px] font-bold font-mono shrink-0 shadow-xs">
              {project.identifier.slice(0, 2)}
            </div>
            <h1 className="text-base font-bold text-[#111827] tracking-tight">
              {project.identifier === "XRGO" ? "XRGO General Duties" : project.name}
            </h1>

            {/* Team icon */}
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-[#f1f5f9] text-[#64748b]">
              <Users className="h-3 w-3" />
              <span>{project.members.length}</span>
            </span>

            {/* Project ... menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827] transition-colors cursor-pointer outline-none">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-white border-[#e5e7eb] text-xs shadow-xl" align="start">
                <DropdownMenuItem onClick={() => router.push(`${projectBaseUrl}/settings`)} className="cursor-pointer">
                  <span>Space settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                  <span>Export issues (CSV)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right action icons: Share, Automations, Star, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            title={copiedLink ? "Link copied to clipboard!" : "Share space link"}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] shadow-2xs transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>

          {/* Automations Bolt */}
          <button
            onClick={() => router.push(`${projectBaseUrl}/settings`)}
            title="Space automations & workflows"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] shadow-2xs transition-colors cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
          </button>

          {/* Star Favorite */}
          <button
            onClick={() => setIsStarred(!isStarred)}
            title={isStarred ? "Starred" : "Star this space"}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] shadow-2xs transition-colors cursor-pointer"
          >
            <Star className={cn("h-3.5 w-3.5", isStarred ? "text-yellow-400 fill-yellow-400" : "")} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            title="Toggle fullscreen"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] shadow-2xs transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Middle Bar: Horizontal Project Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-[#f1f5f9] pt-2 text-xs scrollbar-none relative">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <div key={tab.id} className="relative flex items-center group">
              <Link
                href={tab.href}
                onClick={(e) => {
                  if (tab.onClick) {
                    e.preventDefault();
                    tab.onClick();
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-medium whitespace-nowrap transition-colors cursor-pointer",
                  tab.isActive
                    ? "text-[#0052cc] font-semibold border-b-2 border-[#0052cc] -mb-[1px]"
                    : "text-[#42526e] hover:text-[#172b4d] hover:bg-[#f4f5f7] rounded-md"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", tab.isActive ? "text-[#0052cc]" : "text-[#64748b]")} />
                <span>{tab.label}</span>
              </Link>
              {tab.isPinned && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePin(tab.viewId);
                  }}
                  title="Remove from navigation"
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[#9ca3af] hover:text-rose-600 rounded transition-opacity cursor-pointer -ml-1 mr-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* More Views Flyout (+) Button */}
        <Popover open={viewsFlyoutOpen} onOpenChange={setViewsFlyoutOpen}>
          <PopoverTrigger asChild>
            <button
              id="more-views-plus-button"
              title="Add or customize space views"
              className={cn(
                "relative flex items-center justify-center h-6 w-6 rounded-[3px] transition-colors cursor-pointer outline-none ml-1 shrink-0",
                viewsFlyoutOpen
                  ? "border border-[#0052cc] text-[#0052cc] bg-white after:absolute after:-bottom-[9px] after:left-0 after:right-0 after:h-[2px] after:bg-[#0052cc]"
                  : "text-[#42526e] hover:text-[#172b4d] hover:bg-[#f4f5f7] border border-transparent"
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={2}
            className="w-[560px] max-w-[95vw] p-0 border border-[#c1c7d0]/80 shadow-2xl rounded-lg overflow-hidden bg-white z-50"
          >
            <SpaceViewsFlyout
              project={project}
              workspaceSlug={workspace.slug}
              pinnedTabIds={pinnedTabIds}
              onTogglePin={handleTogglePin}
              onClose={() => setViewsFlyoutOpen(false)}
            />
          </PopoverContent>
        </Popover>
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

            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs text-[#4b5563] hover:bg-gray-50 hover:text-[#111827] shadow-xs transition-colors cursor-pointer outline-none">
                <span>Type</span>
                {filters.types.length > 0 && (
                  <span className="rounded-full bg-[#3e63dd] px-1.5 text-[10px] font-bold text-white">
                    {filters.types.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-[#e5e7eb] text-[#111827] shadow-xl">
                {Object.values(IssueType).map((t) => (
                  <DropdownMenuCheckboxItem
                    key={t}
                    checked={filters.types.includes(t)}
                    onCheckedChange={() => toggleTypeFilter(t)}
                    className="flex items-center gap-2 text-xs hover:bg-[#f3f4f6] cursor-pointer"
                  >
                    <IssueTypeIcon type={t} size={14} />
                    <span className="capitalize">{t.toLowerCase()}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Component Filter */}
            {components.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs text-[#4b5563] hover:bg-gray-50 hover:text-[#111827] shadow-xs transition-colors cursor-pointer outline-none">
                  <Box className="h-3 w-3 text-[#6b7280]" />
                  <span>Component</span>
                  {filters.componentIds.length > 0 && (
                    <span className="rounded-full bg-[#3e63dd] px-1.5 text-[10px] font-bold text-white">
                      {filters.componentIds.length}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-[#e5e7eb] text-[#111827] shadow-xl">
                  {components.map((comp) => (
                    <DropdownMenuCheckboxItem
                      key={comp.id}
                      checked={filters.componentIds.includes(comp.id)}
                      onCheckedChange={() => toggleComponentFilter(comp.id)}
                      className="flex items-center gap-2 text-xs hover:bg-[#f3f4f6] cursor-pointer"
                    >
                      <Box className="h-3.5 w-3.5 text-[#3e63dd]" />
                      <span>{comp.name}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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

          {/* Quick Filter Pills Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#f1f3f5] text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] mr-1">
              Quick:
            </span>

            {/* 1. Only My Issues */}
            <button
              onClick={() => setOnlyMyIssues(!filters.onlyMyIssues)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all cursor-pointer",
                filters.onlyMyIssues
                  ? "bg-[#3e63dd] text-white border-[#3e63dd] shadow-xs"
                  : "bg-white text-[#4b5563] border-[#e5e7eb] hover:bg-[#f8f9fa] hover:border-[#cbd5e1]"
              )}
            >
              <Zap className={cn("h-3 w-3", filters.onlyMyIssues ? "text-yellow-300 fill-yellow-300" : "text-[#6b7280]")} />
              <span>Only My Issues</span>
            </button>

            {/* 2. Urgent & High */}
            <button
              onClick={() => {
                const isUrgentActive =
                  filters.priorities.includes(IssuePriority.URGENT) &&
                  filters.priorities.includes(IssuePriority.HIGH);
                if (isUrgentActive) {
                  togglePriorityFilter(IssuePriority.URGENT);
                  togglePriorityFilter(IssuePriority.HIGH);
                } else {
                  if (!filters.priorities.includes(IssuePriority.URGENT)) {
                    togglePriorityFilter(IssuePriority.URGENT);
                  }
                  if (!filters.priorities.includes(IssuePriority.HIGH)) {
                    togglePriorityFilter(IssuePriority.HIGH);
                  }
                }
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all cursor-pointer",
                filters.priorities.includes(IssuePriority.URGENT) && filters.priorities.includes(IssuePriority.HIGH)
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-white text-[#4b5563] border-[#e5e7eb] hover:bg-[#f8f9fa] hover:border-[#cbd5e1]"
              )}
            >
              <Flame className={cn("h-3 w-3", filters.priorities.includes(IssuePriority.URGENT) ? "text-white" : "text-rose-500")} />
              <span>Urgent & High</span>
            </button>

            {/* 3. Unassigned */}
            <button
              onClick={() => setOnlyUnassigned(!filters.onlyUnassigned)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all cursor-pointer",
                filters.onlyUnassigned
                  ? "bg-[#111827] text-white border-[#111827] shadow-xs"
                  : "bg-white text-[#4b5563] border-[#e5e7eb] hover:bg-[#f8f9fa] hover:border-[#cbd5e1]"
              )}
            >
              <Users className="h-3 w-3" />
              <span>Unassigned</span>
            </button>

            {/* 4. Bugs Only */}
            <button
              onClick={() => toggleTypeFilter(IssueType.BUG)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all cursor-pointer",
                filters.types.includes(IssueType.BUG)
                  ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                  : "bg-white text-[#4b5563] border-[#e5e7eb] hover:bg-[#f8f9fa] hover:border-[#cbd5e1]"
              )}
            >
              <IssueTypeIcon type={IssueType.BUG} size={11} />
              <span>Bugs Only</span>
            </button>

            {/* 5. Stories Only */}
            <button
              onClick={() => toggleTypeFilter(IssueType.STORY)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all cursor-pointer",
                filters.types.includes(IssueType.STORY)
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-[#4b5563] border-[#e5e7eb] hover:bg-[#f8f9fa] hover:border-[#cbd5e1]"
              )}
            >
              <IssueTypeIcon type={IssueType.STORY} size={11} />
              <span>Stories Only</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

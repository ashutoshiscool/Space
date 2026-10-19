"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  IssueWithDetails,
  StateGroup,
} from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { IssueTypeIcon } from "@/components/issues/IssueTypeIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  FilePenLine,
  FilePlus,
  CalendarClock,
  Filter,
  Maximize2,
  Zap,
  X,
  Info,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  Layers,
  Search,
  Check,
  Plus,
  Share2,
  Star,
  Users,
} from "lucide-react";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";

export interface StatusBreakdownItem {
  stateId: string;
  stateName: string;
  color: string;
  count: number;
  percentage: number;
  group: StateGroup;
}

export interface ActivitySummaryItem {
  id: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  issue: {
    id: string;
    sequenceId: number;
    title: string;
    type?: string | null;
    state?: {
      id: string;
      name: string;
      color: string;
      group?: StateGroup;
    } | null;
  };
}

interface ProjectSummaryViewProps {
  workspace: WorkspaceWithDetails;
  project: ProjectWithDetails;
  issues: IssueWithDetails[];
  kpis: {
    completedCount: number;
    updatedCount: number;
    createdCount: number;
    dueSoonCount: number;
  };
  statusBreakdown: StatusBreakdownItem[];
  recentActivities: ActivitySummaryItem[];
}

export function ProjectSummaryView({
  workspace,
  project,
  issues,
  kpis,
  statusBreakdown,
  recentActivities,
}: ProjectSummaryViewProps) {
  const router = useRouter();
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);

  // Announcement Banner dismiss persistence
  const [showBanner, setShowBanner] = useState<boolean>(true);
  useEffect(() => {
    const dismissed = localStorage.getItem(
      `space_summary_banner_dismissed_${project.id}`
    );
    if (dismissed === "true") {
      setShowBanner(false);
    }
  }, [project.id]);

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem(
      `space_summary_banner_dismissed_${project.id}`,
      "true"
    );
  };

  // Quickstart Widget visibility & state
  const [showQuickstartPill, setShowQuickstartPill] = useState<boolean>(true);
  const [quickstartOpen, setQuickstartOpen] = useState<boolean>(false);

  // Expanded Activity modal
  const [expandedActivityOpen, setExpandedActivityOpen] =
    useState<boolean>(false);
  const [activitySearch, setActivitySearch] = useState<string>("");
  const [activityFilter, setActivityFilter] = useState<string>("ALL");

  // Summary Filters
  const [timeFilterDays, setTimeFilterDays] = useState<number>(7);
  const [statusFilterGroup, setStatusFilterGroup] = useState<string>("ALL");
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);

  // Filtered issues based on summary filter
  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (statusFilterGroup === "ACTIVE") {
        return (
          i.state.group === StateGroup.STARTED ||
          i.state.group === StateGroup.UNSTARTED
        );
      }
      if (statusFilterGroup === "COMPLETED") {
        return i.state.group === StateGroup.COMPLETED;
      }
      if (statusFilterGroup === "BACKLOG") {
        return i.state.group === StateGroup.BACKLOG;
      }
      return true;
    });
  }, [issues, statusFilterGroup]);

  const totalWorkItems = issues.length;

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return recentActivities.filter((act) => {
      if (activityFilter !== "ALL" && act.action !== activityFilter) {
        return false;
      }
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        const matchIssue =
          act.issue.title.toLowerCase().includes(q) ||
          `${project.identifier}-${act.issue.sequenceId}`
            .toLowerCase()
            .includes(q);
        const matchUser = act.user.name.toLowerCase().includes(q);
        return matchIssue || matchUser;
      }
      return true;
    });
  }, [recentActivities, activityFilter, activitySearch, project.identifier]);

  // Group activities into Today, Yesterday, Earlier
  const groupedActivities = useMemo(() => {
    const today: ActivitySummaryItem[] = [];
    const yesterday: ActivitySummaryItem[] = [];
    const earlier: ActivitySummaryItem[] = [];

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    filteredActivities.forEach((act) => {
      const actTime = new Date(act.createdAt).getTime();
      if (actTime >= todayStart) {
        today.push(act);
      } else if (actTime >= yesterdayStart) {
        yesterday.push(act);
      } else {
        earlier.push(act);
      }
    });

    return { today, yesterday, earlier };
  }, [filteredActivities]);

  // Donut Chart calculation
  const donutSegments = useMemo(() => {
    if (totalWorkItems === 0) return [];
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    return statusBreakdown.map((item) => {
      const strokeDash = (item.count / totalWorkItems) * circumference;
      const strokeDashoffset = -accumulatedAngle;
      accumulatedAngle += strokeDash;

      return {
        ...item,
        radius,
        circumference,
        strokeDash,
        strokeDashoffset,
      };
    });
  }, [statusBreakdown, totalWorkItems]);

  // Helper to format activity action description
  const formatActionDescription = (act: ActivitySummaryItem) => {
    switch (act.action) {
      case "STATE_CHANGED":
        return (
          <>
            updated field <span className="font-semibold">&quot;status&quot;</span> on
          </>
        );
      case "PRIORITY_CHANGED":
        return (
          <>
            updated field <span className="font-semibold">&quot;priority&quot;</span> on
          </>
        );
      case "ASSIGNED":
        return "assigned";
      case "COMMENT_ADDED":
        return "commented on";
      case "WORKLOG_ADDED":
        return "logged time on";
      case "ATTACHMENT_ADDED":
        return "added attachment to";
      case "CLONED":
        return "cloned";
      case "CREATED":
      default:
        return "created";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafbfc] min-h-full font-sans select-none pb-20">
      {/* City Skyline / Gradient Backdrop Banner */}
      <div className="relative w-full h-32 md:h-40 overflow-hidden bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b] border-b border-[#e2e8f0]">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#818cf8 1px, #1e293b 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fafbfc] via-[#fafbfc]/30 to-transparent" />

        {/* Project Header Identity overlay */}
        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-sm font-bold text-[#111827] shadow-md font-mono shrink-0">
              {project.identifier.slice(0, 3)}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                Spaces
              </div>
              <h1 className="text-xl font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
                <span>{project.name}</span>
                <span className="text-xs font-mono font-normal text-[#64748b] bg-white/80 px-2 py-0.5 rounded border border-[#e2e8f0]">
                  {project.identifier}
                </span>
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}
              className="bg-white/90 hover:bg-white text-xs h-8 text-[#334155] border-[#cbd5e1] shadow-2xs cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              <span>Share</span>
            </Button>
            <Button
              size="sm"
              onClick={() => openCreateIssue()}
              className="bg-[#3e63dd] hover:bg-[#3451b2] text-white text-xs h-8 shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Create</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Customizable Reports Recommendation Banner */}
        {showBanner && (
          <div className="relative overflow-hidden rounded-xl border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] via-[#f0f9ff] to-[#eff6ff] p-5 shadow-xs transition-all animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Info content */}
              <div className="flex items-start gap-3.5 max-w-2xl">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-xs">
                  <Info className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-[#1e3a8a] tracking-tight">
                    Customize your Reports view to suit your space.
                  </h2>
                  <p className="text-xs text-[#3b82f6] leading-relaxed">
                    Head to the Reports tab to easily customize charts and
                    widgets for a dashboard tailored to your space.
                  </p>
                  <div className="flex items-center gap-4 pt-1 text-xs">
                    <Link
                      href={`/${workspace.slug}/${project.identifier}/analytics`}
                      className="font-semibold text-[#2563eb] hover:text-[#1d4ed8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Take me to Reports</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={handleDismissBanner}
                      className="text-[#64748b] hover:text-[#1e293b] font-medium transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Graphical Preview Illustration */}
              <div className="hidden sm:flex items-center gap-2.5 relative shrink-0 pr-4">
                {/* Mini Card 1: Orange/Purple Bar Chart */}
                <div className="w-16 h-14 rounded-lg bg-white border border-[#bfdbfe] p-2 flex flex-col justify-end gap-1 shadow-xs">
                  <div className="flex items-end justify-around h-full gap-1">
                    <div className="w-2.5 h-6 bg-[#f59e0b] rounded-t-xs" />
                    <div className="w-2.5 h-9 bg-[#8b5cf6] rounded-t-xs" />
                  </div>
                </div>

                {/* Mini Card 2: Plus placeholder */}
                <div className="w-14 h-14 rounded-lg border-2 border-dashed border-[#93c5fd] flex items-center justify-center text-[#93c5fd]">
                  <Plus className="h-4 w-4" />
                </div>

                {/* Mini Card 3: Green/Purple Bar Chart */}
                <div className="w-16 h-14 rounded-lg bg-white border border-[#bfdbfe] p-2 flex flex-col justify-end gap-1 shadow-xs">
                  <div className="flex items-end justify-around h-full gap-1">
                    <div className="w-2.5 h-4 bg-[#10b981] rounded-t-xs" />
                    <div className="w-2.5 h-7 bg-[#6366f1] rounded-t-xs" />
                  </div>
                </div>

                {/* Floating 3D Donut Pie with Curved Arrow & Crosses */}
                <div className="absolute -top-3 -right-2 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-md border border-[#93c5fd] p-1 flex items-center justify-center transform hover:scale-105 transition-transform">
                    {/* SVG mini donut */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#3b82f6]"
                        strokeWidth="5"
                        strokeDasharray="45, 100"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#10b981]"
                        strokeWidth="5"
                        strokeDasharray="25, 100"
                        strokeDashoffset="-45"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#f59e0b]"
                        strokeWidth="5"
                        strokeDasharray="30, 100"
                        strokeDashoffset="-70"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                  {/* Decorative sparkles */}
                  <span className="text-[10px] text-[#3b82f6] font-bold absolute -bottom-2 -left-3">
                    ✕
                  </span>
                  <span className="text-[12px] text-[#818cf8] font-bold absolute -top-1 -right-2">
                    +
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-xs font-medium text-[#334155] hover:bg-[#f8fafc] shadow-2xs transition-colors cursor-pointer outline-none">
                <Filter className="h-3.5 w-3.5 text-[#64748b]" />
                <span>
                  Filter:{" "}
                  {statusFilterGroup === "ALL"
                    ? "All status"
                    : statusFilterGroup === "ACTIVE"
                    ? "Active only"
                    : statusFilterGroup === "COMPLETED"
                    ? "Completed only"
                    : "Backlog only"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-white border-[#e2e8f0] text-xs shadow-lg">
                <DropdownMenuLabel className="text-[#64748b] text-[10px] uppercase tracking-wider">
                  Filter by status
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setStatusFilterGroup("ALL")}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>All work items</span>
                  {statusFilterGroup === "ALL" && <Check className="h-3.5 w-3.5 text-[#3e63dd]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilterGroup("ACTIVE")}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>Active / In Progress</span>
                  {statusFilterGroup === "ACTIVE" && <Check className="h-3.5 w-3.5 text-[#3e63dd]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilterGroup("COMPLETED")}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>Completed</span>
                  {statusFilterGroup === "COMPLETED" && <Check className="h-3.5 w-3.5 text-[#3e63dd]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilterGroup("BACKLOG")}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>Backlog</span>
                  {statusFilterGroup === "BACKLOG" && <Check className="h-3.5 w-3.5 text-[#3e63dd]" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Time Window Selector */}
            <div className="flex items-center rounded-lg bg-[#f1f5f9] p-0.5 border border-[#e2e8f0] text-xs">
              <button
                onClick={() => setTimeFilterDays(7)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  timeFilterDays === 7
                    ? "bg-white text-[#0f172a] shadow-2xs font-semibold"
                    : "text-[#64748b] hover:text-[#0f172a]"
                )}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setTimeFilterDays(14)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  timeFilterDays === 14
                    ? "bg-white text-[#0f172a] shadow-2xs font-semibold"
                    : "text-[#64748b] hover:text-[#0f172a]"
                )}
              >
                14 days
              </button>
              <button
                onClick={() => setTimeFilterDays(30)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  timeFilterDays === 30
                    ? "bg-white text-[#0f172a] shadow-2xs font-semibold"
                    : "text-[#64748b] hover:text-[#0f172a]"
                )}
              >
                30 days
              </button>
            </div>
          </div>

          <div className="text-xs text-[#64748b]">
            Showing <span className="font-semibold text-[#0f172a]">{filteredIssues.length}</span> of {totalWorkItems} work items
          </div>
        </div>

        {/* 4 Metric KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Completed */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-[#0f172a] tracking-tight">
                  {kpis.completedCount} completed
                </div>
                <div className="text-xs text-[#64748b]">
                  in the last {timeFilterDays} days
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Updated */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                <FilePenLine className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-[#0f172a] tracking-tight">
                  {kpis.updatedCount} updated
                </div>
                <div className="text-xs text-[#64748b]">
                  in the last {timeFilterDays} days
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Created */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                <FilePlus className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-[#0f172a] tracking-tight">
                  {kpis.createdCount} created
                </div>
                <div className="text-xs text-[#64748b]">
                  in the last {timeFilterDays} days
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Due soon */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-[#0f172a] tracking-tight">
                  {kpis.dueSoonCount} due soon
                </div>
                <div className="text-xs text-[#64748b]">
                  in the next {timeFilterDays} days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Cards: Status Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Card: Status Overview */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-2xs flex flex-col min-h-[380px]">
            {/* Card Header */}
            <div className="space-y-1 mb-4">
              <h3 className="text-base font-bold text-[#0f172a] tracking-tight">
                Status overview
              </h3>
              <p className="text-xs text-[#64748b]">
                Get a snapshot of the status of your work items.{" "}
                <Link
                  href={`/${workspace.slug}/${project.identifier}/issues`}
                  className="font-medium text-[#2563eb] hover:underline"
                >
                  View all work items
                </Link>
              </p>
            </div>

            {/* Donut Chart & Legend Body */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 flex-1 pt-2">
              {/* Donut Chart */}
              <div className="relative flex items-center justify-center shrink-0 w-44 h-44">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 160 160"
                >
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="18"
                  />

                  {/* Dynamic Segments */}
                  {donutSegments.map((segment) => {
                    const isHovered = hoveredStateId === segment.stateId;
                    return (
                      <circle
                        key={segment.stateId}
                        cx="80"
                        cy="80"
                        r={segment.radius}
                        fill="transparent"
                        stroke={segment.color || "#3b82f6"}
                        strokeWidth={isHovered ? 22 : 18}
                        strokeDasharray={`${segment.strokeDash} ${
                          segment.circumference - segment.strokeDash
                        }`}
                        strokeDashoffset={segment.strokeDashoffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredStateId(segment.stateId)}
                        onMouseLeave={() => setHoveredStateId(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center Total Count */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <span className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
                    {totalWorkItems}
                  </span>
                  <span className="text-[11px] font-medium text-[#64748b] truncate max-w-[100px]">
                    Total work item...
                  </span>
                </div>
              </div>

              {/* Status Breakdown Legend List */}
              <div className="w-full sm:w-56 max-h-[260px] overflow-y-auto space-y-2 pr-1 text-xs">
                {statusBreakdown.length === 0 ? (
                  <div className="text-xs text-[#94a3b8] italic py-6 text-center">
                    No status data available yet.
                  </div>
                ) : (
                  statusBreakdown.map((item) => {
                    const isHovered = hoveredStateId === item.stateId;
                    return (
                      <div
                        key={item.stateId}
                        onMouseEnter={() => setHoveredStateId(item.stateId)}
                        onMouseLeave={() => setHoveredStateId(null)}
                        onClick={() => {
                          router.push(
                            `/${workspace.slug}/${project.identifier}/issues?state=${item.stateId}`
                          );
                        }}
                        className={cn(
                          "flex items-center justify-between p-1.5 rounded-md transition-colors cursor-pointer",
                          isHovered
                            ? "bg-[#f1f5f9]"
                            : "hover:bg-[#f8fafc]"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="h-3 w-3 rounded-xs shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-[#334155] truncate">
                            {item.stateName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#64748b] shrink-0 font-mono">
                          <span>:</span>
                          <span className="font-semibold text-[#0f172a]">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Card: Recent Activity */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-2xs flex flex-col min-h-[380px]">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0f172a] tracking-tight">
                  Recent activity
                </h3>
                <p className="text-xs text-[#64748b]">
                  Stay up to date with what&apos;s happening across the space.
                </p>
              </div>

              <button
                onClick={() => setExpandedActivityOpen(true)}
                title="Expand full activity feed"
                className="text-[#64748b] hover:text-[#0f172a] p-1 rounded-md hover:bg-[#f1f5f9] transition-colors cursor-pointer"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Activity Stream Container */}
            <div className="flex-1 max-h-[300px] overflow-y-auto space-y-4 pr-1 text-xs">
              {filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-[#94a3b8] space-y-2">
                  <Clock className="h-8 w-8 text-[#cbd5e1]" />
                  <p className="text-xs">No recent activity recorded yet.</p>
                </div>
              ) : (
                <>
                  {/* Today Group */}
                  {groupedActivities.today.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                        Today
                      </div>
                      <div className="space-y-3">
                        {groupedActivities.today.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-start gap-2.5 group"
                          >
                            <Avatar className="h-6 w-6 mt-0.5 border border-[#e2e8f0]">
                              <AvatarImage
                                src={act.user.avatarUrl || undefined}
                                alt={act.user.name}
                              />
                              <AvatarFallback className="text-[10px] bg-[#f1f5f9] text-[#334155] font-semibold">
                                {getInitials(act.user.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-1">
                              <div className="text-xs text-[#334155] leading-snug">
                                <span className="font-semibold text-[#0f172a]">
                                  {act.user.name}
                                </span>{" "}
                                {formatActionDescription(act)}
                              </div>

                              {/* Issue Pill */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <Link
                                  href={`/${workspace.slug}/${project.identifier}/issues?issueId=${act.issue.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f8fafc] border border-[#e2e8f0] text-[11px] text-[#2563eb] hover:underline font-medium truncate max-w-full"
                                >
                                  <IssueTypeIcon
                                    type={act.issue.type}
                                    size={10}
                                  />
                                  <span>
                                    {project.identifier}-{act.issue.sequenceId}:{" "}
                                    {act.issue.title}
                                  </span>
                                </Link>

                                {act.issue.state && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{
                                      backgroundColor: `${act.issue.state.color}15`,
                                      color: act.issue.state.color,
                                    }}
                                  >
                                    {act.issue.state.name}
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-[#94a3b8]">
                                {formatRelativeTime(act.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yesterday Group */}
                  {groupedActivities.yesterday.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                        Yesterday
                      </div>
                      <div className="space-y-3">
                        {groupedActivities.yesterday.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-start gap-2.5 group"
                          >
                            <Avatar className="h-6 w-6 mt-0.5 border border-[#e2e8f0]">
                              <AvatarImage
                                src={act.user.avatarUrl || undefined}
                                alt={act.user.name}
                              />
                              <AvatarFallback className="text-[10px] bg-[#f1f5f9] text-[#334155] font-semibold">
                                {getInitials(act.user.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-1">
                              <div className="text-xs text-[#334155] leading-snug">
                                <span className="font-semibold text-[#0f172a]">
                                  {act.user.name}
                                </span>{" "}
                                {formatActionDescription(act)}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <Link
                                  href={`/${workspace.slug}/${project.identifier}/issues?issueId=${act.issue.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f8fafc] border border-[#e2e8f0] text-[11px] text-[#2563eb] hover:underline font-medium truncate max-w-full"
                                >
                                  <IssueTypeIcon
                                    type={act.issue.type}
                                    size={10}
                                  />
                                  <span>
                                    {project.identifier}-{act.issue.sequenceId}:{" "}
                                    {act.issue.title}
                                  </span>
                                </Link>

                                {act.issue.state && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{
                                      backgroundColor: `${act.issue.state.color}15`,
                                      color: act.issue.state.color,
                                    }}
                                  >
                                    {act.issue.state.name}
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-[#94a3b8]">
                                {formatRelativeTime(act.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Earlier Group */}
                  {groupedActivities.earlier.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                        Earlier
                      </div>
                      <div className="space-y-3">
                        {groupedActivities.earlier.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-start gap-2.5 group"
                          >
                            <Avatar className="h-6 w-6 mt-0.5 border border-[#e2e8f0]">
                              <AvatarImage
                                src={act.user.avatarUrl || undefined}
                                alt={act.user.name}
                              />
                              <AvatarFallback className="text-[10px] bg-[#f1f5f9] text-[#334155] font-semibold">
                                {getInitials(act.user.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-1">
                              <div className="text-xs text-[#334155] leading-snug">
                                <span className="font-semibold text-[#0f172a]">
                                  {act.user.name}
                                </span>{" "}
                                {formatActionDescription(act)}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <Link
                                  href={`/${workspace.slug}/${project.identifier}/issues?issueId=${act.issue.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f8fafc] border border-[#e2e8f0] text-[11px] text-[#2563eb] hover:underline font-medium truncate max-w-full"
                                >
                                  <IssueTypeIcon
                                    type={act.issue.type}
                                    size={10}
                                  />
                                  <span>
                                    {project.identifier}-{act.issue.sequenceId}:{" "}
                                    {act.issue.title}
                                  </span>
                                </Link>

                                {act.issue.state && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{
                                      backgroundColor: `${act.issue.state.color}15`,
                                      color: act.issue.state.color,
                                    }}
                                  >
                                    {act.issue.state.name}
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-[#94a3b8]">
                                {formatRelativeTime(act.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Priority & Team Workload Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Breakdown */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#3e63dd]" />
                <span>Priority breakdown</span>
              </h3>
              <span className="text-xs text-[#64748b]">
                {issues.length} active issues
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: "Urgent", count: issues.filter((i) => i.priority === "URGENT").length, color: "#ef4444" },
                { label: "High", count: issues.filter((i) => i.priority === "HIGH").length, color: "#f97316" },
                { label: "Medium", count: issues.filter((i) => i.priority === "MEDIUM").length, color: "#eab308" },
                { label: "Low", count: issues.filter((i) => i.priority === "LOW").length, color: "#3b82f6" },
                { label: "None", count: issues.filter((i) => i.priority === "NONE").length, color: "#94a3b8" },
              ].map((prio) => {
                const percent = issues.length > 0 ? Math.round((prio.count / issues.length) * 100) : 0;
                return (
                  <div key={prio.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#334155]">{prio.label}</span>
                      <span className="text-[#64748b] font-mono">
                        {prio.count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: prio.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Workload */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
                <Users className="h-4 w-4 text-[#3e63dd]" />
                <span>Team workload</span>
              </h3>
              <span className="text-xs text-[#64748b]">
                {project.members.length} members
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {project.members.map((member) => {
                const memberIssues = issues.filter((i) =>
                  i.assignees.some((a) => a.user.id === member.user.id)
                );
                return (
                  <div
                    key={member.user.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#f8fafc] border border-[#f1f5f9] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-white text-[#334155] font-semibold border">
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-[#0f172a]">
                          {member.user.name}
                        </div>
                        <div className="text-[10px] text-[#64748b]">
                          {member.role.toLowerCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-bold text-[#0f172a]">
                        {memberIssues.length}
                      </span>
                      <span className="text-[#64748b]">assigned</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quickstart Pill Button */}
      {showQuickstartPill && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center shadow-xl rounded-full animate-in slide-in-from-bottom-3 duration-300">
          <button
            onClick={() => setQuickstartOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-semibold rounded-l-full cursor-pointer transition-colors"
          >
            <Zap className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span>Quickstart</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickstartPill(false);
            }}
            title="Dismiss quickstart"
            className="px-2.5 py-2 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded-r-full border-l border-white/10 cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Quickstart Dialog Modal */}
      <Dialog open={quickstartOpen} onOpenChange={setQuickstartOpen}>
        <DialogContent className="max-w-md bg-white border-[#e2e8f0] p-6 text-xs text-[#334155]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-[#0f172a] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#3e63dd] fill-[#3e63dd]" />
              <span>Project Quickstart Guide</span>
            </DialogTitle>
            <p className="text-xs text-[#64748b]">
              Get your team productive in Space in less than 5 minutes.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3 w-3" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-[#0f172a]">
                  Workspace & Project Initialized
                </div>
                <div className="text-[11px] text-[#64748b]">
                  Identifier: <span className="font-mono font-semibold">{project.identifier}</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Plus className="h-3 w-3" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-[#0f172a]">
                  Create Work Items & Tasks
                </div>
                <div className="text-[11px] text-[#64748b]">
                  Add tasks, stories, bugs, and epics with estimates and due dates.
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setQuickstartOpen(false);
                    openCreateIssue();
                  }}
                  className="mt-1 h-7 text-xs bg-[#3e63dd] hover:bg-[#3451b2] text-white cursor-pointer"
                >
                  Create your first issue
                </Button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="h-3 w-3" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-[#0f172a]">
                  Sprints & Backlog Planning
                </div>
                <div className="text-[11px] text-[#64748b]">
                  Organize issues into iterations and view burndown metrics.
                </div>
                <Link
                  href={`/${workspace.slug}/${project.identifier}/backlog`}
                  onClick={() => setQuickstartOpen(false)}
                  className="inline-block mt-1 text-xs font-semibold text-[#2563eb] hover:underline"
                >
                  Go to Backlog &rarr;
                </Link>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="pt-2 border-t border-[#e2e8f0] space-y-2">
              <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                Keyboard Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded bg-[#f1f5f9]">
                  <span>Create issue</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white font-mono shadow-2xs">C</kbd>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-[#f1f5f9]">
                  <span>Command bar</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white font-mono shadow-2xs">⌘K</kbd>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Full Activity Modal */}
      <Dialog
        open={expandedActivityOpen}
        onOpenChange={setExpandedActivityOpen}
      >
        <DialogContent className="max-w-3xl bg-white border-[#e2e8f0] p-6 max-h-[85vh] flex flex-col">
          <DialogHeader className="space-y-1 shrink-0 pb-3 border-b border-[#e2e8f0]">
            <DialogTitle className="text-base font-bold text-[#0f172a] flex items-center justify-between">
              <span>Full Project Activity Log</span>
              <span className="text-xs font-normal text-[#64748b]">
                {filteredActivities.length} events
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Modal Filters */}
          <div className="flex items-center gap-3 py-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search activity by issue or user..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] focus:outline-none focus:border-[#3e63dd]"
              />
            </div>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[#e2e8f0] text-xs text-[#334155] bg-white cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATED">Created</option>
              <option value="STATE_CHANGED">Status Changed</option>
              <option value="PRIORITY_CHANGED">Priority Changed</option>
              <option value="COMMENT_ADDED">Comments</option>
              <option value="WORKLOG_ADDED">Worklogs</option>
            </select>
          </div>

          {/* Modal Activity List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs divide-y divide-[#f1f5f9]">
            {filteredActivities.length === 0 ? (
              <div className="py-12 text-center text-[#94a3b8]">
                No matching activity logs found.
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div key={act.id} className="pt-3 flex items-start gap-3">
                  <Avatar className="h-7 w-7 mt-0.5 border border-[#e2e8f0]">
                    <AvatarImage src={act.user.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px] bg-[#f1f5f9] text-[#334155] font-semibold">
                      {getInitials(act.user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-[#334155]">
                      <span className="font-semibold text-[#0f172a]">
                        {act.user.name}
                      </span>{" "}
                      {formatActionDescription(act)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/${workspace.slug}/${project.identifier}/issues?issueId=${act.issue.id}`}
                        onClick={() => setExpandedActivityOpen(false)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#2563eb] hover:underline font-medium"
                      >
                        <IssueTypeIcon type={act.issue.type} size={11} />
                        <span>
                          {project.identifier}-{act.issue.sequenceId}:{" "}
                          {act.issue.title}
                        </span>
                      </Link>

                      {act.issue.state && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${act.issue.state.color}15`,
                            color: act.issue.state.color,
                          }}
                        >
                          {act.issue.state.name}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-[#94a3b8]">
                      {new Date(act.createdAt).toLocaleString()} (
                      {formatRelativeTime(act.createdAt)})
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

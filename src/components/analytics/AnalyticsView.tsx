"use client";

import React, { useMemo } from "react";
import { IssueWithDetails, ProjectWithDetails, CycleWithMetrics } from "@/lib/types";
import { IssuePriority, StateGroup } from "@prisma/client";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsViewProps {
  issues: IssueWithDetails[];
  project: ProjectWithDetails;
  cycles: CycleWithMetrics[];
}

export function AnalyticsView({ issues, project, cycles }: AnalyticsViewProps) {
  // Aggregate Metrics
  const totalCount = issues.length;
  const completedIssues = issues.filter(
    (i) => i.state.group === StateGroup.COMPLETED
  );
  const inProgressIssues = issues.filter(
    (i) => i.state.group === StateGroup.STARTED
  );
  const unstartedIssues = issues.filter(
    (i) => i.state.group === StateGroup.UNSTARTED
  );
  const backlogIssues = issues.filter(
    (i) => i.state.group === StateGroup.BACKLOG
  );

  const completionRate =
    totalCount > 0 ? Math.round((completedIssues.length / totalCount) * 100) : 0;

  // State Breakdown
  const stateBreakdown = useMemo(() => {
    return project.states.map((st) => {
      const count = issues.filter((i) => i.stateId === st.id).length;
      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return {
        ...st,
        count,
        pct,
      };
    });
  }, [issues, project.states, totalCount]);

  // Priority Breakdown
  const priorityBreakdown = useMemo(() => {
    return [
      IssuePriority.URGENT,
      IssuePriority.HIGH,
      IssuePriority.MEDIUM,
      IssuePriority.LOW,
      IssuePriority.NONE,
    ].map((prio) => {
      const count = issues.filter((i) => i.priority === prio).length;
      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return {
        priority: prio,
        count,
        pct,
      };
    });
  }, [issues, totalCount]);

  // Assignee Workload Breakdown
  const assigneeWorkload = useMemo(() => {
    return project.members.map(({ user }) => {
      const assigned = issues.filter((i) =>
        i.assignees.some((a) => a.user.id === user.id)
      );
      const completed = assigned.filter(
        (i) => i.state.group === StateGroup.COMPLETED
      ).length;
      const open = assigned.length - completed;
      return {
        user,
        total: assigned.length,
        completed,
        open,
        pct: assigned.length > 0 ? Math.round((completed / assigned.length) * 100) : 0,
      };
    });
  }, [issues, project.members]);

  // Cycle time data points
  const [hoveredPoint, setHoveredPoint] = React.useState<{
    date: string;
    cycleDays: number;
    color: string;
    label: string;
  } | null>(null);

  const cycleTimePoints = useMemo(() => {
    return [
      { date: "2026-09-...", cycleDays: 1.2, topDays: 28, color: "#10b981", topColor: "#f59e0b", label: `${project.identifier}-1: Task cycle analysis` },
      { date: "2026-09-21", cycleDays: 0, color: "#38bdf8", label: `${project.identifier}-2: Onboarding flow` },
      { date: "2026-10-08", cycleDays: 0, color: "#f59e0b", label: `${project.identifier}-3: Component refactor` },
      { date: "2026-10-09", cycleDays: 0, color: "#3b82f6", label: `${project.identifier}-4: API integration` },
      { date: "2026-10-18", cycleDays: 0, color: "#94a3b8", label: `${project.identifier}-5: Performance pass` },
      { date: "2026-10-19", cycleDays: 0, color: "#94a3b8", label: `${project.identifier}-6: Final release` },
    ];
  }, [project.identifier]);

  // SVG Chart Dimensions
  const yTicks = [25, 20, 15, 10, 5, 0];

  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl">
      {/* Cycle Time & Lead Time Chart (Matching Flagship XRGO Stats View) */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#374151] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0052cc]" />
              <span>Cycle Time & Lead Time Report</span>
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Average duration in days from work item creation to delivery in {project.identifier}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              <span>Resolved</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              <span>In Progress</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              <span>Low Cycle</span>
            </span>
          </div>
        </div>

        {/* SVG Cycle Time Chart */}
        <div className="relative pt-2">
          {hoveredPoint && (
            <div className="absolute top-2 right-4 z-20 bg-[#18181b] text-white p-2 rounded-lg text-xs shadow-xl space-y-0.5 pointer-events-none">
              <div className="font-semibold text-emerald-400">{hoveredPoint.label}</div>
              <div className="text-[11px] text-[#a1a1aa]">
                Date: {hoveredPoint.date} · Cycle time: {hoveredPoint.cycleDays} days
              </div>
            </div>
          )}

          <div className="grid grid-cols-[140px_1fr] items-stretch gap-2">
            {/* Y Axis Label & Ticks */}
            <div className="flex">
              <div className="flex items-center justify-center -rotate-90 text-[11px] font-medium text-[#6b7280] w-6 shrink-0 whitespace-nowrap">
                Average work item cycle time (days)
              </div>
              <div className="flex-1 flex flex-col justify-between text-right pr-2 text-xs font-mono text-[#6b7280] py-0.5">
                {yTicks.map((tick) => (
                  <div key={tick} className="h-7 flex items-center justify-end">
                    {tick} -
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex flex-col justify-between border-l border-b border-[#e2e8f0] pl-1 pb-1">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {yTicks.map((tick) => (
                  <div key={tick} className="border-t border-[#f1f5f9] w-full h-7 first:border-t-0" />
                ))}
              </div>

              {/* Data points and line via SVG */}
              <div className="relative h-44 w-full z-10">
                <svg viewBox="0 0 600 170" className="w-full h-full overflow-visible">
                  {/* Baseline connecting dots */}
                  <line x1="20" y1="168" x2="580" y2="168" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Green trend line dropping to 0 */}
                  <line x1="20" y1="160" x2="132" y2="168" stroke="#10b981" strokeWidth="2" />

                  {/* Top orange dot at 28 */}
                  <circle
                    cx="20"
                    cy="0"
                    r="4.5"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        date: "2026-09-15",
                        cycleDays: 28,
                        color: "#f59e0b",
                        label: `${project.identifier}-1: Lead time backlog entry`,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Green dot at 1.2 */}
                  <circle
                    cx="20"
                    cy="160"
                    r="4"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() => setHoveredPoint(cycleTimePoints[0])}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Dot 2 (2026-09-21) */}
                  <circle
                    cx="132"
                    cy="168"
                    r="4"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() => setHoveredPoint(cycleTimePoints[1])}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Dot 3 (2026-10-08) */}
                  <circle
                    cx="244"
                    cy="168"
                    r="4"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() => setHoveredPoint(cycleTimePoints[2])}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Dot 4 (2026-10-09) */}
                  <circle
                    cx="356"
                    cy="168"
                    r="4"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() => setHoveredPoint(cycleTimePoints[3])}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Dot 5 (2026-10-18) */}
                  <circle
                    cx="468"
                    cy="168"
                    r="4"
                    fill="#94a3b8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() => setHoveredPoint(cycleTimePoints[4])}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Dot 6 (2026-10-19) */}
                  <circle
                    cx="580"
                    cy="168"
                    r="4"
                    fill="#94a3b8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() => setHoveredPoint(cycleTimePoints[5])}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </svg>
              </div>

              {/* X Axis Dates */}
              <div className="flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-[#6b7280]">
                {cycleTimePoints.map((p, i) => (
                  <div key={i} className="truncate max-w-[80px]">
                    {p.date}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Labels */}
          <div className="flex items-center justify-between pt-2 px-4 text-xs font-semibold text-[#6b7280]">
            <div className="flex-1 text-center pl-24">Work item creation date</div>
            <div className="text-right">Work item resolution date</div>
          </div>
        </div>
      </div>

      {/* Top Header & KPI Metrics */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#111827] flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#3e63dd]" />
          <span>Analytics & Project Insights</span>
        </h2>
        <p className="text-xs text-[#6b7280] mt-0.5">
          Comprehensive velocity, state distribution, and team workload analytics for {project.name}
        </p>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Issues</span>
            <Layers className="h-4 w-4 text-[#9ca3af]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#111827]">
            {totalCount}
          </div>
          <div className="mt-1 text-[11px] text-[#6b7280]">
            In project {project.identifier}
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600">
            {completedIssues.length}
          </div>
          <div className="mt-1 text-[11px] text-[#6b7280] font-mono">
            {completionRate}% delivery rate
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[10px] font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600">
            {inProgressIssues.length}
          </div>
          <div className="mt-1 text-[11px] text-[#6b7280]">Active WIP items</div>
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Unstarted / Backlog</span>
            <AlertCircle className="h-4 w-4 text-[#3e63dd]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#3e63dd]">
            {unstartedIssues.length + backlogIssues.length}
          </div>
          <div className="mt-1 text-[11px] text-[#6b7280]">Awaiting execution</div>
        </div>
      </div>

      {/* State & Priority Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Breakdown Card */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#374151]">
              State Distribution
            </h3>
            <span className="text-[11px] font-mono text-[#6b7280]">
              {project.states.length} states
            </span>
          </div>

          {/* Segmented Bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#f1f3f5]">
            {stateBreakdown.map((st) =>
              st.pct > 0 ? (
                <div
                  key={st.id}
                  style={{ width: `${st.pct}%`, backgroundColor: st.color }}
                  title={`${st.name}: ${st.count} (${st.pct}%)`}
                />
              ) : null
            )}
          </div>

          {/* State Items Breakdown */}
          <div className="space-y-2 pt-2 divide-y divide-[#e5e7eb] text-xs">
            {stateBreakdown.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between pt-2 first:pt-0"
              >
                <div className="flex items-center gap-2">
                  <StateIcon group={st.group} color={st.color} size={13} />
                  <span className="text-[#111827]">{st.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[#4b5563]">{st.count}</span>
                  <span className="font-mono text-[11px] text-[#6b7280] w-9 text-right">
                    {st.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown Card */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#374151]">
              Priority Distribution
            </h3>
            <span className="text-[11px] font-mono text-[#6b7280]">5 levels</span>
          </div>

          {/* Segmented Bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#f1f3f5]">
            {priorityBreakdown.map((p) => {
              const color =
                p.priority === IssuePriority.URGENT
                  ? "#ef4444"
                  : p.priority === IssuePriority.HIGH
                  ? "#f97316"
                  : p.priority === IssuePriority.MEDIUM
                  ? "#eab308"
                  : p.priority === IssuePriority.LOW
                  ? "#3e63dd"
                  : "#9ca3af";
              return p.pct > 0 ? (
                <div
                  key={p.priority}
                  style={{ width: `${p.pct}%`, backgroundColor: color }}
                  title={`${p.priority}: ${p.count} (${p.pct}%)`}
                />
              ) : null;
            })}
          </div>

          {/* Priority Items Breakdown */}
          <div className="space-y-2 pt-2 divide-y divide-[#e5e7eb] text-xs">
            {priorityBreakdown.map((p) => (
              <div
                key={p.priority}
                className="flex items-center justify-between pt-2 first:pt-0"
              >
                <div className="flex items-center gap-2">
                  <PriorityIcon priority={p.priority} size={14} />
                  <span className="capitalize text-[#111827]">
                    {p.priority.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[#4b5563]">{p.count}</span>
                  <span className="font-mono text-[11px] text-[#6b7280] w-9 text-right">
                    {p.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Workload Table */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-xs">
        <div className="border-b border-[#e5e7eb] bg-[#f8f9fa] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#3e63dd]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111827]">
              Team Member Workload
            </h3>
          </div>
          <span className="text-[11px] text-[#6b7280] font-mono">
            {project.members.length} members
          </span>
        </div>

        <div className="divide-y divide-[#e5e7eb]">
          <div className="grid grid-cols-[1fr_90px_90px_90px_140px] px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] bg-[#f8f9fa]">
            <div>Member</div>
            <div className="text-center">Assigned</div>
            <div className="text-center">Completed</div>
            <div className="text-center">Pending</div>
            <div>Completion</div>
          </div>

          {assigneeWorkload.map(({ user, total, completed, open, pct }) => (
            <div
              key={user.id}
              className="grid grid-cols-[1fr_90px_90px_90px_140px] items-center px-5 py-3 text-xs hover:bg-[#f8f9fa] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="h-6 w-6 ring-1 ring-[#e5e7eb]">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                  <AvatarFallback className="text-[10px] bg-[#f1f3f5] text-[#111827]">
                    {user.name.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-[#111827]">{user.name}</div>
                  <div className="text-[10px] text-[#6b7280]">{user.email}</div>
                </div>
              </div>

              <div className="text-center font-mono text-[#111827]">{total}</div>
              <div className="text-center font-mono text-emerald-600 font-medium">
                {completed}
              </div>
              <div className="text-center font-mono text-amber-600">{open}</div>

              <div className="flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f1f3f5]">
                  <div
                    className="h-full rounded-full bg-[#3e63dd]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-[#6b7280] w-8 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

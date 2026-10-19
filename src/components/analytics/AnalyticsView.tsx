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
  // Real Cycle time data points computed dynamically from real project issues
  const [hoveredPoint, setHoveredPoint] = React.useState<{
    date: string;
    cycleDays: number;
    color: string;
    label: string;
    stateName: string;
  } | null>(null);

  const cycleTimePoints = useMemo(() => {
    if (!issues || issues.length === 0) return [];

    // Sort issues by creation date ascending
    const sorted = [...issues].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sorted.map((issue) => {
      const createdTime = new Date(issue.createdAt).getTime();
      let cycleDays = 0;
      let color = "#94a3b8";

      if (issue.state.group === StateGroup.COMPLETED) {
        const completedTime = new Date(issue.updatedAt).getTime();
        const diffMs = Math.max(0, completedTime - createdTime);
        cycleDays = Math.max(0.1, Number((diffMs / (1000 * 60 * 60 * 24)).toFixed(1)));
        color = "#10b981"; // Resolved
      } else if (issue.state.group === StateGroup.STARTED) {
        const diffMs = Math.max(0, Date.now() - createdTime);
        cycleDays = Math.max(0.1, Number((diffMs / (1000 * 60 * 60 * 24)).toFixed(1)));
        color = "#f59e0b"; // In Progress
      } else {
        cycleDays = 0;
        color = "#3b82f6"; // Low Cycle / Backlog
      }

      const dateStr = new Date(issue.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return {
        id: issue.id,
        date: dateStr,
        cycleDays,
        color,
        label: `${project.identifier}-${issue.sequenceId}: ${issue.title}`,
        stateName: issue.state.name,
      };
    });
  }, [issues, project.identifier]);

  // Dynamic Y Axis scale based on real data
  const maxDays = useMemo(() => {
    if (cycleTimePoints.length === 0) return 10;
    const maxVal = Math.max(...cycleTimePoints.map((p) => p.cycleDays));
    return Math.max(5, Math.ceil(maxVal / 5) * 5);
  }, [cycleTimePoints]);

  const yTicks = useMemo(() => {
    const step = maxDays / 5;
    return [
      maxDays,
      Math.round(step * 4),
      Math.round(step * 3),
      Math.round(step * 2),
      Math.round(step * 1),
      0,
    ];
  }, [maxDays]);

  // SVG coordinates for real points
  const pointsWithCoords = useMemo(() => {
    const count = cycleTimePoints.length;
    return cycleTimePoints.map((p, index) => {
      const cx = count <= 1 ? 300 : 30 + (index / (count - 1)) * 540;
      const cy = 150 - (p.cycleDays / maxDays) * 130;
      return { ...p, cx, cy };
    });
  }, [cycleTimePoints, maxDays]);

  const pathD = useMemo(() => {
    if (pointsWithCoords.length <= 1) return "";
    return pointsWithCoords
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`)
      .join(" ");
  }, [pointsWithCoords]);

  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl">
      {/* Cycle Time & Lead Time Chart */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#374151] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0052cc]" />
              <span>Cycle Time & Lead Time Report</span>
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Real duration in days from work item creation to delivery in {project.identifier}
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
              <span>Backlog / Unstarted</span>
            </span>
          </div>
        </div>

        {/* SVG Cycle Time Chart */}
        <div className="relative pt-2">
          {hoveredPoint && (
            <div className="absolute top-2 right-4 z-20 bg-[#18181b] text-white p-2.5 rounded-lg text-xs shadow-xl space-y-0.5 pointer-events-none border border-slate-700">
              <div className="font-semibold text-emerald-400">{hoveredPoint.label}</div>
              <div className="text-[11px] text-[#cbd5e1] flex items-center gap-2">
                <span>Status: {hoveredPoint.stateName}</span>
                <span>·</span>
                <span>Created: {hoveredPoint.date}</span>
                <span>·</span>
                <span>Cycle: {hoveredPoint.cycleDays} days</span>
              </div>
            </div>
          )}

          {cycleTimePoints.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6b7280]">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-[#94a3b8] opacity-60" />
              <p className="font-semibold text-slate-800">No work items found</p>
              <p className="mt-1">Create issues in {project.name} to track real cycle times.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[140px_1fr] items-stretch gap-2">
              {/* Y Axis Label & Ticks */}
              <div className="flex">
                <div className="flex items-center justify-center -rotate-90 text-[11px] font-medium text-[#6b7280] w-6 shrink-0 whitespace-nowrap">
                  Average work item cycle time (days)
                </div>
                <div className="flex-1 flex flex-col justify-between text-right pr-2 text-xs font-mono text-[#6b7280] py-0.5">
                  {yTicks.map((tick, i) => (
                    <div key={`${tick}-${i}`} className="h-7 flex items-center justify-end">
                      {tick} -
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Area */}
              <div className="relative flex flex-col justify-between border-l border-b border-[#e2e8f0] pl-1 pb-1">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {yTicks.map((tick, i) => (
                    <div
                      key={`grid-${tick}-${i}`}
                      className="border-t border-[#f1f5f9] w-full h-7 first:border-t-0"
                    />
                  ))}
                </div>

                {/* Data points and real line via SVG */}
                <div className="relative h-44 w-full z-10">
                  <svg viewBox="0 0 600 170" className="w-full h-full overflow-visible">
                    {/* Baseline */}
                    <line x1="20" y1="150" x2="580" y2="150" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Trend Line Connecting Real Points */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#0052cc"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        className="opacity-75"
                      />
                    )}

                    {/* Dynamic Real Issue Points */}
                    {pointsWithCoords.map((pt) => (
                      <g key={pt.id}>
                        {/* Vertical Drop Line to Baseline */}
                        <line
                          x1={pt.cx}
                          y1={pt.cy}
                          x2={pt.cx}
                          y2={150}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={pt.cx}
                          cy={pt.cy}
                          r="5"
                          fill={pt.color}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-pointer transition-transform hover:scale-150"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    ))}
                  </svg>
                </div>

                {/* X Axis Dates */}
                <div className="flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-[#6b7280]">
                  {pointsWithCoords.map((p) => (
                    <div key={p.id} className="truncate max-w-[80px] text-center">
                      {p.date}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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

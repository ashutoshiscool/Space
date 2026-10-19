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

  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl">
      {/* Top Header */}
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

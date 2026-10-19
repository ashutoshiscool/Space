"use client";

import React, { useState, useMemo } from "react";
import { User, IssueWithDetails, ProjectWithDetails, WorkspaceWithDetails } from "@/lib/types";
import { StateGroup, IssuePriority } from "@prisma/client";
import { useSpaceStore } from "@/lib/store";
import {
  UserCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  Activity,
  Layers,
  Calendar,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { formatDate, cn } from "@/lib/utils";

interface YourWorkViewProps {
  currentUser: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  workspace: WorkspaceWithDetails;
  assignedIssues: (IssueWithDetails & { project: Pick<ProjectWithDetails, "id" | "name" | "identifier"> })[];
  createdIssues: (IssueWithDetails & { project: Pick<ProjectWithDetails, "id" | "name" | "identifier"> })[];
  recentActivities: {
    id: string;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    createdAt: Date | string;
    issue: {
      id: string;
      sequenceId: number;
      title: string;
      project: { identifier: string };
    };
  }[];
}

export function YourWorkView({
  currentUser,
  workspace,
  assignedIssues,
  createdIssues,
  recentActivities,
}: YourWorkViewProps) {
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const [activeTab, setActiveTab] = useState<"summary" | "assigned" | "created" | "activity">("summary");
  const [searchQuery, setSearchQuery] = useState("");

  // Statistics
  const completedAssigned = assignedIssues.filter(
    (i) => i.state.group === StateGroup.COMPLETED
  );
  const pendingAssigned = assignedIssues.filter(
    (i) => i.state.group !== StateGroup.COMPLETED && i.state.group !== StateGroup.CANCELED
  );
  const urgentCount = pendingAssigned.filter(
    (i) => i.priority === IssuePriority.URGENT || i.priority === IssuePriority.HIGH
  ).length;

  const completionRate =
    assignedIssues.length > 0
      ? Math.round((completedAssigned.length / assignedIssues.length) * 100)
      : 0;

  // Filtered lists
  const filteredAssigned = useMemo(() => {
    if (!searchQuery.trim()) return assignedIssues;
    const q = searchQuery.toLowerCase();
    return assignedIssues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        `${i.project.identifier}-${i.sequenceId}`.toLowerCase().includes(q)
    );
  }, [assignedIssues, searchQuery]);

  const filteredCreated = useMemo(() => {
    if (!searchQuery.trim()) return createdIssues;
    const q = searchQuery.toLowerCase();
    return createdIssues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        `${i.project.identifier}-${i.sequenceId}`.toLowerCase().includes(q)
    );
  }, [createdIssues, searchQuery]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white p-6 space-y-6 text-[#111827]">
      {/* Header Profile Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-[#3e63dd]/20 shadow-xs">
            {currentUser.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />}
            <AvatarFallback className="bg-white text-lg font-bold text-[#111827] border border-[#e5e7eb]">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[#111827]">{currentUser.name}</h1>
              <span className="rounded-full bg-white border border-[#e5e7eb] px-2 py-0.5 text-[10px] font-mono text-[#6b7280]">
                Your Work
              </span>
            </div>
            <p className="text-xs text-[#6b7280]">{currentUser.email}</p>
            <p className="text-[11px] text-[#4b5563] mt-0.5">
              Workspace: <span className="text-[#3e63dd] font-semibold">{workspace.name}</span>
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-center shadow-xs">
            <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Assigned</div>
            <div className="text-base font-bold text-[#111827] font-mono mt-0.5">
              {assignedIssues.length}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-center shadow-xs">
            <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Pending</div>
            <div className="text-base font-bold text-amber-600 font-mono mt-0.5">
              {pendingAssigned.length}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-center shadow-xs">
            <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Completed</div>
            <div className="text-base font-bold text-emerald-600 font-mono mt-0.5">
              {completedAssigned.length}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e7eb] pb-2">
        <div className="flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("summary")}
            className={cn(
              "flex items-center gap-1.5 pb-2 transition-colors cursor-pointer",
              activeTab === "summary"
                ? "border-b-2 border-[#3e63dd] text-[#3e63dd]"
                : "text-[#6b7280] hover:text-[#111827]"
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Summary</span>
          </button>

          <button
            onClick={() => setActiveTab("assigned")}
            className={cn(
              "flex items-center gap-1.5 pb-2 transition-colors cursor-pointer",
              activeTab === "assigned"
                ? "border-b-2 border-[#3e63dd] text-[#3e63dd]"
                : "text-[#6b7280] hover:text-[#111827]"
            )}
          >
            <UserCheck className="h-4 w-4" />
            <span>Assigned ({assignedIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("created")}
            className={cn(
              "flex items-center gap-1.5 pb-2 transition-colors cursor-pointer",
              activeTab === "created"
                ? "border-b-2 border-[#3e63dd] text-[#3e63dd]"
                : "text-[#6b7280] hover:text-[#111827]"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Created by Me ({createdIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "flex items-center gap-1.5 pb-2 transition-colors cursor-pointer",
              activeTab === "activity"
                ? "border-b-2 border-[#3e63dd] text-[#3e63dd]"
                : "text-[#6b7280] hover:text-[#111827]"
            )}
          >
            <Activity className="h-4 w-4" />
            <span>Activity Trail</span>
          </button>
        </div>

        {activeTab !== "summary" && activeTab !== "activity" && (
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search in your issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#e5e7eb] bg-white py-1.5 pl-8 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd] focus:outline-hidden shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Summary */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Overview Card */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
              Delivery Rate
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold text-[#111827] font-mono">
                {completionRate}%
              </span>
              <span className="text-xs text-[#6b7280] font-mono">
                {completedAssigned.length} of {assignedIssues.length} resolved
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#f3f4f6] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-[#4b5563]">
              {urgentCount > 0
                ? `⚠️ You have ${urgentCount} high or urgent priority items waiting.`
                : "✨ No urgent blockers currently assigned to you."}
            </p>
          </div>

          {/* Urgent / High Priority Work */}
          <div className="md:col-span-2 rounded-xl border border-[#e5e7eb] bg-white p-5 space-y-3 shadow-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
              <span>Priority Action Items</span>
            </h2>

            {pendingAssigned.filter((i) => i.priority === IssuePriority.URGENT || i.priority === IssuePriority.HIGH).length === 0 ? (
              <p className="text-xs text-[#6b7280] py-6 text-center">
                All high priority work is cleared! Good job.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingAssigned
                  .filter((i) => i.priority === IssuePriority.URGENT || i.priority === IssuePriority.HIGH)
                  .slice(0, 5)
                  .map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setActiveIssueId(issue.id)}
                      className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3 hover:border-[#cbd5e1] hover:bg-white transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <PriorityIcon priority={issue.priority} size={14} />
                        <span className="font-mono text-[11px] text-[#6b7280] shrink-0">
                          {issue.project.identifier}-{issue.sequenceId}
                        </span>
                        <span className="text-xs text-[#111827] font-medium truncate group-hover:text-[#3e63dd]">
                          {issue.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StateIcon group={issue.state.group} color={issue.state.color} size={13} />
                        <span className="text-xs text-[#6b7280] font-medium">{issue.state.name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Issues List */}
      {activeTab === "assigned" && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white divide-y divide-[#f1f3f5] overflow-hidden shadow-xs">
          {filteredAssigned.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6b7280]">
              No assigned issues found.
            </div>
          ) : (
            filteredAssigned.map((issue) => (
              <div
                key={issue.id}
                onClick={() => setActiveIssueId(issue.id)}
                className="flex items-center justify-between p-3.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 truncate">
                  <PriorityIcon priority={issue.priority} size={14} />
                  <span className="font-mono text-[11px] text-[#3e63dd] bg-[#3e63dd]/10 border border-[#3e63dd]/20 rounded px-1.5 py-0.5 shrink-0 font-medium">
                    {issue.project.identifier}-{issue.sequenceId}
                  </span>
                  <span className="text-xs font-medium text-[#111827] truncate group-hover:text-[#3e63dd]">
                    {issue.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <StateIcon group={issue.state.group} color={issue.state.color} size={13} />
                    <span className="text-xs text-[#6b7280] font-medium">{issue.state.name}</span>
                  </div>
                  {issue.dueDate && (
                    <span className="text-[11px] text-[#6b7280] font-mono">
                      Due {formatDate(issue.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Created Issues List */}
      {activeTab === "created" && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white divide-y divide-[#f1f3f5] overflow-hidden shadow-xs">
          {filteredCreated.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6b7280]">
              No created issues found.
            </div>
          ) : (
            filteredCreated.map((issue) => (
              <div
                key={issue.id}
                onClick={() => setActiveIssueId(issue.id)}
                className="flex items-center justify-between p-3.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 truncate">
                  <PriorityIcon priority={issue.priority} size={14} />
                  <span className="font-mono text-[11px] text-[#3e63dd] bg-[#3e63dd]/10 border border-[#3e63dd]/20 rounded px-1.5 py-0.5 shrink-0 font-medium">
                    {issue.project.identifier}-{issue.sequenceId}
                  </span>
                  <span className="text-xs font-medium text-[#111827] truncate group-hover:text-[#3e63dd]">
                    {issue.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <StateIcon group={issue.state.group} color={issue.state.color} size={13} />
                    <span className="text-xs text-[#6b7280] font-medium">{issue.state.name}</span>
                  </div>
                  <span className="text-[11px] text-[#6b7280] font-mono">
                    Created {formatDate(issue.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Activity Feed */}
      {activeTab === "activity" && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 space-y-4 shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
            Recent Audit Changelog
          </h2>
          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6b7280]">
              No activity logs recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => setActiveIssueId(act.issue.id)}
                  className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3 text-xs hover:border-[#cbd5e1] hover:bg-white transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[11px] text-[#3e63dd] font-medium">
                      {act.issue.project.identifier}-{act.issue.sequenceId}
                    </span>
                    <span className="text-[#6b7280]">{act.action.toLowerCase().replace("_", " ")}</span>
                    {act.oldValue && (
                      <span className="line-through text-[#9ca3af]">{act.oldValue}</span>
                    )}
                    <span className="font-medium text-[#111827]">{act.newValue}</span>
                  </div>
                  <span className="text-[10px] text-[#6b7280] shrink-0">
                    {formatDate(act.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

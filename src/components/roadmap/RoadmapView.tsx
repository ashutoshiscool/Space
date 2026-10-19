"use client";

import React, { useState } from "react";
import {
  IssueWithDetails,
  ProjectWithDetails,
  ModuleWithMetrics,
  Module,
} from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { formatDate, cn } from "@/lib/utils";
import { Calendar, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoadmapViewProps {
  issues: IssueWithDetails[];
  modules: (Module | ModuleWithMetrics)[];
  project: ProjectWithDetails;
}

export function RoadmapView({ issues, modules, project }: RoadmapViewProps) {
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const [viewType, setViewType] = useState<"issues" | "modules">("issues");

  // Timeline window: past 7 days to next 21 days
  const now = new Date();
  const timelineStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const timelineEnd = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const totalDays = Math.ceil(
    (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const days = Array.from({ length: totalDays }).map((_, i) => {
    const d = new Date(timelineStart.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: d,
      label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      dayNum: d.getDate(),
      isToday: d.toDateString() === now.toDateString(),
    };
  });

  return (
    <div className="flex flex-col space-y-4 w-full text-[#111827]">
      {/* Roadmap Controls Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewType === "issues" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewType("issues")}
            className={viewType === "issues" ? "bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs" : "bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb]"}
          >
            Issues Roadmap
          </Button>
          <Button
            variant={viewType === "modules" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewType("modules")}
            className={viewType === "modules" ? "bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs" : "bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb]"}
          >
            Initiatives Roadmap
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {formatDate(timelineStart)} - {formatDate(timelineEnd)}
          </span>
        </div>
      </div>

      {/* Gantt Timeline Container */}
      <div className="relative overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white shadow-xs">
        {/* Days Header */}
        <div className="flex border-b border-[#e5e7eb] bg-[#f8f9fa] min-w-[900px]">
          <div className="w-64 shrink-0 px-4 py-2 text-xs font-semibold text-[#6b7280] border-r border-[#e5e7eb]">
            {viewType === "issues" ? "Issue" : "Initiative"}
          </div>

          <div className="flex flex-1">
            {days.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 border-r border-[#e5e7eb] py-1.5 text-center text-[10px]",
                  d.isToday ? "bg-[#eff6ff] text-[#3e63dd] font-bold" : "text-[#6b7280]"
                )}
              >
                <div>{d.label}</div>
                <div>{d.dayNum}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Items */}
        <div className="divide-y divide-[#f1f3f5] min-w-[900px]">
          {viewType === "issues"
            ? issues.map((issue) => {
                const startDate = issue.startDate
                  ? new Date(issue.startDate)
                  : new Date(issue.createdAt);
                const endDate = issue.dueDate
                  ? new Date(issue.dueDate)
                  : new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

                const startOffsetDays = Math.max(
                  0,
                  (startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
                );
                const durationDays = Math.max(
                  1,
                  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                const leftPercent = Math.min(
                  95,
                  Math.max(0, (startOffsetDays / totalDays) * 100)
                );
                const widthPercent = Math.min(
                  100 - leftPercent,
                  Math.max(4, (durationDays / totalDays) * 100)
                );

                return (
                  <div
                    key={issue.id}
                    onClick={() => setActiveIssueId(issue.id)}
                    className="flex items-center hover:bg-[#f8f9fa] transition-colors cursor-pointer group py-2"
                  >
                    <div className="w-64 shrink-0 px-4 flex items-center gap-2 border-r border-[#e5e7eb] truncate">
                      <span className="font-mono text-xs text-[#6b7280]">
                        {project.identifier}-{issue.sequenceId}
                      </span>
                      <span className="text-xs font-medium text-[#111827] truncate group-hover:text-[#3e63dd]">
                        {issue.title}
                      </span>
                    </div>

                    <div className="relative flex-1 h-7">
                      <div
                        className="absolute h-6 rounded-md px-2 flex items-center text-[11px] font-medium text-white shadow-xs transition-all group-hover:brightness-105"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor: issue.state.color,
                        }}
                      >
                        <span className="truncate">{issue.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            : modules.map((mod) => {
                const startDate = mod.startDate
                  ? new Date(mod.startDate)
                  : new Date(mod.createdAt);
                const endDate = mod.targetDate
                  ? new Date(mod.targetDate)
                  : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

                const startOffsetDays = Math.max(
                  0,
                  (startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
                );
                const durationDays = Math.max(
                  1,
                  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                const leftPercent = Math.min(
                  90,
                  Math.max(0, (startOffsetDays / totalDays) * 100)
                );
                const widthPercent = Math.min(
                  100 - leftPercent,
                  Math.max(6, (durationDays / totalDays) * 100)
                );

                return (
                  <div
                    key={mod.id}
                    className="flex items-center hover:bg-[#f8f9fa] transition-colors py-2"
                  >
                    <div className="w-64 shrink-0 px-4 flex items-center gap-2 border-r border-[#e5e7eb] truncate">
                      <Layers className="h-3.5 w-3.5 text-[#3e63dd] shrink-0" />
                      <span className="text-xs font-medium text-[#111827] truncate">
                        {mod.name}
                      </span>
                    </div>

                    <div className="relative flex-1 h-7">
                      <div
                        className="absolute h-6 rounded-md px-2.5 flex items-center justify-between text-[11px] font-medium text-white bg-[#3e63dd] shadow-xs"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        <span className="truncate">{mod.name}</span>
                        {"progressPercent" in mod && (
                          <span className="text-[10px] opacity-90">
                            {(mod as ModuleWithMetrics).progressPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}

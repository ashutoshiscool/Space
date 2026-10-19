"use client";

import React, { useState, useMemo } from "react";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  X,
  Inbox,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CalendarViewProps {
  issues: IssueWithDetails[];
  project: ProjectWithDetails;
}

type CalendarMode = "month" | "week" | "day";
type DateFieldFilter = "dueDate" | "createdAt";

export function CalendarView({ issues, project }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [dateField, setDateField] = useState<DateFieldFilter>("dueDate");
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(false);
  const [selectedDayModal, setSelectedDayModal] = useState<{
    date: Date;
    issues: IssueWithDetails[];
  } | null>(null);

  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);
  const queryClient = useQueryClient();

  // Mutation to schedule an unscheduled issue quickly
  const updateIssueDateMutation = useMutation({
    mutationFn: async ({
      issueId,
      dueDate,
    }: {
      issueId: string;
      dueDate: string | null;
    }) => {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate }),
      });
      if (!res.ok) throw new Error("Failed to update issue date");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStr = new Date().toDateString();

  // Navigation handlers
  const handlePrev = () => {
    if (calendarMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (calendarMode === "week") {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (calendarMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (calendarMode === "week") {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group issues by date
  const issuesByDate = useMemo(() => {
    const map = new Map<string, IssueWithDetails[]>();
    for (const issue of issues) {
      const rawDate = dateField === "dueDate" ? issue.dueDate : issue.createdAt;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const key = d.toDateString();
          const list = map.get(key) || [];
          list.push(issue);
          map.set(key, list);
        }
      }
    }
    return map;
  }, [issues, dateField]);

  // Unscheduled issues (no due date)
  const unscheduledIssues = useMemo(() => {
    return issues.filter((i) => !i.dueDate);
  }, [issues]);

  // Overall metrics
  const metrics = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let overdueCount = 0;
    let completedCount = 0;
    let scheduledCount = 0;

    for (const issue of issues) {
      if (issue.dueDate) {
        scheduledCount++;
        const due = new Date(issue.dueDate);
        const isCompleted =
          issue.state?.group === "COMPLETED" || issue.state?.group === "CANCELED";
        if (due < now && !isCompleted) {
          overdueCount++;
        }
        if (issue.state?.group === "COMPLETED") {
          completedCount++;
        }
      }
    }

    return { overdueCount, completedCount, scheduledCount };
  }, [issues]);

  // Month Grid Calculation (35 or 42 cells)
  const monthCells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const cells: Array<{ date: Date; dayNumber: number; isCurrentMonth: boolean }> = [];

    // Leading days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrev - i;
      cells.push({
        date: new Date(year, month - 1, day, 12, 0, 0),
        dayNumber: day,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        date: new Date(year, month, day, 12, 0, 0),
        dayNumber: day,
        isCurrentMonth: true,
      });
    }

    // Trailing days
    const totalNeeded = cells.length > 35 ? 42 : 35;
    const remaining = totalNeeded - cells.length;
    for (let day = 1; day <= remaining; day++) {
      cells.push({
        date: new Date(year, month + 1, day, 12, 0, 0),
        dayNumber: day,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  // Week Grid Calculation (7 days of selected week)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay(); // 0 is Sunday
    startOfWeek.setDate(currentDate.getDate() - day);
    startOfWeek.setHours(12, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Formatted date label for header
  const headerDateLabel = useMemo(() => {
    if (calendarMode === "month") {
      return `${monthNames[month]} ${year}`;
    } else if (calendarMode === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      const startMonth = monthNames[start.getMonth()].slice(0, 3);
      const endMonth = monthNames[end.getMonth()].slice(0, 3);

      if (start.getMonth() === end.getMonth()) {
        return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
      }
    } else {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  }, [calendarMode, month, year, weekDays, currentDate, monthNames]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-xs font-sans text-[#111827]">
      {/* =========================================================================
          TOP CONTROLS & NAVIGATION HEADER
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] bg-[#ffffff] px-4 py-2.5 z-10 shrink-0">
        {/* Left: Month title & Nav Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-[#3e63dd]">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <span className="tracking-tight text-sm font-semibold">
              {headerDateLabel}
            </span>
          </div>

          <div className="flex items-center rounded-lg border border-[#e5e7eb] bg-white p-0.5 shadow-2xs">
            <button
              onClick={handlePrev}
              className="rounded-md p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-0.5 text-[11px] font-semibold text-[#374151] hover:text-[#111827] transition-colors cursor-pointer border-x border-[#f1f3f5]"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="rounded-md p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Metrics Badges */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-[#f8f9fa] border border-[#e5e7eb] px-2.5 py-0.5 text-[11px] font-medium text-[#4b5563]">
            <Layers className="h-3 w-3 text-[#6b7280]" />
            <span>{metrics.scheduledCount} scheduled</span>
          </span>

          {metrics.overdueCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{metrics.overdueCount} overdue</span>
            </span>
          )}

          {metrics.completedCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>{metrics.completedCount} done</span>
            </span>
          )}
        </div>

        {/* Right: Field Filter, Mode Switcher, Unscheduled Drawer, New Issue */}
        <div className="flex items-center gap-2">
          {/* Field Filter Toggle: Due Date vs Created */}
          <div className="flex items-center rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-0.5 text-[11px]">
            <button
              onClick={() => setDateField("dueDate")}
              className={cn(
                "rounded-md px-2 py-0.5 font-medium transition-all cursor-pointer",
                dateField === "dueDate"
                  ? "bg-white text-[#111827] shadow-2xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              Due Date
            </button>
            <button
              onClick={() => setDateField("createdAt")}
              className={cn(
                "rounded-md px-2 py-0.5 font-medium transition-all cursor-pointer",
                dateField === "createdAt"
                  ? "bg-white text-[#111827] shadow-2xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              Created
            </button>
          </div>

          {/* Mode Switcher: Month / Week / Day */}
          <div className="flex items-center rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-0.5 text-[11px]">
            <button
              onClick={() => setCalendarMode("month")}
              className={cn(
                "rounded-md px-2.5 py-0.5 font-medium transition-all cursor-pointer",
                calendarMode === "month"
                  ? "bg-white text-[#111827] shadow-2xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarMode("week")}
              className={cn(
                "rounded-md px-2.5 py-0.5 font-medium transition-all cursor-pointer",
                calendarMode === "week"
                  ? "bg-white text-[#111827] shadow-2xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarMode("day")}
              className={cn(
                "rounded-md px-2.5 py-0.5 font-medium transition-all cursor-pointer",
                calendarMode === "day"
                  ? "bg-white text-[#111827] shadow-2xs font-semibold"
                  : "text-[#6b7280] hover:text-[#111827]"
              )}
            >
              Day
            </button>
          </div>

          {/* Unscheduled Issues Drawer Trigger */}
          <button
            onClick={() => setIsUnscheduledOpen(!isUnscheduledOpen)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
              isUnscheduledOpen
                ? "border-[#3e63dd] bg-blue-50 text-[#3e63dd] font-semibold"
                : "border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f8f9fa] hover:text-[#111827]"
            )}
            title="Toggle Unscheduled Issues Tray"
          >
            <Inbox className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Unscheduled</span>
            {unscheduledIssues.length > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f1f3f5] px-1 text-[10px] font-mono text-[#4b5563]">
                {unscheduledIssues.length}
              </span>
            )}
          </button>

          {/* New Issue Button */}
          <Button
            size="sm"
            onClick={() =>
              openCreateIssue({
                dueDate: currentDate.toISOString(),
              })
            }
            className="flex items-center gap-1.5 bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs cursor-pointer text-xs h-7.5 px-2.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Issue</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area (Calendar Grid + Optional Unscheduled Drawer) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* =========================================================================
            MONTH VIEW (Grid of 35 or 42 cells with gap-px hairline borders)
           ========================================================================= */}
        {calendarMode === "month" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Weekday Row */}
            <div className="grid grid-cols-7 border-b border-[#e5e7eb] bg-[#f8f9fa] text-center text-[10px] font-bold uppercase tracking-wider text-[#6b7280] py-2 select-none shrink-0">
              {weekDayLabels.map((day, idx) => (
                <div
                  key={day}
                  className={cn(
                    "py-0.5",
                    (idx === 0 || idx === 6) && "text-[#9ca3af]"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Monthly Grid using gap-px for clean 1px borders */}
            <div
              className={cn(
                "grid flex-1 grid-cols-7 gap-px overflow-y-auto bg-[#e5e7eb]",
                monthCells.length === 35 ? "grid-rows-5" : "grid-rows-6"
              )}
            >
              {monthCells.map((cell, idx) => {
                const isToday = cell.date.toDateString() === todayStr;
                const dayIssues = issuesByDate.get(cell.date.toDateString()) || [];
                const isWeekend =
                  cell.date.getDay() === 0 || cell.date.getDay() === 6;

                return (
                  <div
                    key={idx}
                    onClick={() =>
                      openCreateIssue({
                        dueDate: cell.date.toISOString(),
                      })
                    }
                    className={cn(
                      "group relative flex flex-col p-1.5 transition-colors min-h-[92px] cursor-pointer",
                      cell.isCurrentMonth
                        ? isToday
                          ? "bg-blue-50/25"
                          : isWeekend
                          ? "bg-[#fafafa]"
                          : "bg-white"
                        : "bg-[#f8f9fa]/70 opacity-60",
                      "hover:bg-[#f1f5f9]/70"
                    )}
                  >
                    {/* Day Header: Number + Quick Add */}
                    <div className="flex items-center justify-between pb-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (dayIssues.length > 0) {
                            setSelectedDayModal({
                              date: cell.date,
                              issues: dayIssues,
                            });
                          } else {
                            openCreateIssue({
                              dueDate: cell.date.toISOString(),
                            });
                          }
                        }}
                        className={cn(
                          "flex h-5.5 w-5.5 items-center justify-center rounded-full text-xs font-semibold font-mono transition-transform hover:scale-105",
                          isToday
                            ? "bg-[#3e63dd] text-white shadow-xs font-bold ring-2 ring-blue-100"
                            : cell.isCurrentMonth
                            ? "text-[#111827] hover:bg-[#e5e7eb]"
                            : "text-[#9ca3af]"
                        )}
                        title={cell.date.toLocaleDateString()}
                      >
                        {cell.dayNumber}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateIssue({
                              dueDate: cell.date.toISOString(),
                            });
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors"
                          title={`Add issue for ${cell.date.toLocaleDateString()}`}
                        >
                          <Plus className="h-3 w-3" />
                        </span>
                      </div>
                    </div>

                    {/* Issues List in Day Cell */}
                    <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                      {dayIssues.slice(0, 3).map((issue) => {
                        const isOverdue =
                          issue.dueDate &&
                          new Date(issue.dueDate) < new Date() &&
                          issue.state?.group !== "COMPLETED" &&
                          issue.state?.group !== "CANCELED";

                        const isDone = issue.state?.group === "COMPLETED";

                        return (
                          <div
                            key={issue.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveIssueId(issue.id);
                            }}
                            className={cn(
                              "flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-[11px] shadow-2xs hover:shadow-xs hover:border-[#cbd5e1] hover:bg-[#f8f9fa] transition-all cursor-pointer truncate",
                              isOverdue
                                ? "border-rose-200 bg-rose-50/40 text-rose-900"
                                : isDone
                                ? "border-emerald-200 bg-emerald-50/20 opacity-80"
                                : "border-[#e5e7eb]"
                            )}
                            title={`${issue.sequenceId}: ${issue.title}`}
                          >
                            <StateIcon
                              group={issue.state?.group}
                              color={issue.state?.color}
                              size={11}
                            />
                            <span className="font-mono text-[9px] font-semibold text-[#6b7280] shrink-0">
                              {issue.sequenceId}
                            </span>
                            <span
                              className={cn(
                                "truncate font-medium text-[#111827]",
                                isDone && "line-through text-[#6b7280]"
                              )}
                            >
                              {issue.title}
                            </span>

                            {/* Assignee Avatar */}
                            {issue.assignees && issue.assignees.length > 0 && (
                              <Avatar className="h-3.5 w-3.5 shrink-0 ml-auto border border-white">
                                {issue.assignees[0].user?.avatarUrl && (
                                  <AvatarImage
                                    src={issue.assignees[0].user.avatarUrl}
                                  />
                                )}
                                <AvatarFallback className="text-[7px] bg-[#f1f3f5] text-[#374151]">
                                  {issue.assignees[0].user?.name?.slice(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })}

                      {/* "+X more" Pill */}
                      {dayIssues.length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayModal({
                              date: cell.date,
                              issues: dayIssues,
                            });
                          }}
                          className="text-left text-[10px] font-semibold text-[#3e63dd] hover:underline pl-1 pt-0.5 cursor-pointer font-mono"
                        >
                          +{dayIssues.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            WEEK VIEW (7 Columns Layout)
           ========================================================================= */}
        {calendarMode === "week" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Week Columns Header */}
            <div className="grid grid-cols-7 border-b border-[#e5e7eb] bg-[#f8f9fa] divide-x divide-[#e5e7eb] shrink-0">
              {weekDays.map((d) => {
                const isToday = d.toDateString() === todayStr;
                const count = (issuesByDate.get(d.toDateString()) || []).length;

                return (
                  <div
                    key={d.toDateString()}
                    className={cn(
                      "p-3 text-center transition-colors",
                      isToday ? "bg-blue-50/40" : "bg-white"
                    )}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-0.5">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-mono",
                          isToday
                            ? "bg-[#3e63dd] text-white shadow-xs ring-2 ring-blue-100"
                            : "text-[#111827]"
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {count > 0 && (
                        <span className="rounded-full bg-[#f1f3f5] px-1.5 py-0.2 text-[9px] font-mono text-[#6b7280]">
                          {count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week Columns Body */}
            <div className="grid flex-1 grid-cols-7 divide-x divide-[#e5e7eb] overflow-y-auto bg-[#fafafa]">
              {weekDays.map((d) => {
                const isToday = d.toDateString() === todayStr;
                const dayIssues = issuesByDate.get(d.toDateString()) || [];

                return (
                  <div
                    key={d.toDateString()}
                    className={cn(
                      "flex flex-col p-2 min-h-full space-y-2 transition-colors",
                      isToday ? "bg-blue-50/10" : "bg-white"
                    )}
                  >
                    {/* Quick Add Button */}
                    <button
                      onClick={() =>
                        openCreateIssue({
                          dueDate: d.toISOString(),
                        })
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#e5e7eb] py-1.5 text-xs text-[#6b7280] hover:border-[#3e63dd] hover:text-[#3e63dd] hover:bg-blue-50/20 transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-medium">Add task</span>
                    </button>

                    {/* Scheduled cards in column */}
                    <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                      {dayIssues.map((issue) => {
                        const isOverdue =
                          issue.dueDate &&
                          new Date(issue.dueDate) < new Date() &&
                          issue.state?.group !== "COMPLETED" &&
                          issue.state?.group !== "CANCELED";

                        const isDone = issue.state?.group === "COMPLETED";

                        return (
                          <div
                            key={issue.id}
                            onClick={() => setActiveIssueId(issue.id)}
                            className={cn(
                              "group rounded-xl border bg-white p-3 shadow-2xs hover:shadow-xs hover:border-[#cbd5e1] transition-all cursor-pointer space-y-2",
                              isOverdue
                                ? "border-rose-200 bg-rose-50/20"
                                : isDone
                                ? "border-emerald-200 bg-emerald-50/10"
                                : "border-[#e5e7eb]"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold text-[#3e63dd] bg-blue-50 px-1.5 py-0.5 rounded">
                                {issue.sequenceId}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <PriorityIcon
                                  priority={issue.priority}
                                  size={12}
                                />
                                <StateIcon
                                  group={issue.state?.group}
                                  color={issue.state?.color}
                                  size={12}
                                />
                              </div>
                            </div>

                            <h4
                              className={cn(
                                "text-xs font-semibold text-[#111827] line-clamp-2 leading-snug",
                                isDone && "line-through text-[#6b7280]"
                              )}
                            >
                              {issue.title}
                            </h4>

                            {/* Footer: State & Assignees */}
                            <div className="flex items-center justify-between pt-1 border-t border-[#f1f3f5] text-[10px] text-[#6b7280]">
                              <span className="truncate max-w-[100px]">
                                {issue.state?.name}
                              </span>
                              {issue.assignees && issue.assignees.length > 0 && (
                                <div className="flex -space-x-1">
                                  {issue.assignees.slice(0, 2).map((a, aIdx) => (
                                    <Avatar
                                      key={a.user?.id || aIdx}
                                      className="h-4 w-4 border border-white"
                                    >
                                      {a.user?.avatarUrl && (
                                        <AvatarImage src={a.user.avatarUrl} />
                                      )}
                                      <AvatarFallback className="text-[7px] bg-[#f1f3f5] text-[#374151]">
                                        {a.user?.name?.slice(0, 1)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {dayIssues.length === 0 && (
                        <div className="flex flex-1 items-center justify-center p-4 text-center text-[11px] text-[#9ca3af]">
                          No scheduled items
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            DAY VIEW (Detailed Agenda / Schedule)
           ========================================================================= */}
        {calendarMode === "day" && (
          <div className="flex flex-1 flex-col overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Day Header Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#3e63dd]">
                  {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
                </span>
                <h3 className="text-xl font-bold text-[#111827] mt-0.5">
                  {currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-xs text-[#6b7280] font-mono mt-1">
                  {(issuesByDate.get(currentDate.toDateString()) || []).length}{" "}
                  tasks scheduled for this day
                </p>
              </div>

              <Button
                size="sm"
                onClick={() =>
                  openCreateIssue({
                    dueDate: currentDate.toISOString(),
                  })
                }
                className="bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs text-xs font-medium"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Task for this Day
              </Button>
            </div>

            {/* List of Scheduled Tasks for Current Date */}
            <div className="space-y-3">
              {(issuesByDate.get(currentDate.toDateString()) || []).map((issue) => {
                const isOverdue =
                  issue.dueDate &&
                  new Date(issue.dueDate) < new Date() &&
                  issue.state?.group !== "COMPLETED" &&
                  issue.state?.group !== "CANCELED";
                const isDone = issue.state?.group === "COMPLETED";

                return (
                  <div
                    key={issue.id}
                    onClick={() => setActiveIssueId(issue.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border bg-white p-4 shadow-2xs hover:shadow-xs hover:border-[#cbd5e1] transition-all cursor-pointer group",
                      isOverdue
                        ? "border-rose-200 bg-rose-50/20"
                        : isDone
                        ? "border-emerald-200 bg-emerald-50/10"
                        : "border-[#e5e7eb]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StateIcon
                        group={issue.state?.group}
                        color={issue.state?.color}
                        size={16}
                      />
                      <PriorityIcon priority={issue.priority} size={16} />
                      <span className="font-mono text-xs font-bold text-[#3e63dd] bg-blue-50 px-2 py-0.5 rounded">
                        {project.identifier}-{issue.sequenceId}
                      </span>
                      <span
                        className={cn(
                          "font-semibold text-sm text-[#111827] truncate",
                          isDone && "line-through text-[#6b7280]"
                        )}
                      >
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <span className="text-xs text-[#6b7280] bg-[#f8f9fa] border border-[#e5e7eb] px-2 py-0.5 rounded-md">
                        {issue.state?.name}
                      </span>

                      {issue.assignees && issue.assignees.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6">
                            {issue.assignees[0].user?.avatarUrl && (
                              <AvatarImage
                                src={issue.assignees[0].user.avatarUrl}
                              />
                            )}
                            <AvatarFallback className="text-[9px] bg-[#f1f3f5] text-[#374151]">
                              {issue.assignees[0].user?.name?.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-[#4b5563]">
                            {issue.assignees[0].user?.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {(issuesByDate.get(currentDate.toDateString()) || []).length ===
                0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center text-[#6b7280]">
                  <Clock className="h-8 w-8 text-[#9ca3af] mb-2" />
                  <h4 className="text-sm font-semibold text-[#111827]">
                    No tasks scheduled for this day
                  </h4>
                  <p className="text-xs text-[#6b7280] mt-1">
                    Click "Add Task for this Day" above or drag an unscheduled task
                    into your schedule.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            UNSCHEDULED WORK ITEMS SLIDE-OUT TRAY
           ========================================================================= */}
        {isUnscheduledOpen && (
          <aside className="w-80 border-l border-[#e5e7eb] bg-[#fafafa] flex flex-col shrink-0 z-20 shadow-lg animate-in slide-in-from-right duration-200">
            {/* Tray Header */}
            <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white p-3.5">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[#3e63dd]" />
                <h3 className="text-xs font-bold text-[#111827]">
                  Unscheduled Items
                </h3>
                <span className="rounded-full bg-blue-50 border border-blue-100 px-1.5 py-0.2 font-mono text-[10px] font-bold text-[#3e63dd]">
                  {unscheduledIssues.length}
                </span>
              </div>

              <button
                onClick={() => setIsUnscheduledOpen(false)}
                className="rounded p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
                title="Close tray"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tray Body: List of Unscheduled Issues */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {unscheduledIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-2xs hover:shadow-xs hover:border-[#cbd5e1] transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold text-[#6b7280]">
                      {project.identifier}-{issue.sequenceId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityIcon priority={issue.priority} size={12} />
                      <StateIcon
                        group={issue.state?.group}
                        color={issue.state?.color}
                        size={12}
                      />
                    </div>
                  </div>

                  <h4
                    onClick={() => setActiveIssueId(issue.id)}
                    className="text-xs font-semibold text-[#111827] line-clamp-2 hover:text-[#3e63dd] transition-colors cursor-pointer"
                  >
                    {issue.title}
                  </h4>

                  {/* Quick Schedule Footer */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#f1f3f5]">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateIssueDateMutation.mutate({
                            issueId: issue.id,
                            dueDate: new Date().toISOString(),
                          })
                        }
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] transition-colors cursor-pointer"
                        title="Schedule for Today"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const tom = new Date();
                          tom.setDate(tom.getDate() + 1);
                          updateIssueDateMutation.mutate({
                            issueId: issue.id,
                            dueDate: tom.toISOString(),
                          });
                        }}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] transition-colors cursor-pointer"
                        title="Schedule for Tomorrow"
                      >
                        +1d
                      </button>
                    </div>

                    {/* Inline Date Picker */}
                    <DatePicker
                      size="sm"
                      value={
                        issue.dueDate
                          ? issue.dueDate instanceof Date
                            ? issue.dueDate.toISOString()
                            : String(issue.dueDate)
                          : null
                      }
                      align="right"
                      onChange={(newDate) =>
                        updateIssueDateMutation.mutate({
                          issueId: issue.id,
                          dueDate: newDate,
                        })
                      }
                    />
                  </div>
                </div>
              ))}

              {unscheduledIssues.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center text-[#6b7280]">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <h4 className="text-xs font-semibold text-[#111827]">
                    All caught up!
                  </h4>
                  <p className="text-[11px] text-[#6b7280] mt-1">
                    Every task in this project has a target due date.
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* =========================================================================
          DAY ISSUES MODAL (Opened when clicking "+X more" or day number)
         ========================================================================= */}
      {selectedDayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => setSelectedDayModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl space-y-4 text-xs text-[#111827]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">
                  {selectedDayModal.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-[11px] text-[#6b7280] font-mono mt-0.5">
                  {selectedDayModal.issues.length} work items scheduled
                </p>
              </div>

              <button
                onClick={() => setSelectedDayModal(null)}
                className="text-[#6b7280] hover:text-[#111827] text-base cursor-pointer p-1 rounded-md hover:bg-[#f3f4f6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List of issues for this day */}
            <div className="divide-y divide-[#f1f3f5] max-h-80 overflow-y-auto pr-1">
              {selectedDayModal.issues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => {
                    setSelectedDayModal(null);
                    setActiveIssueId(issue.id);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PriorityIcon priority={issue.priority} size={14} />
                    <StateIcon
                      group={issue.state?.group}
                      color={issue.state?.color}
                      size={14}
                    />
                    <span className="font-mono text-xs font-semibold text-[#6b7280] shrink-0">
                      {project.identifier}-{issue.sequenceId}
                    </span>
                    <span className="truncate font-medium text-xs text-[#111827]">
                      {issue.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] text-[#6b7280]">
                      {issue.state?.name}
                    </span>
                    {issue.assignees && issue.assignees.length > 0 && (
                      <Avatar className="h-5 w-5">
                        {issue.assignees[0].user?.avatarUrl && (
                          <AvatarImage
                            src={issue.assignees[0].user.avatarUrl}
                          />
                        )}
                        <AvatarFallback className="text-[8px] bg-[#f1f3f5] text-[#374151]">
                          {issue.assignees[0].user?.name?.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb]">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const targetDate = selectedDayModal.date.toISOString();
                  setSelectedDayModal(null);
                  openCreateIssue({ dueDate: targetDate });
                }}
                className="flex items-center gap-1.5 text-xs text-[#3e63dd] border-blue-200 hover:bg-blue-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add issue on this date</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedDayModal(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

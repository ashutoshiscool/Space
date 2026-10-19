"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string | Date | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  size?: "sm" | "default";
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Set due date",
  className,
  align = "left",
  size = "default",
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date safely
  const selectedDate = value ? new Date(value) : null;

  // View state for month/year navigation in the calendar
  const [viewDate, setViewDate] = useState(() =>
    selectedDate && !isNaN(selectedDate.getTime()) ? new Date(selectedDate) : new Date()
  );

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setViewDate(new Date(parsed));
      }
    }
  }, [value]);

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleYearChange = (newYear: number) => {
    setViewDate(new Date(newYear, month, 1));
  };

  const handleMonthChange = (newMonth: number) => {
    setViewDate(new Date(year, newMonth, 1));
  };

  const selectDate = (date: Date) => {
    const d = new Date(date);
    // Anchor to noon to prevent UTC timezone date-sliding
    d.setHours(12, 0, 0, 0);
    onChange(d.toISOString());
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  // Helper formatting for trigger button
  const formatTriggerLabel = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return placeholder;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays < 7) {
      return target.toLocaleDateString("en-US", { weekday: "short" });
    }

    return target.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: target.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  // Preset shortcuts
  const applyPreset = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    d.setHours(12, 0, 0, 0);
    selectDate(d);
  };

  const applyNextMonday = () => {
    const d = new Date();
    const currentDay = d.getDay();
    const daysUntilNextMonday = ((7 - currentDay + 1) % 7) || 7;
    d.setDate(d.getDate() + daysUntilNextMonday);
    d.setHours(12, 0, 0, 0);
    selectDate(d);
  };

  const applyThisFriday = () => {
    const d = new Date();
    const currentDay = d.getDay();
    const daysUntilFriday = (5 - currentDay + 7) % 7;
    d.setDate(d.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    d.setHours(12, 0, 0, 0);
    selectDate(d);
  };

  // Calendar Grid computation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Leading days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({
      date: new Date(year, month - 1, day),
      dayNumber: day,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    cells.push({
      date: new Date(year, month, day),
      dayNumber: day,
      isCurrentMonth: true,
    });
  }

  // Trailing days into next month
  const totalGridDays = cells.length > 35 ? 42 : 35;
  const remainingCells = totalGridDays - cells.length;
  for (let day = 1; day <= remainingCells; day++) {
    cells.push({
      date: new Date(year, month + 1, day),
      dayNumber: day,
      isCurrentMonth: false,
    });
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const todayStr = new Date().toDateString();
  const selectedStr =
    selectedDate && !isNaN(selectedDate.getTime())
      ? selectedDate.toDateString()
      : "";

  const isOverdue =
    selectedDate &&
    !isNaN(selectedDate.getTime()) &&
    selectedDate.getTime() < new Date().setHours(0, 0, 0, 0);

  return (
    <div
      className={cn("relative inline-block font-sans", className)}
      ref={containerRef}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border bg-white text-[#111827] shadow-2xs transition-all cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          size === "sm" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-xs",
          isOverdue
            ? "border-rose-200 bg-rose-50/30 text-rose-700 hover:border-rose-300"
            : selectedDate
            ? "border-[#d1d5db] font-medium hover:border-[#9ca3af] hover:bg-[#fafafa]"
            : "border-[#e5e7eb] text-[#6b7280] hover:border-[#cbd5e1] hover:text-[#111827] hover:bg-[#f8f9fa]"
        )}
      >
        <CalendarIcon
          className={cn(
            "shrink-0",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
            isOverdue
              ? "text-rose-600"
              : selectedDate
              ? "text-[#3e63dd]"
              : "text-[#9ca3af]"
          )}
        />
        <span className="truncate">{formatTriggerLabel(selectedDate)}</span>

        {selectedDate && (
          <span
            onClick={clearDate}
            className="rounded p-0.5 text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors ml-0.5 cursor-pointer"
            title="Clear date"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-76 rounded-2xl border border-[#e5e7eb] bg-white p-3.5 shadow-2xl animate-in fade-in-0 zoom-in-95 text-xs text-[#111827]",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {/* Quick Presets Grid */}
          <div className="grid grid-cols-2 gap-1 pb-3 mb-3 border-b border-[#f1f3f5]">
            <button
              type="button"
              onClick={() => applyPreset(0)}
              className="flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer text-left"
            >
              <span>Today</span>
              <span className="text-[10px] text-[#9ca3af] font-mono">Now</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset(1)}
              className="flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer text-left"
            >
              <span>Tomorrow</span>
              <span className="text-[10px] text-[#9ca3af] font-mono">+1d</span>
            </button>
            <button
              type="button"
              onClick={applyThisFriday}
              className="flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer text-left"
            >
              <span>This Friday</span>
              <span className="text-[10px] text-[#9ca3af] font-mono">Fri</span>
            </button>
            <button
              type="button"
              onClick={applyNextMonday}
              className="flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer text-left"
            >
              <span>Next Monday</span>
              <span className="text-[10px] text-[#9ca3af] font-mono">Mon</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer text-left"
            >
              <span>In 1 week</span>
              <span className="text-[10px] text-[#9ca3af] font-mono">+7d</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset(14)}
              className="flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer text-left"
            >
              <span>In 2 weeks</span>
              <span className="text-[10px] text-[#9ca3af] font-mono">+14d</span>
            </button>
          </div>

          {/* Month/Year Navigation with Jump Selectors */}
          <div className="flex items-center justify-between pb-2.5 px-0.5">
            <div className="flex items-center gap-1.5">
              <select
                value={month}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="font-bold text-xs text-[#111827] bg-transparent hover:bg-[#f3f4f6] rounded px-1 py-0.5 cursor-pointer outline-none transition-colors border-0"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="font-mono text-xs text-[#6b7280] font-semibold bg-transparent hover:bg-[#f3f4f6] rounded px-1 py-0.5 cursor-pointer outline-none transition-colors border-0"
              >
                {Array.from({ length: 11 }, (_, i) => 2022 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center rounded-lg border border-[#e5e7eb] bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#9ca3af] pb-1 uppercase tracking-wider select-none">
            {weekDays.map((d, idx) => (
              <div
                key={d}
                className={cn("py-1", (idx === 0 || idx === 6) && "text-[#cbd5e1]")}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid Days */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {cells.map((cell, idx) => {
              const isSelected = cell.date.toDateString() === selectedStr;
              const isToday = cell.date.toDateString() === todayStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDate(cell.date)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-all mx-auto cursor-pointer font-mono font-medium",
                    isSelected
                      ? "bg-[#3e63dd] text-white font-bold shadow-xs hover:bg-[#3451b2]"
                      : isToday
                      ? "text-[#3e63dd] font-bold bg-blue-50 border border-blue-200 hover:bg-blue-100"
                      : cell.isCurrentMonth
                      ? "text-[#111827] hover:bg-[#f3f4f6]"
                      : "text-[#d1d5db] hover:bg-[#f8f9fa]"
                  )}
                >
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer action: Quick Clear / Current status */}
          <div className="pt-2.5 mt-2.5 border-t border-[#f1f3f5] flex justify-between items-center text-[11px]">
            {selectedDate && !isNaN(selectedDate.getTime()) ? (
              <span className="text-[#6b7280] flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#9ca3af]" />
                <span>Due: {formatTriggerLabel(selectedDate)}</span>
              </span>
            ) : (
              <span className="text-[#9ca3af] italic">No due date set</span>
            )}
            {selectedDate && (
              <button
                type="button"
                onClick={clearDate}
                className="text-[#ef4444] hover:underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

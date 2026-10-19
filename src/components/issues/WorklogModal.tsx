"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, X } from "lucide-react";

interface WorklogModalProps {
  issue?: { id: string; sequenceId?: number; project?: { identifier: string } } | null;
  issueId?: string;
  issueKey?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Parses human time strings like "1h 30m", "45m", "2d", "3h" into minutes
export function parseTimeToMinutes(input: string): number {
  const trimmed = input.trim().toLowerCase();
  let totalMinutes = 0;

  const daysMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*d/);
  const hoursMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h/);
  const minutesMatch = trimmed.match(/(\d+)\s*m/);

  if (daysMatch) totalMinutes += parseFloat(daysMatch[1]) * 8 * 60; // 8 hours per work day
  if (hoursMatch) totalMinutes += parseFloat(hoursMatch[1]) * 60;
  if (minutesMatch) totalMinutes += parseInt(minutesMatch[1], 10);

  // If no unit matched, assume hours if small or minutes if large
  if (!daysMatch && !hoursMatch && !minutesMatch) {
    const rawNum = parseFloat(trimmed);
    if (!isNaN(rawNum)) {
      totalMinutes = rawNum < 12 ? Math.round(rawNum * 60) : Math.round(rawNum);
    }
  }

  return Math.max(1, Math.round(totalMinutes));
}

// Formats minutes into "1d 2h 30m"
export function formatMinutesToHuman(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const days = Math.floor(minutes / (8 * 60));
  const remainingAfterDays = minutes % (8 * 60);
  const hours = Math.floor(remainingAfterDays / 60);
  const mins = remainingAfterDays % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

  return parts.join(" ");
}

export function WorklogModal({ issue, issueId: propIssueId, issueKey: propIssueKey, isOpen, onClose }: WorklogModalProps) {
  const targetIssueId = issue?.id || propIssueId || "";
  const targetIssueKey = propIssueKey || (issue?.project ? `${issue.project.identifier}-${issue.sequenceId}` : "Issue");
  const [timeInput, setTimeInput] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const logWorkMutation = useMutation({
    mutationFn: async () => {
      const minutes = parseTimeToMinutes(timeInput);
      if (!minutes || minutes <= 0) {
        throw new Error("Please specify time spent (e.g. 1h 30m, 45m, 2h)");
      }

      const res = await fetch(`/api/issues/${targetIssueId}/worklogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeSpent: minutes,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log work");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", targetIssueId] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setTimeInput("");
      setDescription("");
      setError(null);
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white shadow-2xl overflow-hidden font-sans text-[#111827]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-3.5 bg-[#f8f9fa]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#3e63dd]" />
            <h3 className="text-sm font-semibold text-[#111827]">
              Log Work on <span className="font-mono text-[#3e63dd]">{targetIssueKey}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#6b7280] hover:bg-[#eef0f2] hover:text-[#111827] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Time Spent <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. 2h 30m, 45m, 1d"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="text-xs font-mono"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Format: <code className="bg-[#f3f4f6] px-1 py-0.5 rounded text-[10px]">1d 4h</code> or{" "}
              <code className="bg-[#f3f4f6] px-1 py-0.5 rounded text-[10px]">45m</code> (1d = 8h)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Work Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What did you work on or accomplish?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-xs placeholder:text-[#9ca3af] focus:border-[#3e63dd] focus:ring-1 focus:ring-[#3e63dd] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] px-5 py-3 bg-[#fafafa]">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => logWorkMutation.mutate()}
            disabled={logWorkMutation.isPending || !timeInput.trim()}
            className="text-xs bg-[#3e63dd] hover:bg-[#3352be] text-white"
          >
            {logWorkMutation.isPending ? "Logging..." : "Log Work"}
          </Button>
        </div>
      </div>
    </div>
  );
}

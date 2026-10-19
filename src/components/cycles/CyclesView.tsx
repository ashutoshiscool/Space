"use client";

import React, { useState } from "react";
import { CycleWithMetrics, ProjectWithDetails } from "@/lib/types";
import { CycleBurndownChart } from "./CycleBurndownChart";
import { CycleCompleteModal } from "./CycleCompleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RotateCcw, CheckCircle2, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CyclesViewProps {
  cycles: CycleWithMetrics[];
  project: ProjectWithDetails;
}

export function CyclesView({ cycles, project }: CyclesViewProps) {
  const [selectedCycleToComplete, setSelectedCycleToComplete] =
    useState<CycleWithMetrics | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState("");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(() =>
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const queryClient = useQueryClient();

  const activeCycle = cycles.find((c) => !c.isCompleted);
  const upcomingCycles = cycles.filter(
    (c) => !c.isCompleted && c.id !== activeCycle?.id
  );
  const completedCycles = cycles.filter((c) => c.isCompleted);

  const createCycleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCycleName.trim(),
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create cycle");
      return res.json();
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setNewCycleName("");
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#111827]">
            Sprints & Cycles
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Time-boxed iterations with automated burndown metrics and rollover
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 h-8 text-xs font-medium bg-[#3e63dd] hover:bg-[#3451b2] text-white rounded-md shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Sprint Cycle</span>
        </Button>
      </div>

      {/* Active Sprint Section */}
      {activeCycle ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Active Sprint
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#111827]">{activeCycle.name}</h3>
              {activeCycle.description && (
                <p className="text-xs text-[#6b7280]">{activeCycle.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#6b7280] bg-[#f8f9fa] border border-[#e5e7eb] rounded-md px-2.5 py-1">
                <Calendar className="h-3.5 w-3.5 text-[#9ca3af]" />
                <span>
                  {formatDate(activeCycle.startDate)} - {formatDate(activeCycle.endDate)}
                </span>
              </div>

              <Button
                size="sm"
                onClick={() => setSelectedCycleToComplete(activeCycle)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs h-7 text-xs"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Complete Sprint
              </Button>
            </div>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3">
              <div className="text-[#6b7280] text-[10px] uppercase tracking-wider font-semibold">Total Scope</div>
              <div className="text-lg font-bold text-[#111827] mt-1 font-mono">
                {activeCycle.totalPoints > 0
                  ? `${activeCycle.totalPoints} pts`
                  : `${activeCycle.totalIssues} issues`}
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3">
              <div className="text-[#6b7280] text-[10px] uppercase tracking-wider font-semibold">Completed</div>
              <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">
                {activeCycle.totalPoints > 0
                  ? `${activeCycle.completedPoints} pts`
                  : `${activeCycle.completedIssues} issues`}
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3">
              <div className="text-[#6b7280] text-[10px] uppercase tracking-wider font-semibold">Remaining</div>
              <div className="text-lg font-bold text-amber-600 mt-1 font-mono">
                {activeCycle.totalPoints > 0
                  ? `${activeCycle.totalPoints - activeCycle.completedPoints} pts`
                  : `${activeCycle.totalIssues - activeCycle.completedIssues} issues`}
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3">
              <div className="text-[#6b7280] text-[10px] uppercase tracking-wider font-semibold">Progress</div>
              <div className="text-lg font-bold text-[#3e63dd] mt-1 font-mono">
                {activeCycle.progressPercent}%
              </div>
            </div>
          </div>

          {/* Burndown Chart */}
          <CycleBurndownChart
            burndown={activeCycle.burndown}
            totalScope={
              activeCycle.totalPoints > 0
                ? activeCycle.totalPoints
                : activeCycle.totalIssues
            }
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center text-[#6b7280] shadow-xs">
          <RotateCcw className="h-8 w-8 text-[#9ca3af] mb-2" />
          <h4 className="text-sm font-semibold text-[#111827]">No active sprint</h4>
          <p className="text-xs mt-1">Start a sprint cycle to monitor team velocity and burn down issues</p>
        </div>
      )}

      {/* Completed Sprints History */}
      {completedCycles.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
            Completed Sprints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedCycles.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-white p-4 text-xs shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-[#111827]">{c.name}</span>
                  </div>
                  <span className="text-[11px] text-[#6b7280]">
                    {formatDate(c.startDate)} - {formatDate(c.endDate)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-emerald-600 font-mono">
                    {c.completedIssues} / {c.totalIssues} completed
                  </span>
                  <div className="text-[11px] text-[#6b7280]">100% velocity</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Sprint Modal */}
      {selectedCycleToComplete && (
        <CycleCompleteModal
          cycle={selectedCycleToComplete}
          upcomingCycles={upcomingCycles}
          isOpen={!!selectedCycleToComplete}
          onClose={() => setSelectedCycleToComplete(null)}
        />
      )}

      {/* Create Sprint Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-2xl space-y-4 text-[#111827]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-[#111827]">Create Sprint Cycle</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#374151] font-medium block mb-1">Cycle Name</label>
                <Input
                  autoFocus
                  placeholder="e.g. Sprint 16"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#374151] font-medium block mb-1">Start Date</label>
                  <DatePicker
                    value={startDate}
                    onChange={(d) => setStartDate(d || new Date().toISOString())}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-[#374151] font-medium block mb-1">End Date</label>
                  <DatePicker
                    value={endDate}
                    onChange={(d) =>
                      setEndDate(
                        d || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb]">
              <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newCycleName.trim() || createCycleMutation.isPending}
                onClick={() => createCycleMutation.mutate()}
                className="bg-[#3e63dd] hover:bg-[#3451b2] text-white font-medium shadow-xs"
              >
                {createCycleMutation.isPending ? "Creating..." : "Create Cycle"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

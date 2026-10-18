"use client";

import React, { useState } from "react";
import { CycleWithMetrics, ProjectWithDetails } from "@/lib/types";
import { CycleBurndownChart } from "./CycleBurndownChart";
import { CycleCompleteModal } from "./CycleCompleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RotateCcw, CheckCircle2, Calendar, Target } from "lucide-react";
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
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
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
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Sprints & Cycles
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Time-boxed iterations with automated burndown metrics and rollover
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Sprint Cycle</span>
        </Button>
      </div>

      {/* Active Sprint Section */}
      {activeCycle ? (
        <div className="rounded-2xl border border-zinc-800/90 bg-[#121215] p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Active Sprint
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-100">{activeCycle.name}</h3>
              {activeCycle.description && (
                <p className="text-xs text-zinc-400">{activeCycle.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <span>
                  {formatDate(activeCycle.startDate)} - {formatDate(activeCycle.endDate)}
                </span>
              </div>

              <Button
                size="sm"
                onClick={() => setSelectedCycleToComplete(activeCycle)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Complete Sprint
              </Button>
            </div>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
              <div className="text-zinc-500 text-[11px]">Total Scope</div>
              <div className="text-xl font-bold text-zinc-100 mt-1">
                {activeCycle.totalPoints > 0
                  ? `${activeCycle.totalPoints} pts`
                  : `${activeCycle.totalIssues} issues`}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
              <div className="text-zinc-500 text-[11px]">Completed</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {activeCycle.totalPoints > 0
                  ? `${activeCycle.completedPoints} pts`
                  : `${activeCycle.completedIssues} issues`}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
              <div className="text-zinc-500 text-[11px]">Remaining</div>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {activeCycle.totalPoints > 0
                  ? `${activeCycle.totalPoints - activeCycle.completedPoints} pts`
                  : `${activeCycle.totalIssues - activeCycle.completedIssues} issues`}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
              <div className="text-zinc-500 text-[11px]">Progress</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          <RotateCcw className="h-8 w-8 text-zinc-600 mb-2" />
          <h4 className="text-sm font-semibold text-zinc-300">No active sprint</h4>
          <p className="text-xs mt-1">Start a sprint cycle to monitor team velocity and burn down issues</p>
        </div>
      )}

      {/* Completed Sprints History */}
      {completedCycles.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Completed Sprints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedCycles.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-[#121215] p-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-zinc-200">{c.name}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {formatDate(c.startDate)} - {formatDate(c.endDate)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-emerald-400">
                    {c.completedIssues} / {c.totalIssues} completed
                  </span>
                  <div className="text-[11px] text-zinc-500">100% velocity</div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-100">Create Sprint Cycle</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Cycle Name</label>
                <Input
                  autoFocus
                  placeholder="e.g. Sprint 16"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newCycleName.trim() || createCycleMutation.isPending}
                onClick={() => createCycleMutation.mutate()}
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

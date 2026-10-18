"use client";

import React, { useState } from "react";
import { CycleWithMetrics } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CycleCompleteModalProps {
  cycle: CycleWithMetrics;
  upcomingCycles: CycleWithMetrics[];
  isOpen: boolean;
  onClose: () => void;
}

export function CycleCompleteModal({
  cycle,
  upcomingCycles,
  isOpen,
  onClose,
}: CycleCompleteModalProps) {
  const [targetCycleId, setTargetCycleId] = useState<string | null>(
    upcomingCycles[0]?.id || null
  );
  const queryClient = useQueryClient();

  const completeCycleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cycles/${cycle.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rolloverToCycleId: targetCycleId }),
      });
      if (!res.ok) throw new Error("Failed to complete cycle");
      return res.json();
    },
    onSuccess: () => {
      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#10b981", "#f59e0b", "#ec4899"],
      });

      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      onClose();
    },
  });

  if (!isOpen) return null;

  const incompleteCount = cycle.totalIssues - cycle.completedIssues;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in-0"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl text-zinc-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold">Complete {cycle.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {cycle.completedIssues}
            </div>
            <div className="text-zinc-400">Completed issues</div>
          </div>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {incompleteCount}
            </div>
            <div className="text-zinc-400">Incomplete issues</div>
          </div>
        </div>

        {/* Rollover Section */}
        {incompleteCount > 0 && (
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-zinc-300">
              Move remaining {incompleteCount} open {incompleteCount === 1 ? "issue" : "issues"} to:
            </label>
            <div className="space-y-1.5">
              {upcomingCycles.map((up) => (
                <label
                  key={up.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 hover:bg-zinc-800/60 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rollover"
                    checked={targetCycleId === up.id}
                    onChange={() => setTargetCycleId(up.id)}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-200">{up.name}</span>
                    <span className="text-[10px] text-zinc-500">Next active sprint</span>
                  </div>
                </label>
              ))}

              <label className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 hover:bg-zinc-800/60 cursor-pointer">
                <input
                  type="radio"
                  name="rollover"
                  checked={targetCycleId === null}
                  onChange={() => setTargetCycleId(null)}
                  className="text-indigo-600 focus:ring-0"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-200">Product Backlog</span>
                  <span className="text-[10px] text-zinc-500">Remove cycle assignment</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => completeCycleMutation.mutate()}
            disabled={completeCycleMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {completeCycleMutation.isPending ? "Completing..." : "Complete Sprint"}
          </Button>
        </div>
      </div>
    </div>
  );
}

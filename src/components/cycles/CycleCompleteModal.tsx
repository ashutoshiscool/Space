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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl text-[#111827] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-[#111827]">Complete {cycle.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {cycle.completedIssues}
            </div>
            <div className="text-[#6b7280] mt-0.5">Completed issues</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {incompleteCount}
            </div>
            <div className="text-[#6b7280] mt-0.5">Incomplete issues</div>
          </div>
        </div>

        {/* Rollover Section */}
        {incompleteCount > 0 && (
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-[#374151]">
              Move remaining {incompleteCount} open {incompleteCount === 1 ? "issue" : "issues"} to:
            </label>
            <div className="space-y-1.5">
              {upcomingCycles.map((up) => (
                <label
                  key={up.id}
                  className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-2.5 hover:bg-[#f1f3f5] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="rollover"
                    checked={targetCycleId === up.id}
                    onChange={() => setTargetCycleId(up.id)}
                    className="text-[#3e63dd] focus:ring-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-[#111827]">{up.name}</span>
                    <span className="text-[10px] text-[#6b7280]">Next active sprint</span>
                  </div>
                </label>
              ))}

              <label className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-2.5 hover:bg-[#f1f3f5] cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="rollover"
                  checked={targetCycleId === null}
                  onChange={() => setTargetCycleId(null)}
                  className="text-[#3e63dd] focus:ring-0"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-[#111827]">Product Backlog</span>
                  <span className="text-[10px] text-[#6b7280]">Remove cycle assignment</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb]">
          <Button variant="outline" size="sm" onClick={onClose} className="border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => completeCycleMutation.mutate()}
            disabled={completeCycleMutation.isPending}
            className="bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs"
          >
            {completeCycleMutation.isPending ? "Completing..." : "Complete Sprint"}
          </Button>
        </div>
      </div>
    </div>
  );
}

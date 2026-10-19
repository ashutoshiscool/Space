"use client";

import React, { useState } from "react";
import { ModuleWithMetrics, ProjectWithDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Layers, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ModulesViewProps {
  modules: ModuleWithMetrics[];
  project: ProjectWithDetails;
}

export function ModulesView({ modules, project }: ModulesViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createModuleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          leadId,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create module");
      return res.json();
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setName("");
      setDescription("");
      setStartDate(null);
      setTargetDate(null);
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#111827]">
            Modules & Initiatives
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Group issues into high-level features and track dynamic delivery progress
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 h-8 text-xs font-medium bg-[#3e63dd] hover:bg-[#3451b2] text-white rounded-md shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Module</span>
        </Button>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="flex flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-xs hover:border-[#cbd5e1] hover:shadow-sm transition-all space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    mod.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : mod.status === "IN_PROGRESS"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]"
                  }`}
                >
                  {mod.status.replace("_", " ")}
                </span>

                {mod.lead && (
                  <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                    <Avatar className="h-4.5 w-4.5 ring-1 ring-[#e5e7eb]">
                      {mod.lead.avatarUrl && <AvatarImage src={mod.lead.avatarUrl} />}
                      <AvatarFallback className="text-[9px] bg-[#f1f3f5] text-[#111827]">{mod.lead.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[100px] text-[11px]">{mod.lead.name}</span>
                  </div>
                )}
              </div>

              <h3 className="text-sm font-semibold text-[#111827]">{mod.name}</h3>
              {mod.description && (
                <p className="text-xs text-[#6b7280] line-clamp-2 leading-relaxed">
                  {mod.description}
                </p>
              )}
            </div>

            {/* Progress Section */}
            <div className="space-y-2 pt-2 border-t border-[#e5e7eb]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280] text-[11px]">
                  {mod.completedIssues} of {mod.totalIssues} completed
                </span>
                <span className="font-semibold text-[#111827] font-mono text-[11px]">
                  {mod.progressPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f3f5]">
                <div
                  className="h-full rounded-full bg-[#3e63dd] transition-all duration-300"
                  style={{ width: `${mod.progressPercent}%` }}
                />
              </div>

              {/* Timeline Dates */}
              {(mod.startDate || mod.targetDate) && (
                <div className="flex items-center gap-1 text-[10px] text-[#6b7280] pt-0.5">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(mod.startDate)} - {formatDate(mod.targetDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {modules.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center text-[#6b7280] shadow-xs">
            <Layers className="h-8 w-8 text-[#9ca3af] mb-2" />
            <h4 className="text-sm font-semibold text-[#111827]">No modules yet</h4>
            <p className="text-xs text-[#6b7280] mt-1">Create your first initiative to cluster issues and track progress</p>
          </div>
        )}
      </div>

      {/* Create Module Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-[#111827]">Create Initiative / Module</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#374151] font-medium block mb-1">Module Name</label>
                <Input
                  autoFocus
                  placeholder="e.g. Real-Time Collaboration Engine"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[#374151] font-medium block mb-1">Description</label>
                <textarea
                  placeholder="Outline the high-level roadmap and goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-md border border-[#e5e7eb] bg-white p-2 text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#3e63dd]"
                />
              </div>

              <div>
                <label className="text-[#374151] font-medium block mb-1">Lead</label>
                <select
                  value={leadId || ""}
                  onChange={(e) => setLeadId(e.target.value || null)}
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#3e63dd]"
                >
                  <option value="">No lead assigned</option>
                  {project.members.map(({ user }) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#374151] font-medium block mb-1">Start Date</label>
                  <DatePicker
                    value={startDate}
                    placeholder="Set start date"
                    onChange={setStartDate}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-[#374151] font-medium block mb-1">Target Date</label>
                  <DatePicker
                    value={targetDate}
                    placeholder="Set target date"
                    onChange={setTargetDate}
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
                disabled={!name.trim() || createModuleMutation.isPending}
                onClick={() => createModuleMutation.mutate()}
                className="bg-[#3e63dd] hover:bg-[#3451b2] text-white font-medium shadow-xs"
              >
                {createModuleMutation.isPending ? "Creating..." : "Create Module"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

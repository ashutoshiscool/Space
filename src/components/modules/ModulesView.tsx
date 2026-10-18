"use client";

import React, { useState } from "react";
import { ModuleWithMetrics, ProjectWithDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Layers, Calendar, CheckCircle, Clock } from "lucide-react";
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
        }),
      });
      if (!res.ok) throw new Error("Failed to create module");
      return res.json();
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Modules & Initiatives
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Group issues into high-level features and track dynamic delivery progress
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Module</span>
        </Button>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm hover:border-zinc-700 transition-all space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    mod.status === "COMPLETED"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/50"
                      : mod.status === "IN_PROGRESS"
                      ? "bg-amber-950/60 text-amber-400 border border-amber-900/50"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  {mod.status.replace("_", " ")}
                </span>

                {mod.lead && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Avatar className="h-5 w-5">
                      {mod.lead.avatarUrl && <AvatarImage src={mod.lead.avatarUrl} />}
                      <AvatarFallback>{mod.lead.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[100px]">{mod.lead.name}</span>
                  </div>
                )}
              </div>

              <h3 className="text-base font-semibold text-zinc-100">{mod.name}</h3>
              {mod.description && (
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {mod.description}
                </p>
              )}
            </div>

            {/* Progress Section */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {mod.completedIssues} of {mod.totalIssues} completed
                </span>
                <span className="font-semibold text-indigo-400">
                  {mod.progressPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${mod.progressPercent}%` }}
                />
              </div>

              {/* Timeline Dates */}
              {(mod.startDate || mod.targetDate) && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-500 pt-1">
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
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
            <Layers className="h-8 w-8 text-zinc-600 mb-2" />
            <h4 className="text-sm font-semibold text-zinc-300">No modules yet</h4>
            <p className="text-xs mt-1">Create your first initiative to cluster issues and track progress</p>
          </div>
        )}
      </div>

      {/* Create Module Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-100">Create New Module</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Module Name</label>
                <Input
                  autoFocus
                  placeholder="e.g. Mobile App Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview of initiative..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-none"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Lead</label>
                <select
                  value={leadId || ""}
                  onChange={(e) => setLeadId(e.target.value || null)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-none"
                >
                  <option value="">No Lead</option>
                  {project.members.map(({ user }) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!name.trim() || createModuleMutation.isPending}
                onClick={() => createModuleMutation.mutate()}
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

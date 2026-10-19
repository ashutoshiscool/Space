"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IssueWithDetails, ProjectWithDetails, User } from "@/lib/types";
import { IssuePriority, StateGroup } from "@prisma/client";
import { useSpaceStore } from "@/lib/store";
import {
  Layers,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Trash2,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { cn } from "@/lib/utils";

export interface CustomViewDefinition {
  id: string;
  name: string;
  description: string;
  isPreset?: boolean;
  filters: {
    stateIds?: string[];
    stateGroups?: StateGroup[];
    priorities?: IssuePriority[];
    assigneeIds?: string[];
    unassignedOnly?: boolean;
  };
}

interface CustomViewsViewProps {
  issues: IssueWithDetails[];
  project: ProjectWithDetails;
  workspaceSlug: string;
}

export function CustomViewsView({
  issues,
  project,
  workspaceSlug,
}: CustomViewsViewProps) {
  const router = useRouter();
  const togglePriorityFilter = useSpaceStore((s) => s.togglePriorityFilter);
  const toggleStateFilter = useSpaceStore((s) => s.toggleStateFilter);
  const toggleAssigneeFilter = useSpaceStore((s) => s.toggleAssigneeFilter);
  const clearFilters = useSpaceStore((s) => s.clearFilters);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDesc, setNewViewDesc] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<IssuePriority[]>([]);
  const [selectedStateIds, setSelectedStateIds] = useState<string[]>([]);
  const [customViews, setCustomViews] = useState<CustomViewDefinition[]>([]);

  // Built-in Presets
  const presetViews: CustomViewDefinition[] = useMemo(
    () => [
      {
        id: "preset-open",
        name: "All Open Issues",
        description: "Active work across backlog, unstarted, and in-progress states.",
        isPreset: true,
        filters: {
          stateGroups: [StateGroup.BACKLOG, StateGroup.UNSTARTED, StateGroup.STARTED],
        },
      },
      {
        id: "preset-urgent-high",
        name: "Urgent & High Priority",
        description: "Critical blockers and top-priority tickets requiring immediate action.",
        isPreset: true,
        filters: {
          priorities: [IssuePriority.URGENT, IssuePriority.HIGH],
        },
      },
      {
        id: "preset-in-progress",
        name: "In Progress Work",
        description: "Tickets actively being developed or undergoing review right now.",
        isPreset: true,
        filters: {
          stateGroups: [StateGroup.STARTED],
        },
      },
      {
        id: "preset-unassigned",
        name: "Unassigned Triage",
        description: "Backlog items without an owner waiting for team allocation.",
        isPreset: true,
        filters: {
          unassignedOnly: true,
        },
      },
      {
        id: "preset-completed",
        name: "Recently Completed",
        description: "Delivered issues and features resolved in this project.",
        isPreset: true,
        filters: {
          stateGroups: [StateGroup.COMPLETED],
        },
      },
    ],
    []
  );

  // Load user custom views from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`space_views_${project.id}`);
      if (saved) {
        setCustomViews(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [project.id]);

  const saveCustomViews = (views: CustomViewDefinition[]) => {
    setCustomViews(views);
    try {
      localStorage.setItem(`space_views_${project.id}`, JSON.stringify(views));
    } catch {
      // ignore
    }
  };

  const handleCreateView = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    const newView: CustomViewDefinition = {
      id: `view-${Date.now()}`,
      name: newViewName.trim(),
      description: newViewDesc.trim() || "Custom filtered project view.",
      filters: {
        priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
        stateIds: selectedStateIds.length > 0 ? selectedStateIds : undefined,
      },
    };

    const updated = [newView, ...customViews];
    saveCustomViews(updated);

    setNewViewName("");
    setNewViewDesc("");
    setSelectedPriorities([]);
    setSelectedStateIds([]);
    setIsCreateModalOpen(false);
  };

  const handleDeleteView = (viewId: string) => {
    const updated = customViews.filter((v) => v.id !== viewId);
    saveCustomViews(updated);
  };

  // Calculate matching issue count for a view
  const calculateIssueCount = (view: CustomViewDefinition) => {
    return issues.filter((issue) => {
      if (view.filters.priorities && view.filters.priorities.length > 0) {
        if (!view.filters.priorities.includes(issue.priority)) return false;
      }
      if (view.filters.stateIds && view.filters.stateIds.length > 0) {
        if (!view.filters.stateIds.includes(issue.stateId)) return false;
      }
      if (view.filters.stateGroups && view.filters.stateGroups.length > 0) {
        if (!view.filters.stateGroups.includes(issue.state.group)) return false;
      }
      if (view.filters.unassignedOnly) {
        if (issue.assignees && issue.assignees.length > 0) return false;
      }
      return true;
    }).length;
  };

  // Apply filters and redirect to issues list
  const applyView = (view: CustomViewDefinition) => {
    clearFilters();
    if (view.filters.priorities) {
      view.filters.priorities.forEach((p) => togglePriorityFilter(p));
    }
    if (view.filters.stateIds) {
      view.filters.stateIds.forEach((s) => toggleStateFilter(s));
    }
    router.push(`/${workspaceSlug}/${project.identifier}/issues`);
  };

  const allViews = [...presetViews, ...customViews];
  const filteredViews = allViews.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white p-6 space-y-6 text-[#111827]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#3e63dd]" />
            <h1 className="text-base font-semibold text-[#111827]">Views</h1>
            <span className="rounded-full bg-[#f1f3f5] border border-[#e5e7eb] px-2 py-0.5 text-[10px] font-mono text-[#6b7280]">
              {allViews.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6b7280]">
            Create, manage, and switch between saved filter views and issue scopes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search views..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#e5e7eb] bg-white py-1.5 pl-8 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd] focus:ring-1 focus:ring-[#3e63dd] focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-[#3e63dd] hover:bg-[#3451b2] px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create View</span>
          </button>
        </div>
      </div>

      {/* Grid of Views */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredViews.map((view) => {
          const matchCount = calculateIssueCount(view);
          return (
            <div
              key={view.id}
              className="group relative flex flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white hover:border-[#cbd5e1] hover:shadow-xs p-5 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Bookmark
                      className={cn(
                        "h-4 w-4",
                        view.isPreset ? "text-[#3e63dd]" : "text-amber-500"
                      )}
                    />
                    <h3 className="text-xs font-semibold text-[#111827] group-hover:text-[#3e63dd] transition-colors">
                      {view.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#f1f3f5] border border-[#e5e7eb] px-1.5 py-0.5 font-mono text-[10px] text-[#4b5563]">
                      {matchCount} {matchCount === 1 ? "issue" : "issues"}
                    </span>
                    {!view.isPreset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteView(view.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#9ca3af] hover:text-rose-600 transition-opacity cursor-pointer"
                        title="Delete view"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#6b7280] line-clamp-2 leading-relaxed mb-4">
                  {view.description}
                </p>

                {/* Filter tags preview */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {view.filters.priorities && (
                    <div className="flex items-center gap-1 rounded bg-[#f8f9fa] px-2 py-0.5 text-[10px] text-[#374151] border border-[#e5e7eb]">
                      <span className="text-[#6b7280]">Priority:</span>
                      {view.filters.priorities.map((p) => (
                        <span key={p} className="font-semibold capitalize text-[#111827]">
                          {p.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  {view.filters.stateGroups && (
                    <div className="flex items-center gap-1 rounded bg-[#f8f9fa] px-2 py-0.5 text-[10px] text-[#374151] border border-[#e5e7eb]">
                      <span className="text-[#6b7280]">State:</span>
                      {view.filters.stateGroups.map((g) => (
                        <span key={g} className="font-semibold capitalize text-[#111827]">
                          {g.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  {view.filters.unassignedOnly && (
                    <div className="rounded bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 border border-amber-200">
                      Unassigned
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => applyView(view)}
                className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-1.5 text-xs font-medium text-[#374151] hover:border-[#cbd5e1] hover:bg-white hover:text-[#3e63dd] transition-all cursor-pointer"
              >
                <span>Apply & Open View</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#9ca3af] group-hover:text-[#3e63dd] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Custom View Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-2xl space-y-4 text-[#111827]">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-[#3e63dd]" />
                <h2 className="text-sm font-semibold text-[#111827]">
                  Create Custom View
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#9ca3af] hover:text-[#111827] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateView} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  View Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Critical Bugs"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd] focus:ring-1 focus:ring-[#3e63dd] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of what this view is for..."
                  value={newViewDesc}
                  onChange={(e) => setNewViewDesc(e.target.value)}
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd] focus:ring-1 focus:ring-[#3e63dd] focus:outline-hidden resize-none"
                />
              </div>

              {/* Priority Filters */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Filter by Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    IssuePriority.URGENT,
                    IssuePriority.HIGH,
                    IssuePriority.MEDIUM,
                    IssuePriority.LOW,
                    IssuePriority.NONE,
                  ].map((p) => {
                    const isSelected = selectedPriorities.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() =>
                          setSelectedPriorities((prev) =>
                            isSelected
                              ? prev.filter((item) => item !== p)
                              : [...prev, p]
                          )}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs border transition-colors cursor-pointer",
                          isSelected
                            ? "bg-[#eff6ff] border-blue-200 text-[#3e63dd] font-medium"
                            : "bg-[#f8f9fa] border-[#e5e7eb] text-[#4b5563] hover:bg-white"
                        )}
                      >
                        <PriorityIcon priority={p} className="h-3 w-3" />
                        <span className="capitalize">{p.toLowerCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* State Filters */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Filter by State
                </label>
                <div className="flex flex-wrap gap-2">
                  {project.states.map((st) => {
                    const isSelected = selectedStateIds.includes(st.id);
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() =>
                          setSelectedStateIds((prev) =>
                            isSelected
                              ? prev.filter((item) => item !== st.id)
                              : [...prev, st.id]
                          )}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs border transition-colors cursor-pointer",
                          isSelected
                            ? "bg-[#eff6ff] border-blue-200 text-[#3e63dd] font-medium"
                            : "bg-[#f8f9fa] border-[#e5e7eb] text-[#4b5563] hover:bg-white"
                        )}
                      >
                        <StateIcon group={st.group} color={st.color} className="h-3 w-3" />
                        <span>{st.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-md px-3 py-1.5 text-xs text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#3e63dd] hover:bg-[#3451b2] px-4 py-1.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
                >
                  Save View
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

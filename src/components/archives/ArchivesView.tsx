"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";
import { IssuePriority } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Search,
  RotateCcw,
  Trash2,
  Calendar,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StateIcon } from "@/components/ui/StateIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, cn } from "@/lib/utils";

interface ArchivesViewProps {
  initialIssues: IssueWithDetails[];
  project: ProjectWithDetails;
}

export function ArchivesView({ initialIssues, project }: ArchivesViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [issues, setIssues] = useState<IssueWithDetails[]>(initialIssues);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Filter archived issues
  const filteredIssues = useMemo(() => {
    let list = [...issues];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          `${project.identifier}-${i.sequenceId}`.toLowerCase().includes(q)
      );
    }
    if (selectedPriority !== "ALL") {
      list = list.filter((i) => i.priority === selectedPriority);
    }
    return list;
  }, [issues, searchQuery, selectedPriority, project.identifier]);

  // Restore issue
  const handleRestore = async (issueId: string) => {
    setIsProcessing(issueId);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (res.ok) {
        setIssues((prev) => prev.filter((i) => i.id !== issueId));
        queryClient.invalidateQueries({ queryKey: ["issues"] });
      }
    } catch {
      // error handling
    } finally {
      setIsProcessing(null);
    }
  };

  // Permanently delete issue
  const handleDeletePermanently = async (issueId: string) => {
    if (!confirm("Are you sure you want to permanently delete this issue? This action cannot be undone.")) {
      return;
    }
    setIsProcessing(issueId);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIssues((prev) => prev.filter((i) => i.id !== issueId));
        queryClient.invalidateQueries({ queryKey: ["issues"] });
      }
    } catch {
      // error handling
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white p-6 space-y-6 text-[#111827]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-500" />
            <h1 className="text-base font-semibold text-[#111827]">Archived Issues</h1>
            <span className="rounded-full bg-[#f8f9fa] border border-[#e5e7eb] px-2 py-0.5 text-[10px] font-mono text-[#6b7280]">
              {issues.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6b7280]">
            View, restore, or permanently remove archived issues for {project.name}.
          </p>
        </div>

        {/* Search & Priority Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search archived..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#e5e7eb] bg-white py-1.5 pl-8 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd] focus:outline-hidden shadow-xs"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-xs text-[#374151] focus:border-[#3e63dd] focus:outline-hidden shadow-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value={IssuePriority.URGENT}>Urgent</option>
            <option value={IssuePriority.HIGH}>High</option>
            <option value={IssuePriority.MEDIUM}>Medium</option>
            <option value={IssuePriority.LOW}>Low</option>
            <option value={IssuePriority.NONE}>None</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-xs">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Archive className="h-10 w-10 text-[#9ca3af] mx-auto" />
            <h3 className="text-sm font-semibold text-[#111827]">No archived issues</h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
              {issues.length === 0
                ? "Archived issues will show up here. You can archive completed or canceled tickets from their detail modal."
                : "No archived issues match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f3f5]">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between p-3.5 hover:bg-[#f8f9fa] transition-colors group"
              >
                <div className="flex items-center gap-3 truncate">
                  <PriorityIcon priority={issue.priority} size={14} />
                  <span className="font-mono text-[11px] text-[#4b5563] bg-[#f3f4f6] border border-[#e5e7eb] rounded px-1.5 py-0.5 shrink-0 font-medium">
                    {project.identifier}-{issue.sequenceId}
                  </span>
                  <span className="text-xs font-medium text-[#111827] truncate group-hover:text-[#3e63dd]">
                    {issue.title}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <StateIcon group={issue.state.group} color={issue.state.color} size={13} />
                    <span className="text-xs text-[#6b7280] font-medium">{issue.state.name}</span>
                  </div>

                  <span className="text-[11px] text-[#6b7280] font-mono hidden md:inline">
                    Updated {formatDate(issue.updatedAt)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isProcessing === issue.id}
                      onClick={() => handleRestore(issue.id)}
                      className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-[#3e63dd] hover:bg-[#eff6ff] transition-colors cursor-pointer border border-[#e5e7eb] bg-white shadow-xs"
                      title="Restore issue to active project board"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Restore</span>
                    </button>

                    <button
                      disabled={isProcessing === issue.id}
                      onClick={() => handleDeletePermanently(issue.id)}
                      className="p-1 rounded-md text-[#9ca3af] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Permanently delete issue"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

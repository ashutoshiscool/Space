"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectWithDetails, WorkspaceWithDetails } from "@/lib/types";
import { IssuePriority } from "@prisma/client";
import {
  FileEdit,
  Plus,
  Trash2,
  Send,
  Calendar,
  AlertCircle,
  FolderKanban,
  Check,
} from "lucide-react";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { formatDate, cn } from "@/lib/utils";

export interface DraftIssue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: IssuePriority;
  updatedAt: string;
}

interface DraftsViewProps {
  workspace: WorkspaceWithDetails;
}

export function DraftsView({ workspace }: DraftsViewProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftIssue[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load drafts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`space_drafts_${workspace.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDrafts(parsed);
          setSelectedDraftId(parsed[0].id);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Default sample draft if empty
    if (workspace.projects.length > 0) {
      const sampleDraft: DraftIssue = {
        id: `draft-${Date.now()}`,
        projectId: workspace.projects[0].id,
        title: "Draft: Improve API caching & query efficiency",
        description: "Explore Redis response caching for high-frequency workspace and project state lookups.",
        priority: IssuePriority.HIGH,
        updatedAt: new Date().toISOString(),
      };
      setDrafts([sampleDraft]);
      setSelectedDraftId(sampleDraft.id);
    }
  }, [workspace.id, workspace.projects]);

  const saveDrafts = (newDrafts: DraftIssue[]) => {
    setDrafts(newDrafts);
    try {
      localStorage.setItem(`space_drafts_${workspace.id}`, JSON.stringify(newDrafts));
    } catch {
      // ignore
    }
  };

  const handleCreateDraft = () => {
    if (workspace.projects.length === 0) return;
    const newDraft: DraftIssue = {
      id: `draft-${Date.now()}`,
      projectId: workspace.projects[0].id,
      title: "Untitled Draft",
      description: "",
      priority: IssuePriority.NONE,
      updatedAt: new Date().toISOString(),
    };
    const updated = [newDraft, ...drafts];
    saveDrafts(updated);
    setSelectedDraftId(newDraft.id);
  };

  const handleUpdateDraft = (id: string, updates: Partial<DraftIssue>) => {
    const updated = drafts.map((d) =>
      d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
    );
    saveDrafts(updated);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    saveDrafts(updated);
    if (selectedDraftId === id) {
      setSelectedDraftId(updated[0]?.id || null);
    }
  };

  const handlePublishDraft = async (draft: DraftIssue) => {
    if (!draft.title.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${draft.projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          priority: draft.priority,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Remove published draft
        handleDeleteDraft(draft.id);
        const proj = workspace.projects.find((p) => p.id === draft.projectId);
        if (proj) {
          router.push(`/${workspace.slug}/${proj.identifier}/issues`);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDraft = drafts.find((d) => d.id === selectedDraftId) || drafts[0];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white p-6 space-y-6 text-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-[#3e63dd]" />
            <h1 className="text-base font-semibold text-[#111827]">Drafts</h1>
            <span className="rounded-full bg-[#f8f9fa] border border-[#e5e7eb] px-2 py-0.5 text-[10px] font-mono text-[#6b7280]">
              {drafts.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6b7280]">
            Work in progress issues saved locally. Finish writing and publish them to projects when ready.
          </p>
        </div>

        <button
          onClick={handleCreateDraft}
          className="flex items-center gap-1.5 rounded-md bg-[#3e63dd] hover:bg-[#3451b2] px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Draft</span>
        </button>
      </div>

      {/* Main Split Layout */}
      {drafts.length === 0 ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-12 text-center space-y-3">
          <FileEdit className="h-10 w-10 text-[#9ca3af] mx-auto" />
          <h3 className="text-sm font-semibold text-[#111827]">No active drafts</h3>
          <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
            You don't have any drafts in progress. Create a draft to prepare issues before publishing them.
          </p>
          <button
            onClick={handleCreateDraft}
            className="mt-2 text-xs text-[#3e63dd] hover:underline cursor-pointer font-medium"
          >
            + Create a new draft
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px]">
          {/* Drafts List Sidebar */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white divide-y divide-[#f1f3f5] overflow-y-auto shadow-xs">
            {drafts.map((d) => {
              const proj = workspace.projects.find((p) => p.id === d.projectId);
              const isSelected = d.id === activeDraft?.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDraftId(d.id)}
                  className={cn(
                    "p-3.5 transition-colors cursor-pointer text-left space-y-1.5",
                    isSelected ? "bg-[#eff6ff]" : "hover:bg-[#f8f9fa]"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-[#4b5563] bg-[#f3f4f6] border border-[#e5e7eb] rounded px-1.5 py-0.2 font-medium">
                      {proj?.identifier || "PROJECT"}
                    </span>
                    <PriorityIcon priority={d.priority} size={12} />
                  </div>
                  <h4 className="text-xs font-semibold text-[#111827] truncate">
                    {d.title || "Untitled Draft"}
                  </h4>
                  <p className="text-[11px] text-[#6b7280] line-clamp-1">
                    {d.description || "No description..."}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Active Draft Editor & Publisher */}
          {activeDraft && (
            <div className="md:col-span-2 flex flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-xs">
              <div className="space-y-4">
                {/* Draft Metadata Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] pb-3">
                  <div className="flex items-center gap-3">
                    {/* Target Project Picker */}
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                      <FolderKanban className="h-3.5 w-3.5 text-[#9ca3af]" />
                      <select
                        value={activeDraft.projectId}
                        onChange={(e) =>
                          handleUpdateDraft(activeDraft.id, {
                            projectId: e.target.value,
                          })
                        }
                        className="rounded border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#111827] shadow-xs focus:outline-hidden"
                      >
                        {workspace.projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.identifier})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority Picker */}
                    <select
                      value={activeDraft.priority}
                      onChange={(e) =>
                        handleUpdateDraft(activeDraft.id, {
                          priority: e.target.value as IssuePriority,
                        })
                      }
                      className="rounded border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#111827] shadow-xs focus:outline-hidden"
                    >
                      <option value={IssuePriority.NONE}>Priority: None</option>
                      <option value={IssuePriority.LOW}>Priority: Low</option>
                      <option value={IssuePriority.MEDIUM}>Priority: Medium</option>
                      <option value={IssuePriority.HIGH}>Priority: High</option>
                      <option value={IssuePriority.URGENT}>Priority: Urgent</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleDeleteDraft(activeDraft.id)}
                    className="p-1.5 text-[#9ca3af] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title="Delete draft"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Title & Body Inputs */}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={activeDraft.title}
                    onChange={(e) =>
                      handleUpdateDraft(activeDraft.id, { title: e.target.value })
                    }
                    placeholder="Issue Title"
                    className="w-full bg-transparent text-base font-semibold text-[#111827] placeholder:text-[#9ca3af] focus:outline-hidden"
                  />

                  <textarea
                    rows={12}
                    value={activeDraft.description}
                    onChange={(e) =>
                      handleUpdateDraft(activeDraft.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Write detailed issue description, markdown notes, or checklist..."
                    className="w-full resize-none bg-transparent text-xs text-[#374151] placeholder:text-[#9ca3af] leading-relaxed focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-4">
                <span className="text-[11px] text-[#6b7280] font-mono">
                  Auto-saved locally
                </span>

                <button
                  disabled={!activeDraft.title.trim() || isSubmitting}
                  onClick={() => handlePublishDraft(activeDraft)}
                  className="flex items-center gap-2 rounded-lg bg-[#3e63dd] hover:bg-[#3451b2] disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Publishing..." : "Publish to Project"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

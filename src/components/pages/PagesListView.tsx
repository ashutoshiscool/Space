"use client";

import React, { useState } from "react";
import { Page, User, ProjectWithDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Globe, Lock, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PagesListViewProps {
  pages: (Page & {
    user: Pick<User, "id" | "name" | "avatarUrl">;
    children?: Page[];
  })[];
  project: ProjectWithDetails;
  workspaceSlug: string;
}

export function PagesListView({
  pages,
  project,
  workspaceSlug,
}: PagesListViewProps) {
  const [newPageTitle, setNewPageTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const createPageMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/projects/${project.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: "<h1>" + title + "</h1><p>Start drafting your notes...</p>",
        }),
      });
      if (!res.ok) throw new Error("Failed to create page");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setIsCreating(false);
      setNewPageTitle("");
      if (data?.page?.id) {
        router.push(`/${workspaceSlug}/${project.identifier}/pages/${data.page.id}`);
      }
    },
  });

  return (
    <div className="flex flex-col space-y-6 w-full max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#111827]">
            Collaborative Docs
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Documentation, engineering handbooks, and specifications
          </p>
        </div>

        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 h-8 text-xs font-medium bg-[#3e63dd] hover:bg-[#3451b2] text-white rounded-md shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Document</span>
        </Button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-xs">
          <Input
            autoFocus
            placeholder="Document title..."
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newPageTitle.trim()) {
                createPageMutation.mutate(newPageTitle.trim());
              } else if (e.key === "Escape") {
                setIsCreating(false);
              }
            }}
            className="text-xs"
          />
          <Button
            size="sm"
            disabled={!newPageTitle.trim() || createPageMutation.isPending}
            onClick={() => createPageMutation.mutate(newPageTitle.trim())}
            className="bg-[#3e63dd] hover:bg-[#3451b2] text-white font-medium h-8 text-xs shadow-xs"
          >
            Create
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCreating(false)} className="h-8 text-xs border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]">
            Cancel
          </Button>
        </div>
      )}

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {pages.map((p) => (
          <Link
            key={p.id}
            href={`/${workspaceSlug}/${project.identifier}/pages/${p.id}`}
            className="group flex flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-5 hover:border-[#cbd5e1] hover:shadow-xs transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[#6b7280] group-hover:text-[#3e63dd] transition-colors" />
                <h3 className="text-xs font-semibold text-[#111827] group-hover:text-[#3e63dd] transition-colors">
                  {p.title}
                </h3>
              </div>

              {p.isPublic ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                  <Globe className="h-3 w-3" />
                  Public
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-[#6b7280] bg-[#f3f4f6] border border-[#e5e7eb] rounded px-1.5 py-0.5">
                  <Lock className="h-3 w-3" />
                  Private
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#6b7280] pt-2 border-t border-[#e5e7eb]">
              <span>Updated {formatDate(p.updatedAt)}</span>
              <span className="flex items-center gap-1 group-hover:text-[#3e63dd] transition-colors font-medium">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}

        {pages.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center text-[#6b7280] shadow-xs">
            <FileText className="h-8 w-8 text-[#9ca3af] mb-2" />
            <h4 className="text-sm font-semibold text-[#111827]">No documents yet</h4>
            <p className="text-xs text-[#6b7280] mt-1">Create your first collaborative document or technical spec</p>
          </div>
        )}
      </div>
    </div>
  );
}

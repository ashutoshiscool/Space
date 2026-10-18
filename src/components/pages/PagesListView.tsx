"use client";

import React, { useState } from "react";
import { Page, User } from "@prisma/client";
import { ProjectWithDetails } from "@/lib/types";
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
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Collaborative Docs
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Notion-style documentation, engineering handbooks, and specifications
          </p>
        </div>

        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Document</span>
        </Button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#141418] p-3">
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
            className="text-sm"
          />
          <Button
            size="sm"
            disabled={!newPageTitle.trim() || createPageMutation.isPending}
            onClick={() => createPageMutation.mutate(newPageTitle.trim())}
          >
            Create
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((p) => (
          <Link
            key={p.id}
            href={`/${workspaceSlug}/${project.identifier}/pages/${p.id}`}
            className="group flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-[#121215] p-5 hover:border-zinc-700 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {p.title}
                </h3>
              </div>

              {p.isPublic ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 rounded px-1.5 py-0.5">
                  <Globe className="h-3 w-3" />
                  Public
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
                  <Lock className="h-3 w-3" />
                  Private
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800/60">
              <span>Updated {formatDate(p.updatedAt)}</span>
              <span className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors font-medium">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}

        {pages.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
            <FileText className="h-8 w-8 text-zinc-600 mb-2" />
            <h4 className="text-sm font-semibold text-zinc-300">No documents yet</h4>
            <p className="text-xs mt-1">Create your first collaborative document or technical spec</p>
          </div>
        )}
      </div>
    </div>
  );
}

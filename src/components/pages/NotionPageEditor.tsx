"use client";

import React, { useState } from "react";
import { Page } from "@/lib/types";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { Button } from "@/components/ui/button";
import { Globe, Lock, Share2, Check, ArrowLeft, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export interface PageWithDetails extends Page {
  user: { id: string; name: string | null; avatarUrl: string | null };
  project: { id: string; name: string; identifier: string; workspace: { slug: string } };
}

interface NotionPageEditorProps {
  page: PageWithDetails;
  isReadOnly?: boolean;
}

export function NotionPageEditor({ page, isReadOnly = false }: NotionPageEditorProps) {
  const [title, setTitle] = useState(page.title);
  const [isPublic, setIsPublic] = useState(page.isPublic);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const updatePageMutation = useMutation({
    mutationFn: async (data: { title?: string; content?: string; isPublic?: boolean }) => {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update page");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", page.id] });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete page");
      return res.json();
    },
    onSuccess: () => {
      router.push(`/${page.project.workspace.slug}/${page.project.identifier}/pages`);
    },
  });

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
        <button
          onClick={() =>
            router.push(
              `/${page.project.workspace.slug}/${page.project.identifier}/pages`
            )
          }
          className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#111827] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All Documents</span>
        </button>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {/* Public Share Toggle */}
            <Button
              variant={isPublic ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newPublic = !isPublic;
                setIsPublic(newPublic);
                updatePageMutation.mutate({ isPublic: newPublic });
              }}
              className={`flex items-center gap-1.5 text-xs ${
                isPublic ? "bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs" : "border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6]"
              }`}
            >
              {isPublic ? (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Private</span>
                </>
              )}
            </Button>

            {isPublic && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Share"}</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Delete this document?")) {
                  deletePageMutation.mutate();
                }
              }}
              className="text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Page Title */}
      <div>
        <input
          type="text"
          value={title}
          disabled={isReadOnly}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() && title !== page.title) {
              updatePageMutation.mutate({ title: title.trim() });
            }
          }}
          placeholder="Untitled Page"
          className="w-full bg-transparent text-3xl font-extrabold tracking-tight text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
        />
        <div className="text-xs text-[#6b7280] mt-2">
          Authored by {page.user.name}
        </div>
      </div>

      {/* Rich Document Content */}
      <TipTapEditor
        content={page.content || ""}
        editable={!isReadOnly}
        onChange={(html) => {
          updatePageMutation.mutate({ content: html });
        }}
        placeholder="Start writing documentation, notes, or use '/' for headers, task lists, code blocks..."
        className="min-h-[500px] border-none bg-transparent p-0"
      />
    </div>
  );
}

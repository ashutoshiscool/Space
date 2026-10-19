"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Hash, ArrowRight } from "lucide-react";

export default function CreateWorkspacePage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create workspace
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create workspace");
        setLoading(false);
        return;
      }

      // 2. Automatically create default project in new workspace
      const projRes = await fetch(`/api/workspaces/${data.workspace.slug}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Engineering",
          identifier: "ENG",
          description: "Core engineering issues and sprint iterations",
        }),
      });

      if (projRes.ok) {
        const projData = await projRes.json();
        router.push(`/${data.workspace.slug}/${projData.project.identifier}/issues`);
      } else {
        router.push(`/${data.workspace.slug}`);
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fa] p-4 text-[#111827]">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-[#e5e7eb] bg-white p-7 shadow-xl">
        <div className="space-y-2 text-center flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3f4f6] border border-[#e5e7eb] text-[#3e63dd] mb-1">
            <Building2 className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">Create your Workspace</h1>
          <p className="text-xs text-[#6b7280]">
            Workspaces organize your projects, cycles, and engineering docs
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[#374151] block mb-1 font-medium">Workspace Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-[#9ca3af]" />
              <Input
                type="text"
                required
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="pl-9 bg-white border-[#d1d5db] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd]"
              />
            </div>
          </div>

          <div>
            <label className="text-[#374151] block mb-1 font-medium">Workspace URL Slug</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-[#6b7280] font-mono">
                space.dev/
              </span>
              <Input
                type="text"
                required
                pattern="^[a-z0-9-]+$"
                placeholder="acme-corp"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="pl-20 font-mono text-xs bg-white border-[#d1d5db] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd]"
              />
            </div>
            <span className="text-[10px] text-[#6b7280] mt-1 block">
              Only lowercase letters, numbers, and hyphens
            </span>
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim() || !slug.trim()}
            className="w-full mt-4 font-semibold bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs"
          >
            {loading ? "Creating workspace..." : "Launch Workspace"}
          </Button>
        </form>
      </div>
    </div>
  );
}

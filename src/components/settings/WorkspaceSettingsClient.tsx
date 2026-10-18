"use client";

import React, { useState } from "react";
import { WorkspaceWithDetails, User } from "@/lib/types";
import { WorkspaceRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, UserPlus, Shield, FolderPlus, Copy, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface WorkspaceSettingsClientProps {
  workspace: WorkspaceWithDetails;
  currentUser: Pick<User, "id" | "name" | "email">;
}

export function WorkspaceSettingsClient({
  workspace,
  currentUser,
}: WorkspaceSettingsClientProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>(WorkspaceRole.MEMBER);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectIdentifier, setProjectIdentifier] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const queryClient = useQueryClient();
  const router = useRouter();

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace.slug}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to invite member");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedInviteUrl(data.inviteUrl);
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["workspace", workspace.slug] });
    },
  });

  // Project creation mutation
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace.slug}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          identifier: projectIdentifier.trim().toUpperCase(),
          description: projectDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create project");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setIsProjectOpen(false);
      setProjectName("");
      setProjectIdentifier("");
      setProjectDescription("");
      router.push(`/${workspace.slug}/${data.project.identifier}/issues`);
    },
  });

  const handleCopyInvite = () => {
    if (generatedInviteUrl) {
      navigator.clipboard.writeText(generatedInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col space-y-8 w-full max-w-4xl mx-auto p-6 text-zinc-100">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workspace Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Manage organization profile, team members, roles, and project configurations
        </p>
      </div>

      {/* General Information Card */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Organization Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-500 block mb-1">Workspace Name</label>
            <Input value={workspace.name} disabled className="opacity-90" />
          </div>
          <div>
            <label className="text-zinc-500 block mb-1">Workspace Slug</label>
            <Input value={workspace.slug} disabled className="opacity-90 font-mono" />
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Team Members</h3>
            <p className="text-xs text-zinc-500">
              Users with access to this workspace and its projects
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite Member</span>
          </Button>
        </div>

        {/* Members List */}
        <div className="divide-y divide-zinc-800/60 rounded-lg border border-zinc-800/80 overflow-hidden text-xs">
          {workspace.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-zinc-950/30"
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  {member.user.avatarUrl && <AvatarImage src={member.user.avatarUrl} />}
                  <AvatarFallback>{member.user.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-zinc-200">{member.user.name}</div>
                  <div className="text-zinc-500 text-[11px]">{member.user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    member.role === "OWNER"
                      ? "bg-indigo-950/60 text-indigo-400 border border-indigo-900/50"
                      : member.role === "ADMIN"
                      ? "bg-purple-950/60 text-purple-400 border border-purple-900/50"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Projects</h3>
            <p className="text-xs text-zinc-500">
              Active projects in this workspace with distinct issue sequence keys
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsProjectOpen(true)}
            className="flex items-center gap-1.5"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {workspace.projects.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/${workspace.slug}/${p.identifier}/issues`)}
              className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-3 hover:border-zinc-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span>{p.icon || "📁"}</span>
                <div>
                  <div className="font-semibold text-zinc-200 truncate">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Prefix: {p.identifier}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-indigo-400">Open &rarr;</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => {
            setIsInviteOpen(false);
            setGeneratedInviteUrl(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-100">Invite Team Member</h3>

            {!generatedInviteUrl ? (
              <div className="space-y-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Email Address</label>
                  <Input
                    autoFocus
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-none"
                  >
                    <option value={WorkspaceRole.MEMBER}>Member (Standard access)</option>
                    <option value={WorkspaceRole.ADMIN}>Admin (Can invite and manage)</option>
                    <option value={WorkspaceRole.GUEST}>Guest (Read-only view)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!inviteEmail.trim() || inviteMutation.isPending}
                    onClick={() => inviteMutation.mutate()}
                  >
                    {inviteMutation.isPending ? "Generating..." : "Generate Invite"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-zinc-300">
                  Invitation link created! Share this cryptographic URL with your teammate:
                </p>
                <div className="flex items-center gap-2">
                  <Input value={generatedInviteUrl} readOnly className="font-mono text-xs" />
                  <Button size="sm" onClick={handleCopyInvite}>
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsInviteOpen(false);
                      setGeneratedInviteUrl(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isProjectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => setIsProjectOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-100">Create Project</h3>

            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 block mb-1">Project Name</label>
                <Input
                  autoFocus
                  placeholder="e.g. Mobile iOS Client"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    if (!projectIdentifier) {
                      const words = e.target.value.trim().split(" ");
                      const autoIdent = words
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 4);
                      setProjectIdentifier(autoIdent);
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">
                  Issue Identifier (3-5 letters)
                </label>
                <Input
                  placeholder="e.g. MOB"
                  maxLength={5}
                  value={projectIdentifier}
                  onChange={(e) => setProjectIdentifier(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
                <span className="text-[10px] text-zinc-500">
                  Issues will be numbered like {projectIdentifier || "PRJ"}-1, {projectIdentifier || "PRJ"}-2
                </span>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProjectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={
                  !projectName.trim() ||
                  !projectIdentifier.trim() ||
                  createProjectMutation.isPending
                }
                onClick={() => createProjectMutation.mutate()}
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

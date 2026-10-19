"use client";

import React, { useState } from "react";
import { WorkspaceWithDetails, User } from "@/lib/types";
import { WorkspaceRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, UserPlus, Shield, FolderPlus, Copy, Check, Building, Users, FolderKanban, Mail, Sliders } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SmtpSettingsCard } from "./SmtpSettingsCard";
import { cn } from "@/lib/utils";

interface WorkspaceSettingsClientProps {
  workspace: WorkspaceWithDetails;
  currentUser: Pick<User, "id" | "name" | "email">;
}

type SettingsTab = "all" | "profile" | "members" | "projects" | "smtp";

export function WorkspaceSettingsClient({
  workspace,
  currentUser,
}: WorkspaceSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("all");
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
    <div className="flex flex-col space-y-8 w-full max-w-4xl mx-auto p-6 text-[#111827]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Workspace Settings</h2>
        <p className="text-xs text-[#6b7280] mt-1">
          Manage organization profile, team members, roles, email &amp; SMTP delivery, and project configurations
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#e5e7eb] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "all"
              ? "bg-[#111827] text-white"
              : "text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
          )}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>All Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "profile"
              ? "bg-[#111827] text-white"
              : "text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
          )}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Organization</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "members"
              ? "bg-[#111827] text-white"
              : "text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Team Members</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
              activeTab === "members" ? "bg-white/20 text-white" : "bg-[#f1f3f5] text-[#6b7280]"
            )}
          >
            {workspace.members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "projects"
              ? "bg-[#111827] text-white"
              : "text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
          )}
        >
          <FolderKanban className="h-3.5 w-3.5" />
          <span>Projects</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
              activeTab === "projects" ? "bg-white/20 text-white" : "bg-[#f1f3f5] text-[#6b7280]"
            )}
          >
            {workspace.projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("smtp")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "smtp"
              ? "bg-[#111827] text-white"
              : "text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Email &amp; SMTP</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
              activeTab === "smtp" ? "bg-blue-500 text-white" : "bg-blue-50 text-[#3e63dd] border border-blue-100"
            )}
          >
            Relay
          </span>
        </button>
      </div>

      {/* General Information Card */}
      {(activeTab === "all" || activeTab === "profile") && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-semibold text-[#111827]">Organization Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[#6b7280] block mb-1 font-medium">Workspace Name</label>
              <Input value={workspace.name} disabled className="opacity-90 bg-[#f8f9fa]" />
            </div>
            <div>
              <label className="text-[#6b7280] block mb-1 font-medium">Workspace Slug</label>
              <Input value={workspace.slug} disabled className="opacity-90 font-mono bg-[#f8f9fa]" />
            </div>
          </div>
        </div>
      )}

      {/* Team Members Section */}
      {(activeTab === "all" || activeTab === "members") && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Team Members</h3>
              <p className="text-xs text-[#6b7280]">
                Users with access to this workspace and its projects
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Member</span>
            </Button>
          </div>

          {/* Members List */}
          <div className="divide-y divide-[#e5e7eb] rounded-lg border border-[#e5e7eb] overflow-hidden text-xs bg-white">
            {workspace.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-white hover:bg-[#f8f9fa] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    {member.user.avatarUrl && <AvatarImage src={member.user.avatarUrl} />}
                    <AvatarFallback className="bg-[#f1f3f5] text-[#111827]">{member.user.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-[#111827]">{member.user.name}</div>
                    <div className="text-[#6b7280] text-[11px]">{member.user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      member.role === "OWNER"
                        ? "bg-blue-50 text-[#3e63dd] border border-blue-200"
                        : member.role === "ADMIN"
                        ? "bg-purple-50 text-purple-600 border border-purple-200"
                        : "bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      {(activeTab === "all" || activeTab === "projects") && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Projects</h3>
              <p className="text-xs text-[#6b7280]">
                Active projects in this workspace with distinct issue sequence keys
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsProjectOpen(true)}
              className="flex items-center gap-1.5 bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs"
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
                className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3 hover:bg-white hover:border-[#cbd5e1] hover:shadow-xs cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-[#eff6ff] border border-blue-100 text-[10px] font-bold text-[#3e63dd] font-mono shrink-0">
                    {p.identifier.slice(0, 2)}
                  </span>
                  <div>
                    <div className="font-semibold text-[#111827] truncate">{p.name}</div>
                    <div className="text-[10px] text-[#6b7280] font-mono">
                      Prefix: {p.identifier}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[#3e63dd] font-semibold">Open &rarr;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email & SMTP Relay Section */}
      {(activeTab === "all" || activeTab === "smtp") && (
        <SmtpSettingsCard
          workspaceSlug={workspace.slug}
          currentUserEmail={currentUser.email}
        />
      )}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => {
            setIsInviteOpen(false);
            setGeneratedInviteUrl(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl space-y-4 text-xs text-[#111827]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#111827]">Invite Team Member</h3>

            {!generatedInviteUrl ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[#374151] block mb-1 font-medium">Email Address</label>
                  <Input
                    autoFocus
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[#374151] block mb-1 font-medium">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                    className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#3e63dd]"
                  >
                    <option value={WorkspaceRole.MEMBER}>Member (Standard access)</option>
                    <option value={WorkspaceRole.ADMIN}>Admin (Can invite and manage)</option>
                    <option value={WorkspaceRole.GUEST}>Guest (Read-only view)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInviteOpen(false)}
                    className="border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!inviteEmail.trim() || inviteMutation.isPending}
                    onClick={() => inviteMutation.mutate()}
                    className="bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs"
                  >
                    {inviteMutation.isPending ? "Generating..." : "Generate Invite"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[#374151]">
                  Invitation link created! Share this cryptographic URL with your teammate:
                </p>
                <div className="flex items-center gap-2">
                  <Input value={generatedInviteUrl} readOnly className="font-mono text-xs bg-[#f8f9fa]" />
                  <Button size="sm" onClick={handleCopyInvite} className="bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs">
                    {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsInviteOpen(false);
                      setGeneratedInviteUrl(null);
                    }}
                    className="bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => setIsProjectOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl space-y-4 text-xs text-[#111827]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#111827]">Create Project</h3>

            <div className="space-y-3">
              <div>
                <label className="text-[#374151] block mb-1 font-medium">Project Name</label>
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
                <label className="text-[#374151] block mb-1 font-medium">
                  Issue Identifier (3-5 letters)
                </label>
                <Input
                  placeholder="e.g. MOB"
                  maxLength={5}
                  value={projectIdentifier}
                  onChange={(e) => setProjectIdentifier(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
                <span className="text-[10px] text-[#6b7280]">
                  Issues will be numbered like {projectIdentifier || "PRJ"}-1, {projectIdentifier || "PRJ"}-2
                </span>
              </div>

              <div>
                <label className="text-[#374151] block mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full rounded-md border border-[#e5e7eb] bg-white p-2 text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#3e63dd]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsProjectOpen(false)}
                className="border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]"
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
                className="bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs"
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

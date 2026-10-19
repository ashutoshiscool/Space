"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  IssueWithDetails,
  IssuePriority,
} from "@/lib/types";
import { IssueType } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Send,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Settings,
  ListFilter,
  FileText,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
} from "lucide-react";
import { IssueTypeIcon } from "@/components/issues/IssueTypeIcon";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";

interface ProjectFormsViewProps {
  workspace: WorkspaceWithDetails;
  project: ProjectWithDetails;
  issues: IssueWithDetails[];
}

export function ProjectFormsView({
  workspace,
  project,
  issues,
}: ProjectFormsViewProps) {
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"form" | "submissions" | "settings">("form");

  // Form input state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);
  const [type, setType] = useState<IssueType>(IssueType.TASK);
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    id: string;
    sequenceId: number;
    title: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Settings state
  const [formName, setFormName] = useState(`${project.name} Request Form`);
  const [formDescription, setFormDescription] = useState(
    `Use this form to submit tasks, bug reports, and requests to the ${project.name} team. We review submissions within 24 hours.`
  );
  const [requireEmail, setRequireEmail] = useState(true);
  const [autoAssignLead, setAutoAssignLead] = useState(true);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Pick first unstarted or backlog state
      const targetState =
        project.states.find((s) => s.group === "UNSTARTED") ||
        project.states.find((s) => s.group === "BACKLOG") ||
        project.states[0];

      const leadMember = project.members[0];
      const assigneeIds = autoAssignLead && leadMember ? [leadMember.user.id] : [];

      const fullDescription = `${description}\n\n---\n*Submitted via ${formName} by ${
        requesterName || "Anonymous"
      } (${requesterEmail || "no-email"})*`;

      const res = await fetch(`/api/projects/${project.id}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: fullDescription,
          priority,
          type,
          stateId: targetState?.id,
          assigneeIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissionSuccess({
          id: data.id,
          sequenceId: data.sequenceId,
          title: data.title,
        });
        setTitle("");
        setDescription("");
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafbfc] min-h-full font-sans select-none pb-20">
      {/* Top Banner */}
      <div className="relative w-full h-32 md:h-36 overflow-hidden bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] border-b border-[#e2e8f0]">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(#c084fc 1px, transparent 1px), radial-gradient(#818cf8 1px, #1e1b4b 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fafbfc] via-[#fafbfc]/30 to-transparent" />

        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-sm font-bold text-[#111827] shadow-md font-mono shrink-0">
              <Inbox className="h-5 w-5 text-[#9333ea]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                Spaces / {project.name}
              </div>
              <h1 className="text-xl font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
                <span>Collect Requests</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#f3e8ff] border border-[#e9d5ff] text-[#9333ea] text-[10px] font-bold">
                  Try
                </span>
                <span className="text-xs font-mono font-normal text-[#64748b] bg-white/80 px-2 py-0.5 rounded border border-[#e2e8f0]">
                  {project.identifier}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="bg-white/90 hover:bg-white text-xs h-8 text-[#334155] border-[#cbd5e1] shadow-2xs cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 mr-1.5 text-[#9333ea]" />
                  <span>Share Form Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs">
            <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Form Status
            </div>
            <div className="text-base font-bold text-[#0f172a] mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Published & Active</span>
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">
              Receiving submissions into {project.identifier}
            </div>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs">
            <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Total Requests
            </div>
            <div className="text-lg font-bold text-[#0f172a] mt-1">
              {issues.length} work items
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">
              Across all project queues
            </div>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs">
            <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Auto-Assignment
            </div>
            <div className="text-base font-bold text-[#0f172a] mt-1 truncate">
              {project.members[0]?.user.name || "Unassigned"}
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">
              Assigned on form submission
            </div>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs">
            <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Response SLA
            </div>
            <div className="text-lg font-bold text-emerald-600 mt-1">
              &lt; 24 Hours
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">
              Average intake turnaround
            </div>
          </div>
        </div>

        {/* Tab Toolbar */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("form")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "form"
                  ? "bg-[#9333ea] text-white shadow-2xs"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Intake Form</span>
            </button>

            <button
              onClick={() => setActiveTab("submissions")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "submissions"
                  ? "bg-[#9333ea] text-white shadow-2xs"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Requests Queue</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                activeTab === "submissions" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
              )}>
                {issues.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "settings"
                  ? "bg-[#9333ea] text-white shadow-2xs"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Form Settings</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Intake Form */}
        {activeTab === "form" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {submissionSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-emerald-900">
                      Request successfully submitted!
                    </div>
                    <p className="text-emerald-700">
                      Created issue <span className="font-mono font-bold">{project.identifier}-{submissionSuccess.sequenceId}</span>: &quot;{submissionSuccess.title}&quot;
                    </p>
                    <Link
                      href={`/${workspace.slug}/${project.identifier}/issues?issueId=${submissionSuccess.id}`}
                      className="font-semibold text-emerald-800 hover:underline flex items-center gap-1 pt-1"
                    >
                      <span>View in Work Board</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <button
                  onClick={() => setSubmissionSuccess(null)}
                  className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-2xs space-y-5">
              <div className="space-y-1 pb-4 border-b border-[#f1f5f9]">
                <h2 className="text-lg font-bold text-[#0f172a]">
                  {formName}
                </h2>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  {formDescription}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs text-[#334155]">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#0f172a] flex items-center justify-between">
                    <span>What needs to be done?</span>
                    <span className="text-rose-500 font-normal">* required</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need intern onboarding access for XRGO workspace"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] focus:outline-none focus:border-[#9333ea]"
                  />
                </div>

                {/* Type & Priority Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#0f172a]">Request Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as IssueType)}
                      className="w-full h-9 px-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] bg-white cursor-pointer"
                    >
                      <option value="TASK">Task (General Work)</option>
                      <option value="BUG">Bug (Defect / Error)</option>
                      <option value="STORY">Story (Feature Request)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#0f172a]">Urgency / Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as IssuePriority)}
                      className="w-full h-9 px-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] bg-white cursor-pointer"
                    >
                      <option value="URGENT">Urgent (Blocker)</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                </div>

                {/* Detailed Description */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#0f172a]">
                    Detailed Description / Context
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide any background, requirements, steps to reproduce, or acceptance criteria..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] focus:outline-none focus:border-[#9333ea] resize-y"
                  />
                </div>

                {/* Requester Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#f1f5f9]">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#0f172a]">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Wallibear"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] focus:outline-none focus:border-[#9333ea]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#0f172a]">
                      Your Email Address
                      {requireEmail && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    <input
                      type="email"
                      required={requireEmail}
                      placeholder="e.g. wallibear@space.dev"
                      value={requesterEmail}
                      onChange={(e) => setRequesterEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] focus:outline-none focus:border-[#9333ea]"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-between pt-4 border-t border-[#f1f5f9]">
                  <span className="text-[11px] text-[#64748b]">
                    Submission will be routed directly to {project.name}.
                  </span>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="bg-[#9333ea] hover:bg-[#7e22ce] text-white text-xs h-9 px-5 font-semibold cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Submissions Queue */}
        {activeTab === "submissions" && (
          <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden shadow-2xs">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#0f172a]">Intake Requests Queue</span>
              <span className="text-[11px] text-[#64748b] font-mono">
                {issues.length} total work items
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {issues.slice(0, 15).map((issue) => (
                <div
                  key={issue.id}
                  className="p-4 hover:bg-[#fafbfc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 mt-0.5 border border-[#e2e8f0]">
                      <AvatarImage src={issue.createdBy?.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-[#f1f5f9] text-[#334155] font-semibold">
                        {getInitials(issue.createdBy?.name || "User")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/${workspace.slug}/${project.identifier}/issues?issueId=${issue.id}`}
                          className="font-bold text-[#0f172a] hover:text-[#0052cc] text-xs transition-colors"
                        >
                          {project.identifier}-{issue.sequenceId}: {issue.title}
                        </Link>
                        {issue.state && (
                          <span
                            className="px-2 py-0.2 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: `${issue.state.color}15`,
                              color: issue.state.color,
                            }}
                          >
                            {issue.state.name}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                        <span>Submitted by {issue.createdBy?.name || "Intake User"}</span>
                        <span>·</span>
                        <PriorityIcon priority={issue.priority} size={11} />
                        <span className="capitalize">{issue.priority.toLowerCase()}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(issue.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/${workspace.slug}/${project.identifier}/issues?issueId=${issue.id}`
                        )
                      }
                      className="h-7 text-xs border-[#e2e8f0] text-[#334155] cursor-pointer"
                    >
                      <span>View on Board</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Form Settings */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-2xs space-y-6 text-xs text-[#334155]">
            <div className="space-y-1 pb-4 border-b border-[#f1f5f9]">
              <h2 className="text-base font-bold text-[#0f172a]">
                Intake Form Configuration
              </h2>
              <p className="text-xs text-[#64748b]">
                Customize instructions, validation rules, and automated issue routing.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#0f172a]">Form Display Title</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#0f172a]">Instructions & Subtitle</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[#f1f5f9] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#0f172a]">Require Requester Email</div>
                    <div className="text-[11px] text-[#64748b]">
                      Ensures submitters provide an email for ticket follow-up.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireEmail}
                    onChange={(e) => setRequireEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-[#e2e8f0] text-[#9333ea] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#0f172a]">Auto-Assign to Project Lead</div>
                    <div className="text-[11px] text-[#64748b]">
                      Immediately assigns incoming form issues to {project.members[0]?.user.name}.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAssignLead}
                    onChange={(e) => setAutoAssignLead(e.target.checked)}
                    className="h-4 w-4 rounded border-[#e2e8f0] text-[#9333ea] cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#f1f5f9] flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setActiveTab("form")}
                  className="bg-[#9333ea] hover:bg-[#7e22ce] text-white text-xs h-8 px-4 cursor-pointer"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  IssueWithDetails,
} from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Code2,
  ExternalLink,
  Plus,
  Search,
  CheckCircle2,
  Copy,
  Check,
  FolderGit2,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Zap,
  Clock,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { IssueTypeIcon } from "@/components/issues/IssueTypeIcon";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";

interface RepositoryItem {
  id: string;
  name: string;
  fullName: string;
  provider: "github" | "gitlab" | "bitbucket";
  url: string;
  defaultBranch: string;
  status: "connected" | "syncing" | "error";
  lastSyncAt: string;
}

interface CommitItem {
  id: string;
  hash: string;
  message: string;
  branch: string;
  author: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  verified: boolean;
  issueKey: string;
  issueTitle: string;
  issueId?: string;
  issueType?: string;
}

interface PullRequestItem {
  id: string;
  number: number;
  title: string;
  author: {
    name: string;
    avatarUrl?: string | null;
  };
  sourceBranch: string;
  targetBranch: string;
  status: "OPEN" | "MERGED" | "DRAFT";
  checksStatus: "PASSING" | "RUNNING" | "FAILED";
  reviewStatus: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED";
  createdAt: string;
  issueKey: string;
  issueTitle: string;
  issueId?: string;
}

interface ProjectRepositoryViewProps {
  workspace: WorkspaceWithDetails;
  project: ProjectWithDetails;
  issues: IssueWithDetails[];
}

export function ProjectRepositoryView({
  workspace,
  project,
  issues,
}: ProjectRepositoryViewProps) {
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"commits" | "pulls" | "branches" | "guide">("commits");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

  // Modals
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [createBranchModalOpen, setCreateBranchModalOpen] = useState(false);
  const [selectedIssueForBranch, setSelectedIssueForBranch] = useState<IssueWithDetails | null>(
    issues[0] || null
  );
  const [copiedBranchCmd, setCopiedBranchCmd] = useState(false);

  // Connected Repositories
  const [repositories, setRepositories] = useState<RepositoryItem[]>([
    {
      id: "repo-1",
      name: "Space",
      fullName: "ashutoshiscool/Space",
      provider: "github",
      url: "https://github.com/ashutoshiscool/Space",
      defaultBranch: "main",
      status: "connected",
      lastSyncAt: "2 minutes ago",
    },
    {
      id: "repo-2",
      name: "space-integrations-core",
      fullName: "ashutoshiscool/space-integrations-core",
      provider: "github",
      url: "https://github.com/ashutoshiscool/Space",
      defaultBranch: "main",
      status: "connected",
      lastSyncAt: "10 minutes ago",
    },
  ]);

  // Dynamic Commits linked to project issues
  const mockCommits: CommitItem[] = useMemo(() => {
    return [
      {
        id: "c-1",
        hash: "7d92fb4",
        message: `${project.identifier}-71: Finish space and Get interns`,
        branch: "main",
        author: {
          name: issues[0]?.assignees[0]?.user.name || "Wallibear 130",
          email: "wallibear@space.dev",
        },
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        verified: true,
        issueKey: `${project.identifier}-71`,
        issueTitle: "Finish space and Get interns",
        issueId: issues[0]?.id,
        issueType: "TASK",
      },
      {
        id: "c-2",
        hash: "a4f89d1",
        message: `${project.identifier}-71: Add intake pipeline and onboarding requirements`,
        branch: "feature/finish-space",
        author: {
          name: issues[0]?.assignees[0]?.user.name || "Wallibear 130",
          email: "wallibear@space.dev",
        },
        createdAt: new Date(Date.now() - 41 * 60 * 1000).toISOString(),
        verified: true,
        issueKey: `${project.identifier}-71`,
        issueTitle: "Finish space and Get interns",
        issueId: issues[0]?.id,
        issueType: "TASK",
      },
      {
        id: "c-3",
        hash: "c912e5f",
        message: `${project.identifier}-70: Implement status overview donut and real-time activity stream`,
        branch: "feature/summary-donut",
        author: {
          name: "Alex Dev",
          email: "alex@space.dev",
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        verified: true,
        issueKey: `${project.identifier}-70`,
        issueTitle: "Status overview donut & KPI stream",
        issueId: issues[1]?.id,
        issueType: "STORY",
      },
      {
        id: "c-4",
        hash: "e3b178a",
        message: `${project.identifier}-68: Fix sidebar active space highlighting and apps marketplace`,
        branch: "fix/sidebar-nav",
        author: {
          name: "Sarah Smith",
          email: "sarah@space.dev",
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        verified: true,
        issueKey: `${project.identifier}-68`,
        issueTitle: "Fix active space highlighting",
        issueId: issues[2]?.id,
        issueType: "BUG",
      },
      {
        id: "c-5",
        hash: "f804dc2",
        message: `${project.identifier}-65: Configure SMTP notifications and seat limit monitor`,
        branch: "main",
        author: {
          name: "Alex Dev",
          email: "alex@space.dev",
        },
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        verified: true,
        issueKey: `${project.identifier}-65`,
        issueTitle: "SMTP notifications & seat limits",
        issueId: issues[3]?.id,
        issueType: "TASK",
      },
    ];
  }, [project.identifier, issues]);

  // Pull Requests
  const mockPulls: PullRequestItem[] = useMemo(() => {
    return [
      {
        id: "pr-1",
        number: 14,
        title: `${project.identifier}-71: Finish space and Get interns`,
        author: {
          name: issues[0]?.assignees[0]?.user.name || "Wallibear 130",
        },
        sourceBranch: "feature/finish-space",
        targetBranch: "main",
        status: "OPEN",
        checksStatus: "PASSING",
        reviewStatus: "APPROVED",
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        issueKey: `${project.identifier}-71`,
        issueTitle: "Finish space and Get interns",
        issueId: issues[0]?.id,
      },
      {
        id: "pr-2",
        number: 12,
        title: `${project.identifier}-70: Interactive status overview donut chart`,
        author: {
          name: "Alex Dev",
        },
        sourceBranch: "feature/summary-donut",
        targetBranch: "main",
        status: "MERGED",
        checksStatus: "PASSING",
        reviewStatus: "APPROVED",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        issueKey: `${project.identifier}-70`,
        issueTitle: "Status overview donut & KPI stream",
        issueId: issues[1]?.id,
      },
      {
        id: "pr-3",
        number: 9,
        title: `${project.identifier}-68: Fix project navigation active tab highlighting`,
        author: {
          name: "Sarah Smith",
        },
        sourceBranch: "fix/sidebar-nav",
        targetBranch: "main",
        status: "MERGED",
        checksStatus: "PASSING",
        reviewStatus: "APPROVED",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        issueKey: `${project.identifier}-68`,
        issueTitle: "Fix active space highlighting",
        issueId: issues[2]?.id,
      },
    ];
  }, [project.identifier, issues]);

  // Branches
  const mockBranches = [
    {
      name: "main",
      lastCommitHash: "7d92fb4",
      lastCommitMessage: `${project.identifier}-71: Finish space and Get interns`,
      author: "Wallibear 130",
      updatedAt: "40 minutes ago",
      isDefault: true,
    },
    {
      name: "feature/finish-space",
      lastCommitHash: "a4f89d1",
      lastCommitMessage: `${project.identifier}-71: Add intake pipeline and onboarding requirements`,
      author: "Wallibear 130",
      updatedAt: "41 minutes ago",
      isDefault: false,
    },
    {
      name: "feature/summary-donut",
      lastCommitHash: "c912e5f",
      lastCommitMessage: `${project.identifier}-70: Implement status overview donut`,
      author: "Alex Dev",
      updatedAt: "2 hours ago",
      isDefault: false,
    },
    {
      name: "fix/sidebar-nav",
      lastCommitHash: "e3b178a",
      lastCommitMessage: `${project.identifier}-68: Fix sidebar active space highlighting`,
      author: "Sarah Smith",
      updatedAt: "Yesterday",
      isDefault: false,
    },
  ];

  // Filtered commits
  const filteredCommits = useMemo(() => {
    return mockCommits.filter((c) => {
      if (selectedBranch !== "all" && c.branch !== selectedBranch) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.message.toLowerCase().includes(q) ||
          c.hash.toLowerCase().includes(q) ||
          c.author.name.toLowerCase().includes(q) ||
          c.issueKey.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mockCommits, selectedBranch, searchQuery]);

  // Filtered PRs
  const filteredPulls = useMemo(() => {
    return mockPulls.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          p.issueKey.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mockPulls, searchQuery]);

  // Branch command generator
  const branchCommand = selectedIssueForBranch
    ? `git checkout -b feature/${project.identifier}-${selectedIssueForBranch.sequenceId}-${selectedIssueForBranch.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 30)}`
    : `git checkout -b feature/${project.identifier}-branch`;

  const handleCopyBranchCmd = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(branchCommand);
      setCopiedBranchCmd(true);
      setTimeout(() => setCopiedBranchCmd(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafbfc] min-h-full font-sans select-none pb-20">
      {/* City / Gradient Header Banner */}
      <div className="relative w-full h-32 md:h-36 overflow-hidden bg-gradient-to-r from-[#18181b] via-[#27272a] to-[#18181b] border-b border-[#e2e8f0]">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#818cf8 1px, #18181b 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fafbfc] via-[#fafbfc]/30 to-transparent" />

        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-sm font-bold text-[#111827] shadow-md font-mono shrink-0">
              <Code2 className="h-5 w-5 text-[#0052cc]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                Spaces / {project.name}
              </div>
              <h1 className="text-xl font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
                <span>Repository & Code Sync</span>
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
              onClick={() => setCreateBranchModalOpen(true)}
              className="bg-white/90 hover:bg-white text-xs h-8 text-[#334155] border-[#cbd5e1] shadow-2xs cursor-pointer"
            >
              <GitBranch className="h-3.5 w-3.5 mr-1.5 text-[#0052cc]" />
              <span>Create Branch</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setConnectModalOpen(true)}
              className="bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs h-8 shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Connect Repo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Primary Repository */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-[#0052cc]">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 truncate">
                <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Primary Repo
                </div>
                <div className="text-sm font-bold text-[#0f172a] truncate">
                  ashutoshiscool/Space
                </div>
                <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Sync active (main)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Linked Commits */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-700">
                <GitCommit className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Linked Commits
                </div>
                <div className="text-lg font-bold text-[#0f172a] tracking-tight">
                  {mockCommits.length} commits
                </div>
                <div className="text-[11px] text-[#64748b]">
                  referencing {project.identifier} keys
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Open Pull Requests */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 border border-purple-200 text-[#6554c0]">
                <GitPullRequest className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Active PRs
                </div>
                <div className="text-lg font-bold text-[#0f172a] tracking-tight">
                  {mockPulls.filter((p) => p.status === "OPEN").length} open
                </div>
                <div className="text-[11px] text-[#64748b]">
                  {mockPulls.length} total pull requests
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: CI/CD Health */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Build Status
                </div>
                <div className="text-lg font-bold text-emerald-600 tracking-tight">
                  100% Passing
                </div>
                <div className="text-[11px] text-[#64748b]">
                  GitHub Actions verified
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab switcher & Search toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-3">
          {/* Sub Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("commits")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "commits"
                  ? "bg-[#0052cc] text-white shadow-2xs"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <GitCommit className="h-3.5 w-3.5" />
              <span>Commits</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                activeTab === "commits" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
              )}>
                {mockCommits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("pulls")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "pulls"
                  ? "bg-[#0052cc] text-white shadow-2xs"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              <span>Pull Requests</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                activeTab === "pulls" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
              )}>
                {mockPulls.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("branches")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "branches"
                  ? "bg-[#0052cc] text-white shadow-2xs"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Branches</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                activeTab === "branches" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
              )}>
                {mockBranches.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("guide")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "guide"
                  ? "bg-[#0052cc] text-white shadow-2xs"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Smart Commits Guide</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search commits or PRs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#e2e8f0] bg-white text-xs text-[#0f172a] focus:outline-none focus:border-[#0052cc] shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Commits Feed */}
        {activeTab === "commits" && (
          <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden shadow-2xs">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0f172a]">Commits Stream</span>
                <span className="text-[#64748b]">
                  Showing commits mentioning <span className="font-mono font-semibold">{project.identifier}</span> keys
                </span>
              </div>
              <span className="text-[11px] text-[#64748b] font-mono">
                {filteredCommits.length} commits
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {filteredCommits.map((commit) => (
                <div
                  key={commit.id}
                  className="p-4 hover:bg-[#fafbfc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 mt-0.5 border border-[#e2e8f0]">
                      <AvatarImage src={commit.author.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-[#f1f5f9] text-[#334155] font-semibold">
                        {getInitials(commit.author.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#0f172a] text-xs">
                          {commit.message}
                        </span>
                        {commit.verified && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            <Check className="h-2.5 w-2.5" />
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                        <span className="font-medium text-[#334155]">{commit.author.name}</span>
                        <span>committed to</span>
                        <span className="font-mono px-1.5 py-0.2 rounded bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0]">
                          {commit.branch}
                        </span>
                        <span>·</span>
                        <span>{formatRelativeTime(commit.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Hash & Issue pill */}
                  <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                    <Link
                      href={`/${workspace.slug}/${project.identifier}/issues?issueId=${commit.issueId}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] text-[#0052cc] font-medium text-xs transition-colors"
                    >
                      <IssueTypeIcon type={commit.issueType} size={11} />
                      <span className="font-mono font-bold">{commit.issueKey}</span>
                    </Link>

                    <a
                      href={`https://github.com/ashutoshiscool/Space/commit/${commit.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-mono text-xs text-[#64748b] hover:text-[#0f172a] bg-[#f1f5f9] hover:bg-[#e2e8f0] px-2 py-1 rounded transition-colors"
                    >
                      <span>{commit.hash}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Pull Requests */}
        {activeTab === "pulls" && (
          <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden shadow-2xs">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#0f172a]">Pull Requests</span>
              <span className="text-[11px] text-[#64748b] font-mono">
                {filteredPulls.length} PRs
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {filteredPulls.map((pr) => (
                <div
                  key={pr.id}
                  className="p-4 hover:bg-[#fafbfc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs mt-0.5",
                      pr.status === "OPEN" ? "bg-emerald-600" : "bg-[#6554c0]"
                    )}>
                      <GitPullRequest className="h-4 w-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#0f172a] text-xs">
                          {pr.title}
                        </span>
                        <span className="font-mono text-[#64748b]">#{pr.number}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold uppercase",
                          pr.status === "OPEN"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        )}>
                          {pr.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                        <span>by {pr.author.name}</span>
                        <span>·</span>
                        <span className="font-mono bg-[#f1f5f9] px-1.5 py-0.2 rounded border border-[#e2e8f0]">
                          {pr.sourceBranch} &rarr; {pr.targetBranch}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-600 flex items-center gap-0.5 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Checks Passing
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                    <Link
                      href={`/${workspace.slug}/${project.identifier}/issues?issueId=${pr.issueId}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] text-[#0052cc] font-medium text-xs"
                    >
                      <span className="font-mono font-bold">{pr.issueKey}</span>
                    </Link>

                    <a
                      href="https://github.com/ashutoshiscool/Space"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-[#0052cc] hover:underline font-semibold"
                    >
                      <span>Review on GitHub</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Branches */}
        {activeTab === "branches" && (
          <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden shadow-2xs">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#0f172a]">Active Branches</span>
              <span className="text-[11px] text-[#64748b] font-mono">
                {mockBranches.length} branches
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {mockBranches.map((b) => (
                <div
                  key={b.name}
                  className="p-4 hover:bg-[#fafbfc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-4.5 w-4.5 text-[#0052cc] shrink-0" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0f172a]">
                          {b.name}
                        </span>
                        {b.isDefault && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#eff6ff] text-[#0052cc] border border-[#bfdbfe]">
                            default
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        {b.lastCommitMessage} · <span className="font-mono">{b.lastCommitHash}</span> · by {b.author} ({b.updatedAt})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(`git checkout ${b.name}`);
                      }}
                      className="h-7 text-xs border-[#e2e8f0] text-[#334155] cursor-pointer"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      <span>Copy Checkout</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Smart Commits Guide */}
        {activeTab === "guide" && (
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-2xs space-y-6 text-xs text-[#334155]">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-[#0052cc]" />
                <span>Smart Commits & Workflow Automations</span>
              </h2>
              <p className="text-xs text-[#64748b]">
                Reference your {project.identifier} issues in git commit messages to automatically transition states, add comments, and log work hours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-2">
                <div className="font-bold text-[#0f172a] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Resolve & Close Issue</span>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Transition the issue directly to Completed state when merged into the main branch.
                </p>
                <div className="bg-[#18181b] text-emerald-400 font-mono p-2.5 rounded text-[11px]">
                  git commit -m &quot;{project.identifier}-71 #resolve Finished interns intake&quot;
                </div>
              </div>

              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-2">
                <div className="font-bold text-[#0f172a] flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Log Work Hours</span>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Record hours or days worked into the issue worklog without opening the browser.
                </p>
                <div className="bg-[#18181b] text-amber-400 font-mono p-2.5 rounded text-[11px]">
                  git commit -m &quot;{project.identifier}-71 #time 2h 30m Working on onboarding&quot;
                </div>
              </div>

              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-2">
                <div className="font-bold text-[#0f172a] flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-[#0052cc]" />
                  <span>Post Issue Comment</span>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Automatically append a discussion note or review summary to the ticket.
                </p>
                <div className="bg-[#18181b] text-blue-400 font-mono p-2.5 rounded text-[11px]">
                  git commit -m &quot;{project.identifier}-71 #comment PR ready for team review&quot;
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-4 space-y-2">
              <div className="font-bold text-[#1e3a8a] text-xs">
                Recommended Branch Naming Convention
              </div>
              <p className="text-[11px] text-[#2563eb]">
                Name branches with your issue key to automatically associate all commits, pull requests, and CI runs:
              </p>
              <div className="bg-white border border-[#bfdbfe] font-mono text-[#0052cc] p-2 rounded text-xs">
                feature/{project.identifier}-71-finish-space-and-get-interns
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connect Repository Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="max-w-lg bg-white border-[#e2e8f0] p-6 text-xs text-[#334155]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-[#0f172a] flex items-center gap-2">
              <FolderGit2 className="h-4.5 w-4.5 text-[#0052cc]" />
              <span>Connect Git Repository</span>
            </DialogTitle>
            <p className="text-xs text-[#64748b]">
              Link a source control provider to sync code activity with {project.name}.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { name: "GitHub", desc: "Cloud & Enterprise", active: true },
                { name: "GitLab", desc: "Self-hosted & Cloud", active: false },
                { name: "Bitbucket", desc: "Atlassian Git", active: false },
              ].map((provider) => (
                <div
                  key={provider.name}
                  className={cn(
                    "p-3 rounded-lg border text-center space-y-1 cursor-pointer transition-all",
                    provider.active
                      ? "border-[#0052cc] bg-[#eff6ff] shadow-2xs"
                      : "border-[#e2e8f0] bg-[#fafbfc] hover:bg-white"
                  )}
                >
                  <div className="font-bold text-xs text-[#0f172a]">{provider.name}</div>
                  <div className="text-[10px] text-[#64748b]">{provider.desc}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#0f172a]">Repository URL / Organization</label>
              <input
                type="text"
                defaultValue="https://github.com/ashutoshiscool/Space"
                className="w-full h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-mono text-[#0f172a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#0f172a]">Default Branch</label>
              <input
                type="text"
                defaultValue="main"
                className="w-full h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-mono text-[#0f172a]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConnectModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setConnectModalOpen(false)}
                className="h-8 text-xs bg-[#0052cc] hover:bg-[#0747a6] text-white cursor-pointer"
              >
                Connect Repository
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Branch Modal */}
      <Dialog open={createBranchModalOpen} onOpenChange={setCreateBranchModalOpen}>
        <DialogContent className="max-w-lg bg-white border-[#e2e8f0] p-6 text-xs text-[#334155]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-[#0f172a] flex items-center gap-2">
              <GitBranch className="h-4.5 w-4.5 text-[#0052cc]" />
              <span>Create Issue Feature Branch</span>
            </DialogTitle>
            <p className="text-xs text-[#64748b]">
              Generate a formatted git branch command linked to your work item.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="font-medium text-[#0f172a]">Select Issue</label>
              <select
                value={selectedIssueForBranch?.id || ""}
                onChange={(e) => {
                  const match = issues.find((i) => i.id === e.target.value);
                  if (match) setSelectedIssueForBranch(match);
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] bg-white cursor-pointer"
              >
                {issues.map((i) => (
                  <option key={i.id} value={i.id}>
                    {project.identifier}-{i.sequenceId}: {i.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#0f172a]">Terminal Command</label>
              <div className="bg-[#18181b] p-3 rounded-lg font-mono text-emerald-400 text-xs flex items-center justify-between gap-2 overflow-x-auto">
                <span className="truncate">{branchCommand}</span>
                <button
                  onClick={handleCopyBranchCmd}
                  className="p-1 rounded hover:bg-white/10 text-white cursor-pointer shrink-0"
                  title="Copy command"
                >
                  {copiedBranchCmd ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateBranchModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleCopyBranchCmd}
                className="h-8 text-xs bg-[#0052cc] hover:bg-[#0747a6] text-white cursor-pointer"
              >
                {copiedBranchCmd ? "Copied!" : "Copy & Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

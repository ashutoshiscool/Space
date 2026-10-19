"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  User,
} from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User as UserIcon,
  Clock,
  Star,
  Grid,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Menu,
  Sparkles,
  Filter,
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings2,
  ExternalLink,
  Layers,
  Inbox,
  LogOut,
  StickyNote,
  Check,
  Search,
  Github,
  MessageSquare,
  Figma,
  ShieldAlert,
  GitBranch,
  Webhook,
  SlidersHorizontal,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface AppSidebarProps {
  workspace: WorkspaceWithDetails;
  currentProject: ProjectWithDetails;
  currentUser: Pick<User, "id" | "name" | "email" | "avatarUrl">;
}

interface AppIntegration {
  id: string;
  name: string;
  category: string;
  description: string;
  iconBg: string;
  iconText: string;
  installed: boolean;
  actionText: string;
}

export function AppSidebar({
  workspace,
  currentProject,
  currentUser,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);
  const toggleStickies = useSpaceStore((s) => s.toggleStickies);

  // Dynamic active project resolution based on URL pathname
  const pathParts = pathname.split("/").filter(Boolean);
  // e.g. ["acme-corp", "XRGO", "summary"] or ["acme-corp", "your-work"]
  const urlIdentifier = pathParts.length >= 2 ? pathParts[1].toUpperCase() : null;

  const activeProject = useMemo(() => {
    if (urlIdentifier) {
      const match = workspace.projects.find(
        (p) => p.identifier.toUpperCase() === urlIdentifier
      );
      if (match) return match as unknown as ProjectWithDetails;
    }
    return currentProject || (workspace.projects[0] as unknown as ProjectWithDetails);
  }, [urlIdentifier, workspace.projects, currentProject]);

  const isViewingProject = Boolean(
    urlIdentifier &&
    workspace.projects.some((p) => p.identifier.toUpperCase() === urlIdentifier)
  );

  const baseProjectUrl = activeProject
    ? `/${workspace.slug}/${activeProject.identifier}`
    : `/${workspace.slug}`;

  // UI state for dropdowns & modals
  const [moreSpacesOpen, setMoreSpacesOpen] = useState(false);
  const [customizeSidebarOpen, setCustomizeSidebarOpen] = useState(false);
  const [showBottomPromoCard, setShowBottomPromoCard] = useState(true);

  // Apps Marketplace & Integrations Modal state
  const [appsModalOpen, setAppsModalOpen] = useState(false);
  const [appsSearch, setAppsSearch] = useState("");
  const [appsTab, setAppsTab] = useState<"all" | "installed" | "dev">("all");

  const [integrationsList, setIntegrationsList] = useState<AppIntegration[]>([
    {
      id: "github",
      name: "GitHub Sync",
      category: "Code & Version Control",
      description: "Link pull requests, automate issue state transitions on merge, and reference branch commits.",
      iconBg: "bg-[#24292e]",
      iconText: "GH",
      installed: true,
      actionText: "Configure",
    },
    {
      id: "slack",
      name: "Slack & Discord Alerts",
      category: "Team Communication",
      description: "Send live issue updates, sprint burndown digests, and preview cards directly into team channels.",
      iconBg: "bg-[#4a154b]",
      iconText: "SL",
      installed: false,
      actionText: "Connect",
    },
    {
      id: "figma",
      name: "Figma Dev Mode",
      category: "Design & Assets",
      description: "Embed live Figma component frames, inspect color tokens, and preview design prototypes inside issues.",
      iconBg: "bg-[#ff7262]",
      iconText: "FG",
      installed: true,
      actionText: "Configure",
    },
    {
      id: "sentry",
      name: "Sentry Error Tracker",
      category: "Incident & Error Monitoring",
      description: "Automatically triage production exceptions and stack traces into actionable Space bugs.",
      iconBg: "bg-[#362d59]",
      iconText: "SN",
      installed: false,
      actionText: "Connect",
    },
    {
      id: "gitlab",
      name: "GitLab & Bitbucket CI/CD",
      category: "CI/CD & Pipelines",
      description: "Link merge requests, deployment environments, and build statuses to your Space release cycles.",
      iconBg: "bg-[#fc6d26]",
      iconText: "GL",
      installed: false,
      actionText: "Connect",
    },
    {
      id: "webhooks",
      name: "Webhooks & REST API",
      category: "Developer Tools",
      description: "Build custom bots, automations, and sidecars with outgoing webhooks and Personal Access Tokens.",
      iconBg: "bg-[#0052cc]",
      iconText: "API",
      installed: true,
      actionText: "Manage Tokens",
    },
  ]);

  const toggleAppInstallation = (appId: string) => {
    setIntegrationsList((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              installed: !app.installed,
              actionText: !app.installed ? "Configure" : "Connect",
            }
          : app
      )
    );
  };

  const filteredIntegrations = useMemo(() => {
    return integrationsList.filter((app) => {
      if (appsTab === "installed" && !app.installed) return false;
      if (appsTab === "dev" && app.category !== "Developer Tools") return false;
      if (appsSearch.trim()) {
        const q = appsSearch.toLowerCase();
        return (
          app.name.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q) ||
          app.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [integrationsList, appsTab, appsSearch]);

  return (
    <aside className="flex h-full w-60 sm:w-64 flex-col border-r border-[#e5e7eb] bg-white text-[#172b4d] select-none shrink-0 font-sans text-xs">
      {/* Scrollable Navigation Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {/* Top Global Quick Nav */}
        <div className="space-y-0.5">
          {/* For you */}
          <Link
            href={`/${workspace.slug}/your-work`}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer",
              pathname === `/${workspace.slug}/your-work`
                ? "bg-[#e9f2ff] text-[#0052cc] font-semibold"
                : "text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d]"
            )}
          >
            <UserIcon className="h-4 w-4 shrink-0 text-[#6b778c]" />
            <span>For you</span>
          </Link>

          {/* Recent (with Chevron & Dropdown) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md font-medium text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer outline-none">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-[#6b778c]" />
                <span>Recent</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#6b778c]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border-[#e5e7eb] text-xs shadow-xl" align="start">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[#6b7280]">
                Recent Spaces
              </DropdownMenuLabel>
              {workspace.projects.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => router.push(`/${workspace.slug}/${p.identifier}/summary`)}
                  className="cursor-pointer"
                >
                  <span className="font-mono text-[10px] font-bold mr-1.5 text-[#0052cc]">
                    {p.identifier}
                  </span>
                  <span>{p.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Starred */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md font-medium text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer outline-none">
              <div className="flex items-center gap-2.5">
                <Star className="h-4 w-4 shrink-0 text-[#6b778c]" />
                <span>Starred</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#6b778c]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border-[#e5e7eb] text-xs shadow-xl" align="start">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[#6b7280]">
                Starred Items
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`${baseProjectUrl}/summary`)}
                className="cursor-pointer"
              >
                <Star className="h-3.5 w-3.5 mr-2 text-yellow-400 fill-yellow-400" />
                <span>{activeProject.name} (Current)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Apps - Opens Apps & Integrations Marketplace Modal */}
          <button
            onClick={() => setAppsModalOpen(true)}
            className="flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer"
          >
            <Grid className="h-4 w-4 shrink-0 text-[#6b778c]" />
            <span>Apps</span>
          </button>
        </div>

        {/* Spaces Section */}
        <div className="space-y-1 pt-1 border-t border-[#f1f2f4]">
          <div className="flex items-center justify-between px-2.5 py-1 text-xs font-bold text-[#172b4d]">
            <span>Spaces</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push("/create-workspace")}
                title="Create new space"
                className="p-1 rounded hover:bg-[#ebecf0] text-[#6b778c] hover:text-[#172b4d] transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => router.push(`/${workspace.slug}/settings`)}
                title="Space settings"
                className="p-1 rounded hover:bg-[#ebecf0] text-[#6b778c] hover:text-[#172b4d] transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="px-2.5 text-[10px] font-semibold text-[#6b778c] uppercase tracking-wider">
            Recent
          </div>

          {/* Active Space Item: Dynamically shows activeProject (e.g. XRGO) */}
          <Link
            href={`${baseProjectUrl}/summary`}
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all",
              isViewingProject
                ? "bg-[#e9f2ff] text-[#0052cc] font-semibold border-l-3 border-[#0052cc] shadow-2xs"
                : "text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] font-medium"
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold font-mono shrink-0 shadow-2xs",
                isViewingProject
                  ? "bg-[#0052cc] text-white"
                  : "bg-white border border-[#e5e7eb] text-[#172b4d]"
              )}
            >
              {activeProject.identifier.slice(0, 2)}
            </div>
            <span className="truncate">{activeProject.name}</span>
          </Link>

          {/* More spaces expander */}
          <div className="pt-0.5">
            <button
              onClick={() => setMoreSpacesOpen(!moreSpacesOpen)}
              className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md font-medium text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Menu className="h-3.5 w-3.5 text-[#6b778c]" />
                <span>More spaces</span>
              </div>
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-[#6b778c] transition-transform",
                  moreSpacesOpen ? "rotate-90" : ""
                )}
              />
            </button>

            {moreSpacesOpen && (
              <div className="pl-6 space-y-0.5 pt-1 animate-in slide-in-from-top-1 duration-200">
                {workspace.projects.map((p) => {
                  const isCurrent = isViewingProject && p.id === activeProject.id;
                  return (
                    <Link
                      key={p.id}
                      href={`/${workspace.slug}/${p.identifier}/summary`}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors",
                        isCurrent
                          ? "text-[#0052cc] font-semibold bg-[#e9f2ff]"
                          : "text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d]"
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="font-mono text-[10px] text-[#6b778c]">
                        {p.identifier}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Section */}
        <div className="space-y-1 pt-1 border-t border-[#f1f2f4]">
          <div className="px-2.5 text-[10px] font-semibold text-[#6b778c] uppercase tracking-wider">
            Recommended
          </div>

          <button
            onClick={() => router.push(`${baseProjectUrl}/forms`)}
            className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md font-medium text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Inbox className="h-4 w-4 shrink-0 text-[#6b778c]" />
              <span className="truncate">Collect requests</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-[#f3e8ff] border border-[#e9d5ff] text-[#9333ea] text-[10px] font-bold shrink-0">
              Try
            </span>
          </button>
        </div>

        {/* Views & Dashboards */}
        <div className="space-y-0.5 pt-1 border-t border-[#f1f2f4]">
          {/* Filters */}
          <Link
            href={`${baseProjectUrl}/views`}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer",
              pathname.includes("/views")
                ? "bg-[#e9f2ff] text-[#0052cc] font-semibold"
                : "text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d]"
            )}
          >
            <Filter className="h-4 w-4 shrink-0 text-[#6b778c]" />
            <span>Filters</span>
          </Link>

          {/* Dashboards */}
          <Link
            href={`${baseProjectUrl}/analytics`}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer",
              pathname.includes("/analytics")
                ? "bg-[#e9f2ff] text-[#0052cc] font-semibold"
                : "text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d]"
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-[#6b778c]" />
            <span>Dashboards</span>
          </Link>
        </div>

        {/* Integrations & Customization Tools */}
        <div className="space-y-0.5 pt-1 border-t border-[#f1f2f4]">
          {/* Assets */}
          <button
            onClick={() => router.push(`${baseProjectUrl}/pages`)}
            className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md font-medium text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FolderOpen className="h-4 w-4 shrink-0 text-[#6b778c]" />
              <span>Assets</span>
            </div>
            <ExternalLink className="h-3 w-3 text-[#6b778c]" />
          </button>

          {/* Teams */}
          <button
            onClick={() => router.push(`/${workspace.slug}/settings`)}
            className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md font-medium text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 shrink-0 text-[#6b778c]" />
              <span>Teams</span>
            </div>
            <ExternalLink className="h-3 w-3 text-[#6b778c]" />
          </button>

          {/* Customize sidebar */}
          <button
            onClick={() => setCustomizeSidebarOpen(true)}
            className="flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer"
          >
            <Settings2 className="h-4 w-4 shrink-0 text-[#6b778c]" />
            <span>Customize sidebar</span>
          </button>
        </div>
      </div>

      {/* Bottom Discovery / Team Card */}
      {showBottomPromoCard && (
        <div className="p-3 border-t border-[#f1f2f4] bg-white">
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafd] p-3 space-y-2 relative shadow-2xs">
            {/* Top row: Avatar & Options */}
            <div className="flex items-center justify-between">
              <Avatar className="h-6 w-6 border border-[#e2e8f0]">
                <AvatarFallback className="text-[10px] font-bold bg-[#deebff] text-[#0052cc]">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <button
                onClick={() => setShowBottomPromoCard(false)}
                title="Dismiss"
                className="text-[#6b778c] hover:text-[#172b4d] p-0.5 rounded cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Content text */}
            <div className="space-y-0.5">
              <div className="text-[11px] text-[#6b778c]">
                <span className="font-semibold text-[#172b4d]">{currentUser.name}</span> is using
              </div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#172b4d]">
                <div className="h-3.5 w-3.5 rounded-xs bg-[#6554c0] flex items-center justify-center text-white text-[8px]">
                  ✦
                </div>
                <span>Space Product Discovery</span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => router.push(`${baseProjectUrl}/analytics`)}
              className="text-xs font-semibold text-[#0052cc] hover:underline cursor-pointer block pt-0.5"
            >
              Join your team &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Apps & Integrations Marketplace Modal */}
      <Dialog open={appsModalOpen} onOpenChange={setAppsModalOpen}>
        <DialogContent className="max-w-3xl bg-white border-[#e5e7eb] p-6 max-h-[85vh] flex flex-col font-sans">
          <DialogHeader className="space-y-1 pb-3 border-b border-[#e5e7eb] shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-[#172b4d] flex items-center gap-2">
                <Grid className="h-4.5 w-4.5 text-[#0052cc]" />
                <span>Space Apps & Integrations</span>
              </DialogTitle>
              <span className="text-xs text-[#6b7280]">
                {integrationsList.filter((a) => a.installed).length} installed
              </span>
            </div>
            <p className="text-xs text-[#6b7280]">
              Extend your workflow with code sync, design tools, error trackers, and chat bots.
            </p>
          </DialogHeader>

          {/* Search & Tabs bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6b7280]" />
              <input
                type="text"
                placeholder="Search apps and integrations..."
                value={appsSearch}
                onChange={(e) => setAppsSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#e5e7eb] text-xs text-[#172b4d] focus:outline-none focus:border-[#0052cc]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center rounded-lg bg-[#f1f2f4] p-0.5 text-xs font-medium">
              <button
                onClick={() => setAppsTab("all")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors cursor-pointer",
                  appsTab === "all"
                    ? "bg-white text-[#172b4d] shadow-2xs font-semibold"
                    : "text-[#6b7280] hover:text-[#172b4d]"
                )}
              >
                All Apps
              </button>
              <button
                onClick={() => setAppsTab("installed")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors cursor-pointer",
                  appsTab === "installed"
                    ? "bg-white text-[#172b4d] shadow-2xs font-semibold"
                    : "text-[#6b7280] hover:text-[#172b4d]"
                )}
              >
                Installed
              </button>
              <button
                onClick={() => setAppsTab("dev")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors cursor-pointer",
                  appsTab === "dev"
                    ? "bg-white text-[#172b4d] shadow-2xs font-semibold"
                    : "text-[#6b7280] hover:text-[#172b4d]"
                )}
              >
                Developer
              </button>
            </div>
          </div>

          {/* Apps Cards Grid */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredIntegrations.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-[#e5e7eb] bg-[#fafbfc] hover:bg-white hover:border-[#cbd5e1] p-4 flex flex-col justify-between gap-3 shadow-2xs transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs shadow-xs",
                        app.iconBg
                      )}
                    >
                      {app.iconText}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#172b4d]">
                          {app.name}
                        </span>
                        {app.installed && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#6b7280]">
                        {app.category}
                      </div>
                      <p className="text-[11px] text-[#42526e] leading-relaxed line-clamp-2">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f1f2f4]">
                    <span className="text-[10px] text-[#6b7280]">
                      {app.installed ? "Active in this space" : "Free integration"}
                    </span>
                    <button
                      onClick={() => toggleAppInstallation(app.id)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                        app.installed
                          ? "bg-white border border-[#e5e7eb] text-[#172b4d] hover:bg-[#f3f4f6]"
                          : "bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-2xs"
                      )}
                    >
                      {app.actionText}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredIntegrations.length === 0 && (
              <div className="py-12 text-center text-[#6b7280] italic">
                No integrations found matching your search.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Customize Sidebar Modal */}
      <Dialog open={customizeSidebarOpen} onOpenChange={setCustomizeSidebarOpen}>
        <DialogContent className="max-w-md bg-white border-[#e5e7eb] p-6 text-xs text-[#334155]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-[#172b4d] flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[#0052cc]" />
              <span>Customize Sidebar</span>
            </DialogTitle>
            <p className="text-xs text-[#6b7280]">
              Personalize which links and tools appear in your navigation bar.
            </p>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {[
              { label: "For you", active: true },
              { label: "Recent spaces", active: true },
              { label: "Starred spaces", active: true },
              { label: "Collect requests", active: true },
              { label: "Filters & Views", active: true },
              { label: "Dashboards", active: true },
              { label: "Assets & Docs", active: true },
              { label: "Teams", active: true },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-2 rounded-lg bg-[#f8f9fa] border border-[#e5e7eb]"
              >
                <span className="font-medium text-[#172b4d]">{item.label}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0052cc] text-white">
                  <Check className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

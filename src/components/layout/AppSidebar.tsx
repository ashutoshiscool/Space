"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  User,
} from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import {
  Plus,
  Search,
  ChevronDown,
  Layers,
  RefreshCw,
  FolderKanban,
  LayoutGrid,
  FileText,
  BarChart2,
  Archive,
  Inbox,
  Milestone,
  StickyNote,
  UserCheck,
  FileEdit,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  workspace: WorkspaceWithDetails;
  currentProject: ProjectWithDetails;
  currentUser: Pick<User, "id" | "name" | "email" | "avatarUrl">;
}

export function AppSidebar({
  workspace,
  currentProject,
  currentUser,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toggleCommand = useSpaceStore((s) => s.toggleCommand);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);
  const toggleStickies = useSpaceStore((s) => s.toggleStickies);

  const baseProjectUrl = `/${workspace.slug}/${currentProject.identifier}`;

  const navItems = [
    {
      label: "Issues",
      href: `${baseProjectUrl}/issues`,
      icon: Layers,
    },
    {
      label: "Cycles",
      href: `${baseProjectUrl}/cycles`,
      icon: RefreshCw,
    },
    {
      label: "Modules",
      href: `${baseProjectUrl}/modules`,
      icon: FolderKanban,
    },
    {
      label: "Views",
      href: `${baseProjectUrl}/views`,
      icon: LayoutGrid,
    },
    {
      label: "Roadmap",
      href: `${baseProjectUrl}/roadmap`,
      icon: Milestone,
    },
    {
      label: "Pages",
      href: `${baseProjectUrl}/pages`,
      icon: FileText,
    },
    {
      label: "Analytics",
      href: `${baseProjectUrl}/analytics`,
      icon: BarChart2,
    },
    {
      label: "Triage",
      href: `${baseProjectUrl}/triage`,
      icon: Inbox,
    },
    {
      label: "Archives",
      href: `${baseProjectUrl}/archives`,
      icon: Archive,
    },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#e5e7eb] bg-[#f8f9fa] text-[#4b5563] select-none shrink-0 font-sans">
      {/* Workspace Selector Dropdown */}
      <div className="flex h-13 items-center px-3 border-b border-[#e5e7eb]">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[#eef0f2] transition-colors w-full text-left cursor-pointer outline-none">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[#e5e7eb] font-semibold text-[#111827] text-xs shadow-xs">
              {workspace.name.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <div className="text-xs font-semibold text-[#111827] truncate">
                {workspace.name}
              </div>
              <div className="text-[10px] text-[#6b7280] font-mono leading-none">
                {workspace.slug}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#6b7280]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border-[#e5e7eb] text-[#111827] shadow-xl" align="start">
            <DropdownMenuLabel className="text-[#6b7280] text-[11px]">Workspaces</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/${workspace.slug}`)}
              className="font-medium text-[#3e63dd] hover:bg-[#f3f4f6] cursor-pointer"
            >
              {workspace.name} (Current)
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#e5e7eb]" />
            <DropdownMenuItem
              onClick={() => router.push("/create-workspace")}
              className="hover:bg-[#f3f4f6] cursor-pointer"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              <span>Create New Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3 space-y-1.5 border-b border-[#e5e7eb]">
        <button
          onClick={() => openCreateIssue()}
          className="flex w-full items-center justify-between rounded-md bg-[#3e63dd] hover:bg-[#3451b2] active:bg-[#2f469e] px-2.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            <span>New Issue</span>
          </div>
          <kbd className="rounded bg-black/20 px-1 py-0.2 text-[9px] font-mono font-semibold">
            C
          </kbd>
        </button>

        <button
          onClick={toggleCommand}
          className="flex w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-white hover:bg-gray-50 hover:border-[#cbd5e1] px-2.5 py-1.5 text-xs text-[#6b7280] hover:text-[#111827] shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#6b7280]" />
            <span>Search or jump to...</span>
          </div>
          <kbd className="rounded bg-[#f3f4f6] border border-[#e5e7eb] px-1 py-0.2 text-[9px] font-mono text-[#6b7280]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin">
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Workspace
          </div>

          <Link
            href={`/${workspace.slug}/your-work`}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              pathname === `/${workspace.slug}/your-work`
                ? "bg-white text-[#111827] shadow-xs border border-[#e5e7eb] font-semibold"
                : "text-[#4b5563] hover:bg-[#eef0f2] hover:text-[#111827]"
            )}
          >
            <UserCheck className={cn("h-4 w-4", pathname === `/${workspace.slug}/your-work` ? "text-[#3e63dd]" : "text-[#6b7280]")} />
            <span>Your Work</span>
          </Link>

          <Link
            href={`/${workspace.slug}/drafts`}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors mb-2",
              pathname === `/${workspace.slug}/drafts`
                ? "bg-white text-[#111827] shadow-xs border border-[#e5e7eb] font-semibold"
                : "text-[#4b5563] hover:bg-[#eef0f2] hover:text-[#111827]"
            )}
          >
            <FileEdit className={cn("h-4 w-4", pathname === `/${workspace.slug}/drafts` ? "text-[#3e63dd]" : "text-[#6b7280]")} />
            <span>Drafts</span>
          </Link>

          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-white text-[#111827] shadow-xs border border-[#e5e7eb] font-semibold"
                    : "text-[#4b5563] hover:bg-[#eef0f2] hover:text-[#111827]"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-[#3e63dd]" : "text-[#6b7280]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Projects Section */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            <span>Projects</span>
            <Link
              href={`/${workspace.slug}/settings`}
              className="hover:text-[#111827] text-[#6b7280] transition-colors"
              title="Add project"
            >
              <Plus className="h-3 w-3" />
            </Link>
          </div>

          {workspace.projects.map((proj) => {
            const isCurrent = proj.id === currentProject.id;
            return (
              <Link
                key={proj.id}
                href={`/${workspace.slug}/${proj.identifier}/issues`}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
                  isCurrent
                    ? "bg-white text-[#111827] font-semibold shadow-xs border border-[#e5e7eb]"
                    : "text-[#4b5563] hover:bg-[#eef0f2] hover:text-[#111827]"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-white border border-[#e5e7eb] text-[9px] font-bold text-[#111827] font-mono shrink-0 shadow-xs">
                    {proj.identifier.slice(0, 2)}
                  </span>
                  <span className="truncate">{proj.name}</span>
                </div>
                <span className="font-mono text-[10px] text-[#6b7280]">
                  {proj.identifier}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer User Profile & Settings */}
      <div className="p-3 border-t border-[#e5e7eb] space-y-1">
        <button
          onClick={toggleStickies}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-[#4b5563] hover:bg-[#eef0f2] hover:text-amber-600 transition-colors cursor-pointer text-left"
        >
          <StickyNote className="h-4 w-4 text-amber-500" />
          <span>Quick Stickies</span>
        </button>

        <Link
          href={`/${workspace.slug}/settings`}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-[#4b5563] hover:bg-[#eef0f2] hover:text-[#111827] transition-colors"
        >
          <Settings className="h-4 w-4 text-[#6b7280]" />
          <span>Workspace Settings</span>
        </Link>

        <div className="flex items-center justify-between rounded-lg bg-white border border-[#e5e7eb] p-2 mt-1 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-7 w-7 border border-[#e5e7eb]">
              {currentUser.avatarUrl && <AvatarImage src={currentUser.avatarUrl} />}
              <AvatarFallback className="bg-[#f3f4f6] text-xs font-semibold text-[#111827]">
                {currentUser.name.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="truncate">
              <div className="text-xs font-semibold text-[#111827] truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-[#6b7280] truncate font-mono">
                {currentUser.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded p-1 text-[#6b7280] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Edition Tag */}
        <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-[#9ca3af]">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Space Community Edition
          </span>
          <span className="font-mono">v1.4.2</span>
        </div>
      </div>
    </aside>
  );
}

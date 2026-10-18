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
  FolderKanban,
  RotateCcw,
  Layers,
  FileText,
  Inbox,
  Settings,
  Plus,
  Search,
  LogOut,
  ChevronDown,
  Sparkles,
  Compass,
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

  const baseProjectUrl = `/${workspace.slug}/${currentProject.identifier}`;

  const navItems = [
    {
      label: "Issues",
      href: `${baseProjectUrl}/issues`,
      icon: FolderKanban,
    },
    {
      label: "Cycles",
      href: `${baseProjectUrl}/cycles`,
      icon: RotateCcw,
    },
    {
      label: "Modules",
      href: `${baseProjectUrl}/modules`,
      icon: Layers,
    },
    {
      label: "Roadmap",
      href: `${baseProjectUrl}/roadmap`,
      icon: Compass,
    },
    {
      label: "Pages",
      href: `${baseProjectUrl}/pages`,
      icon: FileText,
    },
    {
      label: "Triage",
      href: `${baseProjectUrl}/triage`,
      icon: Inbox,
    },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-800/80 bg-[#0c0c0e] text-zinc-300 select-none shrink-0">
      {/* Workspace Selector Dropdown */}
      <div className="flex h-14 items-center px-4 border-b border-zinc-800/80">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-800/60 transition-colors w-full text-left cursor-pointer outline-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white text-xs shadow-sm shadow-indigo-500/20">
              {workspace.name.substring(0, 1)}
            </div>
            <div className="flex-1 truncate">
              <div className="text-xs font-semibold text-zinc-100 truncate">
                {workspace.name}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {workspace.slug}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/${workspace.slug}`)}
              className="font-medium text-indigo-400"
            >
              {workspace.name} (Current)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/create-workspace")}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              <span>Create New Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3 space-y-1.5">
        <button
          onClick={() => openCreateIssue()}
          className="flex w-full items-center justify-between rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Issue</span>
          </div>
          <kbd className="rounded bg-indigo-700/80 px-1.5 py-0.2 text-[10px] font-mono">
            C
          </kbd>
        </button>

        <button
          onClick={toggleCommand}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Search or jump to...</span>
          </div>
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-indigo-400 shadow-xs"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-indigo-400" : "text-zinc-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Projects List */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Projects</span>
            <Link
              href={`/${workspace.slug}/settings`}
              className="hover:text-zinc-300"
              title="Add project"
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>

          {workspace.projects.map((proj) => {
            const isCurrent = proj.id === currentProject.id;
            return (
              <Link
                key={proj.id}
                href={`/${workspace.slug}/${proj.identifier}/issues`}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  isCurrent
                    ? "bg-zinc-800/80 text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span>{proj.icon || "🚀"}</span>
                  <span className="truncate">{proj.name}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">
                  {proj.identifier}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer User Profile & Settings */}
      <div className="p-3 border-t border-zinc-800/80 space-y-2">
        <Link
          href={`/${workspace.slug}/settings`}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 transition-colors"
        >
          <Settings className="h-4 w-4 text-zinc-500" />
          <span>Workspace Settings</span>
        </Link>

        <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-2">
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-7 w-7">
              {currentUser.avatarUrl && <AvatarImage src={currentUser.avatarUrl} />}
              <AvatarFallback>{currentUser.name.substring(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <div className="text-xs font-medium text-zinc-200 truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {currentUser.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

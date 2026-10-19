"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  User,
} from "@/lib/types";
import { useSpaceStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationPopover } from "./NotificationPopover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Grid,
  Plus,
  Search,
  HelpCircle,
  Settings,
  AlertTriangle,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface GlobalTopNavProps {
  workspace: WorkspaceWithDetails;
  currentProject: ProjectWithDetails;
  currentUser: Pick<User, "id" | "name" | "email" | "avatarUrl">;
}

export function GlobalTopNav({
  workspace,
  currentProject,
  currentUser,
}: GlobalTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);
  const toggleCommand = useSpaceStore((s) => s.toggleCommand);

  const pathParts = pathname.split("/").filter(Boolean);
  const urlIdentifier = pathParts.length >= 2 ? pathParts[1].toUpperCase() : null;
  const activeProject = (urlIdentifier &&
    workspace.projects.find((p) => p.identifier.toUpperCase() === urlIdentifier)) ||
    currentProject ||
    workspace.projects[0];

  const [appsOpen, setAppsOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-[#e5e7eb] bg-white px-3 sm:px-4 z-40 select-none font-sans shrink-0">
      {/* Left section: App Switcher Grid & Brand Logo */}
      <div className="flex items-center gap-3">
        {/* 9-Dots App Switcher Button */}
        <DropdownMenu open={appsOpen} onOpenChange={setAppsOpen}>
          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer outline-none">
            {/* 3x3 Dots SVG icon for Space App Switcher */}
            <svg
              className="h-4.5 w-4.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="4" cy="4" r="2.2" />
              <circle cx="12" cy="4" r="2.2" />
              <circle cx="20" cy="4" r="2.2" />
              <circle cx="4" cy="12" r="2.2" />
              <circle cx="12" cy="12" r="2.2" />
              <circle cx="20" cy="12" r="2.2" />
              <circle cx="4" cy="20" r="2.2" />
              <circle cx="12" cy="20" r="2.2" />
              <circle cx="20" cy="20" r="2.2" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-white border-[#e5e7eb] p-2 text-xs shadow-xl" align="start">
            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[#6b7280]">
              Space Cloud Apps
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/${workspace.slug}/${activeProject.identifier}/summary`)}
              className="flex items-center gap-2.5 p-2 rounded-md hover:bg-[#f3f4f6] cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0052cc] text-white font-bold text-xs">
                S
              </div>
              <div>
                <div className="font-semibold text-[#111827]">Space Software</div>
                <div className="text-[10px] text-[#6b7280]">Issue & project tracking</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/${workspace.slug}/${activeProject.identifier}/pages`)}
              className="flex items-center gap-2.5 p-2 rounded-md hover:bg-[#f3f4f6] cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#00875a] text-white font-bold text-xs">
                D
              </div>
              <div>
                <div className="font-semibold text-[#111827]">Space Docs & Wiki</div>
                <div className="text-[10px] text-[#6b7280]">Documentation & specs</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/${workspace.slug}/${activeProject.identifier}/analytics`)}
              className="flex items-center gap-2.5 p-2 rounded-md hover:bg-[#f3f4f6] cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6554c0] text-white font-bold text-xs">
                P
              </div>
              <div>
                <div className="font-semibold text-[#111827]">Product Discovery</div>
                <div className="text-[10px] text-[#6b7280]">Ideas & user feedback</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Space Logo & Name */}
        <Link
          href={`/${workspace.slug}/${activeProject.identifier}/summary`}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          {/* Blue diamond/gradient mark */}
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0052cc] text-white shadow-xs">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-[#172b4d]">
            Space
          </span>
        </Link>
      </div>

      {/* Center / Action Section: Create Button & Global Search */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => openCreateIssue()}
          className="flex items-center gap-1.5 h-8 px-3.5 bg-[#0052cc] hover:bg-[#0747a6] active:bg-[#0047b3] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create</span>
        </button>

        <button
          onClick={toggleCommand}
          className="hidden md:flex items-center justify-between h-8 w-60 rounded-md border border-[#e5e7eb] bg-[#f8f9fa] hover:bg-white hover:border-[#cbd5e1] px-2.5 text-xs text-[#6b7280] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#6b7280]" />
            <span>Search or jump to...</span>
          </div>
          <kbd className="rounded bg-white border border-[#e5e7eb] px-1 py-0.2 text-[9px] font-mono text-[#6b7280]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Section: Warning Badge, Notification Bell, Help, Settings, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Limited Users Warning Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fff0b3] border border-[#ffe380] text-[#172b4d] text-[11px] font-semibold">
          <AlertTriangle className="h-3.5 w-3.5 text-[#ff8b00]" />
          <span>Limited users left</span>
        </div>

        {/* Notification Popover with 9+ badge */}
        <div className="relative">
          <NotificationPopover />
        </div>

        {/* Help Icon Button */}
        <button
          onClick={() => {
            window.open("https://github.com/ashutoshiscool/Space", "_blank");
          }}
          title="Help & Documentation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>

        {/* Settings Gear Button */}
        <button
          onClick={() => router.push(`/${workspace.slug}/settings`)}
          title="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>

        {/* User Profile Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center cursor-pointer outline-none ml-1">
            <Avatar className="h-7 w-7 border border-[#e5e7eb] hover:ring-2 hover:ring-[#0052cc]/30 transition-all">
              {currentUser.avatarUrl && (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              )}
              <AvatarFallback className="bg-[#f3f4f6] text-[11px] font-semibold text-[#172b4d]">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border-[#e5e7eb] text-[#111827] shadow-xl" align="end">
            <DropdownMenuLabel className="font-normal p-2">
              <div className="text-xs font-semibold text-[#111827]">{currentUser.name}</div>
              <div className="text-[10px] text-[#6b7280] font-mono">{currentUser.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#e5e7eb]" />
            <DropdownMenuItem
              onClick={() => router.push(`/${workspace.slug}/your-work`)}
              className="text-xs hover:bg-[#f3f4f6] cursor-pointer"
            >
              <UserIcon className="mr-2 h-3.5 w-3.5 text-[#6b7280]" />
              <span>Your Profile & Tasks</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/${workspace.slug}/settings`)}
              className="text-xs hover:bg-[#f3f4f6] cursor-pointer"
            >
              <Settings className="mr-2 h-3.5 w-3.5 text-[#6b7280]" />
              <span>Workspace Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#e5e7eb]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              <LogOut className="mr-2 h-3.5 w-3.5 text-rose-600" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

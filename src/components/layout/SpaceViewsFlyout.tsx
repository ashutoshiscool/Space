"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProjectWithDetails } from "@/lib/types";
import {
  Archive,
  ListTodo,
  FileText,
  SlidersHorizontal,
  Target,
  Package,
  Link2,
  Clock,
  Check,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpaceViewItem {
  id: string;
  name: string;
  navLabel: string;
  icon: React.ElementType;
  description: string;
  href: (workspaceSlug: string, identifier: string) => string;
  illustrationType: "archive" | "backlog" | "docs" | "forms" | "goals" | "releases" | "shortcuts" | "timeline";
}

export const SPACE_VIEWS: SpaceViewItem[] = [
  {
    id: "archives",
    name: "Archived work items",
    navLabel: "Archived work items",
    icon: Archive,
    description: "View all the work items archived in your space here.",
    href: (w, p) => `/${w}/${p}/archives`,
    illustrationType: "archive",
  },
  {
    id: "backlog",
    name: "Backlog",
    navLabel: "Backlog",
    icon: ListTodo,
    description: "Plan upcoming work, prioritize sprint backlog, and groom unassigned issues.",
    href: (w, p) => `/${w}/${p}/backlog`,
    illustrationType: "backlog",
  },
  {
    id: "docs",
    name: "Docs",
    navLabel: "Docs",
    icon: FileText,
    description: "Create and collaborate on project specs, meeting notes, and knowledge base pages.",
    href: (w, p) => `/${w}/${p}/pages`,
    illustrationType: "docs",
  },
  {
    id: "forms",
    name: "Forms",
    navLabel: "Forms",
    icon: SlidersHorizontal,
    description: "Collect intake requests and feedback from customers or team members without granting space access.",
    href: (w, p) => `/${w}/${p}/forms`,
    illustrationType: "forms",
  },
  {
    id: "goals",
    name: "Goals",
    navLabel: "Goals",
    icon: Target,
    description: "Track key outcomes, quarterly OKRs, and link milestones to your space deliverables.",
    href: (w, p) => `/${w}/${p}/roadmap`,
    illustrationType: "goals",
  },
  {
    id: "releases",
    name: "Releases",
    navLabel: "Releases",
    icon: Package,
    description: "Coordinate software releases, track deployment versions, and release notes.",
    href: (w, p) => `/${w}/${p}/cycles`,
    illustrationType: "releases",
  },
  {
    id: "shortcuts",
    name: "Shortcuts",
    navLabel: "Shortcuts",
    icon: Link2,
    description: "Bookmark important links, dashboards, Figma designs, and external documentation.",
    href: (w, p) => `/${w}/${p}/views`,
    illustrationType: "shortcuts",
  },
  {
    id: "timeline",
    name: "Timeline",
    navLabel: "Timeline",
    icon: Clock,
    description: "Visualize task dependencies, Gantt schedules, and delivery dates across months.",
    href: (w, p) => `/${w}/${p}/roadmap`,
    illustrationType: "timeline",
  },
];

interface SpaceViewsFlyoutProps {
  project: ProjectWithDetails;
  workspaceSlug: string;
  pinnedTabIds: string[];
  onTogglePin: (viewId: string) => void;
  onClose?: () => void;
}

export function SpaceViewsFlyout({
  project,
  workspaceSlug,
  pinnedTabIds,
  onTogglePin,
  onClose,
}: SpaceViewsFlyoutProps) {
  const router = useRouter();
  const [selectedViewId, setSelectedViewId] = useState<string>("archives");



  const currentView = SPACE_VIEWS.find((v) => v.id === selectedViewId) || SPACE_VIEWS[0];
  const isPinned = pinnedTabIds.includes(currentView.id);

  // Render stylized graphical illustration based on selected view
  const renderIllustration = (type: SpaceViewItem["illustrationType"]) => {
    switch (type) {
      case "archive":
        return (
          <div className="w-full h-36 rounded-md bg-[#deebff] border border-[#b3d4ff]/40 flex items-center justify-center p-3 relative overflow-hidden shadow-2xs">
            {/* Mock Archive Work Item Card */}
            <div className="w-56 bg-white rounded-md shadow-xs border border-[#c1c7d0]/40 p-3 space-y-2">
              <div className="h-1.5 w-16 bg-[#c1c7d0] rounded-xs" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-xs bg-[#6554c0]" />
                  <div className="h-2.5 w-20 bg-[#0052cc] rounded-xs" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-[#ffab00]" />
                  <div className="h-2 w-2 rounded-full bg-[#0052cc]" />
                </div>
              </div>
              <div className="h-1.5 w-14 bg-[#7a869a] rounded-xs" />
              <div className="h-4 w-28 bg-[#dfe1e6] rounded-xs" />
            </div>
          </div>
        );

      case "backlog":
        return (
          <div className="w-full h-36 rounded-md bg-[#deebff] border border-[#b3d4ff]/40 flex items-center justify-center p-3 relative overflow-hidden shadow-2xs">
            <div className="w-56 bg-white rounded-md shadow-xs border border-[#c1c7d0]/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-24 bg-[#0052cc] rounded-xs" />
                <div className="h-2 w-8 bg-[#c1c7d0] rounded-xs" />
              </div>
              <div className="flex items-center gap-1.5 bg-[#f4f5f7] p-1.5 rounded">
                <div className="h-2 w-2 rounded-full bg-[#0052cc]" />
                <div className="h-2 w-28 bg-[#c1c7d0] rounded-xs" />
              </div>
              <div className="flex items-center gap-1.5 bg-[#f4f5f7] p-1.5 rounded">
                <div className="h-2 w-2 rounded-full bg-[#36b37e]" />
                <div className="h-2 w-20 bg-[#c1c7d0] rounded-xs" />
              </div>
            </div>
          </div>
        );

      case "docs":
        return (
          <div className="w-full h-36 rounded-md bg-[#deebff] border border-[#b3d4ff]/40 flex items-center justify-center p-3 relative overflow-hidden shadow-2xs">
            <div className="w-56 bg-white rounded-md shadow-xs border border-[#c1c7d0]/40 p-3 space-y-2">
              <div className="h-3 w-28 bg-[#0052cc] rounded-xs" />
              <div className="space-y-1 pt-1">
                <div className="h-1.5 w-full bg-[#dfe1e6] rounded-xs" />
                <div className="h-1.5 w-3/4 bg-[#dfe1e6] rounded-xs" />
                <div className="h-1.5 w-1/2 bg-[#dfe1e6] rounded-xs" />
              </div>
            </div>
          </div>
        );

      case "forms":
        return (
          <div className="w-full h-36 rounded-md bg-[#deebff] border border-[#b3d4ff]/40 flex items-center justify-center p-3 relative overflow-hidden shadow-2xs">
            <div className="w-56 bg-white rounded-md shadow-xs border border-[#c1c7d0]/40 p-3 space-y-2">
              <div className="h-2.5 w-28 bg-[#0052cc] rounded-xs" />
              <div className="h-3 w-full bg-[#f4f5f7] border border-[#dfe1e6] rounded-xs" />
              <div className="flex justify-end pt-1">
                <div className="h-3 w-14 bg-[#0052cc] rounded-xs" />
              </div>
            </div>
          </div>
        );

      case "goals":
        return (
          <div className="w-full h-36 rounded-md bg-[#deebff] border border-[#b3d4ff]/40 flex items-center justify-center p-3 relative overflow-hidden shadow-2xs">
            <div className="w-56 bg-white rounded-md shadow-xs border border-[#c1c7d0]/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-20 bg-[#0052cc] rounded-xs" />
                <div className="h-2 w-8 bg-[#36b37e] rounded-xs" />
              </div>
              <div className="h-2 w-full bg-[#f4f5f7] rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-[#36b37e] rounded-full" />
              </div>
            </div>
          </div>
        );

      case "releases":
        return (
          <div className="w-full h-36 rounded-md bg-[#deebff] border border-[#b3d4ff]/40 flex items-center justify-center p-3 relative overflow-hidden shadow-2xs">
            <div className="w-56 bg-white rounded-md shadow-xs border border-[#c1c7d0]/40 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="px-1.5 py-0.5 bg-[#6554c0] text-white rounded font-mono text-[9px] font-bold">
                  v1.2.0
                </div>
                <div className="h-2 w-20 bg-[#c1c7d0] rounded-xs" />
              </div>
              <div className="h-1.5 w-full bg-[#f4f5f7] rounded-xs" />
            </div>
          </div>
        );

      case "shortcuts":
        return (
          <div className="w-full h-36 rounded-md bg-[#deebff] border border-[#b3d4ff]/40 flex items-center justify-center p-3 relative overflow-hidden shadow-2xs">
            <div className="grid grid-cols-2 gap-2 w-56">
              <div className="bg-white border border-[#dfe1e6] p-2 rounded flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#0052cc]" />
                <div className="h-1.5 w-12 bg-[#c1c7d0] rounded-xs" />
              </div>
              <div className="bg-white border border-[#dfe1e6] p-2 rounded flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ffab00]" />
                <div className="h-1.5 w-12 bg-[#c1c7d0] rounded-xs" />
              </div>
            </div>
          </div>
        );

      case "timeline":
      default:
        return (
          <div className="w-full h-36 rounded-md bg-[#deebff] border border-[#b3d4ff]/40 flex items-center justify-center p-3 relative overflow-hidden shadow-2xs">
            <div className="w-56 bg-white rounded-md shadow-xs border border-[#c1c7d0]/40 p-3 space-y-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-6 bg-[#c1c7d0] rounded-xs" />
                <div className="h-2 w-16 bg-[#36b37e] rounded-xs ml-4" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-6 bg-[#c1c7d0] rounded-xs" />
                <div className="h-2 w-20 bg-[#0052cc] rounded-xs ml-8" />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-[560px] max-w-[95vw] rounded-lg bg-white overflow-hidden font-sans text-xs text-[#172b4d] flex flex-col md:flex-row">
      {/* Left Column: Views List */}
      <div className="w-full md:w-52 border-r border-[#ebecf0] py-2 shrink-0 bg-white">
        <div className="px-4 py-1.5 text-xs font-semibold text-[#172b4d] tracking-tight">
          Views
        </div>

        <div className="mt-1 space-y-0.5">
          {SPACE_VIEWS.map((view) => {
            const Icon = view.icon;
            const isSelected = selectedViewId === view.id;
            const isTabPinned = pinnedTabIds.includes(view.id);

            return (
              <button
                key={view.id}
                onClick={() => setSelectedViewId(view.id)}
                onMouseEnter={() => setSelectedViewId(view.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 text-left transition-colors cursor-pointer text-xs",
                  isSelected
                    ? "bg-[#deebff] text-[#0052cc] font-medium border-l-[3px] border-[#0052cc]"
                    : "text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] border-l-[3px] border-transparent"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "text-[#0052cc]" : "text-[#42526e]"
                    )}
                  />
                  <span className="truncate">{view.name}</span>
                </div>

                {isTabPinned && (
                  <span
                    title="Pinned to navigation"
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0052cc]/10 text-[#0052cc] text-[9px] shrink-0 font-bold"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: View Preview & Actions */}
      <div className="flex-1 p-5 flex flex-col justify-between bg-white">
        <div>
          {/* Top: Illustration */}
          {renderIllustration(currentView.illustrationType)}

          {/* Middle: Title & Description */}
          <div className="mt-4 space-y-1">
            <h2 className="text-sm font-semibold text-[#172b4d] tracking-tight">
              {currentView.name}
            </h2>
            <p className="text-xs text-[#5e6c84] leading-relaxed">
              {currentView.description}
            </p>
          </div>

          {/* Bottom: Action Button */}
          <div className="mt-5">
            <button
              onClick={() => onTogglePin(currentView.id)}
              className={cn(
                "inline-flex items-center justify-center px-4 py-1.5 rounded-[3px] font-semibold text-xs transition-colors cursor-pointer shadow-2xs",
                isPinned
                  ? "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                  : "bg-[#0052cc] hover:bg-[#0747a6] text-white"
              )}
            >
              {isPinned ? "Remove from navigation" : "Add to navigation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

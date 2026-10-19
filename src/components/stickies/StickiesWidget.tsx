"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSpaceStore } from "@/lib/store";
import {
  StickyNote,
  Plus,
  X,
  Search,
  Pin,
  Trash2,
  Maximize2,
  Minimize2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StickyItem {
  id: string;
  title: string;
  content: string;
  color: "yellow" | "peach" | "mint" | "sky" | "lavender" | "obsidian";
  isPinned: boolean;
  updatedAt: string;
}

const STICKY_COLORS: {
  key: StickyItem["color"];
  name: string;
  bg: string;
  border: string;
  text: string;
  accent: string;
}[] = [
  {
    key: "yellow",
    name: "Amber",
    bg: "bg-amber-50 hover:bg-amber-100/70",
    border: "border-amber-200",
    text: "text-amber-900",
    accent: "bg-amber-500",
  },
  {
    key: "peach",
    name: "Peach",
    bg: "bg-orange-50 hover:bg-orange-100/70",
    border: "border-orange-200",
    text: "text-orange-900",
    accent: "bg-orange-500",
  },
  {
    key: "mint",
    name: "Mint",
    bg: "bg-emerald-50 hover:bg-emerald-100/70",
    border: "border-emerald-200",
    text: "text-emerald-900",
    accent: "bg-emerald-500",
  },
  {
    key: "sky",
    name: "Sky",
    bg: "bg-sky-50 hover:bg-sky-100/70",
    border: "border-sky-200",
    text: "text-sky-900",
    accent: "bg-sky-500",
  },
  {
    key: "lavender",
    name: "Lavender",
    bg: "bg-purple-50 hover:bg-purple-100/70",
    border: "border-purple-200",
    text: "text-purple-900",
    accent: "bg-purple-500",
  },
  {
    key: "obsidian",
    name: "Slate",
    bg: "bg-gray-50 hover:bg-gray-100/70",
    border: "border-gray-200",
    text: "text-gray-900",
    accent: "bg-gray-500",
  },
];

const INITIAL_STICKIES: StickyItem[] = [
  {
    id: "sticky-1",
    title: "Sprint Planning Notes",
    content: "Review API rate limiting & verify sub-issue cascade deletes before launch.",
    color: "yellow",
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sticky-2",
    title: "UI Polishing checklist",
    content: "1. Refined 1px border dividers\n2. Obsidian dark theme\n3. High-density spreadsheet mode",
    color: "sky",
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
];

export function StickiesWidget() {
  const isStickiesOpen = useSpaceStore((s) => s.isStickiesOpen);
  const setStickiesOpen = useSpaceStore((s) => s.setStickiesOpen);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);

  const [stickies, setStickies] = useState<StickyItem[]>([]);
  const [selectedStickyId, setSelectedStickyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("space_stickies_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStickies(parsed);
          setSelectedStickyId(parsed[0].id);
          return;
        }
      }
    } catch {
      // fallback
    }
    setStickies(INITIAL_STICKIES);
    setSelectedStickyId(INITIAL_STICKIES[0].id);
  }, []);

  // Save to localStorage
  const saveStickies = (newStickies: StickyItem[]) => {
    setStickies(newStickies);
    try {
      localStorage.setItem("space_stickies_data", JSON.stringify(newStickies));
    } catch {
      // ignore
    }
  };

  const handleCreateSticky = () => {
    const newSticky: StickyItem = {
      id: `sticky-${Date.now()}`,
      title: "New Note",
      content: "",
      color: "yellow",
      isPinned: false,
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSticky, ...stickies];
    saveStickies(updated);
    setSelectedStickyId(newSticky.id);
  };

  const handleDeleteSticky = (id: string) => {
    const updated = stickies.filter((s) => s.id !== id);
    saveStickies(updated);
    if (selectedStickyId === id) {
      setSelectedStickyId(updated[0]?.id || null);
    }
  };

  const handleUpdateSticky = (id: string, updates: Partial<StickyItem>) => {
    const updated = stickies.map((s) =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    saveStickies(updated);
  };

  const handleConvertToIssue = (sticky: StickyItem) => {
    openCreateIssue();
    setStickiesOpen(false);
  };

  const filteredStickies = useMemo(() => {
    let list = [...stickies];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
      );
    }
    // pinned stickies first
    list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    return list;
  }, [stickies, searchQuery]);

  const activeSticky = useMemo(
    () => stickies.find((s) => s.id === selectedStickyId) || stickies[0],
    [stickies, selectedStickyId]
  );

  return (
    <>
      {/* Floating Stickies Button Launcher */}
      <button
        onClick={() => setStickiesOpen(!isStickiesOpen)}
        className="fixed bottom-5 right-5 z-40 flex h-10 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#111827] shadow-xl transition-all hover:border-[#cbd5e1] hover:bg-gray-50 cursor-pointer active:scale-95"
        title="Open Stickies Scratchpad"
      >
        <StickyNote className="h-4 w-4 text-amber-500" />
        <span>Stickies</span>
        {stickies.length > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f3f4f6] text-[10px] font-mono text-[#6b7280] border border-[#e5e7eb]">
            {stickies.length}
          </span>
        )}
      </button>

      {/* Stickies Slide-Over Panel / Drawer */}
      {isStickiesOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity">
          <div
            className={cn(
              "flex flex-col border-l border-[#e5e7eb] bg-white shadow-2xl transition-all duration-200 text-[#111827]",
              isExpanded ? "w-[800px]" : "w-[480px]"
            )}
          >
            {/* Header */}
            <div className="flex h-13 items-center justify-between border-b border-[#e5e7eb] px-4 bg-[#f8f9fa]">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-amber-500" />
                <h2 className="text-xs font-semibold text-[#111827]">
                  Stickies Scratchpad
                </h2>
                <span className="rounded bg-white border border-[#e5e7eb] px-1.5 py-0.5 text-[10px] font-mono text-[#6b7280] shadow-xs">
                  {stickies.length} notes
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCreateSticky}
                  className="flex items-center gap-1.5 rounded-md bg-[#3e63dd] hover:bg-[#3451b2] px-2.5 py-1 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Note</span>
                </button>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-md p-1.5 text-[#6b7280] hover:bg-[#eef0f2] hover:text-[#111827] transition-colors cursor-pointer"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={() => setStickiesOpen(false)}
                  className="rounded-md p-1.5 text-[#6b7280] hover:bg-[#eef0f2] hover:text-[#111827] transition-colors cursor-pointer"
                  title="Close Stickies"
                  aria-label="Close Stickies"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="border-b border-[#e5e7eb] px-4 py-2.5 bg-white">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6b7280]" />
                <input
                  type="text"
                  placeholder="Search sticky notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-[#e5e7eb] bg-white py-1.5 pl-8 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd] focus:outline-hidden shadow-xs"
                />
              </div>
            </div>

            {/* Content Body: Split view if expanded or single active note view */}
            <div className="flex flex-1 overflow-hidden">
              {/* Stickies List Sidebar */}
              <div
                className={cn(
                  "overflow-y-auto border-r border-[#e5e7eb] bg-[#f8f9fa] p-2.5 space-y-1.5",
                  isExpanded ? "w-64" : "w-44"
                )}
              >
                {filteredStickies.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#9ca3af]">
                    No stickies found
                  </div>
                ) : (
                  filteredStickies.map((sticky) => {
                    const colorDef =
                      STICKY_COLORS.find((c) => c.key === sticky.color) ||
                      STICKY_COLORS[0];
                    const isSelected = sticky.id === activeSticky?.id;
                    return (
                      <div
                        key={sticky.id}
                        onClick={() => setSelectedStickyId(sticky.id)}
                        className={cn(
                          "group relative flex flex-col rounded-lg border p-2.5 transition-all cursor-pointer text-left shadow-xs",
                          colorDef.bg,
                          colorDef.border,
                          isSelected && "ring-2 ring-[#3e63dd] border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full shrink-0",
                                colorDef.accent
                              )}
                            />
                            <span className={cn("text-xs font-semibold truncate", colorDef.text)}>
                              {sticky.title || "Untitled"}
                            </span>
                          </div>
                          {sticky.isPinned && (
                            <Pin className="h-3 w-3 text-amber-500 shrink-0 fill-amber-500" />
                          )}
                        </div>

                        <p className="line-clamp-2 text-[11px] text-[#4b5563] font-sans">
                          {sticky.content || "Empty note..."}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Active Sticky Editor */}
              <div className="flex flex-1 flex-col overflow-hidden bg-white">
                {activeSticky ? (
                  <div className="flex flex-1 flex-col h-full">
                    {/* Top Action Bar for Active Sticky */}
                    <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-2 bg-white">
                      {/* Color Palette Selector */}
                      <div className="flex items-center gap-1">
                        {STICKY_COLORS.map((c) => (
                          <button
                            key={c.key}
                            onClick={() =>
                              handleUpdateSticky(activeSticky.id, {
                                color: c.key,
                              })
                            }
                            className={cn(
                              "h-5 w-5 rounded-full border transition-transform cursor-pointer shadow-xs",
                              c.accent,
                              activeSticky.color === c.key
                                ? "scale-110 border-gray-900 ring-2 ring-gray-400"
                                : "border-transparent opacity-80 hover:opacity-100"
                            )}
                            title={c.name}
                          />
                        ))}
                      </div>

                      {/* Sticky Quick Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleUpdateSticky(activeSticky.id, {
                              isPinned: !activeSticky.isPinned,
                            })
                          }
                          className={cn(
                            "rounded-md p-1.5 transition-colors cursor-pointer",
                            activeSticky.isPinned
                              ? "text-amber-600 bg-amber-50"
                              : "text-[#6b7280] hover:bg-[#eef0f2] hover:text-[#111827]"
                          )}
                          title={
                            activeSticky.isPinned ? "Unpin note" : "Pin to top"
                          }
                        >
                          <Pin
                            className={cn(
                              "h-3.5 w-3.5",
                              activeSticky.isPinned && "fill-amber-500"
                            )}
                          />
                        </button>

                        <button
                          onClick={() => handleConvertToIssue(activeSticky)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#4b5563] hover:bg-[#eef0f2] hover:text-[#111827] transition-colors cursor-pointer"
                          title="Convert sticky to formal project issue"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Turn to Issue</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSticky(activeSticky.id)}
                          className="rounded-md p-1.5 text-[#6b7280] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete sticky note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Content Editor */}
                    <div className="flex flex-1 flex-col p-4 overflow-y-auto space-y-3 bg-white">
                      <input
                        type="text"
                        value={activeSticky.title}
                        onChange={(e) =>
                          handleUpdateSticky(activeSticky.id, {
                            title: e.target.value,
                          })
                        }
                        placeholder="Note Title"
                        className="bg-transparent text-sm font-semibold text-[#111827] placeholder:text-[#9ca3af] focus:outline-hidden"
                      />

                      <textarea
                        value={activeSticky.content}
                        onChange={(e) =>
                          handleUpdateSticky(activeSticky.id, {
                            content: e.target.value,
                          })
                        }
                        placeholder="Write quick thoughts, snippets, or todo items here..."
                        className="flex-1 resize-none bg-transparent text-xs leading-relaxed text-[#374151] placeholder:text-[#9ca3af] focus:outline-hidden"
                      />
                    </div>

                    {/* Note Footer */}
                    <div className="flex items-center justify-between border-t border-[#e5e7eb] px-4 py-2 text-[10px] text-[#6b7280]">
                      <span>Saved locally</span>
                      <span>
                        Updated{" "}
                        {new Date(activeSticky.updatedAt).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <StickyNote className="h-8 w-8 text-[#9ca3af] mb-2" />
                    <p className="text-xs text-[#6b7280]">No note selected</p>
                    <button
                      onClick={handleCreateSticky}
                      className="mt-3 text-xs text-[#3e63dd] hover:underline cursor-pointer"
                    >
                      + Create a new sticky note
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

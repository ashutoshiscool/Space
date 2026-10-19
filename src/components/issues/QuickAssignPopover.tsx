"use client";

import React, { useState } from "react";
import { User } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, UserPlus, UserX, Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface QuickAssignPopoverProps {
  issueId: string;
  assignees: { user: Pick<User, "id" | "name" | "email" | "avatarUrl"> }[];
  projectMembers?: { user: Pick<User, "id" | "name" | "email" | "avatarUrl"> }[];
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function QuickAssignPopover({
  issueId,
  assignees,
  projectMembers = [],
  size = "sm",
  showLabel = false,
  className,
}: QuickAssignPopoverProps) {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const assignedUserIds = assignees.map((a) => a.user.id);
  const isUnassigned = assignedUserIds.length === 0;

  const updateAssigneeMutation = useMutation({
    mutationFn: async (targetUserId: string | null) => {
      let newAssigneeIds: string[];
      if (targetUserId === null) {
        newAssigneeIds = [];
      } else if (assignedUserIds.includes(targetUserId)) {
        // Toggle off if already assigned
        newAssigneeIds = assignedUserIds.filter((id) => id !== targetUserId);
      } else {
        // Assign target user
        newAssigneeIds = [targetUserId];
      }

      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeIds: newAssigneeIds }),
      });
      if (!res.ok) throw new Error("Failed to update assignee");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  const filteredMembers = projectMembers.filter(
    (m) =>
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const circleSizeClass =
    size === "xs"
      ? "h-4.5 w-4.5 text-[9px]"
      : size === "md"
      ? "h-6 w-6 text-xs"
      : "h-5 w-5 text-[10px]";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn("inline-flex items-center", className)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group/assign flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-[#3e63dd]/30 transition-all cursor-pointer focus:outline-none"
            title={
              isUnassigned
                ? "Assign to a team member"
                : `Assigned to ${assignees.map((a) => a.user.name).join(", ")} — click to change`
            }
          >
            {isUnassigned ? (
              <span
                className={cn(
                  "flex items-center justify-center rounded-full border border-dashed border-[#cbd5e1] bg-white text-[#9ca3af] hover:border-[#3e63dd] hover:text-[#3e63dd] hover:bg-[#eff6ff] transition-all",
                  circleSizeClass
                )}
              >
                <UserPlus className="h-3 w-3" />
              </span>
            ) : (
              <div className="flex -space-x-1">
                {assignees.map(({ user }) => (
                  <Avatar
                    key={user.id}
                    className={cn(
                      "border border-white ring-1 ring-[#e5e7eb] group-hover/assign:ring-[#3e63dd] transition-all",
                      circleSizeClass
                    )}
                  >
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                    <AvatarFallback className="bg-[#eff6ff] text-[#3e63dd] font-semibold text-[9px]">
                      {user.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}

            {showLabel && (
              <span className="text-[11px] text-[#6b7280] group-hover/assign:text-[#111827] transition-colors">
                {isUnassigned
                  ? "Unassigned"
                  : assignees.map((a) => a.user.name).join(", ")}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 p-1.5 bg-white border border-[#e5e7eb] shadow-xl rounded-xl z-50 text-[#111827]"
          onClick={(e) => e.stopPropagation()}
        >
          {projectMembers.length > 4 && (
            <div className="px-2 pb-1.5 pt-1">
              <div className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-[#f8f9fa] px-2 py-1 text-xs">
                <Search className="h-3 w-3 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Assign to..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Unassign option */}
          <DropdownMenuItem
            onClick={() => updateAssigneeMutation.mutate(null)}
            className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-[#f3f4f6] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6b7280]">
                <UserX className="h-3 w-3" />
              </span>
              <span className="text-[#6b7280] font-medium">Unassigned</span>
            </div>
            {isUnassigned && <Check className="h-3.5 w-3.5 text-[#3e63dd]" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-[#e5e7eb]" />

          {/* Team Members */}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredMembers.map(({ user }) => {
              const isSelected = assignedUserIds.includes(user.id);
              return (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => updateAssigneeMutation.mutate(user.id)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-[#f3f4f6] cursor-pointer transition-colors",
                    isSelected && "bg-[#eff6ff] text-[#3e63dd] font-medium"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Avatar className="h-5 w-5 border border-white">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                      <AvatarFallback className="text-[9px] bg-[#f1f3f5] text-[#111827]">
                        {user.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <span className="truncate text-xs text-[#111827]">{user.name}</span>
                      <span className="truncate text-[10px] text-[#6b7280]">{user.email}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#3e63dd] shrink-0 ml-1.5" />}
                </DropdownMenuItem>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="p-3 text-center text-xs text-[#9ca3af]">
                No members found
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

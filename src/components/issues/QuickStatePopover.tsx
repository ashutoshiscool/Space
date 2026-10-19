"use client";

import React from "react";
import { State } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { StateIcon } from "@/components/ui/StateIcon";
import { Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface QuickStatePopoverProps {
  issueId: string;
  currentState: State;
  states: State[];
  size?: number;
  className?: string;
  showName?: boolean;
}

export function QuickStatePopover({
  issueId,
  currentState,
  states,
  size = 14,
  className,
  showName = false,
}: QuickStatePopoverProps) {
  const queryClient = useQueryClient();

  const updateStateMutation = useMutation({
    mutationFn: async (newStateId: string) => {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateId: newStateId }),
      });
      if (!res.ok) throw new Error("Failed to update state");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["states"] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

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
            className="group/state flex items-center gap-1.5 rounded-full p-1 hover:bg-[#f3f4f6] transition-colors cursor-pointer focus:outline-none"
            title={`Status: ${currentState.name} (Click to change)`}
          >
            <StateIcon
              group={currentState.group}
              color={currentState.color}
              size={size}
              className="transition-transform group-hover/state:scale-110"
            />
            {showName && (
              <span className="text-[11px] font-medium text-[#4b5563] group-hover/state:text-[#111827]">
                {currentState.name}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-44 p-1.5 bg-white border border-[#e5e7eb] shadow-xl rounded-xl z-50 text-[#111827]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
            Change Status
          </div>
          <div className="space-y-0.5">
            {states.map((st) => {
              const isSelected = st.id === currentState.id;
              return (
                <DropdownMenuItem
                  key={st.id}
                  onClick={() => updateStateMutation.mutate(st.id)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-[#f3f4f6] cursor-pointer transition-colors",
                    isSelected && "bg-[#eff6ff] text-[#3e63dd] font-medium"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <StateIcon group={st.group} color={st.color} size={13} />
                    <span className="text-xs">{st.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#3e63dd]" />}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

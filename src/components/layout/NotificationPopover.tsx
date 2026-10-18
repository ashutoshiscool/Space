"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Notification } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

export function NotificationPopover() {
  const queryClient = useQueryClient();

  const { data } = useQuery<{
    notifications: Notification[];
    unreadCount: number;
  }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json();
    },
    refetchInterval: 10000, // Poll every 10s for notifications
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markOneReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer outline-none">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[#09090b]" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#141418] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-950/80 border border-indigo-800/80 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-400">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="text-[11px] text-zinc-400 hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markOneReadMutation.mutate(n.id);
              }}
              className={`p-3 text-xs transition-colors hover:bg-zinc-800/40 cursor-pointer ${
                !n.isRead ? "bg-indigo-950/20" : ""
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-zinc-200">
                <span className="truncate">{n.title}</span>
                <span className="text-[10px] font-normal text-zinc-500">
                  {formatDate(n.createdAt)}
                </span>
              </div>
              <p className="text-zinc-400 mt-1 line-clamp-2 leading-relaxed text-[11px]">
                {n.message}
              </p>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="p-6 text-center text-xs text-zinc-500">
              No notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

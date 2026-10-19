"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Notification } from "@/lib/types";
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
    refetchInterval: 10000,
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
      <DropdownMenuTrigger className="relative rounded-md p-1.5 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer outline-none">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-1.5 w-1.5 rounded-full bg-[#3e63dd] ring-2 ring-white" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#111827]">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#eff6ff] border border-[#bfdbfe] px-1.5 py-0.2 text-[10px] font-semibold text-[#2563eb] font-mono">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="text-[11px] text-[#6b7280] hover:text-[#111827] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-[#f1f3f5]">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markOneReadMutation.mutate(n.id);
                if (n.link) window.location.href = n.link;
              }}
              className={`p-3 text-xs transition-colors hover:bg-[#f8f9fa] cursor-pointer ${
                !n.isRead ? "bg-[#f0f4ff]" : ""
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-[#111827]">
                <span className="truncate">{n.title}</span>
                <span className="text-[10px] font-normal text-[#9ca3af]">
                  {formatDate(n.createdAt)}
                </span>
              </div>
              <p className="text-[#4b5563] mt-1 line-clamp-2 leading-relaxed text-[11px]">
                {n.message}
              </p>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="p-6 text-center text-xs text-[#9ca3af]">
              No notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

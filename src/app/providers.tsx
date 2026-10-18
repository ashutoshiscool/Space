"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSpaceStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const toggleCommand = useSpaceStore((s) => s.toggleCommand);
  const openCreateIssue = useSpaceStore((s) => s.openCreateIssue);

  // Global keyboard shortcuts: Cmd+K / Ctrl+K and 'C'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in input / textarea / contenteditable
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.getAttribute("role") === "textbox");

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
        return;
      }

      if (!isInput && e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openCreateIssue();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommand, openCreateIssue]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </div>
    </QueryClientProvider>
  );
}

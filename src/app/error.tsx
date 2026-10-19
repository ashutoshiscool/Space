"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors in production monitoring
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4 font-sans text-[#111827]">
      <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-sm text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#fef2f2] text-[#e11d48] mb-5">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h1 className="text-xl font-bold text-[#111827] tracking-tight mb-2">
          Something went wrong
        </h1>

        <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
          An unexpected error occurred while processing this request. Our team has been notified.
        </p>

        {error.digest && (
          <div className="mb-6 rounded-lg bg-[#f8f9fa] border border-[#e5e7eb] px-3 py-1.5 text-[11px] font-mono text-[#6b7280]">
            Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3e63dd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3352be] transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8f9fa] transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4 font-sans text-[#111827]">
      <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-sm text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3e63dd] mb-5">
          <Compass className="h-6 w-6 animate-pulse" />
        </div>
        
        <h1 className="text-xl font-bold text-[#111827] tracking-tight mb-2">
          Page not found
        </h1>
        
        <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
          The project, issue, or page you were looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3e63dd] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3352be] transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

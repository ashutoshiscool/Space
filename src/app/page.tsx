import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import {
  ArrowRight,
  Kanban,
  RotateCcw,
  Layers,
  FileText,
  Command,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: {
        workspace: {
          include: { projects: true },
        },
      },
    });

    if (membership?.workspace) {
      const proj = membership.workspace.projects[0];
      if (proj) {
        redirect(`/${membership.workspace.slug}/${proj.identifier}/issues`);
      }
      redirect(`/${membership.workspace.slug}`);
    }
    redirect("/create-workspace");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111827] selection:bg-[#3e63dd]/20 selection:text-[#3e63dd]">
      {/* Top Navigation */}
      <header className="flex h-14 items-center justify-between border-b border-[#e5e7eb] px-6 sm:px-12 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <Logo size="sm" />

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6]">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="h-8 text-xs font-medium bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-1 text-xs font-medium text-[#374151] shadow-xs">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Enterprise-grade Open Source Project Management</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#111827] max-w-3xl leading-[1.1]">
          Modern issue tracking built for high-velocity engineering.
        </h1>

        <p className="max-w-2xl text-sm sm:text-base text-[#4b5563] leading-relaxed font-normal">
          Designed for developers and product teams who value speed, precision, and clarity.
          Kanban boards with sub-100ms optimistic updates, automated sprint burndowns, and collaborative engineering RFCs.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/login">
            <Button size="default" className="h-10 px-5 text-xs font-medium bg-[#3e63dd] hover:bg-[#3451b2] text-white gap-2 shadow-xs">
              <span>Explore Workspace Demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="default" className="h-10 px-5 text-xs font-medium border-[#e5e7eb] bg-white hover:bg-[#f8f9fa] text-[#111827] shadow-xs">
              Create Free Account
            </Button>
          </Link>
        </div>

        {/* Demo Quick Sign-in Cards */}
        <div className="w-full max-w-2xl mt-8 pt-6 border-t border-[#e5e7eb]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] mb-3 text-center">
            One-Click Demo Profiles (Pre-seeded with real engineering workflows)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <Link
              href="/login"
              className="group rounded-lg border border-[#e5e7eb] bg-white p-3 hover:border-[#3e63dd] hover:shadow-xs transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#111827] group-hover:text-[#3e63dd]">Alex Rivera</span>
                <span className="rounded bg-[#3e63dd]/10 text-[#3e63dd] text-[10px] font-mono px-1.5 py-0.5 border border-[#3e63dd]/20 font-semibold">OWNER</span>
              </div>
              <div className="text-[11px] text-[#6b7280] font-mono">alex@space.dev</div>
            </Link>

            <Link
              href="/login"
              className="group rounded-lg border border-[#e5e7eb] bg-white p-3 hover:border-[#3e63dd] hover:shadow-xs transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#111827] group-hover:text-[#3e63dd]">Sarah Chen</span>
                <span className="rounded bg-purple-50 text-purple-700 text-[10px] font-mono px-1.5 py-0.5 border border-purple-200 font-semibold">ADMIN</span>
              </div>
              <div className="text-[11px] text-[#6b7280] font-mono">sarah@space.dev</div>
            </Link>

            <Link
              href="/login"
              className="group rounded-lg border border-[#e5e7eb] bg-white p-3 hover:border-[#3e63dd] hover:shadow-xs transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#111827] group-hover:text-[#3e63dd]">Marcus Vance</span>
                <span className="rounded bg-gray-100 text-[#4b5563] text-[10px] font-mono px-1.5 py-0.5 border border-gray-200 font-semibold">MEMBER</span>
              </div>
              <div className="text-[11px] text-[#6b7280] font-mono">marcus@space.dev</div>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-10 text-left">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-5 space-y-2.5 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#e5e7eb] text-[#3e63dd] shadow-xs">
              <Kanban className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">Optimistic Kanban & Lists</h3>
            <p className="text-xs text-[#4b5563] leading-relaxed">
              Drag-and-drop state transitions with sub-100ms optimistic UI updates and dense spreadsheet editing.
            </p>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-5 space-y-2.5 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#e5e7eb] text-[#3e63dd] shadow-xs">
              <RotateCcw className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">Cycles & Sprint Rollovers</h3>
            <p className="text-xs text-[#4b5563] leading-relaxed">
              Automated burndown charts, scope creep tracking, and seamless incomplete-issue rollover into subsequent cycles.
            </p>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-5 space-y-2.5 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#e5e7eb] text-[#3e63dd] shadow-xs">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">Engineering Documentation</h3>
            <p className="text-xs text-[#4b5563] leading-relaxed">
              TipTap rich-text editing with tables, code blocks, task lists, and instant public document sharing.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] py-5 text-center text-xs text-[#6b7280]">
        Space Platform &middot; Built with Next.js App Router, React 19, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.
      </footer>
    </div>
  );
}

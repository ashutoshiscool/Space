import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Kanban,
  RotateCcw,
  Layers,
  FileText,
  Command,
  Zap,
  Shield,
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
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-800/80 px-6 sm:px-12 backdrop-blur-md bg-[#09090b]/80 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20">
            🚀
          </div>
          <span className="text-lg font-bold tracking-tight">Space</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="text-xs font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>The speed of Linear. The depth of Plane. The flexibility of Notion.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 max-w-3xl leading-tight">
          Project planning at the speed of thought.
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
          Space combines sub-100ms optimistic UI updates, high-performance 60fps Kanban dragging,
          automated sprint burndowns, and collaborative documentation into a single unified workspace.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/login">
            <Button size="lg" className="h-11 px-6 text-sm font-semibold shadow-lg shadow-indigo-600/20 gap-2">
              <span>Launch Demo Space</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg" className="h-11 px-6 text-sm">
              Create Free Workspace
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full pt-16 text-left">
          <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950/60 border border-indigo-900/40 text-indigo-400">
              <Kanban className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">60fps Kanban & Dense Lists</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Fluid drag-and-drop state transitions with optimistic updates and dense spreadsheet editing with multi-select actions.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/60 border border-amber-900/40 text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">Cycles & Sprint Rollover</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Automated daily burndown charts, velocity tracking, scope creep alerts, and 1-click sprint completion.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-900/40 text-purple-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">Collaborative Notion Docs</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Rich-text TipTap documentation with slash commands, markdown shortcuts, task checklists, and public sharing.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        Space &copy; 2026. Built with Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.
      </footer>
    </div>
  );
}

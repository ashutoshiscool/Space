import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { GlobalTopNav } from "@/components/layout/GlobalTopNav";
import { CommandPalette } from "@/components/command/CommandPalette";
import { IssueDetailModal } from "@/components/issues/IssueDetailModal";
import { WorkspaceWithDetails, ProjectWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?callbackUrl=/${workspaceSlug}`);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      projects: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!workspace) {
    redirect("/create-workspace");
  }

  const isMember = workspace.members.some((m) => m.userId === user.id);
  if (!isMember) {
    redirect("/login");
  }

  const currentProject = workspace.projects[0] as unknown as ProjectWithDetails;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-[#111827]">
      {/* Top Global Navigation Bar matching Jira */}
      <GlobalTopNav
        workspace={workspace as unknown as WorkspaceWithDetails}
        currentProject={currentProject}
        currentUser={user}
      />

      {/* Main Workspace Body: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          workspace={workspace as unknown as WorkspaceWithDetails}
          currentProject={currentProject}
          currentUser={user}
        />

        <main className="flex flex-1 flex-col overflow-hidden bg-white">
          {children}
        </main>
      </div>

      {/* Global interactive modals */}
      <CommandPalette
        currentProject={currentProject}
        workspaceSlug={workspace.slug}
      />
      <IssueDetailModal />
    </div>
  );
}

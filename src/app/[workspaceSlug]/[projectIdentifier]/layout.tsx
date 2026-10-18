import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { IssueCreateModal } from "@/components/issues/IssueCreateModal";
import { WorkspaceWithDetails, ProjectWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string; projectIdentifier: string }>;
}) {
  const { workspaceSlug, projectIdentifier } = await params;

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
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: {
      workspaceId_identifier: {
        workspaceId: workspace.id,
        identifier: projectIdentifier.toUpperCase(),
      },
    },
    include: {
      states: { orderBy: { sequence: "asc" } },
      labels: true,
      cycles: { where: { isCompleted: false } },
      modules: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#09090b]">
      <WorkspaceHeader
        workspace={workspace as unknown as WorkspaceWithDetails}
        project={project as unknown as ProjectWithDetails}
      />

      <div className="flex flex-1 overflow-hidden p-6">
        {children}
      </div>

      <IssueCreateModal project={project as unknown as ProjectWithDetails} />
    </div>
  );
}

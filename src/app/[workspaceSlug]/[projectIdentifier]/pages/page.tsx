import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PagesListView } from "@/components/pages/PagesListView";
import { ProjectWithDetails } from "@/lib/types";

export default async function PagesIndexPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectIdentifier: string }>;
}) {
  const { workspaceSlug, projectIdentifier } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  });
  if (!workspace) notFound();

  const project = await prisma.project.findUnique({
    where: {
      workspaceId_identifier: {
        workspaceId: workspace.id,
        identifier: projectIdentifier.toUpperCase(),
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!project) notFound();

  const pages = await prisma.page.findMany({
    where: { projectId: project.id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      children: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <PagesListView
        pages={pages}
        project={project as unknown as ProjectWithDetails}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}

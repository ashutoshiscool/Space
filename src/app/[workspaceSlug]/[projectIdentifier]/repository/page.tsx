import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectRepositoryView } from "@/components/repository/ProjectRepositoryView";
import {
  WorkspaceWithDetails,
  ProjectWithDetails,
  IssueWithDetails,
} from "@/lib/types";

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectIdentifier: string }>;
}) {
  const { workspaceSlug, projectIdentifier } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      projects: {
        select: { id: true, name: true, identifier: true },
      },
    },
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
      states: { orderBy: { sequence: "asc" } },
      labels: true,
      cycles: true,
      modules: true,
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });
  if (!project) notFound();

  const issues = await prisma.issue.findMany({
    where: {
      projectId: project.id,
      isArchived: false,
    },
    include: {
      state: true,
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      labels: {
        include: { label: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <ProjectRepositoryView
        workspace={workspace as unknown as WorkspaceWithDetails}
        project={project as unknown as ProjectWithDetails}
        issues={issues as unknown as IssueWithDetails[]}
      />
    </div>
  );
}

import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IssuesPageClient } from "@/components/issues/IssuesPageClient";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";

export default async function IssuesPage({
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

  if (!project) notFound();

  const initialIssues = await prisma.issue.findMany({
    where: {
      projectId: project.id,
      isArchived: false,
    },
    include: {
      state: true,
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      labels: {
        include: { label: true },
      },
      cycle: true,
      module: true,
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      parent: {
        select: { id: true, sequenceId: true, title: true },
      },
      _count: {
        select: { comments: true, subIssues: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <IssuesPageClient
      initialIssues={initialIssues as unknown as IssueWithDetails[]}
      states={project.states}
      project={project as unknown as ProjectWithDetails}
    />
  );
}

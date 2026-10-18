import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TriageView } from "@/components/triage/TriageView";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";

export default async function TriagePage({
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
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!project) notFound();

  // Triage queries issues in the Backlog state group
  const backlogStateIds = project.states
    .filter((s) => s.group === "BACKLOG")
    .map((s) => s.id);

  const triageIssues = await prisma.issue.findMany({
    where: {
      projectId: project.id,
      stateId: { in: backlogStateIds },
      isArchived: false,
    },
    include: {
      state: true,
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      labels: { include: { label: true } },
      createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <TriageView
        triageIssues={triageIssues as unknown as IssueWithDetails[]}
        project={project as unknown as ProjectWithDetails}
      />
    </div>
  );
}

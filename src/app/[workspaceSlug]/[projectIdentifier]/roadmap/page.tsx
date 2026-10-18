import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RoadmapView } from "@/components/roadmap/RoadmapView";
import { IssueWithDetails, ProjectWithDetails, ModuleWithMetrics } from "@/lib/types";
import { StateGroup } from "@prisma/client";

export default async function ProjectRoadmapPage({
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

  const issues = await prisma.issue.findMany({
    where: { projectId: project.id, isArchived: false },
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

  const rawModules = await prisma.module.findMany({
    where: { projectId: project.id },
    include: {
      issues: { where: { isArchived: false }, include: { state: true } },
    },
  });

  const modules: ModuleWithMetrics[] = rawModules.map((m) => {
    const totalIssues = m.issues.length;
    const completedIssues = m.issues.filter(
      (i) => i.state.group === StateGroup.COMPLETED
    ).length;
    return {
      ...m,
      totalIssues,
      completedIssues,
      progressPercent:
        totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0,
      lead: null,
    };
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <RoadmapView
        issues={issues as unknown as IssueWithDetails[]}
        modules={modules}
        project={project as unknown as ProjectWithDetails}
      />
    </div>
  );
}

import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { StateGroup } from "@prisma/client";
import { CycleWithMetrics, IssueWithDetails, ProjectWithDetails } from "@/lib/types";

export default async function AnalyticsPage({
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
      cycles: true,
      modules: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!project) notFound();

  const rawIssues = await prisma.issue.findMany({
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

  const rawCycles = await prisma.cycle.findMany({
    where: { projectId: project.id },
    include: {
      issues: {
        where: { isArchived: false },
        include: { state: true },
      },
    },
    orderBy: { startDate: "desc" },
  });

  const cycles: CycleWithMetrics[] = rawCycles.map((cycle) => {
    const totalIssues = cycle.issues.length;
    const completedIssues = cycle.issues.filter(
      (i) => i.state.group === StateGroup.COMPLETED
    ).length;
    const totalPoints = cycle.issues.reduce((sum, i) => sum + (i.estimate || 0), 0);
    const completedPoints = cycle.issues
      .filter((i) => i.state.group === StateGroup.COMPLETED)
      .reduce((sum, i) => sum + (i.estimate || 0), 0);

    const progressPercent =
      totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    return {
      ...cycle,
      totalIssues,
      completedIssues,
      totalPoints,
      completedPoints,
      progressPercent,
      burndown: [],
    };
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <AnalyticsView
        issues={rawIssues as unknown as IssueWithDetails[]}
        project={project as unknown as ProjectWithDetails}
        cycles={cycles}
      />
    </div>
  );
}

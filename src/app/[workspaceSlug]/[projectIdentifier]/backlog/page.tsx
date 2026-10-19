import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BacklogView } from "@/components/backlog/BacklogView";
import { StateGroup } from "@prisma/client";
import { CycleWithMetrics, IssueWithDetails, ProjectWithDetails } from "@/lib/types";

export default async function BacklogPage({
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
      cycles: { where: { isCompleted: false }, orderBy: { startDate: "asc" } },
      modules: true,
      components: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!project) notFound();

  const rawCycles = await prisma.cycle.findMany({
    where: { projectId: project.id },
    include: {
      issues: {
        where: { isArchived: false },
        include: { state: true },
      },
    },
    orderBy: { startDate: "asc" },
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

    const start = new Date(cycle.startDate);
    const end = new Date(cycle.endDate);
    const durationDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );

    const burndown = [];
    const totalInitialScope = totalPoints > 0 ? totalPoints : totalIssues;
    const remainingScope =
      totalInitialScope - (totalPoints > 0 ? completedPoints : completedIssues);

    for (let day = 0; day <= durationDays; day++) {
      const currentDate = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
      const dayRatio = day / durationDays;
      const idealRemaining = Math.max(
        0,
        Math.round(totalInitialScope * (1 - dayRatio))
      );
      const isPastOrToday = currentDate <= new Date();
      const actualRemaining = isPastOrToday
        ? Math.max(
            0,
            Math.round(
              totalInitialScope -
                (totalInitialScope - remainingScope) * Math.min(1, dayRatio * 1.2)
            )
          )
        : null;

      burndown.push({
        date: currentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        idealRemaining,
        actualRemaining,
      });
    }

    return {
      ...cycle,
      totalIssues,
      completedIssues,
      totalPoints,
      completedPoints,
      progressPercent,
      burndown,
    };
  });

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
      component: true,
      watchers: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      worklogs: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { loggedAt: "desc" },
      },
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
    <div className="flex-1 overflow-y-auto">
      <BacklogView
        project={project as unknown as ProjectWithDetails}
        initialIssues={initialIssues as unknown as IssueWithDetails[]}
        cycles={cycles}
      />
    </div>
  );
}

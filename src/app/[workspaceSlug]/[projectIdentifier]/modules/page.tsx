import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModulesView } from "@/components/modules/ModulesView";
import { StateGroup } from "@prisma/client";
import { ModuleWithMetrics, ProjectWithDetails } from "@/lib/types";

export default async function ModulesPage({
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

  const rawModules = await prisma.module.findMany({
    where: { projectId: project.id },
    include: {
      issues: {
        where: { isArchived: false },
        include: { state: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const userIds = rawModules.map((m) => m.leadId).filter(Boolean) as string[];
  const leads = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  const leadMap = new Map(leads.map((l) => [l.id, l]));

  const modules: ModuleWithMetrics[] = rawModules.map((mod) => {
    const totalIssues = mod.issues.length;
    const completedIssues = mod.issues.filter(
      (i) => i.state.group === StateGroup.COMPLETED
    ).length;
    const progressPercent =
      totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    return {
      ...mod,
      totalIssues,
      completedIssues,
      progressPercent,
      lead: mod.leadId ? leadMap.get(mod.leadId) || null : null,
    };
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <ModulesView
        modules={modules}
        project={project as unknown as ProjectWithDetails}
      />
    </div>
  );
}

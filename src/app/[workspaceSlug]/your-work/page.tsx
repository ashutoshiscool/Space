import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YourWorkView } from "@/components/profile/YourWorkView";
import { WorkspaceWithDetails, IssueWithDetails, ProjectWithDetails } from "@/lib/types";

export default async function YourWorkPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?callbackUrl=/${workspaceSlug}/your-work`);
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

  if (!workspace) notFound();

  // Fetch all issues assigned to current user across all projects in workspace
  const assignedIssues = await prisma.issue.findMany({
    where: {
      project: { workspaceId: workspace.id },
      assignees: { some: { userId: user.id } },
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
      cycle: true,
      module: true,
      project: { select: { id: true, name: true, identifier: true } },
      createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch all issues created by current user
  const createdIssues = await prisma.issue.findMany({
    where: {
      project: { workspaceId: workspace.id },
      createdById: user.id,
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
      cycle: true,
      module: true,
      project: { select: { id: true, name: true, identifier: true } },
      createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch recent activities across workspace involving user
  const recentActivities = await prisma.issueActivity.findMany({
    where: {
      issue: { project: { workspaceId: workspace.id } },
      OR: [{ userId: user.id }, { issue: { assignees: { some: { userId: user.id } } } }],
    },
    include: {
      issue: {
        select: {
          id: true,
          sequenceId: true,
          title: true,
          project: { select: { identifier: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <YourWorkView
        currentUser={user}
        workspace={workspace as unknown as WorkspaceWithDetails}
        assignedIssues={assignedIssues as unknown as (IssueWithDetails & { project: Pick<ProjectWithDetails, "id" | "name" | "identifier"> })[]}
        createdIssues={createdIssues as unknown as (IssueWithDetails & { project: Pick<ProjectWithDetails, "id" | "name" | "identifier"> })[]}
        recentActivities={recentActivities}
      />
    </div>
  );
}

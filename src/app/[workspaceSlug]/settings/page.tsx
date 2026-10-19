import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceSettingsClient } from "@/components/settings/WorkspaceSettingsClient";
import { WorkspaceWithDetails } from "@/lib/types";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?callbackUrl=/${workspaceSlug}/settings`);
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

  if (!workspace) {
    notFound();
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#ffffff]">
      <WorkspaceSettingsClient
        workspace={workspace as unknown as WorkspaceWithDetails}
        currentUser={user}
      />
    </div>
  );
}

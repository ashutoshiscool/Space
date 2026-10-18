import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NotionPageEditor } from "@/components/pages/NotionPageEditor";

export default async function SingleDocPage({
  params,
}: {
  params: Promise<{
    workspaceSlug: string;
    projectIdentifier: string;
    pageId: string;
  }>;
}) {
  const { workspaceSlug, projectIdentifier, pageId } = await params;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      project: {
        select: {
          id: true,
          name: true,
          identifier: true,
          workspace: { select: { slug: true } },
        },
      },
    },
  });

  if (!page) notFound();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      <NotionPageEditor page={page as any} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceRootPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { projects: true },
  });

  if (!workspace) {
    redirect("/create-workspace");
  }

  if (workspace.projects.length > 0) {
    redirect(`/${workspace.slug}/${workspace.projects[0].identifier}/issues`);
  }

  redirect(`/${workspace.slug}/settings`);
}

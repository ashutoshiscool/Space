import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { WorkspaceRole, User } from "@prisma/client";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "space_super_secret_jwt_key_987654321_space_app"
);

const COOKIE_NAME = "space_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
}

export async function signSessionToken(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  return user;
}

export async function requireAuth(): Promise<Pick<User, "id" | "email" | "name" | "avatarUrl">> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  GUEST: 1,
};

export function hasRequiredRole(userRole: WorkspaceRole, allowedRoles?: WorkspaceRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const userLevel = ROLE_HIERARCHY[userRole];
  return allowedRoles.some((role) => userLevel >= ROLE_HIERARCHY[role]);
}

/**
 * Ensures user is a member of the workspace with sufficient role
 */
export async function requireWorkspaceMember(workspaceSlug: string, allowedRoles?: WorkspaceRole[]) {
  const user = await requireAuth();
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!workspace) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  const member = workspace.members[0];
  if (!member) {
    throw new Error("FORBIDDEN_WORKSPACE_MEMBER");
  }

  if (!hasRequiredRole(member.role, allowedRoles)) {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  return { user, workspace, member };
}

/**
 * Ensures user has access to a project through workspace membership or direct project membership
 */
export async function requireProjectMember(projectId: string, allowedRoles?: WorkspaceRole[]) {
  const user = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId: user.id },
          },
        },
      },
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  // Determine effective role: either from WorkspaceMember or ProjectMember
  const wsMember = project.workspace.members[0];
  const projMember = project.members[0];

  const effectiveRole = wsMember?.role || projMember?.role;
  if (!effectiveRole) {
    throw new Error("FORBIDDEN_PROJECT_ACCESS");
  }

  if (!hasRequiredRole(effectiveRole, allowedRoles)) {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  return { user, project, workspace: project.workspace, role: effectiveRole };
}

/**
 * Ensures user has access to an issue through its project/workspace tenancy
 */
export async function requireIssueAccess(issueId: string, allowedRoles?: WorkspaceRole[]) {
  const user = await requireAuth();

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: user.id },
              },
            },
          },
          members: {
            where: { userId: user.id },
          },
        },
      },
    },
  });

  if (!issue) {
    throw new Error("ISSUE_NOT_FOUND");
  }

  const wsMember = issue.project.workspace.members[0];
  const projMember = issue.project.members[0];

  const effectiveRole = wsMember?.role || projMember?.role;
  if (!effectiveRole) {
    throw new Error("FORBIDDEN_ISSUE_ACCESS");
  }

  if (!hasRequiredRole(effectiveRole, allowedRoles)) {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  return {
    user,
    issue,
    project: issue.project,
    workspace: issue.project.workspace,
    role: effectiveRole,
  };
}

/**
 * Ensures user has access to a cycle (sprint)
 */
export async function requireCycleAccess(cycleId: string, allowedRoles?: WorkspaceRole[]) {
  const user = await requireAuth();

  const cycle = await prisma.cycle.findUnique({
    where: { id: cycleId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: user.id },
              },
            },
          },
          members: {
            where: { userId: user.id },
          },
        },
      },
    },
  });

  if (!cycle) {
    throw new Error("CYCLE_NOT_FOUND");
  }

  const wsMember = cycle.project.workspace.members[0];
  const projMember = cycle.project.members[0];
  const effectiveRole = wsMember?.role || projMember?.role;

  if (!effectiveRole) {
    throw new Error("FORBIDDEN_CYCLE_ACCESS");
  }

  if (!hasRequiredRole(effectiveRole, allowedRoles)) {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  return { user, cycle, project: cycle.project, role: effectiveRole };
}

/**
 * Ensures user has access to a page (document)
 */
export async function requirePageAccess(
  pageId: string,
  allowedRoles?: WorkspaceRole[],
  allowPublicRead: boolean = false
) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: true,
            },
          },
        },
      },
    },
  });

  if (!page) {
    throw new Error("PAGE_NOT_FOUND");
  }

  if (allowPublicRead && page.isPublic) {
    return { page, project: page.project, user: null, role: null };
  }

  const user = await requireAuth();
  const wsMember = page.project.workspace.members.find((m) => m.userId === user.id);

  if (!wsMember) {
    throw new Error("FORBIDDEN_PAGE_ACCESS");
  }

  if (!hasRequiredRole(wsMember.role, allowedRoles)) {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  return { user, page, project: page.project, role: wsMember.role };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

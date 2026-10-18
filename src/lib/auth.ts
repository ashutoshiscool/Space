import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { WorkspaceRole } from "@prisma/client";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "space_super_secret_jwt_key_987654321_linear_plane_notion"
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

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

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

  if (allowedRoles && allowedRoles.length > 0) {
    const roleHierarchy: Record<WorkspaceRole, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      GUEST: 1,
    };
    const userRoleLevel = roleHierarchy[member.role];
    const hasPermission = allowedRoles.some((role) => userRoleLevel >= roleHierarchy[role]);
    if (!hasPermission) {
      throw new Error("INSUFFICIENT_PERMISSIONS");
    }
  }

  return { user, workspace, member };
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

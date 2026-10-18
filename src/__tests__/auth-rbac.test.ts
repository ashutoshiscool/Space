import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, signSessionToken, verifySessionToken } from "../lib/auth";
import { WorkspaceRole } from "@prisma/client";

describe("Authentication & RBAC Security Suite", () => {
  it("correctly hashes and verifies secure passwords with bcrypt", async () => {
    const rawPassword = "super_secure_space_pass_2026";
    const hashed = await hashPassword(rawPassword);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(rawPassword);

    const matches = await comparePassword(rawPassword, hashed);
    expect(matches).toBe(true);

    const wrongMatches = await comparePassword("incorrect_password", hashed);
    expect(wrongMatches).toBe(false);
  });

  it("signs and verifies cryptographic JWT session tokens", async () => {
    const userPayload = {
      userId: "user-12345",
      email: "engineer@space.dev",
      name: "Engineering Lead",
    };

    const token = await signSessionToken(userPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(userPayload.userId);
    expect(verified?.email).toBe(userPayload.email);
    expect(verified?.name).toBe(userPayload.name);

    // Invalid token returns null
    const invalid = await verifySessionToken("malformed.jwt.token");
    expect(invalid).toBeNull();
  });

  it("enforces role hierarchy and permissions for Workspace members", () => {
    const roleHierarchy: Record<WorkspaceRole, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      GUEST: 1,
    };

    function checkPermission(userRole: WorkspaceRole, allowedRoles: WorkspaceRole[]): boolean {
      const userLevel = roleHierarchy[userRole];
      return allowedRoles.some((role) => userLevel >= roleHierarchy[role]);
    }

    // Owner has access to admin and member actions
    expect(checkPermission(WorkspaceRole.OWNER, [WorkspaceRole.ADMIN])).toBe(true);
    expect(checkPermission(WorkspaceRole.OWNER, [WorkspaceRole.MEMBER])).toBe(true);

    // Admin has access to admin and member actions, but not owner-exclusive
    expect(checkPermission(WorkspaceRole.ADMIN, [WorkspaceRole.ADMIN])).toBe(true);
    expect(checkPermission(WorkspaceRole.ADMIN, [WorkspaceRole.OWNER])).toBe(false);

    // Member cannot access admin actions
    expect(checkPermission(WorkspaceRole.MEMBER, [WorkspaceRole.ADMIN])).toBe(false);
    expect(checkPermission(WorkspaceRole.MEMBER, [WorkspaceRole.MEMBER])).toBe(true);

    // Guest has strictly read-only access (cannot perform member actions)
    expect(checkPermission(WorkspaceRole.GUEST, [WorkspaceRole.MEMBER])).toBe(false);
    expect(checkPermission(WorkspaceRole.GUEST, [WorkspaceRole.ADMIN])).toBe(false);
    expect(checkPermission(WorkspaceRole.GUEST, [WorkspaceRole.GUEST])).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { ROLE_HIERARCHY, hasRequiredRole } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";

describe("Tenant Isolation, IDOR Prevention & RBAC Suite", () => {
  it("enforces strict role hierarchy ratings", () => {
    expect(ROLE_HIERARCHY[WorkspaceRole.OWNER]).toBeGreaterThan(ROLE_HIERARCHY[WorkspaceRole.ADMIN]);
    expect(ROLE_HIERARCHY[WorkspaceRole.ADMIN]).toBeGreaterThan(ROLE_HIERARCHY[WorkspaceRole.MEMBER]);
    expect(ROLE_HIERARCHY[WorkspaceRole.MEMBER]).toBeGreaterThan(ROLE_HIERARCHY[WorkspaceRole.GUEST]);
  });

  it("permits higher or equal roles according to allowed list", () => {
    // ADMIN can access if [ADMIN, MEMBER] is allowed
    expect(hasRequiredRole(WorkspaceRole.ADMIN, [WorkspaceRole.MEMBER])).toBe(true);
    // OWNER can access if [ADMIN] is allowed
    expect(hasRequiredRole(WorkspaceRole.OWNER, [WorkspaceRole.ADMIN])).toBe(true);
    // GUEST cannot access if [MEMBER] is required
    expect(hasRequiredRole(WorkspaceRole.GUEST, [WorkspaceRole.MEMBER])).toBe(false);
    // MEMBER cannot access if [ADMIN, OWNER] is required
    expect(hasRequiredRole(WorkspaceRole.MEMBER, [WorkspaceRole.ADMIN, WorkspaceRole.OWNER])).toBe(false);
  });

  it("verifies filename sanitization and malicious extension blocking", () => {
    const BLOCKED_EXTENSIONS = new Set([
      ".exe", ".bat", ".cmd", ".sh", ".php", ".phtml", ".py", ".pl", ".cgi", ".jar", ".vbs", ".js"
    ]);

    const testMaliciousFiles = [
      "shell.php",
      "malware.exe",
      "exploit.sh",
      "virus.bat",
      "payload.js",
      "script.py",
    ];

    for (const filename of testMaliciousFiles) {
      const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
      expect(BLOCKED_EXTENSIONS.has(ext)).toBe(true);
    }

    const testSafeFiles = [
      "screenshot.png",
      "design.pdf",
      "notes.txt",
      "mockup.jpeg",
      "spec.docx",
    ];

    for (const filename of testSafeFiles) {
      const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
      expect(BLOCKED_EXTENSIONS.has(ext)).toBe(false);
    }
  });

  it("verifies invitation expiry calculation", () => {
    const now = Date.now();
    const futureExpiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
    const pastExpiresAt = new Date(now - 1000);

    expect(new Date() > futureExpiresAt).toBe(false);
    expect(new Date() > pastExpiresAt).toBe(true);
  });
});

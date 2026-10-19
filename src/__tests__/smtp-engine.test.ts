import { describe, it, expect, beforeEach } from "vitest";
import {
  getSmtpConfig,
  saveSmtpConfig,
  sendSmtpEmail,
  buildTestEmailHtml,
  DEFAULT_SMTP_CONFIG,
} from "../lib/smtp";

describe("SMTP Delivery Engine & Configuration Suite", () => {
  const testWorkspaceSlug = "test-workspace-smtp";

  it("returns default SMTP configuration for unconfigured workspace", async () => {
    const config = await getSmtpConfig("non-existent-workspace-xyz");
    expect(config).toBeDefined();
    expect(config.host).toBe(DEFAULT_SMTP_CONFIG.host);
    expect(config.port).toBe(DEFAULT_SMTP_CONFIG.port);
    expect(config.isEnabled).toBe(false);
    expect(config.notifyOnIssueAssigned).toBe(true);
  });

  it("persists workspace SMTP credentials and settings correctly", async () => {
    const saved = await saveSmtpConfig(testWorkspaceSlug, {
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      username: "apikey",
      password: "SG.secret_key_12345",
      fromName: "Engineering Team",
      fromEmail: "notifications@space.dev",
      replyTo: "no-reply@space.dev",
      isEnabled: true,
      notifyOnIssueAssigned: true,
      notifyOnIssueStatusChanged: true,
      notifyOnIssueComment: false,
    });

    expect(saved.host).toBe("smtp.sendgrid.net");
    expect(saved.username).toBe("apikey");
    expect(saved.password).toBe("SG.secret_key_12345");
    expect(saved.isEnabled).toBe(true);

    const reloaded = await getSmtpConfig(testWorkspaceSlug);
    expect(reloaded.host).toBe("smtp.sendgrid.net");
    expect(reloaded.password).toBe("SG.secret_key_12345");
    expect(reloaded.fromName).toBe("Engineering Team");
    expect(reloaded.notifyOnIssueComment).toBe(false);
  });

  it("preserves stored password when an empty password string is passed during update", async () => {
    const original = await getSmtpConfig(testWorkspaceSlug);
    expect(original.password).toBe("SG.secret_key_12345");

    // Update fromName without providing a new password
    const updated = await saveSmtpConfig(testWorkspaceSlug, {
      fromName: "Updated Name",
      password: "",
    });

    expect(updated.fromName).toBe("Updated Name");
    expect(updated.password).toBe("SG.secret_key_12345");

    const reloaded = await getSmtpConfig(testWorkspaceSlug);
    expect(reloaded.password).toBe("SG.secret_key_12345");
  });

  it("builds a high-fidelity HTML email verification template", () => {
    const html = buildTestEmailHtml({
      recipient: "dev@company.com",
      workspaceName: "Acme Corp",
      config: {
        ...DEFAULT_SMTP_CONFIG,
        host: "smtp.resend.com",
        port: 587,
        fromName: "Acme Notifications",
        fromEmail: "bot@acme.com",
      },
    });

    expect(html).toContain("Space Delivery Service");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("smtp.resend.com");
    expect(html).toContain("dev@company.com");
    expect(html).toContain("587");
    expect(html).toContain("SMTP Server Connected Successfully");
  });

  it("executes simulated mock delivery for localhost/test addresses with transcripts", async () => {
    const result = await sendSmtpEmail({
      to: "recipient@example.com",
      subject: "Test Space Email Dispatch",
      html: "<p>Hello from Space</p>",
      config: {
        ...DEFAULT_SMTP_CONFIG,
        host: "localhost",
        port: 25,
        fromEmail: "notifications@space.dev",
      },
    });

    expect(result.success).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.transcript).toBeDefined();
    expect(result.transcript!.length).toBeGreaterThan(0);
    expect(result.transcript).toContain("220 space.local ESMTP ready");
    expect(result.transcript).toContain("250 OK: queued as mock-msg-001");
  });

  it("handles sandbox transport explicitly without opening network sockets", async () => {
    const result = await sendSmtpEmail({
      to: "any-user@domain.com",
      subject: "Sandbox Test",
      html: "<p>Offline testing</p>",
      config: {
        ...DEFAULT_SMTP_CONFIG,
        transport: "sandbox",
        host: "smtp.production-domain.com",
        port: 587,
        fromEmail: "notifications@space.dev",
      },
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Mock email logged to local outbox");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractMentionedUserIds,
  sendWorkspaceInviteEmail,
  dispatchEventNotification,
  EventNotificationPayload,
} from "../lib/event-notifications";
import { prisma } from "../lib/prisma";
import * as smtpModule from "../lib/smtp";

describe("Event-Driven Email Notification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractMentionedUserIds", () => {
    it("extracts mentioned users from text matching project members", async () => {
      vi.spyOn(prisma.projectMember, "findMany").mockResolvedValue([
        {
          id: "pm-1",
          projectId: "proj-1",
          userId: "user-1",
          role: "MEMBER",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: "user-1",
            name: "Alice Smith",
            email: "alice@example.com",
          },
        },
        {
          id: "pm-2",
          projectId: "proj-1",
          userId: "user-2",
          role: "MEMBER",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: "user-2",
            name: "Bob Jones",
            email: "bob@example.com",
          },
        },
      ] as any);

      // Test mention by email username or name
      const text = "Hey @alice can you review this? Also pinging @bob@example.com for input.";
      const mentions = await extractMentionedUserIds(text, "proj-1");

      expect(mentions).toContain("user-1");
      expect(mentions).toContain("user-2");
      expect(mentions.length).toBe(2);
    });

    it("returns empty array when text has no @ mentions", async () => {
      const mentions = await extractMentionedUserIds("Plain text without mentions", "proj-1");
      expect(mentions).toEqual([]);
    });

    it("deduplicates mentions if user is mentioned multiple times", async () => {
      vi.spyOn(prisma.projectMember, "findMany").mockResolvedValue([
        {
          id: "pm-1",
          projectId: "proj-1",
          userId: "user-1",
          role: "MEMBER",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: "user-1",
            name: "Alice Smith",
            email: "alice@example.com",
          },
        },
      ] as any);

      const text = "@alice hey @alice please look at this!";
      const mentions = await extractMentionedUserIds(text, "proj-1");
      expect(mentions).toEqual(["user-1"]);
    });
  });

  describe("Self-Action Suppression & Deduplication", () => {
    it("never delivers email or notification to the actor who performed the action", async () => {
      const actorId = "user-actor";
      const assigneeId = "user-actor"; // Actor is also the assignee

      vi.spyOn(prisma.issue, "findUnique").mockResolvedValue({
        id: "issue-1",
        sequenceId: 101,
        title: "Database index regression",
        description: "Need optimization",
        createdById: actorId,
        createdBy: {
          id: actorId,
          name: "Dev Actor",
          email: "actor@example.com",
        },
        project: {
          id: "proj-1",
          name: "Core App",
          identifier: "APP",
          members: [],
        },
        assignees: [
          {
            user: {
              id: assigneeId,
              name: "Dev Actor",
              email: "actor@example.com",
            },
          },
        ],
      } as any);

      const sendSmtpSpy = vi.spyOn(smtpModule, "sendSmtpEmail").mockResolvedValue({
        success: true,
        latencyMs: 10,
        message: "Sent",
      });

      const notificationSpy = vi.spyOn(prisma.notification, "createMany").mockResolvedValue({
        count: 0,
      });

      await dispatchEventNotification({
        type: "ISSUE_STATUS_CHANGED",
        workspaceSlug: "acme",
        projectId: "proj-1",
        projectIdentifier: "APP",
        projectName: "Core App",
        issueId: "issue-1",
        sequenceId: 101,
        issueTitle: "Database index regression",
        actor: {
          id: actorId,
          name: "Dev Actor",
          email: "actor@example.com",
        },
        details: {
          oldState: "In Progress",
          newState: "Done",
        },
      });

      // Since all recipients were the actor, self-suppression should trigger: 0 notifications dispatched
      expect(sendSmtpSpy).not.toHaveBeenCalled();
      expect(notificationSpy).not.toHaveBeenCalled();
    });

    it("deduplicates recipients when a user is both assignee and reporter", async () => {
      const actorId = "user-actor";
      const teammateId = "user-teammate";

      vi.spyOn(prisma.issue, "findUnique").mockResolvedValue({
        id: "issue-2",
        sequenceId: 102,
        title: "Frontend theme bug",
        createdById: teammateId, // Teammate is reporter
        createdBy: {
          id: teammateId,
          name: "Teammate",
          email: "teammate@example.com",
        },
        project: {
          id: "proj-1",
          name: "Core App",
          identifier: "APP",
          members: [],
        },
        assignees: [
          {
            user: {
              id: teammateId, // Teammate is ALSO assignee
              name: "Teammate",
              email: "teammate@example.com",
            },
          },
        ],
      } as any);

      const sendSmtpSpy = vi.spyOn(smtpModule, "sendSmtpEmail").mockResolvedValue({
        success: true,
        latencyMs: 10,
        message: "Sent",
      });

      vi.spyOn(prisma.notification, "createMany").mockResolvedValue({ count: 1 });

      await dispatchEventNotification({
        type: "ISSUE_STATUS_CHANGED",
        workspaceSlug: "acme",
        projectId: "proj-1",
        projectIdentifier: "APP",
        projectName: "Core App",
        issueId: "issue-2",
        sequenceId: 102,
        issueTitle: "Frontend theme bug",
        actor: {
          id: actorId,
          name: "Dev Actor",
          email: "actor@example.com",
        },
        details: {
          oldState: "Todo",
          newState: "In Progress",
        },
      });

      // Teammate is both assignee and reporter, should only receive 1 email call
      expect(sendSmtpSpy).toHaveBeenCalledTimes(1);
      expect(sendSmtpSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "teammate@example.com",
          subject: expect.stringContaining("[APP-102] Status changed to In Progress"),
        })
      );
    });
  });

  describe("Event Preference Filtering", () => {
    it("respects notifyOnIssueComment when set to false", async () => {
      const actorId = "user-actor";
      const recipientId = "user-recipient";

      vi.spyOn(prisma.issue, "findUnique").mockResolvedValue({
        id: "issue-3",
        sequenceId: 103,
        title: "Comment test",
        createdById: recipientId,
        createdBy: {
          id: recipientId,
          name: "Recipient",
          email: "recipient@example.com",
        },
        project: {
          id: "proj-1",
          name: "Core App",
          identifier: "APP",
          members: [],
        },
        assignees: [],
      } as any);

      vi.spyOn(smtpModule, "getSmtpConfig").mockResolvedValue({
        ...smtpModule.DEFAULT_SMTP_CONFIG,
        isEnabled: true,
        notifyOnIssueComment: false, // Disabled!
      });

      const sendSmtpSpy = vi.spyOn(smtpModule, "sendSmtpEmail").mockResolvedValue({
        success: true,
        latencyMs: 10,
        message: "Sent",
      });

      vi.spyOn(prisma.notification, "createMany").mockResolvedValue({ count: 1 });

      await dispatchEventNotification({
        type: "ISSUE_COMMENT_ADDED",
        workspaceSlug: "acme",
        projectId: "proj-1",
        projectIdentifier: "APP",
        projectName: "Core App",
        issueId: "issue-3",
        sequenceId: 103,
        issueTitle: "Comment test",
        actor: {
          id: actorId,
          name: "Actor",
          email: "actor@example.com",
        },
        details: {
          commentContent: "Here is my feedback",
        },
      });

      // SMTP should be skipped because notifyOnIssueComment is false
      expect(sendSmtpSpy).not.toHaveBeenCalled();
    });
  });

  describe("sendWorkspaceInviteEmail", () => {
    it("renders branded invitation email and dispatches to SMTP engine", async () => {
      const sendSmtpSpy = vi.spyOn(smtpModule, "sendSmtpEmail").mockResolvedValue({
        success: true,
        latencyMs: 10,
        message: "Mock email logged to local outbox",
      });

      await sendWorkspaceInviteEmail({
        workspaceName: "Stark Industries",
        workspaceSlug: "stark",
        inviterName: "Tony Stark",
        inviteeEmail: "peter.parker@example.com",
        role: "MEMBER",
        inviteUrl: "https://space.dev/join?token=abc123xyz",
      });

      expect(sendSmtpSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "peter.parker@example.com",
          subject: "[Space] Tony Stark invited you to join Stark Industries",
          html: expect.stringContaining("Tony Stark"),
        })
      );
    });
  });
});

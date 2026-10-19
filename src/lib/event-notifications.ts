import { prisma } from "@/lib/prisma";
import { getSmtpConfig, sendSmtpEmail, SmtpConfig } from "@/lib/smtp";
import { IssuePriority, StateGroup } from "@prisma/client";

export type EventNotificationType =
  | "ISSUE_CREATED"
  | "ISSUE_ASSIGNED"
  | "ISSUE_COMMENT_ADDED"
  | "ISSUE_STATUS_CHANGED"
  | "ISSUE_PRIORITY_CHANGED"
  | "ISSUE_DUE_DATE_CHANGED"
  | "USER_MENTIONED"
  | "ISSUE_DELETED";

export interface EventNotificationPayload {
  type: EventNotificationType;
  workspaceSlug: string;
  projectId: string;
  projectIdentifier: string;
  projectName: string;
  issueId: string;
  sequenceId: number;
  issueTitle: string;
  issueDescription?: string | null;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  // Specific event context
  details?: {
    oldState?: string;
    newState?: string;
    oldPriority?: string;
    newPriority?: string;
    dueDate?: string | null;
    commentContent?: string;
    assignedUserIds?: string[];
    mentionedUserIds?: string[];
  };
}

/**
 * Extracts potential user mentions (@email or @name) from text
 */
export async function extractMentionedUserIds(
  text: string,
  projectId: string
): Promise<string[]> {
  if (!text || !text.includes("@")) return [];

  // Match words starting with @
  const matches = text.match(/@([a-zA-Z0-9._-]+)/g);
  if (!matches || matches.length === 0) return [];

  const tokens = matches.map((m) => m.slice(1).toLowerCase());

  // Search project members matching any of these tokens by email or name
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const matchedUserIds: string[] = [];
  for (const member of members) {
    const userEmail = member.user.email.toLowerCase();
    const userName = member.user.name.toLowerCase().replace(/\s+/g, "");
    for (const token of tokens) {
      if (
        userEmail.includes(token) ||
        userName.includes(token) ||
        token.includes(userName)
      ) {
        if (!matchedUserIds.includes(member.user.id)) {
          matchedUserIds.push(member.user.id);
        }
      }
    }
  }

  return matchedUserIds;
}

/**
 * Modern HTML email generator matching Space design aesthetics
 */
function renderEventEmailHtml({
  workspaceSlug,
  projectIdentifier,
  sequenceId,
  issueTitle,
  actorName,
  eventHeadline,
  eventDescription,
  issueUrl,
  metadataBadge,
  contentSnippet,
}: {
  workspaceSlug: string;
  projectIdentifier: string;
  sequenceId: number;
  issueTitle: string;
  actorName: string;
  eventHeadline: string;
  eventDescription: string;
  issueUrl: string;
  metadataBadge?: { label: string; value: string; color?: string };
  contentSnippet?: string;
}): string {
  const issueKey = `${projectIdentifier}-${sequenceId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventHeadline}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 32px auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 24px 32px 18px 32px;
      border-bottom: 1px solid #f1f3f5;
      background-color: #ffffff;
    }
    .logo-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-pill {
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      color: #3e63dd;
      letter-spacing: -0.3px;
    }
    .content {
      padding: 28px 32px 32px 32px;
    }
    .headline {
      font-size: 18px;
      font-weight: 700;
      line-height: 1.35;
      color: #111827;
      margin-bottom: 6px;
    }
    .actor-sub {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    .card {
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 18px 0;
    }
    .key-badge {
      display: inline-block;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #3e63dd;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      padding: 2px 8px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .issue-title {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    .badge-row {
      margin-top: 8px;
      display: flex;
      gap: 8px;
      font-size: 11px;
    }
    .status-badge {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      padding: 2px 8px;
      border-radius: 6px;
      color: #374151;
      font-weight: 500;
    }
    .snippet-box {
      border-left: 3px solid #3e63dd;
      background: #ffffff;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .cta-container {
      margin-top: 28px;
      text-align: left;
    }
    .cta-button {
      display: inline-block;
      background: #3e63dd;
      color: #ffffff !important;
      text-decoration: none;
      padding: 11px 22px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .footer {
      padding: 20px 32px;
      background: #f8f9fa;
      border-top: 1px solid #f1f3f5;
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-pill">Space · Project Management</div>
    </div>
    
    <div class="content">
      <div class="headline">${eventHeadline}</div>
      <div class="actor-sub">${actorName} · ${eventDescription}</div>
      
      <div class="card">
        <span class="key-badge">${issueKey}</span>
        <div class="issue-title">${issueTitle}</div>
        
        ${
          metadataBadge
            ? `
          <div class="badge-row">
            <span class="status-badge" style="${metadataBadge.color ? `border-color: ${metadataBadge.color}; color: ${metadataBadge.color};` : ''}">
              ${metadataBadge.label}: <strong>${metadataBadge.value}</strong>
            </span>
          </div>`
            : ""
        }
      </div>

      ${
        contentSnippet
          ? `<div class="snippet-box">${contentSnippet}</div>`
          : ""
      }

      <div class="cta-container">
        <a href="${issueUrl}" class="cta-button">View Issue in Space &rarr;</a>
      </div>
    </div>

    <div class="footer">
      You are receiving this email because you are assigned to, reported, or watching ${issueKey} in the <strong>${workspaceSlug}</strong> workspace.<br>
      To manage your notification preferences, visit your workspace settings in Space.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatch Space event notifications across email and in-app feeds
 */
export async function dispatchEventNotification(
  payload: EventNotificationPayload
): Promise<void> {
  try {
    const {
      type,
      workspaceSlug,
      projectId,
      projectIdentifier,
      sequenceId,
      issueTitle,
      actor,
      details,
    } = payload;

    const issueKey = `${projectIdentifier}-${sequenceId}`;
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";
    const issueUrl = `${baseUrl}/${workspaceSlug}/${projectIdentifier}/issues`;

    // 1. Fetch issue details to gather assignees, reporter, and project members
    const issue = await prisma.issue.findUnique({
      where: { id: payload.issueId },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        watchers: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        project: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!issue) return;

    // 2. Resolve recipients based on event type
    const recipientMap = new Map<string, { id: string; name: string; email: string }>();

    const addRecipient = (u?: { id: string; name: string; email: string } | null) => {
      // Space Core Rule: Never notify the actor who triggered the action
      if (u && u.id !== actor.id && u.email) {
        recipientMap.set(u.id, u);
      }
    };

    switch (type) {
      case "ISSUE_CREATED": {
        // Notify all assigned users
        issue.assignees.forEach((a) => addRecipient(a.user));
        break;
      }

      case "ISSUE_ASSIGNED": {
        // If specific assignees were passed, notify them
        if (details?.assignedUserIds && details.assignedUserIds.length > 0) {
          for (const userId of details.assignedUserIds) {
            const member = issue.project.members.find((m) => m.userId === userId);
            if (member) addRecipient(member.user);
          }
        } else {
          issue.assignees.forEach((a) => addRecipient(a.user));
        }
        break;
      }

      case "ISSUE_COMMENT_ADDED": {
        // Notify assignees + reporter + watchers + any mentioned users
        issue.assignees.forEach((a) => addRecipient(a.user));
        addRecipient(issue.createdBy);
        issue.watchers?.forEach((w) => addRecipient(w.user));

        if (details?.mentionedUserIds && details.mentionedUserIds.length > 0) {
          for (const mId of details.mentionedUserIds) {
            const member = issue.project.members.find((m) => m.userId === mId);
            if (member) addRecipient(member.user);
          }
        }
        break;
      }

      case "ISSUE_STATUS_CHANGED":
      case "ISSUE_PRIORITY_CHANGED":
      case "ISSUE_DUE_DATE_CHANGED":
      case "ISSUE_DELETED": {
        // Notify assignees + reporter + watchers
        issue.assignees.forEach((a) => addRecipient(a.user));
        addRecipient(issue.createdBy);
        issue.watchers?.forEach((w) => addRecipient(w.user));
        break;
      }

      case "USER_MENTIONED": {
        if (details?.mentionedUserIds && details.mentionedUserIds.length > 0) {
          for (const mId of details.mentionedUserIds) {
            const member = issue.project.members.find((m) => m.userId === mId);
            if (member) addRecipient(member.user);
          }
        }
        break;
      }
    }

    const recipients = Array.from(recipientMap.values());
    if (recipients.length === 0) return;

    // 3. Craft event headline, subject line, and content
    let emailSubject = "";
    let eventHeadline = "";
    let eventDescription = "";
    let metadataBadge: { label: string; value: string; color?: string } | undefined;
    let contentSnippet: string | undefined;

    switch (type) {
      case "ISSUE_CREATED":
        emailSubject = `[${issueKey}] Issue created: ${issueTitle}`;
        eventHeadline = `New issue created`;
        eventDescription = `created a new issue in ${issue.project.name}`;
        contentSnippet = payload.issueDescription || undefined;
        break;

      case "ISSUE_ASSIGNED":
        emailSubject = `[${issueKey}] You were assigned to: ${issueTitle}`;
        eventHeadline = `You have been assigned to ${issueKey}`;
        eventDescription = `assigned you to this issue`;
        break;

      case "ISSUE_COMMENT_ADDED":
        emailSubject = `[${issueKey}] New comment on: ${issueTitle}`;
        eventHeadline = `New comment on ${issueKey}`;
        eventDescription = `left a comment on ${issueKey}`;
        contentSnippet = details?.commentContent || undefined;
        break;

      case "ISSUE_STATUS_CHANGED":
        emailSubject = `[${issueKey}] Status changed to ${details?.newState || "Updated"}`;
        eventHeadline = `Status changed to ${details?.newState}`;
        eventDescription = `updated the status from ${details?.oldState || "Previous"} to ${details?.newState}`;
        metadataBadge = {
          label: "Status",
          value: details?.newState || "Updated",
          color: "#3e63dd",
        };
        break;

      case "ISSUE_PRIORITY_CHANGED":
        emailSubject = `[${issueKey}] Priority changed to ${details?.newPriority}`;
        eventHeadline = `Priority changed to ${details?.newPriority}`;
        eventDescription = `updated the priority to ${details?.newPriority}`;
        metadataBadge = {
          label: "Priority",
          value: details?.newPriority || "Updated",
          color: "#e11d48",
        };
        break;

      case "ISSUE_DUE_DATE_CHANGED":
        emailSubject = `[${issueKey}] Due date updated: ${details?.dueDate ? new Date(details.dueDate).toLocaleDateString() : "Cleared"}`;
        eventHeadline = `Due date updated`;
        eventDescription = `updated the target due date`;
        metadataBadge = {
          label: "Due Date",
          value: details?.dueDate
            ? new Date(details.dueDate).toLocaleDateString()
            : "No date set",
        };
        break;

      case "USER_MENTIONED":
        emailSubject = `[${issueKey}] ${actor.name} mentioned you`;
        eventHeadline = `You were mentioned on ${issueKey}`;
        eventDescription = `mentioned you in a comment or description`;
        contentSnippet = details?.commentContent || undefined;
        break;

      case "ISSUE_DELETED":
        emailSubject = `[${issueKey}] Issue deleted: ${issueTitle}`;
        eventHeadline = `${issueKey} was deleted`;
        eventDescription = `deleted ${issueKey}`;
        break;
    }

    // 4. Create in-app notifications in PostgreSQL database
    try {
      await prisma.notification.createMany({
        data: recipients.map((r) => ({
          userId: r.id,
          title: `[${issueKey}] ${eventHeadline}`,
          message: `${actor.name} ${eventDescription}: "${issueTitle}"`,
          link: issueUrl,
          isRead: false,
        })),
      });
    } catch {
      // In-app notification creation error gracefully ignored
    }

    // 5. Fetch Workspace SMTP Configuration
    const smtpConfig = await getSmtpConfig(workspaceSlug);

    // Check event-specific notification preferences if configured
    if (type === "ISSUE_CREATED" && smtpConfig.notifyOnIssueCreated === false) {
      return;
    }
    if (type === "ISSUE_ASSIGNED" && smtpConfig.notifyOnIssueAssigned === false) {
      return;
    }
    if (type === "ISSUE_STATUS_CHANGED" && smtpConfig.notifyOnIssueStatusChanged === false) {
      return;
    }
    if (type === "ISSUE_COMMENT_ADDED" && smtpConfig.notifyOnIssueComment === false) {
      return;
    }
    if (
      (type === "ISSUE_PRIORITY_CHANGED" || type === "ISSUE_DUE_DATE_CHANGED") &&
      smtpConfig.notifyOnPriorityOrDueDate === false
    ) {
      return;
    }

    // Generate responsive HTML
    const html = renderEventEmailHtml({
      workspaceSlug,
      projectIdentifier,
      sequenceId,
      issueTitle,
      actorName: actor.name,
      eventHeadline,
      eventDescription,
      issueUrl,
      metadataBadge,
      contentSnippet,
    });

    // 6. Deliver emails to all recipients in parallel
    await Promise.allSettled(
      recipients.map((recipient) =>
        sendSmtpEmail({
          to: recipient.email,
          subject: emailSubject,
          html,
          config: smtpConfig,
        })
      )
    );
  } catch (err) {
    // Top-level notification dispatcher safeguard: never break user mutation
    console.error("[EventNotificationDispatcher] Error dispatching event:", err);
  }
}

/**
 * Sends a modern branded workspace invitation email
 */
export async function sendWorkspaceInviteEmail({
  workspaceName,
  workspaceSlug,
  inviterName,
  inviteeEmail,
  role,
  inviteUrl,
}: {
  workspaceName: string;
  workspaceSlug: string;
  inviterName: string;
  inviteeEmail: string;
  role: string;
  inviteUrl: string;
}) {
  try {
    const smtpConfig = await getSmtpConfig(workspaceSlug);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join ${workspaceName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 32px auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 24px 32px 18px 32px;
      border-bottom: 1px solid #f1f3f5;
      background-color: #ffffff;
    }
    .brand-pill {
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      color: #3e63dd;
      letter-spacing: -0.3px;
    }
    .content {
      padding: 28px 32px 32px 32px;
    }
    .headline {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.35;
      color: #111827;
      margin-bottom: 12px;
    }
    .description {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .invite-card {
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .action-btn {
      display: inline-block;
      background: #3e63dd;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 8px;
      text-align: center;
    }
    .footer {
      padding: 18px 32px;
      background: #f8f9fa;
      border-top: 1px solid #f1f3f5;
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="brand-pill">SPACE WORKSPACE INVITATION</span>
    </div>
    <div class="content">
      <div class="headline">Join ${workspaceName} on Space</div>
      <p class="description">
        <strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace as a <strong>${role.toLowerCase()}</strong>.
      </p>
      <div class="invite-card">
        <p style="margin: 0; font-size: 14px; color: #374151;">
          Collaborate on projects, manage sprints, track issues, and ship faster together.
        </p>
      </div>
      <div>
        <a href="${inviteUrl}" class="action-btn">Accept Invitation &rarr;</a>
      </div>
      <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
        Or copy and paste this URL into your browser:<br />
        <a href="${inviteUrl}" style="color: #3e63dd; word-break: break-all;">${inviteUrl}</a>
      </p>
    </div>
    <div class="footer">
      This invitation expires in 7 days. If you did not expect this invitation, you can safely ignore this email.
    </div>
  </div>
</body>
</html>`;

    await sendSmtpEmail({
      to: inviteeEmail,
      subject: `[Space] ${inviterName} invited you to join ${workspaceName}`,
      html,
      config: smtpConfig,
    });
  } catch (err) {
    console.error("[sendWorkspaceInviteEmail] Failed to send workspace invite email:", err);
  }
}


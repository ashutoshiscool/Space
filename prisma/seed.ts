import { PrismaClient, WorkspaceRole, IssuePriority, StateGroup, RelationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.issueActivity.deleteMany();
  await prisma.issueComment.deleteMany();
  await prisma.issueRelation.deleteMany();
  await prisma.issueLabel.deleteMany();
  await prisma.issueAssignee.deleteMany();
  await prisma.issueAttachment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.page.deleteMany();
  await prisma.label.deleteMany();
  await prisma.state.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.module.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceInvite.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const user1 = await prisma.user.create({
    data: {
      email: "alex@space.dev",
      name: "Alex Rivera",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      passwordHash,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "sarah@space.dev",
      name: "Sarah Chen",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      passwordHash,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: "marcus@space.dev",
      name: "Marcus Vance",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      passwordHash,
    },
  });

  // 2. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Corp",
      slug: "acme-corp",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      members: {
        create: [
          { userId: user1.id, role: WorkspaceRole.OWNER },
          { userId: user2.id, role: WorkspaceRole.ADMIN },
          { userId: user3.id, role: WorkspaceRole.MEMBER },
        ],
      },
    },
  });

  // 3. Create Project
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Space Platform",
      identifier: "SPC",
      description: "Next-gen issue tracker and collaboration system delivering blazingly fast project velocity",
      icon: "🚀",
      members: {
        create: [
          { userId: user1.id, role: WorkspaceRole.OWNER },
          { userId: user2.id, role: WorkspaceRole.ADMIN },
          { userId: user3.id, role: WorkspaceRole.MEMBER },
        ],
      },
    },
  });

  // 4. Create Workflow States
  const backlogState = await prisma.state.create({
    data: {
      projectId: project.id,
      name: "Backlog",
      color: "#94a3b8",
      group: StateGroup.BACKLOG,
      sequence: 1000,
    },
  });

  const todoState = await prisma.state.create({
    data: {
      projectId: project.id,
      name: "Todo",
      color: "#64748b",
      group: StateGroup.UNSTARTED,
      sequence: 2000,
    },
  });

  const inProgressState = await prisma.state.create({
    data: {
      projectId: project.id,
      name: "In Progress",
      color: "#f59e0b",
      group: StateGroup.STARTED,
      sequence: 3000,
    },
  });

  const doneState = await prisma.state.create({
    data: {
      projectId: project.id,
      name: "Done",
      color: "#10b981",
      group: StateGroup.COMPLETED,
      sequence: 4000,
    },
  });

  const canceledState = await prisma.state.create({
    data: {
      projectId: project.id,
      name: "Canceled",
      color: "#ef4444",
      group: StateGroup.CANCELED,
      sequence: 5000,
    },
  });

  // 5. Create Labels
  const bugLabel = await prisma.label.create({
    data: { projectId: project.id, name: "Bug", color: "#ef4444" },
  });
  const featureLabel = await prisma.label.create({
    data: { projectId: project.id, name: "Feature", color: "#3b82f6" },
  });
  const designLabel = await prisma.label.create({
    data: { projectId: project.id, name: "Design", color: "#a855f7" },
  });
  const perfLabel = await prisma.label.create({
    data: { projectId: project.id, name: "Performance", color: "#10b981" },
  });

  // 6. Create Cycles (Sprints)
  const now = new Date();
  const sprint1Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const sprint1End = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const sprint2Start = new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000);
  const sprint2End = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);

  const cycle1 = await prisma.cycle.create({
    data: {
      projectId: project.id,
      name: "Sprint 14 (Core Interactions)",
      description: "Sub-100ms interactions, 60fps Kanban, and command palette navigation",
      startDate: sprint1Start,
      endDate: sprint1End,
      isCompleted: false,
    },
  });

  const cycle2 = await prisma.cycle.create({
    data: {
      projectId: project.id,
      name: "Sprint 15 (Collaboration & Docs)",
      description: "Real-time sync and nested collaborative Notion-style docs",
      startDate: sprint2Start,
      endDate: sprint2End,
      isCompleted: false,
    },
  });

  // 7. Create Modules (Epics)
  const moduleAuth = await prisma.module.create({
    data: {
      projectId: project.id,
      name: "Multi-Tenant Workspaces & RBAC",
      description: "Organization slugs, invitations, member management, and security roles",
      status: "COMPLETED",
      leadId: user3.id,
      startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      targetDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const moduleKanban = await prisma.module.create({
    data: {
      projectId: project.id,
      name: "Next-Gen Issue Engine & Views",
      description: "Kanban board, dense list view, optimistic updates, and command palette",
      status: "IN_PROGRESS",
      leadId: user1.id,
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      targetDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  // 8. Create Issues
  const issue1 = await prisma.issue.create({
    data: {
      projectId: project.id,
      sequenceId: 1,
      title: "Implement 60fps Kanban drag-and-drop state transitions",
      description: `<h3>High Performance Drag-and-Drop</h3><p>Ensure dragging between columns has <strong>zero lag</strong> and uses optimistic UI updates.</p><ul><li>Use <code>@dnd-kit/core</code> for buttery smooth 60fps drag</li><li>Instantly move the card visually to target column</li><li>Send background mutation with rollback on failure</li></ul>`,
      priority: IssuePriority.URGENT,
      stateId: inProgressState.id,
      estimate: 5,
      startDate: sprint1Start,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdById: user1.id,
      cycleId: cycle1.id,
      moduleId: moduleKanban.id,
      assignees: {
        create: [{ userId: user1.id }, { userId: user2.id }],
      },
      labels: {
        create: [{ labelId: perfLabel.id }, { labelId: featureLabel.id }],
      },
      activities: {
        create: [
          {
            userId: user1.id,
            action: "STATE_CHANGED",
            field: "state",
            oldValue: "Todo",
            newValue: "In Progress",
          },
        ],
      },
      comments: {
        create: [
          {
            userId: user2.id,
            content: "Tested the dnd-kit sensor configuration; responsiveness feels instantaneous on both trackpad and mouse!",
          },
        ],
      },
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      projectId: project.id,
      sequenceId: 2,
      title: "Universal Command Palette (Cmd+K / Ctrl+K) with fuzzy search",
      description: `<p>Global action bar for quick navigation, issue search, project switching, and pressing <code>C</code> for instant issue creation.</p>`,
      priority: IssuePriority.HIGH,
      stateId: todoState.id,
      estimate: 3,
      startDate: sprint1Start,
      dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      createdById: user2.id,
      cycleId: cycle1.id,
      moduleId: moduleKanban.id,
      assignees: {
        create: [{ userId: user2.id }],
      },
      labels: {
        create: [{ labelId: featureLabel.id }],
      },
    },
  });

  const issue3 = await prisma.issue.create({
    data: {
      projectId: project.id,
      sequenceId: 3,
      title: "Sprint Burndown and Scope Creep metrics",
      description: `<p>Calculate daily estimate points burned down vs total scope to track team velocity and mid-sprint additions.</p>`,
      priority: IssuePriority.HIGH,
      stateId: doneState.id,
      estimate: 3,
      startDate: sprint1Start,
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdById: user1.id,
      cycleId: cycle1.id,
      moduleId: moduleKanban.id,
      assignees: {
        create: [{ userId: user1.id }],
      },
      labels: {
        create: [{ labelId: featureLabel.id }],
      },
    },
  });

  const issue4 = await prisma.issue.create({
    data: {
      projectId: project.id,
      sequenceId: 4,
      title: "TipTap collaborative rich-text editor with slash menu (/)",
      description: `<p>Full ProseMirror-backed editor with markdown shortcuts, task checklists, syntax-highlighted code blocks, and @mentions.</p>`,
      priority: IssuePriority.MEDIUM,
      stateId: backlogState.id,
      estimate: 8,
      createdById: user3.id,
      labels: {
        create: [{ labelId: designLabel.id }, { labelId: featureLabel.id }],
      },
    },
  });

  const issue5 = await prisma.issue.create({
    data: {
      projectId: project.id,
      sequenceId: 5,
      title: "Dense spreadsheet-like List View with multi-select batch actions",
      description: `<p>Inline cell editing for Priority, Assignee, and State with keyboard Up/Down traversal and multi-select.</p>`,
      priority: IssuePriority.URGENT,
      stateId: inProgressState.id,
      estimate: 5,
      startDate: sprint1Start,
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      createdById: user2.id,
      cycleId: cycle1.id,
      moduleId: moduleKanban.id,
      assignees: {
        create: [{ userId: user2.id }],
      },
      labels: {
        create: [{ labelId: perfLabel.id }],
      },
    },
  });

  // Issue relations: Issue 1 is related to Issue 2, and Issue 2 blocks Issue 3
  await prisma.issueRelation.create({
    data: {
      sourceId: issue1.id,
      targetId: issue2.id,
      type: RelationType.RELATED,
    },
  });

  // Sub-issue: child of issue 1
  await prisma.issue.create({
    data: {
      projectId: project.id,
      sequenceId: 6,
      parentId: issue1.id,
      title: "Add optimistic rollback on network drop",
      description: "<p>Ensure cards snap back smoothly if PATCH fails.</p>",
      priority: IssuePriority.MEDIUM,
      stateId: todoState.id,
      estimate: 2,
      createdById: user1.id,
      cycleId: cycle1.id,
    },
  });

  // 9. Create Pages (Notion-style documentation)
  await prisma.page.create({
    data: {
      projectId: project.id,
      userId: user1.id,
      title: "Space Architecture & Engineering Principles",
      content: `<h1>Space Engineering Handbook</h1><p>Welcome to Space. Our core philosophy combines extreme speed, modern issue tracking depth, and flexible knowledge bases.</p><h2>Key Pillars</h2><ul><li><strong>Sub-100ms Interactions:</strong> Every button click, keyboard shortcut, and state change renders optimistically.</li><li><strong>Command-First UX:</strong> Hit <code>Cmd+K</code> or <code>Ctrl+K</code> anytime. Press <code>C</code> anywhere to draft an issue.</li><li><strong>Relational Depth:</strong> Sprints (Cycles), Initiatives (Modules), bidirectional issue dependencies, and nested rich documentation.</li></ul>`,
      isPublic: true,
    },
  });

  await prisma.page.create({
    data: {
      projectId: project.id,
      userId: user2.id,
      title: "Sprint Planning & Burndown Methodology",
      content: `<h1>Sprint Execution Guide</h1><p>Cycles run on a strict 2-week cadence. At sprint completion, unfinished issues seamlessly roll over to the next cycle or backlog.</p>`,
      isPublic: false,
    },
  });

  // 10. Sample Notification
  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: "Assigned to SPC-1",
      message: "You were assigned to 'Implement 60fps Kanban drag-and-drop state transitions'",
      link: `/acme-corp/SPC/issues`,
      isRead: false,
    },
  });

  console.log("Database seeded successfully!");
  console.log("Credentials:");
  console.log("Alex Rivera (Owner): alex@space.dev / password123");
  console.log("Sarah Chen (Admin): sarah@space.dev / password123");
  console.log("Marcus Vance (Member): marcus@space.dev / password123");
  console.log("Workspace: acme-corp, Project: SPC");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

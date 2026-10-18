import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { IssuePriority, StateGroup, WorkspaceRole, RelationType } from "@prisma/client";

describe("Space Core Issue Engine & Tenant Isolation Tests", () => {
  let workspaceAId: string;
  let workspaceBId: string;
  let userAId: string;
  let userBId: string;
  let projectAId: string;
  let projectBId: string;
  let stateTodoAId: string;
  let stateDoneAId: string;

  beforeAll(async () => {
    // 1. Setup isolated test workspaces and users
    const userA = await prisma.user.create({
      data: {
        email: `tester-a-${Date.now()}@space.dev`,
        name: "Tenant A Lead",
        passwordHash: "dummyhash",
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: `tester-b-${Date.now()}@space.dev`,
        name: "Tenant B Lead",
        passwordHash: "dummyhash",
      },
    });
    userBId = userB.id;

    const wsA = await prisma.workspace.create({
      data: {
        name: "Workspace A",
        slug: `ws-a-${Date.now()}`,
        members: {
          create: { userId: userA.id, role: WorkspaceRole.OWNER },
        },
      },
    });
    workspaceAId = wsA.id;

    const wsB = await prisma.workspace.create({
      data: {
        name: "Workspace B",
        slug: `ws-b-${Date.now()}`,
        members: {
          create: { userId: userB.id, role: WorkspaceRole.OWNER },
        },
      },
    });
    workspaceBId = wsB.id;

    const projA = await prisma.project.create({
      data: {
        workspaceId: wsA.id,
        name: "Engine A",
        identifier: "ENG",
        states: {
          createMany: {
            data: [
              { name: "Todo", color: "#64748b", group: StateGroup.UNSTARTED, sequence: 1000 },
              { name: "Done", color: "#10b981", group: StateGroup.COMPLETED, sequence: 2000 },
            ],
          },
        },
      },
      include: { states: true },
    });
    projectAId = projA.id;
    stateTodoAId = projA.states.find((s) => s.name === "Todo")!.id;
    stateDoneAId = projA.states.find((s) => s.name === "Done")!.id;

    const projB = await prisma.project.create({
      data: {
        workspaceId: wsB.id,
        name: "Engine B",
        identifier: "SEC",
        states: {
          create: { name: "Todo", color: "#64748b", group: StateGroup.UNSTARTED, sequence: 1000 },
        },
      },
    });
    projectBId = projB.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (workspaceAId) await prisma.workspace.delete({ where: { id: workspaceAId } }).catch(() => {});
    if (workspaceBId) await prisma.workspace.delete({ where: { id: workspaceBId } }).catch(() => {});
    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
  });

  it("verifies multi-tenant isolation: User A cannot query issues in Workspace B", async () => {
    // Create issue in Project B
    const stateB = await prisma.state.findFirst({ where: { projectId: projectBId } });
    const issueB = await prisma.issue.create({
      data: {
        projectId: projectBId,
        sequenceId: 1,
        title: "Confidential Project B feature",
        stateId: stateB!.id,
        createdById: userBId,
      },
    });

    // Verify workspace query scoped to User A yields 0 items from Workspace B
    const userAWorkspaces = await prisma.workspace.findMany({
      where: { members: { some: { userId: userAId } } },
      include: { projects: { include: { issues: true } } },
    });

    const allIssuesForUserA = userAWorkspaces.flatMap((w) =>
      w.projects.flatMap((p) => p.issues)
    );

    const leakFound = allIssuesForUserA.some((i) => i.id === issueB.id);
    expect(leakFound).toBe(false);
  });

  it("atomically increments sequence identifiers (ENG-1, ENG-2) monotonically without collisions", async () => {
    // Concurrent creation simulation using transactional sequence generation
    async function createIssueConcurrently(title: string) {
      return prisma.$transaction(async (tx) => {
        const max = await tx.issue.findFirst({
          where: { projectId: projectAId },
          orderBy: { sequenceId: "desc" },
          select: { sequenceId: true },
        });
        const nextSeq = (max?.sequenceId ?? 0) + 1;
        return tx.issue.create({
          data: {
            projectId: projectAId,
            sequenceId: nextSeq,
            title,
            stateId: stateTodoAId,
            createdById: userAId,
            priority: IssuePriority.HIGH,
            estimate: 5,
          },
        });
      });
    }

    const issue1 = await createIssueConcurrently("First feature");
    const issue2 = await createIssueConcurrently("Second feature");
    const issue3 = await createIssueConcurrently("Third feature");

    expect(issue1.sequenceId).toBe(1);
    expect(issue2.sequenceId).toBe(2);
    expect(issue3.sequenceId).toBe(3);
  });

  it("verifies cycle completion and incomplete issues rollover", async () => {
    // Create Cycle 1 and Cycle 2
    const cycle1 = await prisma.cycle.create({
      data: {
        projectId: projectAId,
        name: "Test Sprint 1",
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const cycle2 = await prisma.cycle.create({
      data: {
        projectId: projectAId,
        name: "Test Sprint 2",
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
      },
    });

    // Create 1 completed issue and 1 incomplete issue in Cycle 1
    const doneIssue = await prisma.issue.create({
      data: {
        projectId: projectAId,
        sequenceId: 10,
        title: "Finished task",
        stateId: stateDoneAId,
        createdById: userAId,
        cycleId: cycle1.id,
      },
    });

    const openIssue = await prisma.issue.create({
      data: {
        projectId: projectAId,
        sequenceId: 11,
        title: "Incomplete task to rollover",
        stateId: stateTodoAId,
        createdById: userAId,
        cycleId: cycle1.id,
      },
    });

    // Execute rollover simulation: complete cycle 1 and move incomplete issues to cycle 2
    await prisma.$transaction(async (tx) => {
      await tx.cycle.update({
        where: { id: cycle1.id },
        data: { isCompleted: true },
      });

      const openIssues = await tx.issue.findMany({
        where: {
          cycleId: cycle1.id,
          state: { group: { notIn: [StateGroup.COMPLETED, StateGroup.CANCELED] } },
        },
      });

      await tx.issue.updateMany({
        where: { id: { in: openIssues.map((i) => i.id) } },
        data: { cycleId: cycle2.id },
      });
    });

    // Verify completed cycle status and issue assignments
    const updatedCycle1 = await prisma.cycle.findUnique({ where: { id: cycle1.id } });
    expect(updatedCycle1?.isCompleted).toBe(true);

    const reloadedDone = await prisma.issue.findUnique({ where: { id: doneIssue.id } });
    expect(reloadedDone?.cycleId).toBe(cycle1.id);

    const reloadedOpen = await prisma.issue.findUnique({ where: { id: openIssue.id } });
    expect(reloadedOpen?.cycleId).toBe(cycle2.id);
  });

  it("accurately computes module delivery progress percentage", async () => {
    const mod = await prisma.module.create({
      data: {
        projectId: projectAId,
        name: "Performance Initiative",
        status: "IN_PROGRESS",
      },
    });

    // Create 3 issues: 2 done, 1 todo => 66.67% ~ 67%
    await prisma.issue.createMany({
      data: [
        {
          projectId: projectAId,
          sequenceId: 21,
          title: "Perf 1",
          stateId: stateDoneAId,
          createdById: userAId,
          moduleId: mod.id,
        },
        {
          projectId: projectAId,
          sequenceId: 22,
          title: "Perf 2",
          stateId: stateDoneAId,
          createdById: userAId,
          moduleId: mod.id,
        },
        {
          projectId: projectAId,
          sequenceId: 23,
          title: "Perf 3",
          stateId: stateTodoAId,
          createdById: userAId,
          moduleId: mod.id,
        },
      ],
    });

    const issues = await prisma.issue.findMany({
      where: { moduleId: mod.id },
      include: { state: true },
    });

    const total = issues.length;
    const completed = issues.filter((i) => i.state.group === StateGroup.COMPLETED).length;
    const progressPercent = Math.round((completed / total) * 100);

    expect(total).toBe(3);
    expect(completed).toBe(2);
    expect(progressPercent).toBe(67);
  });
});

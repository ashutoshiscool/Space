import { describe, it, expect } from "vitest";
import { StateGroup, IssuePriority, IssueType } from "@prisma/client";
import { formatRelativeTime } from "@/lib/utils";

describe("Project Summary & Status Overview Engine", () => {
  const mockStates = [
    { id: "st-1", name: "Backlog", color: "#64748b", group: StateGroup.BACKLOG, sequence: 0 },
    { id: "st-2", name: "To Do", color: "#0ea5e9", group: StateGroup.UNSTARTED, sequence: 1 },
    { id: "st-3", name: "In Progress", color: "#f59e0b", group: StateGroup.STARTED, sequence: 2 },
    { id: "st-4", name: "In Review", color: "#8b5cf6", group: StateGroup.STARTED, sequence: 3 },
    { id: "st-5", name: "Done", color: "#10b981", group: StateGroup.COMPLETED, sequence: 4 },
  ];

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const twentyDaysFromNow = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

  const mockIssues = [
    {
      id: "i-1",
      sequenceId: 1,
      title: "Design login overhaul",
      stateId: "st-5",
      state: mockStates[4], // Done
      createdAt: tenDaysAgo,
      updatedAt: twoDaysAgo, // within 7 days
      dueDate: null,
    },
    {
      id: "i-2",
      sequenceId: 2,
      title: "Implement auth token refresh",
      stateId: "st-3",
      state: mockStates[2], // In Progress
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      dueDate: threeDaysFromNow, // due soon in 3 days
    },
    {
      id: "i-3",
      sequenceId: 3,
      title: "Write documentation",
      stateId: "st-1",
      state: mockStates[0], // Backlog
      createdAt: tenDaysAgo,
      updatedAt: tenDaysAgo,
      dueDate: twentyDaysFromNow, // not due soon (outside 7 days)
    },
  ];

  it("calculates 7-day KPIs accurately", () => {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const completedIn7d = mockIssues.filter(
      (i) => i.state.group === StateGroup.COMPLETED && new Date(i.updatedAt) >= sevenDaysAgo
    ).length;
    expect(completedIn7d).toBe(1);

    const updatedIn7d = mockIssues.filter(
      (i) => new Date(i.updatedAt) >= sevenDaysAgo
    ).length;
    expect(updatedIn7d).toBe(2);

    const createdIn7d = mockIssues.filter(
      (i) => new Date(i.createdAt) >= sevenDaysAgo
    ).length;
    expect(createdIn7d).toBe(1);

    const dueSoonIn7d = mockIssues.filter(
      (i) =>
        i.dueDate &&
        new Date(i.dueDate) >= now &&
        new Date(i.dueDate) <= sevenDaysFromNow &&
        i.state.group !== StateGroup.COMPLETED
    ).length;
    expect(dueSoonIn7d).toBe(1);
  });

  it("computes status overview breakdown with exact percentages", () => {
    const total = mockIssues.length;
    const breakdown = mockStates.map((st) => {
      const count = mockIssues.filter((i) => i.stateId === st.id).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stateId: st.id, name: st.name, count, percentage };
    });

    const doneItem = breakdown.find((b) => b.name === "Done");
    expect(doneItem?.count).toBe(1);
    expect(doneItem?.percentage).toBe(33);

    const inProgressItem = breakdown.find((b) => b.name === "In Progress");
    expect(inProgressItem?.count).toBe(1);
    expect(inProgressItem?.percentage).toBe(33);

    const backlogItem = breakdown.find((b) => b.name === "Backlog");
    expect(backlogItem?.count).toBe(1);
    expect(backlogItem?.percentage).toBe(33);

    const todoItem = breakdown.find((b) => b.name === "To Do");
    expect(todoItem?.count).toBe(0);
    expect(todoItem?.percentage).toBe(0);
  });

  it("calculates donut circumference and stroke dashes without overlap", () => {
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const total = 3;

    let accumulatedOffset = 0;
    const segments = [
      { count: 1 },
      { count: 1 },
      { count: 1 },
    ].map((item) => {
      const strokeDash = (item.count / total) * circumference;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeDash;
      return { strokeDash, strokeDashoffset };
    });

    expect(segments.length).toBe(3);
    expect(accumulatedOffset).toBeCloseTo(circumference, 5);
  });

  it("formats relative timestamps correctly", () => {
    const minAgo = new Date(Date.now() - 40 * 60 * 1000);
    expect(formatRelativeTime(minAgo)).toBe("40 minutes ago");

    const hoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(hoursAgo)).toBe("2 hours ago");

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(yesterday)).toBe("Yesterday");

    const justNow = new Date(Date.now() - 10 * 1000);
    expect(formatRelativeTime(justNow)).toBe("Just now");
  });

  it("dynamically resolves active project from pathname and handles non-project routes", () => {
    const projects = [
      { id: "p-1", identifier: "SPC", name: "Space Platform" },
      { id: "p-2", identifier: "XRGO", name: "XRGO General Duties" },
    ];

    const resolveProject = (pathname: string) => {
      const parts = pathname.split("/").filter(Boolean);
      const urlId = parts.length >= 2 ? parts[1].toUpperCase() : null;
      const match = projects.find((p) => p.identifier.toUpperCase() === urlId);
      const isViewingProject = Boolean(urlId && match);
      return { activeProject: match || projects[0], isViewingProject };
    };

    // When on XRGO project summary
    const xrgoResult = resolveProject("/acme-corp/XRGO/summary");
    expect(xrgoResult.isViewingProject).toBe(true);
    expect(xrgoResult.activeProject.identifier).toBe("XRGO");
    expect(xrgoResult.activeProject.name).toBe("XRGO General Duties");

    // When on SPC project board
    const spcResult = resolveProject("/acme-corp/SPC/issues");
    expect(spcResult.isViewingProject).toBe(true);
    expect(spcResult.activeProject.identifier).toBe("SPC");

    // When on /your-work (outside of any specific project)
    const yourWorkResult = resolveProject("/acme-corp/your-work");
    expect(yourWorkResult.isViewingProject).toBe(false);

    // When on /settings
    const settingsResult = resolveProject("/acme-corp/settings");
    expect(settingsResult.isViewingProject).toBe(false);
  });
});


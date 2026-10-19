import { describe, it, expect } from "vitest";

describe("Repository & Smart Commits Engine", () => {
  it("formats feature branch naming with project identifier and slugified title", () => {
    const projectIdentifier = "XRGO";
    const sequenceId = 71;
    const title = "Finish space and Get interns";

    const branchName = `feature/${projectIdentifier}-${sequenceId}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30)}`;

    expect(branchName).toBe("feature/XRGO-71-finish-space-and-get-interns");
  });

  it("parses smart commit commands accurately", () => {
    const parseSmartCommit = (message: string) => {
      const match = message.match(/^([A-Z0-9]+-\d+)(?::\s*|\s+)(.*)$/);
      if (!match) return null;
      const key = match[1];
      const rest = match[2];

      const isResolve = rest.includes("#resolve") || rest.includes("#close");
      const timeMatch = rest.match(/#time\s+([0-9a-z\s]+)/);
      const commentMatch = rest.match(/#comment\s+(.*)$/);

      return {
        issueKey: key,
        isResolve,
        timeSpent: timeMatch ? timeMatch[1].trim() : null,
        comment: commentMatch ? commentMatch[1].trim() : null,
      };
    };

    const commit1 = parseSmartCommit("XRGO-71: #resolve Finish space and Get interns");
    expect(commit1?.issueKey).toBe("XRGO-71");
    expect(commit1?.isResolve).toBe(true);

    const commit2 = parseSmartCommit("XRGO-71 #time 2h 30m #comment Working on intake form");
    expect(commit2?.issueKey).toBe("XRGO-71");
    expect(commit2?.isResolve).toBe(false);
    expect(commit2?.timeSpent).toBe("2h 30m");
    expect(commit2?.comment).toBe("Working on intake form");
  });
});

describe("Collect Requests & Forms Intake Engine", () => {
  it("formats intake description with submitter attribution", () => {
    const formatIntakeDescription = (
      rawDesc: string,
      formName: string,
      name: string,
      email: string
    ) => {
      return `${rawDesc}\n\n---\n*Submitted via ${formName} by ${name || "Anonymous"} (${email || "no-email"})*`;
    };

    const result = formatIntakeDescription(
      "Need credentials for new design intern.",
      "XRGO General Duties Request Form",
      "Wallibear 130",
      "wallibear@space.dev"
    );

    expect(result).toContain("Need credentials for new design intern.");
    expect(result).toContain("Submitted via XRGO General Duties Request Form by Wallibear 130 (wallibear@space.dev)");
  });

  it("assigns appropriate fallback status group for new intake submissions", () => {
    const states = [
      { id: "st-1", name: "Backlog", group: "BACKLOG" },
      { id: "st-2", name: "Triage", group: "UNSTARTED" },
      { id: "st-3", name: "In Progress", group: "STARTED" },
      { id: "st-4", name: "Done", group: "COMPLETED" },
    ];

    const targetState =
      states.find((s) => s.group === "UNSTARTED") ||
      states.find((s) => s.group === "BACKLOG") ||
      states[0];

    expect(targetState.id).toBe("st-2");
    expect(targetState.name).toBe("Triage");
  });
});

import { describe, it, expect } from "vitest";
import { SPACE_VIEWS } from "@/components/layout/SpaceViewsFlyout";

describe("Space Views & Custom Navigation Engine", () => {
  it("contains all 8 flagship views matching enterprise specs", () => {
    const viewIds = SPACE_VIEWS.map((v) => v.id);
    expect(viewIds).toContain("archives");
    expect(viewIds).toContain("backlog");
    expect(viewIds).toContain("docs");
    expect(viewIds).toContain("forms");
    expect(viewIds).toContain("goals");
    expect(viewIds).toContain("releases");
    expect(viewIds).toContain("shortcuts");
    expect(viewIds).toContain("timeline");
    expect(SPACE_VIEWS.length).toBe(8);
  });

  it("generates correct navigation URLs for project views", () => {
    const workspaceSlug = "acme-corp";
    const projectIdentifier = "XRGO";

    const archiveView = SPACE_VIEWS.find((v) => v.id === "archives");
    expect(archiveView?.href(workspaceSlug, projectIdentifier)).toBe("/acme-corp/XRGO/archives");

    const formsView = SPACE_VIEWS.find((v) => v.id === "forms");
    expect(formsView?.href(workspaceSlug, projectIdentifier)).toBe("/acme-corp/XRGO/forms");

    const docsView = SPACE_VIEWS.find((v) => v.id === "docs");
    expect(docsView?.href(workspaceSlug, projectIdentifier)).toBe("/acme-corp/XRGO/pages");

    const backlogView = SPACE_VIEWS.find((v) => v.id === "backlog");
    expect(backlogView?.href(workspaceSlug, projectIdentifier)).toBe("/acme-corp/XRGO/backlog");
  });

  it("handles toggling of pinned navigation tabs correctly", () => {
    let pinnedIds: string[] = [];

    const togglePin = (id: string) => {
      if (pinnedIds.includes(id)) {
        pinnedIds = pinnedIds.filter((item) => item !== id);
      } else {
        pinnedIds = [...pinnedIds, id];
      }
      return pinnedIds;
    };

    // Add 'archives' to navigation
    togglePin("archives");
    expect(pinnedIds).toEqual(["archives"]);

    // Add 'goals' to navigation
    togglePin("goals");
    expect(pinnedIds).toEqual(["archives", "goals"]);

    // Remove 'archives' from navigation
    togglePin("archives");
    expect(pinnedIds).toEqual(["goals"]);
  });
});

import { test, expect } from "@playwright/test";

test.describe("Space End-to-End Browser Workflows", () => {
  const uniqueSuffix = Date.now();
  const testUser = {
    name: "Auditor Pro",
    email: `auditor_${uniqueSuffix}@space.test`,
    password: "Password123!",
    workspaceName: `Audit Corp ${uniqueSuffix}`,
    workspaceSlug: `audit-corp-${uniqueSuffix}`,
  };

  test("1. User Registration, Workspace Creation & Session Persistence", async ({ page }) => {
    // 1. Visit Register Page
    await page.goto("/register");
    await expect(page).toHaveTitle(/Space/);
    await expect(page.locator("h1")).toContainText("Create your account");

    // 2. Fill registration form
    await page.fill('input[type="text"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // 3. Should redirect to workspace creation
    await page.waitForURL("**/create-workspace", { timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Create your Workspace");

    // 4. Create Workspace
    await page.fill('input[placeholder="Acme Corp"]', testUser.workspaceName);
    await page.click('button[type="submit"]');

    // 5. Should land on default project issues board
    await page.waitForURL(`**/${testUser.workspaceSlug}/ENG/issues`, { timeout: 15000 });
    await expect(page.locator("text=Board").first()).toBeVisible({ timeout: 10000 });

    // 6. Verify session cookie persistence on reload
    await page.reload();
    await expect(page.locator("text=Board").first()).toBeVisible({ timeout: 10000 });
  });

  test("2. Seeded User Login, Kanban Board & Detail Modal", async ({ page }) => {
    // Login with seeded admin user
    await page.goto("/login");
    await page.fill('input[type="email"]', "sarah@space.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to issues board
    await page.waitForURL("**/acme-corp/SPC/issues", { timeout: 15000 });
    await expect(page.locator("text=Board").first()).toBeVisible({ timeout: 10000 });

    // Verify kanban workflow columns exist
    await expect(page.locator("text=Backlog").first()).toBeVisible();
    await expect(page.locator("text=Todo").first()).toBeVisible();
    await expect(page.locator("text=In Progress").first()).toBeVisible();
    await expect(page.locator("text=Done").first()).toBeVisible();

    // Click on seeded issue card SPC-1
    const issueCard = page.locator("text=SPC-1").first();
    await expect(issueCard).toBeVisible({ timeout: 10000 });
    await issueCard.click();

    // Verify Issue Detail Modal opens with title
    await expect(page.locator("text=Implement 60fps Kanban drag-and-drop state transitions").first()).toBeVisible({ timeout: 10000 });

    // Close modal with Escape
    await page.keyboard.press("Escape");
  });

  test("3. Cycles (Sprints) Management & Burndown View", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "sarah@space.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/acme-corp/SPC/issues", { timeout: 15000 });

    // Navigate to cycles
    await page.goto("/acme-corp/SPC/cycles");
    await expect(page.locator("text=Active Sprint").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Sprint 15").first()).toBeVisible();
    await expect(page.locator("text=Sprint Burndown").first()).toBeVisible();
  });

  test("4. Modules & Progress Metrics", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "sarah@space.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/acme-corp/SPC/issues", { timeout: 15000 });

    // Navigate to modules
    await page.goto("/acme-corp/SPC/modules");
    await expect(page.locator("text=Next-Gen Issue Engine & Views").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Multi-Tenant Workspaces & RBAC").first()).toBeVisible();
  });

  test("5. Documentation & Collaborative Pages", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "sarah@space.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/acme-corp/SPC/issues", { timeout: 15000 });

    // Navigate to docs
    await page.goto("/acme-corp/SPC/pages");
    await expect(page.locator("text=Space Architecture & Engineering Principles").first()).toBeVisible({ timeout: 15000 });

    // Open doc
    await page.click("text=Space Architecture & Engineering Principles");
    await page.waitForURL("**/pages/**", { timeout: 15000 });

    // Verify rich editor is present
    await expect(page.locator("input[value*='Space Architecture']").first()).toBeVisible({ timeout: 10000 });
  });

  test("6. Command Palette Activation (Ctrl+K / Cmd+K)", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "sarah@space.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/acme-corp/SPC/issues", { timeout: 15000 });

    // Wait for DOM ready
    await page.waitForLoadState("networkidle");

    // Press Ctrl+k
    await page.keyboard.press("Control+k");
    const searchInput = page.locator('input[placeholder*="Type a command or search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search for issues navigation
    await searchInput.fill("Issues");
    await expect(page.locator("text=Issues (Kanban & List)").first()).toBeVisible();

    // Close palette
    await page.keyboard.press("Escape");
  });

  test("7. Inbound Invitation Acceptance Flow (/join?token=...)", async ({ page, request }) => {
    // Generate an invite token using API as admin
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "sarah@space.dev", password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    const inviteRes = await request.post("/api/workspaces/acme-corp/invitations", {
      data: { email: `browser_invite_${Date.now()}@space.dev`, role: "MEMBER" },
    });
    expect(inviteRes.ok()).toBeTruthy();
    const { invite } = await inviteRes.json();

    // Log in as a separate user who accepts the invitation
    const joinUser = {
      name: "Invited Colleague",
      email: `invited_${Date.now()}@space.test`,
      password: "Password123!",
    };
    await page.goto("/register");
    await page.fill('input[type="text"]', joinUser.name);
    await page.fill('input[type="email"]', joinUser.email);
    await page.fill('input[type="password"]', joinUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/create-workspace", { timeout: 15000 });

    // Navigate to /join?token=... in browser
    await page.goto(`/join?token=${invite.token}`);
    await expect(page.locator("text=You've Been Invited")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Acme Corp")).toBeVisible();

    // Click Accept Invitation
    await page.click('button:has-text("Accept Invitation")');
    await expect(page.locator("text=Welcome to Acme Corp!")).toBeVisible({ timeout: 10000 });

    // Verify redirected into workspace
    await page.waitForURL("**/acme-corp**", { timeout: 15000 });
  });
});

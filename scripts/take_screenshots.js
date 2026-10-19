const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function run() {
  const screenshotDir = path.join(__dirname, "..", "screenshots");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log("Launching Chromium browser via Playwright...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log("1. Logging in...");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "alex@space.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  console.log("2. Navigating to XRGO Stats (Analytics & Cycle Time)...");
  await page.goto("http://localhost:3000/acme-corp/XRGO/analytics", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, "5_stats_cycle_time.png"), fullPage: false });
  console.log("✓ Saved 5_stats_cycle_time.png");

  console.log("3. Testing + button and Views flyout on Stats page (Exact reference recreation)...");
  const plusButton = page.locator("#more-views-plus-button");
  await plusButton.waitFor({ state: "visible", timeout: 5000 });
  await plusButton.click();
  await page.waitForTimeout(800);

  // Take screenshot with flyout open over Stats page (matching media_1792381908521.png)
  await page.screenshot({ path: path.join(screenshotDir, "2_views_flyout_open.png"), fullPage: false });
  console.log("✓ Saved 2_views_flyout_open.png (Exact reference match)");

  // Hover over Backlog view
  const backlogButton = page.locator('button:has-text("Backlog")');
  if (await backlogButton.isVisible()) {
    await backlogButton.hover();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, "3_views_flyout_backlog_hover.png"), fullPage: false });
    console.log("✓ Saved 3_views_flyout_backlog_hover.png");
  }

  // Click 'Add to navigation' for Backlog
  const addBtn = page.locator('button:has-text("Add to navigation")');
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotDir, "4_pinned_nav_tab.png"), fullPage: false });
    console.log("✓ Saved 4_pinned_nav_tab.png");
  }

  // Close flyout by clicking outside or pressing Escape
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  console.log("4. Navigating to XRGO Summary...");
  await page.goto("http://localhost:3000/acme-corp/XRGO/summary", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, "1_summary_dashboard.png"), fullPage: false });
  console.log("✓ Saved 1_summary_dashboard.png");

  console.log("5. Navigating to XRGO Repository...");
  await page.goto("http://localhost:3000/acme-corp/XRGO/repository", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, "6_repository_code_sync.png"), fullPage: false });
  console.log("✓ Saved 6_repository_code_sync.png");

  console.log("6. Navigating to Collect Requests (Forms)...");
  await page.goto("http://localhost:3000/acme-corp/XRGO/forms", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, "7_collect_requests_forms.png"), fullPage: false });
  console.log("✓ Saved 7_collect_requests_forms.png");

  await browser.close();
  console.log("All Playwright UI checks complete!");
}

run().catch((err) => {
  console.error("Playwright execution error:", err);
  process.exit(1);
});

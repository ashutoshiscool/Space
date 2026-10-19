import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Starting Playwright screenshot capture for Space...");

  const rootAssetsDir = path.join(process.cwd(), "assets", "screenshots");
  const publicAssetsDir = path.join(process.cwd(), "public", "assets", "screenshots");

  fs.mkdirSync(rootAssetsDir, { recursive: true });
  fs.mkdirSync(publicAssetsDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // 2x Retina for crystal-clear presentation
  });

  const page = await context.newPage();

  // Helper to save to both root and public assets
  const saveScreenshot = async (filename: string) => {
    const rootPath = path.join(rootAssetsDir, filename);
    const publicPath = path.join(publicAssetsDir, filename);
    await page.screenshot({ path: rootPath, fullPage: false });
    fs.copyFileSync(rootPath, publicPath);
    console.log(`✓ Saved: ${filename}`);
  };

  // 1. Log in
  console.log("Navigating to login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "sarah@space.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  // Wait for redirect to default project issues view
  await page.waitForURL("**/acme-corp/SPC/issues", { timeout: 15000 });
  await page.waitForTimeout(2500); // Allow animations & query data to settle

  // 1. Kanban Board
  console.log("Capturing 01-kanban-board.png...");
  await saveScreenshot("01-kanban-board.png");

  // 2. Job Board / Assignee Swimlanes
  console.log("Capturing 02-assignee-swimlanes.png...");
  const jobBoardBtn = page.locator("button:has-text('Job Board')").first();
  if (await jobBoardBtn.isVisible()) {
    await jobBoardBtn.click();
    await page.waitForTimeout(1200);
    await saveScreenshot("02-assignee-swimlanes.png");
  }

  // 3. Dense Spreadsheet View
  console.log("Capturing 03-spreadsheet-view.png...");
  const spreadsheetBtn = page.locator("button:has-text('Spreadsheet')").first();
  if (await spreadsheetBtn.isVisible()) {
    await spreadsheetBtn.click();
    await page.waitForTimeout(1200);
    await saveScreenshot("03-spreadsheet-view.png");
  }

  // 4. Interactive Calendar View
  console.log("Capturing 04-calendar-view.png...");
  const calendarBtn = page.locator("button:has-text('Calendar')").first();
  if (await calendarBtn.isVisible()) {
    await calendarBtn.click();
    await page.waitForTimeout(1200);
    await saveScreenshot("04-calendar-view.png");
  }

  // Switch back to Board
  const boardBtn = page.locator("button:has-text('Board')").first();
  if (await boardBtn.isVisible()) {
    await boardBtn.click();
    await page.waitForTimeout(800);
  }

  // 5. Issue Detail Modal (Click SPC-1)
  console.log("Capturing 05-issue-detail-modal.png...");
  const firstCard = page.locator("text=SPC-1").first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await page.waitForTimeout(1500);
    await saveScreenshot("05-issue-detail-modal.png");
    
    // Close modal by clicking the X button
    const closeBtn = page.locator('[data-testid="close-issue-modal"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }
  }

  // 6. Universal Command Palette
  console.log("Capturing 06-command-palette.png...");
  const searchBtn = page.locator("button:has-text('Search or jump to...')").first();
  if (await searchBtn.isVisible()) {
    await searchBtn.click();
    await page.waitForTimeout(1200);
    await saveScreenshot("06-command-palette.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
  }

  // 7. Cycles / Sprints View
  console.log("Capturing 07-cycles-burndown.png...");
  await page.goto("http://localhost:3000/acme-corp/SPC/cycles", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await saveScreenshot("07-cycles-burndown.png");

  // 8. Analytics & Velocity Dashboard
  console.log("Capturing 08-analytics-dashboard.png...");
  await page.goto("http://localhost:3000/acme-corp/SPC/analytics", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await saveScreenshot("08-analytics-dashboard.png");

  // 9. Workspace Settings & SMTP Configuration
  console.log("Capturing 09-smtp-settings.png...");
  await page.goto("http://localhost:3000/acme-corp/settings", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const smtpTabBtn = page.locator("button:has-text('Email & SMTP')").first();
  if (await smtpTabBtn.isVisible()) {
    await smtpTabBtn.click();
    await page.waitForTimeout(1000);
  }
  await saveScreenshot("09-smtp-settings.png");

  // 10. Project Summary View (KPIs, Status Donut, Activity Feed)
  console.log("Capturing 10-project-summary.png...");
  await page.goto("http://localhost:3000/acme-corp/SPC/summary", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await saveScreenshot("10-project-summary.png");

  // 11. Backlog & Sprint Planning
  console.log("Capturing 11-backlog-sprint-planning.png...");
  await page.goto("http://localhost:3000/acme-corp/SPC/backlog", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await saveScreenshot("11-backlog-sprint-planning.png");

  await browser.close();
  console.log("All 11 screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});

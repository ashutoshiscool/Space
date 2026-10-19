<div align="center">

# 🚀 Space

### High-Velocity Issue Tracking, Sprint Planning & Team Knowledge Base

**Fast. Extensible. Beautiful. Self-hostable in under 60 seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat&logo=docker)](https://www.docker.com/)
[![Vitest 100%](https://img.shields.io/badge/Tests-30%20Passed-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)

[Quick Start](#-quick-start) • [Feature Tour](#-visual-tour--features) • [Self-Hosting](#-self-hosting-with-docker) • [Architecture](#-tech-stack--architecture) • [Keyboard Shortcuts](#-keyboard-shortcuts) • [API & Health](#-monitoring--health-checks) • [Contributing](CONTRIBUTING.md)

<br />

<img src="assets/screenshots/01-kanban-board.png" alt="Space 60fps Kanban Board" width="100%" />

</div>

---

## 💡 What is Space?

**Space** is an open-source, developer-first project management and issue-tracking platform built for high-velocity software teams.

Most modern project management tools have evolved into slow, bloated enterprise software filled with sluggish page transitions, confusing multi-tiered menus, and opaque synchronization. Space takes the opposite approach:
- **Sub-100ms Interactions:** Every view transition, state update, and filter responds instantly using optimistic UI mutations powered by TanStack Query.
- **Monolithic Simplicity:** Built as a single, cohesive full-stack application (Next.js 16 App Router + Prisma + PostgreSQL) without microservice overhead or complex deployment topology.
- **Deep Relational Architecture:** First-class support for sub-issues, multi-type issue relationships (`Blocks`, `Blocked By`, `Related To`, `Duplicate Of`), time-boxed sprint cycles with automated burndowns, and collaborative documentation.
- **Integrated Email & Event Engine:** Live SMTP engine with provider presets, handshake diagnostics, self-action suppression, and recipient deduplication.
- **Universal Keyboard Navigation:** Hit `Cmd+K` or `Ctrl+K` anywhere to search or navigate, or tap `C` to draft an issue.

---

## 🌟 Visual Tour & Features

### 1. 60fps Kanban Board & View Switching
Physics-based drag-and-drop state transitions powered by `@dnd-kit/core`. Reorder tasks within columns or transition states across the board with optimistic UI updates and instant rollback if network connectivity drops.

![Space Kanban Board](assets/screenshots/01-kanban-board.png)

- **Workflow States:** Full mapping across canonical state groups (`Backlog`, `Unstarted`, `Started`, `Completed`, `Canceled`).
- **Rich Card Metadata:** Real-time estimate points chips, priority badges, assignee avatars, sub-task rollup counters, and tagged labels.
- **Multi-View Switcher:** Switch between Kanban Board, Assignee Swimlanes, Dense Spreadsheet, and Monthly Calendar in a single click.

---

### 2. Assignee Swimlanes & Workload Analytics
Group board cards horizontally by team member to monitor sprint bandwidth, identify bottlenecks, and balance workload across the team in real time.

![Space Assignee Swimlanes](assets/screenshots/02-assignee-swimlanes.png)

- **Live Capacity Metrics:** Header analytics display total issue count, unassigned backlog items, aggregate estimate story points, and completion percentage.
- **Drag Reassignment:** Drag cards directly between member swimlanes to instantly reassign owners.
- **Unassigned Queue:** Dedicated swimlane for incoming or triaged tasks awaiting allocation.

---

### 3. Dense Spreadsheet / Grid View
A high-density tabular view built for project managers and power users who need to review and edit multiple issues rapidly without opening separate modals.

![Space Dense Spreadsheet View](assets/screenshots/03-spreadsheet-view.png)

- **Inline Cell Editing:** Click any cell to update Title, State, Priority, Assignee, Sprint Cycle, Due Date, or Story Points directly.
- **Fast Inline Row Creation:** Quickly append new tasks at the bottom of the table using the inline input row.
- **Sort & Filter:** Sort issues by priority, sequence key, due date, or assignee.

---

### 4. Interactive Schedule Calendar
A monthly calendar layout plotting issues and deliverables against their due dates for release planning and milestone tracking.

![Space Calendar View](assets/screenshots/04-calendar-view.png)

- **Visual Due Date Badges:** Color-coded priority badges and state indicators for upcoming deadlines.
- **Today Highlight:** Distinct indicator highlighting today's date and pending commitments.
- **Month Navigation:** Seamlessly jump through past sprints and upcoming release windows.

---

### 5. Deep Issue Details & TipTap ProseMirror Editor
Clicking any issue opens a comprehensive detail view featuring a rich WYSIWYG editor and full relational tracking.

![Space Issue Detail Modal](assets/screenshots/05-issue-detail-modal.png)

- **TipTap ProseMirror Editor:** Rich-text documentation supporting markdown shortcuts, heading tiers (`H1`, `H2`), bulleted & task checkboxes, code blocks, blockquotes, and tables.
- **Sub-Issue Decomposition:** Create nested child issues with automatic progress percentage rollups.
- **Bidirectional Relationships:** Define explicit dependencies with relational tags (`Blocks`, `Blocked By`, `Related To`, `Duplicate Of`).
- **Metadata Sidebar:** Modify state, priority, multiple assignees, Fibonacci story points (`1, 2, 3, 5, 8, 13`), sprint cycles, initiatives (modules), and due dates.
- **Comments & Audit Trail:** Interactive comment threads and an immutable activity audit log tracking every modification.

---

### 6. Universal Command Palette (`Cmd+K` / `Ctrl+K`)
Control Space entirely from your keyboard with an instant fuzzy-search command palette.

![Space Command Palette](assets/screenshots/06-command-palette.png)

- **Global Shortcuts:** Press `Cmd+K` (or `Ctrl+K`) from any screen.
- **Instant Creation:** Press `C` to immediately draft a new issue with pre-filled defaults.
- **Project Jump:** Search and jump to any issue by key (e.g. `SPC-1`), project, cycle, module, or settings view.
- **Quick Stickies:** Open your floating scratchpad instantly with a keystroke.

---

### 7. Agile Sprints & Automated Burndown Velocity
Plan and execute time-boxed 2-week agile cycles with real-time burndown tracking.

![Space Cycles Burndown](assets/screenshots/07-cycles-burndown.png)

- **Automated Burndown Chart:** Compares the ideal velocity trajectory against actual daily remaining story points.
- **Sprint Metrics Cards:** Instant visibility into Total Scope, Completed Points, Remaining Points, and Progress Percentage.
- **One-Click Sprint Completion:** When a cycle ends, complete it with one click and choose whether uncompleted tasks roll over into the next cycle or return to the project backlog.

---

### 8. Project Velocity & Analytics Insights
A project dashboard aggregating delivery trends, state distributions, and member workloads.

![Space Analytics Dashboard](assets/screenshots/08-analytics-dashboard.png)

- **Velocity KPI Cards:** Real-time tracking of Total Issues, Completed Delivery Rate (%), Active WIP In-Progress, and Backlog size.
- **State & Priority Distributions:** Visual progress meters showing the percentage breakdown across all workflow stages and severity levels.
- **Team Member Workload Table:** Breakdown per engineer showing Assigned Tasks, Completed Count, Pending Workload, and visual completion progress bars.

---

### 9. Event-Driven Notifications & Live SMTP Engine
A notification system supporting both real-time in-app delivery and outbound HTML email alerts.

![Space SMTP Settings](assets/screenshots/09-smtp-settings.png)

- **8 Core Lifecycle Triggers:**
  1. `issue.created` — Alerts project members when a new task is logged.
  2. `issue.assigned` — Directly notifies the newly assigned team member.
  3. `issue.status_changed` — Notifies assignees and reporters when an issue progresses.
  4. `issue.priority_changed` — Escalation alert when priority shifts (e.g. to Urgent).
  5. `issue.due_date_updated` — Alerts assignees of schedule changes or approaching deadlines.
  6. `issue.commented` — Dispatches updates to conversation participants.
  7. `user.mentioned` — Urgent alert when a user is tagged (`@username`) in descriptions or comments.
  8. `issue.deleted` — Cleanup notice to assignees when a task is removed.
- **Smart Suppression & Deduplication:** Actors never receive notifications for actions they initiated themselves, and users who are both assignee and reporter receive exactly 1 unified email.
- **Quick Provider Presets:** One-click configurations for Resend, SendGrid, Mailgun, Google / Gmail, and AWS SES.
- **Live Connection Diagnostics:** Test your SMTP relay server directly from the settings page before saving.
- **Offline Sandbox Fallback:** Automatically falls back to appending emails to `data/smtp-outbox.log` when developing locally without active SMTP credentials.

---

### 10. Floating Stickies Scratchpad
A persistent personal scratchpad available in the bottom-right corner of every screen.
- Jot down quick notes, code snippets, or meeting thoughts without losing your current context.
- Color palettes for visual organization and full-text search across all notes.
- **Turn Sticky into Issue:** Convert any scratchpad note into a fully tracked project issue with a single click.

---

### 11. Flagship Project Summary & Status Overview Dashboard
A project executive command center providing immediate visibility into team momentum, delivery health, and real-time activity.

- **Rolling 7-Day Metric Cards:** 4 high-impact KPI summary cards tracking `Completed` (last 7 days), `Updated` (last 7 days), `Created` (last 7 days), and `Due Soon` (next 7 days).
- **Interactive Status Overview Donut Chart:** Dynamic SVG multi-color donut chart with live issue counts, center total, and a color-coded status breakdown legend with direct issue filtering.
- **Real-Time Recent Activity Stream:** Chronological event timeline grouped by date (Today, Yesterday, Earlier) featuring user avatars, action descriptions, issue pills with type icons, and relative timestamps.
- **Customizable Reports Banner:** Dismissable recommendation banner highlighting custom reporting dashboards with visual previews.
- **Horizontal Project Navigation Tabs:** Fast switching between `Summary`, `Stats`, `Preview Task List`, `Work Board`, `Calendar`, `Backlog`, `Cycles`, and additional views.
- **Floating Quickstart Assistant:** Bottom-right floating quickstart pill with onboarding steps and keyboard shortcut references.

---

### 12. Dedicated Backlog & Sprint Planning
A dedicated planning hub for product managers and engineering leads to organize future work and plan upcoming iterations.

- **Sprint Iteration Buckets:** Manage active and future sprint cycles with dates, story point velocity, and completion statuses.
- **Backlog Sizing:** Prioritize and estimate unassigned product backlog items before dragging them into sprint iterations.
- **Collapsible Buckets & Inline Issue Creation:** Quickly expand, collapse, or append issues to any sprint container.

---

### 13. Granular Issue Types (Story, Task, Bug, Epic)
Full support for modern agile issue classifications with distinctive visual indicators:
- **Story** (`Bookmark`, emerald) — User-facing features and deliverables.
- **Task** (`CheckSquare`, blue) — Technical engineering and operational tasks.
- **Bug** (`Bug`, rose) — Defects and incident tracking.
- **Epic** (`Zap`, purple) — High-level strategic initiatives and parent work packages.

---

### 14. Time Tracking, Worklogs & Remaining Estimates
Accurately monitor effort and sprint velocity with dedicated time logging:
- **Original Estimates:** Specify time estimates in human-friendly formats (e.g. `1d 4h`, `2h 30m`, `45m`).
- **Atomic Worklogs:** Log time spent with dates, descriptions, and user attribution.
- **Remaining Estimate Calculations:** Automatically calculates and displays time logged versus remaining original estimate.

---

### 15. Issue Watchers & Clone Issue
- **Watchers:** Subscribe to receive automatic in-app and email notifications when work progress changes.
- **Clone Issue:** Duplicate issues with one click, automatically incrementing sequential identifiers and creating bidirectional relational links.

---

## ⌨️ Keyboard Shortcuts

Space is built for keyboard lovers:

| Shortcut | Action | Scope |
|---|---|---|
| `Cmd + K` or `Ctrl + K` | Open Universal Command Palette | Global |
| `C` | Open Create Issue Modal | Global |
| `S` | Toggle Floating Stickies Scratchpad | Global |
| `Esc` | Close active modal, drawer, or palette | Global |
| `Tab` / `Shift + Tab` | Navigate between form fields and cells | Forms & Spreadsheet |
| `Enter` | Save cell edit or confirm action | Spreadsheet / Modals |

---

## 🛠 Tech Stack & Architecture

Space is intentionally engineered as a clean, monolithic full-stack application to eliminate unnecessary operational complexity.

```
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│     Next.js 16 (App Router) • React 19 • TailwindCSS v4│
│         TanStack Query v5 • Zustand • @dnd-kit         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Full-Stack Server                   │
│         Next.js Route Handlers • Server Actions        │
│    JWT Authentication (bcrypt) • Role-Based Access     │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
┌─────────────▼──────────────┐ ┌───────────▼─────────────┐
│       Database Layer       │ │    Notification Engine   │
│   Prisma ORM 6 • Postgres  │ │ Outbound SMTP • Resend  │
│  Indexed Sequences & Relations │ In-App Alerts • Sandbox Log│
└────────────────────────────┘ └─────────────────────────┘
```

| Component | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Modern React Server Components and fast API route handlers |
| **UI Library** | [React 19](https://react.dev/) | Latest React features with concurrent rendering |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict mode with zero compiler errors across the codebase |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | High-performance CSS engine with Radix UI headless primitives |
| **Database** | [PostgreSQL 16](https://www.postgresql.org/) | ACID-compliant relational data store with compound indexing |
| **ORM** | [Prisma 6](https://www.prisma.io/) | Type-safe schema modeling, migrations, and query optimization |
| **State & Cache** | [TanStack React Query v5](https://tanstack.com/) & [Zustand](https://github.com/pmndrs/zustand) | Optimistic mutations, background revalidation, client state |
| **Drag & Drop** | [@dnd-kit/core](https://dndkit.com/) & `@dnd-kit/sortable` | 60fps accessible drag-and-drop primitives |
| **Rich Editor** | [TipTap (ProseMirror)](https://tiptap.dev/) | Headless, extensible WYSIWYG editor |
| **Testing** | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) | Fast unit, integration, and end-to-end browser verification |
| **Containerization** | Docker & Docker Compose | Multi-stage production build and one-command deployment |

---

## 🚀 Quick Start

### Option A: Self-Hosting with Docker (Recommended)

The fastest and most reliable way to run Space in production:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ashutoshiscool/Space.git
   cd Space
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Update `JWT_SECRET` with a secure random key: `openssl rand -hex 32`)*

3. **Launch the containers:**
   ```bash
   docker compose up -d
   ```

Space is now live at [http://localhost:3000](http://localhost:3000) with PostgreSQL healthy and seeded!

---

### Option B: Local Development Setup

#### Prerequisites
- **Node.js**: v20 or later (`node -v`)
- **npm** or **pnpm**
- **PostgreSQL**: Running locally or via Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ashutoshiscool/Space.git
   cd Space
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your environment:**
   ```bash
   cp .env.example .env
   ```
   Ensure `DATABASE_URL` in `.env` points to your PostgreSQL database:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spacedb?schema=public"
   JWT_SECRET="your-secure-random-secret-at-least-32-chars-long"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Initialize and seed the database:**
   ```bash
   # Push schema to database
   npm run db:push

   # Seed default workspace (acme-corp), project (SPC), and demo data
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser. You can log in immediately using the seeded demo accounts:
- **Admin**: `sarah@space.dev` / `password123`
- **Owner**: `alex@space.dev` / `password123`
- **Member**: `marcus@space.dev` / `password123`

---

## 🧪 Testing & Quality Assurance

Space maintains high code standards with automated type checking, security suites, and integration tests:

```bash
# Run strict TypeScript compiler verification (0 errors)
npx tsc --noEmit

# Run full Vitest suite (30/30 tests pass)
npm test

# Run tests in live watch mode
npm run test:watch
```

### Verified Test Suites
- ✅ `src/__tests__/event-notifications.test.ts` — Verifies all 8 event triggers, self-suppression, mention parsing, and deduplication.
- ✅ `src/__tests__/smtp-engine.test.ts` — Tests SMTP handshakes, TLS verification, HTTPS fallbacks, and local sandbox logging.
- ✅ `src/__tests__/auth-rbac.test.ts` — Tests password hashing, JWT signing/rotation, and workspace role permissions (`OWNER`, `ADMIN`, `MEMBER`, `GUEST`).
- ✅ `src/__tests__/security-multi-tenant-idor.test.ts` — Verifies cross-tenant data isolation and IDOR prevention across workspaces.
- ✅ `src/__tests__/issue-engine.test.ts` — Validates atomic sequence generation under concurrent writes and workflow state transitions.
- ✅ `src/__tests__/verification-engine.test.ts` — Tests email verification tokens and expiration logic.

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Application environment mode | `development` or `production` |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL of the application | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/spacedb?schema=public` |
| `JWT_SECRET` | 32+ character key used to sign session tokens | `openssl rand -hex 32` |
| `SMTP_HOST` | Hostname of outbound SMTP relay server | `smtp.resend.com` |
| `SMTP_PORT` | Port of outbound SMTP relay server | `587` |
| `SMTP_SECURE` | Force TLS on initial connection (Port 465) | `false` |
| `SMTP_USER` | SMTP authentication username | `resend` |
| `SMTP_PASSWORD` | SMTP password or relay API key | `re_your_api_key_here` |
| `SMTP_FROM` | Default sender email address and display name | `Space Notifications <notifications@yourdomain.com>` |
| `RESEND_API_KEY` | Optional direct Resend HTTPS API key (Port 443 relay) | `re_your_api_key_here` |

---

## 🩺 Monitoring & Health Checks

Space includes a production-ready health monitoring endpoint for container orchestrators, load balancers, and status pages:

```http
GET /api/health
```

**Example JSON Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-19T01:30:00.000Z",
  "uptimeSeconds": 3600,
  "database": {
    "status": "healthy",
    "latencyMs": 2
  },
  "system": {
    "memoryHeapUsedMb": 74,
    "nodeVersion": "v22.22.1"
  }
}
```

Use this endpoint with Docker `HEALTHCHECK`, Kubernetes Liveness/Readiness probes, AWS Route 53, or UptimeRobot.

---

## 🔒 Security & Data Isolation

- **Multi-Tenant Isolation:** All queries filter strictly on `workspaceId` and verify active membership before granting read or write permissions.
- **IDOR Protection:** Direct object references to issues, cycles, and documents require workspace-level authorization checks.
- **Authentication:** Passwords are encrypted using salted `bcrypt` hashes. Authenticated sessions are stored in HTTP-only, SameSite secure cookies.
- **Enterprise Headers:** Equipped with HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and Content Security Policy protections.

---

## 🤝 Contributing

We welcome contributions from the developer community! To contribute:

1. Fork the Project on GitHub: [github.com/ashutoshiscool/Space](https://github.com/ashutoshiscool/Space)
2. Create your Feature Branch:
   ```bash
   git checkout -b feat/my-new-feature
   ```
3. Commit your Changes:
   ```bash
   git commit -m "feat: add support for custom webhook integrations"
   ```
4. Push to the Branch:
   ```bash
   git push origin feat/my-new-feature
   ```
5. Open a Pull Request.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for full style guidelines, test conventions, and development procedures.

---

## 📄 License

Space is open-source software distributed under the **[MIT License](LICENSE)**.

<div align="center">

# 🚀 Space

### The Open-Source High-Velocity Issue Tracking & Project Management Platform

**Fast. Extensible. Beautiful. Self-hostable in under 60 seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat&logo=docker)](https://www.docker.com/)
[![Vitest 100%](https://img.shields.io/badge/Tests-30%20Passed-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)

[Quick Start](#-quick-start) • [Features](#-core-features) • [Self-Hosting](#-self-hosting-with-docker) • [Architecture](#-tech-stack--architecture) • [Contributing](CONTRIBUTING.md)

</div>

---

## 💡 What is Space?

**Space** is a unified, developer-first project management system designed for speed, clarity, and team velocity. 

Tired of bloated, sluggish enterprise trackers with slow page loads and fragmented tools? Space combines **deep issue tracking**, **flexible documentation**, **sprint cycles**, **custom views**, and **real-time event notifications** into a single, cohesive, modern application that renders instantly and feels native.

---

## 🌟 Core Features

### 🗂️ 1. Multi-Dimensional Views & Workspaces
- **60fps Kanban Board:** Physics-based drag-and-drop powered by `@dnd-kit`, featuring optimistic column updates, card estimate badges, priority chips, and sub-task counters.
- **Assignee Swimlanes & Workload Analytics:** Group board cards horizontally by team member, monitor capacity and unassigned issues at a glance, and reassign tasks simply by dragging between swimlanes.
- **Dense Spreadsheet View:** High-density table layout with inline multi-field editing (title, state, priority, assignee, cycle, due date, estimate) and instant inline row creation.
- **Dense List View:** Clean grouped list view with multi-criteria filtering, search, and bulk selection.
- **Interactive Calendar View:** Monthly grid plotting issues by due dates with interactive priority badges and state color indicators.
- **Roadmap & Timeline:** Visual Gantt-style planning across cycles and modules.

### 📋 2. Comprehensive Issue Lifecycle Management
- **Atomic Sequence Identifiers:** Concurrency-safe, auto-incrementing project sequence keys (e.g. `[SPC-101]`, `[ENG-42]`).
- **Flexible Workflow States:** Fully configurable states mapped to canonical groups: `Backlog`, `Unstarted`, `Started`, `Completed`, `Canceled`.
- **Bidirectional Issue Relations:** Track relationships with deep dependency graphs: `Blocks`, `Blocked By`, `Related To`, and `Duplicate Of`.
- **Sub-Issue Hierarchies:** Nested parent-child issue decomposition with automatic progress rollups.
- **Rich-Text TipTap Editor:** Markdown shortcuts, code blocks, task lists, tables, and inline images.
- **Drafts System & Archive:** Local drafting across projects before publishing, plus an archive with restore and permanent deletion options.

### 🔄 3. Cycles (Sprints) & Modules (Initiatives)
- **Time-Boxed Cycles:** Sprint iterations with automated daily burndown velocity charts.
- **Single-Click Completion:** Rollover incomplete tasks to subsequent cycles or return them to the project backlog.
- **Strategic Modules:** High-level initiative clusters with dynamic delivery percentage meters and lead assignments.

### 📝 4. Collaborative Docs (Pages)
- **Nested Workspace Knowledge Base:** Notion-style rich documentation directly alongside your code and issues.
- **Public Sharing:** Generate cryptographic read-only sharing links for external clients and stakeholders.

### 🔔 5. Event-Driven Notification & Email Engine
- **8 Core Lifecycle Events:** Instant dispatches for Issue Created, Assigned, Status Changed, Priority Changed, Due Date Updated, Comments Added, User Mentions (`@username`), and Issue Deletions.
- **Self-Action Suppression:** Actors never receive notifications for actions they initiated themselves.
- **Recipient Deduplication:** Team members who are both assignee and reporter receive exactly 1 unified update.
- **Dual-Dispatch Synchronization:** Real-time in-app notification center coupled with responsive, modern HTML email templates.
- **Customizable Workspace Preferences:** Per-workspace toggles for fine-grained control over which event triggers dispatch emails.
- **Live SMTP Server Diagnostics:** In-app handshake modal to verify connection parameters, latency, and TLS negotiations before saving.
- **Sandbox Fallback:** Automatic offline fallback recording emails to `data/smtp-outbox.log` when testing locally without live SMTP credentials.

### ⚡ 6. High-Velocity Developer Utilities
- **Universal Command Palette (`Cmd+K` / `Ctrl+K`):** Instant fuzzy navigation, quick searches, and keyboard shortcuts (`C` to create an issue).
- **Floating Stickies Scratchpad:** Persistent personal notepad in the bottom right corner with color palettes, search, and one-click "Turn Sticky into Issue".
- **Intake & Triage Inbox:** Inbound queue for bug reports with quick Accept, Snooze, or Decline actions.
- **Data Portability:** Instant one-click CSV export (`${projectIdentifier}-issues.csv`).

---

## 🛠 Tech Stack & Architecture

Space is intentionally built as a **Single, Unified Full-Stack Application** to simplify deployment and minimize operational complexity.

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) |
| **Database** | [PostgreSQL 16](https://www.postgresql.org/) |
| **ORM** | [Prisma 6](https://www.prisma.io/) with optimized indexing |
| **State & Data Fetching** | [TanStack React Query v5](https://tanstack.com/query/latest) & [Zustand](https://github.com/pmndrs/zustand) |
| **Drag & Drop** | [@dnd-kit/core](https://dndkit.com/) & `@dnd-kit/sortable` |
| **Editor** | [TipTap (ProseMirror)](https://tiptap.dev/) |
| **Auth & Security** | JWT Session Cookies, bcrypt password hashing, RBAC, HSTS, CSP |
| **Testing** | [Vitest](https://vitest.dev/) (Unit/Integration) & [Playwright](https://playwright.dev/) (E2E) |
| **Containerization** | Docker & Docker Compose with multi-stage builds |

---

## 🚀 Quick Start

### Option A: Self-Hosting with Docker (Recommended)

The fastest way to deploy Space in production:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/space.git
   cd space
   ```

2. **Configure your environment:**
   ```bash
   cp .env.example .env
   ```

3. **Start the containers:**
   ```bash
   docker compose up -d
   ```

Space is now live at [http://localhost:3000](http://localhost:3000) with PostgreSQL running and verified via container health checks!

---

### Option B: Local Development Setup

#### Prerequisites
- **Node.js**: v20 or later (`node -v`)
- **npm** or **pnpm**
- **PostgreSQL**: Running locally or via Docker

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Ensure `DATABASE_URL` in `.env` points to your PostgreSQL database)*

3. **Initialize the database:**
   ```bash
   # Push schema with optimized indexes
   npm run db:push

   # Seed default workspace, project, workflow states, and sample issues
   npm run db:seed
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Assurance

Space maintains high code standards with automated type checking, security suites, and integration tests:

```bash
# Run strict TypeScript compiler check (0 errors)
npx tsc --noEmit

# Run full Vitest suite (30/30 tests)
npm test

# Run tests with live watch mode
npm run test:watch
```

### Verified Test Suites
- ✅ `src/__tests__/event-notifications.test.ts` (Notification dispatch, self-suppression, mention resolution, invite delivery)
- ✅ `src/__tests__/smtp-engine.test.ts` (SMTP handshakes, TLS verification, HTTPS API fallbacks, sandbox outbox)
- ✅ `src/__tests__/auth-rbac.test.ts` (Password hashing, JWT token rotation, workspace RBAC permissions)
- ✅ `src/__tests__/security-multi-tenant-idor.test.ts` (Cross-tenant data isolation & IDOR prevention)
- ✅ `src/__tests__/issue-engine.test.ts` (Sequence generation under concurrency, state transitions)
- ✅ `src/__tests__/verification-engine.test.ts` (Email verification tokens and expiration)

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Application environment mode | `production` or `development` |
| `NEXT_PUBLIC_APP_URL` | Base canonical URL of the application | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/spacedb?schema=public` |
| `JWT_SECRET` | 32-byte secret used to sign session tokens | `openssl rand -hex 32` |
| `SMTP_HOST` | Hostname of outbound SMTP relay | `smtp.resend.com` |
| `SMTP_PORT` | Port of outbound SMTP relay | `587` |
| `SMTP_SECURE` | Force TLS on initial connection (Port 465) | `false` |
| `SMTP_USER` | SMTP authentication username | `resend` |
| `SMTP_PASSWORD` | SMTP password or relay API key | `re_your_api_key_here` |
| `SMTP_FROM` | Default sender email address and display name | `Space Notifications <notifications@yourdomain.com>` |
| `RESEND_API_KEY` | Optional direct Resend HTTPS API key (Port 443 relay) | `re_your_api_key_here` |

---

## 🩺 Monitoring & Health Checks

Space includes a production-ready health monitoring endpoint:

```http
GET /api/health
```

**Example JSON Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-19T01:00:00.000Z",
  "uptimeSeconds": 1420,
  "database": {
    "status": "healthy",
    "latencyMs": 2
  },
  "system": {
    "memoryHeapUsedMb": 68,
    "nodeVersion": "v22.22.1"
  }
}
```

Use this endpoint for Docker `HEALTHCHECK`, Kubernetes Liveness/Readiness probes, or cloud monitoring (AWS Route53, Datadog, BetterUptime).

---

## 🤝 Contributing

We welcome contributions from the open-source community! Please review our [Contributing Guidelines](CONTRIBUTING.md) to get started.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Space is open-source software distributed under the terms of the **[MIT License](LICENSE)**.

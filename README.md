# 🚀 Space — Next-Generation Issue Tracking & Project Management Platform

> Combining the speed of **Linear**, the depth of **Plane**, and the flexibility of **Notion**.

Space is a production-grade, open-source project management platform built from scratch with sub-100ms optimistic UI updates, high-performance 60fps Kanban board drag-and-drop, automated sprint burndown tracking, Notion-style collaborative documentation, and keyboard-first command traversal (`Cmd+K`).

---

## 🛠 Tech Stack & Architecture

- **Framework:** Next.js 15 (App Router) with React 19 and TypeScript in Strict Mode
- **Database & ORM:** PostgreSQL 16 with Prisma ORM
- **Styling & Design System:** Tailwind CSS v4, Radix UI primitives, Lucide Icons, Dark Theme by default (`#09090b` / Zinc palette)
- **State Management:** TanStack Query (React Query v5) for server state with optimistic mutations, Zustand for global UI state
- **Drag & Drop:** `@dnd-kit/core` and `@dnd-kit/sortable` for 60fps Kanban board interactions
- **Rich-Text Editor:** TipTap (ProseMirror) with Task Lists, Markdown shortcuts, Code Blocks, and Tables
- **Authentication:** JWT session authentication with bcrypt password hashing and RBAC (`Owner`, `Admin`, `Member`, `Guest`)
- **Testing:** Vitest for unit & integration tests

---

## 🌟 Key Features

1. **Multi-Tenant Workspaces & RBAC:**
   - Isolated organizations with custom slugs (e.g. `/acme-corp`)
   - Role-based access control with cryptographic invitation links
2. **Projects & Auto-Incrementing Identifiers:**
   - Atomic sequence generation (e.g. `SPC-1`, `SPC-2`, `ENG-1`)
   - Auto-seeded workflow states: `Backlog`, `Todo`, `In Progress`, `Done`, `Canceled`
3. **Interactive Views & Layouts:**
   - **Kanban Board:** Fluid 60fps drag-and-drop with optimistic column reordering and network rollback
   - **Dense List View:** Spreadsheet-like row view with inline property editing and multi-select batch updates
   - **Roadmap (Gantt):** Visual timeline schedules and milestone progress
4. **Issue Detail Drawer:**
   - TipTap ProseMirror rich editor with checklists and markdown
   - Bidirectional issue dependencies (`Blocks`, `Blocked By`, `Related`, `Duplicate`)
   - Sub-issue hierarchies and real-time activity audit trail
5. **Cycles (Sprints):**
   - Time-boxed iterations with automated daily burndown charts
   - Velocity tracking and single-click sprint completion with incomplete issue rollover
6. **Modules (Epics / Initiatives):**
   - High-level initiative clusters with dynamic delivery progress bars
7. **Collaborative Docs (Pages):**
   - Notion-style nested rich documentation with public sharing links
8. **Intake / Triage (Inbox):**
   - Inbound queue to Accept, Snooze, or Decline incoming bug reports
9. **Universal Command Palette (`Cmd+K` / `Ctrl+K`):**
   - Instant fuzzy search across issues, navigation, and quick creation (`C`)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on v22)
- Docker & Docker Compose (or local PostgreSQL on port 5432)

### 2. Start PostgreSQL
```bash
docker compose up -d
```

### 3. Install Dependencies & Setup Database
```bash
npm install --legacy-peer-deps
npx prisma db push
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
# or build and run production
npm run build
npm run start
```
Visit **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Pre-Seeded Demo Accounts

Space comes seeded with demo profiles for instant testing:

| Name | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | Workspace Owner | `alex@space.dev` | `password123` |
| **Sarah Chen** | Workspace Admin | `sarah@space.dev` | `password123` |
| **Marcus Vance** | Workspace Member | `marcus@space.dev` | `password123` |

Default Workspace: **`acme-corp`**  
Default Project: **`SPC` (Space Platform)**

---

## ⌨️ Universal Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K`: Open Universal Command Palette
- `C`: Quick Issue Creation modal (from anywhere)
- `Esc`: Dismiss modals and drawers

---

## 🧪 Testing & Verification

Run the test suite with Vitest:
```bash
npm test
```
Type-check the entire codebase:
```bash
npx tsc --noEmit
```

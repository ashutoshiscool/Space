# Contributing to Space 🚀

Thank you for your interest in contributing to **Space**! We are building a high-velocity, open-source issue tracking and project management platform designed for modern engineering teams.

---

## 💻 Development Setup

### 1. Prerequisites
- **Node.js**: v20 or later (v22 recommended)
- **Package Manager**: `npm` or `pnpm`
- **PostgreSQL**: v16+ (or via Docker Compose)

### 2. Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/space.git
   cd space
   ```

2. **Start PostgreSQL with Docker (Optional)**
   ```bash
   docker compose up -d postgres
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Initialize Database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

6. **Start Dev Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view Space.

---

## 🧪 Testing & Code Quality

Before submitting a pull request, please verify that your changes pass all type checks and automated tests:

```bash
# Type check with strict TypeScript compiler
npm run build # or npx tsc --noEmit

# Run complete Vitest unit & integration test suite
npm test
```

---

## 🌿 Branching & Git Conventions

- **Main branch:** `main` (production-ready)
- **Feature branches:** `feat/feature-name`
- **Fix branches:** `fix/issue-description`
- **Chore / docs:** `chore/task-name`, `docs/update-readme`

### Commit Message Guidelines
We follow standard Conventional Commits:
- `feat: add calendar filter by assignee`
- `fix: resolve issue sequence collision under high concurrency`
- `docs: update self-hosting instructions in README`
- `test: add notification trigger preference unit tests`

---

## 🛡️ Security Vulnerabilities

If you discover a security vulnerability within Space, please report it privately rather than creating a public issue. Email security concerns to `security@space.dev` or use GitHub Private Vulnerability Reporting.

---

## 📜 License

By contributing to Space, you agree that your contributions will be licensed under the [MIT License](LICENSE).

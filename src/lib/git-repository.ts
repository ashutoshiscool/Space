import { prisma } from "@/lib/prisma";
import { execSync } from "child_process";

export interface ProjectRepositoryData {
  repo: {
    name: string;
    url: string;
    defaultBranch: string;
    currentBranch: string;
    status: string;
    isClean: boolean;
  };
  commits: {
    id: string;
    hash: string;
    message: string;
    branch: string;
    author: {
      name: string;
      email: string;
      avatarUrl?: string | null;
    };
    createdAt: string;
    verified: boolean;
    issueKey: string | null;
    issueTitle: string | null;
    issueId: string | null;
    issueType: string | null;
  }[];
  branches: {
    name: string;
    isDefault: boolean;
    lastCommitHash: string;
    lastCommitMessage: string;
    author: string;
    updatedAt: string;
  }[];
  pullRequests: any[];
}

export async function getProjectRepositoryData(
  projectId: string
): Promise<ProjectRepositoryData | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      issues: {
        select: {
          id: true,
          sequenceId: true,
          title: true,
          type: true,
        },
      },
    },
  });

  if (!project) return null;

  // 1. Real remote URL
  let remoteUrl = "https://github.com/ashutoshiscool/Space";
  try {
    remoteUrl = execSync("git remote get-url origin", {
      cwd: process.cwd(),
      encoding: "utf8",
    }).trim();
  } catch {
    // fallback
  }

  // 2. Real current branch
  let currentBranch = "main";
  try {
    currentBranch =
      execSync("git branch --show-current", {
        cwd: process.cwd(),
        encoding: "utf8",
      }).trim() || "main";
  } catch {
    // fallback
  }

  // 3. Real git branches
  let branches: {
    name: string;
    isDefault: boolean;
    lastCommitHash: string;
    lastCommitMessage: string;
    author: string;
    updatedAt: string;
  }[] = [];

  try {
    const branchOutput = execSync(
      'git branch --format="%(refname:short)|%(objectname:short)|%(subject)|%(authorname)|%(committerdate:iso)"',
      { cwd: process.cwd(), encoding: "utf8" }
    );
    branches = branchOutput
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, hash, subject, author, dateStr] = line.split("|");
        return {
          name: name?.trim() || "",
          isDefault: name?.trim() === "main" || name?.trim() === "master",
          lastCommitHash: hash?.trim() || "",
          lastCommitMessage: subject?.trim() || "Latest commit",
          author: author?.trim() || "Git Author",
          updatedAt: dateStr?.trim() || new Date().toISOString(),
        };
      });
  } catch {
    branches = [
      {
        name: currentBranch,
        isDefault: true,
        lastCommitHash: "",
        lastCommitMessage: "Initial commit",
        author: "Workspace",
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  // 4. Real git commits
  let commits: any[] = [];
  try {
    const logOutput = execSync(
      'git log -n 40 --pretty=format:"%H|%h|%s|%an|%ae|%aI"',
      { cwd: process.cwd(), encoding: "utf8" }
    );

    commits = logOutput
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [fullHash, hash, subject, authorName, authorEmail, dateStr] =
          line.split("|");

        const issueMatch = subject?.match(/([A-Z0-9]+)-(\d+)/i);
        let linkedIssue: any = null;
        let issueKey: string | null = null;

        if (issueMatch) {
          issueKey = `${issueMatch[1].toUpperCase()}-${issueMatch[2]}`;
          const seqId = parseInt(issueMatch[2], 10);
          linkedIssue = project.issues.find(
            (i) =>
              i.sequenceId === seqId &&
              issueMatch[1].toUpperCase() === project.identifier
          );
        }

        return {
          id: fullHash || hash,
          hash: hash || "",
          message: subject || "",
          branch: currentBranch,
          author: {
            name: authorName || "Unknown",
            email: authorEmail || "",
          },
          createdAt: dateStr || new Date().toISOString(),
          verified: true,
          issueKey,
          issueTitle: linkedIssue?.title || null,
          issueId: linkedIssue?.id || null,
          issueType: linkedIssue?.type || null,
        };
      });
  } catch {
    commits = [];
  }

  // 5. Check real git working tree status
  let isClean = true;
  try {
    const statusOut = execSync("git status --porcelain", {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    isClean = statusOut.trim().length === 0;
  } catch {
    // ignore
  }

  return {
    repo: {
      name: "ashutoshiscool/Space",
      url: remoteUrl,
      defaultBranch: "main",
      currentBranch,
      status: "connected",
      isClean,
    },
    commits,
    branches,
    pullRequests: [],
  };
}

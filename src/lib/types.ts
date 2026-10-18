import {
  Issue,
  State,
  Label,
  Cycle,
  Module,
  User,
  Project,
  Workspace,
  WorkspaceRole,
  IssuePriority,
  StateGroup,
  RelationType,
  IssueComment,
  IssueActivity,
  Page,
} from "@prisma/client";

export type { User, Project, Workspace, State, Label, Cycle, Module, Page };
export { WorkspaceRole, IssuePriority, StateGroup, RelationType };

export type IssueWithDetails = Issue & {
  state: State;
  assignees: {
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  }[];
  labels: {
    label: Label;
  }[];
  cycle?: Cycle | null;
  module?: Module | null;
  createdBy: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  subIssues?: IssueWithDetails[];
  parent?: Pick<Issue, "id" | "sequenceId" | "title"> | null;
  comments?: (IssueComment & {
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  })[];
  activities?: (IssueActivity & {
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  })[];
  relations?: {
    id: string;
    type: RelationType;
    target: Pick<Issue, "id" | "sequenceId" | "title" | "priority"> & {
      state: State;
    };
  }[];
  relatedBy?: {
    id: string;
    type: RelationType;
    source: Pick<Issue, "id" | "sequenceId" | "title" | "priority"> & {
      state: State;
    };
  }[];
  _count?: {
    comments: number;
    subIssues: number;
  };
};

export type ProjectWithDetails = Project & {
  states: State[];
  labels: Label[];
  cycles: Cycle[];
  modules: Module[];
  members: {
    role: WorkspaceRole;
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  }[];
};

export type WorkspaceWithDetails = Workspace & {
  members: {
    id: string;
    role: WorkspaceRole;
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  }[];
  projects: Project[];
};

export type CycleWithMetrics = Cycle & {
  totalIssues: number;
  completedIssues: number;
  totalPoints: number;
  completedPoints: number;
  progressPercent: number;
  burndown: {
    date: string;
    idealRemaining: number;
    actualRemaining: number | null;
  }[];
};

export type ModuleWithMetrics = Module & {
  totalIssues: number;
  completedIssues: number;
  progressPercent: number;
  lead?: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
};

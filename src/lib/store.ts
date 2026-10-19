import { create } from "zustand";
import { IssuePriority } from "@prisma/client";

export interface ViewFilterState {
  search: string;
  priorities: IssuePriority[];
  stateIds: string[];
  assigneeIds: string[];
  cycleId?: string;
  moduleId?: string;
}

interface SpaceStore {
  // Command Palette
  isCommandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  // Quick Issue Creation Modal (press 'C')
  isCreateIssueOpen: boolean;
  createIssueDefaults: {
    stateId?: string;
    cycleId?: string;
    moduleId?: string;
    assigneeId?: string;
    dueDate?: string;
  };
  openCreateIssue: (defaults?: {
    stateId?: string;
    cycleId?: string;
    moduleId?: string;
    assigneeId?: string;
    dueDate?: string;
  }) => void;
  closeCreateIssue: () => void;

  // Active Issue Detail Modal/Drawer
  activeIssueId: string | null;
  setActiveIssueId: (id: string | null) => void;

  // Filter State
  filters: ViewFilterState;
  setSearch: (search: string) => void;
  togglePriorityFilter: (priority: IssuePriority) => void;
  toggleStateFilter: (stateId: string) => void;
  toggleAssigneeFilter: (assigneeId: string) => void;
  setCycleFilter: (cycleId?: string) => void;
  setModuleFilter: (moduleId?: string) => void;
  clearFilters: () => void;

  // Layout View Mode (Board, List, Calendar, Spreadsheet, Roadmap, Job Board)
  viewMode: "kanban" | "list" | "calendar" | "spreadsheet" | "roadmap" | "jobboard";
  setViewMode: (mode: "kanban" | "list" | "calendar" | "spreadsheet" | "roadmap" | "jobboard") => void;

  // Stickies (Scratchpad)
  isStickiesOpen: boolean;
  setStickiesOpen: (open: boolean) => void;
  toggleStickies: () => void;

  // Sidebar
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useSpaceStore = create<SpaceStore>((set) => ({
  isCommandOpen: false,
  setCommandOpen: (open) => set({ isCommandOpen: open }),
  toggleCommand: () => set((state) => ({ isCommandOpen: !state.isCommandOpen })),

  isCreateIssueOpen: false,
  createIssueDefaults: {},
  openCreateIssue: (defaults = {}) =>
    set({ isCreateIssueOpen: true, createIssueDefaults: defaults }),
  closeCreateIssue: () => set({ isCreateIssueOpen: false, createIssueDefaults: {} }),

  activeIssueId: null,
  setActiveIssueId: (id) => set({ activeIssueId: id }),

  filters: {
    search: "",
    priorities: [],
    stateIds: [],
    assigneeIds: [],
  },
  setSearch: (search) =>
    set((state) => ({ filters: { ...state.filters, search } })),
  togglePriorityFilter: (priority) =>
    set((state) => {
      const exists = state.filters.priorities.includes(priority);
      return {
        filters: {
          ...state.filters,
          priorities: exists
            ? state.filters.priorities.filter((p) => p !== priority)
            : [...state.filters.priorities, priority],
        },
      };
    }),
  toggleStateFilter: (stateId) =>
    set((state) => {
      const exists = state.filters.stateIds.includes(stateId);
      return {
        filters: {
          ...state.filters,
          stateIds: exists
            ? state.filters.stateIds.filter((id) => id !== stateId)
            : [...state.filters.stateIds, stateId],
        },
      };
    }),
  toggleAssigneeFilter: (assigneeId) =>
    set((state) => {
      const exists = state.filters.assigneeIds.includes(assigneeId);
      return {
        filters: {
          ...state.filters,
          assigneeIds: exists
            ? state.filters.assigneeIds.filter((id) => id !== assigneeId)
            : [...state.filters.assigneeIds, assigneeId],
        },
      };
    }),
  setCycleFilter: (cycleId) =>
    set((state) => ({ filters: { ...state.filters, cycleId } })),
  setModuleFilter: (moduleId) =>
    set((state) => ({ filters: { ...state.filters, moduleId } })),
  clearFilters: () =>
    set({
      filters: {
        search: "",
        priorities: [],
        stateIds: [],
        assigneeIds: [],
      },
    }),

  viewMode: "kanban",
  setViewMode: (mode) => set({ viewMode: mode }),

  isStickiesOpen: false,
  setStickiesOpen: (open) => set({ isStickiesOpen: open }),
  toggleStickies: () => set((state) => ({ isStickiesOpen: !state.isStickiesOpen })),

  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));

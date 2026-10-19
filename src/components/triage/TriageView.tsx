"use client";

import React from "react";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import {
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSpaceStore } from "@/lib/store";

interface TriageViewProps {
  triageIssues: IssueWithDetails[];
  project: ProjectWithDetails;
}

export function TriageView({ triageIssues, project }: TriageViewProps) {
  const setActiveIssueId = useSpaceStore((s) => s.setActiveIssueId);
  const queryClient = useQueryClient();

  const todoState =
    project.states.find((s) => s.name.toLowerCase() === "todo") ||
    project.states[1] ||
    project.states[0];

  const canceledState =
    project.states.find((s) => s.name.toLowerCase() === "canceled") ||
    project.states[project.states.length - 1];

  // Mutation to accept issue into Todo
  const triageActionMutation = useMutation({
    mutationFn: async ({
      issueId,
      action,
    }: {
      issueId: string;
      action: "accept" | "decline" | "snooze";
    }) => {
      let data: Record<string, unknown> = {};
      if (action === "accept") {
        data = { stateId: todoState.id };
      } else if (action === "decline") {
        data = { stateId: canceledState.id, isArchived: true };
      } else if (action === "snooze") {
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        data = { dueDate: nextWeek.toISOString() };
      }

      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to triage issue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  return (
    <div className="flex flex-col space-y-6 w-full max-w-5xl text-[#111827]">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#111827] flex items-center gap-2">
          <Inbox className="h-4 w-4 text-[#3e63dd]" />
          <span>Triage & Inbound Queue</span>
        </h2>
        <p className="text-xs text-[#6b7280] mt-0.5">
          Review, qualify, and admit incoming customer requests and bug reports into the active backlog
        </p>
      </div>

      <div className="space-y-3">
        {triageIssues.map((issue) => (
          <div
            key={issue.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-xs hover:border-[#cbd5e1] hover:bg-[#f8f9fa] transition-all"
          >
            <div
              onClick={() => setActiveIssueId(issue.id)}
              className="flex-1 space-y-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <PriorityIcon priority={issue.priority} size={14} />
                <span className="font-mono text-xs font-semibold text-[#6b7280]">
                  {project.identifier}-{issue.sequenceId}
                </span>
                <span className="text-[11px] text-[#6b7280]">
                  Reported {formatDate(issue.createdAt)} by {issue.createdBy.name}
                </span>
              </div>

              <h3 className="text-xs font-semibold text-[#111827]">
                {issue.title}
              </h3>

              {issue.description && (
                <div
                  className="text-xs text-[#4b5563] line-clamp-2 max-w-2xl"
                  dangerouslySetInnerHTML={{
                    __html: issue.description.substring(0, 200),
                  }}
                />
              )}
            </div>

            {/* Triage Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() =>
                  triageActionMutation.mutate({
                    issueId: issue.id,
                    action: "accept",
                  })
                }
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 gap-1 shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Accept (Todo)</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  triageActionMutation.mutate({
                    issueId: issue.id,
                    action: "snooze",
                  })
                }
                className="text-xs h-7 gap-1 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#111827] border border-[#e5e7eb]"
              >
                <Clock className="h-3.5 w-3.5 text-[#6b7280]" />
                <span>Snooze</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  triageActionMutation.mutate({
                    issueId: issue.id,
                    action: "decline",
                  })
                }
                className="text-xs h-7 gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Decline</span>
              </Button>
            </div>
          </div>
        ))}

        {triageIssues.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f8f9fa] p-12 text-center text-[#6b7280]">
            <Inbox className="h-8 w-8 text-[#9ca3af] mb-2" />
            <h4 className="text-sm font-semibold text-[#111827]">Triage queue is clean</h4>
            <p className="text-xs mt-1">All incoming issues and requests have been qualified</p>
          </div>
        )}
      </div>
    </div>
  );
}

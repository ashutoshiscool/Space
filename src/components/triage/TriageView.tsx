"use client";

import React, { useState } from "react";
import { IssueWithDetails, ProjectWithDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
} from "lucide-react";
import { formatDate, getPriorityMeta, cn } from "@/lib/utils";
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
      let data: Record<string, any> = {};
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
    <div className="flex flex-col space-y-6 w-full max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Inbox className="h-5 w-5 text-indigo-400" />
          <span>Triage & Inbound Queue</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Review, qualify, and admit incoming customer requests and bug reports into the active backlog or backlog sprints
        </p>
      </div>

      <div className="space-y-3">
        {triageIssues.map((issue) => {
          const pMeta = getPriorityMeta(issue.priority);

          return (
            <div
              key={issue.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-[#121215] p-4 shadow-sm hover:border-zinc-700 transition-all"
            >
              <div
                onClick={() => setActiveIssueId(issue.id)}
                className="flex-1 space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-zinc-400">
                    {project.identifier}-{issue.sequenceId}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-semibold border",
                      pMeta.bg,
                      pMeta.color,
                      pMeta.border
                    )}
                  >
                    {pMeta.label}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Reported {formatDate(issue.createdAt)} by {issue.createdBy.name}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-zinc-100">
                  {issue.title}
                </h3>

                {issue.description && (
                  <div
                    className="text-xs text-zinc-400 line-clamp-2 max-w-2xl"
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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 gap-1"
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
                  className="text-xs h-8 gap-1"
                >
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
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
                  className="text-xs h-8 gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Decline</span>
                </Button>
              </div>
            </div>
          );
        })}

        {triageIssues.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
            <h4 className="text-sm font-semibold text-zinc-200">Zero inbox!</h4>
            <p className="text-xs mt-1">All incoming issues have been reviewed and accepted or cleared.</p>
          </div>
        )}
      </div>
    </div>
  );
}

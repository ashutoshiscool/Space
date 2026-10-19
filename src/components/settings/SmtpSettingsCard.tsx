"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Server,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SmtpSettingsCardProps {
  workspaceSlug: string;
  currentUserEmail: string;
}

interface SmtpFormData {
  host: string;
  port: number;
  secure: boolean;
  transport?: "auto" | "https" | "smtp" | "sandbox";
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  isEnabled: boolean;
  notifyOnIssueCreated?: boolean;
  notifyOnIssueAssigned: boolean;
  notifyOnIssueStatusChanged: boolean;
  notifyOnIssueComment: boolean;
  notifyOnPriorityOrDueDate?: boolean;
  notifyOnCycleDigest: boolean;
  hasPassword?: boolean;
  lastTestedAt?: string;
  lastTestStatus?: "SUCCESS" | "FAILED";
  lastTestError?: string | null;
  lastTestRecipient?: string | null;
}

const PRESET_PROVIDERS = [
  {
    name: "Resend",
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    username: "resend",
  },
  {
    name: "SendGrid",
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    username: "apikey",
  },
  {
    name: "Mailgun",
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    username: "postmaster@your-domain.mailgun.org",
  },
  {
    name: "Google / Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    username: "your-email@gmail.com",
  },
  {
    name: "AWS SES",
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    username: "ses-smtp-username",
  },
];

export function SmtpSettingsCard({
  workspaceSlug,
  currentUserEmail,
}: SmtpSettingsCardProps) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState(currentUserEmail);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState<SmtpFormData>({
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromName: "Space Notifications",
    fromEmail: "notifications@space.dev",
    replyTo: "",
    isEnabled: false,
    notifyOnIssueCreated: true,
    notifyOnIssueAssigned: true,
    notifyOnIssueStatusChanged: true,
    notifyOnIssueComment: true,
    notifyOnPriorityOrDueDate: true,
    notifyOnCycleDigest: false,
  });

  // Fetch current SMTP config
  const { data, isLoading } = useQuery<{ config: SmtpFormData }>({
    queryKey: ["smtp-config", workspaceSlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/settings/smtp`);
      if (!res.ok) throw new Error("Failed to load SMTP configuration");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.config) {
      setForm((prev) => ({
        ...prev,
        ...data.config,
        password: data.config.hasPassword ? "••••••••" : "",
      }));
    }
  }, [data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/settings/smtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save SMTP configuration");
      }
      return res.json();
    },
    onSuccess: (savedData) => {
      queryClient.setQueryData(["smtp-config", workspaceSlug], savedData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  // Test mutation
  const testMutation = useMutation({
    mutationFn: async (recipient: string) => {
      const res = await fetch(
        `/api/workspaces/${workspaceSlug}/settings/smtp/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipient }),
        }
      );
      const resData = await res.json();
      if (!res.ok) {
        const err = new Error(resData.error || "Test email delivery failed") as any;
        err.transcript = resData.transcript;
        throw err;
      }
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp-config", workspaceSlug] });
    },
  });

  const applyPreset = (preset: (typeof PRESET_PROVIDERS)[number]) => {
    setForm((prev) => ({
      ...prev,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
      username: preset.username,
    }));
  };

  const handleTestSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) return;
    testMutation.mutate(testRecipient.trim());
  };

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 space-y-6 shadow-xs font-sans text-[#111827]">
      {/* Top Banner & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e5e7eb]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-[#3e63dd] shadow-xs">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#111827]">
                SMTP & Outbound Email Delivery
              </h3>
              {form.isEnabled ? (
                form.lastTestStatus === "SUCCESS" ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Active & Verified</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-[#3e63dd]">
                    <Zap className="h-3 w-3 text-[#3e63dd]" />
                    <span>Active (Ready)</span>
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-gray-50 border border-[#e5e7eb] px-2 py-0.5 text-[10px] font-semibold text-[#6b7280]">
                  <span>Disabled</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#6b7280] mt-0.5 max-w-xl">
              Configure SMTP credentials (Resend, SendGrid, Mailgun, Amazon SES, or custom ESMTP) to dispatch issue assignment alerts and activity updates.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsTestModalOpen(true);
              testMutation.reset();
            }}
            disabled={!form.host || isLoading}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border-[#e5e7eb] bg-white hover:bg-gray-50 text-[#374151] shadow-xs cursor-pointer"
          >
            <Send className="h-3.5 w-3.5 text-[#6b7280]" />
            <span>Send Test Email</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading}
            className={cn(
              "flex items-center gap-1.5 h-8 px-4 text-xs font-medium text-white shadow-xs cursor-pointer transition-all",
              saveSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#3e63dd] hover:bg-[#3451b2]"
            )}
          >
            {saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>{saveMutation.isPending ? "Saving..." : "Save Changes"}</span>
            )}
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{(saveMutation.error as Error).message}</span>
        </div>
      )}

      {/* Master Enable Switch */}
      <div className="flex items-center justify-between rounded-xl bg-[#f8f9fa] border border-[#e5e7eb] p-4">
        <div>
          <div className="text-xs font-semibold text-[#111827]">
            Enable Outbound Email Dispatch
          </div>
          <div className="text-[11px] text-[#6b7280]">
            When disabled, all workspace notification emails will be halted.
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={form.isEnabled}
          onClick={() => setForm((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
            form.isEnabled ? "bg-[#3e63dd]" : "bg-[#d1d5db]"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
              form.isEnabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Quick Fill Presets */}
      <div>
        <label className="block text-xs font-semibold text-[#111827] mb-2">
          Quick Provider Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROVIDERS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors shadow-xs cursor-pointer",
                form.host === preset.host
                  ? "border-[#3e63dd] bg-blue-50/50 text-[#3e63dd] font-semibold"
                  : "border-[#e5e7eb] bg-white text-[#4b5563] hover:border-[#cbd5e1] hover:text-[#111827]"
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* SMTP Connection Parameters */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
          Server Connection
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Host */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              SMTP Host Server <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Server className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9ca3af]" />
              <Input
                type="text"
                placeholder="smtp.resend.com"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value.trim() })}
                className="pl-9 h-9 text-xs bg-white border-[#d1d5db] font-mono focus:border-[#3e63dd]"
              />
            </div>
          </div>

          {/* Port */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Port Number <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="587"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value, 10) || 587 })}
              className="h-9 text-xs bg-white border-[#d1d5db] font-mono focus:border-[#3e63dd]"
            />
          </div>
        </div>

        {/* Security / Encryption Method */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            Encryption Protocol
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <label
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors shadow-xs",
                !form.secure && form.port === 587
                  ? "border-[#3e63dd] bg-blue-50/40 text-[#111827]"
                  : "border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-gray-50"
              )}
            >
              <input
                type="radio"
                name="security"
                checked={!form.secure && form.port === 587}
                onChange={() => setForm({ ...form, secure: false, port: 587 })}
                className="text-[#3e63dd] focus:ring-[#3e63dd]"
              />
              <div>
                <span className="font-semibold block">STARTTLS (Port 587)</span>
                <span className="text-[10px] text-[#6b7280]">Standard for cloud relays</span>
              </div>
            </label>

            <label
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors shadow-xs",
                form.secure
                  ? "border-[#3e63dd] bg-blue-50/40 text-[#111827]"
                  : "border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-gray-50"
              )}
            >
              <input
                type="radio"
                name="security"
                checked={form.secure}
                onChange={() => setForm({ ...form, secure: true, port: 465 })}
                className="text-[#3e63dd] focus:ring-[#3e63dd]"
              />
              <div>
                <span className="font-semibold block">SSL / TLS (Port 465)</span>
                <span className="text-[10px] text-[#6b7280]">Direct TLS encryption</span>
              </div>
            </label>

            <label
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors shadow-xs",
                !form.secure && form.port === 25
                  ? "border-[#3e63dd] bg-blue-50/40 text-[#111827]"
                  : "border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-gray-50"
              )}
            >
              <input
                type="radio"
                name="security"
                checked={!form.secure && form.port === 25}
                onChange={() => setForm({ ...form, secure: false, port: 25 })}
                className="text-[#3e63dd] focus:ring-[#3e63dd]"
              />
              <div>
                <span className="font-semibold block">Plain / None (Port 25)</span>
                <span className="text-[10px] text-[#6b7280]">Internal localhost relays</span>
              </div>
            </label>
          </div>
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              SMTP Username / API Key
            </label>
            <Input
              type="text"
              placeholder="resend, apikey, or username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.trim() })}
              className="h-9 text-xs bg-white border-[#d1d5db] font-mono focus:border-[#3e63dd]"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#374151]">
                SMTP Password / Secret
              </label>
              {form.hasPassword && (
                <span className="text-[10px] text-emerald-600 font-medium">
                  Password saved
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={form.hasPassword ? "••••••••" : "Enter password"}
                value={form.password || ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-9 text-xs bg-white border-[#d1d5db] font-mono pr-9 focus:border-[#3e63dd]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-[#9ca3af] hover:text-[#111827] transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sender Information */}
      <div className="space-y-3 pt-3 border-t border-[#e5e7eb]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
          Sender Headers
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              From Name <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Space Notifications"
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              className="h-9 text-xs bg-white border-[#d1d5db] focus:border-[#3e63dd]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              From Email <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="notifications@yourdomain.com"
              value={form.fromEmail}
              onChange={(e) => setForm({ ...form, fromEmail: e.target.value.trim() })}
              className="h-9 text-xs bg-white border-[#d1d5db] focus:border-[#3e63dd]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Reply-To Address (Optional)
            </label>
            <Input
              type="email"
              placeholder="support@yourdomain.com"
              value={form.replyTo || ""}
              onChange={(e) => setForm({ ...form, replyTo: e.target.value.trim() })}
              className="h-9 text-xs bg-white border-[#d1d5db] focus:border-[#3e63dd]"
            />
          </div>
        </div>
      </div>

      {/* Event Notification Toggles */}
      <div className="space-y-3 pt-3 border-t border-[#e5e7eb]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
          Notification Triggers
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-2.5 rounded-lg border border-[#e5e7eb] p-3 bg-white hover:bg-[#f8f9fa] transition-colors cursor-pointer shadow-xs">
            <input
              type="checkbox"
              checked={form.notifyOnIssueCreated ?? true}
              onChange={(e) => setForm({ ...form, notifyOnIssueCreated: e.target.checked })}
              className="mt-0.5 rounded text-[#3e63dd] focus:ring-[#3e63dd]"
            />
            <div>
              <span className="font-semibold text-[#111827] block">Issue Creation</span>
              <span className="text-[11px] text-[#6b7280]">Notify assignees and project lead when a new issue is filed</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-lg border border-[#e5e7eb] p-3 bg-white hover:bg-[#f8f9fa] transition-colors cursor-pointer shadow-xs">
            <input
              type="checkbox"
              checked={form.notifyOnIssueAssigned}
              onChange={(e) => setForm({ ...form, notifyOnIssueAssigned: e.target.checked })}
              className="mt-0.5 rounded text-[#3e63dd] focus:ring-[#3e63dd]"
            />
            <div>
              <span className="font-semibold text-[#111827] block">Issue Assignment</span>
              <span className="text-[11px] text-[#6b7280]">Dispatch email when an issue is assigned to a team member</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-lg border border-[#e5e7eb] p-3 bg-white hover:bg-[#f8f9fa] transition-colors cursor-pointer shadow-xs">
            <input
              type="checkbox"
              checked={form.notifyOnIssueStatusChanged}
              onChange={(e) => setForm({ ...form, notifyOnIssueStatusChanged: e.target.checked })}
              className="mt-0.5 rounded text-[#3e63dd] focus:ring-[#3e63dd]"
            />
            <div>
              <span className="font-semibold text-[#111827] block">State Changes</span>
              <span className="text-[11px] text-[#6b7280]">Notify assignee and creator when an issue moves to Done or Canceled</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-lg border border-[#e5e7eb] p-3 bg-white hover:bg-[#f8f9fa] transition-colors cursor-pointer shadow-xs">
            <input
              type="checkbox"
              checked={form.notifyOnIssueComment}
              onChange={(e) => setForm({ ...form, notifyOnIssueComment: e.target.checked })}
              className="mt-0.5 rounded text-[#3e63dd] focus:ring-[#3e63dd]"
            />
            <div>
              <span className="font-semibold text-[#111827] block">Comments & Mentions</span>
              <span className="text-[11px] text-[#6b7280]">Notify participants when comments or @mentions occur on issues</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-lg border border-[#e5e7eb] p-3 bg-white hover:bg-[#f8f9fa] transition-colors cursor-pointer shadow-xs">
            <input
              type="checkbox"
              checked={form.notifyOnPriorityOrDueDate ?? true}
              onChange={(e) =>
                setForm({ ...form, notifyOnPriorityOrDueDate: e.target.checked })
              }
              className="mt-0.5 rounded text-[#3e63dd] focus:ring-[#3e63dd]"
            />
            <div>
              <span className="font-semibold text-[#111827] block">Priority & Due Date Updates</span>
              <span className="text-[11px] text-[#6b7280]">Notify assignees and reporter when priority escalates or delivery target changes</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-lg border border-[#e5e7eb] p-3 bg-white hover:bg-[#f8f9fa] transition-colors cursor-pointer shadow-xs">
            <input
              type="checkbox"
              checked={form.notifyOnCycleDigest}
              onChange={(e) => setForm({ ...form, notifyOnCycleDigest: e.target.checked })}
              className="mt-0.5 rounded text-[#3e63dd] focus:ring-[#3e63dd]"
            />
            <div>
              <span className="font-semibold text-[#111827] block">Cycle (Sprint) Digest</span>
              <span className="text-[11px] text-[#6b7280]">Weekly burndown summaries and upcoming sprint deadline reminders</span>
            </div>
          </label>
        </div>
      </div>

      {/* Last Test Results Footer Bar */}
      {form.lastTestedAt && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#e5e7eb] text-xs text-[#6b7280]">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Last verified: {new Date(form.lastTestedAt).toLocaleString()}
              {form.lastTestRecipient && ` to ${form.lastTestRecipient}`}
            </span>
          </div>

          <span
            className={cn(
              "font-semibold text-[11px]",
              form.lastTestStatus === "SUCCESS" ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {form.lastTestStatus === "SUCCESS" ? "Verification Passed (250 OK)" : `Failed: ${form.lastTestError || "Connection error"}`}
          </span>
        </div>
      )}

      {/* Test Email Modal */}
      {isTestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 font-sans"
          onClick={() => setIsTestModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl space-y-4 text-xs text-[#111827]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#3e63dd] border border-blue-100">
                  <Send className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-[#111827]">
                  Send Test Verification Email
                </h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-[#6b7280] hover:text-[#111827] text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6b7280]">
              {form.host.includes("resend") || form.password?.startsWith("re_") ? (
                <>
                  Space will deliver via <strong className="font-semibold text-[#111827]">Resend API Gateway (HTTPS Port 443 — Cloud Firewall Bypass)</strong> to guarantee delivery even when server hosting firewalls block port 587.
                </>
              ) : (
                <>
                  Space will initiate an SMTP handshake with <strong className="font-mono text-[#111827]">{form.host}:{form.port}</strong> and deliver an RFC-2822 verification message.
                </>
              )}
            </p>

            <form onSubmit={handleTestSend} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Recipient Email Address
                </label>
                <Input
                  autoFocus
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="h-9 text-xs bg-white border-[#d1d5db] focus:border-[#3e63dd]"
                />
              </div>

              {/* Status alerts */}
              {testMutation.isSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Test Email Dispatched Successfully!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    {testMutation.data?.message} (Latency: {testMutation.data?.latencyMs}ms)
                  </p>
                </div>
              )}

              {testMutation.isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-2">
                  <div className="font-semibold flex items-center gap-1.5 text-red-900">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Delivery Verification Failed</span>
                  </div>
                  <p className="text-[11px] text-red-700 font-mono break-all">
                    {(testMutation.error as Error).message}
                  </p>
                  {((testMutation.error as Error).message.toLowerCase().includes("domain") ||
                    (testMutation.error as Error).message.toLowerCase().includes("verify")) && (
                    <div className="pt-2 border-t border-red-200 flex flex-col gap-1.5">
                      <p className="text-[11px] text-red-800 font-medium">
                        Custom domain DNS records need verification in Resend. To test delivery immediately, switch to Resend&apos;s testing sender:
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = { ...form, fromEmail: "onboarding@resend.dev" };
                          setForm(updated);
                          await fetch(`/api/workspaces/${workspaceSlug}/settings/smtp`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updated),
                          });
                          queryClient.invalidateQueries({ queryKey: ["smtp-config", workspaceSlug] });
                          testMutation.reset();
                        }}
                        className="self-start text-[11px] font-semibold text-[#3e63dd] bg-white border border-blue-200 rounded px-2.5 py-1 hover:bg-blue-50 cursor-pointer shadow-xs transition-colors"
                      >
                        Switch sender to onboarding@resend.dev &amp; Retry
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible raw transcript */}
              {(testMutation.data?.transcript || (testMutation.error as any)?.transcript) && (
                <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="flex w-full items-center justify-between px-3 py-2 bg-[#f8f9fa] text-[11px] font-medium text-[#4b5563] hover:bg-[#f1f3f5] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-mono">
                      <Terminal className="h-3 w-3 text-[#6b7280]" />
                      <span>SMTP Protocol Handshake Logs</span>
                    </span>
                    {showTranscript ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {showTranscript && (
                    <div className="p-3 bg-[#111827] text-white font-mono text-[10px] max-h-48 overflow-y-auto space-y-0.5 leading-relaxed">
                      {(testMutation.data?.transcript || []).map((line: string, idx: number) => (
                        <div
                          key={idx}
                          className={cn(
                            line.startsWith(">") ? "text-cyan-400" : line.startsWith("< 250") ? "text-emerald-400" : "text-gray-300"
                          )}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTestModalOpen(false)}
                  className="cursor-pointer"
                >
                  Close
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={testMutation.isPending || !testRecipient}
                  className="bg-[#3e63dd] hover:bg-[#3451b2] text-white cursor-pointer"
                >
                  {testMutation.isPending ? "Sending..." : "Dispatch Test"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

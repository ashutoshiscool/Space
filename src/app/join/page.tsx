"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { Users, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

interface InviteData {
  id: string;
  email: string;
  role: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
}

function JoinWorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(() => !!token);
  const [error, setError] = useState<string | null>(() =>
    !token ? "No invitation token provided." : null
  );
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/invitations?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load invitation");
        }
        return res.json();
      })
      .then((data) => {
        setInvite(data.invite);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/join?token=${token}`);
          return;
        }
        throw new Error(data.error || "Failed to accept invitation");
      }

      setAccepted(true);
      setTimeout(() => {
        router.push(`/${data.workspaceSlug}`);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error accepting invitation";
      setError(msg);
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-[#6b7280]">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3e63dd] border-t-transparent" />
          <span>Verifying invitation...</span>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-[#111827] mb-2">Invalid Invitation</h2>
          <p className="text-xs text-[#6b7280] mb-6">{error || "This invitation is invalid or has expired."}</p>
          <Link href="/login">
            <Button variant="outline" className="w-full text-xs">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-[#111827] mb-2">Welcome to {invite.workspace.name}!</h2>
          <p className="text-xs text-[#6b7280] mb-6">Redirecting to your new workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#3e63dd] border border-[#e5e7eb]">
          <Users className="h-6 w-6" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">You&apos;ve Been Invited</h1>
          <p className="text-xs text-[#6b7280] mt-2">
            Join <span className="font-semibold text-[#111827]">{invite.workspace.name}</span> as a{" "}
            <span className="font-medium text-[#3e63dd] capitalize">{invite.role.toLowerCase()}</span>.
          </p>
        </div>

        <div className="rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3.5 mb-6 flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-[#6b7280] shrink-0" />
          <div className="text-xs text-[#6b7280]">
            Invitation for <span className="text-[#111827] font-mono">{invite.email}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-[#3e63dd] hover:bg-[#3451b2] text-white font-medium py-2 text-xs flex items-center justify-center gap-2 shadow-xs"
          >
            {accepting ? "Joining..." : "Accept Invitation"}
            {!accepting && <ArrowRight className="h-4 w-4" />}
          </Button>

          <p className="text-center text-xs text-[#6b7280]">
            Need an account?{" "}
            <Link
              href={`/register?redirect=/join?token=${token}`}
              className="text-[#3e63dd] hover:underline"
            >
              Sign up
            </Link>{" "}
            or{" "}
            <Link
              href={`/login?redirect=/join?token=${token}`}
              className="text-[#3e63dd] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-[#6b7280] text-xs">
          Loading invitation...
        </div>
      }
    >
      <JoinWorkspaceContent />
    </Suspense>
  );
}

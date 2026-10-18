"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span>Verifying invitation...</span>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#121215] p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Invitation</h2>
          <p className="text-sm text-zinc-400 mb-6">{error || "This invitation is invalid or has expired."}</p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#121215] p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome to {invite.workspace.name}!</h2>
          <p className="text-sm text-zinc-400 mb-6">Redirecting to your new workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#121215] p-8 shadow-2xl">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Users className="h-7 w-7" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">You&apos;ve Been Invited</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Join <span className="font-semibold text-zinc-200">{invite.workspace.name}</span> as a{" "}
            <span className="font-medium text-indigo-400 capitalize">{invite.role.toLowerCase()}</span>.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4 mb-6 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-zinc-400 shrink-0" />
          <div className="text-xs text-zinc-400">
            Invitation for <span className="text-zinc-200 font-mono">{invite.email}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 flex items-center justify-center gap-2"
          >
            {accepting ? "Joining..." : "Accept Invitation"}
            {!accepting && <ArrowRight className="h-4 w-4" />}
          </Button>

          <p className="text-center text-xs text-zinc-500">
            Need an account?{" "}
            <Link
              href={`/register?redirect=/join?token=${token}`}
              className="text-indigo-400 hover:underline"
            >
              Sign up
            </Link>{" "}
            or{" "}
            <Link
              href={`/login?redirect=/join?token=${token}`}
              className="text-indigo-400 hover:underline"
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
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">
          Loading invitation...
        </div>
      }
    >
      <JoinWorkspaceContent />
    </Suspense>
  );
}

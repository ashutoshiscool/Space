"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, Sparkles } from "lucide-react";

function LoginFormContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (data.user?.memberships?.[0]?.workspace?.slug) {
        const slug = data.user.memberships[0].workspace.slug;
        router.push(`/${slug}`);
      } else {
        router.push("/create-workspace");
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword("password123");
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-[#121215] p-8 shadow-2xl">
      <div className="space-y-2 text-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/20 mb-2">
          🚀
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in to Space</h1>
        <p className="text-xs text-zinc-400">
          Next-gen issue tracker and product planning system
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="text-zinc-400 block mb-1">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label className="text-zinc-400 block mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-2 font-semibold">
          {loading ? "Signing in..." : "Continue to Space"}
        </Button>
      </form>

      {/* Quick Demo Switcher */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          <span>One-Click Demo Profiles</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickLogin("alex@space.dev")}
            className="flex items-center justify-between rounded bg-zinc-900 px-2.5 py-1.5 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <span>Alex Rivera <strong className="text-indigo-400 font-normal">(Owner)</strong></span>
            <span className="text-[10px] text-zinc-500 font-mono">alex@space.dev</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("sarah@space.dev")}
            className="flex items-center justify-between rounded bg-zinc-900 px-2.5 py-1.5 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <span>Sarah Chen <strong className="text-purple-400 font-normal">(Admin)</strong></span>
            <span className="text-[10px] text-zinc-500 font-mono">sarah@space.dev</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-indigo-400 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b] p-4 text-zinc-100">
      <Suspense fallback={<div className="text-xs text-zinc-500">Loading...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

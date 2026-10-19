"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

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
        if (data.requiresVerification && data.email) {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
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
    <div className="w-full max-w-sm space-y-6 rounded-xl border border-[#e5e7eb] bg-white p-7 shadow-xl font-sans">
      <div className="space-y-2 text-center flex flex-col items-center">
        <Logo size="md" showText={false} className="mb-1" />
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">Sign in to Space</h1>
        <p className="text-xs text-[#6b7280]">
          Enter your credentials to access your workspace
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="text-[#374151] block mb-1 font-medium">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#9ca3af]" />
            <Input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 h-9 text-xs bg-white border-[#d1d5db] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd]"
            />
          </div>
        </div>

        <div>
          <label className="text-[#374151] block mb-1 font-medium">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#9ca3af]" />
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 h-9 text-xs bg-white border-[#d1d5db] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd]"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-9 mt-1 text-xs font-medium bg-[#3e63dd] hover:bg-[#3451b2] text-white shadow-xs cursor-pointer"
        >
          {loading ? "Signing in..." : "Continue"}
        </Button>
      </form>

      {/* Quick Demo Switcher */}
      <div className="rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3 space-y-2 text-xs">
        <div className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider">
          Demo Accounts
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickLogin("alex@space.dev")}
            className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-left text-[#111827] hover:border-[#3e63dd] shadow-xs transition-colors cursor-pointer"
          >
            <span className="font-medium text-xs">Alex Rivera <span className="text-[10px] text-[#3e63dd] font-mono">(Owner)</span></span>
            <span className="text-[10px] text-[#6b7280] font-mono">alex@space.dev</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("sarah@space.dev")}
            className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-left text-[#111827] hover:border-[#3e63dd] shadow-xs transition-colors cursor-pointer"
          >
            <span className="font-medium text-xs">Sarah Chen <span className="text-[10px] text-purple-600 font-mono">(Admin)</span></span>
            <span className="text-[10px] text-[#6b7280] font-mono">sarah@space.dev</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-[#6b7280]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-[#3e63dd] hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fa] p-4 text-[#111827]">
      <Suspense fallback={<div className="text-xs text-[#6b7280]">Loading...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

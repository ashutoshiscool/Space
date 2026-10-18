"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, User, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/create-workspace");
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b] p-4 text-zinc-100">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-[#121215] p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/20 mb-2">
            🚀
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-xs text-zinc-400">
            Join Space to build and ship software at lightspeed
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                required
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="email"
                required
                placeholder="ada@company.com"
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
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2 font-semibold">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

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

      if (data.requiresVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else {
        router.push("/create-workspace");
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fa] p-4 text-[#111827] font-sans">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-[#e5e7eb] bg-white p-7 shadow-xl">
        <div className="space-y-2 text-center flex flex-col items-center">
          <Logo size="md" showText={false} className="mb-1" />
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">Create your account</h1>
          <p className="text-xs text-[#6b7280]">
            Get started with modern issue tracking and planning
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[#374151] block mb-1 font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-[#9ca3af]" />
              <Input
                type="text"
                required
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9 h-9 text-xs bg-white border-[#d1d5db] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3e63dd]"
              />
            </div>
          </div>

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
            {loading ? "Creating account..." : "Get started"}
          </Button>
        </form>

        <div className="text-center text-xs text-[#6b7280]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#3e63dd] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

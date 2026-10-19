"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, KeyRound } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";
  const redirectUrl = searchParams.get("redirect") || "/create-workspace";

  const [code, setCode] = useState("");
  const [email, setEmail] = useState(emailFromUrl);
  const [verifying, setVerifying] = useState(Boolean(tokenFromUrl));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Auto-verify if token is provided in URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerify = async (tokenOrCode: string) => {
    setError("");
    setVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenOrCode.length > 10 ? tokenOrCode : undefined,
          code: tokenOrCode.length <= 10 ? tokenOrCode : undefined,
          email: email || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to verify email address");
        setVerifying(false);
        return;
      }

      setSuccess(true);
      setVerifying(false);

      // Redirect after brief visual confirmation
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
    } catch {
      setError("An unexpected network error occurred");
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    handleVerify(code.trim());
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setResendMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend verification email");
      } else {
        setResendMessage("Verification email dispatched! Check your inbox.");
        setCooldown(60);
      }
    } catch {
      setError("Failed to reach server");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fa] p-4 text-[#111827] font-sans">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-xl">
        <div className="space-y-2 text-center flex flex-col items-center">
          <Logo size="md" showText={false} className="mb-1" />
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">
            {success
              ? "Email Verified!"
              : verifying
              ? "Verifying Your Email..."
              : "Check your inbox"}
          </h1>
          <p className="text-xs text-[#6b7280]">
            {success
              ? "Your account has been activated. Redirecting to Space..."
              : verifying
              ? "Please wait while we confirm your cryptographic token..."
              : email
              ? `We sent a verification link to ${email}`
              : "Please confirm your email address to activate your account"}
          </p>
        </div>

        {/* Success State */}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2 animate-in fade-in-0">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="text-xs font-semibold text-emerald-900">
              Email Address Verified
            </div>
            <p className="text-[11px] text-emerald-700">
              Session established. You will be redirected in a moment...
            </p>
          </div>
        )}

        {/* Verifying Spinner */}
        {verifying && !success && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <RefreshCw className="h-8 w-8 text-[#3e63dd] animate-spin" />
            <span className="text-xs text-[#6b7280]">Validating verification token...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-red-900">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>Verification Failed</span>
            </div>
            <p className="text-[11px] text-red-600">{error}</p>
          </div>
        )}

        {/* Resend Success Alert */}
        {resendMessage && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-[#3e63dd] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{resendMessage}</span>
          </div>
        )}

        {/* Manual Code Entry Form */}
        {!success && !verifying && (
          <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[#374151] block mb-1 font-medium">
                6-digit verification code or token
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-[#9ca3af]" />
                <Input
                  type="text"
                  placeholder="e.g. 849201"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white border-[#d1d5db] text-[#111827] font-mono placeholder:font-sans focus:border-[#3e63dd]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!code.trim()}
              className="w-full h-9 bg-[#3e63dd] hover:bg-[#3451b2] text-white text-xs font-medium cursor-pointer shadow-xs"
            >
              <span>Confirm Verification Code</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>

            <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-xs text-[#6b7280]">
              <span>Didn&apos;t receive an email?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0 || !email}
                className="font-medium text-[#3e63dd] hover:underline disabled:opacity-50 cursor-pointer"
              >
                {resending
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend email"}
              </button>
            </div>
          </form>
        )}

        {/* Back to sign in / register */}
        <div className="text-center text-xs text-[#6b7280] pt-2">
          <span>Already verified? </span>
          <Link href="/login" className="font-medium text-[#3e63dd] hover:underline">
            Sign in &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fa] text-xs text-[#6b7280]">
          Loading verification...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

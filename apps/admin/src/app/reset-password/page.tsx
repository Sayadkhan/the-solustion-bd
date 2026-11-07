"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api-client";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

/** Without a token this asks for an email. With one, from the email link, it sets a new password. */
export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (token && password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = token
        ? await adminApi.resetPassword(token, password)
        : await adminApi.forgotPassword(email.trim());
      if (res?.success) {
        setDone(res.message);
      } else {
        setError(res?.message || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex justify-center items-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-5">
        <h1 className="text-xl font-bold text-foreground">{token ? "Choose a new password" : "Reset your password"}</h1>

        {done ? (
          <p className="text-sm text-success">{done}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-xs text-destructive">{error}</p>}

            {token ? (
              <>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (at least 8 characters)"
                  className={inputClass}
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={inputClass}
                />
              </>
            ) : (
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your account email"
                className={inputClass}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm disabled:opacity-50"
            >
              {loading ? "Please wait…" : token ? "Update Password" : "Send Reset Link"}
            </button>
          </form>
        )}

        <Link href="/login" className="block text-center text-xs text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}

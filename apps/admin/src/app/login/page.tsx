"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/api-client";
import { setAdminSession, isAuthenticated, getAdminUser } from "@/lib/auth";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Search,
  Crown,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect away from login
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getAdminUser();
      if (user?.role === "SEO_MANAGER") {
        router.push("/seo");
      } else {
        router.push("/");
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email/phone and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await adminApi.login({
        email: email.trim(),
        password: password.trim(),
      });

      if (res?.success && res?.user && res?.accessToken) {
        setAdminSession(res.accessToken, res.user);

        // Redirect based on role
        const redirectParam = searchParams.get("redirect");
        if (redirectParam) {
          router.push(redirectParam);
        } else if (res.user.role === "SEO_MANAGER") {
          router.push("/seo");
        } else {
          router.push("/");
        }
      } else {
        setErrorMessage(res?.message || "Invalid email or password. Please verify your credentials.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type: "SUPER_ADMIN" | "SEO_MANAGER") => {
    if (type === "SUPER_ADMIN") {
      setEmail("admin@thesolutionsbd.com");
      setPassword("admin123");
    } else {
      setEmail("seo@thesolutionsbd.com");
      setPassword("seo123");
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows & Ambience */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-xl shadow-blue-500/10 border border-slate-800">
            <img src="/logo.png" alt="The Solutions BD" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            The Solutions BD
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30 font-semibold">
              Admin Portal
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Secure Role-Based Access Control • High-Performance Tech Management
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            Quick Demo Login Accounts:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("SUPER_ADMIN")}
              className="flex flex-col items-start p-2.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-blue-500/50 transition-all text-left group"
            >
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Super Admin
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Full System Access</span>
              <span className="text-[9px] text-blue-400 font-mono mt-1 group-hover:underline">
                admin@thesolutionsbd.com
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials("SEO_MANAGER")}
              className="flex flex-col items-start p-2.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-emerald-500/50 transition-all text-left group"
            >
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                SEO Sub-Admin
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Blogs, GTM & Traffic Only</span>
              <span className="text-[9px] text-emerald-400 font-mono mt-1 group-hover:underline">
                seo@thesolutionsbd.com
              </span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl shadow-black/60 space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email / Identifier */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thesolutionsbd.com or phone"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">TLS 1.3 256-bit</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Protected by Cloud Auth
          </span>
          <span>•</span>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 underline underline-offset-2"
          >
            Visit Live Storefront
          </a>
        </div>
      </div>
    </div>
  );
}

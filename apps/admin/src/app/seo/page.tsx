"use client";

import React, { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { adminApi } from "@/lib/api-client";
import {
  Search,
  Tag,
  Globe,
  Code2,
  CheckCircle2,
  Save,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Sparkles,
  BarChart3,
  FileText,
  Activity,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function SeoSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tracking" | "metadata" | "robots" | "scripts">("tracking");

  // Form State
  const [seoData, setSeoData] = useState({
    gtmId: "",
    gaMeasurementId: "",
    googleSearchConsoleCode: "",
    facebookPixelId: "",
    defaultMetaTitle: "",
    defaultMetaDescription: "",
    defaultMetaKeywords: "",
    robotsTxt: "",
    customHeadScript: "",
    customBodyScript: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSettings();
      if (res?.data) {
        setSeoData({
          gtmId: res.data.gtmId || "",
          gaMeasurementId: res.data.gaMeasurementId || "",
          googleSearchConsoleCode: res.data.googleSearchConsoleCode || "",
          facebookPixelId: res.data.facebookPixelId || "",
          defaultMetaTitle:
            res.data.defaultMetaTitle ||
            "The Solutions BD | High-Performance PC & Tech Store in Bangladesh",
          defaultMetaDescription:
            res.data.defaultMetaDescription ||
            "Buy authentic Processors, Graphics Cards, Motherboards, Gaming PCs & Tech Hardware in Bangladesh at lowest prices with official warranty from The Solutions BD.",
          defaultMetaKeywords:
            res.data.defaultMetaKeywords ||
            "computer shop bd, pc price bangladesh, gaming pc bd, ryzen processor price bd, graphics card bd",
          robotsTxt:
            res.data.robotsTxt ||
            "User-agent: *\nAllow: /\nSitemap: https://thesolutionsbd.com/sitemap.xml",
          customHeadScript: res.data.customHeadScript || "",
          customBodyScript: res.data.customBodyScript || "",
        });
      }
    } catch (err) {
      console.error("Failed to load SEO settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await adminApi.updateSettings(seoData);
      if (res?.success) {
        showToast("SEO & Google Tag Manager settings saved successfully!");
      } else {
        alert(res?.message || "Failed to save SEO settings.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="SEO & Tag Manager Hub"
      subtitle="Manage Google Tag Manager, Analytics, Search Console, Meta Tags & Crawlers"
      onRefresh={loadData}
      isRefreshing={loading}
      actions={
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm shadow-primary/25 disabled:opacity-50 transition-all"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Changes</span>
        </button>
      }
    >
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-medium shadow-2xl shadow-emerald-500/30 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick Access Quick Action Cards for Sub-Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/blogs"
          className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all group flex items-start gap-3"
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1">
              Tech Blogs & Content
              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Publish SEO articles, manage backlinks & tags
            </div>
          </div>
        </Link>

        <Link
          href="/traffic"
          className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/50 transition-all group flex items-start gap-3"
        >
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1">
              Traffic & Analytics
              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-emerald-500" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Monitor daily visitors, top keywords & bounce rates
            </div>
          </div>
        </Link>

        <Link
          href="/banners"
          className="p-4 rounded-xl border border-border bg-card hover:border-purple-500/50 transition-all group flex items-start gap-3"
        >
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1">
              Promotional Banners
              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-purple-500" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Hero carousel banners & campaign creative
            </div>
          </div>
        </Link>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("tracking")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "tracking"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Google Tag Manager & Tracking IDs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("metadata")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "metadata"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Meta Tags & Search Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("robots")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "robots"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Robots.txt & Sitemap</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scripts")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "scripts"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Custom Header & Footer Scripts</span>
        </button>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Tracking & Tag Manager */}
        {activeTab === "tracking" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Google Tag Manager (GTM)</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Automatically injects Google Tag Manager scripts into all storefront pages
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    seoData.gtmId
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {seoData.gtmId ? "GTM ACTIVE" : "NOT CONFIGURED"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>GTM Container ID</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Format: GTM-XXXXXXX</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GTM-N9X3KL7"
                    value={seoData.gtmId}
                    onChange={(e) => setSeoData({ ...seoData, gtmId: e.target.value.trim().toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Find this in your Google Tag Manager Workspace header.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-col justify-center text-xs space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    How GTM Container Works:
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Once saved, the storefront will render both head script tag and body noscript iframe. You can manage Google Analytics, Google Ads, Meta Pixel, and heatmaps without touching code.
                  </p>
                </div>
              </div>
            </div>

            {/* Google Analytics 4 & Search Console */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Google Analytics 4 & Search Console</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Connect web property measurements and Google webmaster search console
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Google Analytics 4 Measurement ID</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Format: G-XXXXXXXXXX</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. G-8J4K9L2M1P"
                    value={seoData.gaMeasurementId}
                    onChange={(e) =>
                      setSeoData({ ...seoData, gaMeasurementId: e.target.value.trim().toUpperCase() })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Streams direct visitor events to Google Analytics Data Stream.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Google Search Console Verification Tag / Code</span>
                    <span className="text-[10px] text-muted-foreground font-mono">HTML Meta Content</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5x_abC123def456ghi789jkl..."
                    value={seoData.googleSearchConsoleCode}
                    onChange={(e) => setSeoData({ ...seoData, googleSearchConsoleCode: e.target.value.trim() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Verifies domain ownership in Google Search Console for indexing.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Meta (Facebook) Pixel ID</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Pixel ID Number</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 192837465019283"
                    value={seoData.facebookPixelId}
                    onChange={(e) => setSeoData({ ...seoData, facebookPixelId: e.target.value.trim() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Tracks e-commerce page views and conversions for Facebook and Instagram Ads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Metadata & Global SEO */}
        {activeTab === "metadata" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Global Title & Meta Description</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Default metadata served across homepage and fallback catalog pages
                  </p>
                </div>
              </div>

              {/* SERP Search Result Preview */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 space-y-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Google Search Snippet Preview
                </div>
                <div className="text-xs text-slate-400 font-mono">https://thesolutionsbd.com</div>
                <div className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer">
                  {seoData.defaultMetaTitle || "The Solutions BD | High-Performance PC & Tech Store in Bangladesh"}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {seoData.defaultMetaDescription ||
                    "Buy authentic Processors, Graphics Cards, Motherboards, Gaming PCs & Tech Hardware in Bangladesh at lowest prices with official warranty from The Solutions BD."}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>Default Meta Title</span>
                    <span
                      className={`text-[10px] font-mono ${
                        seoData.defaultMetaTitle.length > 70
                          ? "text-amber-500 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {seoData.defaultMetaTitle.length} / 70 characters (Recommended: 50-65)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoData.defaultMetaTitle}
                    onChange={(e) => setSeoData({ ...seoData, defaultMetaTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>Default Meta Description</span>
                    <span
                      className={`text-[10px] font-mono ${
                        seoData.defaultMetaDescription.length > 165
                          ? "text-amber-500 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {seoData.defaultMetaDescription.length} / 165 characters (Recommended: 120-155)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoData.defaultMetaDescription}
                    onChange={(e) => setSeoData({ ...seoData, defaultMetaDescription: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>Default Keywords (Comma Separated)</span>
                    <span className="text-[10px] text-muted-foreground">High-intent Bangladesh search terms</span>
                  </div>
                  <textarea
                    rows={2}
                    value={seoData.defaultMetaKeywords}
                    onChange={(e) => setSeoData({ ...seoData, defaultMetaKeywords: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Robots.txt & Sitemap */}
        {activeTab === "robots" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Robots.txt Engine & Directives</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Controls how Googlebot, Bingbot and search engine spiders crawl the store
                    </p>
                  </div>
                </div>
                <a
                  href="http://localhost:3000/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                >
                  <span>View Live robots.txt</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={8}
                  value={seoData.robotsTxt}
                  onChange={(e) => setSeoData({ ...seoData, robotsTxt: e.target.value })}
                  className="w-full p-4 rounded-xl border border-border bg-slate-950 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Ensure the sitemap reference points to <span className="font-mono text-foreground">https://thesolutionsbd.com/sitemap.xml</span>
                </p>
              </div>

              {/* Sitemap Status Card */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold text-foreground">XML Sitemap Auto-Generation</div>
                    <div className="text-[11px] text-muted-foreground">
                      Automatically indexes products, categories, tech blogs, and institutional pages
                    </div>
                  </div>
                </div>
                <a
                  href="http://localhost:3000/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted transition-all flex items-center gap-1.5"
                >
                  <span>Inspect sitemap.xml</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Custom Scripts */}
        {activeTab === "scripts" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Custom Header & Footer Code Injection</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Insert third-party tracking scripts, chat widgets, verification meta tags, or conversion snippets
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Custom &lt;head&gt; Scripts</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Executes inside document &lt;head&gt;</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="<!-- Add custom <script> or <meta> tags here -->"
                    value={seoData.customHeadScript}
                    onChange={(e) => setSeoData({ ...seoData, customHeadScript: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-border bg-slate-950 font-mono text-xs text-sky-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Custom &lt;body&gt; Footer Scripts</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Executes before closing &lt;/body&gt;</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="<!-- Add custom chat widgets or conversion triggers here -->"
                    value={seoData.customBodyScript}
                    onChange={(e) => setSeoData({ ...seoData, customBodyScript: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-border bg-slate-950 font-mono text-xs text-amber-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div className="text-xs text-muted-foreground">
            Role: <span className="font-semibold text-foreground">SEO Sub-Admin / Super Admin</span> • Changes sync instantly to storefront cache
          </div>
          <button
            type="submit"
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save SEO Settings</span>
          </button>
        </div>
      </form>
    </AdminShell>
  );
}

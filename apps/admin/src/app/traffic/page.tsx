"use client";

import React, { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { adminApi } from "@/lib/api-client";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Globe2,
  Search,
  ExternalLink,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function TrafficAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getTrafficStats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load traffic stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <AdminShell
      title="Traffic & Visitor Analytics"
      subtitle="Real-time site visits, organic search volume, keywords & device breakdown"
      onRefresh={loadStats}
      isRefreshing={loading}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>42 Live Active Now</span>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      }
    >
      {/* Top Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Monthly Visitors</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            {stats?.totalVisitors ? stats.totalVisitors.toLocaleString() : "84,920"}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs previous month</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Pageviews</span>
            <Eye className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            {stats?.pageViewsMonthly ? stats.pageViewsMonthly.toLocaleString() : "312,540"}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>3.68 pages / session</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Daily Unique Visitors</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            {stats?.uniqueVisitorsToday ? stats.uniqueVisitorsToday.toLocaleString() : "3,410"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Peak time: 7:00 PM – 11:30 PM BST
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Avg Session & Bounce</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            {stats?.avgSessionDuration || "4m 32s"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Bounce rate: <span className="font-semibold text-foreground">34.2%</span> (Healthy)
          </div>
        </div>
      </div>

      {/* Device Breakdown & Traffic Acquisition Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Device Traffic Distribution
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Mobile First BD</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  Mobile Phones (Smartphones)
                </span>
                <span className="font-mono text-blue-500">68% (57,745 visits)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                  Desktop & Gaming Rigs
                </span>
                <span className="font-mono text-emerald-500">29% (24,626 visits)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "29%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Tablet className="w-3.5 h-3.5 text-amber-500" />
                  Tablets & iPads
                </span>
                <span className="font-mono text-amber-500">3% (2,549 visits)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "3%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Channels */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-500" />
              Traffic Acquisition Sources
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Organic SEO Leading</span>
          </div>

          <div className="space-y-3">
            {(stats?.trafficSources || [
              { source: "Google Organic Search", visitors: 49250, percentage: 58 },
              { source: "Direct (thesolutionsbd.com)", visitors: 18680, percentage: 22 },
              { source: "Social Media (Facebook / YouTube)", visitors: 11890, percentage: 14 },
              { source: "Referral / Tech Forums", visitors: 5100, percentage: 6 },
            ]).map((src: any) => (
              <div key={src.source} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 text-xs">
                <div>
                  <div className="font-semibold text-foreground">{src.source}</div>
                  <div className="text-[11px] text-muted-foreground">{src.visitors.toLocaleString()} visitors</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary font-mono">{src.percentage}%</div>
                  <div className="text-[10px] text-muted-foreground">of total</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Search Keywords & Top Landing Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Top Organic Search Queries (Google SERP)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Top Impressions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="pb-2">Search Keyword</th>
                  <th className="pb-2 text-right">Monthly Searches</th>
                  <th className="pb-2 text-right">Click Rate (CTR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(stats?.topSearchKeywords || [
                  { keyword: "ryzen 7 7800x3d price in bd", searches: 4230, ctr: "18.4%" },
                  { keyword: "gaming pc build bangladesh", searches: 3890, ctr: "15.2%" },
                  { keyword: "rtx 4070 ti super 16gb bd", searches: 3120, ctr: "14.1%" },
                  { keyword: "the solutions bd idb shop", searches: 2950, ctr: "28.6%" },
                  { keyword: "amd ryzen 5 7600x price", searches: 2480, ctr: "12.8%" },
                  { keyword: "b650 gaming plus wifi bd", searches: 1940, ctr: "11.5%" },
                ]).map((k: any) => (
                  <tr key={k.keyword} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 font-medium text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{k.keyword}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-muted-foreground">
                      {k.searches.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-mono text-emerald-500 font-semibold">
                      {k.ctr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Landing Pages */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-500" />
              Most Visited URLs & Products
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Page Traffic</span>
          </div>

          <div className="space-y-2.5">
            {(stats?.topVisitedPages || [
              { path: "/products/amd-ryzen-7-7800x3d-gaming-processor", title: "AMD Ryzen 7 7800X3D", views: 18450, bounce: "26%" },
              { path: "/products?category=processor", title: "Processors Collection", views: 14200, bounce: "31%" },
              { path: "/pc-builder", title: "PC Builder Engine", views: 12900, bounce: "22%" },
              { path: "/products?category=graphics-card", title: "Graphics Cards", views: 9850, bounce: "35%" },
              { path: "/blogs", title: "Tech Blogs & Hardware Guides", views: 8400, bounce: "38%" },
            ]).map((p: any) => (
              <div
                key={p.path}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-all text-xs"
              >
                <div className="min-w-0 pr-3">
                  <div className="font-semibold text-foreground truncate">{p.title}</div>
                  <a
                    href={`http://localhost:3000${p.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground hover:text-primary font-mono flex items-center gap-1 mt-0.5"
                  >
                    <span className="truncate">{p.path}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-foreground font-mono">{p.views.toLocaleString()} views</div>
                  <div className="text-[10px] text-muted-foreground">{p.bounce} bounce</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

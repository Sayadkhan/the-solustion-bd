"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import {
  Settings,
  Save,
  CheckCircle2,
  DollarSign,
  Phone,
  Mail,
  Zap,
  ShieldCheck,
  Search,
  Database,
  Sliders,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [settingsData, setSettingsData] = useState({
    hotlineNumber: "+880 1700-000000",
    whatsappNumber: "+880 1700-000000",
    contactEmail: "support@thesolusationbd.com",
    usdToBdtRate: "122.50",
    headerNoticeText:
      "⚡ Special Flash Sale: Get instant cash discount on selected Intel 14th Gen & AMD Ryzen 9000 Processors!",
  });

  // System Configuration Audit Log / Items for Table
  const [configSearch, setConfigSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSettings();
      if (res?.data) {
        setSettingsData((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
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
      const res = await adminApi.updateSettings(settingsData);
      if (res?.success) {
        showToast("System settings updated and saved successfully!");
      } else {
        alert(res?.message || "Failed to save settings.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // System Config Entries for the Table
  const systemConfigs = useMemo(() => {
    return [
      {
        id: "HOTLINE_NUMBER",
        key: "store.hotline",
        label: "Customer Hotline Phone",
        value: settingsData.hotlineNumber,
        category: "Contact",
        status: "Active",
      },
      {
        id: "WHATSAPP_NUMBER",
        key: "store.whatsapp",
        label: "WhatsApp Support Hotline",
        value: settingsData.whatsappNumber,
        category: "Contact",
        status: "Active",
      },
      {
        id: "SUPPORT_EMAIL",
        key: "store.email",
        label: "Official Support Email",
        value: settingsData.contactEmail,
        category: "Contact",
        status: "Active",
      },
      {
        id: "USD_BDT_RATE",
        key: "finance.usd_bdt_rate",
        label: "USD to BDT Currency Rate",
        value: `৳ ${settingsData.usdToBdtRate}`,
        category: "Finance",
        status: "Active",
      },
      {
        id: "COD_DEPOSIT_OUTSIDE_DHAKA",
        key: "order.rule_4_5.outside_dhaka_cod_deposit",
        label: "Outside Dhaka COD Advance Deposit (Rule 4.5)",
        value: "৳ 1,000",
        category: "Orders & Logistics",
        status: "Enforced",
      },
      {
        id: "PSU_HEADROOM_SAFETY",
        key: "builder.rule_4_3.psu_headroom_multiplier",
        label: "PSU Headroom Safety Multiplier (Rule 4.3)",
        value: "1.25x (125% Estimated TDP)",
        category: "PC Builder Engine",
        status: "Enforced",
      },
      {
        id: "HEADER_NOTICE_TEXT",
        key: "banner.header_notice",
        label: "Storefront Header Notice Banner",
        value: settingsData.headerNoticeText,
        category: "Marketing",
        status: "Active",
      },
    ];
  }, [settingsData]);

  // Filtered config entries
  const filteredConfigs = useMemo(() => {
    return systemConfigs.filter((cfg) => {
      const q = configSearch.toLowerCase();
      return (
        cfg.key.toLowerCase().includes(q) ||
        cfg.label.toLowerCase().includes(q) ||
        cfg.value.toLowerCase().includes(q) ||
        cfg.category.toLowerCase().includes(q)
      );
    });
  }, [systemConfigs, configSearch]);

  const totalItems = filteredConfigs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedConfigs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredConfigs.slice(start, start + itemsPerPage);
  }, [filteredConfigs, currentPage, itemsPerPage]);

  return (
    <AdminShell
      title="Store & System Settings"
      subtitle="Store configuration, currency exchange rates, and business compliance rules"
      onRefresh={loadData}
      isRefreshing={loading}
    >
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {toastMessage}
        </div>
      )}

      {/* Settings Form Card */}
      <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                General Store Configuration
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Parameters saved here update live across the storefront and checkout systems instantly.
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hotline */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary" />
              Customer Hotline Number
            </label>
            <input
              type="text"
              value={settingsData.hotlineNumber}
              onChange={(e) =>
                setSettingsData({ ...settingsData, hotlineNumber: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              WhatsApp Support Hotline
            </label>
            <input
              type="text"
              value={settingsData.whatsappNumber}
              onChange={(e) =>
                setSettingsData({ ...settingsData, whatsappNumber: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary" />
              Official Support Email
            </label>
            <input
              type="email"
              value={settingsData.contactEmail}
              onChange={(e) =>
                setSettingsData({ ...settingsData, contactEmail: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* USD to BDT */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              USD to BDT Currency Rate (৳)
            </label>
            <input
              type="text"
              value={settingsData.usdToBdtRate}
              onChange={(e) =>
                setSettingsData({ ...settingsData, usdToBdtRate: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Applied for imported IT components pricing benchmark calculations.
            </p>
          </div>
        </div>

        {/* Header Notice Banner */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Website Header Notice Banner Text
          </label>
          <textarea
            rows={2}
            value={settingsData.headerNoticeText}
            onChange={(e) =>
              setSettingsData({ ...settingsData, headerNoticeText: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </form>

      {/* System Settings & Compliance Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              System Parameters & Policy Compliance Audit
            </h3>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search parameter or key..."
              value={configSearch}
              onChange={(e) => {
                setConfigSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table with Pagination */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="px-5 py-3">Config Key</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Current Value</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedConfigs.map((cfg) => (
                  <tr key={cfg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-muted-foreground text-[11px]">
                      {cfg.key}
                    </td>
                    <td className="px-5 py-3 font-semibold text-foreground">
                      {cfg.label}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        {cfg.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-primary max-w-xs truncate">
                      {cfg.value}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {cfg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>
    </AdminShell>
  );
}

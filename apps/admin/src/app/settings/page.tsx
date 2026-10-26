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
  Building2,
  User,
  Globe,
  MapPin,
  CreditCard,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State initialized with authentic corporate visiting card details
  const [settingsData, setSettingsData] = useState({
    // Executive Leadership
    ceoName: "Md. Raihan Kabir",
    ceoDesignation: "CEO (BSC. Eng (Hons.) in CSE)",
    ceoPhone: "01922-730343",

    // Hotlines & Communication
    hotlineNumber: "01711-319090",
    secondaryPhone: "01711-319090",
    landlinePhone: "9183295",
    whatsappNumber: "01922-730343",
    contactEmail: "thesolutionsbd@gmail.com",
    websiteUrl: "https://thesolutionsbd.com",

    // Official Branch Locations
    gulshanAddress: "House- NWH- 12, Road- 53, Circle- 2, Gulshan Avenue, Dhaka- 1212",
    idbAddress: "SR- 140, BCS Computer City, IDB Bhaban (1st Floor), Agargaon, Dhaka- 1207",

    // Operations & Finance
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
        setSettingsData((prev) => ({
          ...prev,
          ...res.data,
          // Ensure fallbacks to visiting card defaults if backend has nulls
          ceoName: res.data.ceoName || prev.ceoName,
          ceoDesignation: res.data.ceoDesignation || prev.ceoDesignation,
          ceoPhone: res.data.ceoPhone || prev.ceoPhone,
          hotlineNumber: res.data.hotlineNumber || prev.hotlineNumber,
          secondaryPhone: res.data.secondaryPhone || prev.secondaryPhone,
          landlinePhone: res.data.landlinePhone || prev.landlinePhone,
          whatsappNumber: res.data.whatsappNumber || prev.whatsappNumber,
          contactEmail: res.data.contactEmail || prev.contactEmail,
          websiteUrl: res.data.websiteUrl || prev.websiteUrl,
          gulshanAddress: res.data.gulshanAddress || prev.gulshanAddress,
          idbAddress: res.data.idbAddress || prev.idbAddress,
        }));
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
        showToast("Official corporate settings updated and saved successfully!");
      } else {
        alert(res?.message || "Failed to save settings.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Comprehensive System Config Audit Entries from Visiting Card & System Engine
  const systemConfigs = useMemo(() => {
    return [
      {
        id: "CEO_NAME",
        key: "company.executive.ceo_name",
        label: "CEO & Founder Name",
        value: settingsData.ceoName,
        category: "Corporate",
        status: "Verified",
      },
      {
        id: "CEO_DESIGNATION",
        key: "company.executive.designation",
        label: "CEO Professional Qualification",
        value: settingsData.ceoDesignation,
        category: "Corporate",
        status: "Verified",
      },
      {
        id: "CEO_DIRECT_PHONE",
        key: "company.executive.direct_phone",
        label: "CEO Direct / WhatsApp Phone",
        value: settingsData.ceoPhone,
        category: "Corporate",
        status: "Active",
      },
      {
        id: "HOTLINE_NUMBER",
        key: "store.hotline.primary",
        label: "Primary Customer Hotline",
        value: settingsData.hotlineNumber,
        category: "Contact",
        status: "Active",
      },
      {
        id: "SECONDARY_PHONE",
        key: "store.hotline.secondary",
        label: "Secondary Mobile Hotline",
        value: settingsData.secondaryPhone,
        category: "Contact",
        status: "Active",
      },
      {
        id: "LANDLINE_PHONE",
        key: "store.landline.idb",
        label: "IDB Bhaban Landline Telephone",
        value: settingsData.landlinePhone,
        category: "Contact",
        status: "Active",
      },
      {
        id: "WHATSAPP_NUMBER",
        key: "store.whatsapp.official",
        label: "Official WhatsApp Support",
        value: settingsData.whatsappNumber,
        category: "Contact",
        status: "Active",
      },
      {
        id: "SUPPORT_EMAIL",
        key: "store.email.official",
        label: "Official Inquiries Email",
        value: settingsData.contactEmail,
        category: "Contact",
        status: "Active",
      },
      {
        id: "WEBSITE_URL",
        key: "store.web.official_domain",
        label: "Official Web Portal",
        value: settingsData.websiteUrl,
        category: "Corporate",
        status: "Active",
      },
      {
        id: "GULSHAN_OFFICE",
        key: "store.branch.gulshan_office",
        label: "Gulshan Office (Corporate HQ)",
        value: settingsData.gulshanAddress,
        category: "Locations",
        status: "Active",
      },
      {
        id: "IDB_OFFICE",
        key: "store.branch.idb_office",
        label: "IDB Office (BCS Computer City)",
        value: settingsData.idbAddress,
        category: "Locations",
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
      title="Store & Corporate Settings"
      subtitle="Corporate identity, branch office addresses, hotline numbers, and compliance rules"
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

      {/* 1. Official Corporate Business Card Visual Card Preview */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0d1620] to-[#081621] text-white p-6 rounded-2xl border border-border shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Official Corporate Business Card (The Solutions BD)
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Verified Organization
          </span>
        </div>

        {/* Realistic Business Card Simulation */}
        <div className="max-w-2xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-7 border border-slate-200 relative overflow-hidden">
          {/* Card Top Row: Brand Logo & Executive Profile */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Logo */}
            <div className="space-y-1">
              <img
                src="/logo.png"
                alt="The Solutions BD"
                className="h-10 sm:h-12 w-auto object-contain"
              />
              <p className="text-[10px] text-red-600 font-semibold tracking-tight">
                An Incomparable IT Solution Provider
              </p>
            </div>

            {/* CEO Profile */}
            <div className="text-left sm:text-right space-y-0.5">
              <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                {settingsData.ceoName}
              </h3>
              <p className="text-xs font-bold text-slate-700">CEO</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {settingsData.ceoDesignation.replace("CEO", "").replace("(", "").replace(")", "").trim()}
              </p>
              <div className="flex items-center sm:justify-end gap-1.5 text-xs font-mono font-bold text-emerald-600 pt-0.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>{settingsData.ceoPhone}</span>
              </div>
            </div>
          </div>

          {/* Card Middle Row: Two Office Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-4 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {/* Gulshan Office */}
            <div className="space-y-1.5 sm:pr-4">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>Gulshan Office</span>
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {settingsData.gulshanAddress}
              </p>
              <div className="space-y-0.5 pt-1 text-[11px] font-mono text-slate-700">
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{settingsData.whatsappNumber}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{settingsData.secondaryPhone}</span>
                </div>
              </div>
            </div>

            {/* IDB Office */}
            <div className="space-y-1.5 pt-3 sm:pt-0 sm:pl-4">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>IDB Office</span>
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {settingsData.idbAddress}
              </p>
              <div className="space-y-0.5 pt-1 text-[11px] text-slate-700 font-mono">
                <div>
                  <span className="font-bold">Tel:</span> {settingsData.landlinePhone}, {settingsData.secondaryPhone}
                </div>
                <div className="flex items-center gap-1 text-slate-600 font-sans">
                  <Mail className="w-3 h-3 text-primary" />
                  <span>{settingsData.contactEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Bottom Green Strip */}
          <div className="mt-2 -mx-6 -mb-6 bg-[#006837] text-white py-1.5 px-6 flex items-center justify-center gap-2 text-xs font-semibold shadow-inner">
            <Globe className="w-3.5 h-3.5" />
            <a
              href={settingsData.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline tracking-wide font-mono"
            >
              {settingsData.websiteUrl.replace("https://", "")}
            </a>
          </div>
        </div>
      </div>

      {/* 2. Settings Editable Form */}
      <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Corporate Profile & System Configuration
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                All changes saved here synchronize live across Storefront header, footer, invoices, and POS receipts.
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Corporate Settings"}</span>
          </button>
        </div>

        {/* Section 1: Executive Profile */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/50 pb-2">
            <User className="w-4 h-4" />
            <span>1. Executive Leadership (Visiting Card Identity)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Executive CEO Name</label>
              <input
                type="text"
                value={settingsData.ceoName}
                onChange={(e) => setSettingsData({ ...settingsData, ceoName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Designation & Degree</label>
              <input
                type="text"
                value={settingsData.ceoDesignation}
                onChange={(e) => setSettingsData({ ...settingsData, ceoDesignation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>CEO Direct Phone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={settingsData.ceoPhone}
                onChange={(e) => setSettingsData({ ...settingsData, ceoPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hotlines & Digital Communication */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/50 pb-2">
            <Phone className="w-4 h-4" />
            <span>2. Hotlines & Customer Communication</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Primary Hotline */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Primary Customer Hotline</span>
              </label>
              <input
                type="text"
                value={settingsData.hotlineNumber}
                onChange={(e) => setSettingsData({ ...settingsData, hotlineNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-mono outline-none"
              />
            </div>

            {/* Secondary Mobile */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span>Secondary Mobile Number</span>
              </label>
              <input
                type="text"
                value={settingsData.secondaryPhone}
                onChange={(e) => setSettingsData({ ...settingsData, secondaryPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-mono outline-none"
              />
            </div>

            {/* Landline */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Landline Telephone (IDB Office)</span>
              </label>
              <input
                type="text"
                value={settingsData.landlinePhone}
                onChange={(e) => setSettingsData({ ...settingsData, landlinePhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-mono outline-none"
              />
            </div>

            {/* WhatsApp Support */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>WhatsApp Support Hotline</span>
              </label>
              <input
                type="text"
                value={settingsData.whatsappNumber}
                onChange={(e) => setSettingsData({ ...settingsData, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-mono outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Official Contact Email</span>
              </label>
              <input
                type="email"
                value={settingsData.contactEmail}
                onChange={(e) => setSettingsData({ ...settingsData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            {/* Official Website */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official Web Domain</span>
              </label>
              <input
                type="text"
                value={settingsData.websiteUrl}
                onChange={(e) => setSettingsData({ ...settingsData, websiteUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Official Branch Office Locations */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/50 pb-2">
            <Building2 className="w-4 h-4" />
            <span>3. Branch & Corporate Office Addresses</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Gulshan Office */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>Gulshan Office Address (Corporate HQ)</span>
              </label>
              <textarea
                rows={2}
                value={settingsData.gulshanAddress}
                onChange={(e) => setSettingsData({ ...settingsData, gulshanAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
              />
            </div>

            {/* IDB Office */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>IDB Office Address (BCS Computer City Outlet)</span>
              </label>
              <textarea
                rows={2}
                value={settingsData.idbAddress}
                onChange={(e) => setSettingsData({ ...settingsData, idbAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Currency & Notice */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/50 pb-2">
            <Sliders className="w-4 h-4" />
            <span>4. Operations & Storefront Header Banner</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span>USD to BDT Currency Rate (৳)</span>
              </label>
              <input
                type="text"
                value={settingsData.usdToBdtRate}
                onChange={(e) => setSettingsData({ ...settingsData, usdToBdtRate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-mono outline-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Used for hardware import cost recalculations.
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Storefront Header Notice Banner Text</span>
              </label>
              <textarea
                rows={2}
                value={settingsData.headerNoticeText}
                onChange={(e) =>
                  setSettingsData({ ...settingsData, headerNoticeText: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary resize-none outline-none"
              />
            </div>
          </div>
        </div>
      </form>

      {/* 3. System Settings & Compliance Table */}
      <div className="space-y-3 pt-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Corporate Parameters & System Compliance Audit
            </h3>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search parameter, phone or address..."
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
                    <td className="px-5 py-3 font-mono font-bold text-primary max-w-sm truncate">
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

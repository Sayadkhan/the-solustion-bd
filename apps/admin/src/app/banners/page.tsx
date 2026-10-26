"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { adminApi } from "@/lib/api-client";
import {
  ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Eye,
  ArrowRight,
  ExternalLink,
  Upload,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  ChevronUp,
  ChevronDown,
  X,
  MessageSquare,
  Cpu,
} from "lucide-react";

interface BannerItem {
  id: string;
  type: string;
  tag?: string | null;
  title: string;
  subtitle?: string | null;
  image: string;
  buttonText?: string | null;
  buttonLink?: string | null;
  bgGradient?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const GRADIENT_PRESETS = [
  {
    name: "Royal Blue & Indigo",
    value: "from-blue-700 via-indigo-900 to-slate-950",
    swatch: "bg-gradient-to-r from-blue-700 via-indigo-900 to-slate-950",
  },
  {
    name: "Midnight Cyber",
    value: "from-blue-800 via-indigo-900 to-slate-950",
    swatch: "bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-950",
  },
  {
    name: "Cyan & Deep Blue",
    value: "from-cyan-700 via-blue-900 to-slate-950",
    swatch: "bg-gradient-to-r from-cyan-700 via-blue-900 to-slate-950",
  },
  {
    name: "Crimson Gaming",
    value: "from-rose-700 via-red-900 to-slate-950",
    swatch: "bg-gradient-to-r from-rose-700 via-red-900 to-slate-950",
  },
  {
    name: "Emerald High-Tech",
    value: "from-emerald-700 via-teal-900 to-slate-950",
    swatch: "bg-gradient-to-r from-emerald-700 via-teal-900 to-slate-950",
  },
  {
    name: "Stealth Dark Slate",
    value: "from-slate-800 via-slate-900 to-black",
    swatch: "bg-gradient-to-r from-slate-800 via-slate-900 to-black",
  },
];

export default function BannersPage() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bannersList, setBannersList] = useState<BannerItem[]>([]);
  const [activeTab, setActiveTab] = useState<"HERO" | "PROMO_SIDE">("HERO");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: "HERO",
    tag: "10.10 MEGA SALE",
    title: "১০.১০ টেক মেগা অফার!",
    subtitle: "Up to 40% Off on Gaming Laptops, RTX 40 Series & AMD AM5 BattleStations",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=80",
    buttonText: "Shop Mega Deals",
    buttonLink: "/products?deals=true",
    bgGradient: "from-blue-700 via-indigo-900 to-slate-950",
    sortOrder: 1,
    isActive: true,
  });

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getBanners();
      if (res?.data) {
        setBannersList(res.data);
      }
    } catch (err) {
      console.error("Failed to load banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBanners();
    setIsRefreshing(false);
    showToast("Banners refreshed from live database.");
  };

  const handleOpenCreateModal = (type = activeTab) => {
    setEditingBannerId(null);
    setFormData({
      type,
      tag: type === "HERO" ? "SPECIAL CAMPAIGN" : "CUSTOMER SERVICE",
      title: type === "HERO" ? "নতুন ধামাকা টেক অফার!" : "আপনার মতামত জানান",
      subtitle:
        type === "HERO"
          ? "Best Price Guarantee on Genuine Tech Hardware & Official Warranty across Bangladesh."
          : "দ্রুততম সময়ে নির্ভরযোগ্য কাস্টমার কেয়ার ও বিক্রয়োত্তর সেবা পান।",
      image:
        type === "HERO"
          ? "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=80"
          : "",
      buttonText: type === "HERO" ? "Explore Deals" : "Contact Now",
      buttonLink: type === "HERO" ? "/products" : "/track-order",
      bgGradient: "from-blue-700 via-indigo-900 to-slate-950",
      sortOrder: bannersList.filter((b) => b.type === type).length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (banner: BannerItem) => {
    setEditingBannerId(banner.id);
    setFormData({
      type: banner.type,
      tag: banner.tag || "",
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      buttonText: banner.buttonText || "Shop Now",
      buttonLink: banner.buttonLink || "/products",
      bgGradient: banner.bgGradient || "from-blue-700 via-indigo-900 to-slate-950",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await adminApi.uploadImage(file, "banners");
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, image: res.url }));
        showToast("Banner image uploaded successfully!");
      } else {
        alert("Failed to upload image. Please enter an image URL instead.");
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please provide a title for the banner.");
      return;
    }

    try {
      if (editingBannerId) {
        const res = await adminApi.updateBanner(editingBannerId, formData);
        if (res?.success) {
          showToast("Banner updated successfully!");
          setModalOpen(false);
          await loadBanners();
        } else {
          alert(res?.message || "Failed to update banner.");
        }
      } else {
        const res = await adminApi.createBanner(formData);
        if (res?.success) {
          showToast("New banner created successfully!");
          setModalOpen(false);
          await loadBanners();
        } else {
          alert(res?.message || "Failed to create banner.");
        }
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete banner "${title}"?`)) return;

    try {
      const res = await adminApi.deleteBanner(id);
      if (res?.success) {
        showToast("Banner deleted successfully.");
        await loadBanners();
      } else {
        alert(res?.message || "Failed to delete banner.");
      }
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleToggleActive = async (banner: BannerItem) => {
    try {
      const res = await adminApi.updateBanner(banner.id, {
        isActive: !banner.isActive,
      });
      if (res?.success) {
        showToast(`Banner set to ${!banner.isActive ? "ACTIVE" : "INACTIVE"}`);
        await loadBanners();
      }
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleMoveOrder = async (banner: BannerItem, direction: "up" | "down") => {
    const relevant = bannersList
      .filter((b) => b.type === banner.type)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const index = relevant.findIndex((b) => b.id === banner.id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= relevant.length) return;

    const currentItem = relevant[index];
    const targetItem = relevant[targetIndex];

    const currentOrder = currentItem.sortOrder;
    const targetOrder = targetItem.sortOrder;

    // Swap orders
    try {
      await adminApi.reorderBanners([
        { id: currentItem.id, sortOrder: targetOrder },
        { id: targetItem.id, sortOrder: currentOrder },
      ]);
      await loadBanners();
      showToast("Banner order updated!");
    } catch (err: any) {
      alert("Reorder failed: " + err.message);
    }
  };

  const heroBanners = bannersList.filter((b) => b.type === "HERO");
  const promoSideBanners = bannersList.filter((b) => b.type === "PROMO_SIDE");

  return (
    <AdminShell
      title="Banners & Campaign Promotions"
      subtitle="Manage homepage hero carousel sliders, promotional side banners, and special campaign headlines live."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="http://localhost:3000"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            <span>View Live Storefront</span>
          </Link>
          <button
            onClick={() => handleOpenCreateModal(activeTab)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Banner</span>
          </button>
        </div>
      }
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-3 mb-6">
        <button
          onClick={() => setActiveTab("HERO")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "HERO"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Hero Carousel Slider ({heroBanners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PROMO_SIDE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "PROMO_SIDE"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Side Promo Cards ({promoSideBanners.length})</span>
        </button>
      </div>

      {/* Tab 1: Hero Carousel Sliders */}
      {activeTab === "HERO" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-500" />
                  <span>Active Hero Carousel Banners</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These banners rotate every 5 seconds on the 8-column main hero slider of the homepage.
                </p>
              </div>
              <button
                onClick={() => handleOpenCreateModal("HERO")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hero Slide</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading banners...</div>
            ) : heroBanners.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-bold text-sm text-foreground">No hero banners created yet</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click the button below to add your first high-performance promotional campaign slider.
                </p>
                <button
                  onClick={() => handleOpenCreateModal("HERO")}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg"
                >
                  Create Hero Slide
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {heroBanners
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((banner, index) => (
                    <div
                      key={banner.id}
                      className="bg-card border border-border hover:border-border/80 rounded-xl p-4 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      {/* Left: Preview thumbnail with actual gradient */}
                      <div
                        className={`w-full md:w-64 h-36 rounded-lg p-3 bg-gradient-to-r ${
                          banner.bgGradient || "from-blue-700 via-indigo-900 to-slate-950"
                        } text-white flex flex-col justify-between shrink-0 relative overflow-hidden shadow-inner`}
                      >
                        <div className="relative z-10">
                          {banner.tag && (
                            <span className="inline-block bg-white/20 backdrop-blur-sm text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-white/30">
                              {banner.tag}
                            </span>
                          )}
                          <h4 className="text-xs font-black line-clamp-1 mt-1">{banner.title}</h4>
                          <p className="text-[10px] text-slate-200 line-clamp-1 opacity-90 mt-0.5">
                            {banner.subtitle}
                          </p>
                        </div>

                        <div className="relative z-10">
                          <span className="inline-flex items-center gap-1 bg-white text-slate-900 text-[9px] font-black px-2 py-1 rounded">
                            {banner.buttonText || "Shop Now"}
                            <ArrowRight className="w-2.5 h-2.5 text-blue-600" />
                          </span>
                        </div>

                        {banner.image && (
                          <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-40 pointer-events-none">
                            <img
                              src={banner.image}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                            Position #{banner.sortOrder}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              banner.isActive
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            }`}
                          >
                            {banner.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-foreground">{banner.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {banner.subtitle || "No subtitle provided."}
                        </p>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3 pt-1">
                          <span>
                            Target: <code className="text-primary font-mono">{banner.buttonLink}</code>
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">
                            Image: <span className="underline">{banner.image}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
                        {/* Sort Order Up/Down */}
                        <div className="flex flex-col gap-0.5 mr-2">
                          <button
                            onClick={() => handleMoveOrder(banner, "up")}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(banner, "down")}
                            disabled={index === heroBanners.length - 1}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Active Switch */}
                        <button
                          onClick={() => handleToggleActive(banner)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            banner.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}
                        >
                          {banner.isActive ? "Active" : "Disabled"}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(banner)}
                          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                          title="Edit Banner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteBanner(banner.id, banner.title)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Side Promo Cards */}
      {activeTab === "PROMO_SIDE" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Homepage Side Promotional Cards (4-Columns)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These 2 stacked cards appear on the right side of the main carousel slider (e.g. RMA Support & PC Builder promotions).
                </p>
              </div>
              <button
                onClick={() => handleOpenCreateModal("PROMO_SIDE")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Side Promo Card</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promoSideBanners.map((card, idx) => (
                <div
                  key={card.id}
                  className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4"
                >
                  {/* Card Visual Preview */}
                  <div
                    className={`rounded-xl p-5 bg-gradient-to-br ${
                      card.bgGradient || "from-[#0e3c88] to-[#122444]"
                    } text-white flex flex-col justify-between shadow-md min-h-[180px] relative overflow-hidden`}
                  >
                    <div className="relative z-10 space-y-1.5">
                      <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                        {idx === 0 ? (
                          <MessageSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5" />
                        )}
                        <span>{card.tag || "Promotional Spotlight"}</span>
                      </div>
                      <h4 className="text-base font-black leading-snug">{card.title}</h4>
                      <p className="text-slate-200 text-xs line-clamp-2">{card.subtitle}</p>
                    </div>

                    <div className="relative z-10 pt-3">
                      <span className="inline-block bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded text-xs">
                        {card.buttonText || "Check Now"}
                      </span>
                    </div>

                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  </div>

                  {/* Card Details & Control Buttons */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="font-semibold text-foreground">Card #{idx + 1}</span>
                      <span className="text-muted-foreground ml-2">
                        Target: <code className="text-primary">{card.buttonLink}</code>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(card)}
                        className="p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                        title="Edit Promo Card"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(card.id, card.title)}
                        className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Banner Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-foreground">
                  {editingBannerId ? "Edit Promotional Banner" : "Create New Promotional Banner"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBanner} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Live Preview Box */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Live Visual Preview
                </label>
                <div
                  className={`rounded-xl p-6 bg-gradient-to-r ${formData.bgGradient} text-white flex flex-col justify-between min-h-[160px] relative overflow-hidden shadow-lg`}
                >
                  <div className="relative z-10 max-w-md space-y-2">
                    {formData.tag && (
                      <span className="inline-block bg-white/20 backdrop-blur-sm text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-white/30">
                        {formData.tag}
                      </span>
                    )}
                    <h3 className="text-xl font-black leading-tight">
                      {formData.title || "Banner Title Preview"}
                    </h3>
                    <p className="text-xs text-slate-200 line-clamp-2">
                      {formData.subtitle || "Banner subtitle and promo description..."}
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 bg-white text-slate-900 font-extrabold text-xs px-3.5 py-1.5 rounded-md shadow">
                        {formData.buttonText || "Shop Now"}
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    </div>
                  </div>

                  {formData.image && (
                    <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-40 pointer-events-none">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Placement & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Banner Placement Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="HERO">Hero Carousel Slider (8-Cols)</option>
                    <option value="PROMO_SIDE">Right Side Promo Card (4-Cols)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Campaign Tag / Badge
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="e.g. 10.10 MEGA SALE, HOT DEAL"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Headline Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. ১০.১০ টেক মেগা অফার! বা Build Your Dream PC"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Subtitle Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Short attractive offer details or product key points..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Image Input & Upload */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Graphic Image URL or File Upload *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... or upload local banner file"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-bold border border-border flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>{uploadingImage ? "Uploading..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Button Text & Target Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="e.g. Shop Mega Deals, PC Builder"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Button Destination URL / Route
                  </label>
                  <input
                    type="text"
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    placeholder="e.g. /products?deals=true or /pc-builder"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground font-mono outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Background Gradient Presets */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  Select High-Tech Gradient Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, bgGradient: preset.value })}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                        formData.bgGradient === preset.value
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border hover:border-border/80 bg-card"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full shrink-0 shadow-sm ${preset.swatch}`} />
                      <span className="text-[11px] font-semibold text-foreground truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Publication Status
                  </label>
                  <div className="flex items-center gap-3 pt-1.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {formData.isActive ? "Published (Visible)" : "Draft (Hidden)"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingBannerId ? "Save Changes" : "Create Banner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

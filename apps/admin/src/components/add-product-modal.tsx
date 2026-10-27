"use client";

import React, { useState } from "react";
import { formatBdt } from "@solusation/shared-types";
import { adminApi } from "@/lib/api-client";
import { extractYouTubeId, getYouTubeThumbnailUrl } from "@/lib/youtube";
import {
  X,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  TrendingUp,
} from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: any) => void;
  mainCategories?: any[];
  brands?: any[];
}

export function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
  mainCategories = [],
  brands = [],
}: AddProductModalProps) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    mainCategories[0]?.subCategories?.[0]?.id || mainCategories[0]?.id || ""
  );
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id || "");
  const [cashPrice, setCashPrice] = useState<number>(0);
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(20);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(36);
  const [isEmiAvailable, setIsEmiAvailable] = useState<boolean>(false);

  // Images & Video
  const [imageUrl, setImageUrl] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");

  // Hardware Specs
  const [componentType, setComponentType] = useState<string>("CPU");
  const [socket, setSocket] = useState<string>("AM5");
  const [supportedRam, setSupportedRam] = useState<string>("DDR5");
  const [formFactor, setFormFactor] = useState<string>("ATX");
  const [tdpWatts, setTdpWatts] = useState<number>(120);

  // Key Features
  const [keyFeatures, setKeyFeatures] = useState<string[]>([
    "Official 3 Years Manufacturer Warranty",
    "High-Performance Overclocking Headroom",
  ]);
  const [newFeatureText, setNewFeatureText] = useState("");

  // Profit Margin calculation
  const grossProfit = cashPrice > 0 && costPrice > 0 ? cashPrice - costPrice : 0;
  const marginPercent =
    cashPrice > 0 && costPrice > 0 ? Math.round((grossProfit / cashPrice) * 100) : 0;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await adminApi.uploadImage(file, "products");
      if (res.success && res.url) {
        setImageUrl(res.url);
        setImages((prev) => [...prev, res.url]);
      } else {
        alert("Image upload failed. Please try again.");
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setKeyFeatures([...keyFeatures, newFeatureText.trim()]);
    setNewFeatureText("");
  };

  const handleRemoveFeature = (idx: number) => {
    setKeyFeatures(keyFeatures.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || cashPrice <= 0 || regularPrice <= 0) {
      alert("Please fill in required fields (Name, SKU, Cash Price, Regular Price).");
      return;
    }

    try {
      setLoading(true);
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-");

      const payload = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        slug,
        categoryId: selectedCategoryId || undefined,
        brandId: selectedBrandId || undefined,
        cashPriceBdt: Number(cashPrice),
        regularPriceBdt: Number(regularPrice),
        costPriceBdt: Number(costPrice) || null,
        isEmiAvailable,
        totalStock: Number(stock),
        stockStatus: "IN_STOCK",
        warrantyDurationMonths: Number(warrantyMonths),
        videoUrl: videoUrl.trim() || null,
        images: images.length > 0 ? images : [imageUrl || "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800"],
        keyFeatures,
        compatibility: {
          componentType,
          socket: componentType === "CPU" || componentType === "MOBO" ? socket : null,
          supportedRam: componentType === "MOBO" || componentType === "RAM" ? supportedRam : null,
          formFactor: componentType === "MOBO" || componentType === "CASE" ? formFactor : null,
          tdpWatts: Number(tdpWatts) || 0,
        },
        initialStock: Number(stock),
      };

      const res = await adminApi.createProduct(payload);
      if (res.success) {
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.message || "Failed to create product");
      }
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Hardware Component
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter product specifications, Bangladeshi dual pricing, and upload high-res images.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. General Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AMD Ryzen 7 9800X3D Gaming Processor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  SKU Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CPU-AMD-9800X3D"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Category (Star Tech Tree)
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                >
                  {mainCategories && mainCategories.length > 0 ? (
                    mainCategories.map((mainCat) => {
                      if (mainCat.hasSubCategories && mainCat.subCategories?.length > 0) {
                        return (
                          <optgroup key={mainCat.id} label={`📁 ${mainCat.name}`}>
                            {mainCat.subCategories.map((sub: any) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      }
                      return (
                        <optgroup key={mainCat.id} label={`⚡ Standalone Category`}>
                          <option value={mainCat.id}>{mainCat.name}</option>
                        </optgroup>
                      );
                    })
                  ) : (
                    <>
                      <option value="">Select Category</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Brand</label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                >
                  {brands && brands.length > 0 ? (
                    brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="">Select Brand</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Bangladeshi Dual Pricing Section */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                2. Bangladeshi Dual Pricing System
              </h3>
              {marginPercent > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                  Gross Margin: +{marginPercent}% ({formatBdt(grossProfit)}/unit)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Cash Discount Price (BDT) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="58500"
                  value={cashPrice || ""}
                  onChange={(e) => setCashPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Displayed highlighted as cash special
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Regular / Card Price (BDT) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="62000"
                  value={regularPrice || ""}
                  onChange={(e) => setRegularPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Used for list / MRP regular price
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Cost / Purchase Price (BDT)
                </label>
                <input
                  type="number"
                  placeholder="52000"
                  value={costPrice || ""}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Admin-only internal profit tracking
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Initial Central Stock
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Warranty Duration (Months)
                </label>
                <input
                  type="number"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-primary" />
              3. Product Imagery (Direct File Upload)
            </h3>

            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-1/2">
                <label className="block border-2 border-dashed border-border hover:border-primary/50 transition rounded-xl p-6 text-center cursor-pointer bg-muted/20">
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <span className="text-xs font-semibold text-foreground block">
                    {uploadingImage ? "Uploading to Server..." : "Click or Drag Image to Upload"}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Supports JPG, PNG, WEBP, AVIF up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preview */}
              <div className="w-full md:w-1/2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Or Paste External Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (e.target.value && !images.includes(e.target.value)) {
                      setImages([...images, e.target.value]);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />

                {imageUrl && (
                  <div className="mt-3 flex items-center gap-3 p-2 bg-muted/40 border border-border rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Thumbnail Preview"
                      className="w-14 h-14 object-cover rounded border border-border bg-white"
                    />
                    <div className="text-[11px] overflow-hidden">
                      <p className="font-semibold text-foreground truncate">{imageUrl}</p>
                      <span className="text-emerald-500 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Ready for catalog
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Video (YouTube Link) Section */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
              4. Product Video Review (YouTube Link)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                YouTube Video URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 text-xs bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                />
                <svg
                  className="w-4 h-4 text-red-600 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Paste any YouTube video or short URL. It will be embedded directly on the product's detail page.
              </span>

              {/* YouTube Live Validation & Thumbnail Preview */}
              {extractYouTubeId(videoUrl) && (
                <div className="mt-2.5 p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getYouTubeThumbnailUrl(videoUrl) || ""}
                    alt="YouTube Video Preview"
                    className="w-24 h-14 object-cover rounded-lg border border-red-500/30 shrink-0 bg-black"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid YouTube Video Detected</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Video ID: {extractYouTubeId(videoUrl)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Specs */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary" />
              5. Hardware Compatibility Specs (Rule 4.3 Engine)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Component Type</label>
                <select
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                >
                  <option value="CPU">CPU (Processor)</option>
                  <option value="MOBO">MOBO (Motherboard)</option>
                  <option value="RAM">RAM (Memory)</option>
                  <option value="GPU">GPU (Graphics)</option>
                  <option value="STORAGE">Storage</option>
                  <option value="PSU">PSU (Power)</option>
                  <option value="CASE">Case</option>
                  <option value="COOLER">Cooler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Socket</label>
                <select
                  value={socket}
                  onChange={(e) => setSocket(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                >
                  <option value="AM5">AM5 (AMD 7000/9000)</option>
                  <option value="AM4">AM4 (AMD 5000)</option>
                  <option value="LGA1700">LGA1700 (Intel 12/13/14th)</option>
                  <option value="LGA1851">LGA1851 (Intel Ultra 200)</option>
                  <option value="N/A">None / Not Applicable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">RAM Support</label>
                <select
                  value={supportedRam}
                  onChange={(e) => setSupportedRam(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                >
                  <option value="DDR5">DDR5</option>
                  <option value="DDR4">DDR4</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">TDP (Watts)</label>
                <input
                  type="number"
                  value={tdpWatts}
                  onChange={(e) => setTdpWatts(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          {/* Key Features Bullet Points */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              5. Key Features & Highlights
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add bullet point feature (e.g. 104MB 3D V-Cache Technology)"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 px-3.5 py-1.5 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Add Feature
              </button>
            </div>

            <div className="space-y-1.5">
              {keyFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-muted/20 border border-border/50 text-foreground"
                >
                  <span>• {feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-muted-foreground hover:text-destructive transition p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
            >
              {loading ? "Publishing Product..." : "Save & Publish to Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

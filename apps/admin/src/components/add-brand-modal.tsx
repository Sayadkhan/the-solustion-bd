"use client";

import React, { useState } from "react";
import { adminApi } from "@/lib/api-client";
import { X, Tag, Upload, CheckCircle2 } from "lucide-react";

interface AddBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBrand: any) => void;
}

export function AddBrandModal({ isOpen, onClose, onSuccess }: AddBrandModalProps) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");
    setSlug(autoSlug);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const res = await adminApi.uploadImage(file, "brands");
      if (res.success && res.url) {
        setLogoUrl(res.url);
      } else {
        alert("Brand logo upload failed.");
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      alert("Brand name and slug are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await adminApi.createBrand({
        name: name.trim(),
        slug: slug.trim(),
        logoUrl: logoUrl.trim() || undefined,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.message || "Failed to create brand");
      }
    } catch (err: any) {
      alert(`Error creating brand: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Add Authorized Brand</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Brand Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Noctua, Lian Li, Corsair"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Brand Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono bg-muted/40 border border-border rounded-xl text-foreground outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Brand Logo (Direct Upload)</label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative w-12 h-12 rounded-xl border border-border p-1 bg-white flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl border border-dashed border-border flex items-center justify-center shrink-0 bg-muted/30">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition font-semibold text-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold transition shadow-sm"
            >
              {loading ? "Saving..." : "Add Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

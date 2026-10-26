"use client";

import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/api-client";
import { X, Layers, Plus, FolderTree, Sparkles } from "lucide-react";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCategory: any) => void;
  mainCategories?: Array<{ id: string; name: string; slug: string }>;
  initialParentId?: string | null;
}

export function AddCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  mainCategories = [],
  initialParentId = null,
}: AddCategoryModalProps) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [categoryType, setCategoryType] = useState<"MAIN" | "SUB">(
    initialParentId ? "SUB" : "MAIN"
  );
  const [parentId, setParentId] = useState<string>(initialParentId || mainCategories[0]?.id || "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("Layers");
  const [isFeaturedInMegaMenu, setIsFeaturedInMegaMenu] = useState(true);
  const [filterAttributes, setFilterAttributes] = useState<string[]>([
    "Brand",
    "Warranty",
  ]);
  const [newAttr, setNewAttr] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(1);

  useEffect(() => {
    if (initialParentId) {
      setCategoryType("SUB");
      setParentId(initialParentId);
    }
  }, [initialParentId]);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");
    setSlug(autoSlug);
  };

  const handleAddAttribute = () => {
    if (!newAttr.trim()) return;
    if (!filterAttributes.includes(newAttr.trim())) {
      setFilterAttributes([...filterAttributes, newAttr.trim()]);
    }
    setNewAttr("");
  };

  const handleRemoveAttribute = (idx: number) => {
    setFilterAttributes(filterAttributes.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      alert("Category name and slug are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await adminApi.createCategory({
        name: name.trim(),
        slug: slug.trim(),
        icon,
        isFeaturedInMegaMenu,
        filterableAttributes: filterAttributes,
        parentId: categoryType === "SUB" ? parentId : null,
        sortOrder: Number(sortOrder) || 1,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.message || "Failed to create category");
      }
    } catch (err: any) {
      alert(`Error creating category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Add Star Tech Category / Sub-Category
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Configure hierarchy: Standalone root category or sub-category
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Category Hierarchy Level Selector */}
          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              Category Hierarchy Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategoryType("MAIN")}
                className={`p-3 rounded-xl border text-left transition ${
                  categoryType === "MAIN"
                    ? "bg-primary/10 border-primary text-foreground font-bold shadow-sm"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs">Main Category (Root)</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Top level (e.g. Component, Desktop, or Standalone like Software)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCategoryType("SUB")}
                className={`p-3 rounded-xl border text-left transition ${
                  categoryType === "SUB"
                    ? "bg-primary/10 border-primary text-foreground font-bold shadow-sm"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs">Sub-Category (Child)</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Nested under a Main Category (e.g. Processor under Component)
                </p>
              </button>
            </div>
          </div>

          {/* Parent Category Dropdown (Shown only if Sub-Category is selected) */}
          {categoryType === "SUB" && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 animate-in fade-in">
              <label className="block font-bold text-foreground">
                Select Parent Main Category:
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-xl text-foreground font-semibold outline-none focus:ring-1 focus:ring-primary"
              >
                {mainCategories.map((mainCat) => (
                  <option key={mainCat.id} value={mainCat.id}>
                    📁 {mainCat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-foreground mb-1">
              {categoryType === "MAIN" ? "Main Category Title" : "Sub-Category Title"}
            </label>
            <input
              type="text"
              required
              placeholder={
                categoryType === "MAIN"
                  ? "e.g. Software, Office Equipment, Server"
                  : "e.g. Liquid Coolers (AIO), Gaming Laptop"
              }
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">URL Slug</label>
            <div className="flex items-center gap-1 font-mono text-muted-foreground">
              <span>/category/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl text-foreground font-mono outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Navbar Serial / Position
              </label>
              <input
                type="number"
                min={1}
                max={999}
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Top 10 categories appear in storefront navbar (ordered 1 to 10).
              </p>
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">Icon Identifier</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. Cpu, Monitor, Laptop, Zap"
                className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground outline-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Lucide icon name</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-foreground">
              Dynamic Filterable Attributes (Sidebar Facets)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {filterAttributes.map((attr, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-muted text-foreground border border-border flex items-center gap-1.5"
                >
                  {attr}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add attribute (e.g. Socket, Refresh Rate)"
                value={newAttr}
                onChange={(e) => setNewAttr(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl text-foreground outline-none"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 text-xs"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="megaMenuCheck"
              checked={isFeaturedInMegaMenu}
              onChange={(e) => setIsFeaturedInMegaMenu(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="megaMenuCheck" className="text-xs font-semibold text-foreground cursor-pointer">
              Show in Storefront Header Mega Menu (Star Tech Navigation)
            </label>
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
              {loading ? "Saving..." : categoryType === "MAIN" ? "Create Main Category" : "Create Sub-Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

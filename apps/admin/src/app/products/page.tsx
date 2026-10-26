"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import { formatBdt } from "@solusation/shared-types";
import { AddProductModal } from "@/components/add-product-modal";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  Package,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Tag,
  DollarSign,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, brandRes] = await Promise.all([
        adminApi.getProducts({ limit: 200 }),
        adminApi.getCategories(),
        adminApi.getBrands(),
      ]);

      if (prodRes?.data && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
      if (catRes?.data && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
      if (brandRes?.data && Array.isArray(brandRes.data)) {
        setBrands(brandRes.data);
      }
    } catch (err) {
      console.error("Failed to load products data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, any>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Brand map for quick lookup
  const brandMap = useMemo(() => {
    const map = new Map<string, any>();
    brands.forEach((b) => map.set(b.id, b));
    return map;
  }, [brands]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (categoryFilter !== "ALL" && p.categoryId !== categoryFilter) {
        return false;
      }

      // Stock filter
      const stock = p.stock ?? p.inventory?.stock ?? 0;
      if (stockFilter === "IN_STOCK" && stock <= 0) return false;
      if (stockFilter === "LOW_STOCK" && (stock > 5 || stock <= 0)) return false;
      if (stockFilter === "OUT_OF_STOCK" && stock > 0) return false;

      // Search query
      const q = searchTerm.toLowerCase();
      const matchSearch =
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.brand?.name?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q);

      return matchSearch;
    });
  }, [products, categoryFilter, stockFilter, searchTerm]);

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const isAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.id === "bulk") {
        await Promise.all(selectedIds.map((id) => adminApi.deleteProduct(id)));
        showToast(`${selectedIds.length} products deleted successfully!`);
        setSelectedIds([]);
      } else {
        const res = await adminApi.deleteProduct(deleteTarget.id);
        if (res?.success) {
          showToast(`Product "${deleteTarget.name}" deleted successfully!`);
          setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        } else {
          alert(res?.message || "Failed to delete product.");
        }
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminShell
      title="Products Inventory"
      subtitle="Dual Pricing (Cash Discount vs Regular EMI) & Stock Management"
      onRefresh={loadData}
      isRefreshing={loading}
      actions={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      }
    >
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {toastMessage}
        </div>
      )}

      {/* Info Card Banner */}
      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Bangladesh Tech Catalog & Inventory Management
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cash Discount pricing and Credit Card EMI Regular Pricing calculated dynamically.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-foreground font-semibold">
            Total Products: {products.length}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or model..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-card border border-border text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `↳ ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-card border border-border text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Stock Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock (&lt; 5)</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-primary/10 border border-primary/20 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground">
              {selectedIds.length} products selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Deselect All
            </button>
          </div>
          <button
            onClick={() =>
              setDeleteTarget({
                id: "bulk",
                name: `${selectedIds.length} selected products`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Products Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="w-10 px-3 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                    title="Select all on this page"
                  />
                </th>
                <th className="w-12 px-3 py-3.5 text-center text-muted-foreground font-mono">
                  #
                </th>
                <th className="px-5 py-3.5">Image & Product Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Brand</th>
                <th className="px-5 py-3.5">Cash Price (৳)</th>
                <th className="px-5 py-3.5">Regular Price (৳)</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    Loading products...
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, index) => {
                  const stock = p.stock ?? p.inventory?.stock ?? 0;
                  const catObj = p.category || categoryMap.get(p.categoryId);
                  const brandObj = p.brand || brandMap.get(p.brandId);
                  const isChecked = selectedIds.includes(p.id);

                  // Extract main image
                  const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-muted/30 transition-colors group ${
                        isChecked ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(p.id)}
                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Serial Number */}
                      <td className="px-3 py-3.5 text-center font-mono text-muted-foreground text-xs">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Image & Title */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors max-w-xs sm:max-w-md line-clamp-1">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                              <span>SKU: {p.sku || "N/A"}</span>
                              {p.model && <span>• Model: {p.model}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        {catObj ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border">
                            {catObj.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Brand */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-foreground text-xs">
                          {brandObj?.name || p.brand?.name || "General"}
                        </span>
                      </td>

                      {/* Cash Price */}
                      <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatBdt(p.cashPriceBdt || p.price || 0)}
                      </td>

                      {/* Regular Price */}
                      <td className="px-5 py-3.5 text-muted-foreground line-through text-xs">
                        {p.regularPriceBdt ? formatBdt(p.regularPriceBdt) : "-"}
                      </td>

                      {/* Stock Badge */}
                      <td className="px-5 py-3.5">
                        {stock <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Out of Stock
                          </span>
                        ) : stock <= 5 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Low Stock ({stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {stock} in stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Store link */}
                          <a
                            href={`http://localhost:3000/products/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View product on live store"
                            className="p-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                            title="Delete Product"
                            className="p-1.5 rounded-md border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async (newProd) => {
          setIsAddModalOpen(false);
          showToast(`Product "${newProd.name}" added successfully!`);
          await loadData();
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Product"
        itemName={deleteTarget?.name}
        itemType="Product"
        isDeleting={isDeleting}
      />
    </AdminShell>
  );
}

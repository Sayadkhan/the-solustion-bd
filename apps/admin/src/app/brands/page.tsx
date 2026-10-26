"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import { AddBrandModal } from "@/components/add-brand-modal";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  Tag,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
      const res = await adminApi.getBrands();
      if (res?.data && Array.isArray(res.data)) {
        setBrands(res.data);
      }
    } catch (err) {
      console.error("Failed to load brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter brands
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const q = searchTerm.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q)
      );
    });
  }, [brands, searchTerm]);

  // Pagination
  const totalItems = filteredBrands.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBrands.slice(start, start + itemsPerPage);
  }, [filteredBrands, currentPage, itemsPerPage]);

  const isAllSelected =
    paginatedBrands.length > 0 &&
    paginatedBrands.every((b) => selectedIds.includes(b.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedBrands.map((b) => b.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedBrands.map((b) => b.id);
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
        await Promise.all(selectedIds.map((id) => adminApi.deleteBrand(id)));
        showToast(`${selectedIds.length} brands deleted successfully!`);
        setSelectedIds([]);
      } else {
        const res = await adminApi.deleteBrand(deleteTarget.id);
        if (res?.success) {
          showToast(`Brand "${deleteTarget.name}" deleted successfully!`);
          setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        } else {
          alert(res?.message || "Failed to delete brand.");
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
      title="Brands Directory"
      subtitle="Authorized component distributors and hardware manufacturer partners"
      onRefresh={loadData}
      isRefreshing={loading}
      actions={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Brand</span>
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
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Official Brands & Hardware Partners
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used across product specifications, PC Builder filters, and brand storefront showcases.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-foreground font-semibold">
            Total Brands: {brands.length}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by brand name or slug..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-primary/10 border border-primary/20 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground">
              {selectedIds.length} brands selected
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
                name: `${selectedIds.length} selected brands`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Brands Table */}
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
                <th className="px-5 py-3.5">Logo</th>
                <th className="px-5 py-3.5">Brand Name</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Loading brands...
                  </td>
                </tr>
              ) : paginatedBrands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No brands found.
                  </td>
                </tr>
              ) : (
                paginatedBrands.map((brand, index) => {
                  const isChecked = selectedIds.includes(brand.id);
                  return (
                    <tr
                      key={brand.id}
                      className={`hover:bg-muted/30 transition-colors group ${
                        isChecked ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(brand.id)}
                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Serial Number */}
                      <td className="px-3 py-3.5 text-center font-mono text-muted-foreground text-xs">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Logo / Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-foreground overflow-hidden">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-xs uppercase">{brand.name.slice(0, 2)}</span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                          {brand.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ID: {brand.id.slice(0, 12)}...
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">
                        /{brand.slug}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Official Partner
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View on Storefront */}
                          <a
                            href={`http://localhost:3000/products?brand=${brand.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View brand products on store"
                            className="p-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget({ id: brand.id, name: brand.name })}
                            title="Delete Brand"
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

      {/* Add Brand Modal */}
      <AddBrandModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async (newBrand) => {
          setIsAddModalOpen(false);
          showToast(`Brand "${newBrand.name}" added successfully!`);
          await loadData();
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Brand"
        itemName={deleteTarget?.name}
        itemType="Brand"
        isDeleting={isDeleting}
      />
    </AdminShell>
  );
}

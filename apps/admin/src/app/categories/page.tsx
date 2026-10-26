"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import { AddCategoryModal } from "@/components/add-category-modal";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  Layers,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  FolderTree,
  Package,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedParentForChild, setSelectedParentForChild] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCategories();
      if (res?.data && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter ONLY Main Categories (Root: parentId is null or missing) and sort strictly by sortOrder
  const mainCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parentId)
      .sort((a, b) => {
        const orderA = a.sortOrder !== undefined && a.sortOrder !== null ? Number(a.sortOrder) : 999;
        const orderB = b.sortOrder !== undefined && b.sortOrder !== null ? Number(b.sortOrder) : 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
  }, [categories]);

  // Sorting / Reordering handlers
  const handleSortOrderChange = async (id: string, newOrder: number) => {
    try {
      // Optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, sortOrder: newOrder } : c))
      );
      await adminApi.updateCategorySortOrder(id, newOrder);
      showToast("Navbar serial updated successfully!");
      await loadData();
    } catch (err: any) {
      showToast("Failed to update serial: " + err.message);
    }
  };

  const handleMove = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= filteredCategories.length) return;

    const currentCat = filteredCategories[currentIndex];
    const targetCat = filteredCategories[targetIndex];

    const currentOrder = currentCat.sortOrder ?? currentIndex + 1;
    const targetOrder = targetCat.sortOrder ?? targetIndex + 1;

    const newCurrentOrder =
      targetOrder === currentOrder
        ? direction === "up"
          ? currentOrder - 1
          : currentOrder + 1
        : targetOrder;
    const newTargetOrder = currentOrder;

    try {
      await adminApi.reorderCategories([
        { id: currentCat.id, sortOrder: newCurrentOrder },
        { id: targetCat.id, sortOrder: newTargetOrder },
      ]);
      showToast(`Moved "${currentCat.name}" ${direction === "up" ? "up" : "down"} to position #${newCurrentOrder}`);
      await loadData();
    } catch (err: any) {
      showToast("Failed to reorder: " + err.message);
    }
  };

  // Search filtering
  const filteredCategories = useMemo(() => {
    return mainCategories.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [mainCategories, searchTerm]);

  // Pagination calculation
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  // Selection logic for bulk actions
  const isAllSelected =
    paginatedCategories.length > 0 &&
    paginatedCategories.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginatedCategories.some((c) => c.id === id))
      );
    } else {
      const newIds = Array.from(
        new Set([...selectedIds, ...paginatedCategories.map((c) => c.id)])
      );
      setSelectedIds(newIds);
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
        await Promise.all(selectedIds.map((id) => adminApi.deleteCategory(id)));
        showToast(`${selectedIds.length} categories deleted successfully!`);
        setSelectedIds([]);
      } else {
        const res = await adminApi.deleteCategory(deleteTarget.id);
        if (res?.success) {
          showToast(`Category "${deleteTarget.name}" deleted successfully!`);
          setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        } else {
          alert(res?.message || "Failed to delete category.");
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

  // Find sub-categories count for each main category
  const getSubcategoriesCount = (mainCatId: string) => {
    return categories.filter((c) => c.parentId === mainCatId).length;
  };

  return (
    <AdminShell
      title="Main Categories"
      subtitle="Star Tech standard hierarchy root categories management"
      onRefresh={loadData}
      isRefreshing={loading}
      actions={
        <button
          onClick={() => {
            setSelectedParentForChild(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Main Category</span>
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
      <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Star Tech Bangladesh Category Architecture
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Not all categories require sub-categories (e.g. Software, Server & Storage, Gadget are Standalone main categories).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-card border border-border text-foreground font-semibold">
            Total Root Categories: {mainCategories.length}
          </span>
        </div>
      </div>

      {/* Table Controls (Search & Info) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by category name or slug..."
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
              {selectedIds.length} categories selected
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
                name: `${selectedIds.length} selected main categories`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Storefront Navbar Status Banner */}
      <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-primary/10 to-transparent border border-blue-500/20 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">
            Storefront Navbar Status:
          </span>
          <span className="text-muted-foreground">
            Top 10 categories (Serial #1 to #10) appear in the public storefront mega navigation. Use the ▲ / ▼ buttons or enter numbers directly to reorder them anytime.
          </span>
        </div>
      </div>

      {/* Main Categories Data Table */}
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
                <th className="px-3 py-3.5 text-center min-w-[160px]">
                  Navbar Serial / Order
                </th>
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Sub-Categories</th>
                <th className="px-5 py-3.5">Hierarchy</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Loading categories...
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    No main categories found.
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat, index) => {
                  const subCount = getSubcategoriesCount(cat.id);
                  const isStandalone = subCount === 0;
                  const isChecked = selectedIds.includes(cat.id);

                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-muted/30 transition-colors group ${
                        isChecked ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(cat.id)}
                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Interactive Navbar Serial & Reorder */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Up / Down Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              disabled={(currentPage - 1) * itemsPerPage + index === 0}
                              onClick={() => handleMove((currentPage - 1) * itemsPerPage + index, "up")}
                              className="p-1 rounded bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground disabled:opacity-20 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition"
                              title="Move Up in Navbar"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={(currentPage - 1) * itemsPerPage + index === filteredCategories.length - 1}
                              onClick={() => handleMove((currentPage - 1) * itemsPerPage + index, "down")}
                              className="p-1 rounded bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground disabled:opacity-20 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition"
                              title="Move Down in Navbar"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Direct Numeric Input */}
                          <input
                            type="number"
                            min={1}
                            max={999}
                            defaultValue={cat.sortOrder ?? (currentPage - 1) * itemsPerPage + index + 1}
                            key={cat.sortOrder}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== cat.sortOrder) {
                                handleSortOrderChange(cat.id, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = parseInt((e.target as HTMLInputElement).value);
                                if (!isNaN(val) && val !== cat.sortOrder) {
                                  handleSortOrderChange(cat.id, val);
                                }
                              }
                            }}
                            className="w-12 h-8 text-center text-xs font-bold bg-muted/60 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            title="Type number and press Enter or click outside to re-position"
                          />

                          {/* Position Status Badge */}
                          {(cat.sortOrder ?? (currentPage - 1) * itemsPerPage + index + 1) <= 10 ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap"
                              title="Appears in Top 10 Storefront Mega Navbar"
                            >
                              Navbar #{cat.sortOrder ?? (currentPage - 1) * itemsPerPage + index + 1}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap"
                              title="Position beyond 10 is hidden from top 10 navbar"
                            >
                              #{cat.sortOrder} (Extra)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & Icon */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                              {cat.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              ID: {cat.id.slice(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">
                        /{cat.slug}
                      </td>

                      {/* Sub-categories Count */}
                      <td className="px-5 py-3.5">
                        {isStandalone ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                            Standalone (0 Sub-categories)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <FolderTree className="w-3 h-3" />
                            {subCount} Sub-Categories
                          </span>
                        )}
                      </td>

                      {/* Hierarchy Type */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                          Root / Main
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add Subcategory under this */}
                          <button
                            onClick={() => {
                              setSelectedParentForChild(cat.id);
                              setIsAddModalOpen(true);
                            }}
                            title="Add sub-category under this category"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground text-[11px] font-medium transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span className="hidden lg:inline">Sub-Category</span>
                          </button>

                          {/* View on Storefront */}
                          <a
                            href={`http://localhost:3000/products?category=${cat.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Live Storefront"
                            className="p-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                            title="Delete Category"
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

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedParentForChild(null);
        }}
        onSuccess={async (newCat) => {
          setIsAddModalOpen(false);
          setSelectedParentForChild(null);
          showToast(`Category "${newCat.name}" added successfully!`);
          await loadData();
        }}
        mainCategories={mainCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        initialParentId={selectedParentForChild}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget?.id === "bulk" ? "Confirm Bulk Deletion" : "Delete Main Category"}
        itemName={deleteTarget?.name}
        itemType="Main Category"
        isDeleting={isDeleting}
      />
    </AdminShell>
  );
}

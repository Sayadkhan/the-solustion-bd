"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import { AddCategoryModal } from "@/components/add-category-modal";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  FolderTree,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Filter,
  CheckCircle2,
  CornerDownRight,
} from "lucide-react";

export default function SubCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [parentFilter, setParentFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Map of category ID to category name for parent lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, any>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Main Categories list for the filter dropdown
  const mainCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  // Sub-Categories list (only categories that HAVE a parentId)
  const subCategories = useMemo(() => {
    return categories.filter((c) => !!c.parentId);
  }, [categories]);

  // Filtered list
  const filteredSubCategories = useMemo(() => {
    return subCategories.filter((sub) => {
      // Parent filter
      if (parentFilter !== "ALL" && sub.parentId !== parentFilter) {
        return false;
      }
      // Search
      const parentName = categoryMap.get(sub.parentId)?.name || "";
      const query = searchTerm.toLowerCase();
      const matchSearch =
        sub.name.toLowerCase().includes(query) ||
        sub.slug.toLowerCase().includes(query) ||
        parentName.toLowerCase().includes(query);

      return matchSearch;
    });
  }, [subCategories, parentFilter, searchTerm, categoryMap]);

  // Pagination
  const totalItems = filteredSubCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSubCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubCategories.slice(start, start + itemsPerPage);
  }, [filteredSubCategories, currentPage, itemsPerPage]);

  // Selection logic for bulk actions
  const isAllSelected =
    paginatedSubCategories.length > 0 &&
    paginatedSubCategories.every((s) => selectedIds.includes(s.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginatedSubCategories.some((s) => s.id === id))
      );
    } else {
      const newIds = Array.from(
        new Set([...selectedIds, ...paginatedSubCategories.map((s) => s.id)])
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
        showToast(`${selectedIds.length} sub-categories deleted successfully!`);
        setSelectedIds([]);
      } else {
        const res = await adminApi.deleteCategory(deleteTarget.id);
        if (res?.success) {
          showToast(`Sub-category "${deleteTarget.name}" deleted successfully!`);
          setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        } else {
          alert(res?.message || "Failed to delete sub-category.");
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
      title="Sub-Categories"
      subtitle="Manage child categories mapped to primary hardware root groups"
      onRefresh={loadData}
      isRefreshing={loading}
      actions={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sub-Category</span>
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
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Hierarchical Child Categories Tree
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each sub-category is mapped to a parent main category to power storefront navigation & filtering.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-foreground font-semibold">
            Total Sub-Categories: {subCategories.length}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by sub-category name, slug, or parent..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Parent Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={parentFilter}
            onChange={(e) => {
              setParentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-card border border-border text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Parent Categories ({subCategories.length})</option>
            {mainCategories.map((m) => {
              const count = subCategories.filter((s) => s.parentId === m.id).length;
              return (
                <option key={m.id} value={m.id}>
                  {m.name} ({count} subs)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-primary/10 border border-primary/20 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground">
              {selectedIds.length} sub-categories selected
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
                name: `${selectedIds.length} selected sub-categories`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Sub Categories Data Table */}
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
                <th className="px-5 py-3.5">Sub-Category Name</th>
                <th className="px-5 py-3.5">Parent Category</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Loading sub-categories...
                  </td>
                </tr>
              ) : paginatedSubCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    No sub-categories found.
                  </td>
                </tr>
              ) : (
                paginatedSubCategories.map((sub, index) => {
                  const parentObj = categoryMap.get(sub.parentId);
                  const isChecked = selectedIds.includes(sub.id);

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-muted/30 transition-colors group ${
                        isChecked ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(sub.id)}
                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Serial Number Column (#) */}
                      <td className="w-12 px-3 py-3.5 text-center font-mono text-muted-foreground font-semibold text-[11px]">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                            <CornerDownRight className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                              {sub.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              ID: {sub.id.slice(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent Category Badge */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          <Layers className="w-3 h-3" />
                          {parentObj?.name || "Unknown Parent"}
                        </span>
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">
                        /{sub.slug}
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                          Sub-Category
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
                          {/* View on Storefront */}
                          <a
                            href={`http://localhost:3000/products?category=${sub.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Live Storefront"
                            className="p-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget({ id: sub.id, name: sub.name })}
                            title="Delete Sub-category"
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

      {/* Add Sub Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async (newCat) => {
          setIsAddModalOpen(false);
          showToast(`Sub-category "${newCat.name}" added successfully!`);
          await loadData();
        }}
        mainCategories={mainCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        initialParentId={parentFilter !== "ALL" ? parentFilter : mainCategories[0]?.id || null}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget?.id === "bulk" ? "Confirm Bulk Deletion" : "Delete Sub-Category"}
        itemName={deleteTarget?.name}
        itemType="Sub-Category"
        isDeleting={isDeleting}
      />
    </AdminShell>
  );
}

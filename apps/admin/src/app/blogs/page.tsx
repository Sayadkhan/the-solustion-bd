"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import { AddBlogModal } from "@/components/add-blog-modal";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Globe,
  Pencil,
} from "lucide-react";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getBlogs();
      if (res?.items && Array.isArray(res.items)) {
        setBlogs(res.items);
      }
    } catch (err) {
      console.error("Failed to load blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const q = searchTerm.toLowerCase();
      return (
        b.title?.toLowerCase().includes(q) ||
        b.slug?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
      );
    });
  }, [blogs, searchTerm]);

  // Pagination
  const totalItems = filteredBlogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBlogs.slice(start, start + itemsPerPage);
  }, [filteredBlogs, currentPage, itemsPerPage]);

  const isAllSelected =
    paginatedBlogs.length > 0 &&
    paginatedBlogs.every((b) => selectedIds.includes(b.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedBlogs.map((b) => b.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedBlogs.map((b) => b.id);
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
        await Promise.all(selectedIds.map((id) => adminApi.deleteBlog(id)));
        showToast(`${selectedIds.length} blog posts deleted successfully!`);
        setSelectedIds([]);
      } else {
        const res = await adminApi.deleteBlog(deleteTarget.id);
        if (res?.success) {
          showToast(`Blog post "${deleteTarget.title}" deleted successfully!`);
          setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        } else {
          alert(res?.message || "Failed to delete blog.");
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
      title="Tech Blogs & SEO Engine"
      subtitle="Publish internal backlink-driven tech guides and SERP optimized content"
      onRefresh={loadData}
      isRefreshing={loading}
      actions={
        <button
          onClick={() => {
            setEditingBlog(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Write Tech Blog</span>
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
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Google Search Optimization & Organic Traffic Engine
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Articles published with automated backlink anchors and live Google SERP preview.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-foreground font-semibold">
            Published Blogs: {blogs.length}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search blogs by title, slug or category..."
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
              {selectedIds.length} blog posts selected
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
                title: `${selectedIds.length} selected blog posts`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Blogs Table */}
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
                <th className="px-5 py-3.5">Title & Slug</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Backlinks</th>
                <th className="px-5 py-3.5">Views</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Loading blogs...
                  </td>
                </tr>
              ) : paginatedBlogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    No blog posts found.
                  </td>
                </tr>
              ) : (
                paginatedBlogs.map((b, index) => {
                  const isChecked = selectedIds.includes(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-muted/30 transition-colors group ${
                        isChecked ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(b.id)}
                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Serial Number */}
                      <td className="px-3 py-3.5 text-center font-mono text-muted-foreground text-xs">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Title & Slug */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors max-w-md line-clamp-1">
                          {b.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          /blogs/{b.slug}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border">
                          {b.category || "PC Hardware"}
                        </span>
                      </td>

                      {/* Backlinks */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-primary">
                          {Array.isArray(b.backlinks) ? b.backlinks.length : 0} Links
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">
                        {b.viewsCount || 0} views
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Published
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit with WordPress Editor */}
                          <button
                            onClick={() => {
                              setEditingBlog(b);
                              setIsAddModalOpen(true);
                            }}
                            title="Edit Blog in WordPress Editor"
                            className="p-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Live Blog link */}
                          <a
                            href={`http://localhost:3000/blogs/${b.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on live storefront"
                            className="p-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget({ id: b.id, title: b.title })}
                            title="Delete Blog"
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

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Add / Edit Blog Modal with WordPress Editor */}
      <AddBlogModal
        isOpen={isAddModalOpen}
        initialBlog={editingBlog}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBlog(null);
        }}
        onSuccess={async (savedBlog) => {
          setIsAddModalOpen(false);
          setEditingBlog(null);
          showToast(`Blog "${savedBlog.title}" saved successfully!`);
          await loadData();
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Tech Blog Post"
        itemName={deleteTarget?.title}
        itemType="Blog"
        isDeleting={isDeleting}
      />
    </AdminShell>
  );
}

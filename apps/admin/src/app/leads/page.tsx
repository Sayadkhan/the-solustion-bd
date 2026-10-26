"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import { formatBdt } from "@solusation/shared-types";
import {
  Building2,
  Search,
  MessageSquare,
  Mail,
  CheckCircle2,
  Filter,
  ExternalLink,
  Phone,
} from "lucide-react";

export default function CorporateLeadsPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getInquiries();
      if (res?.data && Array.isArray(res.data)) {
        setInquiries(res.data);
      }
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (
    id: string,
    status: "PENDING" | "CONTACTED" | "RESOLVED" | "ARCHIVED"
  ) => {
    try {
      const res = await adminApi.updateInquiryStatus(id, status);
      if (res?.success) {
        showToast("Lead status updated successfully!");
        await loadData();
      } else {
        alert(res?.message || "Failed to update status.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Filtered leads
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter !== "ALL" && inq.status !== statusFilter) return false;
      const q = searchTerm.toLowerCase();
      return (
        inq.companyName?.toLowerCase().includes(q) ||
        inq.contactPerson?.toLowerCase().includes(q) ||
        inq.phone?.toLowerCase().includes(q) ||
        inq.email?.toLowerCase().includes(q) ||
        inq.details?.toLowerCase().includes(q)
      );
    });
  }, [inquiries, statusFilter, searchTerm]);

  // Pagination
  const totalItems = filteredInquiries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedInquiries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInquiries.slice(start, start + itemsPerPage);
  }, [filteredInquiries, currentPage, itemsPerPage]);

  return (
    <AdminShell
      title="Corporate & B2B Leads"
      subtitle="Enterprise procurement quotations and bulk IT hardware inquiries"
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

      {/* Info Card Banner */}
      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Corporate Quotation Inquiries & Office PC Setup
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              1-click direct response via WhatsApp Quotation or customized Email Quote.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-foreground font-semibold">
            Total Leads: {inquiries.length}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search company, person, phone or requirements..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-card border border-border text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONTACTED">Contacted</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="w-12 px-3 py-3.5 text-center text-muted-foreground font-mono">
                  #
                </th>
                <th className="px-5 py-3.5">Organization & Contact</th>
                <th className="px-5 py-3.5">Requirements</th>
                <th className="px-5 py-3.5">Budget (৳)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Loading inquiries...
                  </td>
                </tr>
              ) : paginatedInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No corporate leads found.
                  </td>
                </tr>
              ) : (
                paginatedInquiries.map((inq, index) => (
                  <tr
                    key={inq.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Serial Number */}
                    <td className="px-3 py-3.5 text-center font-mono text-muted-foreground text-xs">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    {/* Organization & Contact */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        {inq.companyName || "Personal Inquiry"}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{inq.contactPerson}</span>
                        <span>•</span>
                        <span className="font-mono">{inq.phone}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {inq.email}
                      </div>
                    </td>

                    {/* Requirements */}
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-foreground max-w-sm line-clamp-2">
                        {inq.details || inq.requirements || "Details not specified"}
                      </p>
                    </td>

                    {/* Budget */}
                    <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {inq.budget ? formatBdt(inq.budget) : "Negotiable"}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <select
                        value={inq.status}
                        onChange={(e) =>
                          handleStatusChange(
                            inq.id,
                            e.target.value as "PENDING" | "CONTACTED" | "RESOLVED" | "ARCHIVED"
                          )
                        }
                        className="bg-card border border-border text-foreground rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp quote */}
                        <a
                          href={`https://wa.me/${inq.phone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Hello ${inq.contactPerson}, Greetings from The Solusation BD! Regarding your inquiry for ${inq.companyName}, here is the quotation detail...`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Mail quote */}
                        <a
                          href={`mailto:${inq.email}?subject=${encodeURIComponent(
                            `The Solusation BD Quotation for ${inq.companyName}`
                          )}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-border hover:bg-muted text-foreground text-[11px] font-medium transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
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
    </AdminShell>
  );
}

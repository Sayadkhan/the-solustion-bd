"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import {
  ShieldCheck,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";

export default function SerialsWarrantyPage() {
  const [serials, setSerials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Warranty Lookup State
  const [lookupInput, setLookupInput] = useState("");
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Register Serial Form State
  const [newSerialNo, setNewSerialNo] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [supplierName, setSupplierName] = useState("UCC Bangladesh (Authorized Distributor)");
  const [registering, setRegistering] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [sersRes, prodRes] = await Promise.all([
        adminApi.getSerials(),
        adminApi.getProducts({ limit: 100 }),
      ]);

      if (sersRes?.data && Array.isArray(sersRes.data)) setSerials(sersRes.data);
      if (prodRes?.data && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
        if (prodRes.data.length > 0 && !selectedProductId) {
          setSelectedProductId(prodRes.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load serials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;

    try {
      setLookupLoading(true);
      const res = await adminApi.lookupWarranty(lookupInput.trim());
      setLookupResult(res);
    } catch (err: any) {
      setLookupResult({ valid: false, error: err.message });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRegisterSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerialNo.trim() || !selectedProductId) {
      alert("Serial number and product are required.");
      return;
    }

    try {
      setRegistering(true);
      const res = await adminApi.registerSerial({
        serialNumber: newSerialNo.trim(),
        productId: selectedProductId,
        supplierName: supplierName.trim(),
      });

      if (res?.success) {
        showToast(`Serial "${newSerialNo.trim()}" registered successfully!`);
        setNewSerialNo("");
        await loadData();
      } else {
        alert(res?.message || "Failed to register serial.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setRegistering(false);
    }
  };

  // Filtered serials
  const filteredSerials = useMemo(() => {
    return serials.filter((s) => {
      const q = searchTerm.toLowerCase();
      return (
        s.serialNumber?.toLowerCase().includes(q) ||
        s.supplierName?.toLowerCase().includes(q) ||
        s.product?.name?.toLowerCase().includes(q)
      );
    });
  }, [serials, searchTerm]);

  // Pagination
  const totalItems = filteredSerials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSerials = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSerials.slice(start, start + itemsPerPage);
  }, [filteredSerials, currentPage, itemsPerPage]);

  return (
    <AdminShell
      title="Warranty & Box Serial Tracker"
      subtitle="Authorized distributor barcode & RMA warranty lifecycle management (Rule 4.4)"
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

      {/* Top 2 Columns: Fast Lookup & New Registration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fast Warranty Lookup Box */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Instant Warranty & RMA Lookup
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Enter retail box barcode serial (e.g. SN-RTX4080-9921)
              </p>
            </div>
          </div>

          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter barcode serial number..."
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all disabled:opacity-50"
            >
              {lookupLoading ? "Searching..." : "Verify Serial"}
            </button>
          </form>

          {/* Lookup Result Card */}
          {lookupResult && (
            <div className="p-4 rounded-xl border border-border bg-muted/30 text-xs space-y-2">
              {lookupResult.valid ? (
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valid Serial — Warranty Active</span>
                  </div>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <div>Product: <strong className="text-foreground">{lookupResult.product?.name}</strong></div>
                    <div>Distributor: <strong className="text-foreground">{lookupResult.supplierName}</strong></div>
                    <div>Warranty Expires: <strong className="text-foreground">{lookupResult.warrantyExpiresAt ? new Date(lookupResult.warrantyExpiresAt).toLocaleDateString() : "3 Years Official"}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-500 font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Serial not found. Please verify the barcode format.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Register New Serial Form */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Register New Box Serial Number
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Log newly arrived hardware units into the inventory warranty system.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterSerial} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-INTEL-14900K-001"
                  value={newSerialNo}
                  onChange={(e) => setNewSerialNo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Authorized Distributor</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary mt-1"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
            >
              {registering ? "Registering..." : "Register Serial"}
            </button>
          </form>
        </div>
      </div>

      {/* Registered Serials Table */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Registered Serials Database
            </h3>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search serial or product..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="w-12 px-3 py-3.5 text-center text-muted-foreground font-mono">
                    #
                  </th>
                  <th className="px-5 py-3.5">Serial Number</th>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-5 py-3.5">Distributor / Supplier</th>
                  <th className="px-5 py-3.5">Warranty Status</th>
                  <th className="px-5 py-3.5 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Loading serials...
                    </td>
                  </tr>
                ) : paginatedSerials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No serial numbers found.
                    </td>
                  </tr>
                ) : (
                  paginatedSerials.map((s, index) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3.5 text-center font-mono text-muted-foreground text-xs">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-foreground">
                        {s.serialNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground max-w-sm truncate">
                          {s.product?.name || "Unlinked Product"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {s.supplierName || "Official BD Distributor"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Official Warranty
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground font-mono">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>
    </AdminShell>
  );
}

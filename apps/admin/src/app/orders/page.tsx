"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import { formatBdt } from "@solusation/shared-types";
import { InvoiceModal } from "@/components/invoice-modal";
import {
  ShoppingCart,
  Search,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Filter,
  DollarSign,
  Clock,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Order for Invoice Modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getOrders({ limit: 100 });
      if (res?.data && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (orderNumber: string, newStatus: string) => {
    try {
      const res = await adminApi.updateOrderStatus(orderNumber, newStatus);
      if (res?.success) {
        showToast(`Order #${orderNumber} status updated to: ${newStatus}`);
        await loadData();
      } else {
        alert(res?.message || "Failed to update status.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleVerifyCodDeposit = async (orderNumber: string) => {
    const trxId = prompt("Enter bKash/Nagad Deposit TrxID (Min. ৳1,000):", "TRX-" + Math.floor(100000 + Math.random() * 900000));
    if (!trxId) return;

    try {
      const res = await adminApi.verifyOrderDeposit(orderNumber, trxId, 1000);
      if (res?.success) {
        showToast(`Order #${orderNumber} deposit verified successfully!`);
        await loadData();
      } else {
        alert(res?.message || "Deposit verification failed.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const ordStatus = o.orderStatus || o.status || "PENDING";
      if (statusFilter !== "ALL" && ordStatus !== statusFilter) return false;
      const q = searchTerm.toLowerCase();
      const invoiceNo = String(o.invoiceNo || o.orderNumber || o.id || "").toLowerCase();
      const customerName = String(o.customerName || "").toLowerCase();
      const customerPhone = String(o.customerPhone || "").toLowerCase();
      const address = String(o.address || o.deliveryAddress || "").toLowerCase();
      return (
        invoiceNo.includes(q) ||
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        address.includes(q)
      );
    });
  }, [orders, statusFilter, searchTerm]);

  // Pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  return (
    <AdminShell
      title="Orders & POS Invoices"
      subtitle="Cash on Delivery, Advance Verification & POS Cash Memo Management"
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
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Order Fulfillment & POS Register
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verify Outside Dhaka advance deposits and generate formatted thermal/A4 cash memos.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-foreground font-semibold">
            Total Orders: {orders.length}
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
            placeholder="Search by order no, customer name or phone..."
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
            <option value="ALL">All Order Status</option>
            <option value="PENDING">Pending</option>
            <option value="PENDING_DEPOSIT">Pending Deposit (Outside Dhaka)</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="w-12 px-3 py-3.5 text-center text-muted-foreground font-mono">
                  #
                </th>
                <th className="px-5 py-3.5">Order No</th>
                <th className="px-5 py-3.5">Customer Details</th>
                <th className="px-5 py-3.5">Payment & Location</th>
                <th className="px-5 py-3.5">Total Amount (৳)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Loading orders...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord, index) => {
                  const invoiceNo = ord.invoiceNo || ord.orderNumber || ord.id?.slice(0, 8) || "N/A";
                  const ordStatus = ord.orderStatus || ord.status || "PENDING";
                  const customerName = ord.customerName || "Customer";
                  const customerPhone = ord.customerPhone || "N/A";
                  const address = ord.address
                    ? `${ord.address}${ord.area ? `, ${ord.area}` : ""}${ord.district ? `, ${ord.district}` : ""}`
                    : (ord.deliveryAddress || "N/A");
                  const isOutsideDhaka = ord.isOutsideDhaka ?? (ord.district && ord.district.toLowerCase() !== "dhaka");
                  const isAdvanceVerified = ord.advancePaymentVerified ?? ((ord.paidAmountBdt || 0) >= 1000);
                  const depositTrx = ord.trxId || ord.depositTrxId || "Paid";
                  const totalAmount = ord.totalPayableBdt ?? ord.totalAmountBdt ?? ord.totalAmount ?? 0;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Serial Number */}
                      <td className="px-3 py-3.5 text-center font-mono text-muted-foreground text-xs">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Order Number */}
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                          #{invoiceNo}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {new Date(ord.createdAt).toLocaleString()}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-foreground text-xs">
                          {customerName}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {customerPhone}
                        </div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-xs">
                          {address}
                        </div>
                      </td>

                      {/* Payment & Location */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground uppercase">
                            {ord.paymentMethod || "COD"}
                          </span>
                          {isOutsideDhaka ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Outside Dhaka
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              Inside Dhaka
                            </span>
                          )}
                        </div>
                        {isOutsideDhaka && (
                          <div className="mt-1">
                            {isAdvanceVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                                <CheckCircle2 className="w-3 h-3" /> Deposit Verified ({depositTrx})
                              </span>
                            ) : (
                              <button
                                onClick={() => handleVerifyCodDeposit(invoiceNo)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:underline"
                              >
                                <AlertTriangle className="w-3 h-3" /> Deposit Unverified (Click to verify)
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatBdt(totalAmount)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-5 py-3.5">
                        <select
                          value={ordStatus}
                          onChange={(e) => handleStatusChange(invoiceNo, e.target.value)}
                          className="bg-card border border-border text-foreground rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PENDING_DEPOSIT">PENDING DEPOSIT</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5 text-primary" />
                          <span>Cash Memo</span>
                        </button>
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

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </AdminShell>
  );
}

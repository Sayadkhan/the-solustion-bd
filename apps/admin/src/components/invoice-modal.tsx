"use client";

import React from "react";
import { formatBdt } from "@solusation/shared-types";
import { Printer, X, ShieldCheck, CheckCircle2 } from "lucide-react";

interface InvoiceModalProps {
  order: any;
  onClose: () => void;
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isDepositPaid = (order.paidAmountBdt || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Printable Customer Invoice</span>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-primary/10 text-primary">
              #{order.invoiceNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 space-y-6 text-foreground bg-card print:p-0 print:text-black">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <img src="/logo.png" alt="The Solutions BD" className="h-9 w-auto object-contain" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-primary">THE SOLUTIONS BD</h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                An Incomparable IT Solution Provider & Official Warranty Center
              </p>
              <div className="text-[11px] text-muted-foreground space-y-0.5 mt-1 leading-snug">
                <p>
                  <span className="font-bold text-foreground">Gulshan Office:</span> House- NWH- 12, Road- 53, Circle- 2, Gulshan Avenue, Dhaka- 1212.
                </p>
                <p>
                  <span className="font-bold text-foreground">IDB Office:</span> SR- 140, BCS Computer City, IDB Bhaban (1st Floor), Agargaon, Dhaka- 1207.
                </p>
                <p>
                  Hotline: 01711-319090, 01922-730343 | Tel: 9183295 | Email: thesolutionsbd@gmail.com | Web: thesolutionsbd.com
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase rounded bg-muted text-foreground border border-border">
                {order.orderStatus || "CONFIRMED"}
              </span>
              <p className="text-xs font-mono font-bold mt-2">INVOICE: #{order.invoiceNo}</p>
              <p className="text-xs text-muted-foreground">
                Date: {new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          {/* Billing & Shipping Info */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-muted/30 border border-border/60 text-xs">
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Customer Information:
              </p>
              <p className="font-bold text-sm text-foreground">{order.customerName}</p>
              <p className="font-mono text-muted-foreground">Mobile: {order.customerPhone}</p>
              {order.customerEmail && <p className="text-muted-foreground">Email: {order.customerEmail}</p>}
            </div>
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Delivery Destination:
              </p>
              <p className="font-medium text-foreground">{order.address}</p>
              <p className="text-muted-foreground">
                Area: {order.area}, District: {order.district}
              </p>
              <p className="text-muted-foreground mt-1">
                Payment Method:{" "}
                <span className="font-bold uppercase text-foreground">{order.paymentMethod}</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted border-b border-border font-semibold text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Item & Hardware Specification</th>
                  <th className="py-2.5 px-4">Warranty</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="py-3 px-4 font-mono text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-foreground">{item.productName}</p>
                        {Array.isArray(item.assignedSerials) && item.assignedSerials.length > 0 && (
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            SN: {item.assignedSerials.join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" /> 3 Years Official
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">{item.qty}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatBdt(item.unitPriceBdt)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        {formatBdt(item.unitPriceBdt * item.qty)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      No items found in this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatBdt(order.totalPayableBdt || 0)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Charge:</span>
                <span className="font-mono font-medium text-foreground">
                  {order.district?.toLowerCase() === "dhaka" ? "৳80" : "৳150"}
                </span>
              </div>
              {isDepositPaid && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Advance Deposit Paid:
                  </span>
                  <span className="font-mono">-{formatBdt(order.paidAmountBdt || 0)}</span>
                </div>
              )}
              {order.trxId && (
                <div className="text-[11px] text-muted-foreground text-right font-mono">
                  TrxID: {order.trxId}
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-foreground">
                <span>Net Due Amount:</span>
                <span className="font-mono text-primary text-base">
                  {formatBdt(order.dueAmountBdt ?? order.totalPayableBdt)}
                </span>
              </div>
            </div>
          </div>

          {/* Warranty Terms & Signature */}
          <div className="border-t border-border pt-4 text-[10px] text-muted-foreground leading-relaxed">
            <p className="font-bold text-foreground mb-1 uppercase tracking-wider">
              Official Warranty Policy & Terms:
            </p>
            <p>
              1. To claim official brand warranty, the customer must present this original Cash Memo/Invoice and
              the intact product box with the matching serial number sticker.
            </p>
            <p>
              2. Physical damage, circuit burns, water ingress, or improper power supply connections void official
              manufacturer warranty claims immediately.
            </p>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-12 pb-4 text-xs text-muted-foreground">
            <div className="text-center w-40 border-t border-dashed border-border pt-1">
              Customer Signature
            </div>
            <div className="text-center w-40 border-t border-dashed border-border pt-1">
              Authorized Signature & Seal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

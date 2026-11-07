"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { formatBdt } from "@solusation/shared-types";
import { storefrontApi } from "@/lib/api";
import { clearPendingBkashInvoice, readPendingBkashInvoice } from "@/lib/bkash-pending";

type Result =
  | { state: "working" }
  | { state: "paid"; invoiceNo: string; trxID: string; amount: number }
  | { state: "failed"; message: string; invoiceNo: string | null };

/** bKash redirects the customer here with ?paymentID=...&status=success|cancel|failure */
export default function BkashReturnPage() {
  const [result, setResult] = useState<Result>({ state: "working" });
  const [retrying, setRetrying] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    // Effects can run twice in development; a payment must be executed once.
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const paymentID = params.get("paymentID");
    const status = params.get("status");
    const invoiceNo = readPendingBkashInvoice();

    if (status !== "success" || !paymentID) {
      setResult({
        state: "failed",
        invoiceNo,
        message:
          status === "cancel"
            ? "You cancelled the bKash payment. Your order is saved and no money was taken."
            : "The bKash payment did not complete. Your order is saved and is waiting for payment.",
      });
      return;
    }

    storefrontApi.executeBkashPayment(paymentID).then((res) => {
      if (res?.success && res.data?.trxID) {
        clearPendingBkashInvoice();
        setResult({
          state: "paid",
          invoiceNo: res.data.invoiceNo,
          trxID: res.data.trxID,
          amount: res.data.amount,
        });
      } else {
        setResult({
          state: "failed",
          invoiceNo,
          message: res?.message || "We could not confirm this payment with bKash.",
        });
      }
    });
  }, []);

  const retry = async (invoiceNo: string) => {
    setRetrying(true);
    const payment = await storefrontApi.createBkashPayment(invoiceNo);
    if (payment?.success && payment.data?.bkashURL) {
      window.location.href = payment.data.bkashURL;
      return;
    }
    setRetrying(false);
    setResult({ state: "failed", invoiceNo, message: payment?.message || "Could not reopen bKash. Please try again." });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4 shadow-xl">
        {result.state === "working" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Confirming your payment…</h1>
            <p className="text-sm text-muted-foreground">Please keep this page open.</p>
          </>
        )}

        {result.state === "paid" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Payment successful</h1>
            <p className="text-sm text-muted-foreground">
              We received {formatBdt(result.amount)} for order #{result.invoiceNo}.
            </p>
            <p className="text-xs text-muted-foreground">
              bKash TrxID: <span className="font-bold text-[#E2136E]">{result.trxID}</span>
            </p>
            <Link
              href="/track-order"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl text-xs transition-all"
            >
              Track Your Order
            </Link>
          </>
        )}

        {result.state === "failed" && (
          <>
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Payment not completed</h1>
            <p className="text-sm text-muted-foreground">{result.message}</p>
            {result.invoiceNo && (
              <p className="text-xs text-muted-foreground">
                Your invoice number: <span className="font-bold text-primary">{result.invoiceNo}</span>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {result.invoiceNo && (
                <button
                  type="button"
                  disabled={retrying}
                  onClick={() => result.invoiceNo && retry(result.invoiceNo)}
                  className="bg-[#E2136E] hover:bg-[#c20f5d] text-white font-bold px-6 py-3 rounded-xl text-xs disabled:opacity-60 transition-all"
                >
                  {retrying ? "Opening bKash…" : "Try Payment Again"}
                </button>
              )}
              <Link
                href="/"
                className="bg-muted text-foreground border border-border font-bold px-6 py-3 rounded-xl text-xs transition-all"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

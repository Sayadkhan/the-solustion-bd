"use client";

import React, { useEffect, useState } from "react";
import { X, ShieldCheck, AlertCircle, Copy, Check, Loader2, PhoneCall, ExternalLink } from "lucide-react";
import { formatBdt } from "@solusation/shared-types";
import { storefrontApi } from "@/lib/api";

interface BkashModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  isSubmitting: boolean;
  onPayWithGateway: () => void;
  onSubmitTrxId: (trxId: string) => void;
}

const FALLBACK_MERCHANT_NUMBER = "01922-730343";

/**
 * Two ways to pay. Online sends the customer to bKash's own page. This site must
 * never ask for a bKash PIN or OTP. Send Money collects a TrxID that stays
 * unverified until staff have checked it against the bKash account.
 */
export function BkashModal({
  isOpen,
  onClose,
  amount,
  isSubmitting,
  onPayWithGateway,
  onSubmitTrxId,
}: BkashModalProps) {
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [merchantNumber, setMerchantNumber] = useState(FALLBACK_MERCHANT_NUMBER);
  const [tab, setTab] = useState<"GATEWAY" | "MANUAL">("MANUAL");
  const [trxId, setTrxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    storefrontApi.getBkashConfig().then((res) => {
      if (!active || !res?.data) return;
      setMerchantNumber(res.data.merchantNumber || FALLBACK_MERCHANT_NUMBER);
      setGatewayEnabled(res.data.gatewayEnabled);
      if (res.data.gatewayEnabled) setTab("GATEWAY");
    });
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(merchantNumber.replace(/[^0-9]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitTrxId = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trxId.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,14}$/.test(clean)) {
      setError("Please enter the 8-14 character TrxID from your bKash SMS (e.g. BLA92KJ831).");
      return;
    }
    setError(null);
    onSubmitTrxId(clean);
  };

  const tabClass = (active: boolean) =>
    `flex-1 py-2.5 text-center transition-all ${
      active ? "bg-white text-[#E2136E] border-b-2 border-[#E2136E]" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-200">
        <div className="bg-[#E2136E] text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="text-left">
            <h3 className="font-extrabold text-base tracking-wide">Pay with bKash</h3>
            <p className="text-[11px] text-pink-100 font-medium">The Solutions BD</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-pink-50 border-b border-pink-100 px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Payable Amount</span>
          <span className="text-base font-black text-[#E2136E]">{formatBdt(amount)}</span>
        </div>

        {gatewayEnabled && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button type="button" onClick={() => setTab("GATEWAY")} className={tabClass(tab === "GATEWAY")}>
              Pay Online
            </button>
            <button type="button" onClick={() => setTab("MANUAL")} className={tabClass(tab === "MANUAL")}>
              Send Money / TrxID
            </button>
          </div>
        )}

        {error && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {tab === "GATEWAY" && gatewayEnabled ? (
          <div className="p-5 text-left space-y-4">
            <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                We will save your order and take you to bKash&apos;s secure page. Enter your OTP and PIN there only.
                This website will never ask for them.
              </span>
            </div>
            <button
              type="button"
              onClick={onPayWithGateway}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-black bg-[#E2136E] hover:bg-[#c20f5d] text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Continue to bKash</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-5 text-left space-y-4">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800">Send {formatBdt(amount)} from the bKash app or *247# to:</div>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-pink-200">
                <div className="text-sm font-black text-[#E2136E]">{merchantNumber}</div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="px-2.5 py-1.5 bg-pink-100 hover:bg-pink-200 text-[#E2136E] font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitTrxId} className="space-y-3.5">
              <div className="space-y-1.5">
                <label htmlFor="bkash-trx-id" className="text-xs font-bold text-slate-700 block">
                  bKash TrxID (Transaction ID): <span className="text-rose-500">*</span>
                </label>
                <input
                  id="bkash-trx-id"
                  type="text"
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  placeholder="e.g. BLA92KJ831"
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-[#E2136E] text-slate-900 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wider outline-none transition-all placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                />
                <p className="text-[10px] text-slate-500">
                  Your order will be confirmed after our team checks this payment.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-100 text-slate-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black bg-[#E2136E] hover:bg-[#c20f5d] text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit & Place Order</span>}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <PhoneCall className="w-3 h-3 text-[#E2136E]" />
          <span>Need help? Call bKash Helpline 16247 or Support: 01711-319090</span>
        </div>
      </div>
    </div>
  );
}

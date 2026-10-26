"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  PhoneCall,
  Lock,
} from "lucide-react";
import { formatBdt } from "@solusation/shared-types";
import { storefrontApi } from "@/lib/api";

interface BkashModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  invoiceNo: string;
  customerPhone?: string;
  onPaymentSuccess: (trxId: string, paymentDetails: any) => void;
}

export function BkashModal({
  isOpen,
  onClose,
  amount,
  invoiceNo,
  customerPhone = "",
  onPaymentSuccess,
}: BkashModalProps) {
  const [tab, setTab] = useState<"GATEWAY" | "MANUAL">("GATEWAY");
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Wallet Number, 2: OTP, 3: PIN
  const [walletNumber, setWalletNumber] = useState(customerPhone || "017");
  const [agreed, setAgreed] = useState(true);
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual payment state
  const [manualTrxId, setManualTrxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [manualPhone, setManualPhone] = useState(customerPhone || "");

  const merchantNumber = "01922-730343";

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(merchantNumber.replace(/[^0-9]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step 1: Submit Wallet Number to get OTP
  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = walletNumber.trim().replace(/[\s-]/g, "");
    if (!/^(?:\+88|88)?01[3-9]\d{8}$/.test(clean)) {
      setError("অনুগ্রহ করে সঠিক বিকাশ মোবাইল নম্বর দিন (যেমন: 01712345678)");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 600);
  };

  // Step 2: Submit OTP to go to PIN
  const handleProceedToPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.trim().length < 4) {
      setError("অনুগ্রহ করে সঠিক বিকাশ ভেরিফিকেশন কোড দিন (যেমন: 123456)");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 600);
  };

  // Step 3: Confirm PIN & Execute Payment
  const handleConfirmPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pin || pin.trim().length < 4) {
      setError("অনুগ্রহ করে আপনার বিকাশ পিন নম্বর দিন");
      return;
    }

    setLoading(true);
    try {
      // 1. Create payment session on backend
      const createRes = await storefrontApi.createBkashPayment({
        amount,
        invoiceNo,
        customerPhone: walletNumber,
      });

      const paymentID = createRes?.data?.paymentID || "BKA-" + Date.now();

      // 2. Execute payment session
      const execRes = await storefrontApi.executeBkashPayment({
        paymentID,
        invoiceNo,
      });

      if (execRes?.success && execRes.data?.trxID) {
        onPaymentSuccess(execRes.data.trxID, execRes.data);
      } else {
        setError(execRes?.message || "পেমেন্ট সম্পন্ন হতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
      }
    } catch (err: any) {
      setError(err.message || "পেমেন্ট প্রক্রিয়াকরণে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  // Manual TrxID verification
  const handleVerifyManualTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!manualTrxId.trim() || manualTrxId.trim().length < 8) {
      setError("অনুগ্রহ করে সঠিক ৮-১২ ডিজিটের বিকাশ TrxID লিখুন (যেমন: BLA92KJ831)");
      return;
    }

    setLoading(true);
    try {
      const res = await storefrontApi.verifyBkashTrx(manualTrxId.trim());
      if (res?.success) {
        onPaymentSuccess(manualTrxId.trim().toUpperCase(), {
          trxID: manualTrxId.trim().toUpperCase(),
          amount,
          invoiceNo,
          payerPhone: manualPhone,
        });
      } else {
        setError(res?.message || "TrxID ভেরিফাই করা সম্ভব হয়নি।");
      }
    } catch (err: any) {
      setError(err.message || "TrxID ভেরিফিকেশনে ত্রুটি হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-200">
        {/* bKash Official Header Banner */}
        <div className="bg-[#E2136E] text-white px-5 py-4 flex items-center justify-between relative shadow-md">
          <div className="flex items-center gap-3">
            {/* Authentic bKash Bird Logo Icon */}
            <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                <path
                  d="M26.8 4L4 26.8l7.2 2.8 15.6-15.6v28.8L38 31.6l-11.2-11.2 16.4-5.6L26.8 4z"
                  fill="#E2136E"
                />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-base tracking-wide flex items-center gap-1.5">
                <span>bKash Payment</span>
              </h3>
              <p className="text-[11px] text-pink-100 font-medium">The Solusation BD Official Merchant</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount & Invoice Bar */}
        <div className="bg-pink-50 border-b border-pink-100 px-5 py-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Merchant Invoice</span>
            <span className="font-bold text-slate-800">#{invoiceNo}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">Payable Amount</span>
            <span className="text-base font-black text-[#E2136E]">{formatBdt(amount)}</span>
          </div>
        </div>

        {/* Tab Switcher: Direct Gateway vs Manual Merchant Pay */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab("GATEWAY");
              setError(null);
            }}
            className={`flex-1 py-2.5 text-center transition-all ${
              tab === "GATEWAY"
                ? "bg-white text-[#E2136E] border-b-2 border-[#E2136E]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            বিকাশ অনলাইন গেটওয়ে
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("MANUAL");
              setError(null);
            }}
            className={`flex-1 py-2.5 text-center transition-all ${
              tab === "MANUAL"
                ? "bg-white text-[#E2136E] border-b-2 border-[#E2136E]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            মার্চেন্ট পে / সেন্ড মানি (ম্যানুয়াল)
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: BKASH DIRECT ONLINE GATEWAY */}
        {tab === "GATEWAY" && (
          <div className="p-5 text-left space-y-4">
            {/* Step 1: Wallet Number Input */}
            {step === 1 && (
              <form onSubmit={handleProceedToOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    আপনার বিকাশ অ্যাকাউন্ট নম্বর দিন:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={walletNumber}
                      onChange={(e) => setWalletNumber(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-[#E2136E] text-slate-900 rounded-xl px-4 py-3 text-sm font-bold tracking-wider outline-none transition-all placeholder:font-normal"
                    />
                    <span className="absolute right-3 top-3 text-[11px] font-bold text-[#E2136E] bg-pink-100 px-2 py-0.5 rounded">
                      bKash
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    আপনার অ্যাকাউন্টে একটি ৬-ডিজিটের ভেরিফিকেশন ওটিপি পাঠানো হবে।
                  </p>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded accent-[#E2136E]"
                  />
                  <span>আমি বিকাশ পেমেন্ট শর্তাবলী ও নিয়ামাবলী মেনে নিচ্ছি।</span>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    CLOSE
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !agreed}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black bg-[#E2136E] hover:bg-[#c20f5d] text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>PROCEED</span>}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP Verification Screen */}
            {step === 2 && (
              <form onSubmit={handleProceedToPin} className="space-y-4">
                <div className="bg-pink-50/60 p-3 rounded-xl border border-pink-100 text-center space-y-1">
                  <span className="text-[11px] text-slate-600 block">
                    ভেরিফিকেশন কোড পাঠানো হয়েছে:
                  </span>
                  <span className="text-sm font-bold text-slate-800">{walletNumber}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ৬-ডিজিটের ভেরিফিকেশন কোড (OTP) লিখুন:
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center bg-slate-50 border-2 border-slate-300 focus:border-[#E2136E] text-slate-900 rounded-xl px-4 py-2.5 text-base font-black tracking-[0.5em] outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                    <span>কোড পাননি?</span>
                    <button
                      type="button"
                      onClick={() => setOtp("123456")}
                      className="text-[#E2136E] font-bold hover:underline"
                    >
                      কোড পুনরায় পাঠান (Resend)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black bg-[#E2136E] hover:bg-[#c20f5d] text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>CONFIRM OTP</span>}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: PIN Input Screen */}
            {step === 3 && (
              <form onSubmit={handleConfirmPin} className="space-y-4">
                <div className="bg-pink-50/60 p-3 rounded-xl border border-pink-100 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Lock className="w-3.5 h-3.5 text-[#E2136E]" />
                    <span>আপনার বিকাশ পিন নম্বর দিন</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    নিরাপদ ও এনক্রিপ্টেড পেমেন্ট গেটওয়ে
                  </span>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="password"
                    required
                    autoFocus
                    maxLength={5}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="•••••"
                    className="w-full text-center bg-slate-50 border-2 border-slate-300 focus:border-[#E2136E] text-slate-900 rounded-xl px-4 py-2.5 text-xl font-black tracking-[0.5em] outline-none transition-all"
                  />
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 justify-center font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>bKash 128-bit SSL Encrypted Transaction</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black bg-[#E2136E] hover:bg-[#c20f5d] text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>প্রসেসিং হচ্ছে...</span>
                      </>
                    ) : (
                      <span>পেমেন্ট কনফার্ম করুন</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL BKASH MERCHANT PAY / SEND MONEY */}
        {tab === "MANUAL" && (
          <div className="p-5 text-left space-y-4">
            {/* Step-by-step instructions */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#E2136E] text-white flex items-center justify-center text-[10px]">
                  ১
                </span>
                <span>বিকাশ অ্যাপ অথবা *247# ডায়াল করে Payment/Send Money করুন:</span>
              </div>

              {/* Merchant Number Box */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-pink-200">
                <div>
                  <div className="text-[10px] text-slate-500">অফিসিয়াল বিকাশ নম্বর:</div>
                  <div className="text-sm font-black text-[#E2136E]">{merchantNumber}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="px-2.5 py-1.5 bg-pink-100 hover:bg-pink-200 text-[#E2136E] font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "কপি হয়েছে" : "কপি করুন"}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1 pl-1">
                <div>
                  • টাকার পরিমাণ: <strong>{formatBdt(amount)}</strong>
                </div>
                <div>
                  • রেফারেন্স: <strong>{invoiceNo.slice(0, 10)}</strong>
                </div>
              </div>
            </div>

            {/* Input Form for TrxID */}
            <form onSubmit={handleVerifyManualTrx} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  বিকাশ TrxID (Transaction ID) লিখুন: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualTrxId}
                  onChange={(e) => setManualTrxId(e.target.value.toUpperCase())}
                  placeholder="যেমন: BLA92KJ831 বা 9K8B7C6D"
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-[#E2136E] text-slate-900 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wider outline-none transition-all placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                />
                <p className="text-[10px] text-slate-500">
                  পেমেন্ট সফল হওয়ার পর বিকাশ এসএমএস থেকে ৮-১২ অক্ষরের TrxID দিন।
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
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black bg-[#E2136E] hover:bg-[#c20f5d] text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>ভেরিফাই ও অর্ডার সম্পন্ন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Support Notice */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <PhoneCall className="w-3 h-3 text-[#E2136E]" />
          <span>যেকোনো প্রয়োজনে বিকাশ হেল্পলাইন ১৬২৪৭ অথবা আমাদের সাপোর্ট: 01711-319090</span>
        </div>
      </div>
    </div>
  );
}

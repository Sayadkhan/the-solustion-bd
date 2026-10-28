"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  CreditCard,
  Truck,
  HelpCircle,
  Cpu,
  Facebook,
  Youtube,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { storefrontApi, ApiSiteSettings } from "@/lib/api";

export function MainFooter() {
  const [siteSettings, setSiteSettings] = useState<ApiSiteSettings | null>(null);

  useEffect(() => {
    storefrontApi.getSettings().then((s) => {
      if (s) setSiteSettings(s);
    });
  }, []);
  return (
    <footer className="bg-white text-slate-600 text-xs border-t border-slate-200">
      {/* 1. Value Badges Row */}
      <div className="border-b border-slate-100 bg-slate-50/70 py-6">
        <div className="max-w-[1600px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Official Warranty</h4>
              <p className="text-slate-500 text-[11px]">Original box S/N warranty tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <Truck className="w-8 h-8 text-cyan-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Nationwide Delivery</h4>
              <p className="text-slate-500 text-[11px]">Express courier to all 64 districts</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <CreditCard className="w-8 h-8 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Secure Payment</h4>
              <p className="text-slate-500 text-[11px]">Cash on delivery & instant bKash</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <HelpCircle className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Expert PC Consultation</h4>
              <p className="text-slate-500 text-[11px]">Live support & in-branch testing</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Star Tech Style Main Footer Columns */}
      <div className="max-w-[1600px] mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Support Hotline & Stores */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">SUPPORT</h4>

          {/* Hotline Box */}
          <a
            href={`tel:${siteSettings?.hotlineNumber || "01711-319090"}`}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 hover:border-blue-400 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">9 AM - 8 PM (Hotline)</div>
              <div className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                {siteSettings?.hotlineNumber || "01711-319090"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {siteSettings?.whatsappNumber || "01922-730343"}
              </div>
            </div>
          </a>

          {/* Store Locator Box */}
          <Link
            href="/track-order"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 hover:border-blue-400 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">2 Physical Outlets</div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Gulshan & IDB Bhaban
              </div>
              <div className="text-[10px] text-slate-500">
                Tel: 9183295
              </div>
            </div>
          </Link>
        </div>

        {/* Column 2: About Us & Links (Left sub-column) */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">ABOUT US</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/products?deals=true" className="text-slate-600 hover:text-blue-600 transition-colors">
                Affiliate Program
              </Link>
            </li>
            <li>
              <Link href="/products" className="text-slate-600 hover:text-blue-600 transition-colors">
                Online Delivery
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="text-slate-600 hover:text-blue-600 transition-colors">
                Refund and Return Policy
              </Link>
            </li>
            <li>
              <Link href="/blogs" className="text-slate-600 hover:text-blue-600 transition-colors">
                Tech Blog & Reviews
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-slate-600 hover:text-blue-600 transition-colors">
                About Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Terms & Services (Right sub-column) */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">CUSTOMER CARE</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/track-order" className="text-slate-600 hover:text-blue-600 transition-colors">
                Delivery & Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="text-slate-600 hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="text-slate-600 hover:text-blue-600 transition-colors">
                Solutions Points Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors">
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Stay Connected */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">STAY CONNECTED</h4>
          <div className="text-xs space-y-2 leading-relaxed text-slate-600">
            <div>
              <div className="font-bold text-slate-900">The Solutions BD Ltd</div>
              <p className="text-[10px] text-rose-600 font-semibold">An Incomparable IT Solution Provider</p>
            </div>
            
            <div className="space-y-1 text-[11px]">
              <div>
                <span className="font-bold text-slate-800">Gulshan Office:</span>{" "}
                <span className="text-slate-600">
                  {siteSettings?.gulshanAddress || "House- NWH- 12, Road- 53, Circle- 2, Gulshan Avenue, Dhaka- 1212"}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-800">IDB Office:</span>{" "}
                <span className="text-slate-600">
                  {siteSettings?.idbAddress || "SR- 140, BCS Computer City, IDB Bhaban (1st Floor), Agargaon, Dhaka- 1207"}
                </span>
              </div>
            </div>

            <div className="text-[11px]">
              <span className="font-medium text-slate-700">Email:</span>{" "}
              <a
                href={`mailto:${siteSettings?.contactEmail || "thesolutionsbd@gmail.com"}`}
                className="text-blue-600 hover:underline font-mono"
              >
                {siteSettings?.contactEmail || "thesolutionsbd@gmail.com"}
              </a>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-2.5 pt-2">
            <a
              href={`https://wa.me/${(siteSettings?.whatsappNumber || "01922730343").replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-white hover:bg-emerald-600 transition-colors shadow-sm"
              title="WhatsApp: 01922-730343"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-white hover:bg-blue-600 transition-colors shadow-sm"
              title="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-white hover:bg-red-600 transition-colors shadow-sm"
              title="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-white hover:bg-rose-600 transition-colors shadow-sm"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. App Store Badges & Bottom Copyright Bar */}
      <div className="border-t border-slate-100 bg-slate-50 py-5 px-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">Experience The Solutions BD App on your mobile:</span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-white text-slate-800 font-mono text-[10px] border border-slate-200 shadow-sm font-semibold">
                Google Play
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-white text-slate-800 font-mono text-[10px] border border-slate-200 shadow-sm font-semibold">
                App Store
              </span>
            </div>
          </div>

          <div className="text-center md:text-right text-slate-500">
            <span>© 2026 The Solutions BD Ltd | All rights reserved. </span>
            <span className="text-slate-700 font-medium">Powered By: The Solutions BD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

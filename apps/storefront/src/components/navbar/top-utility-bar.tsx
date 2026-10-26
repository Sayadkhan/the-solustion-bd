"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Cpu, GitCompare, Truck, Clock } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { useCompareStore } from "@/stores/compare-store";

export function TopUtilityBar() {
  const compareCount = useCompareStore((s) => s.items.length);
  const [dhakaTime, setDhakaTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDhakaTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 text-slate-300 text-xs border-b border-slate-800/80 transition-colors">
      <div className="container mx-auto px-4 h-9 flex items-center justify-between">
        {/* Left: Hotline & Dhaka Time */}
        <div className="flex items-center space-x-5">
          <a
            href="tel:+8801700000000"
            className="flex items-center space-x-1.5 hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium text-slate-200">+880 1700-000000</span>
            <span className="text-slate-500 hidden sm:inline">(10 AM - 8 PM)</span>
          </a>

          <div className="hidden md:flex items-center space-x-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dhaka Time:</span>
            <span className="font-mono text-slate-200">{dhakaTime || "Loading..."}</span>
          </div>
        </div>

        {/* Right: Quick Links, PC Builder CTA, Compare, Theme Toggle */}
        <div className="flex items-center space-x-4">
          <Link
            href="/track-order"
            className="hidden sm:flex items-center space-x-1 text-slate-300 hover:text-white transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Track Order</span>
          </Link>

          <Link
            href="/compare"
            className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors relative"
          >
            <GitCompare className="w-3.5 h-3.5 text-purple-400" />
            <span>Compare</span>
            {compareCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {compareCount}
              </span>
            )}
          </Link>

          <Link
            href="/pc-builder"
            className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-2.5 py-1 rounded text-[11px] shadow-sm transition-all"
          >
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span>PC Builder</span>
          </Link>

          <div className="h-4 w-px bg-slate-700" />

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Zap, Cpu, GitCompare, User } from "lucide-react";
import { useCompareStore } from "@/stores/compare-store";

export function MobileBottomNav() {
  const pathname = usePathname();
  const compareCount = useCompareStore((s) => s.items.length);

  // Hide the global bottom nav on product detail pages so the dedicated sticky buy bar has full focus
  const isProductDetailPage =
    pathname.startsWith("/products/") &&
    pathname !== "/products" &&
    !pathname.includes("category");

  if (isProductDetailPage) {
    return null;
  }

  const navItems = [
    {
      label: "Offers",
      href: "/products?deals=true",
      icon: Gift,
      isActive: pathname.includes("deals=true"),
    },
    {
      label: "Super Hour",
      href: "/products?discount=true",
      icon: Zap,
      isActive: pathname.includes("discount=true"),
    },
    {
      label: "PC Builder",
      href: "/pc-builder",
      icon: Cpu,
      isSpecial: true,
      isActive: pathname === "/pc-builder",
    },
    {
      label: `Compare (${compareCount})`,
      href: "/compare",
      icon: GitCompare,
      isActive: pathname === "/compare",
    },
    {
      label: "Account",
      href: "/cart",
      icon: User,
      isActive: pathname === "/cart",
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white text-slate-700 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-1 py-1"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded transition-colors relative min-w-[62px] ${
                item.isActive
                  ? "text-blue-600 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight whitespace-nowrap font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, GitCompare, Home, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCompareStore } from "@/stores/compare-store";

export function MobileBottomNav() {
  const pathname = usePathname();
  const compareCount = useCompareStore((s) => s.items.length);
  const cartCount = useCartStore((s) => s.getItemCount());

  // Product pages have their own sticky buy bar in this position.
  if (pathname.startsWith("/products/")) return null;

  const navItems = [
    { label: "Home", href: "/", icon: Home, count: 0 },
    { label: "PC Builder", href: "/pc-builder", icon: Cpu, count: 0 },
    { label: "Compare", href: "/compare", icon: GitCompare, count: compareCount },
    { label: "Cart", href: "/cart", icon: ShoppingCart, count: cartCount },
  ];

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)] print:hidden"
    >
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {navItems.map(({ label, href, icon: Icon, count }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
